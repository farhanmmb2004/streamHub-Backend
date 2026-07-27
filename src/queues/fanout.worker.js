import { Worker } from "bullmq";
import connect from "../Db/index.js";
import redisClient from "../utils/redisClient.js";
import { getSubscriberIds } from "../utils/neo4jClient.js";
import { Vidio } from "../models/vidio.model.js";
import { FANOUT_QUEUE_NAME } from "./fanoutQueue.js";

// Channels with more subscribers than this are not fanned-out on write;
// getFeed merges their recent uploads in at read time instead.
const CELEBRITY_THRESHOLD = 10000;
const MAX_FEED_SIZE = 500;

const cacheVideo = async (video) => {
    await redisClient.hset(`video:${video._id}`, {
        _id: String(video._id),
        title: video.title,
        thumbnail: video.thumbnail,
        vidioFile: video.vidioFile,
        duration: String(video.duration),
        owner: String(video.owner),
        createdAt: String(video.createdAt.getTime())
    });
};

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
    const video = await Vidio.findById(videoId).lean();
    if (!video) {
        console.warn(`fanout: video ${videoId} not found, skipping`);
        return;
    }

    await cacheVideo(video);
    const score = video.createdAt.getTime();
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
