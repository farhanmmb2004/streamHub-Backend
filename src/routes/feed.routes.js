import {Router} from "express";
import { getFeed } from "../controllers/getfeed.controller.js";

const router = Router();

router.get("/getfeed", getFeed);

export default router;
