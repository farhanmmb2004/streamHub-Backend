import { Worker } from "bullmq";
import connect from "../Db/index.js";
import redisClient from "../utils/redisClient.js";
import { getSubscriberIds } from "../utils/neo4jClient.js";
import { cacheVideoRecord } from "../utils/videoCache.js";
import { Vidio } from "../models/vidio.model.js";
import { FANOUT_QUEUE_NAME } from "./fanoutQueue.js";

// Channels with more subscribers than this are not fanned-out on write;
// getFeed merges their recent uploads in at read time instead.
const CELEBRITY_THRESHOLD = 10000;
const MAX_FEED_SIZE = 500;

const fanoutToSubscribers = async (subscriberIds, videoId, score) => {
    const pipeline = redisClient.pipeline();
    for (const subscriberId of subscriberIds) {
        const key = `feed:${subscriberId}`;
        pipeline.zadd(key, score, String(videoId));
        pipeline.zremrangebyrank(key, 0, -(MAX_FEED_SIZE + 1));
    }
    await pipeline.exec();
};

const fanoutVideo = async ({ videoId, ownerId }) => {
    const video = await Vidio.findById(videoId).populate("owner", "username avtar").lean();
    if (!video) {
        console.warn(`fanout: video ${videoId} not found, skipping`);
        return;
    }

    await cacheVideoRecord(video);
    const score = new Date(video.createdAt).getTime();
    const subscriberIds = await getSubscriberIds(ownerId);

    if (subscriberIds.length <= CELEBRITY_THRESHOLD) {
        await fanoutToSubscribers(subscriberIds, videoId, score);
    } else {
        const key = `channelRecent:${ownerId}`;
        await redisClient.zadd(key, score, String(videoId));
        await redisClient.zremrangebyrank(key, 0, -(MAX_FEED_SIZE + 1));
    }

    console.log(`fanout: video ${videoId} pushed to ${subscriberIds.length} subscribers`);
};

await connect();

const worker = new Worker(
    FANOUT_QUEUE_NAME,
    (job) => fanoutVideo(job.data),
    { connection: redisClient, concurrency: 5 }
);

worker.on("completed", (job) => console.log(`fanout job ${job.id} completed`));
worker.on("failed", (job, err) => console.error(`fanout job ${job?.id} failed`, err));

console.log("Fanout worker started, waiting for jobs...");
