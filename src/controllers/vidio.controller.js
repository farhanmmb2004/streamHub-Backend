import {asyncHandler} from "../utils/asyncHandler.js"
import {Vidio} from "../models/vidio.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary,removeFromCloudinary } from "../utils/cloudinary.js"
import mongoose  from "mongoose"
const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination

    const videos = await Vidio.aggregate([
        {
            $match:{
                $or:[
                    {title:{$regex:query,$options:"i"}},
                    {description:{$regex:query,$options:"i"}},
                ]
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"videoBy"
            },
        },
        {
            $unwind:"$videoBy"
        },
        {
            $project:{
                thumbnail:1,
                vidioFile:1,
                title:1,
                description:1,
                duration:1,
                createdAt:1,
                views:1,
                videoBy:{
                    fullname:1,
                    username:1,
                    avtar:1
                }
            }
        },
        {
            $sort:{
                [sortBy]:sortType === "asc" ? 1 : -1
            }
        },
        {
            $skip:(page-1) * limit
        },
        {
            $limit:parseInt(limit)
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,videos,"fetched successfully"))
})
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
    
    if(!vidio){
    throw new ApiError(400,"vidio not found");
    } 
    await Vidio.findByIdAndUpdate(vidioId, {
        $inc: {
            views: 1
        }
    });

    // add this video to user watch history
    await User.findByIdAndUpdate(req.user?._id, {
        $addToSet: {
            watchHistory: vidioId
        }
    });
    return res
    .status(200)
    .json(new ApiResponse(200,vidio[0],"fetched vidio successfully"));
})
const updateVidio=asyncHandler(async(req,res)=>{
    const {vidioId}=req.params
    const {title,description}=req.body
    if(!title||!description){
    throw new ApiError(400,"titile and description both are required");
    }
    const thumbnailLocalPath=req.file.path;
    if(!thumbnailLocalPath){
    throw new ApiError(400,"send thumbnail to do updated");
    }
    const newThumbnail=await uploadOnCloudinary(thumbnailLocalPath)
    if(!newThumbnail){
    throw new ApiError(500,"failed to update thumbnail");
    }
    const prev=await Vidio.findById(vidioId);
    const vidio = await Vidio.findByIdAndUpdate(
       vidioId,
        { 
          $set: {
            thumbnail: newThumbnail.url,
            title: title,
            description: description
          }
        },
        { new: true } 
      );
      await removeFromCloudinary(prev.thumbnail);
    return res
    .status(200)
    .json(new ApiResponse(200,vidio,"updated successfully"));
})
const deleteVidio=asyncHandler(async(req,res)=>{
const {vidioId}=req.params;
const vidio=await Vidio.findByIdAndDelete(vidioId);
if(!vidio){
throw new ApiError(400,"cannot find vidio");
}
await removeFromCloudinary(vidio.thumbnail);
await removeFromCloudinary(vidio.vidioFile);
return res.status(200)
.json(new ApiResponse(200,vidio,"deleted successfully"));
})
const togglePublishVidio=asyncHandler(async(req,res)=>{
const {vidioId}=req.params;
const curVidio=await Vidio.findById(vidioId);
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