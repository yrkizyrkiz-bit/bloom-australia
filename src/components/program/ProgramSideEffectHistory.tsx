"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, HeartPulse } from "lucide-react";
import { toast } from "sonner";

type Report = {
  id: string;
  symptoms: string[];
  severity: string;
  status: string;
  escalated: boolean;
  createdAt: string;
};

export function ProgramSideEffectHistory() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/program/side-effects?limit=5")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setReports(d.reports);
      })
      .finally(() => setLoading(false));
  }, []);

  const resolve = async (reportId: string) => {
    const res = await fetch("/api/program/side-effects", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, status: "RESOLVED" }),
    });
    if (res.ok) {
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, status: "RESOLVED" } : r
        )
      );
      toast.success("Marked as resolved");
    }
  };

  if (loading || reports.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <HeartPulse className="w-5 h-5 text-rose-500" />
          Recent side effect reports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {reports.map((r) => (
          <div
            key={r.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border rounded-lg p-3"
          >
            <div>
              <p className="text-sm font-medium capitalize">
                {r.symptoms.join(", ").replace(/_/g, " ")}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(r.createdAt).toLocaleDateString("en-AU")} · {r.severity.toLowerCase()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  r.status === "RESOLVED"
                    ? "outline"
                    : r.escalated
                      ? "destructive"
                      : "secondary"
                }
              >
                {r.status === "RESOLVED"
                  ? "Resolved"
                  : r.escalated
                    ? "Care team notified"
                    : "Monitoring"}
              </Badge>
              {r.status !== "RESOLVED" && (
                <Button size="sm" variant="ghost" onClick={() => resolve(r.id)}>
                  I&apos;m better
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
