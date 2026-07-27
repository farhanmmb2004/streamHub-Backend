import {Router} from "express";
import { getFeed } from "../controllers/getfeed.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/getfeed", verifyToken, getFeed);

export default router;
