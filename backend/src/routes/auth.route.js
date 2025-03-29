import express from "express";
import { checkAuth, login, logout, signup, updateProfile, getMyFriends, getPendingRequests, updateChatRequest, verifyRequests } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import upload from "../lib/multer.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/verify-requests", protectRoute, verifyRequests);

// Use multer middleware for profile picture uploads
router.put("/update-profile", protectRoute, upload.single('profilePic'), updateProfile);

router.get("/check", protectRoute, checkAuth);
router.get('/getmyfreinds', protectRoute, getMyFriends);
router.get('/getpendingrequests', protectRoute, getPendingRequests);
router.put('/updatechatrequest',protectRoute,updateChatRequest);

export default router;
