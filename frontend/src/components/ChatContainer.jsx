import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef, useState, useCallback, memo } from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime, formatDetailedMessageTime } from "../lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// Memoized Message component for better performance
const Message = memo(({ message, isCurrentUser, userProfilePic, otherUserProfilePic }) => {
  const [showFullTime, setShowFullTime] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: message.isOptimistic ? 0.1 : 0.3 }}
      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
    >
      <div className={`flex items-end gap-2 max-w-[70%] ${isCurrentUser ? "flex-row-reverse" : ""}`}>
        <div className="flex-shrink-0">
          <img
            src={isCurrentUser ? userProfilePic : otherUserProfilePic}
            alt="profile pic"
            className="size-8 rounded-full"
          />
        </div>
        <div className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}>
          <div 
            className={`px-4 py-2 rounded-2xl ${
              isCurrentUser 
                ? `bg-[#4B96F8] text-white rounded-br-none ${message.isOptimistic ? 'opacity-70' : ''}` 
                : "bg-[#1A2737] text-white rounded-bl-none"
            }`}
          >
            {message.image && (
              <div className="mb-2">
                <img
                  src={message.image}
                  alt="Attachment"
                  className="max-w-[300px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(message.image, '_blank')}
                />
              </div>
            )}
            {message.text && <p>{message.text}</p>}
          </div>
          <span 
            className="text-xs text-gray-400 mt-1 cursor-pointer"
            onClick={() => setShowFullTime(!showFullTime)}
          >
            {showFullTime 
              ? formatDetailedMessageTime(message.createdAt)
              : formatMessageTime(message.createdAt)
            }
            {message.seen && isCurrentUser && " • Seen"}
            {message.isOptimistic && " • Sending..."}
          </span>
        </div>
      </div>
    </motion.div>
  );
});

Message.displayName = "Message";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    subscribeToMessages,
    unsubscribeFromMessages,
  } = useChatStore();
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const prevMessagesLengthRef = useRef(0);
  const [hasScrolledUp, setHasScrolledUp] = useState(false);
  const [hasNewMessages, setHasNewMessages] = useState(false);

  // Fetch messages when selected user changes
  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
      subscribeToMessages();
    }
    return () => unsubscribeFromMessages();
  }, [selectedUser?._id, getMessages, subscribeToMessages, unsubscribeFromMessages]);

  // Auto-scroll handling
  useEffect(() => {
    if (!messages.length) return;
    
    const isNewMessage = messages.length > prevMessagesLengthRef.current;
    prevMessagesLengthRef.current = messages.length;
    
    // Check if the new message is from the current user or if we're not scrolled up
    const lastMessage = messages[messages.length - 1];
    const isFromCurrentUser = lastMessage?.senderId === authUser?._id;
    
    if (isNewMessage) {
      // If message is from current user, always scroll
      if (isFromCurrentUser) {
        setTimeout(() => {
          messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
          setHasScrolledUp(false);
        }, 100);
      } 
      // If user has scrolled up and message is from other user, show new message button
      else if (hasScrolledUp) {
        setHasNewMessages(true);
      }
      // If user hasn't scrolled up, scroll to new message
      else {
        setTimeout(() => {
          messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [messages, authUser?._id, hasScrolledUp]);

  // Scroll event handler
  const handleScroll = useCallback(() => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
    setHasScrolledUp(isScrolledUp);
    
    // If user scrolls to bottom, clear new messages notification
    if (!isScrolledUp) {
      setHasNewMessages(false);
    }
  }, []);

  // Setup scroll listener
  useEffect(() => {
    const container = chatContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);
  
  // Scroll to bottom function
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setHasScrolledUp(false);
    setHasNewMessages(false);
  };

  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto bg-[#0B1623]">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }

  // Sort messages by date in ascending order (oldest first)
  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.createdAt) - new Date(b.createdAt)
  );

  // Group messages by date for better organization
  const groupedMessages = sortedMessages.reduce((groups, message) => {
    const date = new Date(message.createdAt).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  // Convert to array and sort by date (oldest first)
  const sortedDates = Object.keys(groupedMessages).sort((a, b) => 
    new Date(a) - new Date(b)
  );

  return (
    <div className="flex-1 flex flex-col overflow-auto bg-[#0B1623]">
      <ChatHeader />

      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-6 bg-[#1A2737] rounded-lg">
              <h3 className="font-medium text-lg text-white">No messages yet</h3>
              <p className="text-sm text-gray-400">Start a conversation with {selectedUser?.fullName || 'this user'}</p>
            </div>
          </div>
        )}
        
        <AnimatePresence>
          {sortedDates.map((date) => (
            <div key={date} className="space-y-4">
              <div className="relative flex py-2">
                <div className="flex-grow border-t border-[#1A2737]"></div>
                <span className="flex-shrink mx-4 text-xs text-gray-400">{date}</span>
                <div className="flex-grow border-t border-[#1A2737]"></div>
              </div>
              
              {groupedMessages[date].map((message) => (
                <Message
                  key={message._id}
                  message={message}
                  isCurrentUser={message.senderId === authUser?._id}
                  userProfilePic={authUser?.profilePic || "/avatar.png"}
                  otherUserProfilePic={selectedUser?.profilePic || "/avatar.png"}
                />
              ))}
            </div>
          ))}
        </AnimatePresence>
        
        <div ref={messageEndRef} />
      </div>

      {hasScrolledUp && (
        <motion.button 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          onClick={scrollToBottom}
          className={`btn btn-circle btn-sm ${hasNewMessages ? 'bg-red-500' : 'bg-[#4B96F8]'} text-white hover:bg-opacity-90 absolute bottom-20 right-6 shadow-lg ${hasNewMessages ? 'animate-pulse' : 'animate-bounce'}`}
          aria-label="Scroll to bottom"
        >
          {hasNewMessages ? (
            <span className="text-xs font-bold">NEW</span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 19l-7-7h4V5h6v7h4l-7 7z" />
            </svg>
          )}
        </motion.button>
      )}

      <MessageInput />
    </div>
  );
};
export default ChatContainer;
