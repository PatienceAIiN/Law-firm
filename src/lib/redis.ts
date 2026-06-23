import { Redis } from 'ioredis'

const globalForRedis = global as unknown as { redis: Redis | undefined }

// Initialize Redis only if the environment variable is provided.
// In development, we use a global variable to preserve the connection across HMR.
export const redis =
  globalForRedis.redis ||
  (process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        retryStrategy(times) {
          return Math.min(times * 50, 2000)
        },
      })
    : undefined)

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
    const cached = await redis.get(key)
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
