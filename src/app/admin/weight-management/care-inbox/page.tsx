"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Loader2,
  Inbox,
  AlertTriangle,
  HeartPulse,
  ListChecks,
} from "lucide-react";

type InboxMember = {
  userId: string;
  name: string;
  email: string;
  phase: string;
  planTier: string;
  adherenceToday: number | null;
  openSideEffects: number;
  pendingCareTasks: number;
  weeklyFocus: string | null;
  needsAttention: boolean;
  medication: string | null;
};

export default function CareInboxPage() {
  const [members, setMembers] = useState<InboxMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "attention">("attention");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/weight-management/care-inbox?filter=${filter}`
      );
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
      }
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/weight-management">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Inbox className="w-7 h-7 text-violet-600" />
            WM Care inbox
          </h1>
          <p className="text-muted-foreground">
            Active weight programs — adherence, side effects, and escalations
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === "attention" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("attention")}
        >
          Needs attention
        </Button>
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All active
        </Button>
        <Button variant="ghost" size="sm" onClick={load}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No members match this filter.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {members.map((m) => (
            <Link key={m.userId} href={`/admin/crm/customers/${m.userId}`}>
              <Card
                className={`hover:shadow-md transition-all cursor-pointer ${
                  m.needsAttention ? "border-amber-300 bg-amber-50/30" : ""
                }`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{m.name}</CardTitle>
                      <CardDescription>{m.email}</CardDescription>
                    </div>
                    <div className="flex gap-1 flex-wrap justify-end">
                      <Badge variant="secondary" className="capitalize">
                        {m.planTier.toLowerCase()}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {m.phase.toLowerCase()}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-emerald-600" />
                      <span>
                        Today:{" "}
                        <strong>
                          {m.adherenceToday != null ? `${m.adherenceToday}%` : "—"}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <HeartPulse className="w-4 h-4 text-rose-500" />
                      <span>
                        Side effects: <strong>{m.openSideEffects}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>
                        Care tasks: <strong>{m.pendingCareTasks}</strong>
                      </span>
                    </div>
                    <div className="text-muted-foreground truncate">
                      {m.medication || "No medication"}
                    </div>
                  </div>
                  {m.weeklyFocus && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Weekly focus: {m.weeklyFocus}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
