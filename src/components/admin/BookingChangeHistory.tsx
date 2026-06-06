"use client";

import { useEffect, useState } from "react";
import { Loader2, History } from "lucide-react";
import { formatSydneyDate, formatSydneyTime } from "@/lib/sydney-time";

interface ChangeLogEntry {
  id: string;
  action: string;
  previousAt: string | null;
  newAt: string | null;
  previousStatus: string | null;
  newStatus: string | null;
  reason: string | null;
  createdAt: string;
  changedBy: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface BookingChangeHistoryProps {
  bookingId: string;
}

function actionLabel(action: string): string {
  switch (action) {
    case "RESCHEDULED":
      return "Rescheduled";
    case "CANCELLED":
      return "Cancelled";
    case "STATUS_CHANGED":
      return "Status changed";
    case "DOCTOR_ASSIGNED":
      return "Doctor assigned";
    default:
      return action.replace(/_/g, " ").toLowerCase();
  }
}

export function BookingChangeHistory({ bookingId }: BookingChangeHistoryProps) {
  const [history, setHistory] = useState<ChangeLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/bookings/${bookingId}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setHistory(data.history || []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading history...
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">No change history yet.</p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium flex items-center gap-1.5">
        <History className="h-4 w-4" />
        Change history
      </p>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {history.map((entry) => (
          <div key={entry.id} className="text-xs p-2 bg-muted/40 rounded-lg border">
            <div className="flex justify-between gap-2">
              <span className="font-medium">{actionLabel(entry.action)}</span>
              <span className="text-muted-foreground shrink-0">
                {formatSydneyDate(entry.createdAt, { day: "numeric", month: "short" })}{" "}
                {formatSydneyTime(entry.createdAt)}
              </span>
            </div>
            <p className="text-muted-foreground mt-0.5">
              by {entry.changedBy.firstName} {entry.changedBy.lastName} ({entry.changedBy.role})
            </p>
            {entry.action === "RESCHEDULED" && entry.previousAt && entry.newAt && (
              <p className="mt-1">
                {formatSydneyDate(entry.previousAt, { day: "numeric", month: "short" })}{" "}
                {formatSydneyTime(entry.previousAt)}
                {" → "}
                {formatSydneyDate(entry.newAt, { day: "numeric", month: "short" })}{" "}
                {formatSydneyTime(entry.newAt)}
              </p>
            )}
            {entry.action === "STATUS_CHANGED" && (
              <p className="mt-1">
                {entry.previousStatus} → {entry.newStatus}
              </p>
            )}
            {entry.reason && (
              <p className="mt-1 text-muted-foreground italic">&ldquo;{entry.reason}&rdquo;</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
