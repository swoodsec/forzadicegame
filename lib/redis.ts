import { Redis } from "@upstash/redis";

// Simple in-memory fallback for local development when Redis is not configured
const localStore = new Map<string, unknown>();
const localExpiry = new Map<string, number>();

function isExpired(key: string): boolean {
  const exp = localExpiry.get(key);
  if (exp === undefined) return false;
  if (Date.now() > exp) {
    localStore.delete(key);
    localExpiry.delete(key);
    return true;
  }
  return false;
}

const localRedis = {
  get: async <T>(key: string): Promise<T | null> => {
    if (isExpired(key)) return null;
    return (localStore.get(key) as T) ?? null;
  },
  set: async (key: string, value: unknown): Promise<void> => {
    localStore.set(key, value);
  },
  incr: async (key: string): Promise<number> => {
    if (isExpired(key)) localStore.set(key, 0);
    const current = ((localStore.get(key) as number) ?? 0) + 1;
    localStore.set(key, current);
    return current;
  },
  expire: async (key: string, seconds: number): Promise<void> => {
    localExpiry.set(key, Date.now() + seconds * 1000);
  },
  del: async (key: string): Promise<void> => {
    localStore.delete(key);
    localExpiry.delete(key);
  },
};

let redis: Redis | typeof localRedis;

export function getRedis(): Redis | typeof localRedis {
  if (!redis) {
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
      redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    } else {
      if (process.env.NODE_ENV === "production") {
        throw new Error("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in production");
      }
      redis = localRedis as unknown as typeof localRedis;
    }
  }
  return redis;
}
