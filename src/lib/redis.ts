import { Redis } from 'ioredis'

const globalForRedis = global as unknown as { redis: Redis | undefined }

// Extract a usable redis:// URL from REDIS_URL. Operators sometimes paste the
// whole `redis-cli -u redis://…` connect line; pull just the URL out so the
// app keeps running instead of throwing `Invalid URL` on every request.
function sanitizeRedisUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim()
  if (!trimmed) return undefined
  const match = trimmed.match(/rediss?:\/\/\S+/i)
  const candidate = match ? match[0] : trimmed
  try {
    new URL(candidate)
    return candidate
  } catch {
    console.warn('[redis] REDIS_URL is not a valid URL; disabling cache.')
    return undefined
  }
}

const REDIS_URL = sanitizeRedisUrl(process.env.REDIS_URL)

// Initialize Redis only if the environment variable is provided.
// In development, we use a global variable to preserve the connection across HMR.
export const redis =
  globalForRedis.redis ||
  (REDIS_URL
    ? new Redis(REDIS_URL, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        retryStrategy(times) {
          return Math.min(times * 50, 2000)
        },
      })
    : undefined)

if (redis) {
  redis.on('error', (err) => {
    if (process.env.NODE_ENV !== 'production') console.warn('[redis] error:', err.message)
  })
}

if (process.env.NODE_ENV !== 'production' && redis) {
  globalForRedis.redis = redis
}

/**
 * Cache wrapper to easily fetch from Redis, and fallback to DB query if missing.
 */
export async function fetchWithCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<T> {
  if (!redis) {
    return fetchFn() // Fallback to DB if Redis is not configured
  }

  try {
    // Hard timeout — a stalled Redis must never hold up a server-rendered
    // page. If the cache read takes >800ms, fall through to the DB.
    const cached = await Promise.race<string | null>([
      redis.get(key) as Promise<string | null>,
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 800)),
    ])
    if (cached) {
      return JSON.parse(cached) as T
    }
  } catch (error) {
    console.error(`Redis get error for key ${key}:`, error)
  }

  const freshData = await fetchFn()

  try {
    if (freshData !== undefined && freshData !== null) {
      await redis.setex(key, ttlSeconds, JSON.stringify(freshData))
    }
  } catch (error) {
    console.error(`Redis set error for key ${key}:`, error)
  }

  return freshData
}

/**
 * Invalidate a specific cache key.
 */
export async function invalidateCache(key: string) {
  if (redis) {
    try {
      await redis.del(key)
    } catch (error) {
      console.error(`Redis delete error for key ${key}:`, error)
    }
  }
}

/**
 * Invalidate multiple keys by pattern.
 */
export async function invalidateCachePattern(pattern: string) {
  if (!redis) return

  try {
    const stream = redis.scanStream({ match: pattern, count: 100 })
    stream.on('data', async (keys: string[]) => {
      if (keys.length) {
        const pipeline = redis.pipeline()
        keys.forEach((key) => pipeline.del(key))
        await pipeline.exec()
      }
    })
  } catch (error) {
    console.error(`Redis pattern delete error for ${pattern}:`, error)
  }
}
