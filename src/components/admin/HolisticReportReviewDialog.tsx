"use client";

import { useEffect, useState } from "react";
import { HolisticHealthReportView } from "@/components/dashboard/HolisticHealthReportView";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { HolisticHealthReport } from "@/lib/holistic-health-report-types";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type DoctorOption = { id: string; firstName: string; lastName: string; email: string };

export function HolisticReportReviewDialog({
  open,
  onOpenChange,
  userId,
  historyId,
  mode,
  role,
  doctors,
  onChanged,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  historyId?: string | null;
  mode: "view" | "edit" | "assign" | "doctor";
  role: string;
  doctors: DoctorOption[];
  onChanged?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [memberName, setMemberName] = useState("");
  const [email, setEmail] = useState("");
  const [report, setReport] = useState<HolisticHealthReport | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [handoff, setHandoff] = useState("");
  const [retesting, setRetesting] = useState("");
  const [urgent, setUrgent] = useState("");
  const [doctorId, setDoctorId] = useState("");

  const isDoctor = role.toUpperCase() === "DOCTOR";
  const canAssign = role.toUpperCase() === "ADMIN" || role.toUpperCase() === "CARE_PARTNER";
  const canApprove =
    isDoctor &&
    report?.assignedDoctorId &&
    (report.approvalStatus === "pending_approval" || report.approvalStatus === "held");
  const canEditCurrent =
    !historyId &&
    report &&
    report.approvalStatus !== "approved" &&
    report.approvalStatus !== "superseded";

  useEffect(() => {
    if (!open || (!userId && !historyId)) return;
    let cancelled = false;
    setLoading(true);
    const url = historyId
      ? `/api/admin/holistic-reports/history/${historyId}`
      : `/api/admin/holistic-reports/${userId}`;
    fetch(url)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load report");
        if (cancelled) return;
        setMemberName(data.memberName || "");
        setEmail(data.email || "");
        setReport(data.report);
        setTitle(data.report?.reportTitle || "");
        setSummary(data.report?.executiveSummary || "");
        setHandoff(data.report?.careTeamHandoffSummary || "");
        setRetesting(data.report?.retestingGuidance || "");
        setUrgent((data.report?.urgentActions || []).join("\n"));
        setDoctorId(data.report?.assignedDoctorId || "");
      })
      .catch((error) => toast.error(error instanceof Error ? error.message : "Failed to load report"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, userId, historyId]);

  const saveEdits = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/holistic-reports/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportTitle: title,
          executiveSummary: summary,
          careTeamHandoffSummary: handoff,
          retestingGuidance: retesting,
          urgentActions: urgent
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setReport(data.report);
      toast.success("Draft saved. Overlay stays until a doctor releases it.");
      onChanged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const assignDoctor = async () => {
    if (!userId || !doctorId) {
      toast.error("Select a doctor");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/holistic-reports/${userId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Assign failed");
      setReport(data.report);
      toast.success("Doctor assigned");
      onChanged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Assign failed");
    } finally {
      setSaving(false);
    }
  };

  const approve = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/holistic-reports/${userId}/approve`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Approve failed");
      setReport(data.report);
      toast.success("Report approved and released to the member");
      onChanged?.();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Approve failed");
    } finally {
      setSaving(false);
    }
  };

  const hold = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/holistic-reports/${userId}/hold`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Hold failed");
      setReport(data.report);
      toast.success("Report held for consult");
      onChanged?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Hold failed");
    } finally {
      setSaving(false);
    }
  };

  const showEditor = (mode === "edit" || mode === "doctor") && canEditCurrent;
  const showAssign = (mode === "assign" || mode === "edit") && canAssign && canEditCurrent;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {memberName || "Holistic report"}
            {report?.approvalStatus ? (
              <Badge variant="outline" className="ml-2 align-middle capitalize">
                {String(report.approvalStatus).replaceAll("_", " ")}
              </Badge>
            ) : null}
          </DialogTitle>
          <DialogDescription>
            {email}
            {report?.assignedDoctorName ? ` · Assigned to ${report.assignedDoctorName}` : " · Unassigned"}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : report ? (
          <div className="space-y-6">
            {showAssign && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-1">
                  <Label>Assign doctor</Label>
                  <Select value={doctorId} onValueChange={setDoctorId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select doctor..." />
                    </SelectTrigger>
                    <SelectContent>
                      {doctors.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          Dr {doc.firstName} {doc.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={assignDoctor} disabled={saving || !doctorId}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Assign doctor
                </Button>
              </div>
            )}

            {showEditor && (
              <div className="space-y-3 rounded-lg border p-4">
                <p className="text-sm font-medium">Edit draft</p>
                <div className="space-y-1">
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Member summary</Label>
                  <Textarea rows={6} value={summary} onChange={(e) => setSummary(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Clinician handoff</Label>
                  <Textarea rows={4} value={handoff} onChange={(e) => setHandoff(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Retesting guidance</Label>
                  <Textarea rows={3} value={retesting} onChange={(e) => setRetesting(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Urgent actions (one per line)</Label>
                  <Textarea rows={3} value={urgent} onChange={(e) => setUrgent(e.target.value)} />
                </div>
                <Button variant="outline" onClick={saveEdits} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save draft
                </Button>
              </div>
            )}

            <HolisticHealthReportView
              report={report}
              userId={userId || ""}
              userName={memberName}
              staffPreview
            />
          </div>
        ) : (
          <p className="py-8 text-center text-muted-foreground">No report found.</p>
        )}

        <DialogFooter className="gap-2">
          {canApprove && (
            <>
              <Button variant="outline" onClick={hold} disabled={saving}>
                Hold for consult
              </Button>
              <Button onClick={approve} disabled={saving}>
                Approve and release
              </Button>
            </>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
