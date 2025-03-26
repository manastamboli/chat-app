import { Server, Socket } from "socket.io";
import http from "http";
import express from "express";
import ChatRequest from "../models/chatRequest.js";
import User from "../models/user.model.js";
const app = express();
const server = http.createServer(app);

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
const userSocketMap = {}; // {userId: socketId}

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
    }
  });

    socket.on("respondToChatRequest",async({requestId,status})=>{
      try {
        const request=await ChatRequest.findByIdAndUpdate(
          requestId,
          {status},
          {new:true}
        ).populate('sender receiver')

        
        io.to(request.receiver._id.toString()).emit('chatRequestResponse',{request});
        io.to(request.sender._id.toString()).emit('chatRequestResponse',{request});
          
        
      } catch (error) {
        console.error("Error in respondToChatRequest: ", error.message);
      }

    })
  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  // io.emit() is used to send events to all the connected clients
  io.emit("getOnlineUsers",Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };
