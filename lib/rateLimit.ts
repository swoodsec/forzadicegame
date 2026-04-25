import { getRedis } from "./redis";

const MAX_ATTEMPTS = 5;
const WINDOW_SECONDS = 900; // 15 minutes

export async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
  const redis = getRedis();
  const key = `rate:auth:${ip}`;

  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, WINDOW_SECONDS);
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - current);
  return { allowed: current <= MAX_ATTEMPTS, remaining };
}

export async function clearRateLimit(ip: string): Promise<void> {
  const redis = getRedis();
  await redis.del(`rate:auth:${ip}`);
}
