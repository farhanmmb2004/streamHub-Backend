import { Router } from 'express';
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import {verifyToken} from "../middlewares/auth.middleware.js"

const router = Router();
router.use(verifyToken);

router.route("/c/:userId").get(getSubscribedChannels);
router.route("/c/:channelId").post(toggleSubscription);

router.route("/u/:channelId").get(getUserChannelSubscribers);

export default router