import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import CryptoJS from "crypto-js";
import Group from "../models/groups.js";
import fs from "fs";
import { getReceiverSocketId, io } from "../lib/socket.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { constants } from "fs/promises";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
    console.log("filteredUsers",filteredUsers);
    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {

    const { text } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let imageUrl = null;
    
    // Check if there's a file to upload
    console.log("req.file",req.file);
    if (req.file) {
      try {
           
        // Upload file to cloudinary
        const uploadResponse = await uploadOnCloudinary(req.file.path);
        imageUrl = uploadResponse.secure_url;
        console.log("Image uploaded successfully:", uploadResponse);
        
        // Delete the temporary file after successful upload
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (cloudinaryError) {
        console.log("Error uploading to cloudinary:", cloudinaryError.message);
        
        // Still delete the temp file if cloudinary upload fails
        if (req.file.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        return res.status(500).json({ error: "Failed to upload image" });
      }
    }

    // If no text is provided and there's no image, return an error
    if (!text && !imageUrl) {
      return res.status(400).json({ error: "Message cannot be empty" });
    }

    // Encrypt the text (only if text exists)
    const encryptText = text ? CryptoJS.AES.encrypt(text, 'key').toString() : "";
    
    const newMessage = new Message({
      senderId,
      receiverId,
      text: encryptText,
      image: imageUrl,
    });

    await newMessage.save();

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    // Clean up temporary file if something went wrong
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.log("Error in sendMessage controller:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUsersApproval=async(req,res)=>{
  try {
    const {approval}=req.body;
    const {id:userId}=req.params;
    const user=await User.findById(userId);
    
    
  } catch (error) {
    console.log("Error in getUsersApproval controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}
export const createGroup=async(req,res)=>{
  try {
    const {name,members}=req.body;
    const admin=req.user;

    const group=await Group.create({
      name,
      members:[...members,admin._id],
      admin:admin._id

    })

    return res.status(201).json({message:"Group created succesfully",
      group
    }
    );
  } catch (error) {
    console.log("Error in createGroup controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

export const getMyGroups=async(req,res)=>{
  try {
    const id=req.user._id;
    const groups=await Group.find({members:id}).populate("members","_id fullName profilePic");

    if(!groups){
      return res.status(404).json({message:"No groups found"});
    }

    return res.status(200).json(groups);

   
  } catch (error) {
    console.log("Error in getMyGroups controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

export const sendGroupMessage=async(req,res)=>{
  try {
    const {text,groupId}=req.body;
    const sender=req.user;
    let imageUrl=null;
    const image=req.file;
    if(image){
      const uploadResponse=await uploadOnCloudinary(image.path);
      imageUrl=uploadResponse.secure_url;
    }
    const group= await Group.findById(groupId);
    if(!group){
      return res.status(404).json({message:"Group not found"});
    }

    const message=await Message.create({
      senderId:sender._id,
      groupId,
      text,
      image:imageUrl
    })

    return res.status(201).json({message:"Message sent successfully",
      message
    })
  } catch (error) {
    console.log("Error in sendGroupMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

export const getGroupMessages=async(req,res)=>{
  try {
    const {groupId}=req.params;
    const messages=await Message.find({groupId}).populate("senderId", "_id fullName profilePic");
    return res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getGroupMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

