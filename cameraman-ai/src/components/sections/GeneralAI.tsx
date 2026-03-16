import { useState, useRef, useEffect } from "react";
import { Send, Image as ImageIcon, X, Loader2, Bot, User, Paperclip } from "lucide-react";
import { useChatStream } from "@/hooks/use-chat-stream";
import { Markdown } from "@/components/ui/Markdown";
import { cn, fileToBase64 } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export function GeneralAI() {
  const [input, setInput] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { messages, isStreaming, sendMessage } = useChatStream();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert("Please upload an image file");
        return;
      }
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !imageFile) || isStreaming) return;

    let base64 = null;
    let mimeType = null;
    
    if (imageFile) {
      base64 = await fileToBase64(imageFile);
      mimeType = imageFile.type;
    }

    const currentInput = input;
    setInput("");
    clearImage();
    
    await sendMessage(currentInput, base64, mimeType);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[800px] bg-card rounded-2xl border border-border shadow-xl shadow-black/10 overflow-hidden relative">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-hide">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 ring-8 ring-primary/5">
              <Bot className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-display font-semibold mb-2">How can I help you today?</h3>
            <p className="text-muted-foreground max-w-md">
              Ask me anything, upload an image for analysis, or request help with your studies.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={idx} 
              className={cn(
                "flex w-full",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div className={cn(
                "flex gap-4 max-w-[85%] sm:max-w-[75%]",
                msg.role === "user" ? "flex-row-reverse" : "flex-row"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
                )}>
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                
                <div className={cn(
                  "p-4 rounded-2xl",
                  msg.role === "user" 
                    ? "bg-primary text-primary-foreground rounded-tr-sm" 
                    : "bg-secondary text-secondary-foreground rounded-tl-sm border border-border/50"
                )}>
                  {msg.imageBase64 && (
                    <img 
                      src={`data:image/jpeg;base64,${msg.imageBase64}`} 
                      alt="Uploaded content" 
                      className="max-w-full sm:max-w-xs rounded-xl mb-3 shadow-md"
                    />
                  )}
                  {msg.content ? (
                    <Markdown content={msg.content} className={msg.role === "user" ? "prose-p:text-primary-foreground prose-strong:text-primary-foreground" : ""} />
                  ) : (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-background/50 backdrop-blur-md border-t border-border">
        <AnimatePresence>
          {imagePreview && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 relative inline-block"
            >
              <div className="relative group">
                <img src={imagePreview} alt="Preview" className="h-20 rounded-lg border border-border object-cover" />
                <button 
                  onClick={clearImage}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="relative flex items-end gap-2">
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleImageChange}
          />
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl transition-colors shrink-0"
            title="Upload image"
          >
            <ImageIcon className="w-5 h-5" />
          </button>
          
          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Message Cameraman AI..."
              className="w-full bg-input border border-border rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none min-h-[52px] max-h-[200px] text-foreground placeholder:text-muted-foreground scrollbar-hide"
              rows={1}
            />
          </div>

          <button 
            type="submit"
            disabled={(!input.trim() && !imageFile) || isStreaming}
            className="p-3 bg-primary text-primary-foreground rounded-xl shadow-lg hover:shadow-primary/20 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
          >
            {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
        <p className="text-center text-[10px] text-muted-foreground mt-2">
          Cameraman AI can make mistakes. Consider verifying important information.
        </p>
      </div>
    </div>
  );
}
