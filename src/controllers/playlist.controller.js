import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Vidio } from "../models/vidio.model.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    if(!name||!description){
     throw new ApiError(400,"name and description required");
    }
        let playlist=await Playlist.create({
            owner:req.user?._id,
            name,
            description,
            vidios:[]
        });
    return res.status(200).json(new ApiResponse(200,playlist,"working"));
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    let playlists=await Playlist.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },{
            $lookup:{
                from:"vidios",
                localField:"vidios",
                foreignField:"_id",
                as:"vidioDetails"
            }
        },{
            $addFields:{
                totalVidios:{
                    $size:"$vidioDetails"
                },
                veiws:{
                    $sum:"$vidioDetails.veiws"
                },
                first:{
                    $last:{
                        $filter:{
                            input:"$vidioDetails",
                            as:"vidio",
                            cond:{$eq:["$$vidio.isPublished",true]}
                        }
                    }
                },
            }
        },{
            $project:{
               _id:1,
               name:1,
               description:1,
               totalVidios:1,
               veiws:1,
               first:{
                _id:1,
                thumbnail:1,
                views:1
               },
               updatedAt:1
            }
        }
    ]);
    return res.status(200).json(new ApiResponse(200,playlists,"success"));
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)){
       throw new ApiError(400,"invalid vidio Id");
    }
    let playlist=await Playlist.aggregate([
        {
            $match:{
            _id:new mongoose.Types.ObjectId(playlistId)
            }
        },{
            $lookup:{
                from:"vidios",
                foreignField:"_id",
                localField:"vidios",
                as:"vidios"
            }
        },{
            $set: {
                vidios: {
                    $filter: {
                        input: "$vidios",
                        as: "vidio",
                        cond: { $eq: ["$$vidio.isPublished", true] }  
                    }
                }
            }
        },{
            $lookup:{
                from :"users",
                foreignField:"_id",
                localField:"owner",
                as:"owner"
            }
        },{
            $addFields:{
                owner:{
                    $first:"$owner"
                },
                totalVidios:{
                    $size:"$vidios"
                },
                veiws:{
                    $sum:"$vidios.veiws"
                }
            }
        },{
            $project:{
                _id:1,
                name:1,
                description:1,
                updatedAt:1,
                createdAt:1,
                vidios:{
                    _id:1,
                    title:1,
                    description:1,
                    views:1,
                    duration:1,
                    createdAt:1,
                    thumbnail:1,
                    vidioFile:1,
                    isPublished:1
                },
                owner:{
                    username:1,
                    fullname:1,
                    avtar:1
                },
                totalVidios:1,
                veiws:1
            }
        }
    ]);
    return res.status(200).json(new ApiResponse(200,playlist,"success"));
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, vidioId} = req.params
    if(!isValidObjectId(playlistId)||!isValidObjectId(vidioId)){
    throw new ApiError(400,"invalid vidio or playlist id");
    }
    const vidio=await Vidio.findById(vidioId);
    if(!vidio){
    throw new ApiError(400,"vidio does not exist");
    }
    if(vidio.owner.toString()!==req.user._id.toString()){
        throw new ApiError(400,"only your vidios can add u in your playlist");
    }
    const currentPlaylist=await Playlist.findById(playlistId);
    if(!currentPlaylist){
    throw new ApiError(400,"playlist Does not exists");
    }
    if(currentPlaylist.owner.toString()!==req.user._id.toString()){
        throw new ApiError(400,"only owner of playlist can add the vidios in it");
    }
    const playlist = await Playlist.findOneAndUpdate(
        { _id: playlistId },
        { $addToSet: { vidios: vidioId } }, 
        { new: true }
      );
    if(!playlist){
    throw new ApiError(400,"playlist does not exits")
    }
    return res.status(200).json(new ApiResponse(200,playlist,"successfully added"));
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, vidioId} = req.params
    if(!isValidObjectId(playlistId)||!isValidObjectId(vidioId)){
        throw new ApiError(400,"invalid vidio or playlist id");
        }
        const currentPlaylist=await Playlist.findById(playlistId);
        if(!currentPlaylist){
        throw new ApiError(400,"playlist Does not exists");
        }
        if(currentPlaylist.owner.toString()!==req.user._id.toString()){
            throw new ApiError(400,"only owner of playlist can delete the vidios from playlist");
        }
        const playlist = await Playlist.findOneAndUpdate(
            { _id: playlistId },
            { $pull: { vidios: vidioId } }, 
            { new: true }
          );
        if(!playlist){
        throw new ApiError(400,"playlist does not exits")
        }
        return res.status(200).json(new ApiResponse(200,playlist,"successfully added"));

    }

)

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)){
    throw new ApiError(400,"invalid playlistId");
    }
    const playlist=await Playlist.findById(playlistId);
    if(playlist.owner.toString()!=req.user?._id.toString()){
        throw new ApiError(400,"only owner can delete this");
    }
    await Playlist.findByIdAndDelete(playlistId);
    return res.status(200).json(new ApiResponse(200,{},"playlist Deleted"));
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!isValidObjectId(playlistId)){
    throw new ApiError(400,"invalid playlistId");
    }
    if(!name||!description){
        throw new ApiError(400,"name and description required");
    }
    const playlist=await Playlist.findById(playlistId);
    if(playlist.owner.toString()!=req.user?._id.toString()){
        throw new ApiError(400,"only owner can update this");
    }
   const updatedPlaylist= await Playlist.findByIdAndUpdate({_id:playlistId},
        {
            $set:{
                name,
                description
            }
        },{
            new:true
        });
    return res.status(200).json(new ApiResponse(200,updatedPlaylist,"playlist updated"));
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}