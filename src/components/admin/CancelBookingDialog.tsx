"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { formatSydneyDate, formatSydneyTime } from "@/lib/sydney-time";

interface CancelBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  patientName: string;
  scheduledAt: string;
  onSuccess: () => void;
}

export function CancelBookingDialog({
  open,
  onOpenChange,
  bookingId,
  patientName,
  scheduledAt,
  onSuccess,
}: CancelBookingDialogProps) {
  const [reason, setReason] = useState("");
  const [notifyMember, setNotifyMember] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "cancel",
          reason: reason.trim(),
          notifyMember,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cancellation failed");

      toast.success("Booking cancelled");
      onOpenChange(false);
      setReason("");
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Cancellation failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            Cancel booking
          </DialogTitle>
          <DialogDescription>
            Cancel {patientName}&apos;s consultation on{" "}
            {formatSydneyDate(scheduledAt, {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}{" "}
            at {formatSydneyTime(scheduledAt)}. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Reason for cancellation *</Label>
            <Textarea
              id="cancel-reason"
              placeholder="e.g. Member no longer proceeding, duplicate booking..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="cancel-notify"
              checked={notifyMember}
              onCheckedChange={(v) => setNotifyMember(v === true)}
            />
            <Label htmlFor="cancel-notify" className="text-sm font-normal cursor-pointer">
              Email member about the cancellation
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Keep booking
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Cancel booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
