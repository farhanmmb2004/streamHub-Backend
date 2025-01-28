import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser, changePassword,updateAccountDetails,getCurrentUser,updateUserAvtar, updateUserCoverImage,getWatchHistory,getUserChannelProfile} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
const router=Router();
router.route("/register").post(
    upload.fields([
        {name:"avtar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser);
router.route("/login").post(loginUser);
router.route("/logout").post(verifyToken, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").patch(verifyToken,changePassword);
router.route("/current-user").get(verifyToken,getCurrentUser);
router.route("/account-info").patch(verifyToken,updateAccountDetails);
router.route("/avtar").patch(verifyToken, upload.single("avtar"),updateUserAvtar);
router.route("/coverImage").patch(verifyToken, upload.single("coverImage"),updateUserCoverImage);
router.route("/c/:username").get(verifyToken,getUserChannelProfile);
router.route("/history").get(verifyToken,getWatchHistory);
export default router