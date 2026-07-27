import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import redisClient from "../utils/redisClient.js"
import { Vidio } from "../models/vidio.model.js"
import { Subscription } from "../models/subscription.model.js"

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const CELEBRITY_MERGE_COUNT = 10; // recent uploads pulled per non-fanned-out channel

const hydrateVideos = async (videoIds) => {
    if (!videoIds.length) return [];

    const cachePipeline = redisClient.pipeline();
    videoIds.forEach((id) => cachePipeline.hgetall(`video:${id}`));
    const cached = await cachePipeline.exec();

    const videos = [];
    const missedIds = [];
    cached.forEach(([err, data], index) => {
        if (!err && data && Object.keys(data).length) {
            videos.push(data);
        } else {
            missedIds.push(videoIds[index]);
        }
    });

    if (missedIds.length) {
        const fresh = await Vidio.find({ _id: { $in: missedIds }, isPublished: true }).lean();
        const refillPipeline = redisClient.pipeline();
        fresh.forEach((video) => {
            const record = {
                _id: video._id.toString(),
                title: video.title,
                thumbnail: video.thumbnail,
                vidioFile: video.vidioFile,
                duration: String(video.duration),
                owner: video.owner.toString(),
                createdAt: String(video.createdAt.getTime())
            };
            refillPipeline.hset(`video:${video._id}`, record);
            videos.push(record);
        });
        await refillPipeline.exec();
    }

    videos.sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
    return videos;
};

export const getFeed = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if(!userId){
        return res.status(400).json(new ApiResponse(400, null, "User ID is required"));
    }

    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const start = (page - 1) * limit;
    const stop = start + limit - 1;

    // Fanned-out-on-write feed: videos already pushed into this user's cache.
    const fannedOutIds = await redisClient.zrevrange(`feed:${userId}`, start, stop);

    // Channels this user follows that were too large to fan out on write get
    // merged in at read time instead (fan-out-on-read for celebrity accounts).
    const subscriptions = await Subscription.find({ subscriber: userId }).select("channel").lean();
    const channelIds = subscriptions.map((sub) => sub.channel.toString());

    let celebrityIds = [];
    if (channelIds.length) {
        const pipeline = redisClient.pipeline();
        channelIds.forEach((id) => pipeline.zrevrange(`channelRecent:${id}`, 0, CELEBRITY_MERGE_COUNT - 1));
        const results = await pipeline.exec();
        celebrityIds = results.flatMap(([err, ids]) => (err ? [] : ids));
    }

    const allIds = [...new Set([...fannedOutIds, ...celebrityIds])];
    const videos = await hydrateVideos(allIds);

    return res.status(200).json(new ApiResponse(200, { videos, page, limit }, "Feed fetched successfully"));
});
