import mongoose from "mongoose"
import {Vidio} from "../models/vidio.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const vidio = await Vidio.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        },{
            $lookup:{
                from:"likes",
                foreignField:"vidio",
                localField:"_id",
                as:"likes"
            }
        },
        {
            $project: {
                totalViews:"$views", // Summing up the "views" field
                totalLikes:{
                    $size:"$likes"
                },
                totalVidios:1
            }
        },
        {
            $group: {
                _id: null, 
                totalViews: {
                    $sum:"$totalViews"
                },
                totalLikes: {
                    $sum:"$totalLikes"
                },totalVidios: {
                    $sum:1
                }
            }
        }

    ]);
    let subscribers=await Subscription.countDocuments({channel:req.user?._id})
    let details={
        totalLikes:vidio[0].totalLikes,
        totalVidios:vidio[0].totalVidios,
        totalViews:vidio[0].totalViews,
        subscribers
    }
    return res.status(200).json(new ApiResponse(200,details,"sucess"));
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const id=req.user?._id
    const vidios=await Vidio.aggregate([
        {
            $match:{
            owner:new mongoose.Types.ObjectId(id)
            }
        },{
            $lookup:{
                from:"likes",
                foreignField:"vidio",
                localField:"_id",
                as:"likes"
            }
        },{
            $addFields:{
                createdAt:{
                $dateToParts:{date:"$createdAt"}
                },
                likesCount:{
                    $size:"$likes"
                }
            }
        },{
            $sort:{createdAt:-1}
        },{
            $project:{
                _id:1,
                thumbnail:1,
                vidioFile:1,
                title:1,
                description:1,
                duration:1,
                createdAt:1,
                likesCount:1,
                createdAt:{
                    year:1,
                    month:1,
                    day:1
                }
            }
        }
    ])
    return res.status(200).json(new ApiResponse(200,vidios,"fetched"))
})

export {
    getChannelStats, 
    getChannelVideos
    }