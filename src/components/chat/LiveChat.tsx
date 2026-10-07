"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageCircle, Send, X, Minimize2, Maximize2,
  User, Loader2, Clock, Sparkles, Shield, ChevronUp
} from "lucide-react";

const RECENT_MESSAGE_COUNT = 8;
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { GeorgeMascot } from "@/components/george/GeorgeMascot";
import { GEORGE_IMAGE_SRC, GEORGE_NAME } from "@/lib/george";
import { useNotifications } from "@/contexts/NotificationContext";

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

function mergeChatMessages(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const withoutRedundantTemps = existing.filter(msg => {
    if (!msg.id.startsWith("temp-") || msg.senderType !== "MEMBER") {
      return true;
    }
    return !incoming.some(
      incomingMsg =>
        incomingMsg.senderType === "MEMBER" &&
        incomingMsg.message === msg.message
    );
  });

  const byId = new Map<string, ChatMessage>();
  for (const msg of withoutRedundantTemps) {
    byId.set(msg.id, msg);
  }
  for (const msg of incoming) {
    byId.set(msg.id, msg);
  }
  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

function getLastPersistedMessageId(messages: ChatMessage[]): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (!messages[i].id.startsWith("temp-")) {
      return messages[i].id;
    }
  }
  return undefined;
}

export function LiveChat({ isOpen, onClose, onMinimize, minimized = false }: LiveChatProps) {
  const { markMatchingActionUrlRead } = useNotifications();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [coachesAvailable, setCoachesAvailable] = useState(false);
  const [requestingCareTeam, setRequestingCareTeam] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const sendingRef = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    sendingRef.current = sending;
  }, [sending]);

  useEffect(() => {
    if (isOpen) setShowHistory(false);
  }, [isOpen]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const hiddenHistoryCount =
    !showHistory && messages.length > RECENT_MESSAGE_COUNT
      ? messages.length - RECENT_MESSAGE_COUNT
      : 0;
  const visibleMessages =
    hiddenHistoryCount > 0 ? messages.slice(-RECENT_MESSAGE_COUNT) : messages;

  // Fetch or create chat session
  const initializeChat = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/chat");
      const data = await res.json();

      if (data.session) {
        setSession(data.session);
        setMessages(mergeChatMessages([], data.session.messages || []));
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

      if (!res.ok) {
        throw new Error(data.error || "Failed to start chat");
      }

      if (data.session) {
        setSession(data.session);
        setMessages(mergeChatMessages([], data.session.messages || []));
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
    if (sendingRef.current) return;

    try {
      const lastMessageId = getLastPersistedMessageId(messagesRef.current);
      const url = lastMessageId
        ? `/api/chat/messages?sessionId=${sessionId}&after=${lastMessageId}`
        : `/api/chat/messages?sessionId=${sessionId}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.messages && data.messages.length > 0) {
        setMessages(prev => mergeChatMessages(prev, data.messages));
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
  }, []);

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

      if (!res.ok || !data.memberMessage) {
        throw new Error(data.error || "Failed to send message");
      }

      // Replace temp message with real one
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== tempMessage.id);
        const incoming = [data.memberMessage];
        if (data.aiMessage) {
          incoming.push(data.aiMessage);
        }
        if (data.systemMessage) {
          incoming.push(data.systemMessage);
        }
        return mergeChatMessages(withoutTemp, incoming);
      });

      if (data.session) {
        setSession(prev => (prev ? { ...prev, ...data.session } : null));
      }
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

  const requestCareTeam = async () => {
    if (!session || requestingCareTeam) return;
    setRequestingCareTeam(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "requestCareTeam", sessionId: session.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to notify care team");
      }
      if (data.session) {
        setSession(data.session);
        setMessages(mergeChatMessages([], data.session.messages || []));
      } else if (data.systemMessage) {
        setMessages(prev => mergeChatMessages(prev, [data.systemMessage]));
      }
      toast.success(
        data.alreadyWaiting
          ? "Care team already notified — they'll join shortly."
          : "Care team notified — they'll join this chat shortly."
      );
    } catch (error) {
      console.error("Error requesting care team:", error);
      toast.error("Couldn't notify care team. Please try again.");
    } finally {
      setRequestingCareTeam(false);
    }
  };

  // Initialize on mount
  useEffect(() => {
    if (isOpen && !minimized) {
      initializeChat();
    }
  }, [isOpen, minimized, initializeChat]);

  // Poll whenever chat is open so care-partner replies appear without Refresh / bell
  useEffect(() => {
    if (!session || session.status === "ENDED" || minimized) return;

    void pollMessages(session.id);
    pollIntervalRef.current = setInterval(() => {
      pollMessages(session.id);
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [session, minimized, pollMessages]);

  // Clear live-chat notifications while the panel is open
  useEffect(() => {
    if (!isOpen || minimized) return;
    markMatchingActionUrlRead("chat=1");
    const interval = window.setInterval(() => {
      markMatchingActionUrlRead("chat=1");
    }, 5000);
    return () => window.clearInterval(interval);
  }, [isOpen, minimized, markMatchingActionUrlRead]);

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
        return { name: "You", avatar: null as string | null, color: "bg-emerald-600" };
      case "COACH":
        return { name: "Care team", avatar: null, color: "bg-teal-600" };
      case "AI":
        return { name: GEORGE_NAME, avatar: GEORGE_IMAGE_SRC, color: "bg-[#e6ebe3]" };
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
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.2 }}
        className={
          minimized
            ? // Middle-right (top-based so Framer Motion y doesn't fight layout)
              "fixed z-[70] top-[max(1.25rem,calc(50dvh-3.5rem))] right-4 md:right-6"
            : // Mobile: full device sheet so the composer stays on-screen. Desktop: middle-right.
              "fixed z-[70] inset-0 flex max-h-[100dvh] flex-col overflow-hidden sm:inset-auto sm:top-[max(1.25rem,calc(50dvh-min(280px,42dvh)))] sm:right-6 sm:bottom-auto sm:h-[min(560px,calc(100dvh-2.5rem))] sm:max-h-[calc(100dvh-2.5rem)] sm:w-[400px]"
        }
      >
        <Card
          className={
            minimized
              ? "w-72 overflow-hidden border-0 shadow-2xl"
              : "flex h-full min-h-0 max-h-full w-full flex-col overflow-hidden rounded-none border-0 shadow-2xl sm:rounded-xl"
          }
        >
          {/* Header */}
          <CardHeader className="shrink-0 p-4 pt-[max(1rem,env(safe-area-inset-top,0px))] bg-gradient-to-r from-[#4a6243] to-[#5c7a52] text-white sm:pt-4">
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden shrink-0">
                  <GeorgeMascot size="sm" cropFace />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-base">{GEORGE_NAME}</CardTitle>
                  <p className="truncate text-xs text-white/80">
                    {session?.status === "WAITING" && `${GEORGE_NAME} + care team notified`}
                    {session?.status === "ACTIVE" && "Care partner online"}
                    {session?.status === "AI_HANDLING" && "Your first point of contact"}
                    {!session && "Your first point of contact"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
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
            <CardContent className="flex min-h-0 flex-1 flex-col p-0">
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
                  <GeorgeMascot size="lg" idle className="mb-4" />
                  <h3 className="font-semibold mb-2">Chat with {GEORGE_NAME}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {GEORGE_NAME} is your first point of contact. If you need a care partner,
                    he can bring them into this chat
                    {coachesAvailable ? " — someone is online now." : "."}
                  </p>
                  <Button onClick={startChat} className="bg-[#4a6243] hover:bg-[#3a5035]">
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
                  {/* Native overflow scroll — more reliable than ScrollArea in mobile flex sheets */}
                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
                    <div className="space-y-4">
                      {hiddenHistoryCount > 0 && (
                        <div className="flex justify-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => setShowHistory(true)}
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                            Show {hiddenHistoryCount} earlier message
                            {hiddenHistoryCount === 1 ? "" : "s"}
                          </Button>
                        </div>
                      )}
                      {visibleMessages.map((msg) => {
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
                            <Avatar className="w-8 h-8 shrink-0 bg-white">
                              {senderInfo.avatar ? (
                                <AvatarImage
                                  src={senderInfo.avatar}
                                  alt={senderInfo.name}
                                  className="object-cover object-[center_28%]"
                                />
                              ) : null}
                              <AvatarFallback className={senderInfo.color}>
                                {msg.senderType === "COACH" ? (
                                  <Sparkles className="w-4 h-4 text-white" />
                                ) : (
                                  <User className="w-4 h-4 text-white" />
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[75%]`}>
                              {!isMe ? (
                                <span className="text-[10px] font-medium text-[#4a6243] mb-0.5 px-1">
                                  {senderInfo.name}
                                </span>
                              ) : null}
                              <div className={`px-3 py-2 rounded-2xl ${
                                isMe
                                  ? 'bg-[#4a6243] text-white rounded-br-md'
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
                  </div>

                  {/* Input Area — pinned to bottom of the sheet (safe-area aware) */}
                  <div className="shrink-0 border-t bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:p-4 sm:pb-4 dark:bg-slate-950">
                    {session.status === "WAITING" && (
                      <div className="flex items-center gap-2 mb-3 p-2 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-xs text-amber-700 dark:text-amber-300">
                          Care team notified — {GEORGE_NAME} is still here until a care partner joins.
                        </span>
                      </div>
                    )}
                    {session.status === "AI_HANDLING" && (
                      <div className="mb-3">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full border-[#cdd8c6] text-[#2c3628] hover:bg-[#e6ebe3]"
                          onClick={requestCareTeam}
                          disabled={requestingCareTeam}
                        >
                          {requestingCareTeam ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4 mr-2" />
                          )}
                          Ask a care partner to join
                        </Button>
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
                        className="bg-[#4a6243] hover:bg-[#3a5035]"
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
      aria-label={`Chat with ${GEORGE_NAME}`}
      className="fixed top-[calc(50dvh-1.75rem)] right-4 z-[60] md:right-6 w-14 h-14 rounded-full bg-white text-[#4a6243] shadow-lg flex items-center justify-center hover:shadow-xl transition-shadow border border-[#cdd8c6] overflow-hidden"
    >
      <GeorgeMascot size="sm" cropFace />
      {hasUnread && (
        <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-white" />
      )}
    </motion.button>
  );
}
