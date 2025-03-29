import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage, createGroup, getMyGroups, deleteChat, clearChat } from "../controllers/message.controller.js";
import upload from "../lib/multer.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.get("/my-groups", protectRoute, getMyGroups);
// Use multer middleware to handle file uploads
router.post("/send/:id", protectRoute, upload.single('image'), sendMessage);
router.post("/create-group",protectRoute,createGroup)
router.delete("/:id", protectRoute, deleteChat);
router.delete("/:id/clear", protectRoute, clearChat);

export default router;
