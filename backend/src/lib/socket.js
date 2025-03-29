import { Server, Socket } from "socket.io";
import http from "http";
import express from "express";
import ChatRequest from "../models/chatRequest.js";
import User from "../models/user.model.js";
import CryptoJS from "crypto-js";
const app = express();
const server = http.createServer(app);
import dotenv from "dotenv";
dotenv.config();

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}





// used to store online users
const userSocketMap = {}; 

io.on("connection", (socket) => {
  console.log("A user connected", socket.id);

  // socket.on("sendChatRequest",async({senderId,receiverId})=>{
  //   try {
  //     const newRequest = await ChatRequest.create({
  //       sender: senderId,
  //       receiver: receiverId,
  //       status: 'pending'
  //     });
  //     console.log("newChatRequest",newRequest);
    
  //     io.to(receiverId).emit('sendChatRequest',{
  //       request:newRequest,
  //       senderInfo:await User.findById(senderId).select('fullName profilePicture')
  //     })
      
  //   } catch (error) {
  //     console.error("Error in sendChatRequest: ", error.message);
  //   }
  //   })

  socket.on("sendChatRequest", async ({ senderId, receiverId }) => {
    try {
      // Check if there's already a pending or accepted request between these users
      const existingRequest = await ChatRequest.findOne({
        $or: [
          { sender: senderId, receiver: receiverId },
          { sender: receiverId, receiver: senderId }
        ],
        status: { $in: ['pending', 'accepted'] }
      });
      
      if (existingRequest) {
        console.log("Chat request already exists:", existingRequest);
        socket.emit('chatRequestError', {
          message: 'A chat request between these users already exists',
          requestId: existingRequest._id
        });
        return;
      }
      
      const newRequest = await ChatRequest.create({
        sender: senderId,
        receiver: receiverId,
        status: "pending",
      });
  
      console.log("New chat request created:", newRequest);
  
      const receiverSocketId = getReceiverSocketId(receiverId);
      console.log("Receiver Socket ID:", receiverSocketId);
  
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("sendChatRequest", {
          request: newRequest,
          senderInfo: await User.findById(senderId).select("fullName profilePicture"),
        });
        console.log(`sendChatRequest event emitted to ${receiverSocketId}`);
      } else {
        console.log(`User ${receiverId} is offline, request saved in DB.`);
      }
    } catch (error) {
      console.error("Error in sendChatRequest: ", error.message);
      socket.emit('chatRequestError', {
        message: error.message
      });
    }
  });

    socket.on("respondToChatRequest",async({requestId,status})=>{
      try {
        console.log("respondToChatRequest event received:",{requestId,status});
        
        // First try to find by _id
        let request = await ChatRequest.findByIdAndUpdate(
          requestId,
          {status},
          {new:true}
        ).populate('sender receiver');
        
        // If not found by _id, try to find by sender field
        if (!request) {
          console.log(`Request not found by ID ${requestId}, checking by sender field`);
          request = await ChatRequest.findOneAndUpdate(
            { sender: requestId, status: 'pending' },
            { status },
            { new: true }
          ).populate('sender receiver');
        }
        
        console.log("request after lookup:", request);
        
        if (!request) {
          console.error(`Chat request with ID/sender ${requestId} not found`);
          // Send error response back to the client who initiated the request
          socket.emit('chatRequestError', {
            message: `Chat request with ID/sender ${requestId} not found`,
            requestId
          });
          return;
        }
        
        console.log("chatRequestResponse event emitted:",{request});  
        io.to(request.receiver._id.toString()).emit('chatRequestResponse',{request});
        io.to(request.sender._id.toString()).emit('chatRequestResponse',{request});
          
        
      } catch (error) {
        console.error("Error in respondToChatRequest: ", error.message);
        // Send error response back to the client
        socket.emit('chatRequestError', {
          message: error.message,
          requestId
        });
      }

    })
  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers",Object.keys(userSocketMap));

  socket.on("sendMessage", async ({ senderId, receiverId, text, image }) => {
    console.log(`Message from ${senderId} to ${receiverId}:`, text);
   const encyptText=await CryptoJS.AES.encrypt(text,"key").toString();
   console.log("encyptText",encyptText);
    const newMessage = {
      senderId,
      receiverId,
      text:encyptText,
      image,
      createdAt: new Date().toISOString(),
    };
    console.log("newMessage",newMessage);
    // Find receiver socket ID
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
      console.log(`Message delivered to ${receiverSocketId}`);
    } else {
      console.log(`User ${receiverId} is offline, message not delivered in real-time.`);
    }
  });
  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
