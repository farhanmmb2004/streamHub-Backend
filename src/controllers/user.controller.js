import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from  "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

const generateAccessAndRefreshToken=async(userId)=>{
try {
    const user=await User.findById(userId);
    const accessToken=await user.generateAccessToken()
    const refreshToken=await user.generateRefreshToken()
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
const loginUser=asyncHanler(async(req,res)=>{
const {username,email,password}=req.body
if(!username&&!password){
throw new ApiError(400,"email or username required");
}
const user=await User.findOne({$or:[{username},{email}]})
if(!user){
throw new ApiError(404,"user does not exist");
}
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
            $set:{
                refreshToken:undefined
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
})
export {loginUser,registerUser,logoutUser}