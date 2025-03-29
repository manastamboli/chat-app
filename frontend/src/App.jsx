import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import UsersList from "./components/UsersList";
import ChatRequests from "./components/ChatRequest";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useChatStore } from "./store/useChatStore";
import { useThemeStore } from "./store/useThemeStore";

import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore();
  const { theme } = useThemeStore();

  const { subscribeToAllMessages } = useChatStore();

  // Apply theme to the document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  

  const { users,getUsers } = useChatStore();
  
  console.log("users",users);
  console.log({ onlineUsers });


  useEffect(() => {
    checkAuth();
    getUsers();
  }, [checkAuth,getUsers]);

  // Subscribe to all messages when authenticated
  useEffect(() => {
    let unsubscribe;
    if (authUser) {
      unsubscribe = subscribeToAllMessages();
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [authUser, subscribeToAllMessages]);

  console.log({ authUser });

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    <div>
      <Routes>
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        <Route path="/new-chat" element={<UsersList/>}></Route>
        <Route path="/chatrequest" element={<ChatRequests/>}></Route>
      </Routes>

      <Toaster />
    </div>
  );
};
export default App;
