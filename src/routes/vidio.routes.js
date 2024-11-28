import { Router } from "express";
import { deleteVidio, getAllVideos, getVidioById, publishAVidio, togglePublishVidio, updateVidio } from "../controllers/vidio.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
const router=Router();
router.use(verifyToken)
router.route('/').post(upload.fields([
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
.get(getVidioById)
.patch(upload.single("thumbnail"),updateVidio)
.delete(deleteVidio);
router.route('/toggle-publish/:vidioId').patch(togglePublishVidio);
export default router;