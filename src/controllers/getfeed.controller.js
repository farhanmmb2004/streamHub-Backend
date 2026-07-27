import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
export const getFeed = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if(!userId){
        return res.status(400).json(new ApiResponse(400, null, "User ID is required"));
    }
    
    // Add logic to fetch feed items for the user
    return res.status(200).json(new ApiResponse(200, { message: "Feed fetched successfully" }, "Feed fetched successfully"));
}
)