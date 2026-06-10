# Security Review — CFO Next.js Project

_Reviewed: 2026-06-07_

---

## CRITICAL

### 1. Unauthenticated File Generation Endpoints

**Files:**
- `src/app/api/files/generate-pdf/route.ts`
- `src/app/api/files/generate-pptx/route.ts`

**Issue:** Both POST handlers accept a `{ engagementId }` body and perform full Firestore reads, file generation, and Storage writes without any authentication or authorization check. Any unauthenticated external caller can trigger generation for any valid engagement ID.

**Fix:** Apply the same dual-auth guard used in `generate-draft`:
```ts
const internalSecret = req.headers.get("x-internal-secret");
const isInternal = internalSecret && process.env.CRON_SECRET && internalSecret === process.env.CRON_SECRET;
if (!isInternal) {
  try { await verifyAdminForApi(req.headers.get("cookie")); }
  catch { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }
}
```

---

## HIGH

### 2. Middleware Only Checks Cookie Presence, Not Validity

**File:** `src/middleware.ts`

**Issue:** The middleware protecting all `/admin/*` routes checks only whether the `__session` cookie exists (`if (!session)`). It does not verify the cookie's cryptographic signature or expiry. An expired, revoked, or forged cookie value will pass middleware.

**Fix:** Perform at minimum a structural JWT check in middleware (decode and check `exp`), or switch the middleware matcher to the Node.js runtime and perform a full `adminAuth.verifySessionCookie` call there.

---

### 3. `CRON_SECRET` Empty-String Bypass + Plaintext Risk

**File:** `src/app/api/intake/submit/route.ts` (lines 123–131)

**Issue:** If `CRON_SECRET` is unset, the fallback `""` is sent as the header value. On the receiving side, `"" === ""` evaluates `true`, granting full unauthenticated internal access. Additionally, if `NEXT_PUBLIC_APP_URL` is ever `http://`, the secret is transmitted in plaintext.

**Fix:**
1. Require `CRON_SECRET` in `instrumentation.ts` startup env check.
2. On the receiving side, add an explicit guard:
```ts
if (!process.env.CRON_SECRET) throw new Error("CRON_SECRET not configured");
```
3. Ensure `NEXT_PUBLIC_APP_URL` always uses `https://` in deployed environments.

---

### 4. No Rate Limiting on AI / File Generation Routes

**Files:**
- `src/app/api/files/generate-pdf/route.ts`
- `src/app/api/files/generate-pptx/route.ts`
- `src/app/api/ai/generate-draft/route.ts`

**Issue:** `checkRateLimit` is only called in `/api/intake/submit`. The AI draft generation route (which calls Anthropic with `maxDuration: 120`) and both file generation routes have no rate limiting. Combined with finding #1, an attacker can trigger unbounded Anthropic API calls and Firebase Storage writes.

**Fix:** Add `checkRateLimit` to `generate-draft` and the file generation routes, or restrict them entirely via the `CRON_SECRET` / admin-only pattern.

---

### 5. In-Memory Rate Limiter Is Ineffective in Serverless Deployments

**File:** `lib/rateLimit.ts`

**Issue:** The fallback in-memory rate limit store (a `Map`) is a module-level singleton. On Vercel, each cold-started function instance has its own isolated memory. Without Upstash configured, the rate limiter provides zero cross-instance protection.

**Fix:** Treat the Upstash limiter as required for production. Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to the required env list in `instrumentation.ts` when `DEMO_MODE` is false.

---

## MEDIUM

### 6. `x-forwarded-for` Is Spoofable for Rate Limit Bypass

**File:** `lib/rateLimit.ts`

**Issue:** The `getIp` function uses `x-forwarded-for` without validation. A client can trivially spoof this header to bypass rate limiting by cycling through fake IPs.

**Fix:** On Vercel, use `req.ip` or `x-vercel-forwarded-for` (set by the edge network and cannot be spoofed by clients). Do not trust the raw `x-forwarded-for` as a security boundary.

---

### 7. `widenClientFileUpload: true` in Sentry Config May Expose Source Maps

**File:** `next.config.mjs`

**Issue:** `widenClientFileUpload: true` causes the Sentry webpack plugin to upload a larger set of JavaScript source maps. If the Sentry project is set to public, uploaded source maps (including original TypeScript source) can be viewed via Sentry's artifact browser.

**Fix:** Verify the Sentry project is not publicly accessible. Consider setting `widenClientFileUpload: false` unless rich stack traces from third-party libraries are needed.

---

## LOW

### 8. No Guard Against `DEMO_MODE=true` in Production

**Files:**
- `lib/demo.ts`
- `lib/auth/verifyAdmin.ts`

**Issue:** When `DEMO_MODE=true`, `verifyAdmin()` and `verifyAdminForApi()` immediately return a hardcoded `DEMO_ACTOR` without any credential check. There is no runtime assertion preventing demo mode from being enabled in a production build.

**Fix:** Add a startup check in `instrumentation.ts`:
```ts
if (process.env.DEMO_MODE === "true" && process.env.NODE_ENV === "production") {
  throw new Error("DEMO_MODE must not be enabled in production");
}
```

---

## Summary

| # | Severity | Issue | File(s) |
|---|----------|-------|---------|
| 1 | Critical | Unauthenticated file generation endpoints | `src/app/api/files/generate-pdf/route.ts`, `generate-pptx/route.ts` |
| 2 | High | Middleware only checks cookie presence, not validity | `src/middleware.ts` |
| 3 | High | `CRON_SECRET` empty-string bypass + plaintext risk | `src/app/api/intake/submit/route.ts` |
| 4 | High | No rate limiting on AI/file generation routes | `generate-draft`, `generate-pdf`, `generate-pptx` |
| 5 | High | In-memory rate limiter ineffective in serverless | `lib/rateLimit.ts` |
| 6 | Medium | `x-forwarded-for` spoofable for rate limit bypass | `lib/rateLimit.ts` |
| 7 | Medium | `widenClientFileUpload` source map exposure risk | `next.config.mjs` |
| 8 | Low | No guard against `DEMO_MODE=true` in production | `lib/demo.ts`, `lib/auth/verifyAdmin.ts` |

---

## What's Good

- No hardcoded secrets found in source files
- `.env.example` is clean with placeholder values only
- Firestore security rules have a proper deny-all default
- Stripe webhook correctly uses `constructEvent` for signature verification
- Intake token comparison correctly uses `timingSafeEqual`
