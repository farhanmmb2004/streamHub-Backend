import { Router } from 'express';
import {
    addComment,
    deleteComment,
    getVideoComments,
    updateComment,
} from "../controllers/comment.controllers.js"
import {verifyToken} from "../middlewares/auth.middleware.js"

const router = Router();

router.use(verifyToken); // Apply verifyJWT middleware to all routes in this file

router.route("/:vidioId").get(getVideoComments).post(addComment);
router.route("/c/:commentId").delete(deleteComment).patch(updateComment);

export default router