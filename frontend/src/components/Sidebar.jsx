import { useEffect, useState, useMemo, memo } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Search, MessageCircle, Plus, Settings, Image, Check, CheckCheck } from "lucide-react";
import { motion } from "framer-motion";
import { formatMessageTime } from "../lib/utils";

// Memoized contact component for better performance
const Contact = memo(({ user, selectedUserId, onlineUsers, messagePreview, onSelect }) => {
  const { text, time, isYou, isImage, isSeen, isOptimistic } = messagePreview;
  const isSelected = selectedUserId === user._id;
  const isOnline = onlineUsers.includes(user._id);
  
  return (
    <motion.button
      onClick={() => onSelect(user)}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`
        w-full p-3 flex items-center gap-3 rounded-xl transition-all
        hover:bg-[#1A2737] active:bg-[#2A3747]
        ${isSelected ? "bg-[#1A2737] shadow-lg shadow-black/5" : ""}
      `}
    >
      <div className="relative">
        <img
          src={user.profilePic || "/avatar.png"}
          alt={user.fullName}
          className="size-12 rounded-full object-cover ring-2 ring-[#1A2737]"
        />
        {isOnline && (
          <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-[#0F1C2E]" />
        )}
      </div>

      <div className="flex-1 text-left">
        <div className="flex items-center justify-between">
          <span className="text-white font-medium">{user.fullName}</span>
          <span className="text-xs text-gray-400">{time}</span>
        </div>
        <div className="flex items-center gap-2">
          {isImage && (
            <span className="text-[#4B96F8]">
              <Image size={14} />
            </span>
          )}
          {isYou && (
            <span className={`${isSeen ? "text-[#4B96F8]" : "text-gray-400"}`}>
              {isSeen ? <CheckCheck size={14} /> : <Check size={14} />}
            </span>
          )}
          <p 
            className={`text-sm truncate ${
              isOptimistic 
                ? "italic text-gray-400" 
                : isYou && !isSeen 
                  ? "font-medium text-[#4B96F8]" 
                  : "text-gray-400"
            }`}
          >
            {text}
          </p>
        </div>
      </div>
    </motion.button>
  );
});

Contact.displayName = "Contact";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading, getLatestMessage } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch users initially and then periodically
  useEffect(() => {
    getUsers();
    
    // Refresh user list every 30 seconds
    const intervalId = setInterval(() => {
      getUsers(true);  // Force fetch
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [getUsers]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => 
    users.filter(user => 
      user.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [users, searchQuery]
  );

  // Get the latest message preview for each user
  const getLatestMessagePreview = (userId) => {
    const latestMessage = getLatestMessage(userId);
    if (!latestMessage) return { 
      text: "No messages yet", 
      time: "", 
      isYou: false,
      isImage: false,
      isSeen: false,
      isOptimistic: false
    };
    
    const isYou = latestMessage.senderId === authUser?._id;
    let text = latestMessage.text || (latestMessage.image ? "Sent an image" : "");
    if (isYou) {
      text = text; // Don't prepend "You: " anymore as we'll show icons instead
    }
    
    return {
      text,
      time: formatMessageTime(latestMessage.createdAt),
      isYou,
      isImage: !!latestMessage.image,
      isSeen: !!latestMessage.seen,
      isOptimistic: !!latestMessage.isOptimistic
    };
  };

  // Sort users by most recent message
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const msgA = getLatestMessage(a._id);
      const msgB = getLatestMessage(b._id);
      
      // If no messages, put at bottom
      if (!msgA && !msgB) return 0;
      if (!msgA) return 1;
      if (!msgB) return -1;
      
      // Sort by timestamp
      return new Date(msgB.createdAt) - new Date(msgA.createdAt);
    });
  }, [filteredUsers, getLatestMessage]);

  if (isUsersLoading && users.length === 0) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-[280px] bg-[#0F1C2E] flex flex-col border-r border-[#1A2737]">
      {/* Header with user profile */}
      <div className="p-4 flex items-center justify-between border-b border-[#1A2737]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img 
              src={authUser?.profilePic || "/avatar.png"} 
              alt="profile" 
              className="size-10 rounded-full object-cover ring-2 ring-[#4B96F8]/20"
            />
            <span className="absolute bottom-0 right-0 size-2.5 bg-green-500 rounded-full ring-2 ring-[#0F1C2E]" />
          </div>
          <div>
            <h2 className="font-medium text-white">{authUser?.fullName}</h2>
            <p className="text-xs text-[#4B96F8]">Active</p>
          </div>
        </div>
        <button className="btn btn-circle btn-sm bg-[#1A2737] border-none hover:bg-[#2A3747] transition-all">
          <Settings className="size-4 text-[#4B96F8]" />
        </button>
      </div>

      {/* Messages header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-[#4B96F8]/10 p-1.5 rounded-lg">
            <MessageCircle className="size-5 text-[#4B96F8]" />
          </div>
          <div>
            <h3 className="text-white font-medium">Messages</h3>
            <p className="text-xs text-gray-400">{users.length} contacts</p>
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn btn-sm px-3 bg-[#4B96F8] text-white hover:bg-[#4B96F8]/90 border-none"
        >
          <Plus size={16} className="mr-1" />
          New Chat
        </motion.button>
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 group-focus-within:text-[#4B96F8] transition-colors" />
          <input
            type="text"
            placeholder="Search messages"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#1A2737] text-white rounded-xl text-sm 
            focus:outline-none focus:ring-2 focus:ring-[#4B96F8]/50 transition-all
            placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {sortedUsers.map((user) => (
          <Contact
            key={user._id}
            user={user}
            selectedUserId={selectedUser?._id}
            onlineUsers={onlineUsers}
            messagePreview={getLatestMessagePreview(user._id)}
            onSelect={setSelectedUser}
          />
        ))}

        {filteredUsers.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-gray-400 py-12 px-4"
          >
            <div className="bg-[#1A2737] size-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="size-8 opacity-50" />
            </div>
            <h3 className="font-medium text-white mb-1">No contacts found</h3>
            <p className="text-sm">
              {searchQuery 
                ? "Try a different search term" 
                : "Add some friends to start chatting"}
            </p>
          </motion.div>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;

