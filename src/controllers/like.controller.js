import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Vidio } from "../models/vidio.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    if(!isValidObjectId(videoId)){
    throw new ApiError(401,"invalid vidio id");
    }
    const isLiked=await Like.findOne({
        likedBy:req.user?.id,
        vidio:videoId
    });
    if(isLiked){
    await Like.deleteOne({
    _id:isLiked._id
    })
    return res.status(200)
    .json(new ApiResponse(200,{isLiked:false},"vidio unliked"))
    }
    else{
    let done=await Like.create({
        likedBy:req.user?.id,
        vidio:videoId
    })
    return res.status(200).json(new ApiResponse(200,{isLiked:true},"liked vidio"))
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!isValidObjectId(commentId)){
        throw new ApiError(401,"invalid vidio id");
        }
        const isLiked=await Like.findOne({
            likedBy:req.user?.id,
            comment:commentId
        });
        if(isLiked){
        await Like.deleteOne({
        _id:isLiked._id
        })
        return res.status(200)
        .json(new ApiResponse(200,{isLiked:false},"comment unliked"))
        }
        else{
        let done=await Like.create({
            likedBy:req.user?.id,
            comment:commentId
        })
        return res.status(200).json(new ApiResponse(200,{isLiked:true},"comment liked"))
        }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!isValidObjectId(tweetId)){
        throw new ApiError(401,"invalid vidio id");
        }
        const isLiked=await Like.findOne({
            likedBy:req.user?.id,
            tweet:tweetId
        });
        if(isLiked){
        await Like.deleteOne({
        _id:isLiked._id
        })
        return res.status(200)
        .json(new ApiResponse(200,{isLiked:false},"tweet unliked"))
        }
        else{
        let done=await Like.create({
            likedBy:req.user?.id,
            tweet:tweetId
        })
        return res.status(200).json(new ApiResponse(200,{isLiked:true},"tweet liked"))
        }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    // let likedvidios=await Like.findOne({
    //     likedBy:req.user?.id
    // })
    let likedvidios = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user?.id)
            }
        },
        {
            $addFields: {
                vidio: { $toObjectId: "$vidio" }  // Convert 'vidio' string to ObjectId
            }
        },
        {
            $lookup: {
                from: "vidios",
                localField: "vidio",
                foreignField: "_id",
                as: "vidiodetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails"
                        }
                    },
                    {
                        $unwind: "$ownerDetails"
                    }
                ]
            }
        },
        {
            $unwind: "$vidiodetails"
        },
        {
            $sort: {
                createdAt: -1
            }
        },{
            $project:{
                _id:0,
                vidiodetails:{
                thumbnail:1,
                duration:1,
                title:1,
                _id:1,
                views:1,
                owner:1,
                createdAt:1,
                isPublished:1,
                vidioFile:1,
                ownerDetails:{
                    username:1,
                    email:1,
                    avatar:1,
                    fullname:1
                }
            }
        }}
    ]);
    
    return res.status(200).json(new ApiResponse(200,likedvidios,"success"));
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}