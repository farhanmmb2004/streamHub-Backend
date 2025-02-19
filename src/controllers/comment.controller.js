import mongoose,{isValidObjectId} from "mongoose"
import {Comment} from "../models/comment.model.js"
import { Vidio } from "../models/vidio.model.js"
import { Like } from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {vidioId} = req.params
    const {page = 1, limit = 10} = req.query
    if(!isValidObjectId(vidioId)){
    throw new ApiError(201,"invalid vidio id");
    }
    const vidio=await Vidio.findById(vidioId);
    if(!vidio){
    throw new ApiError(200,"vidio doesn't exists");
    }
    let comments=await Comment.aggregate([
        {
            $match:{
                vidio:new mongoose.Types.ObjectId(vidioId)
            }
        },
        {
            $lookup:{
                from:"users",
                foreignField:"_id",
                localField:"owner",
                as:"ownerDetails",
            }
        },
        {
            $unwind:"$ownerDetails"
        },
        {
            $lookup:{
                from:"likes",
                foreignField:"comment",
                localField:"_id",
                as:"likes",
            }
        },{
            $addFields:{
                likesCount:{$size:"$likes"},
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
                owner:1,
                createdAt:1,
                ownerDetails:{
                    fullname:1,
                    username:1,
                    avtar:1,
                },
                likesCount:1,
                isLiked:1
            }
        },{
            $skip:(page-1)*limit
        },{
            $limit:parseInt(limit)
        }
    ]);
    // let comments=await Comment.find({vidio:vidioId});
    return res.status(200).json(new ApiResponse(200,comments,"aah aah chud gyi chud gyi"));
    
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {vidioId}=req.params;
    const{content}=req.body;
    if (!content) {
        throw new ApiError(400, "Content is required");
    }
    const video = await Vidio.findById(vidioId);

if (!video) {
    throw new apiError(404, "Video not found");
}
    const comment=await Comment.create({
        content,
        owner:req.user?._id,
        vidio:vidioId
    })
    if (!comment) {
        throw new apiError(500, "Failed to add comment please try again");
    }
    return res.status(200).json(new ApiResponse(200,comment,"successfull"));
})

const updateComment = asyncHandler(async (req, res) => {
    const{commentId}=req.params;
    const {newContent}=req.body;
    if(!newContent){
    throw new ApiError(400,"content is required")
    }
    const comment=await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(401,"comment doesn't exist");
    }
    if(comment.owner.toString()!==req.user?._id.toString()){
    throw new ApiError(401,"only the owner of comment can edit this");
    }
    let newComment=await Comment.findOneAndUpdate({_id:commentId},
      {
     $set:{
        content:newContent
     }
     },{
        new:true
     });
     return res.status(200).json(new ApiResponse(200,newComment,"updated"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId}=req.params
    const comment=await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(401,"comment doesn't exist");
    }
    if(comment.owner.toString()!=req.user?._id.toString()){
    throw new ApiError(401,"only the owner of comment can delete this");
    }
    await Comment.deleteOne({
        _id:commentId
    });
    await Like.deleteMany({
        comment:commentId
    })
    return res.status(200).json(new ApiResponse(200,{},"succesfully deleted"));
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }