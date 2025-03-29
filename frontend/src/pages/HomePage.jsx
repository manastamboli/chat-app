import { useEffect, useCallback } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

const HomePage = () => {
  const { selectedUser, getUsers, subscribeToAllMessages, getFriends, friends, getPendingRequests, pendingRequests } = useChatStore();
  const { socket, acceptedRequests, verifyChatRequests } = useAuthStore();

  // Load user list and their messages when the page loads
  useEffect(() => {
    // Initial data load
    getUsers(true);
    
    // Verify chat requests to clean up any invalid ones
    verifyChatRequests();

    // Set up real-time updates
    const unsubscribe = subscribeToAllMessages();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [getUsers, subscribeToAllMessages, verifyChatRequests]);
  
  // Handle socket reconnection
  useEffect(() => {
    if (!socket) return;
    
    const handleConnect = () => {
      console.log("Socket reconnected, refreshing data");
      getUsers(true);
      verifyChatRequests();
      console.log("acceptedRequests in HomePage",acceptedRequests);
      getFriends();
      console.log("friends in HomePage",friends);
      getPendingRequests();
      console.log("pendingRequests in HomePage",pendingRequests);
    };
    
    socket.on("connect", handleConnect);
    
    return () => {
      socket.off("connect", handleConnect);
    };
  }, [socket, getUsers, verifyChatRequests]);

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
