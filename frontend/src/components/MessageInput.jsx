import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X, Smile, Mic, Pin } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef(null);
  const formRef = useRef(null);
  const { sendMessage, selectedUser } = useChatStore();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Store the actual file for form submission
    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imageFile) return;
    if (isSending) return;

    setIsSending(true);

    try {
      // Create a FormData object for file upload
      const formData = new FormData();
      formData.append("text", text.trim());
      
      if (imageFile) {
        formData.append("image", imageFile);
      }

      await sendMessage(formData);

      setText("");
      setImageFile(null);
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

  const handleStartVoiceRecording = () => {
    setIsRecording(!isRecording);
    // To be implemented: voice recording functionality
    if (!isRecording) {
      console.log("Starting voice recording...");
      toast.success("Voice recording started");
    } else {
      console.log("Stopping voice recording...");
      toast.success("Voice recording stopped");
    }
  };

  const handlePinChat = () => {
    // To be implemented: pin chat functionality
    console.log("Pin chat with", selectedUser?.fullName);
    toast.success(`Pinned conversation with ${selectedUser?.fullName}`);
  };

  return (
    <div className="p-4 bg-base-100 border-t border-base-300">
      {imagePreview && (
        <div className="mb-3">
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-h-32 rounded-lg border border-base-300"
            />
            <button
              onClick={removeImage}
              className="absolute -top-2 -right-2 size-6 rounded-full bg-base-300 text-base-content
              flex items-center justify-center hover:bg-base-300/80 transition-colors"
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
            className={`btn btn-circle btn-sm ${isRecording ? 'bg-red-500 text-white' : 'bg-base-300 text-primary'} border-none hover:opacity-80`}
            type="button"
            onClick={handleStartVoiceRecording}
            title="Voice message"
          >
            <Mic className="size-5" />
          </button>
          <button 
            className="btn btn-circle btn-sm bg-base-300 border-none hover:bg-base-300/80"
            type="button"
            onClick={handlePinChat}
            title="Pin conversation"
          >
            <Pin className="size-5 text-primary" />
          </button>
        </div>

        <form 
          ref={formRef}
          onSubmit={handleSendMessage} 
          className="flex-1 flex items-center gap-2"
          encType="multipart/form-data"
        >
          <div className="flex-1 flex items-center gap-2 bg-base-300 rounded-full px-4 py-2">
            <button
              type="button"
              className="text-primary hover:text-primary/80 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Image size={20} />
            </button>
            
            <input
              type="text"
              className="flex-1 bg-transparent text-base-content placeholder-base-content/50 focus:outline-none"
              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <button
              type="button"
              className="text-primary hover:text-primary/80 transition-colors"
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
            className="btn btn-circle btn-sm bg-primary text-primary-content hover:bg-primary/90 disabled:bg-primary/50"
            disabled={(!text.trim() && !imageFile) || isSending}
          >
            <Send size={18} className={isSending ? 'animate-pulse' : ''} />
          </button>
        </form>
      </div>
    </div>
  );
};
export default MessageInput;
