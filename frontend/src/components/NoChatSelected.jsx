import { MessageSquare } from "lucide-react";

const NoChatSelected = () => {
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 bg-base-100/50">
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
            <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-secondary animate-ping"></div>
          </div>
        </div>

        {/* Welcome Text */}
        <h2 className="text-2xl font-bold text-primary">Welcome to BaatCheet!</h2>
        <p className="text-base-content/60">
          Select a conversation from the sidebar to start chatting
        </p>
        
        {/* New Call-to-action section */}
        <div className="mt-6">
          <button className="btn btn-primary btn-outline">
            Create New Chat
          </button>
        </div>
        
        {/* Tips section */}
        <div className="mt-8 text-sm bg-base-200 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Quick Tips:</h3>
          <ul className="text-left list-disc pl-5 space-y-1">
            <li>Start a new conversation using the sidebar</li>
            <li>Search through your chats with the search bar</li>
            <li>Customize your experience in settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NoChatSelected;
