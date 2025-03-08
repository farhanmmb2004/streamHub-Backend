import {asyncHandler} from "../utils/asyncHandler.js"
import {Vidio} from "../models/vidio.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import { Like} from "../models/like.model.js"
import { Comment } from "../models/comment.model.js"
import { isValidObjectId } from "mongoose"
import { uploadOnCloudinary,removeFromCloudinary } from "../utils/cloudinary.js"
import mongoose  from "mongoose"
// const getAllVideos = asyncHandler(async (req, res) => {
//   const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
//     //TODO: get all videos based on query, sort, pagination
//     //this particular controller is i copied from gpt 
//     const pipeline = [];


//     if (query) {
//         pipeline.push({
//             $search: {
//                 index: "search-videos",
//                 text: {
//                     query: query,
//                     path: ["title", "description"] //search only on title, desc
//                 }
//             }
//         });
//     }

//     if (userId) {
//         if (!isValidObjectId(userId)) {
//             throw new ApiError(400, "Invalid userId");
//         }

//         pipeline.push({
//             $match: {
//                 owner: new mongoose.Types.ObjectId(userId)
//             }
//         });
//     }

//     // fetch videos only that are set isPublished as true
//     pipeline.push({ $match: { isPublished: true } });

//     //sortBy can be views, createdAt, duration
//     //sortType can be ascending(-1) or descending(1)
//     if (sortBy && sortType) {
//         pipeline.push({
//             $sort: {
//                 [sortBy]: sortType === "asc" ? 1 : -1
//             }
//         });
//     } else {
//         pipeline.push({ $sort: { createdAt: -1 } });
//     }

//     pipeline.push(
//         {
//             $lookup: {
//                 from: "users",
//                 localField: "owner",
//                 foreignField: "_id",
//                 as: "ownerDetails",
//                 pipeline: [
//                     {
//                         $project: {
//                             username: 1,
//                             avtar: 1
//                         }
//                     }
//                 ]
//             }
//         },
//         {
//             $unwind: "$ownerDetails"
//         }
//     )

//     const videoAggregate = Vidio.aggregate(pipeline);

//     const options = {
//         page: parseInt(page, 10),
//         limit: parseInt(limit, 10)
//     };

//     const video = await Vidio.aggregatePaginate(videoAggregate, options);

//     return res
//         .status(200)
//         .json(new ApiResponse(200, video, "Videos fetched successfully"));
// })
const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
    
    const pipeline = [];

    // If search query exists, perform a separate search query
    if (query) {
        const searchResults = await Vidio.aggregate([
            {
                $search: {
                    index: "search-videos",
                    text: {
                        query: query,
                        path: ["title", "description"]
                    }
                }
            },
            {
                $project: { _id: 1 } // Only fetch IDs to use in the next pipeline
            }
        ]);

        const videoIds = searchResults.map(video => video._id);

        if (videoIds.length === 0) {
            return res.status(200).json(new ApiResponse(200, [], "No videos found"));
        }

        pipeline.push({
            $match: { _id: { $in: videoIds } }
        });
    }

    // Filter by user ID if provided
    if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId");
        }
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        });
    }

    // Fetch only published videos
    pipeline.push({ $match: { isPublished: true } });

    // Apply sorting
    if (sortBy) {
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        });
    } else {
        pipeline.push({ $sort: { createdAt: -1 } });
    }

    // Lookup owner details
    pipeline.push(
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $unwind: "$ownerDetails"
        }
    );

    // Apply pagination
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const videoAggregate = Vidio.aggregate(pipeline);
    const videos = await Vidio.aggregatePaginate(videoAggregate, options);

    return res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const publishAVidio=asyncHandler(async(req,res)=>{
    const {title,description,duration}=req.body;
    if(!title||!description||!duration||title===""){
    throw new ApiError(400,"title,duration and description are required");
    }
    const vidioLocalPath=req.files?.vidio[0]?.path;
    const thumbnailLocalPath=req.files?.thumbnail[0]?.path;
    if(!vidioLocalPath||!thumbnailLocalPath){
    throw new ApiError(400,"vidio and thumbnail is missing");
    }
    const vidioUrl=await uploadOnCloudinary(vidioLocalPath);
    const thumbnailUrl=await uploadOnCloudinary(thumbnailLocalPath);
    if(!vidioUrl||!thumbnailUrl){
    throw new ApiError(500,"internal server issue");
    }
    const userId=req.user._id;
    const uploadedVidio=await Vidio.create({
        vidioFile:vidioUrl.url,
        thumbnail:thumbnailUrl.url,
        title,
        description,
        duration,
        owner:req.user._id
    })
    res
    .status(200)
    .json(new ApiResponse(200,uploadedVidio,"vidio uploaded successfully"));
})
const getVidioById = asyncHandler(async (req, res) => {
    const { vidioId } = req.params
    if (!mongoose.Types.ObjectId.isValid(vidioId)) {
        throw new ApiError(400, "Invalid vidio ID");
    }
    
        const vidio = await Vidio.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(vidioId)
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "vidio",
                    as: "likes"
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner",
                    pipeline: [
                        {
                            $lookup: {
                                from: "subscriptions",
                                localField: "_id",
                                foreignField: "channel",
                                as: "subscribers"
                            }
                        },
                        {
                            $addFields: {
                                subscribersCount: {
                                    $size: "$subscribers"
                                },
                                isSubscribed: {
                                    $cond: {
                                        if: {
                                            $in: [
                                                req.user?._id,
                                                "$subscribers.subscriber"
                                            ]
                                        },
                                        then: true,
                                        else: false
                                    }
                                }
                            }
                        },
                        {
                            $project: {
                                username: 1,
                                avtar: 1,
                                subscribersCount: 1,
                                isSubscribed: 1
                            }
                        }
                    ]
                }
            },
            {
                $addFields: {
                    likesCount: {
                        $size: "$likes"
                    },
                    owner: {
                        $first: "$owner"
                    },
                    isLiked: {
                        $cond: {
                            if: {$in: [req.user?._id, "$likes.likedBy"]},
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project: {
                    isPublished:1,
                    vidioFile: 1,
                    title: 1,
                    description: 1,
                    views: 1,
                    createdAt: 1,
                    duration: 1,
                    comments: 1,
                    owner: 1,
                    likesCount: 1,
                    isLiked: 1
                }
            }
        ]);
    
    if(!vidio||!vidio[0].isPublished){
    throw new ApiError(400,"vidio not found");
    } 
    await Vidio.findByIdAndUpdate(vidioId, {
        $inc: {
            views: 1
        }
    });
    await User.findByIdAndUpdate(req.user?._id, {
        $addToSet: {
            watchHistory: vidioId
        }
    });
    return res
    .status(200)
    .json(new ApiResponse(200,vidio[0],"fetched vidio successfully"));
})
// const updateVidio=asyncHandler(async(req,res)=>{
//     const {vidioId}=req.params
//     const {title,description}=req.body
//     if(!title||!description){
//     throw new ApiError(400,"titile and description both are required");
//     }
//     const thumbnailLocalPath=req.file.path;
//     if(!thumbnailLocalPath){
//     throw new ApiError(400,"send thumbnail to do updated");
//     }
//     const newThumbnail=await uploadOnCloudinary(thumbnailLocalPath)
//     if(!newThumbnail){
//     throw new ApiError(500,"failed to update thumbnail");
//     }
//     const prev=await Vidio.findById(vidioId);

// if (!prev) {
//     throw new apiError(404, "No video found");
// }

// if (prev?.owner.toString() !== req.user?._id.toString()) {
//     throw new apiError(
//         400,
//         "You can't delete this video as you are not the owner"
//     );
// }
//     const vidio = await Vidio.findByIdAndUpdate(
//        vidioId,
//         { 
//           $set: {
//             thumbnail: newThumbnail.url,
//             title: title,
//             description: description
//           }
//         },
//         { new: true } 
//       );
//       await removeFromCloudinary(prev.thumbnail);
//     return res
//     .status(200)
//     .json(new ApiResponse(200,vidio,"updated successfully"));
// })
const updateVidio = asyncHandler(async(req, res) => {
    const { vidioId } = req.params;
    const { title, description } = req.body;
    
    if (!title || !description) {
        throw new ApiError(400, "title and description both are required");
    }
    
    const prev = await Vidio.findById(vidioId);
    
    if (!prev) {
        throw new ApiError(404, "No video found");
    }
    
    if (prev?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(
            400,
            "You can't update this video as you are not the owner"
        );
    }

    const updateFields = {
        title,
        description
    };
    if (req.file) {
        const thumbnailLocalPath = req.file.path;
        const newThumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        
        if (!newThumbnail) {
            throw new ApiError(500, "Failed to update thumbnail");
        }
        updateFields.thumbnail = newThumbnail.url;
        if (prev.thumbnail) {
            await removeFromCloudinary(prev.thumbnail);
        }
    }
    const vidio = await Vidio.findByIdAndUpdate(
        vidioId,
        { $set: updateFields },
        { new: true }
    );
    
    return res
        .status(200)
        .json(new ApiResponse(200, vidio, "Updated successfully"));
});
const deleteVidio=asyncHandler(async(req,res)=>{
const {vidioId}=req.params;
const curVidioideo = await Vidio.findById(vidioId);

if (!curVidioideo) {
    throw new apiError(404, "No video found");
}

if (curVidioideo?.owner.toString() !== req.user?._id.toString()) {
    throw new apiError(
        400,
        "You can't delete this video as you are not the owner"
    );
}
const vidio=await Vidio.findByIdAndDelete(vidioId);
if(!vidio){
throw new ApiError(400,"cannot find vidio");
}
await removeFromCloudinary(vidio.thumbnail);
await removeFromCloudinary(vidio.vidioFile);
await Like.deleteMany({
    vidio: vidioId
})
await Comment.deleteMany({
    vidio: vidioId,
})
return res.status(200)
.json(new ApiResponse(200,vidio,"deleted successfully"));
})
const togglePublishVidio=asyncHandler(async(req,res)=>{
const {vidioId}=req.params;
const curVidio=await Vidio.findById(vidioId);
if (curVidio?.owner.toString() !== req.user?._id.toString()) {
    throw new apiError(
        400,
        "You can't toogle publish status as you are not the owner"
    );
}

const vidio=await Vidio.findByIdAndUpdate(
  vidioId,
  {
    $set:{
      isPublished:!curVidio.isPublished
    }
  },
  {new:true}
)
if(!vidio){
throw new ApiError(400,"vidio not found");
}
return res.status(200).json(new ApiResponse(200,vidio,"status toggled"));
})
export {
    getAllVideos,publishAVidio,getVidioById,updateVidio,deleteVidio,togglePublishVidio
}