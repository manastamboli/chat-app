import { Phone, Video, MoreVertical } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  return (
    <div className="p-4 border-b border-[#1A2737] bg-[#0B1623]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            <img 
              src={selectedUser.profilePic || "/avatar.png"} 
              alt={selectedUser.fullName} 
              className="size-10 rounded-full object-cover"
            />
            {onlineUsers.includes(selectedUser._id) && (
              <span className="absolute bottom-0 right-0 size-2.5 bg-green-500 rounded-full ring-2 ring-[#0B1623]" />
            )}
          </div>

          {/* User info */}
          <div>
            <h3 className="font-medium text-white">{selectedUser.fullName}</h3>
            <p className="text-sm text-gray-400">
              {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button className="btn btn-circle btn-sm bg-[#1A2737] border-none hover:bg-[#2A3747]">
            <Phone className="size-5 text-[#4B96F8]" />
          </button>
          <button className="btn btn-circle btn-sm bg-[#1A2737] border-none hover:bg-[#2A3747]">
            <Video className="size-5 text-[#4B96F8]" />
          </button>
          <button className="btn btn-circle btn-sm bg-[#1A2737] border-none hover:bg-[#2A3747]">
            <MoreVertical className="size-5 text-[#4B96F8]" />
          </button>
        </div>
      </div>
    </div>
  );
};
export default ChatHeader;
