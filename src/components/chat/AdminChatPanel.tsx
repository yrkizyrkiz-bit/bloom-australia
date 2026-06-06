"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  MessageCircle, Send, User, Loader2, Clock, Bot,
  UserCheck, Users, History, Settings, Phone, X,
  CheckCircle2, AlertCircle, ArrowRight, Sparkles
} from "lucide-react";
import { toast } from "sonner";

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
  startedAt: string;
  lastMessageAt: string;
  member?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  lastMessage?: ChatMessage | null;
}

interface ChatHistory {
  id: string;
  memberId: string;
  sessionId: string;
  coachId: string | null;
  coachName: string | null;
  wasAiHandled: boolean;
  transcript: ChatMessage[];
  startedAt: string;
  endedAt: string;
  messageCount: number;
  member?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface CoachAvailability {
  id: string;
  coachId: string;
  status: "ONLINE" | "BUSY" | "AWAY" | "OFFLINE";
  activeChats: number;
  maxChats: number;
}

export function AdminChatPanel() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [history, setHistory] = useState<ChatHistory[]>([]);
  const [availability, setAvailability] = useState<CoachAvailability | null>(null);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [viewHistory, setViewHistory] = useState<ChatHistory | null>(null);
  const [waitingCount, setWaitingCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/admin?view=my");
      const data = await res.json();
      setSessions(data.sessions || []);
      setAvailability(data.availability);
      setWaitingCount(data.waitingCount || 0);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch chat history
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/chat/admin?view=history");
      const data = await res.json();
      setHistory(data.history || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  }, []);

  // Poll messages for selected session
  const pollMessages = useCallback(async () => {
    if (!selectedSession) return;

    try {
      const res = await fetch(`/api/chat/messages?sessionId=${selectedSession.id}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Error polling messages:", error);
    }
  }, [selectedSession]);

  // Set status
  const setStatus = async (status: string) => {
    try {
      const res = await fetch("/api/chat/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setStatus", status }),
      });
      const data = await res.json();
      setAvailability(data.availability);
      toast.success(`Status set to ${status}`);
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  // Join chat
  const joinChat = async (sessionId: string) => {
    try {
      const res = await fetch("/api/chat/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", sessionId }),
      });
      const data = await res.json();
      if (data.session) {
        setSelectedSession(data.session);
        setMessages(data.session.messages || []);
        fetchSessions();
        toast.success("Joined chat");
      }
    } catch (error) {
      toast.error("Failed to join chat");
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!inputMessage.trim() || !selectedSession || sending) return;

    const messageText = inputMessage.trim();
    setInputMessage("");
    setSending(true);

    try {
      const res = await fetch("/api/chat/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "message",
          sessionId: selectedSession.id,
          message: messageText,
        }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
      }
    } catch (error) {
      toast.error("Failed to send message");
      setInputMessage(messageText);
    } finally {
      setSending(false);
    }
  };

  // Transfer to AI
  const transferToAI = async () => {
    if (!selectedSession) return;

    try {
      await fetch("/api/chat/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "transferToAI", sessionId: selectedSession.id }),
      });
      setSelectedSession(null);
      setMessages([]);
      fetchSessions();
      toast.success("Transferred to AI");
    } catch (error) {
      toast.error("Failed to transfer");
    }
  };

  // End chat
  const endChat = async () => {
    if (!selectedSession) return;

    try {
      await fetch("/api/chat/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end", sessionId: selectedSession.id }),
      });
      setSelectedSession(null);
      setMessages([]);
      fetchSessions();
      fetchHistory();
      toast.success("Chat ended");
    } catch (error) {
      toast.error("Failed to end chat");
    }
  };

  // Format time
  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-AU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Initialize
  useEffect(() => {
    fetchSessions();
    fetchHistory();
  }, [fetchSessions, fetchHistory]);

  // Poll for updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSessions();
      if (selectedSession) {
        pollMessages();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchSessions, pollMessages, selectedSession]);

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const statusColors = {
    ONLINE: "bg-green-500",
    BUSY: "bg-amber-500",
    AWAY: "bg-orange-500",
    OFFLINE: "bg-slate-400",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${statusColors[availability?.status || "OFFLINE"]}`} />
                <span className="font-medium">{availability?.status || "OFFLINE"}</span>
              </div>
              <Badge variant="secondary">
                {availability?.activeChats || 0} / {availability?.maxChats || 3} chats
              </Badge>
              {waitingCount > 0 && (
                <Badge className="bg-amber-500">
                  {waitingCount} waiting
                </Badge>
              )}
            </div>
            <Select
              value={availability?.status || "OFFLINE"}
              onValueChange={setStatus}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ONLINE">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500" />
                    Online
                  </span>
                </SelectItem>
                <SelectItem value="BUSY">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Busy
                  </span>
                </SelectItem>
                <SelectItem value="AWAY">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    Away
                  </span>
                </SelectItem>
                <SelectItem value="OFFLINE">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    Offline
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sessions List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              Active Chats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
                <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
              </TabsList>

              <TabsContent value="active">
                <ScrollArea className="h-[400px]">
                  {sessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No active chats</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          onClick={() => {
                            if (session.coachId || session.status === "WAITING") {
                              if (session.status === "WAITING" && !session.coachId) {
                                joinChat(session.id);
                              } else {
                                setSelectedSession(session);
                                pollMessages();
                              }
                            }
                          }}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedSession?.id === session.id
                              ? 'bg-teal-50 dark:bg-teal-950/30 border-2 border-teal-500'
                              : 'bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-transparent'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback className="bg-teal-600 text-white">
                                  {session.member?.firstName?.[0] || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">
                                  {session.member?.firstName} {session.member?.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {session.member?.email}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                session.status === "WAITING" ? 'bg-amber-100 text-amber-700' :
                                session.status === "AI_HANDLING" ? 'bg-violet-100 text-violet-700' :
                                'bg-green-100 text-green-700'
                              }`}
                            >
                              {session.status === "WAITING" && <Clock className="w-3 h-3 mr-1" />}
                              {session.status === "AI_HANDLING" && <Bot className="w-3 h-3 mr-1" />}
                              {session.status === "ACTIVE" && <CheckCircle2 className="w-3 h-3 mr-1" />}
                              {session.status}
                            </Badge>
                          </div>
                          {session.lastMessage && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {session.lastMessage.message}
                            </p>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-muted-foreground">
                              {formatTime(session.lastMessageAt)}
                            </span>
                            {session.status === "WAITING" && !session.coachId && (
                              <Button size="sm" variant="default" className="h-6 text-xs bg-teal-600">
                                Join
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>

              <TabsContent value="history">
                <ScrollArea className="h-[400px]">
                  {history.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No chat history</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {history.slice(0, 20).map((chat) => (
                        <div
                          key={chat.id}
                          onClick={() => setViewHistory(chat)}
                          className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">
                              {chat.member?.firstName} {chat.member?.lastName}
                            </span>
                            {chat.wasAiHandled && (
                              <Badge variant="secondary" className="text-xs">
                                <Bot className="w-3 h-3 mr-1" /> AI
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(chat.startedAt)} • {chat.messageCount} messages
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Chat Window */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 border-b">
            {selectedSession ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-teal-600 text-white">
                      {selectedSession.member?.firstName?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">
                      {selectedSession.member?.firstName} {selectedSession.member?.lastName}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {selectedSession.member?.email}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={transferToAI}>
                    <Bot className="w-4 h-4 mr-1" /> Transfer to AI
                  </Button>
                  <Button variant="destructive" size="sm" onClick={endChat}>
                    <X className="w-4 h-4 mr-1" /> End
                  </Button>
                </div>
              </div>
            ) : (
              <CardTitle className="text-lg text-muted-foreground">
                Select a chat to begin
              </CardTitle>
            )}
          </CardHeader>
          <CardContent className="p-0 flex flex-col h-[500px]">
            {selectedSession ? (
              <>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isMe = msg.senderType === "COACH";
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
                        <div
                          key={msg.id}
                          className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''}`}
                        >
                          <Avatar className="w-8 h-8 shrink-0">
                            <AvatarFallback className={
                              msg.senderType === "AI" ? "bg-violet-600" :
                              msg.senderType === "COACH" ? "bg-teal-600" :
                              "bg-slate-600"
                            }>
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
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <div className="p-4 border-t">
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
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>Select a conversation from the list</p>
                  <p className="text-sm mt-1">or wait for new chats to arrive</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History Dialog */}
      <Dialog open={!!viewHistory} onOpenChange={() => setViewHistory(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="w-5 h-5 text-teal-600" />
              Chat History - {viewHistory?.member?.firstName} {viewHistory?.member?.lastName}
            </DialogTitle>
          </DialogHeader>
          {viewHistory && (
            <div className="space-y-4">
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{formatDate(viewHistory.startedAt)}</span>
                <span>•</span>
                <span>{viewHistory.messageCount} messages</span>
                {viewHistory.wasAiHandled && (
                  <>
                    <span>•</span>
                    <Badge variant="secondary" className="text-xs">
                      <Bot className="w-3 h-3 mr-1" /> AI Handled
                    </Badge>
                  </>
                )}
              </div>
              <ScrollArea className="h-[400px] border rounded-lg p-4">
                <div className="space-y-4">
                  {(viewHistory.transcript as ChatMessage[]).map((msg, index) => {
                    const isCoach = msg.senderType === "COACH";
                    const isSystem = msg.senderType === "SYSTEM";

                    if (isSystem) {
                      return (
                        <div key={index} className="flex justify-center">
                          <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                            {msg.message}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={index}
                        className={`flex gap-2 ${isCoach ? 'flex-row-reverse' : ''}`}
                      >
                        <Avatar className="w-6 h-6 shrink-0">
                          <AvatarFallback className={
                            msg.senderType === "AI" ? "bg-violet-600" :
                            msg.senderType === "COACH" ? "bg-teal-600" :
                            "bg-slate-600"
                          }>
                            {msg.senderType === "AI" ? "A" : msg.senderType === "COACH" ? "C" : "M"}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex flex-col ${isCoach ? 'items-end' : 'items-start'} max-w-[80%]`}>
                          <div className={`px-3 py-2 rounded-xl text-sm ${
                            isCoach
                              ? 'bg-teal-100 dark:bg-teal-900/30'
                              : 'bg-slate-100 dark:bg-slate-800'
                          }`}>
                            {msg.message}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
