/**
 * In-memory rate limiter, keyed by an arbitrary string (typically client IP).
 *
 * Honest limitation: this state lives in the Node process's memory. It
 * resets on server restart and does NOT share state across multiple server
 * instances (e.g. serverless functions that spin up fresh, or horizontally
 * scaled deployments behind a load balancer). For a single long-running
 * Node process — which is how `next start` / most VPS deployments of this
 * app will run — this works correctly. If you deploy behind something that
 * runs many parallel instances (e.g. Vercel's default serverless model),
 * swap this for a shared store (Redis/Upstash) so all instances see the
 * same counters.
 */

interface WindowEntry {
  count: number;
  windowStartMs: number;
}

const buckets = new Map<string, WindowEntry>();

// Periodically sweep old entries so the map doesn't grow unbounded under
// sustained traffic from many distinct IPs.
const SWEEP_INTERVAL_MS = 5 * 60_000;
let lastSweep = Date.now();

function sweepIfDue(windowMs: number) {
  const now = Date.now();
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, entry] of buckets) {
    if (now - entry.windowStartMs > windowMs) {
      buckets.delete(key);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until the caller should retry, only meaningful when !allowed. */
  retryAfterSeconds: number;
}

/**
 * Fixed-window rate limit check. Returns whether the request is allowed and
 * how many requests remain in the current window.
 */
export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number }
): RateLimitResult {
  sweepIfDue(windowMs);

  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now - existing.windowStartMs >= windowMs) {
    buckets.set(key, { count: 1, windowStartMs: now });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    const retryAfterSeconds = Math.ceil((existing.windowStartMs + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, retryAfterSeconds: 0 };
}

/**
 * Best-effort extraction of the client IP from standard proxy headers.
 * Falls back to a constant when nothing is present (e.g. direct local
 * requests in dev), which effectively pools all such requests into one
 * bucket — acceptable for local development, not meaningful as a security
 * boundary in that case.
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    // May be a comma-separated list (client, proxy1, proxy2, ...); the
    // first entry is the original client as set by the nearest trusted proxy.
    return forwardedFor.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
