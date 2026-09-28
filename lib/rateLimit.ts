import type { NextRequest } from "next/server";

// ─── Upstash Redis (production) ───────────────────────────────────────────────
// Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in your environment to
// enable distributed rate limiting that survives horizontal scaling and cold starts.
//
// Without those env vars the module falls back to an in-memory store, which is
// fine for local dev and single-instance deploys but will not share state across
// Vercel serverless function instances in production.

type UpstashRatelimit = InstanceType<typeof import("@upstash/ratelimit").Ratelimit>;

let redisClient: InstanceType<typeof import("@upstash/redis").Redis> | null | undefined;
// Limiters are scoped per (key, max, window) combo — different routes get
// independent buckets instead of sharing one IP-keyed counter.
const upstashLimiters = new Map<string, UpstashRatelimit>();

function getRedisClient() {
  if (redisClient !== undefined) return redisClient;
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = null;
    return redisClient;
  }
  try {
    // Dynamic require at call time so the module loads fine without the
    // Upstash env vars — this branch never runs in that case.
    const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis");
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch {
    console.warn("[rateLimit] Failed to initialise Upstash, falling back to in-memory store");
    redisClient = null;
  }
  return redisClient;
}

function getUpstashLimiter(routeKey: string, max: number, windowMs: number): UpstashRatelimit | null {
  const redis = getRedisClient();
  if (!redis) return null;

  const cacheKey = `${routeKey}:${max}:${windowMs}`;
  const cached = upstashLimiters.get(cacheKey);
  if (cached) return cached;

  const { Ratelimit } = require("@upstash/ratelimit") as typeof import("@upstash/ratelimit");
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(max, `${Math.round(windowMs / 1000)} s`),
    analytics: false,
    prefix: `cfo:rl:${routeKey}`,
  });
  upstashLimiters.set(cacheKey, limiter);
  return limiter;
}

// ─── In-memory fallback ───────────────────────────────────────────────────────

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();
const DEFAULT_WINDOW_MS = 60 * 60 * 1_000; // 1 hour
const DEFAULT_MAX_REQUESTS = 5;

// Prevent unbounded memory growth on long-lived processes
setInterval(
  () => {
    const now = Date.now();
    store.forEach((entry, key) => {
      if (entry.resetAt < now) store.delete(key);
    });
  },
  5 * 60 * 1_000 // sweep every 5 min
);

function inMemoryCheck(
  storeKey: string,
  max: number,
  windowMs: number
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = store.get(storeKey);

  if (!entry || entry.resetAt < now) {
    store.set(storeKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= max) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1_000) };
  }

  entry.count += 1;
  return { allowed: true };
}

// ─── Public API ───────────────────────────────────────────────────────────────

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function checkRateLimit(
  req: NextRequest,
  options?: { window?: number; max?: number; key?: string; identifier?: string }
): Promise<{ allowed: boolean; retryAfter?: number }> {
  // Token-scoped routes pass an identifier (the engagement id) so callers
  // behind a shared NAT don't consume each other's budget.
  const ip = options?.identifier ?? getIp(req);
  const routeKey = options?.key ?? "default";
  const max = options?.max ?? DEFAULT_MAX_REQUESTS;
  const windowMs = options?.window ?? DEFAULT_WINDOW_MS;

  const limiter = getUpstashLimiter(routeKey, max, windowMs);
  if (limiter) {
    const { success, reset } = await limiter.limit(ip);
    return {
      allowed: success,
      retryAfter: success ? undefined : Math.ceil((reset - Date.now()) / 1_000),
    };
  }

  return inMemoryCheck(`${routeKey}:${ip}`, max, windowMs);
}
