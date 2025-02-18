import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {vidioId}=req.params;
    const{content}=req.body;
    if (!content) {
        throw new apiError(400, "Content is required");
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
    const comment=await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(401,"comment doesn't exist");
    }
    console.log(comment.owner);
    console.log(req.user?._id);
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
    })
    return res.status(200).json(new ApiResponse(200,{},"succesfully deleted"));
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }