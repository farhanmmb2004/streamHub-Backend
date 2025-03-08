import { Router } from "express";
import { deleteVidio, getAllVideos, getVidioById, publishAVidio, togglePublishVidio, updateVidio } from "../controllers/vidio.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
const router=Router();
// router.use(verifyToken)
router.route('/').post(verifyToken,upload.fields([
    {name:"vidio",
        maxCount:1
    },
    {
        name:"thumbnail",
        maxCount:1
    }
]),publishAVidio)
.get(getAllVideos);
router.route("/:vidioId")
.get(verifyToken,getVidioById)
.patch(verifyToken,upload.single("thumbnail"),updateVidio)
.delete(verifyToken,deleteVidio);
router.route('/toggle-publish/:vidioId').patch(verifyToken,togglePublishVidio);
export default router;