import { Redis } from "ioredis";

/**
 * Redis client for caching
 *
 * Environment variables:
 * - REDIS_URL (e.g., redis://localhost:6379)
 *
 * Usage:
 * import { redis, cache } from "@/lib/redis";
 *
 * const data = await cache.get("key");
 * await cache.set("key", value, 3600); // TTL in seconds
 * await cache.del("key");
 */

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

// Create Redis client
export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  // Graceful degradation in dev if Redis is not available
  lazyConnect: true,
});

// Handle connection errors gracefully
redis.on("error", (err) => {
  console.error("Redis connection error:", err);
});

redis.on("connect", () => {
  console.log("✅ Redis connected successfully");
});

// Attempt to connect
redis.connect().catch((err) => {
  console.warn("⚠️  Redis not available. Caching disabled:", err.message);
});

/**
 * Cache utility functions
 */
export const cache = {
  /**
   * Get cached value
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (err) {
      console.error("Cache GET error:", err);
      return null;
    }
  },

  /**
   * Set cache value with optional TTL (in seconds)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redis.setex(key, ttl, serialized);
      } else {
        await redis.set(key, serialized);
      }
    } catch (err) {
      console.error("Cache SET error:", err);
    }
  },

  /**
   * Delete cache key(s)
   */
  async del(...keys: string[]): Promise<void> {
    try {
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err) {
      console.error("Cache DEL error:", err);
    }
  },

  /**
   * Delete all keys matching a pattern
   */
  async delPattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err) {
      console.error("Cache DEL pattern error:", err);
    }
  },

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (err) {
      console.error("Cache EXISTS error:", err);
      return false;
    }
  },

  /**
   * Get or set pattern (cache-aside)
   * If key exists, return cached value
   * Otherwise, execute fetcher, cache result, and return
   */
  async getOrSet<T = any>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetcher();
    await this.set(key, fresh, ttl);
    return fresh;
  },
};

/**
 * Cache key patterns for different resources
 * Based on your Prisma schema models
 */
export const cacheKeys = {
  // User caching
  user: (userId: string) => `user:${userId}`,
  userByEmail: (email: string) => `user:email:${email}`,

  // Meeting caching
  meeting: (meetingId: string) => `meeting:${meetingId}`,
  userMeetings: (userId: string) => `meetings:user:${userId}`,
  meetingByInviteCode: (inviteCode: string) => `meeting:invite:${inviteCode}`,
  liveMeetings: () => `meetings:live`,
  scheduledMeetings: () => `meetings:scheduled`,

  // Participant caching
  meetingParticipants: (meetingId: string) =>
    `participants:meeting:${meetingId}`,
  userParticipations: (userId: string) => `participations:user:${userId}`,

  // Chat caching
  meetingChats: (meetingId: string) => `chats:meeting:${meetingId}`,
  recentChats: (meetingId: string, limit: number = 50) =>
    `chats:meeting:${meetingId}:recent:${limit}`,

  // Recording caching
  meetingRecording: (meetingId: string) => `recording:meeting:${meetingId}`,

  // Stats/Aggregates
  userMeetingCount: (userId: string) => `stats:user:${userId}:meetings`,
  meetingParticipantCount: (meetingId: string) =>
    `stats:meeting:${meetingId}:participants`,

  // Patterns for bulk invalidation
  userPattern: (userId: string) => `*user:${userId}*`,
  meetingPattern: (meetingId: string) => `*meeting:${meetingId}*`,
  allMeetingsPattern: () => `meetings:*`,
};

export default redis;
