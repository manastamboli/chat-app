import { useEffect, useCallback } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser, getUsers, subscribeToAllMessages } = useChatStore();
  const { socket } = useAuthStore();

  // Load user list and their messages when the page loads
  useEffect(() => {
    // Initial data load
    getUsers(true);

    // Set up real-time updates
    const unsubscribe = subscribeToAllMessages();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [getUsers, subscribeToAllMessages]);
  
  // Handle socket reconnection
  useEffect(() => {
    if (!socket) return;
    
    const handleConnect = () => {
      console.log("Socket reconnected, refreshing data");
      getUsers(true);
    };
    
    socket.on("connect", handleConnect);
    
    return () => {
      socket.off("connect", handleConnect);
    };
  }, [socket, getUsers]);

  return (
    <div className="h-screen bg-base-100">
      <div className="flex h-full">
        <div className="flex h-full w-full">
          <Sidebar />
          {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
        </div>
      </div>
    </div>
  );
};
export default HomePage;
