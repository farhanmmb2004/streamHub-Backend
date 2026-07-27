import Redis from "ioredis";

const redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null
});

redisClient.on("connect", () => console.log("Redis connected"));
redisClient.on("error", (error) => console.error("Redis connection error", error));

export default redisClient;
