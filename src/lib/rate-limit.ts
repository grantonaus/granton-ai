/**
 * Simple in-memory sliding-window rate limiter for API routes (Node runtime).
 * For multi-instance production deployments, replace with Redis/Upstash.
 */

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

export function rateLimit(
  key: string,
  max: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  let b = store.get(key);
  if (!b || now >= b.resetAt) {
    b = { count: 1, resetAt: now + windowMs };
    store.set(key, b);
    return { ok: true };
  }
  if (b.count < max) {
    b.count += 1;
    return { ok: true };
  }
  const retryAfterSec = Math.ceil((b.resetAt - now) / 1000);
  return { ok: false, retryAfterSec: Math.max(1, retryAfterSec) };
}
