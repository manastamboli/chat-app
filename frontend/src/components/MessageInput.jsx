import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Smile, Phone, Video } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef(null);
  const formRef = useRef(null);
  const { sendMessage } = useChatStore();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
    if (isSending) return;

    setIsSending(true);

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    // Send message on Enter (but not with Shift+Enter for new line)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.dispatchEvent(
        new Event('submit', { cancelable: true, bubbles: true })
      );
    }
  };

  return (
    <div className="p-4 bg-[#0B1623] border-t border-[#1A2737]">
      {imagePreview && (
        <div className="mb-3">
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-32 rounded-lg border border-[#1A2737]"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 size-6 rounded-full bg-[#1A2737] text-white
              flex items-center justify-center hover:bg-[#2A3747] transition-colors"
              type="button"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          <button 
            className="btn btn-circle btn-sm bg-[#1A2737] border-none hover:bg-[#2A3747]"
            type="button"
          >
            <Phone className="size-5 text-[#4B96F8]" />
          </button>
          <button 
            className="btn btn-circle btn-sm bg-[#1A2737] border-none hover:bg-[#2A3747]"
            type="button"
          >
            <Video className="size-5 text-[#4B96F8]" />
          </button>
        </div>

        <form 
          ref={formRef}
          onSubmit={handleSendMessage} 
          className="flex-1 flex items-center gap-2"
        >
          <div className="flex-1 flex items-center gap-2 bg-[#1A2737] rounded-full px-4 py-2">
            <button
              type="button"
              className="text-[#4B96F8] hover:text-[#4B96F8]/80 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Image size={20} />
            </button>
            
            <input
              type="text"
              className="flex-1 bg-transparent text-white placeholder-gray-400 focus:outline-none"
              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <button
              type="button"
              className="text-[#4B96F8] hover:text-[#4B96F8]/80 transition-colors"
            >
              <Smile size={20} />
            </button>
          </div>

          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />

          <button
            type="submit"
            className={`btn btn-circle btn-sm bg-[#4B96F8] text-white hover:bg-[#4B96F8]/90 disabled:bg-[#4B96F8]/50 ${isSending ? 'opacity-70' : ''}`}
            disabled={(!text.trim() && !imagePreview) || isSending}
          >
            <Send size={18} className={isSending ? 'animate-pulse' : ''} />
          </button>
        </form>
      </div>
    </div>
  );
};
export default MessageInput;
