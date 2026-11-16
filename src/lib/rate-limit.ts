/**
 * Small in-memory rate limiter keyed by client IP.
 * Per-instance only (not shared between serverless instances), so it is a
 * guard against casual abuse of the public endpoints, not a hard quota.
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function rateLimit(
  request: Request,
  scope: string,
  limit: number,
  windowMs = 60 * 60 * 1000
): { ok: true } | { ok: false; retryAfterSeconds: number } {
  const now = Date.now();
  const key = `${scope}:${clientIp(request)}`;

  if (buckets.size > 5000) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true };
}
