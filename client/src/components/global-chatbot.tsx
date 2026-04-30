import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, X, Send, Bot, Loader2, Sparkles, Minus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import ReactMarkdown from "react-markdown";

export function GlobalChatbot() {
  const { student } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Hi! I'm your EduLens AI assistant. How can I help you today?" }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  const chatMutation = useMutation({
    mutationFn: async (data: { message: string; history: any[] }) => {
      const res = await apiRequest("POST", "/api/ai/chat", data);
      return res.json();
    },
    onSuccess: (data) => {
      setHistory((prev) => [...prev, { role: "assistant", content: data.message }]);
    },
    onError: (error: any) => {
      setHistory((prev) => [...prev, { role: "assistant", content: `Error: ${error.message || "Could not connect to the AI brain."}` }]);
    }
  });

  const handleSend = () => {
    if (!message.trim() || chatMutation.isPending) return;
    
    const userMessage = message;
    setMessage("");
    setHistory((prev) => [...prev, { role: "user", content: userMessage }]);
    
    chatMutation.mutate({
      message: userMessage,
      history: history.slice(1) // Don't send the initial greeting
    });
  };

  // Only show the chatbot if the user is a student
  if (student?.role !== "student") return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 h-[500px] max-h-[80vh] bg-card border border-border shadow-2xl rounded-2xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="h-14 bg-primary text-primary-foreground flex items-center justify-between px-4 shrink-0 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]" />
              <div className="flex items-center gap-2 relative z-10">
                <div className="w-8 h-8 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">EduLens Assistant</h3>
                  <p className="text-[10px] text-primary-foreground/80 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Online</p>
                </div>
              </div>
              <div className="flex items-center gap-1 relative z-10">
                <Button variant="ghost" size="icon" className="w-8 h-8 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground" onClick={() => setIsOpen(false)}>
                  <Minus className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="w-8 h-8 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground" onClick={() => {
                  setIsOpen(false);
                  // Optional: Clear history or specific state if needed for "closing"
                }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
              {history.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-card border border-border rounded-tl-sm text-foreground"}`}>
                    {msg.role === "assistant" && idx > 0 && <Sparkles className="w-3 h-3 text-primary mb-1 opacity-50" />}
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:text-muted-foreground">
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm bg-card border border-border flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-muted-foreground text-xs italic">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-card border-t border-border/50 flex gap-2">
              <Input
                placeholder="Ask me anything..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className="bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
                disabled={chatMutation.isPending}
              />
              <Button size="icon" className="shrink-0 bg-primary hover:bg-primary/90 rounded-full w-10 h-10 shadow-md" onClick={handleSend} disabled={!message.trim() || chatMutation.isPending}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.div 
        className="fixed bottom-6 right-6 z-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          size="icon"
          className="w-14 h-14 rounded-full shadow-2xl bg-violet-600 hover:bg-violet-700 text-white relative group"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
          {!isOpen && (
             <span className="absolute -top-1 -right-1 flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border border-white"></span>
             </span>
          )}
        </Button>
      </motion.div>
    </>
  );
}
