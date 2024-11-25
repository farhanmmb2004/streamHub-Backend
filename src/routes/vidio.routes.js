import { Router } from "express";
import { getVidioById, publishAVidio, updateVidio } from "../controllers/vidio.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
const router=Router();
router.use(verifyToken)
router.route('/').post(verifyToken,upload.fields([
    {name:"vidio",
        maxCount:1
    },
    {
        name:"thumbnail",
        maxCount:1
    }
]),publishAVidio);
router.route("/:vidioId")
.get(getVidioById)
.patch(upload.single("thumbnail"),updateVidio)
export default router;