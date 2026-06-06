"use client";

import { AdminChatPanel } from "@/components/chat/AdminChatPanel";

export default function AdminChatPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Live Chat Management</h1>
        <p className="text-muted-foreground">
          Manage member chats and set your availability
        </p>
      </div>

      <AdminChatPanel />
    </div>
  );
}
