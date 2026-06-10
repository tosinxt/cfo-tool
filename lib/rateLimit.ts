import type { NextRequest } from "next/server";

// ─── Upstash Redis (production) ───────────────────────────────────────────────
// Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in your environment to
// enable distributed rate limiting that survives horizontal scaling and cold starts.
//
// Without those env vars the module falls back to an in-memory store, which is
// fine for local dev and single-instance deploys but will not share state across
// Vercel serverless function instances in production.

let upstashLimiter: ReturnType<typeof buildUpstashLimiter> | null = null;

function buildUpstashLimiter() {
  // Dynamic import at call time so the module can be imported without the
  // Upstash env vars — the fallback branch never references these symbols.
  const { Ratelimit } = require("@upstash/ratelimit") as typeof import("@upstash/ratelimit");
  const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis");

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 h"),
    analytics: false,
    prefix: "cfo:rl",
  });
}

function getUpstashLimiter() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  if (!upstashLimiter) {
    try {
      upstashLimiter = buildUpstashLimiter();
    } catch {
      console.warn("[rateLimit] Failed to initialise Upstash, falling back to in-memory store");
    }
  }
  return upstashLimiter;
}

// ─── In-memory fallback ───────────────────────────────────────────────────────

interface Entry {
  count: number;
  resetAt: number;
}

const store = new Map<string, Entry>();
const WINDOW_MS = 60 * 60 * 1_000; // 1 hour
const MAX_REQUESTS = 5;

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
  ip: string,
  options?: { window?: number; max?: number }
): { allowed: boolean; retryAfter?: number } {
  const window = options?.window ?? WINDOW_MS;
  const max = options?.max ?? MAX_REQUESTS;
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || entry.resetAt < now) {
    store.set(ip, { count: 1, resetAt: now + window });
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
  options?: { window?: number; max?: number }
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const ip = getIp(req);
  const limiter = getUpstashLimiter();

  if (limiter) {
    const { success, reset } = await limiter.limit(ip);
    return {
      allowed: success,
      retryAfter: success ? undefined : Math.ceil((reset - Date.now()) / 1_000),
    };
  }

  return inMemoryCheck(ip, options);
}
