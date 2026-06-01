"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageCircle, Send, X, Minimize2, Maximize2, Bot,
  User, Loader2, Phone, Clock, Sparkles, Shield
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  senderId: string;
  senderType: "MEMBER" | "COACH" | "AI" | "SYSTEM";
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface ChatSession {
  id: string;
  memberId: string;
  coachId: string | null;
  status: "WAITING" | "ACTIVE" | "AI_HANDLING" | "ENDED";
  isAiHandled: boolean;
  messages: ChatMessage[];
}

interface LiveChatProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  minimized?: boolean;
}

export function LiveChat({ isOpen, onClose, onMinimize, minimized = false }: LiveChatProps) {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [coachesAvailable, setCoachesAvailable] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch or create chat session
  const initializeChat = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/chat");
      const data = await res.json();

      if (data.session) {
        setSession(data.session);
        setMessages(data.session.messages || []);
      }
      setCoachesAvailable(data.coachesAvailable);
    } catch (error) {
      console.error("Error initializing chat:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Start new chat
  const startChat = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const data = await res.json();

      if (data.session) {
        setSession(data.session);
        // Refresh messages
        await pollMessages(data.session.id);
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("Failed to start chat");
    } finally {
      setLoading(false);
    }
  };

  // Poll for new messages
  const pollMessages = useCallback(async (sessionId: string) => {
    try {
      const lastMessageId = messages[messages.length - 1]?.id;
      const url = lastMessageId
        ? `/api/chat/messages?sessionId=${sessionId}&after=${lastMessageId}`
        : `/api/chat/messages?sessionId=${sessionId}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.messages && data.messages.length > 0) {
        if (lastMessageId) {
          setMessages(prev => [...prev, ...data.messages]);
        } else {
          setMessages(data.messages);
        }
      }

      // Update session status
      if (data.session) {
        setSession(prev => prev ? { ...prev, ...data.session } : null);

        // If session ended, stop polling
        if (data.session.status === "ENDED") {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
          }
        }
      }
    } catch (error) {
      console.error("Error polling messages:", error);
    }
  }, [messages]);

  // Send message
  const sendMessage = async () => {
    if (!inputMessage.trim() || !session || sending) return;

    const messageText = inputMessage.trim();
    setInputMessage("");
    setSending(true);

    // Optimistically add message
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      senderId: "me",
      senderType: "MEMBER",
      message: messageText,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "message",
          sessionId: session.id,
          message: messageText,
        }),
      });
      const data = await res.json();

      // Replace temp message with real one
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempMessage.id);
        const newMessages = [data.memberMessage];
        if (data.aiMessage) {
          newMessages.push(data.aiMessage);
        }
        return [...filtered, ...newMessages];
      });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setInputMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  // End chat
  const endChat = async () => {
    if (!session) return;

    try {
      await fetch(`/api/chat?sessionId=${session.id}`, {
        method: "DELETE",
      });
      setSession(null);
      setMessages([]);
      toast.success("Chat ended. Thank you for contacting us!");
      onClose();
    } catch (error) {
      console.error("Error ending chat:", error);
      toast.error("Failed to end chat");
    }
  };

  // Initialize on mount
  useEffect(() => {
    if (isOpen && !minimized) {
      initializeChat();
    }
  }, [isOpen, minimized, initializeChat]);

  // Poll for messages when session active
  useEffect(() => {
    if (session && session.status !== "ENDED" && !minimized) {
      pollIntervalRef.current = setInterval(() => {
        pollMessages(session.id);
      }, 3000);

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    }
  }, [session, minimized, pollMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Format time
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get sender display info
  const getSenderInfo = (msg: ChatMessage) => {
    switch (msg.senderType) {
      case "MEMBER":
        return { name: "You", avatar: null, color: "bg-emerald-600" };
      case "COACH":
        return { name: "Health Coach", avatar: null, color: "bg-teal-600" };
      case "AI":
        return { name: "AI Assistant", avatar: null, color: "bg-violet-600" };
      case "SYSTEM":
        return { name: "System", avatar: null, color: "bg-slate-500" };
      default:
        return { name: "Unknown", avatar: null, color: "bg-slate-500" };
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className={`fixed z-50 ${minimized ? 'bottom-4 right-4' : 'bottom-4 right-4 sm:bottom-6 sm:right-6'}`}
      >
        <Card className={`shadow-2xl border-0 overflow-hidden ${
          minimized ? 'w-72' : 'w-[360px] sm:w-[400px] h-[600px] max-h-[80vh]'
        }`}>
          {/* Header */}
          <CardHeader className="p-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <CardTitle className="text-base">Your Care Team</CardTitle>
                  <p className="text-xs text-white/80">
                    {session?.status === "WAITING" && "Connecting..."}
                    {session?.status === "ACTIVE" && "Online"}
                    {session?.status === "AI_HANDLING" && "Online"}
                    {!session && "Available"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {onMinimize && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={onMinimize}
                  >
                    {minimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={session ? endChat : onClose}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {!minimized && (
            <CardContent className="p-0 flex flex-col h-[calc(100%-80px)]">
              {/* Loading State */}
              {loading && (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-teal-600 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Connecting...</p>
                  </div>
                </div>
              )}

              {/* No Session - Start Chat */}
              {!loading && !session && (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center mb-4">
                    <MessageCircle className="w-8 h-8 text-teal-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Chat with Our Care Team</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {coachesAvailable
                      ? "A health coach is available to help you now."
                      : "Our AI assistant is ready to help with your questions."
                    }
                  </p>
                  <Button onClick={startChat} className="bg-teal-600 hover:bg-teal-700">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Start Chat
                  </Button>
                  <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    <span>Private & Secure</span>
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              {!loading && session && (
                <>
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((msg) => {
                        const senderInfo = getSenderInfo(msg);
                        const isMe = msg.senderType === "MEMBER";
                        const isSystem = msg.senderType === "SYSTEM";

                        if (isSystem) {
                          return (
                            <div key={msg.id} className="flex justify-center">
                              <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                                {msg.message}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
                          >
                            <Avatar className="w-8 h-8 shrink-0">
                              <AvatarFallback className={senderInfo.color}>
                                {msg.senderType === "AI" ? (
                                  <Bot className="w-4 h-4 text-white" />
                                ) : msg.senderType === "COACH" ? (
                                  <Sparkles className="w-4 h-4 text-white" />
                                ) : (
                                  <User className="w-4 h-4 text-white" />
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                              <div className={`px-3 py-2 rounded-2xl ${
                                isMe
                                  ? 'bg-teal-600 text-white rounded-br-md'
                                  : 'bg-slate-100 dark:bg-slate-800 rounded-bl-md'
                              }`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                              </div>
                              <span className="text-[10px] text-muted-foreground mt-1">
                                {formatTime(msg.createdAt)}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Input Area */}
                  <div className="p-4 border-t bg-white dark:bg-slate-950">
                    {session.status === "WAITING" && (
                      <div className="flex items-center gap-2 mb-3 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                        <Clock className="w-4 h-4 text-amber-600" />
                        <span className="text-xs text-amber-700 dark:text-amber-300">
                          Waiting for a health coach...
                        </span>
                      </div>
                    )}
                    <form
                      onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
                      className="flex gap-2"
                    >
                      <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1"
                        disabled={sending}
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={!inputMessage.trim() || sending}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        {sending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </form>
                  </div>
                </>
              )}
            </CardContent>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

// Floating Chat Button
export function ChatButton({ onClick, hasUnread = false }: { onClick: () => void; hasUnread?: boolean }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow"
    >
      <MessageCircle className="w-6 h-6" />
      {hasUnread && (
        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
      )}
    </motion.button>
  );
}
