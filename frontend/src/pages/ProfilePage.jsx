import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../store/useThemeStore";
import { Camera, Mail, User, Palette, Trash2, Download, PencilLine, Undo } from "lucide-react";

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
      <div className="bg-[#0F1C2E] p-3 rounded-xl mb-4">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="rounded-xl border-2 border-[#1A2737] touch-none"
          style={{ width: "300px", height: "300px" }}
        />
      </div>
      
      <div className="flex gap-3 mb-4">
        {["#4B96F8", "#F44336", "#4CAF50", "#FFEB3B", "#9C27B0", "#FFFFFF", "#000000"].map((clr) => (
          <button
            key={clr}
            onClick={() => setColor(clr)}
            className={`size-8 rounded-full border-2 ${
              color === clr ? "border-white" : "border-transparent"
            }`}
            style={{ backgroundColor: clr }}
            aria-label={`Color ${clr}`}
          />
        ))}
      </div>
      
      <div className="flex gap-2 mb-4">
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
          className="btn btn-sm bg-[#1A2737] hover:bg-[#2A3747] border-none text-white"
          disabled={currentStep === 0}
        >
          <Undo size={16} />
        </button>
        <button
          onClick={clearCanvas}
          className="btn btn-sm bg-[#1A2737] hover:bg-[#2A3747] border-none text-white"
        >
          <Trash2 size={16} />
        </button>
        <button
          onClick={handleSave}
          className="btn btn-sm bg-[#4B96F8] hover:bg-[#4B96F8]/90 border-none text-white"
        >
          <Download size={16} className="mr-1" />
          Save
        </button>
        <button
          onClick={onCancel}
          className="btn btn-sm bg-[#1A2737] hover:bg-[#2A3747] border-none text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Available themes
  const themes = [
    { id: "coffee", name: "Coffee", color: "#6F4E37" },
    { id: "dark", name: "Dark", color: "#1f2937" },
    { id: "night", name: "Night", color: "#0f172a" },
    { id: "light", name: "Light", color: "#f8fafc" },
    { id: "cupcake", name: "Cupcake", color: "#fef3c7" },
    { id: "synthwave", name: "Synthwave", color: "#2d1b69" },
  ];
  
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
    setIsDrawing(false);
  };
  
  const handleDrawClick = () => {
    setIsDrawing(true);
  };

  return (
    <div className="min-h-screen bg-[#0B1623] py-10">
      <div className="max-w-2xl mx-auto p-4 py-8">
        <div className="bg-[#0F1C2E] rounded-xl p-6 space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-white">Profile</h1>
            <p className="mt-2 text-gray-400">Your profile information</p>
          </div>

          {/* Drawing canvas or avatar upload section */}
          {isDrawing ? (
            <DrawingCanvas 
              initialImage={selectedImg || authUser.profilePic} 
              onSave={handleSaveDrawing}
              onCancel={() => setIsDrawing(false)}
            />
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <img
                  src={selectedImg || authUser.profilePic || "/avatar.png"}
                  alt="Profile"
                  className="size-32 rounded-full object-cover border-4 border-[#1A2737]"
                />
                <div className="absolute -bottom-2 -right-2 flex gap-2">
                  <label
                    htmlFor="avatar-upload"
                    className={`
                      bg-[#4B96F8] hover:bg-[#4B96F8]/90
                      p-2 rounded-full cursor-pointer 
                      transition-all duration-200
                      ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                    `}
                  >
                    <Camera className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      id="avatar-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUpdatingProfile}
                    />
                  </label>
                  <button
                    onClick={handleDrawClick}
                    className="bg-[#1A2737] hover:bg-[#2A3747] p-2 rounded-full cursor-pointer transition-all duration-200"
                  >
                    <PencilLine className="w-4 h-4 text-[#4B96F8]" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-400">
                {isUpdatingProfile ? "Uploading..." : "Upload or draw your profile picture"}
              </p>
            </div>
          )}

          <div className="space-y-6">
            <div className="space-y-1.5">
              <div className="text-sm text-gray-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                Full Name
              </div>
              <p className="px-4 py-2.5 bg-[#1A2737] rounded-lg border border-[#2A3747] text-white">{authUser?.fullName}</p>
            </div>

            <div className="space-y-1.5">
              <div className="text-sm text-gray-400 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email Address
              </div>
              <p className="px-4 py-2.5 bg-[#1A2737] rounded-lg border border-[#2A3747] text-white">{authUser?.email}</p>
            </div>
            
            {/* Theme Selection */}
            <div className="space-y-3">
              <div className="text-sm text-gray-400 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Theme
              </div>
              <div className="grid grid-cols-3 gap-3">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`
                      p-3 rounded-lg flex items-center gap-2 transition-all
                      ${theme === t.id 
                        ? "ring-2 ring-[#4B96F8] bg-[#1A2737]" 
                        : "bg-[#1A2737] hover:bg-[#2A3747]"}
                    `}
                  >
                    <div 
                      className="size-4 rounded-full" 
                      style={{ backgroundColor: t.color }}
                    />
                    <span className="text-sm text-white">{t.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-[#1A2737] rounded-xl p-6">
            <h2 className="text-lg font-medium text-white mb-4">Account Information</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-[#2A3747]">
                <span className="text-gray-400">Member Since</span>
                <span className="text-white">{authUser?.createdAt?.split("T")[0]}</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-400">Account Status</span>
                <span className="text-green-500">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ProfilePage;

