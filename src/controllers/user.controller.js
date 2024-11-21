import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from  "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from 'jsonwebtoken';
import mongoose from "mongoose";
const generateAccessAndRefreshToken=async(userId)=>{
try {
    const user=await User.findById(userId);
    // console.log(user);
    const accessToken=await user.generateAccessToken()
    // console.log(accessToken);
    const refreshToken=await user.generateRefreshToken()
    // console.log("asdads");
    user.refreshToken=refreshToken;
    user.save({validateBeforeSave:false});
    return {accessToken,refreshToken}
} catch (error) {
    throw new ApiError(500,"internal issue");
}
}
const registerUser=asyncHandler(async (req,res)=>{
    const{username,email,fullname,password}=req.body;
    if([username,email,fullname,password].some((field)=>field?.trim()==="")){
    throw new ApiError(400,"All fields are required");
    }
    const existedUser=await User.findOne(
        {
        $or:[{ username },{ email }]
        }
    );
    if(existedUser){
    throw new ApiError(409,"User already exists with email or username");
    }
    // console.log(username);
    const avtarLocalPath=req.files?.avtar[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if(!avtarLocalPath){
     throw new ApiError (400,"Avtar file is required");
    }
    const avtar= await uploadOnCloudinary(avtarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);
    if(!avtar){
        throw new ApiError (400,"Avtar file is required");
    }
   const user=await User.create({
        fullname,
        avtar:avtar.url,
        coverImage:coverImage?.url||"",
        email,
        password,
        username:username.toLowerCase()
       
    });
    const createdUser=await User.findById(user._id).select("-password -refreshToken");
    if(!createdUser){
    throw new ApiError(500,"something went wrong ");
    }
    return res.status(201).json(
        new ApiResponse(200,createdUser,"user registerd successfully")
    );
});
const loginUser=asyncHandler(async(req,res)=>{
const {username,email,password}=req.body
if(!username&&!email){
throw new ApiError(400,"email or username required");
}
const user=await User.findOne({$or:[{username},{email}]})
if(!user){
throw new ApiError(404,"user does not exist");
}
// console.log(password);
const isPasswordCorrect=await user.isPasswordCorrect(password);
if(!isPasswordCorrect){
throw new ApiError(401,"invalid password");
}
const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id);
const userlogin=await User.findById(user._id).select("-password -refreshToken");
const options={
    httpOnly:true,
    secure:true
}
 return res
 .status(200)
 .cookie("accessToken",accessToken,options)
 .cookie("refreshToken",refreshToken,options)
 .json(
    new ApiResponse(
        200,{
           userlogin,accessToken,refreshToken
        },
        "user loggedin successfully"
    )
 );
});
const logoutUser=asyncHandler(async(req,res)=>{
     await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken:1
            }
        }
     )
     const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged Out"))
});
const refreshAccessToken=asyncHandler(async(req,res)=>{
try {
    const incomingRefreshToken=req.cookies.refreshToken||req.body.refreshToken;
    console.log(incomingRefreshToken);
    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized");
        }
    const decodedToken=await jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
    // console.log(decodedToken);
    const user=await User.findById(decodedToken?._id);
    if(!user){
    throw new ApiError(401,"invalid refresh token");
    }
    // console.log(incomingRefreshToken);
    //     console.log(user?.refreshToken);
    if(incomingRefreshToken!==user?.refreshToken){
        
    throw new ApiError(401,"Refresh token is expired");
    }
    // console.log("xyz");
    const{accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id);
    const options={
        httpOnly:true,
        secure:true
    }
    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(new ApiResponse(200,
        {accessToken,refreshToken},
        "accessToken refresh successfully"
    ))  
} catch (error) {
    throw new ApiError(401,error?.messege||"invalid refresh Token");
}
});
const changePassword=asyncHandler(async(req,res)=>{
const {oldPassword,newPassword}=req.body;
const user=await User.findById(req.user._id);
console.log(user);
const isPasswordCorrect=await user.isPasswordCorrect(oldPassword);
if(!isPasswordCorrect){
throw new ApiError(400,"Incorrect password");
}
user.password=newPassword;
await user.save({validateBeforeSave:false});
return res
.status(200)
.json(new ApiResponse(201,{},"password changed"));
});
const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"current user fetched succesfully"));
});
const updateAccountDetails=asyncHandler(async(req,res)=>{
const {email,username}=req.body;
console.log(req.user._id);

const user = await User.findByIdAndUpdate(
    req.user._id,
    {
        $set: {
            username,
            email
        }
    },
    { new: true } 
).select("-password");

console.log(user);
return res
.status(200)
.json(new ApiResponse(200,user,"updated succesfully"));
});
const updateUserAvtar=asyncHandler(async(req,res)=>{
    const avtarLocalPath=req.file?.path;
    if(!avtarLocalPath){
    throw new ApiError(400,"avtar is missing");
    }
    const avtar=await uploadOnCloudinary(avtarLocalPath);
    if(!avtar){
    throw new ApiError("Error while uploading avtar");
    }
    const user=await User.findOneAndUpdate(req.user?._id,
        {
            $set:{avtar:avtar.url}
        },
        {new:true}
    ).select("-password");
    console.log(user);
    return res
    .status(200)
    .json(new ApiResponse(200,user,"successfully updated avatar"));
})
const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path;
    if(!coverImageLocalPath){
    throw new ApiError(400,"coverImage is missing");
    }
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage){
    throw new ApiError("Error while uploading avtar");
    }
    const user=await User.findOneAndUpdate(req.user?._id,
        {
            $set:{coverImage:coverImage.url}
        },
        {new:true}
    ).select("-password");
    return res
    .status(200)
    .json(new ApiResponse(200,user,"successfully updated coverImage"));
})
// const getUserChannelProfile=asyncHandler(async(req,res)=>{
// const {username}=req.params;
// if(!username?.trim()){
// throw new ApiError(400,"username does not found");
// const channel= await User.aggregate([
//     {  
//         $match:{
//             username:username?.toLowerCase()
//         }},
//         {
//             $lookup:{
//             from:"subscription",
//             localField:"_id",
//             foreignField:"channel",
//             as:"subscriber"
//         }
//     },
//       {
//           $lookup:{
//             from:"subscription",
//             localField:"_id",
//             foreignField:"subscriber",
//             as:"subscriedTo"
//         }
//     },
//     {
//         $addFields:{
//             subscribersCount:{
//                 $size:"$subscribers"
//             },
//             channelSubscribedToCount:{
//                 $size:"$subscribedTo"
//             },
//             isSubscribed:{
//                 $cond:{
//                     if:{$in:[req.user?._id,"$subscribers.subscriber"]},
//                     then:true,
//                     else:false
//                 }
//             }
//         }
//     },
//     {
//         $project:{
//             fullname:1,
//             username:1,
//             subscribersCount:1,
//             channelSubscribedToCount:1,
//             isSubscribed:1,
//             avtar:1,
//             coverImage:1
//         }
//     }

// ]);
// if(!channel?.length){
// throw new ApiError(404,"channel does not exist")
// }
// return res
// .status(200)
// .json(new ApiResponse(200,channel[0],"user channel fetched successfully!"))
// }
// })
const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username?.trim()) {
      throw new ApiError(400, "username is required");
    }
  
    const channel = await User.aggregate([
      {
        $match: {
          username: username.toLowerCase(),
        },
      },
      {
        $lookup: {
          from: "subscription",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $lookup: {
          from: "subscription",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribedTo",
        },
      },
      {
        $addFields: {
          subscribersCount: {
            $size: "$subscribers",
          },
          channelSubscribedToCount: {
            $size: "$subscribedTo",
          },
          isSubscribed: {
            $cond: {
              if: { $in: [req.user?._id, "$subscribers.subscriber"] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          fullname: 1,
          username: 1,
          subscribersCount: 1,
          channelSubscribedToCount: 1,
          isSubscribed: 1,
          avtar: 1,
          coverImage: 1,
        },
      },
    ]);
  
    if (!channel?.length) {
      throw new ApiError(404, "channel does not exist");
    }
  
    return res
      .status(200)
      .json(new ApiResponse(200, channel[0], "user channel fetched successfully!"));
  });
  
const getWatchHistory=asyncHandler(async(req,res)=>{
    const user=await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[{
                    $lookup:{
                       from:"users" ,
                       localField:"owner",
                       foreignField:"_id",
                       as:"owner",
                       pipeline:[{
                        $project:{
                            username:1,
                            _id:1,
                            fullname:1,
                            avtar:1
                        }
                       }]
                    }},
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ]);
    return res
    .status(200)
    .json(new ApiResponse(200,user.watchHistory,"whatHistory fetched beautifully"))
})
export {loginUser,
    registerUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    updateAccountDetails,
    getCurrentUser,
    updateUserAvtar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}