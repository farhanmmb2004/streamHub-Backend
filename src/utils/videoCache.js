import redisClient from "./redisClient.js";

export const videoCacheKey = (videoId) => `video:${videoId}`;

const ownerDetailsOf = (owner) => {
    if (!owner || !owner.username) return {};
    return { _id: owner._id.toString(), username: owner.username, avtar: owner.avtar };
};

// video must be a lean Vidio doc with `owner` populated as {_id, username, avtar}
export const cacheVideoRecord = async (video) => {
    const record = {
        _id: video._id.toString(),
        vidioFile: video.vidioFile,
        thumbnail: video.thumbnail,
        title: video.title,
        description: video.description,
        duration: String(video.duration),
        views: String(video.views ?? 0),
        isPublished: String(!!video.isPublished),
        owner: (video.owner?._id ?? video.owner).toString(),
        createdAt: new Date(video.createdAt).toISOString(),
        updatedAt: new Date(video.updatedAt).toISOString(),
        ownerDetails: JSON.stringify(ownerDetailsOf(video.owner))
    };
    await redisClient.hset(videoCacheKey(video._id), record);
    return formatVideoRecord(record);
};

// record is the raw string-valued hash as returned by HGETALL
export const formatVideoRecord = (record) => ({
    _id: record._id,
    vidioFile: record.vidioFile,
    thumbnail: record.thumbnail,
    title: record.title,
    description: record.description,
    duration: Number(record.duration),
    views: Number(record.views),
    isPublished: record.isPublished === "true",
    owner: record.owner,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    ownerDetails: record.ownerDetails ? JSON.parse(record.ownerDetails) : null
});
