import { NextRequest } from 'next/server'
import { redis } from '@/lib/redis'

// Fixed-window rate limiter. Uses Redis (INCR + EXPIRE) when available so
// limits hold across instances; falls back to an in-process map otherwise.
const memory = new Map<string, { count: number; resetAt: number }>()

export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ ok: boolean; remaining: number }> {
  const bucket = `rl:${key}:${Math.floor(Date.now() / (windowSeconds * 1000))}`
  if (redis) {
    try {
      const count = await redis.incr(bucket)
      if (count === 1) await redis.expire(bucket, windowSeconds)
      return { ok: count <= limit, remaining: Math.max(0, limit - count) }
    } catch {
      // Redis down — fall through to memory so we still throttle per-instance.
    }
  }
  const now = Date.now()
  const row = memory.get(bucket)
  if (!row || row.resetAt < now) {
    // Opportunistic sweep so the map doesn't grow unbounded.
    if (memory.size > 5000) memory.forEach((v, k) => { if (v.resetAt < now) memory.delete(k) })
    memory.set(bucket, { count: 1, resetAt: now + windowSeconds * 1000 })
    return { ok: limit >= 1, remaining: limit - 1 }
  }
  row.count += 1
  return { ok: row.count <= limit, remaining: Math.max(0, limit - row.count) }
}

export function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}
