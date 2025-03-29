import { MessageSquare, UserPlus } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

const NoChatSelected = () => {
  const { setSelectedUser, users } = useChatStore();
  const { navigateTo } = useAuthStore(); // This will be added to authStore later
  
  // Function to start a random chat for demonstration
  const startRandomChat = () => {
    if (users.length > 0) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      setSelectedUser(randomUser);
    }
  };

  // Function to show the Friends tab
  const handleAddFriend = () => {
    // Use the navigateTo function to trigger the custom event
    navigateTo('showFriendsTab');
  };
  
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 bg-base-100">
      <div className="max-w-md text-center space-y-6">
        {/* Icon Display */}
        <div className="flex justify-center gap-4 mb-4">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center
             justify-center animate-pulse"
            >
              <MessageSquare className="w-8 h-8 text-primary" />
            </div>
            {/* Add a decorative element */}
            <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-primary animate-ping"></div>
          </div>
        </div>

        {/* Welcome Text */}
        <h2 className="text-2xl font-bold text-primary">Welcome to BaatCheet!</h2>
        <p className="text-base-content/70">
          Select a conversation from the sidebar or start a new chat
        </p>
        
        {/* Call-to-action buttons */}
        <div className="mt-6 flex justify-center gap-3">
          <button 
            onClick={startRandomChat} 
            className="btn bg-primary hover:bg-primary/90 text-primary-content border-none"
          >
            <MessageSquare size={18} className="mr-2" />
            Start Chatting
          </button>
          <button 
            onClick={handleAddFriend}
            className="btn bg-base-300 hover:bg-base-300/80 text-primary border-none"
          >
            <UserPlus size={18} className="mr-2" />
            Add Friend
          </button>
        </div>
        
        {/* Tips section */}
        <div className="mt-8 text-sm bg-base-300 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Quick Tips:</h3>
          <ul className="text-left list-disc pl-5 space-y-1 text-base-content/70">
            <li>Switch between Messages, Friends and Archived chats using the tabs</li>
            <li>Search through your conversations with the search bar</li>
            <li>Add new friends with the add friend button in the Friends tab</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NoChatSelected;
