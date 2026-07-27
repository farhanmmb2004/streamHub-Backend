import { Queue } from "bullmq";
import redisClient from "../utils/redisClient.js";

export const FANOUT_QUEUE_NAME = "video-fanout";

export const fanoutQueue = new Queue(FANOUT_QUEUE_NAME, {
    connection: redisClient,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: 1000,
        removeOnFail: 1000
    }
});
