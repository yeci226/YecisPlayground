import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv(); // Automatically reads UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from environment variables

export default redis;
