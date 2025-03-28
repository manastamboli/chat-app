import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import ChatRequest from "../models/chatRequest.js";

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
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );

    res.status(200).json(updatedUser);
  } catch (error) {
    console.log("error in update profile:", error);
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

// export const getMyFriends=async(req,res)=>{
//   try {
//      const userid=req.user;
     
//      const chatRequests=await ChatRequest.find({sender:userid});
//      console.log("chatRequests",chatRequests);
//      if(chatRequests.status=='accepted'){
//       console.log("if executed");
//       const friends=chatRequests.map(request=>request.receiver);
//       return res.status(200).json(friends);
//      }
//      else{
//       return res.status(200).json([]);
//      }
     
//   } catch (error) {
//     console.log("Error in getMyFriends controller", error.message);
//     return res.status(500).json({ message: "Internal Server Error" });
//   }
// }

export const getMyFriends = async (req, res) => {
  try {
    const userid = req.user;

    // Get all chat requests where the user is the sender
    const chatRequests = await ChatRequest.find({ sender: userid });
    console.log("chatRequests", chatRequests);

    // Filter requests that have status 'accepted'
    const acceptedRequests = chatRequests.filter(request => request.status === 'accepted');

    if (acceptedRequests.length > 0) {
      console.log("if executed");
      const friends = acceptedRequests.map(request => request.receiver);
      const myfreinds=await User.find({_id:{$in:friends}});
      console.log("friends",myfreinds);
      return res.status(200).json(myfreinds);
    } else {
      return res.status(200).json([]);
    }
  } catch (error) {
    console.log("Error in getMyFriends controller", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getPendingRequests=async(req,res)=>{
  try {
    console.log("getPendingRequests controller executed");
    const userid=req.user;
    const pendingRequest=await ChatRequest.find({receiver:userid,status:'pending'}).catch((err)=>{
      console.log("Error in getPendingRequests model", err.message);
      return res.status(500).json({ message: "Internal Server Error" });
    });
    if(!pendingRequest){
      return res.status(200).json([]);
    }
    else{
      const pendingRequests=pendingRequest.map(request=>request.sender);
      const pendingUsers=await User.find({_id:{$in:pendingRequests}});
      return res.status(200).json(pendingUsers);
    }
  } catch (error) {
    console.log("Error in getPendingRequests controller", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}