import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
//import cloudinary from "../lib/cloudinary.js";
import ChatRequest from "../models/chatRequest.js";
import fs from "fs";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      // generate jwt token here
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // When using multer, the file is available in req.file
    if (!req.file) {
      return res.status(400).json({ message: "Profile picture is required" });
    }

    try {
      // Upload file from multer's temporary storage to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(req.file.path);
      
      // Update user profile with the Cloudinary URL
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePic: uploadResponse.secure_url },
        { new: true }
      );

      // Delete the temporary file after successful upload
      fs.unlinkSync(req.file.path);

      res.status(200).json(updatedUser);
    } catch (cloudinaryError) {
      console.log("Error uploading to cloudinary:", cloudinaryError);
      
      // Still delete the temp file if cloudinary upload fails
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(500).json({ message: "Failed to upload profile picture" });
    }
  } catch (error) {
    // Clean up temporary file if something went wrong
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.log("Error in update profile:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const checkAuth = (req, res) => {
  try {
    res.status(200).json(req.user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMyFriends = async (req, res) => {
  try {
    const userid = req.user;

    // Get all chat requests where the user is either the sender or receiver
    const sentRequests = await ChatRequest.find({ sender: userid, status: 'accepted' });
    const receivedRequests = await ChatRequest.find({ receiver: userid, status: 'accepted' });
    console.log("sentRequests", sentRequests);
    console.log("receivedRequests", receivedRequests);

    // Extract friend IDs from both sent and received requests
    const friendsFromSent = sentRequests.map(request => request.receiver);
    const friendsFromReceived = receivedRequests.map(request => request.sender);
    
    // Combine all friend IDs
    const allFriendIds = [...friendsFromSent, ...friendsFromReceived];

    if (allFriendIds.length > 0) {
      console.log("Finding friends");
      const myfreinds = await User.find({_id: {$in: allFriendIds}});
      console.log("friends", myfreinds);
      return res.status(200).json(myfreinds);
    } else {
      return res.status(200).json([]);
    }
  } catch (error) {
    console.log("Error in getMyFriends controller", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getPendingRequests = async(req, res) => {
  try {
    console.log("getPendingRequests controller executed");
    const userid = req.user;
    
    // Get pending requests
    const pendingRequest = await ChatRequest.find({receiver: userid, status: 'pending'}).catch((err) => {
      console.log("Error in getPendingRequests model", err.message);
      return res.status(500).json({ message: "Internal Server Error" });
    });
    
    if(!pendingRequest || pendingRequest.length === 0) {
      return res.status(200).json([]);
    } else {
      // Get accepted requests to filter out users who are already friends
      const acceptedSentRequests = await ChatRequest.find({ sender: userid, status: 'accepted' });
      const acceptedReceivedRequests = await ChatRequest.find({ receiver: userid, status: 'accepted' });
      
      // Extract friend IDs from both sent and received accepted requests
      const friendsFromSent = acceptedSentRequests.map(request => request.receiver.toString());
      const friendsFromReceived = acceptedReceivedRequests.map(request => request.sender.toString());
      
      // Combine all friend IDs
      const allFriendIds = [...friendsFromSent, ...friendsFromReceived];
      
      console.log("Existing friend IDs:", allFriendIds);
      
      // Get sender IDs from pending requests
      const pendingRequestSenderIds = pendingRequest.map(request => request.sender.toString());
      
      // Filter out senders who are already friends
      const nonFriendSenderIds = pendingRequestSenderIds.filter(senderId => 
        !allFriendIds.includes(senderId)
      );
      
      console.log("Filtered sender IDs (excluding friends):", nonFriendSenderIds);
      
      if(nonFriendSenderIds.length === 0) {
        return res.status(200).json([]);
      }
      
      // Get user information for non-friend senders
      const pendingUsers = await User.find({_id: {$in: nonFriendSenderIds}});
      return res.status(200).json(pendingUsers);
    }
  } catch (error) {
    console.log("Error in getPendingRequests controller", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export const updateChatRequest = async(req,res)=>{
  try {
    console.log("updateChatRequest controller executed");
    const {requestId,status}=req.body;
    const updatedRequest=await ChatRequest.findByIdAndUpdate(requestId,{status},{new:true});
    console.log("updatedRequest",updatedRequest);
    return res.status(200).json(updatedRequest);
  } catch (error) {
    console.log("Error in updateChatRequest controller", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export const verifyRequests = async(req, res) => {
  try {
    const { requestIds } = req.body;
    
    if (!requestIds || !Array.isArray(requestIds)) {
      return res.status(400).json({ message: "Invalid request IDs" });
    }
    
    // Find which request IDs still exist in the database
    const existingRequests = await ChatRequest.find({
      _id: { $in: requestIds }
    }).select('_id');
    
    // Extract just the ID strings
    const validRequestIds = existingRequests.map(req => req._id.toString());
    
    return res.status(200).json({ validRequestIds });
  } catch (error) {
    console.log("Error in verifyRequests controller", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};