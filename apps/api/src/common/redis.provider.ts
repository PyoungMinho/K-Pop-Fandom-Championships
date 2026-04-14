import { FactoryProvider } from "@nestjs/common";
import Redis from "ioredis";

export const REDIS_CLIENT = "REDIS_CLIENT";

export const redisProvider: FactoryProvider<Redis> = {
  provide: REDIS_CLIENT,
  useFactory: () => {
    const redisUrl = process.env.REDIS_URL;
    const client = redisUrl
      ? new Redis(redisUrl, { maxRetriesPerRequest: 3, lazyConnect: true })
      : new Redis({
          host: process.env.REDIS_HOST || "localhost",
          port: Number(process.env.REDIS_PORT) || 6379,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
        });

    client.connect().catch(() => {
      console.warn("[RedisProvider] Redis connection failed – falling back to DB-only mode");
    });

    return client;
  },
};
