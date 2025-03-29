import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
import CryptoJS from "crypto-js";

// Load groups from localStorage if available
const getSavedGroups = () => {
  try {
    const savedGroups = localStorage.getItem('baatcheet-groups');
    return savedGroups ? JSON.parse(savedGroups) : [];
  } catch (error) {
    console.error('Error loading groups from localStorage:', error);
    return [];
  }
};

// Save groups to localStorage
const saveGroupsToStorage = (groups) => {
  try {
    localStorage.setItem('baatcheet-groups', JSON.stringify(groups));
  } catch (error) {
    console.error('Error saving groups to localStorage:', error);
  }
};

// Load group messages from localStorage
const getSavedGroupMessages = (groupId) => {
  try {
    const key = `baatcheet-group-messages-${groupId}`;
    const savedMessages = localStorage.getItem(key);
    return savedMessages ? JSON.parse(savedMessages) : [];
  } catch (error) {
    console.error(`Error loading messages for group ${groupId} from localStorage:`, error);
    return [];
  }
};

// Save group messages to localStorage
const saveGroupMessagesToStorage = (groupId, messages) => {
  try {
    const key = `baatcheet-group-messages-${groupId}`;
    localStorage.setItem(key, JSON.stringify(messages));
  } catch (error) {
    console.error(`Error saving messages for group ${groupId} to localStorage:`, error);
  }
};

// Clear all group messages from localStorage
const clearAllGroupMessages = () => {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('baatcheet-group-messages-')) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing group messages from localStorage:', error);
  }
};

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
  groups: getSavedGroups(), // Initialize from localStorage

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
      // Check if this is a group message request
      const isGroup = userId.toString().startsWith('group_');
      
      if (isGroup) {
        // Load messages from localStorage for groups
        const groupMessages = getSavedGroupMessages(userId);
        set({ messages: groupMessages });
      } else {
        // For regular users, fetch from API
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
      }
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
    if (!selectedUser) {
      console.log("Not subscribing to messages - no selected user");
      return;
    }
    
    const socket = useAuthStore.getState().socket;
    if (!socket) {
      console.log("Not subscribing to messages - no socket connection");
      return;
    }

    // Check if selected user is a group
    const isGroup = selectedUser.isGroup || false;
    console.log(`Subscribing to messages for ${isGroup ? 'group' : 'user'}: ${selectedUser.name || selectedUser.fullName}`);

    const handleNewMessage = async(newMessage) => {
      console.log(`Received ${isGroup ? 'group' : 'direct'} message:`, newMessage);
      
      if (isGroup) {
        // Handle group messages
        if (newMessage.groupId === selectedUser._id) {
          console.log("Message belongs to current group, processing...");
          
          // Only add if not already in the messages array
          const messageExists = get().messages.some(m => m._id === newMessage._id);
          
          if (!messageExists) {
            const currentMessages = get().messages;
            const newMessages = [...currentMessages, newMessage];
            
            // Sort by date (oldest first)
            const sortedMessages = newMessages.sort((a, b) => 
              new Date(a.createdAt) - new Date(b.createdAt)
            );
            
            console.log("Updating messages array with new group message");
            set({ messages: sortedMessages });
            
            // Save to localStorage
            saveGroupMessagesToStorage(selectedUser._id, sortedMessages);
          } else {
            console.log("Message already exists in state, not adding again");
          }
        } else {
          console.log("Message is for another group, ignoring");
        }
      } else {
        // Handle direct messages
        const isMessageForSelectedUser = 
          newMessage.senderId === selectedUser._id || 
          newMessage.receiverId === selectedUser._id;
        
        if (isMessageForSelectedUser) {
          console.log("Message is for current conversation, processing...");
          
          // Only add if not already in the messages array
          const messageExists = get().messages.some(m => m._id === newMessage._id);
          
          if (!messageExists) {
            const newMessages = [...get().messages, newMessage];
            // Sort by date (oldest first)
            const sortedMessages = newMessages.sort((a, b) => 
              new Date(a.createdAt) - new Date(b.createdAt)
            );
            
            console.log("Updating messages array with new direct message");
            set({
              messages: sortedMessages,
              allUserMessages: {
                ...get().allUserMessages,
                [selectedUser._id]: sortedMessages
              }
            });
          } else {
            console.log("Message already exists in state, not adding again");
          }
        } else {
          console.log("Message is for another conversation, ignoring");
        }
      }
    };

    console.log("Setting up message event listeners");
    socket.on("newMessage", handleNewMessage);
    socket.on("groupMessage", handleNewMessage);
    
    return () => {
      console.log("Removing message event listeners");
      socket.off("newMessage", handleNewMessage);
      socket.off("groupMessage", handleNewMessage);
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

  // Add group to store
  addGroup: (group) => {
    console.log("Adding group to store:", group);
    
    // Get auth user and socket
    const auth = useAuthStore.getState().authUser;
    const socket = useAuthStore.getState().socket;
    
    // Update groups array
    set(state => {
      const newGroups = [group, ...state.groups];
      console.log("New groups array:", newGroups);
      
      // Save to localStorage
      saveGroupsToStorage(newGroups);
      
      return { groups: newGroups };
    });
    
    // Initialize empty message array for this group
    saveGroupMessagesToStorage(group._id, []);
    
    // After adding the group, select it
    set({ selectedUser: group });
    
    // Emit group created event to all members if socket is available
    if (socket && auth) {
      try {
        // Create group notification for each member
        group.members.forEach(member => {
          // Don't send to yourself
          if (member._id !== auth._id) {
            console.log(`Notifying member ${member.fullName} about new group`);
            
            // Emit event to notify this member
            socket.emit("groupCreated", {
              group: group,
              createdBy: auth._id,
              memberId: member._id
            });
          }
        });
        
        console.log("Group creation notifications sent to all members");
      } catch (error) {
        console.error("Error sending group notifications:", error);
      }
    }
    
    console.log("Group created:", group);
    toast.success("Group created successfully!");
  },
  
  // Subscribe to new group events
  subscribeToNewGroups: () => {
    const socket = useAuthStore.getState().socket;
    const auth = useAuthStore.getState().authUser;
    
    if (!socket || !auth) {
      console.log("Cannot subscribe to groups - no socket or auth user");
      return () => {};
    }
    
    console.log("Subscribing to group events with user ID:", auth._id);
    
    const handleNewGroup = (data) => {
      console.log("Received new group event:", data);
      
      // Only process if this notification is for this user
      if (data.memberId === auth._id) {
        // Check if group already exists
        const groupExists = get().groups.some(g => g._id === data.group._id);
        
        if (!groupExists) {
          console.log("Adding new group to state:", data.group.name);
          
          // Add group to state
          set(state => {
            const updatedGroups = [data.group, ...state.groups];
            
            // Save to localStorage
            saveGroupsToStorage(updatedGroups);
            
            return { groups: updatedGroups };
          });
          
          // Initialize empty message array for this group
          saveGroupMessagesToStorage(data.group._id, []);
          
          // Show notification
          toast.success(`You've been added to the group "${data.group.name}"`);
        } else {
          console.log("Group already exists in state:", data.group.name);
        }
      } else {
        console.log("Group event not for this user. Event for:", data.memberId, "Current user:", auth._id);
      }
    };
    
    socket.on("groupCreated", handleNewGroup);
    console.log("Listening for 'groupCreated' events");
    
    return () => {
      console.log("Unsubscribing from group events");
      socket.off("groupCreated", handleNewGroup);
    };
  },
  
  // Get all groups (would call API in a real implementation)
  getGroups: async () => {
    // In a real app, you would fetch from the API
    console.log("Getting groups from localStorage");
    
    try {
      const savedGroups = getSavedGroups();
      console.log("Retrieved groups from localStorage:", savedGroups.length);
      
      const authUser = useAuthStore.getState().authUser;
      if (authUser) {
        console.log("Current auth user ID:", authUser._id);
        
        // Filter groups to show only those where the user is a member
        const userGroups = savedGroups.filter(group => 
          group.members && group.members.some(member => 
            member._id === authUser._id
          )
        );
        
        console.log("User's groups:", userGroups.length);
        set({ groups: userGroups });
        return userGroups;
      } else {
        console.log("No authenticated user found");
        set({ groups: [] });
        return [];
      }
    } catch (error) {
      console.error("Error getting groups:", error);
      return get().groups;
    }
  },
  
  // Send message to a group
  sendGroupMessage: async (messageData, groupId) => {
    const { groups, messages } = get();
    const auth = useAuthStore.getState().authUser;
    const socket = useAuthStore.getState().socket;
    
    if (!auth) return;
    
    // Find the group
    const group = groups.find(g => g._id === groupId);
    if (!group) return;
    
    // Extract text and image from FormData or use directly
    const messageText = messageData instanceof FormData 
      ? messageData.get('text') 
      : messageData.text || "";
    
    // For optimistic UI, use the image preview URL if available
    const imagePreview = messageData instanceof FormData
      ? (messageData.get('image') ? URL.createObjectURL(messageData.get('image')) : null)
      : messageData.image;
    
    // Create message
    const newMessage = {
      _id: Date.now().toString(),
      text: messageText || "",
      image: imagePreview,
      senderId: auth._id,
      senderName: auth.fullName,
      groupId: groupId,
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };
    
    // Add message to messages array for display in chat
    const updatedMessages = [...messages, newMessage];
    set({
      messages: updatedMessages
    });
    
    // Save messages to localStorage
    saveGroupMessagesToStorage(groupId, updatedMessages);
    
    // Update the group with the new message
    const updatedGroups = groups.map(g => 
      g._id === groupId 
        ? { 
            ...g, 
            lastMessage: {
              ...newMessage,
              isOptimistic: false // Remove optimistic flag for lastMessage
            } 
          } 
        : g
    );
    
    // Save updated groups to localStorage
    saveGroupsToStorage(updatedGroups);
    
    set({ groups: updatedGroups });
    
    // Emit socket event if available
    if (socket) {
      // Emit to all members of the group
      socket.emit("groupMessage", {
        ...newMessage,
        isOptimistic: false // Don't send optimistic flag to other users
      });
      
      console.log("Emitted group message via socket:", newMessage);
    }
    
    // In a real app with API, update the message after successful API call
    setTimeout(() => {
      // Remove optimistic flag after "sending"
      const currentMessages = get().messages;
      const updatedMessages = currentMessages.map(msg => 
        msg._id === newMessage._id ? { ...msg, isOptimistic: false } : msg
      );
      
      set({ messages: updatedMessages });
      
      // Update localStorage
      saveGroupMessagesToStorage(groupId, updatedMessages);
      
      // Revoke any object URLs to avoid memory leaks
      if (imagePreview && typeof imagePreview === 'string' && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      
      console.log("Group message sent:", newMessage);
    }, 500);
    
    console.log("Sending group message:", newMessage);
    
    return newMessage;
  },
  
  // Clear all group data from localStorage
  clearGroupData: () => {
    localStorage.removeItem('baatcheet-groups');
    clearAllGroupMessages();
  }
}));
