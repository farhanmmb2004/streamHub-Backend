import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from  "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
const registerUser=asyncHandler(async (req,res)=>{
    // res.status(200).json({
    //     message:"ok"
    // });
    const{username,email,fullname,password}=req.body;
    console.log("email ", email);
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
    const coverImageLocalPath=req.files?.coverImage[0]?.path;
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
    if(createdUser){
    throw new ApiError(500,"something went wrong ");
    }
    return res.status(201).json(
        new ApiResponse(200,createdUser,"user registerd successfully")
    );
});
export {registerUser};