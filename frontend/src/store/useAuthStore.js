import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" 
  ? `http://${window.location.hostname}:5001`
  : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  chatRequests: [],
  acceptedRequests: [],
  socket: null,

  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
      console.log("onlineUsers",userIds);
    });

    // socket.on("sendChatRequest",({request,senderInfo})=>{
    //   set((state) => {
    //     console.log("Previous chatRequests:", state.chatRequests);
    //     const newState = {
    //       chatRequests: [...state.chatRequests, { ...request, senderInfo }]
    //     };
    //     console.log("New chatRequests in useAuthStore:", newState.chatRequests);
    //     return newState;
    //   });
    // })

    socket.on("sendChatRequest", (data) => {
      console.log("Received sendChatRequest event:", data);
      set((state) => {
        console.log("Previous chatRequests:", state.chatRequests);
        const newState = {
          chatRequests: [...state.chatRequests, { ...data.request, senderInfo: data.senderInfo }],
        };
        console.log("Updated chatRequests in useAuthStore:", newState.chatRequests);
        return newState;
      });
    });
    socket.onAny((eventName, ...args) => {
      console.log("Received event:", eventName, args);
    });

    socket.on("chatRequestResponse",({request})=>{
      if(request.status==="accepted"){
        set(state=>({
          acceptedRequests:[...state.acceptedRequests,request],
          chatRequests: state.chatRequests.filter(req=>req._id !== request._id)
        }
      ))

      }else{
        set(state=>({
          chatRequests: state.chatRequests.filter(req=>req._id !== request._id)
        }))
      }
    })


  },

  sendChatRequest: async(receiverId)=>{
    try {
      const{socket,authUser}=get();
      if(socket && authUser){
        socket.emit('sendChatRequest',{
          senderId:authUser._id,
          receiverId}
        )
        console.log("sendChatRequest in useAuthStore",{senderId:authUser._id,receiverId});
      }      
    } catch (error) {
      console.log("error in sendChatRequest:",error);
    }
  },

  respondToChatRequest: async(requestId,status)=>{
    try {
        const {socket}=get();
        if(socket){
          socket.emit('respondToChatRequest',{
            requestId,
            status
          })
        }      
    } catch (error) {
      console.log("error in respondToChatRequest:",error);
    }
  },

  
  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));
