import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const{content}=req.body;
    if(!content){
      throw new ApiError(400,"content is required");
    }
    let tweet= await Tweet.create({
        owner:req.user?._id,
        content
    })
    if(!tweet){
    throw new ApiError(500,"internal error");
    }
    return res.status(200).json(new ApiResponse(200,tweet,"sucessfully tweeted"));
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId}=req.params
    if(!isValidObjectId(userId)){
    throw new ApiError(400,"invalid  userId")
    }
    const tweets=await Tweet.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        }
        ,{
         $lookup:{
            from:"users",
            foreignField:"_id",
            localField:"owner",
            as:"ownerDetails"
         }
        },{
            $unwind:"$ownerDetails"
        },
        {
            $lookup:{
                from:"likes",
                foreignField:"tweet",
                localField:"_id",
                as:"likes"
            }
        },
        {
            $addFields:{
                likesCount:{
                    $size:"$likes"
                },
                isLiked:{
                    $cond:{
                        if:{
                            $in:[req.user?._id,"$likes.likedBy"]
                        },
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{
                _id:1,
                content:1,
                createdAt:1,
                ownerDetails:{
                    _id:1,
                    fullname:1,
                    username:1,
                    avtar:1
                },
                likesCount:1,
                isLiked:1
            }
        }
    ]);
    return res.status(200).json(new ApiResponse(200,tweets,"tweets fetched successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const{tweetId}=req.params
    const{newContent}=req.body
    if(!newContent){
        throw new ApiError(400,"content is required");
    }
    if(!isValidObjectId(tweetId)){
    throw new ApiError(400,"invalid object Id");
    }
    const tweet=await Tweet.findById(tweetId)
    if(!tweet){
    throw new ApiError(400,"tweet does not exist");
    }
    if(tweet.owner.toString()!==req.user?._id.toString()){
     throw new ApiError(401,"only the owner of the tweet can update the tweet")
    }
    let newTweet=await Tweet.findOneAndUpdate({
        _id:tweetId
    },{
        $set:{
            content:newContent
        }
    },{
        new:true
    });
    return res.status(200).json(new ApiResponse(200,newTweet,"updated successfully"));
})

const deleteTweet = asyncHandler(async (req, res) => {
    const{tweetId}=req.params
    if(!isValidObjectId(tweetId)){
    throw new ApiError(400,"invalid object Id");
    }
    const tweet=await Tweet.findById(tweetId)
    if(!tweet){
    throw new ApiError(400,"tweet does not exist");
    }
    if(tweet.owner.toString()!==req.user?._id.toString()){
     throw new ApiError(401,"only the owner of the tweet can update the tweet")
    }
    await Tweet.findByIdAndDelete(tweetId);
    await Tweet.deleteMany({
        tweet:tweetId
    })
    return res.status(200).json(new ApiResponse(200,{},"deleted successfully"));
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}