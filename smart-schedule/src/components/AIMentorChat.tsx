import { useState, useRef, useEffect } from "react";
import { API_BASE } from "@/config/api";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles } from "lucide-react";
import { Button } from "./ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AIMentorChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm Aria, your AI Academic Mentor powered by Groq. I can help with study strategies, time management, exam prep, and more. What's on your mind? 🎓" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          // Send last 10 messages as context (excluding the initial system greeting)
          messages: newMessages.slice(-10).map(m => ({ role: m.role, content: m.content }))
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { role: "assistant", content: data.message }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I'm having trouble connecting. Please try again." }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Network error. Please check your connection." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:shadow-primary/50 transition-shadow ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageSquare className="w-6 h-6" />
        <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-success rounded-full border-2 border-background animate-pulse" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[350px] sm:w-[400px] h-[520px] max-h-[85vh] flex flex-col glass-card border border-white/10 shadow-2xl shadow-primary/10 overflow-hidden rounded-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-primary/10 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-1.5">
                    Aria AI Mentor
                    <Sparkles className="w-3 h-3 text-primary" />
                  </h3>
                  <p className="text-xs text-success flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />
                    Powered by Groq · llama-3.3-70b
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[82%] flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === "user" ? "bg-secondary text-secondary-foreground" : "bg-primary/20 text-primary"}`}>
                      {msg.role === "user" ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-white/5 text-foreground rounded-bl-none border border-white/8"
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <Bot className="w-3 h-3 text-primary" />
                  </div>
                  <div className="px-4 py-3 bg-white/5 border border-white/8 rounded-2xl rounded-bl-none">
                    <div className="flex gap-1">
                      {[0, 0.2, 0.4].map(d => (
                        <motion.div key={d} className="w-1.5 h-1.5 rounded-full bg-primary/60"
                          animate={{ y: [0, -4, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: d }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-black/20 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Aria anything..."
                disabled={loading}
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all text-foreground placeholder:text-muted-foreground disabled:opacity-50"
              />
              <Button type="submit" size="icon" disabled={!input.trim() || loading} className="rounded-full bg-primary hover:bg-primary/80 shrink-0">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
