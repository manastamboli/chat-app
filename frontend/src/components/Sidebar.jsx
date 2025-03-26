import { useEffect, useState, useMemo, memo } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { 
  Users, 
  Search, 
  MessageCircle, 
  Plus, 
  Settings, 
  Image, 
  Check, 
  CheckCheck, 
  Archive, 
  UserPlus, 
  LogOut,
  User
} from "lucide-react";
import { motion } from "framer-motion";
import { formatMessageTime } from "../lib/utils";
import { Link } from "react-router-dom";

// Memoized contact component for better performance
const Contact = memo(({ user, selectedUserId, onlineUsers, messagePreview, onSelect, isArchived = false }) => {
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
        ${isArchived ? "opacity-70" : ""}
      `}
    >
      <div className="relative">
        <img
          src={user.profilePic || "/avatar.png"}
          alt={user.fullName}
          className="size-12 rounded-full object-cover ring-2 ring-[#1A2737]"
        />
        {isOnline && !isArchived && (
          <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-[#0F1C2E]" />
        )}
        {isArchived && (
          <span className="absolute bottom-0 right-0 size-3 bg-gray-500 rounded-full ring-2 ring-[#0F1C2E] flex items-center justify-center">
            <Archive size={8} className="text-white" />
          </span>
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

// Friend component for the friends tab
const Friend = memo(({ user, onlineUsers, onStartChat }) => {
  const isOnline = onlineUsers.includes(user._id);
  
  return (
    <div className="p-3 flex items-center justify-between rounded-xl hover:bg-[#1A2737] transition-all">
      <div className="flex items-center gap-3">
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
        <div className="text-left">
          <h3 className="text-white font-medium">{user.fullName}</h3>
          <p className="text-xs text-gray-400">{isOnline ? "Online" : "Offline"}</p>
        </div>
      </div>
      <button 
        onClick={() => onStartChat(user)}
        className="btn btn-sm btn-circle bg-[#1A2737] hover:bg-[#2A3747] border-none"
      >
        <MessageCircle size={16} className="text-[#4B96F8]" />
      </button>
    </div>
  );
});

Friend.displayName = "Friend";

// Add Friend Form Component
const AddFriendForm = ({ onClose }) => {
  const [email, setEmail] = useState("");
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would implement the actual friend request logic
    // For now we just close the form
    onClose();
  };
  
  return (
    <div className="p-4 bg-[#1A2737] rounded-xl">
      <h3 className="text-white font-medium mb-3">Add a Friend</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-[#0F1C2E] border border-[#2A3747] rounded-lg p-2 text-white mb-3"
          required
        />
        <div className="flex justify-end gap-2">
          <button 
            type="button" 
            onClick={onClose}
            className="btn btn-sm bg-[#0F1C2E] hover:bg-[#1A2737] border-none text-white"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="btn btn-sm bg-[#4B96F8] hover:bg-[#4B96F8]/90 border-none text-white"
          >
            Send Request
          </button>
        </div>
      </form>
    </div>
  );
};

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading, getLatestMessage } = useChatStore();
  const { onlineUsers, authUser, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("messages");
  const [showAddFriend, setShowAddFriend] = useState(false);
  
  // Mock archived chats - in a real app you would fetch these from the backend
  const [archivedChats] = useState([
    // We're using a subset of the users as "archived" chats for demonstration
    ...(users.slice(0, 2) || [])
  ]);

  // Listen for the custom event to show the Friends tab
  useEffect(() => {
    const handleShowFriendsTab = () => {
      setActiveTab("friends");
      setShowAddFriend(true);
    };
    
    window.addEventListener('showFriendsTab', handleShowFriendsTab);
    
    return () => {
      window.removeEventListener('showFriendsTab', handleShowFriendsTab);
    };
  }, []);

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
      {/* App branding and title */}
      <div className="p-4 border-b border-[#1A2737] flex items-center gap-2">
        <div className="size-10 rounded-xl bg-[#4B96F8]/15 flex items-center justify-center shadow-sm">
          <MessageCircle className="size-5 text-[#4B96F8]" />
        </div>
        <h1 className="text-xl font-bold text-white">BaatCheet</h1>
      </div>
      
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
        <div className="flex gap-1">
          <Link to="/profile" className="btn btn-circle btn-sm bg-[#1A2737] border-none hover:bg-[#2A3747] transition-all">
            <User className="size-4 text-[#4B96F8]" />
          </Link>
          <Link to="/settings" className="btn btn-circle btn-sm bg-[#1A2737] border-none hover:bg-[#2A3747] transition-all">
            <Settings className="size-4 text-[#4B96F8]" />
          </Link>
          <button 
            onClick={logout} 
            className="btn btn-circle btn-sm bg-[#1A2737] border-none hover:bg-[#2A3747] transition-all"
          >
            <LogOut className="size-4 text-[#4B96F8]" />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-[#1A2737]">
        <button
          onClick={() => setActiveTab("messages")}
          className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
            activeTab === "messages" ? "text-[#4B96F8]" : "text-gray-400"
          }`}
        >
          Messages
          {activeTab === "messages" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4B96F8]"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab("friends")}
          className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
            activeTab === "friends" ? "text-[#4B96F8]" : "text-gray-400"
          }`}
        >
          Friends
          {activeTab === "friends" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4B96F8]"></div>
          )}
        </button>
        <button
          onClick={() => setActiveTab("archived")}
          className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
            activeTab === "archived" ? "text-[#4B96F8]" : "text-gray-400"
          }`}
        >
          Archived
          {activeTab === "archived" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4B96F8]"></div>
          )}
        </button>
      </div>

      {/* Search & Action Bar */}
      <div className="p-4 flex items-center justify-between">
        <div className="relative group flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 group-focus-within:text-[#4B96F8] transition-colors" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#1A2737] text-white rounded-xl text-sm 
            focus:outline-none focus:ring-2 focus:ring-[#4B96F8]/50 transition-all
            placeholder:text-gray-400"
          />
        </div>
        
        {activeTab === "messages" && (
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-circle btn-sm ml-2 bg-[#4B96F8] text-white hover:bg-[#4B96F8]/90 border-none"
          >
            <Plus size={16} />
          </motion.button>
        )}
        
        {activeTab === "friends" && (
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddFriend(true)}
            className="btn btn-circle btn-sm ml-2 bg-[#4B96F8] text-white hover:bg-[#4B96F8]/90 border-none"
          >
            <UserPlus size={16} />
          </motion.button>
        )}
        
        {activeTab === "archived" && (
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn btn-circle btn-sm ml-2 bg-[#1A2737] text-[#4B96F8] hover:bg-[#2A3747] border-none"
          >
            <Archive size={16} />
          </motion.button>
        )}
      </div>

      {/* Content based on active tab */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1">
        {/* Add Friend Form */}
        {showAddFriend && (
          <div className="mb-3">
            <AddFriendForm onClose={() => setShowAddFriend(false)} />
          </div>
        )}
        
        {/* Messages Tab Content */}
        {activeTab === "messages" && (
          <>
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
                  <MessageCircle className="size-8 opacity-50" />
                </div>
                <h3 className="font-medium text-white mb-1">No messages found</h3>
                <p className="text-sm">
                  {searchQuery 
                    ? "Try a different search term" 
                    : "Start a new conversation"}
                </p>
              </motion.div>
            )}
          </>
        )}
        
        {/* Friends Tab Content */}
        {activeTab === "friends" && (
          <>
            {filteredUsers.map((user) => (
              <Friend
                key={user._id}
                user={user}
                onlineUsers={onlineUsers}
                onStartChat={setSelectedUser}
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
                <h3 className="font-medium text-white mb-1">No friends found</h3>
                <p className="text-sm">
                  {searchQuery 
                    ? "Try a different search term" 
                    : "Add a friend to start chatting"}
                </p>
                <button 
                  onClick={() => setShowAddFriend(true)}
                  className="mt-4 btn btn-sm bg-[#4B96F8] hover:bg-[#4B96F8]/90 text-white border-none"
                >
                  <UserPlus size={14} className="mr-1" />
                  Add Friend
                </button>
              </motion.div>
            )}
          </>
        )}
        
        {/* Archived Tab Content */}
        {activeTab === "archived" && (
          <>
            {archivedChats.map((user) => (
              <Contact
                key={user._id}
                user={user}
                selectedUserId={selectedUser?._id}
                onlineUsers={onlineUsers}
                messagePreview={getLatestMessagePreview(user._id)}
                onSelect={setSelectedUser}
                isArchived={true}
              />
            ))}
            
            {archivedChats.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-gray-400 py-12 px-4"
              >
                <div className="bg-[#1A2737] size-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Archive className="size-8 opacity-50" />
                </div>
                <h3 className="font-medium text-white mb-1">No archived chats</h3>
                <p className="text-sm">
                  Archived conversations will appear here
                </p>
              </motion.div>
            )}
          </>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;

