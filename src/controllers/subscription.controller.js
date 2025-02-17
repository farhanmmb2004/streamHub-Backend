import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!isValidObjectId(channelId)){
    throw new ApiError(404,"invalid channel id");
    }
    const isSubscribed=await Subscription.findOne({
        subscriber:req.user?._id,
        channel:channelId
    })
    if(isSubscribed){
    await Subscription.deleteOne({_id:isSubscribed._id});
    return res.status(200).json(new ApiResponse(200,{isSubscribed:false},"unSubscribed"));    
    }
    await Subscription.create({
    channel:channelId,
    subscriber:req.user?._id
    }); 
    return res.status(200).json(new ApiResponse(200,{isSubscribed:true},"subscribed"))   
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    let {channelId} = req.params
    if(!isValidObjectId(channelId)){
    throw new ApiError(401,"invalid channel Id");
    }
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscriberDetails",
                pipeline:[
                    {
                        $lookup:{
                            from:"subscriptions",
                            localField:"_id",
                            foreignField:"channel",
                            as:"subscribersOfSubsriber"
                        }
                    },
                    {
                        $addFields:{
                            totalSubscribers:{
                                $size:"$subscribersOfSubsriber"
                            },
                            subscribedTOsubscriber:{
                                $cond:{
                                 if:{
                                    $in:[channelId,"$subscribersOfSubsriber.subscriber"]
                                 },
                                 then:true,
                                 else:false
                                }
                            }
                        }
                    }
                ]
            }
        },{
            $unwind:"$subscriberDetails"
        },{
            $project:{
                _id:0,
                subscriberDetails:{
                    _id:1,
                    username:1,
                    fullname:1,
                    email:1,
                    subscribedTOsubscriber:1,
                    totalSubscribers:1
                }
            }
        }
    ]);
    return res.status(200).json(new ApiResponse(200,subscribers,"succesfull"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    console.log(req.params);
    let { userId } = req.params;
    if(!isValidObjectId(userId)){
    throw new ApiError(401,"invalid Id")
    }
    let channels=await Subscription.aggregate([
        {
            $match:{
            subscriber:new mongoose.Types.ObjectId(userId)
        }
    },
    {
        $lookup:{
            from:"users",
            localField:"channel",
            foreignField:"_id",
            as:"channelDetails",
            pipeline:[
                {
                    $lookup:{
                        from:"vidios",
                        localField:"_id",
                        foreignField:"owner",
                        as:"vidios"
                    }
                },
                {
                    $addFields:{
                        latestvidio:{
                            $last:"$vidios"
                        }
                    }
                }
            ]
        }
    }
    ,{
        $unwind:"$channelDetails"
    },{
        $project:{
            _id:0,
            channelDetails:{
                username:1,
                fullname:1,
                email:1,
                _id:1,
                avtar:1,
                latestvidio:{
                    _id:1,
                    thumbnail:1,
                    title:1,
                    description:1,
                    duration:1,
                    createdAt:1,
                    views:1,
                    vidioFile:1,
                    owner:1,
                }
            }
        }
    }
    ])
    return res.status(200).json(new ApiResponse(200,channels,"success"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}