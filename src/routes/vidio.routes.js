import { Router } from "express";
import { getVidioById, publishAVidio } from "../controllers/vidio.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
const router=Router();
router.route('/').post(verifyToken,upload.fields([
    {name:"vidio",
        maxCount:1
    },
    {
        name:"thumbnail",
        maxCount:1
    }
]),publishAVidio);
router.route(":vidioId")
.get(verifyToken,getVidioById);
export default router;