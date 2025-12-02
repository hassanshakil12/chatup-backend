import redis from "ioredis";

const redisClient = new redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password:
    process.env.NODE_ENV !== "development" ? process.env.REDIS_PASSWORD : null,
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  },
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  db: 0,
});

redisClient.on("connect", () => {
  console.log("Redis client connected");
});

redisClient.on("reconnecting", () => {
  console.log("Redis reconnecting...");
});

redisClient.on("ready", () => {
  console.log("Redis client ready");
});

redisClient.on("close", () => {
  console.log("Redis connection closed!!!");
});

redisClient.on("error", (err) => {
  console.error("REDIS ERROR:", err);
});

export default redisClient;
