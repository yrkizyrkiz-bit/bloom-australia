"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Send, User, Loader2 } from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  senderId: string;
  senderType: "PATIENT" | "CARE_PARTNER" | "SYSTEM";
  senderName: string;
  body: string;
  timestamp: string;
  read: boolean;
}

interface CarePartner {
  id: string;
  name: string;
}

export default function DashboardMessagesPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [carePartner, setCarePartner] = useState<CarePartner | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/patient/messages");
      const data = await res.json();

      if (data.success) {
        setMessages(data.data.messages);
        setCarePartner(data.data.carePartner);
      } else {
        setError(data.message || "Failed to load messages");
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchMessages();
    }
  }, [sessionStatus, fetchMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/patient/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage }),
      });

      const data = await res.json();
      if (data.success) {
        setMessages([...messages, data.data]);
        setNewMessage("");
      }
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) {
      return date.toLocaleTimeString("en-AU", {
        hour: "numeric",
        minute: "2-digit",
      });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString("en-AU", { weekday: "short" });
    } else {
      return date.toLocaleDateString("en-AU", {
        day: "numeric",
        month: "short",
      });
    }
  };

  if (sessionStatus === "loading" || isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1D9E75]" />
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#5c7a52] mb-4">Please log in to view messages</p>
          <Link href="/login" className="text-[#1D9E75] hover:underline">
            Go to login
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchMessages}
            className="text-[#1D9E75] hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-[#e6ebe3] px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#1D9E75]/10 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-[#1D9E75]" />
          </div>
          <div>
            <h1 className="font-semibold text-[#34412f]">
              {carePartner?.name || "Care Partner"}
            </h1>
            <p className="text-sm text-[#5c7a52]">Care Partner</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fdfbf7]">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#5c7a52]">No messages yet</p>
            <p className="text-sm text-[#5c7a52] mt-1">
              Start a conversation with your care partner
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.senderType === "PATIENT" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[75%] ${
                  message.senderType === "PATIENT"
                    ? "bg-[#1D9E75] text-white rounded-2xl rounded-br-sm"
                    : "bg-white border border-[#e6ebe3] rounded-2xl rounded-bl-sm"
                } px-4 py-3`}
              >
                {message.senderType === "CARE_PARTNER" && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-[#1D9E75]">
                      {message.senderName}
                    </span>
                    <span className="px-1.5 py-0.5 bg-[#1D9E75]/10 text-[#1D9E75] text-[10px] rounded">
                      Care Partner
                    </span>
                  </div>
                )}
                <p
                  className={`text-sm ${
                    message.senderType === "PATIENT"
                      ? "text-white"
                      : "text-[#34412f]"
                  }`}
                >
                  {message.body}
                </p>
                <p
                  className={`text-[10px] mt-1 ${
                    message.senderType === "PATIENT"
                      ? "text-white/70"
                      : "text-[#5c7a52]"
                  }`}
                >
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="bg-white border-t border-[#e6ebe3] px-6 py-4"
      >
        <div className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={isSending}
            className="flex-1 px-4 py-3 rounded-full border border-[#e6ebe3] focus:outline-none focus:border-[#1D9E75] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending}
            className="w-12 h-12 bg-[#1D9E75] text-white rounded-full flex items-center justify-center hover:bg-[#178a64] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
