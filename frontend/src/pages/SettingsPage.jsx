import { THEMES } from "../constants";
import { useThemeStore } from "../store/useThemeStore";
import { Send, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const PREVIEW_MESSAGES = [
  { id: 1, content: "Hey! How's it going?", isSent: false },
  { id: 2, content: "I'm doing great! Just working on some new features.", isSent: true },
];

// Featured themes to highlight at the top
const FEATURED_THEMES = [
  { id: "coffee", name: "Coffee", color: "#6F4E37" },
  { id: "dark", name: "Dark", color: "#1f2937" },
  { id: "night", name: "Night", color: "#0f172a" },
  { id: "light", name: "Light", color: "#f8fafc" },
  { id: "cupcake", name: "Cupcake", color: "#fef3c7" },
  { id: "synthwave", name: "Synthwave", color: "#2d1b69" },
];

// Additional themes
const ADDITIONAL_THEMES = [
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

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();
  const [showMoreThemes, setShowMoreThemes] = useState(false);
  const [showAllThemes, setShowAllThemes] = useState(false);

  // Apply theme to document when it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    // Apply theme change immediately
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <div className="min-h-screen container mx-auto px-4 pt-4 max-w-5xl pb-10">
      <div className="flex items-center mb-6">
        <Link to="/" className="btn btn-ghost btn-sm mr-4">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>
      
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Featured Themes</h2>
          <p className="text-sm text-base-content/70">Quick access to popular themes</p>
        </div>

        {/* Featured Themes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {FEATURED_THEMES.map((t) => (
            <button
              key={t.id}
              className={`
                p-3 rounded-lg flex flex-col items-center gap-2 transition-all
                ${theme === t.id 
                  ? "ring-2 ring-primary bg-base-200" 
                  : "bg-base-200 hover:bg-base-300"}
              `}
              onClick={() => handleThemeChange(t.id)}
            >
              <div 
                className="size-6 rounded-full" 
                style={{ backgroundColor: t.color }}
              />
              <span className="text-sm">{t.name}</span>
            </button>
          ))}
        </div>
        
        {/* More Themes Button */}
        <button
          onClick={() => setShowMoreThemes(!showMoreThemes)}
          className="btn btn-block bg-base-200 hover:bg-base-300 border-none"
        >
          {showMoreThemes ? "Show Less Themes" : "More Themes"}
          {showMoreThemes ? <ChevronUp size={16} className="ml-2" /> : <ChevronDown size={16} className="ml-2" />}
        </button>
        
        {/* Additional Themes */}
        {showMoreThemes && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3"
          >
            {ADDITIONAL_THEMES.map((t) => (
              <button
                key={t.id}
                className={`
                  p-3 rounded-lg flex flex-col items-center gap-2 transition-all
                  ${theme === t.id 
                    ? "ring-2 ring-primary bg-base-200" 
                    : "bg-base-200 hover:bg-base-300"}
                `}
                onClick={() => handleThemeChange(t.id)}
              >
                <div 
                  className="size-6 rounded-full" 
                  style={{ backgroundColor: t.color }}
                />
                <span className="text-sm">{t.name}</span>
              </button>
            ))}
          </motion.div>
        )}
        
        <div className="flex flex-col gap-1 mt-8">
          <h2 className="text-lg font-semibold">All Themes</h2>
          <p className="text-sm text-base-content/70">Browse the complete collection</p>
        </div>

        {/* Show All Themes Button */}
        <button
          onClick={() => setShowAllThemes(!showAllThemes)}
          className="btn btn-block bg-base-200 hover:bg-base-300 border-none mb-4"
        >
          {showAllThemes ? "Hide All Themes" : "Show All Themes"} 
          {showAllThemes ? <ChevronUp size={16} className="ml-2" /> : <ChevronDown size={16} className="ml-2" />}
        </button>

        {/* All Themes */}
        {showAllThemes && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2"
          >
            {THEMES.map((t) => (
              <button
                key={t}
                className={`
                  group flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors
                  ${theme === t ? "bg-base-200 ring-2 ring-primary" : "hover:bg-base-200/50"}
                `}
                onClick={() => handleThemeChange(t)}
              >
                <div className="relative h-8 w-full rounded-md overflow-hidden" data-theme={t}>
                  <div className="absolute inset-0 grid grid-cols-4 gap-px p-1">
                    <div className="rounded bg-primary"></div>
                    <div className="rounded bg-secondary"></div>
                    <div className="rounded bg-accent"></div>
                    <div className="rounded bg-neutral"></div>
                  </div>
                </div>
                <span className="text-[11px] font-medium truncate w-full text-center">
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </span>
              </button>
            ))}
          </motion.div>
        )}

        {/* Preview Section */}
        <h3 className="text-lg font-semibold mb-3">Preview</h3>
        <div className="rounded-xl border border-base-300 overflow-hidden bg-base-100 shadow-lg">
          <div className="p-4 bg-base-200">
            <div className="max-w-lg mx-auto">
              {/* Mock Chat UI */}
              <div className="bg-base-100 rounded-xl shadow-sm overflow-hidden">
                {/* Chat Header */}
                <div className="px-4 py-3 border-b border-base-300 bg-base-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-content font-medium">
                      J
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">John Doe</h3>
                      <p className="text-xs text-base-content/70">Online</p>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="p-4 space-y-4 min-h-[200px] max-h-[200px] overflow-y-auto bg-base-100">
                  {PREVIEW_MESSAGES.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isSent ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`
                          max-w-[80%] rounded-xl p-3 shadow-sm
                          ${message.isSent ? "bg-primary text-primary-content" : "bg-base-200"}
                        `}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p
                          className={`
                            text-[10px] mt-1.5
                            ${message.isSent ? "text-primary-content/70" : "text-base-content/70"}
                          `}
                        >
                          12:00 PM
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="p-4 border-t border-base-300 bg-base-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="input input-bordered flex-1 text-sm h-10"
                      placeholder="Type a message..."
                      value="This is a preview"
                      readOnly
                    />
                    <button className="btn btn-primary h-10 min-h-0">
                      <Send size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SettingsPage;
