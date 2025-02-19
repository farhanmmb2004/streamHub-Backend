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
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
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