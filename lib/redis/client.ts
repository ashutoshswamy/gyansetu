import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const CACHE_KEYS = {
  dashboardStats: "dashboard:stats",
  activeTours: "tours:active",
  activeForms: "forms:active",
  rankings: (tourId: string) => `rankings:${tourId}`,
} as const;

export const CACHE_TTL = {
  short: 60,
  medium: 300,
  long: 3600,
} as const;

export async function getCached<T>(key: string): Promise<T | null> {
  return redis.get<T>(key);
}

export async function setCached<T>(
  key: string,
  value: T,
  ttl = CACHE_TTL.medium
): Promise<void> {
  await redis.setex(key, ttl, value);
}

export async function invalidateCache(key: string): Promise<void> {
  await redis.del(key);
}
