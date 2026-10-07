"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Inbox, Loader2, Plus, RefreshCw, Search, Send, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ThreadSummary = {
  id: string;
  subject: string;
  status: string;
  lastMessageAt: string;
  unreadCount: number;
  preview: string;
  member: { id: string; name: string; email: string };
};

type ThreadMessage = {
  id: string;
  senderId: string;
  senderRole: string;
  body: string;
  createdAt: string;
};

type ThreadDetail = {
  id: string;
  subject: string;
  status: string;
  member: { id: string; name: string; email: string };
  messages: ThreadMessage[];
};

type MemberOption = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function memberLabel(member: MemberOption) {
  return `${member.firstName || ""} ${member.lastName || ""}`.trim() || member.email;
}

export default function CareCommsMessagesClient() {
  const searchParams = useSearchParams();
  const [threads, setThreads] = useState<ThreadSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ThreadDetail | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);

  const [composeOpen, setComposeOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState<MemberOption[]>([]);
  const [searchingMembers, setSearchingMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MemberOption | null>(null);
  const [composeSubject, setComposeSubject] = useState("Message from your care team");
  const [composeBody, setComposeBody] = useState("");
  const [composing, setComposing] = useState(false);

  const loadThreads = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch("/api/admin/care-support/threads", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load threads");
      const data = await res.json();
      setThreads(data.threads || []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load messages");
    } finally {
      setLoadingList(false);
    }
  }, []);

  const openThread = useCallback(async (id: string, opts?: { soft?: boolean }) => {
    const soft = Boolean(opts?.soft);
    setSelectedId(id);
    if (!soft) {
      setLoadingDetail(true);
      setDetail(null);
      setReply("");
    }
    try {
      const res = await fetch(`/api/admin/care-support/threads/${id}`, {
        cache: "no-store",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to load conversation");
      }
      if (!data.thread?.id) {
        throw new Error("Conversation data missing");
      }
      setDetail(data.thread);
      setThreads((prev) =>
        prev.map((t) => (t.id === id ? { ...t, unreadCount: 0 } : t))
      );
    } catch (error) {
      if (!soft) {
        setSelectedId(null);
        setDetail(null);
      }
      toast.error(error instanceof Error ? error.message : "Failed to load conversation");
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const closeThread = () => {
    setSelectedId(null);
    setDetail(null);
    setReply("");
  };

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    const fromQuery = searchParams.get("thread");
    if (fromQuery) {
      void openThread(fromQuery);
    }
  }, [searchParams, openThread]);

  useEffect(() => {
    if (!composeOpen || selectedMember) {
      setMemberResults([]);
      return;
    }
    const query = memberSearch.trim();
    if (query.length < 2) {
      setMemberResults([]);
      return;
    }
    const timer = window.setTimeout(async () => {
      setSearchingMembers(true);
      try {
        const res = await fetch(
          `/api/users?role=MEMBER&lite=1&limit=8&search=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        setMemberResults(data.users || []);
      } catch {
        setMemberResults([]);
      } finally {
        setSearchingMembers(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [composeOpen, memberSearch, selectedMember]);

  const resetCompose = () => {
    setMemberSearch("");
    setMemberResults([]);
    setSelectedMember(null);
    setComposeSubject("Message from your care team");
    setComposeBody("");
  };

  const sendReply = async () => {
    if (!selectedId || !reply.trim()) return;
    const threadId = selectedId;
    const text = reply.trim();
    const tempId = `temp-${Date.now()}`;
    setReply("");
    setSending(true);
    setDetail((prev) =>
      prev && prev.id === threadId
        ? {
            ...prev,
            messages: [
              ...prev.messages,
              {
                id: tempId,
                senderId: "me",
                senderRole: "STAFF",
                body: text,
                createdAt: new Date().toISOString(),
              },
            ],
          }
        : prev
    );
    try {
      const res = await fetch(`/api/admin/care-support/threads/${threadId}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to send reply");
      toast.success("Reply sent");
      // Soft refresh keeps the thread visible so the last message doesn't "eat"
      await openThread(threadId, { soft: true });
      await loadThreads();
    } catch (error) {
      setDetail((prev) =>
        prev
          ? { ...prev, messages: prev.messages.filter((m) => m.id !== tempId) }
          : prev
      );
      setReply(text);
      toast.error(error instanceof Error ? error.message : "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const startConversation = async () => {
    if (!selectedMember) {
      toast.error("Choose a member");
      return;
    }
    if (!composeBody.trim()) {
      toast.error("Write a message");
      return;
    }
    setComposing(true);
    try {
      const res = await fetch("/api/admin/care-support/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMember.id,
          subject: composeSubject.trim() || "Message from your care team",
          body: composeBody.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to send message");
      toast.success("Message sent to member");
      setComposeOpen(false);
      resetCompose();
      await loadThreads();
      if (data.thread?.id) {
        await openThread(data.thread.id);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setComposing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <Inbox className="h-7 w-7 text-emerald-700" />
            Messages
          </h1>
          <p className="text-muted-foreground">
            Message members directly, or reply to support conversations
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="bg-emerald-700 hover:bg-emerald-800"
            onClick={() => {
              resetCompose();
              setComposeOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Message member
          </Button>
          <Button variant="outline" size="sm" onClick={() => void loadThreads()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Inbox — hidden on small screens while a thread is open */}
        <Card
          className={cn(
            "overflow-hidden",
            selectedId ? "hidden lg:block" : "block"
          )}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Inbox</CardTitle>
            <CardDescription>
              {threads.filter((t) => t.unreadCount > 0).length} unread · tap a
              conversation to reply
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {loadingList ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : threads.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                No conversations yet. Start one with Message member.
              </p>
            ) : (
              <div className="max-h-[70vh] divide-y overflow-y-auto">
                {threads.map((thread) => {
                  const active = thread.id === selectedId;
                  return (
                    <button
                      key={thread.id}
                      type="button"
                      onClick={() => void openThread(thread.id)}
                      className={cn(
                        "w-full px-4 py-3 text-left transition-colors hover:bg-muted/60",
                        active && "bg-emerald-50"
                      )}
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{thread.member.name}</p>
                        {thread.unreadCount > 0 && (
                          <Badge className="bg-emerald-600 text-white">
                            {thread.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-sm text-slate-800">{thread.subject}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {thread.preview}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {formatWhen(thread.lastMessageAt)}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversation — full width on mobile when open */}
        <Card
          className={cn(
            "flex min-h-[70vh] flex-col",
            !selectedId && "hidden lg:flex"
          )}
        >
          {!selectedId ? (
            <CardContent className="flex h-full min-h-[70vh] items-center justify-center text-sm text-muted-foreground">
              Select a conversation, or message a member to start one
            </CardContent>
          ) : loadingDetail || !detail ? (
            <CardContent className="flex h-full min-h-[70vh] flex-col items-center justify-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <Button type="button" variant="ghost" size="sm" onClick={closeThread}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to inbox
              </Button>
            </CardContent>
          ) : (
            <>
              <CardHeader className="border-b pb-4">
                <div className="flex items-start gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="mt-0.5 shrink-0 lg:hidden"
                    onClick={closeThread}
                    aria-label="Back to inbox"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-lg">{detail.subject}</CardTitle>
                    <CardDescription>
                      {detail.member.name} · {detail.member.email}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex min-h-0 flex-1 flex-col gap-4 p-4">
                <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border bg-slate-50/60 p-3">
                  <div className="space-y-3">
                    {detail.messages.map((msg) => {
                      const fromStaff = msg.senderRole === "STAFF";
                      return (
                        <div
                          key={msg.id}
                          className={cn(
                            "max-w-[85%] rounded-xl px-3 py-2 text-sm",
                            fromStaff
                              ? "ml-auto bg-emerald-700 text-white"
                              : "border bg-white text-slate-800"
                          )}
                        >
                          <p className="mb-1 text-[10px] uppercase tracking-wide opacity-70">
                            {fromStaff ? "Care team" : detail.member.name} ·{" "}
                            {formatWhen(msg.createdAt)}
                          </p>
                          <p className="whitespace-pre-wrap">{msg.body}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="shrink-0 space-y-2">
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Write a reply to the member..."
                    rows={3}
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={() => void sendReply()}
                      disabled={sending || !reply.trim()}
                      className="bg-emerald-700 hover:bg-emerald-800"
                    >
                      {sending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      Reply
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>

      <Dialog
        open={composeOpen}
        onOpenChange={(open) => {
          setComposeOpen(open);
          if (!open) resetCompose();
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Message a member</DialogTitle>
            <DialogDescription>
              Starts a new care conversation. The member is notified in their portal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Member</Label>
              {selectedMember ? (
                <div className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span>
                    {memberLabel(selectedMember)}{" "}
                    <span className="text-muted-foreground">({selectedMember.email})</span>
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedMember(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search name or email…"
                    className="pl-9"
                    autoFocus
                  />
                  {(searchingMembers || memberResults.length > 0) && (
                    <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-white shadow-md">
                      {searchingMembers ? (
                        <p className="px-3 py-2 text-sm text-muted-foreground">Searching…</p>
                      ) : (
                        memberResults.map((member) => (
                          <button
                            key={member.id}
                            type="button"
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-muted"
                            onClick={() => {
                              setSelectedMember(member);
                              setMemberSearch("");
                              setMemberResults([]);
                            }}
                          >
                            <span className="font-medium">{memberLabel(member)}</span>
                            <span className="ml-2 text-muted-foreground">{member.email}</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="compose-subject">Subject</Label>
              <Input
                id="compose-subject"
                value={composeSubject}
                onChange={(e) => setComposeSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="compose-body">Message</Label>
              <Textarea
                id="compose-body"
                value={composeBody}
                onChange={(e) => setComposeBody(e.target.value)}
                rows={5}
                placeholder="Write your message…"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setComposeOpen(false)} disabled={composing}>
              Cancel
            </Button>
            <Button
              className="bg-emerald-700 hover:bg-emerald-800"
              onClick={() => void startConversation()}
              disabled={composing || !selectedMember || !composeBody.trim()}
            >
              {composing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
