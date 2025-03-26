import { useEffect, useState, useMemo, memo, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
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
  User,
  PencilLine,
  Camera,
  Mail,
  Palette,
  X,
  Undo,
  Trash2,
  Download,
  UserX
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatMessageTime } from "../lib/utils";
import { Link } from "react-router-dom";

// DrawingCanvas component taken from ProfilePage.jsx
const DrawingCanvas = ({ initialImage, onSave, onCancel }) => {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#4B96F8");
  const [lineWidth, setLineWidth] = useState(5);
  const [history, setHistory] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 300;
    canvas.height = 300;
    
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctxRef.current = ctx;
    
    // Draw initial image if exists
    if (initialImage) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        saveToHistory();
      };
      img.src = initialImage;
    } else {
      // Just draw a white background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveToHistory();
    }
  }, [initialImage]);

  // Update stroke style when color changes
  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.strokeStyle = color;
    }
  }, [color]);

  // Update line width when it changes
  useEffect(() => {
    if (ctxRef.current) {
      ctxRef.current.lineWidth = lineWidth;
    }
  }, [lineWidth]);

  const startDrawing = (e) => {
    const { offsetX, offsetY } = getCoordinates(e);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = getCoordinates(e);
    ctxRef.current.lineTo(offsetX, offsetY);
    ctxRef.current.stroke();
  };

  const stopDrawing = () => {
    ctxRef.current.closePath();
    setIsDrawing(false);
    saveToHistory();
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // For touch events
    if (e.touches && e.touches[0]) {
      return {
        offsetX: e.touches[0].clientX - rect.left,
        offsetY: e.touches[0].clientY - rect.top
      };
    }
    
    // For mouse events
    return {
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top
    };
  };

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    // Remove any "future" states if we drew after undoing
    const newHistory = history.slice(0, currentStep + 1);
    newHistory.push(canvas.toDataURL());
    setHistory(newHistory);
    setCurrentStep(newHistory.length - 1);
  };

  const undo = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      const img = new Image();
      img.onload = () => {
        ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        ctxRef.current.drawImage(img, 0, 0);
      };
      img.src = history[currentStep - 1];
    }
  };

  const clearCanvas = () => {
    ctxRef.current.fillStyle = "white";
    ctxRef.current.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    saveToHistory();
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    const imgData = canvas.toDataURL('image/png');
    onSave(imgData);
  };

  return (
    <div className="flex flex-col items-center">
      <div className="bg-base-200 p-3 rounded-xl mb-4">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="rounded-xl border-2 border-base-300 touch-none"
          style={{ width: "260px", height: "260px" }}
        />
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        {["#4B96F8", "#F44336", "#4CAF50", "#FFEB3B", "#9C27B0", "#FFFFFF", "#000000"].map((clr) => (
          <button
            key={clr}
            onClick={() => setColor(clr)}
            className={`size-7 rounded-full border-2 ${
              color === clr ? "border-primary" : "border-transparent"
            }`}
            style={{ backgroundColor: clr }}
            aria-label={`Color ${clr}`}
          />
        ))}
      </div>
      
      <div className="flex gap-2 mb-4 items-center">
        <span className="text-xs text-base-content/70">Brush:</span>
        <input
          type="range"
          min="1"
          max="20"
          value={lineWidth}
          onChange={(e) => setLineWidth(parseInt(e.target.value))}
          className="w-32"
        />
      </div>
      
      <div className="flex gap-2 justify-center">
        <button
          onClick={undo}
          className="btn btn-sm bg-base-300 hover:bg-base-300/80 border-none"
          disabled={currentStep === 0}
        >
          <Undo size={16} />
        </button>
        <button
          onClick={clearCanvas}
          className="btn btn-sm bg-base-300 hover:bg-base-300/80 border-none"
        >
          <Trash2 size={16} />
        </button>
        <button
          onClick={handleSave}
          className="btn btn-sm bg-primary hover:bg-primary/90 border-none text-primary-content"
        >
          <Download size={16} className="mr-1" />
          Save
        </button>
        <button
          onClick={onCancel}
          className="btn btn-sm bg-base-300 hover:bg-base-300/80 border-none"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

// User Profile Drawer Component
const ProfileDrawer = ({ isOpen, onClose, user, isUpdatingProfile }) => {
  const { updateProfile, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);
  const [showMoreThemes, setShowMoreThemes] = useState(false);
  
  // Generate a unique 4-digit hashtag from user ID if not available
  const userTag = user?.tag || generateTagFromId(user?._id || '');

  // Function to generate a 4-digit tag from user ID
  function generateTagFromId(id) {
    // Use the last 4 characters of the ID and convert to a number
    const numericString = id.replace(/[^0-9]/g, '') || '1234';
    // Get last 4 digits, or pad if needed
    return numericString.padEnd(4, '0').slice(-4);
  }
  
  // Featured themes
  const featuredThemes = [
    { id: "coffee", name: "Coffee", color: "#6F4E37" },
    { id: "dark", name: "Dark", color: "#1f2937" },
    { id: "night", name: "Night", color: "#0f172a" },
    { id: "light", name: "Light", color: "#f8fafc" },
    { id: "cupcake", name: "Cupcake", color: "#fef3c7" },
    { id: "synthwave", name: "Synthwave", color: "#2d1b69" },
  ];
  
  // Additional themes
  const additionalThemes = [
    { id: "retro", name: "Retro", color: "#ef9995" },
    { id: "cyberpunk", name: "Cyberpunk", color: "#ff7598" },
    { id: "valentine", name: "Valentine", color: "#e96d7b" },
    { id: "halloween", name: "Halloween", color: "#af8d86" },
    { id: "garden", name: "Garden", color: "#5c7f67" },
    { id: "forest", name: "Forest", color: "#1eb854" },
    { id: "aqua", name: "Aqua", color: "#09ecf3" },
    { id: "lofi", name: "Lofi", color: "#808080" },
    { id: "pastel", name: "Pastel", color: "#d8c7ff" },
    { id: "fantasy", name: "Fantasy", color: "#6e0b75" },
    { id: "black", name: "Black", color: "#000000" },
    { id: "luxury", name: "Luxury", color: "#44403c" },
    { id: "dracula", name: "Dracula", color: "#6272a4" },
  ];
  
  // Apply theme to document when it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    // Apply theme change immediately
    document.documentElement.setAttribute('data-theme', newTheme);
  };
  
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };
  
  const handleSaveDrawing = async (imgData) => {
    setSelectedImg(imgData);
    await updateProfile({ profilePic: imgData });
    setIsDrawingMode(false);
  };
  
  const copyTagToClipboard = () => {
    navigator.clipboard.writeText(`${user?.fullName}#${userTag}`);
    // You could add a toast notification here
    console.log("Copied to clipboard:", `${user?.fullName}#${userTag}`);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-base-200 rounded-xl w-full max-w-xs shadow-xl overflow-hidden"
      >
        <div className="p-4 flex items-center justify-between border-b border-base-300">
          <h3 className="font-medium">
            {isDrawingMode ? "Create Avatar" : "User Profile"}
          </h3>
          <button 
            onClick={onClose}
            className="btn btn-circle btn-sm bg-base-300 hover:bg-base-300/80 border-none"
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            {isDrawingMode ? (
              <DrawingCanvas 
                initialImage={selectedImg || user?.profilePic}
                onSave={handleSaveDrawing}
                onCancel={() => setIsDrawingMode(false)}
              />
            ) : (
              <>
                <div className="relative mb-3">
                  <img
                    src={selectedImg || user?.profilePic || "/avatar.png"}
                    alt="Profile"
                    className="size-20 rounded-full object-cover border-4 border-base-300"
                  />
                  <div className="absolute -bottom-2 -right-2 flex gap-2">
                    <label
                      htmlFor="drawer-avatar-upload"
                      className={`
                        bg-primary hover:bg-primary/90
                        p-2 rounded-full cursor-pointer 
                        transition-all duration-200
                        ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                      `}
                    >
                      <Camera className="w-4 h-4 text-primary-content" />
                      <input
                        type="file"
                        id="drawer-avatar-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUpdatingProfile}
                      />
                    </label>
                    <button
                      onClick={() => setIsDrawingMode(true)}
                      className="bg-base-300 hover:bg-base-300/80 p-2 rounded-full cursor-pointer transition-all duration-200"
                    >
                      <PencilLine className="w-4 h-4 text-primary" />
                    </button>
                  </div>
                </div>
                
                <div className="text-center">
                  <h3 className="font-medium">{user?.fullName}</h3>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <p className="text-xs text-base-content/70">{user?.email}</p>
                    <div 
                      className="flex items-center gap-1 cursor-pointer bg-base-300 px-1.5 py-0.5 rounded-md hover:bg-base-300/80"
                      onClick={copyTagToClipboard}
                      title="Click to copy"
                    >
                      <span className="text-xs font-mono text-primary">#{userTag}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="size-3 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                    </div>
                  </div>
                </div>
            
                {/* Theme Selection */}
                <div className="mt-6 space-y-3 w-full">
                  <div className="text-sm text-base-content/70 flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Theme
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {featuredThemes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleThemeChange(t.id)}
                        className={`
                          p-2 rounded-lg flex items-center gap-2 transition-all
                          ${theme === t.id 
                            ? "ring-2 ring-primary bg-base-300" 
                            : "bg-base-300 hover:bg-base-300/80"}
                        `}
                      >
                        <div 
                          className="size-3 rounded-full" 
                          style={{ backgroundColor: t.color }}
                        />
                        <span className="text-xs">{t.name}</span>
                      </button>
                    ))}
                  </div>
                  
                  {/* More Themes Button */}
                  <button
                    onClick={() => setShowMoreThemes(!showMoreThemes)}
                    className="w-full btn btn-sm bg-base-300 hover:bg-base-300/80 border-none mt-1"
                  >
                    {showMoreThemes ? "Show Less" : "More Themes"}
                  </button>
                  
                  {/* Additional Themes */}
                  {showMoreThemes && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="grid grid-cols-3 gap-2 mt-2"
                    >
                      {additionalThemes.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => handleThemeChange(t.id)}
                          className={`
                            p-2 rounded-lg flex items-center gap-2 transition-all
                            ${theme === t.id 
                              ? "ring-2 ring-primary bg-base-300" 
                              : "bg-base-300 hover:bg-base-300/80"}
                          `}
                        >
                          <div 
                            className="size-3 rounded-full" 
                            style={{ backgroundColor: t.color }}
                          />
                          <span className="text-xs">{t.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
                
                {/* User Actions */}
                <div className="mt-6 space-y-2 w-full">
                  <Link 
                    to="/profile" 
                    onClick={onClose}
                    className="btn btn-sm w-full bg-base-300 hover:bg-base-300/80 border-none text-base-content justify-start"
                  >
                    <User size={14} className="mr-2 text-primary" />
                    Edit Profile
                  </Link>
                  <Link 
                    to="/settings" 
                    onClick={onClose}
                    className="btn btn-sm w-full bg-base-300 hover:bg-base-300/80 border-none text-base-content justify-start"
                  >
                    <Settings size={14} className="mr-2 text-primary" />
                    Settings
                  </Link>
                  <button 
                    onClick={() => {
                      onClose();
                      logout();
                    }}
                    className="btn btn-sm w-full bg-base-300 hover:bg-base-300/80 border-none text-base-content justify-start"
                  >
                    <LogOut size={14} className="mr-2 text-primary" />
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// Memoized contact component for better performance
const Contact = memo(({ user, selectedUserId, onlineUsers, messagePreview, onSelect, isArchived = false }) => {
  const { text, time, isYou, isImage, isSeen, isOptimistic } = messagePreview;
  const isSelected = selectedUserId === user._id;
  const isOnline = onlineUsers.includes(user._id);
  
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const contextMenuRef = useRef(null);

  // Generate a unique 4-digit hashtag from user ID if not available
  const userTag = user.tag || generateTagFromId(user._id);

  // Function to generate a 4-digit tag from user ID
  function generateTagFromId(id) {
    // Use the last 4 characters of the ID and convert to a number
    const numericString = id.replace(/[^0-9]/g, '') || '1234';
    // Get last 4 digits, or pad if needed
    return numericString.padEnd(4, '0').slice(-4);
  }

  // Handle right click
  const handleRightClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
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

  const handleArchive = (e) => {
    e.stopPropagation();
    // To be implemented: archive chat functionality
    setShowContextMenu(false);
    console.log("Archive chat with", user.fullName);
  };

  const handleBlock = (e) => {
    e.stopPropagation();
    // To be implemented: block user functionality
    setShowContextMenu(false);
    console.log("Block user", user.fullName);
  };

  const handleClearChat = (e) => {
    e.stopPropagation();
    // To be implemented: clear chat functionality
    setShowContextMenu(false);
    console.log("Clear chat with", user.fullName);
  };

  const copyTagToClipboard = (e) => {
    e && e.stopPropagation();
    navigator.clipboard.writeText(`${user.fullName}#${userTag}`);
    setShowContextMenu(false);
    // You could add a toast notification here
    console.log("Copied to clipboard:", `${user.fullName}#${userTag}`);
  };
  
  return (
    <>
      <motion.button
        onClick={() => onSelect(user)}
        onContextMenu={handleRightClick}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`
          w-full p-3 flex items-center gap-3 rounded-xl transition-all
          hover:bg-base-300 active:bg-base-300/80
          ${isSelected ? "bg-base-300 shadow-lg shadow-black/5" : ""}
          ${isArchived ? "opacity-70" : ""}
        `}
      >
        <div className="relative">
          <img
            src={user.profilePic || "/avatar.png"}
            alt={user.fullName}
            className="size-12 rounded-full object-cover ring-2 ring-base-300"
          />
          {isOnline && !isArchived && (
            <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-base-200" />
          )}
          {isArchived && (
            <span className="absolute bottom-0 right-0 size-3 bg-gray-500 rounded-full ring-2 ring-base-200 flex items-center justify-center">
              <Archive size={8} className="text-white" />
            </span>
          )}
        </div>

        <div className="flex-1 text-left">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="font-medium">{user.fullName}</span>
              <span className="text-xxs bg-base-300 px-1 rounded font-mono text-primary">#{userTag}</span>
            </div>
            <span className="text-xs text-base-content/60">{time}</span>
          </div>
          <div className="flex items-center gap-2">
            {isImage && (
              <span className="text-primary">
                <Image size={14} />
              </span>
            )}
            {isYou && (
              <span className={`${isSeen ? "text-primary" : "text-base-content/60"}`}>
                {isSeen ? <CheckCheck size={14} /> : <Check size={14} />}
              </span>
            )}
            <p 
              className={`text-sm truncate ${
                isOptimistic 
                  ? "italic text-base-content/60" 
                  : isYou && !isSeen 
                    ? "font-medium text-primary" 
                    : "text-base-content/60"
              }`}
            >
              {text}
            </p>
          </div>
        </div>
      </motion.button>

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
          {/* User name header */}
          <div className="px-3 py-2 font-medium border-b border-base-300 mb-1">
            <div className="flex items-center justify-between">
              <span>{user.fullName}</span>
              <span className="text-xs bg-base-300 px-1.5 py-0.5 rounded-md font-mono text-primary cursor-pointer" onClick={copyTagToClipboard}>
                #{userTag}
              </span>
            </div>
          </div>
          
          {/* Menu options */}
          <ul className="space-y-1">
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
            <li>
              <button 
                onClick={handleArchive}
                className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-base-300 rounded-md transition-colors"
              >
                <Archive className="size-4 text-primary" />
                <span>Archive Chat</span>
              </button>
            </li>
            <li>
              <button 
                onClick={handleBlock}
                className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-base-300 rounded-md transition-colors"
              >
                <UserX className="size-4 text-error" />
                <span>Block User</span>
              </button>
            </li>
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
    </>
  );
});

Contact.displayName = "Contact";

// Friend component for the friends tab
const Friend = memo(({ user, onlineUsers, onStartChat }) => {
  const isOnline = onlineUsers.includes(user._id);
  
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const contextMenuRef = useRef(null);

  // Generate a unique 4-digit hashtag from user ID if not available
  const userTag = user.tag || generateTagFromId(user._id);

  // Function to generate a 4-digit tag from user ID
  function generateTagFromId(id) {
    // Use the last 4 characters of the ID and convert to a number
    const numericString = id.replace(/[^0-9]/g, '') || '1234';
    // Get last 4 digits, or pad if needed
    return numericString.padEnd(4, '0').slice(-4);
  }

  // Handle right click
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

  const handleArchive = () => {
    // To be implemented: archive chat functionality
    setShowContextMenu(false);
    console.log("Archive chat with", user.fullName);
  };

  const handleBlock = () => {
    // To be implemented: block user functionality
    setShowContextMenu(false);
    console.log("Block user", user.fullName);
  };

  const handleClearChat = () => {
    // To be implemented: clear chat functionality
    setShowContextMenu(false);
    console.log("Clear chat with", user.fullName);
  };

  const copyTagToClipboard = (e) => {
    e && e.stopPropagation();
    navigator.clipboard.writeText(`${user.fullName}#${userTag}`);
    setShowContextMenu(false);
    // You could add a toast notification here
    console.log("Copied to clipboard:", `${user.fullName}#${userTag}`);
  };
  
  return (
    <>
      <div 
        className="p-3 flex items-center justify-between rounded-xl hover:bg-base-300 transition-all"
        onContextMenu={handleRightClick}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={user.profilePic || "/avatar.png"}
              alt={user.fullName}
              className="size-12 rounded-full object-cover ring-2 ring-base-300 cursor-pointer"
              onContextMenu={handleRightClick}
            />
            {isOnline && (
              <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-base-200" />
            )}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1">
              <h3 className="font-medium">{user.fullName}</h3>
              <span className="text-xxs bg-base-300 px-1 rounded font-mono text-primary">#{userTag}</span>
            </div>
            <p className="text-xs text-base-content/60">{isOnline ? "Online" : "Offline"}</p>
          </div>
        </div>
        <button 
          onClick={() => onStartChat(user)}
          className="btn btn-sm btn-circle bg-base-300 hover:bg-base-300/80 border-none"
        >
          <MessageCircle size={16} className="text-primary" />
        </button>
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
          {/* User name header */}
          <div className="px-3 py-2 font-medium border-b border-base-300 mb-1">
            <div className="flex items-center justify-between">
              <span>{user.fullName}</span>
              <span className="text-xs bg-base-300 px-1.5 py-0.5 rounded-md font-mono text-primary cursor-pointer" onClick={copyTagToClipboard}>
                #{userTag}
              </span>
            </div>
          </div>
          
          {/* Menu options */}
          <ul className="space-y-1">
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
            <li>
              <button 
                onClick={handleArchive}
                className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-base-300 rounded-md transition-colors"
              >
                <Archive className="size-4 text-primary" />
                <span>Archive Chat</span>
              </button>
            </li>
            <li>
              <button 
                onClick={handleBlock}
                className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-base-300 rounded-md transition-colors"
              >
                <UserX className="size-4 text-error" />
                <span>Block User</span>
              </button>
            </li>
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
    </>
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
    <div className="p-4 bg-base-300 rounded-xl">
      <h3 className="font-medium mb-3">Add a Friend</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-base-200 border border-base-300 rounded-lg p-2 mb-3"
          required
        />
        <div className="flex justify-end gap-2">
          <button 
            type="button" 
            onClick={onClose}
            className="btn btn-sm bg-base-200 hover:bg-base-300 border-none"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="btn btn-sm bg-primary hover:bg-primary/90 border-none text-primary-content"
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
  const { onlineUsers, authUser, logout, isUpdatingProfile } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("messages");
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  
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

  // Toggle profile drawer
  const toggleProfileDrawer = () => {
    setShowProfileDrawer(!showProfileDrawer);
  };

  // Generate a unique 4-digit hashtag for the auth user
  const userTag = authUser?.tag || generateTagFromId(authUser?._id || '');

  // Function to generate a 4-digit tag from user ID 
  function generateTagFromId(id) {
    // Use the last 4 characters of the ID and convert to a number
    const numericString = id.replace(/[^0-9]/g, '') || '1234';
    // Get last 4 digits, or pad if needed
    return numericString.padEnd(4, '0').slice(-4);
  }

  if (isUsersLoading && users.length === 0) return <SidebarSkeleton />;

  return (
    <>
      <aside className="h-full w-[280px] bg-base-200 flex flex-col border-r border-base-300">
        {/* App branding and title */}
        <div className="p-4 border-b border-base-300 flex items-center gap-2">
          <div className="size-10 rounded-xl bg-primary/15 flex items-center justify-center shadow-sm">
            <MessageCircle className="size-5 text-primary" />
          </div>
          <h1 className="text-xl font-bold">BaatCheet</h1>
        </div>
        
        {/* Header with user profile */}
        <div className="p-4 flex items-center justify-between border-b border-base-300">
          <button
            onClick={toggleProfileDrawer}
            className="flex items-center gap-3 hover:bg-base-300 p-1.5 rounded-lg transition-colors"
          >
            <div className="relative">
              <img 
                src={authUser?.profilePic || "/avatar.png"} 
                alt="profile" 
                className="size-10 rounded-full object-cover ring-2 ring-primary/20"
              />
              <span className="absolute bottom-0 right-0 size-2.5 bg-green-500 rounded-full ring-2 ring-base-200" />
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1">
                <h2 className="font-medium">{authUser?.fullName}</h2>
                <span className="text-xxs bg-base-300 px-1 rounded font-mono text-primary">#{userTag}</span>
              </div>
              <p className="text-xs text-primary">Active</p>
            </div>
          </button>
          <div className="flex gap-1">
            <button 
              onClick={toggleProfileDrawer}
              className="btn btn-circle btn-sm bg-base-300 border-none hover:bg-base-300/80 transition-all"
            >
              <User className="size-4 text-primary" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-base-300">
          <button
            onClick={() => setActiveTab("messages")}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "messages" ? "text-primary" : "text-gray-400"
            }`}
          >
            Messages
            {activeTab === "messages" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("friends")}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "friends" ? "text-primary" : "text-gray-400"
            }`}
          >
            Friends
            {activeTab === "friends" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("archived")}
            className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
              activeTab === "archived" ? "text-primary" : "text-gray-400"
            }`}
          >
            Archived
            {activeTab === "archived" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
            )}
          </button>
        </div>

        {/* Search & Action Bar */}
        <div className="p-4 flex items-center justify-between">
          <div className="relative group flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400 group-focus-within:text-primary transition-colors" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-base-300 text-white rounded-xl text-sm 
              focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all
              placeholder:text-gray-400"
            />
          </div>
          
          {activeTab === "messages" && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-circle btn-sm ml-2 bg-primary text-white hover:bg-primary/90 border-none"
            >
              <Plus size={16} />
            </motion.button>
          )}
          
          {activeTab === "friends" && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddFriend(true)}
              className="btn btn-circle btn-sm ml-2 bg-primary text-white hover:bg-primary/90 border-none"
            >
              <UserPlus size={16} />
            </motion.button>
          )}
          
          {activeTab === "archived" && (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-circle btn-sm ml-2 bg-base-300 text-primary hover:bg-base-300/80 border-none"
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
                  <div className="bg-base-300 size-16 rounded-full flex items-center justify-center mx-auto mb-4">
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
                  <div className="bg-base-300 size-16 rounded-full flex items-center justify-center mx-auto mb-4">
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
                    className="mt-4 btn btn-sm bg-primary hover:bg-primary/90 text-white border-none"
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
                  <div className="bg-base-300 size-16 rounded-full flex items-center justify-center mx-auto mb-4">
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
      
      {/* Render the profile drawer with AnimatePresence for smooth transitions */}
      <AnimatePresence>
        {showProfileDrawer && (
          <ProfileDrawer 
            isOpen={showProfileDrawer}
            onClose={() => setShowProfileDrawer(false)}
            user={authUser}
            isUpdatingProfile={isUpdatingProfile}
          />
        )}
      </AnimatePresence>
    </>
  );
};
export default Sidebar;

