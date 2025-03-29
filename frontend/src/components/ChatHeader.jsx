import { Phone, Video, MoreVertical, Archive, UserX, Trash2, Pin, Users, UserPlus } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { useState, useRef, useEffect } from "react";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers, authUser } = useAuthStore();
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const contextMenuRef = useRef(null);
  
  // Check if selected user is a group
  const isGroup = selectedUser?.isGroup || false;

  // Generate a unique 4-digit hashtag from user ID if not available
  const userTag = selectedUser?.tag || generateTagFromId(selectedUser?._id || '');

  // Function to generate a 4-digit tag from user ID
  function generateTagFromId(id) {
    // Use the last 4 characters of the ID and convert to a number
    const numericString = id.replace(/[^0-9]/g, '') || '1234';
    // Get last 4 digits, or pad if needed
    return numericString.padEnd(4, '0').slice(-4);
  }

  // Handle right click on avatar
  const handleRightClick = (e) => {
    e.preventDefault();
    setMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
  };

  // Handle click outside of context menu
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setShowContextMenu(false);
      }
    };

    if (showContextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showContextMenu]);

  // Count online members for groups
  const onlineMembersCount = isGroup 
    ? selectedUser?.members?.filter(member => onlineUsers.includes(member._id)).length || 0
    : 0;

  // Check if current user is a member of the group
  const isUserMember = isGroup 
    ? selectedUser?.members?.some(member => member._id === authUser?._id)
    : false;

  const handleArchive = () => {
    // To be implemented: archive chat functionality
    setShowContextMenu(false);
    console.log("Archive chat with", isGroup ? selectedUser.name : selectedUser.fullName);
  };

  const handleBlock = () => {
    // To be implemented: block user functionality
    setShowContextMenu(false);
    console.log("Block user", selectedUser.fullName);
  };

  const handleClearChat = () => {
    // To be implemented: clear chat functionality
    setShowContextMenu(false);
    console.log("Clear chat with", isGroup ? selectedUser.name : selectedUser.fullName);
  };

  const copyTagToClipboard = () => {
    const userName = isGroup ? selectedUser.name : selectedUser.fullName;
    navigator.clipboard.writeText(`${userName}#${userTag}`);
    setShowContextMenu(false);
    // You could add a toast notification here
    console.log("Copied to clipboard:", `${userName}#${userTag}`);
  };

  const handlePinChat = () => {
    // To be implemented: pin chat functionality
    setShowContextMenu(false);
    console.log("Pin chat with", isGroup ? selectedUser.name : selectedUser.fullName);
  };

  const handleStartVoiceCall = () => {
    // To be implemented: voice call functionality
    console.log("Starting voice call with", isGroup ? selectedUser.name : selectedUser.fullName);
  };

  const handleStartVideoCall = () => {
    // To be implemented: video call functionality
    console.log("Starting video call with", isGroup ? selectedUser.name : selectedUser.fullName);
  };

  return (
    <div className="p-4 border-b border-base-300 bg-base-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar with right-click event */}
          <div className="relative" onContextMenu={handleRightClick}>
            {isGroup ? (
              <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-medium relative">
                {selectedUser?.name?.charAt(0).toUpperCase()}
                <span className="absolute bottom-0 right-0 size-3 bg-primary rounded-full ring-2 ring-base-100 flex items-center justify-center">
                  <Users size={8} className="text-primary-content" />
                </span>
                {isUserMember && (
                  <span className="absolute top-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-base-100"></span>
                )}
              </div>
            ) : (
              <img 
                src={selectedUser?.profilePic || "/avatar.png"} 
                alt={selectedUser?.fullName} 
                className="size-10 rounded-full object-cover cursor-pointer"
              />
            )}
            
            {!isGroup && onlineUsers.includes(selectedUser?._id) && (
              <span className="absolute bottom-0 right-0 size-2.5 bg-green-500 rounded-full ring-2 ring-base-100" />
            )}
          </div>

          {/* User/Group info */}
          <div>
            <div className="flex items-center gap-1">
              <h3 className="font-medium">
                {isGroup ? selectedUser?.name : selectedUser?.fullName}
              </h3>
              {isGroup && isUserMember && (
                <span className="text-xxs bg-green-500/20 text-green-600 px-1 py-0.5 rounded-md">Member</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {isGroup ? (
                <p className="text-sm text-base-content/70">
                  {selectedUser?.members?.length || 0} members • {onlineMembersCount} online
                </p>
              ) : (
                <p className="text-sm text-base-content/70">
                  {onlineUsers.includes(selectedUser?._id) ? "Online" : "Offline"}
                </p>
              )}
              {!isGroup && (
                <span className="text-xs bg-base-300 px-1.5 py-0.5 rounded-md font-mono text-primary">
                  #{userTag}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {!isGroup && (
            <>
              <button 
                className="btn btn-circle btn-sm bg-base-300 border-none hover:bg-base-300/80"
                title="Voice call"
                onClick={handleStartVoiceCall}
              >
                <Phone className="size-5 text-primary" />
              </button>
              <button 
                className="btn btn-circle btn-sm bg-base-300 border-none hover:bg-base-300/80"
                title="Video call"
                onClick={handleStartVideoCall}
              >
                <Video className="size-5 text-primary" />
              </button>
            </>
          )}
          {isGroup && (
            <button 
              className="btn btn-circle btn-sm bg-base-300 border-none hover:bg-base-300/80"
              title="Add members"
            >
              <UserPlus className="size-5 text-primary" />
            </button>
          )}
          <button className="btn btn-circle btn-sm bg-base-300 border-none hover:bg-base-300/80">
            <MoreVertical className="size-5 text-primary" />
          </button>
        </div>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <div 
          ref={contextMenuRef}
          className="fixed bg-base-200 shadow-lg rounded-lg p-2 z-50 min-w-48 border border-base-300"
          style={{ 
            top: menuPosition.y, 
            left: menuPosition.x,
            transform: `translate(${window.innerWidth - menuPosition.x < 200 ? '-100%' : '0'}, ${menuPosition.y + 300 > window.innerHeight ? '-100%' : '0'})` 
          }}
        >
          {/* User/Group name header */}
          <div className="px-3 py-2 font-medium border-b border-base-300 mb-1">
            <div className="flex items-center justify-between">
              <span>{isGroup ? selectedUser?.name : selectedUser?.fullName}</span>
              {!isGroup && (
                <span className="text-xs bg-base-300 px-1.5 py-0.5 rounded-md font-mono text-primary cursor-pointer" onClick={copyTagToClipboard}>
                  #{userTag}
                </span>
              )}
            </div>
          </div>
          
          {/* Menu options */}
          <ul className="space-y-1">
            {!isGroup && (
              <li>
                <button 
                  onClick={copyTagToClipboard}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-base-300 rounded-md transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <span>Copy Username</span>
                </button>
              </li>
            )}
            <li>
              <button 
                onClick={handlePinChat}
                className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-base-300 rounded-md transition-colors"
              >
                <Pin className="size-4 text-primary" />
                <span>Pin Conversation</span>
              </button>
            </li>
            <li>
              <button 
                onClick={handleArchive}
                className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-base-300 rounded-md transition-colors"
              >
                <Archive className="size-4 text-primary" />
                <span>Archive Chat</span>
              </button>
            </li>
            {!isGroup && (
              <li>
                <button 
                  onClick={handleBlock}
                  className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-base-300 rounded-md transition-colors"
                >
                  <UserX className="size-4 text-error" />
                  <span>Block User</span>
                </button>
              </li>
            )}
            <li>
              <button 
                onClick={handleClearChat}
                className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-base-300 rounded-md transition-colors"
              >
                <Trash2 className="size-4 text-warning" />
                <span>Clear Chat</span>
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
export default ChatHeader;
