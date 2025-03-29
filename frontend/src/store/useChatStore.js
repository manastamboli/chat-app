import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import CryptoJS from "crypto-js";

export const useChatStore = create((set, get) => ({
  messages: [],
  allUserMessages: {}, // Store messages for all users
  users: [],
  friends: [],
  pendingRequests: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  lastMessagesUpdate: null, // Timestamp to track last update

  getUsers: async (forceFetch = false) => {
    // If we fetched users recently (within 30 seconds), don't fetch again unless forced
    const lastUpdate = get().lastMessagesUpdate;
    const now = Date.now();
    if (lastUpdate && now - lastUpdate < 30000 && !forceFetch) {
      return;
    }

    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ 
        users: res.data,
        lastMessagesUpdate: now
      });
      
      // Fetch messages for each user in parallel
      const users = res.data;
      const messagesPromises = users.map(user => 
        axiosInstance.get(`/messages/${user._id}`)
          .then(res => ({ userId: user._id, messages: res.data }))
          .catch(error => {
            console.error(`Error fetching messages for user ${user._id}:`, error);
            return { userId: user._id, messages: [] };
          })
      );
      
      const results = await Promise.all(messagesPromises);
      
      // Update all user messages at once to avoid multiple state updates
      const newAllUserMessages = { ...get().allUserMessages };
      results.forEach(({ userId, messages }) => {
        // Sort messages by date (oldest first) before storing
        const sortedMessages = [...messages].sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
        newAllUserMessages[userId] = sortedMessages;
      });
      
      set({ allUserMessages: newAllUserMessages });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      // Sort messages by date (oldest first) before storing
      const sortedMessages = [...res.data].sort((a, b) => 
        new Date(a.createdAt) - new Date(b.createdAt)
      );
      set({ 
        messages: sortedMessages,
        allUserMessages: {
          ...get().allUserMessages,
          [userId]: sortedMessages
        }
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  getFriends: async () => {
    //const{friends}=get();
    try {
      const res=await axiosInstance.get('auth/getmyfreinds');
      set({friends:res.data});
      console.log("friends in useChatStore",res.data);
      console.log("friends in useChatStore",get().friends);
      console.log("res",res);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to fetch friends");
    }
  },

  getPendingRequests: async () => {
    try {
      const res=await axiosInstance.get('/auth/getpendingrequests');
      set({pendingRequests:res.data});
      console.log("getPendingRequests in useChatStore");
      console.log("pendingRequests in useChatStore",res.data);
      console.log("pendingRequests in useChatStore variable",get().pendingRequests);
    } catch (error) {
      console.log("Error in getPendingRequests",error.message);
      toast.error(error.response?.data?.message || "Failed to fetch pending requests");
    }
  },
  
  // sendMessage: async (messageData) => {
  //   const { selectedUser, messages, authUser } = get();
  //   const auth = useAuthStore.getState().authUser;
    
  //   if (!selectedUser || !auth) return;
    
  //   // Create optimistic message
  //   const optimisticMessage = {
  //     _id: Date.now().toString(), // Temporary ID
  //     text: messageData.text || "",
  //     image: messageData.image || null,
  //     senderId: auth._id,
  //     receiverId: selectedUser._id,
  //     createdAt: new Date().toISOString(),
  //     isOptimistic: true // Flag to identify optimistic updates
  //   };
    
  //   // Update UI immediately with optimistic message (add to end for chronological order)
  //   const newMessages = [...messages, optimisticMessage];
  //   set({ 
  //     messages: newMessages,
  //     allUserMessages: {
  //       ...get().allUserMessages,
  //       [selectedUser._id]: newMessages
  //     }
  //   });
    
  //   try {
  //     const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      
  //     // Replace optimistic message with real one
  //     const updatedMessages = get().messages.map(msg => 
  //       msg.isOptimistic ? res.data : msg
  //     );
      
  //     set({ 
  //       messages: updatedMessages,
  //       allUserMessages: {
  //         ...get().allUserMessages,
  //         [selectedUser._id]: updatedMessages
  //       }
  //     });
      
  //     return res.data;
  //   } catch (error) {
  //     // Remove optimistic message on error
  //     const filteredMessages = get().messages.filter(msg => !msg.isOptimistic);
  //     set({ 
  //       messages: filteredMessages,
  //       allUserMessages: {
  //         ...get().allUserMessages,
  //         [selectedUser._id]: filteredMessages
  //       }
  //     });
      
  //     toast.error(error.response?.data?.message || "Failed to send message");
  //     throw error;
  //   }
  // },


  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    const auth = useAuthStore.getState().authUser;
    const socket = useAuthStore.getState().socket;
  
    if (!selectedUser || !auth || !socket) return;
  
    // Extract text from FormData or use directly if it's a regular object
    const messageText = messageData instanceof FormData 
      ? messageData.get('text') 
      : messageData.text || "";
    
    // For optimistic UI, we use the image preview URL if available
    const imagePreview = messageData instanceof FormData
      ? (messageData.get('image') ? URL.createObjectURL(messageData.get('image')) : null)
      : messageData.image;
    
    // Create optimistic UI update
    const optimisticMessage = {
      _id: Date.now().toString(), // Temporary ID
      text: messageText || "",
      image: imagePreview,
      senderId: auth._id,
      receiverId: selectedUser._id,
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };
  
    set({
      messages: [...messages, optimisticMessage],
      allUserMessages: {
        ...get().allUserMessages,
        [selectedUser._id]: [...messages, optimisticMessage]
      }
    });
    
    try {
      // If using WebSocket for optimistic UI, emit basic message text
      // But actual file upload happens via HTTP
      socket.emit("sendMessage", {
        senderId: auth._id,
        receiverId: selectedUser._id,
        text: messageText,
        createdAt: new Date().toISOString()
      });
      
      // Save message to database via API
      // Use FormData directly if that's what was passed
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`, 
        messageData,
        // If using FormData, we need to set the correct content type
        messageData instanceof FormData 
          ? { headers: { 'Content-Type': 'multipart/form-data' } }
          : {}
      );
  
      // Replace optimistic message with the real one from API
      const updatedMessages = get().messages.map(msg => 
        msg.isOptimistic ? res.data : msg
      );
  
      set({
        messages: updatedMessages,
        allUserMessages: {
          ...get().allUserMessages,
          [selectedUser._id]: updatedMessages
        }
      });
      
      // Revoke the object URL to avoid memory leaks
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
  
      return res.data;
    } catch (error) {
      // Remove optimistic message on error
      const filteredMessages = get().messages.filter(msg => !msg.isOptimistic);
      set({
        messages: filteredMessages,
        allUserMessages: {
          ...get().allUserMessages,
          [selectedUser._id]: filteredMessages
        }
      });
      
      // Revoke the object URL on error to avoid memory leaks
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
  
      toast.error(error.response?.data?.message || "Failed to send message");
      throw error;
    }
  },

  subscribeToMessages: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    const handleNewMessage = async(newMessage) => {
      // We'll store the encrypted message and decrypt only when rendering
      const isMessageForSelectedUser = 
        newMessage.senderId === selectedUser._id || 
        newMessage.receiverId === selectedUser._id;
      
      if (isMessageForSelectedUser) {
        // Only add if not already in the messages array
        const messageExists = get().messages.some(m => m._id === newMessage._id);
        
        if (!messageExists) {
          const newMessages = [...get().messages, newMessage];
          // Sort by date (oldest first)
          const sortedMessages = newMessages.sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
          );
          
          set({
            messages: sortedMessages,
            allUserMessages: {
              ...get().allUserMessages,
              [selectedUser._id]: sortedMessages
            }
          });
        }
      }
    };

    socket.on("newMessage", handleNewMessage);
    
    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  },

  subscribeToAllMessages: () => {
    const socket = useAuthStore.getState().socket;
    const authUser = useAuthStore.getState().authUser;
    
    if (!socket || !authUser) return () => {};
    
    const handleNewMessage = async(newMessage) => {
      // Determine which user this message is from/to
      const otherUserId = newMessage.senderId === authUser._id 
        ? newMessage.receiverId 
        : newMessage.senderId;
      
      // Check if message already exists
      const userMessages = get().allUserMessages[otherUserId] || [];
      const messageExists = userMessages.some(m => m._id === newMessage._id);
      
      if (!messageExists) {
        // Add it to allUserMessages
        const updatedMessages = [...userMessages, newMessage];
        // Sort by date (oldest first)
        const sortedMessages = updatedMessages.sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
        
        set((state) => ({
          allUserMessages: {
            ...state.allUserMessages,
            [otherUserId]: sortedMessages
          },
          // Update the timestamp
          lastMessagesUpdate: Date.now()
        }));
        
        // If we're viewing this user, also update messages array
        const selectedUser = get().selectedUser;
        if (selectedUser && (
            (newMessage.senderId === selectedUser._id && newMessage.receiverId === authUser._id) ||
            (newMessage.senderId === authUser._id && newMessage.receiverId === selectedUser._id)
          )) {
          
          const currentMessages = get().messages;
          const msgExists = currentMessages.some(m => m._id === newMessage._id);
          
          if (!msgExists) {
            const updatedMessages = [...currentMessages, newMessage];
            // Sort by date (oldest first)
            const sortedMessages = updatedMessages.sort((a, b) => 
              new Date(a.createdAt) - new Date(b.createdAt)
            );
            
            set((state) => ({
              messages: sortedMessages
            }));
          }
        }
      }
    };
    
    socket.on("newMessage", handleNewMessage);
    
    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
    }
  },

  getLatestMessage: (userId) => {
    const userMessages = get().allUserMessages[userId] || [];
    if (userMessages.length === 0) return null;
    
    // Sort by createdAt in descending order and take the first one
    return userMessages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),

  deleteChat: async (userId) => {
    try {
      await axiosInstance.delete(`/api/messages/${userId}`);
      set((state) => ({
        messages: state.messages.filter(
          (message) => 
            !(message.senderId === userId || message.receiverId === userId)
        ),
      }));
      toast.success("Chat deleted successfully");
    } catch (error) {
      toast.error(error.response?.data?.error || "Error deleting chat");
    }
  },

  clearChat: async (userId) => {
    try {
      await axiosInstance.delete(`/api/messages/${userId}/clear`);
      set((state) => ({
        messages: state.messages.filter(
          (message) => 
            !(message.senderId === userId || message.receiverId === userId)
        ),
      }));
      toast.success("Chat cleared successfully");
    } catch (error) {
      toast.error(error.response?.data?.error || "Error clearing chat");
    }
  },
}));
