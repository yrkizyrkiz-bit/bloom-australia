"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Loader2, ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";
import { toast } from "sonner";
import { formatSydneyDate, formatSydneyTime } from "@/lib/sydney-time";

interface UnifiedSlot {
  slotId: string;
  startTime: string;
  endTime: string;
  availabilityStatus: "AVAILABLE" | "LIMITED" | "BOOKED";
}

interface DaySlots {
  date: Date;
  dateKey: string;
  slots: UnifiedSlot[];
}

interface RescheduleBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  patientName: string;
  currentScheduledAt: string;
  onSuccess: () => void;
}

function groupSlotsByDay(slots: UnifiedSlot[]): DaySlots[] {
  const map = new Map<string, DaySlots>();
  for (const slot of slots) {
    const date = new Date(slot.startTime);
    const dateKey = date.toDateString();
    if (!map.has(dateKey)) {
      map.set(dateKey, { date, dateKey, slots: [] });
    }
    map.get(dateKey)!.slots.push(slot);
  }
  return Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function RescheduleBookingDialog({
  open,
  onOpenChange,
  bookingId,
  patientName,
  currentScheduledAt,
  onSuccess,
}: RescheduleBookingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [slots, setSlots] = useState<UnifiedSlot[]>([]);
  const [dayOffset, setDayOffset] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(true);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<UnifiedSlot | null>(null);
  const [reason, setReason] = useState("");
  const [notifyMember, setNotifyMember] = useState(true);

  const groupedSlots = useMemo(() => groupSlotsByDay(slots), [slots]);
  const activeDay = groupedSlots[activeDayIndex];

  const fetchSlots = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/bookings/availability?appointmentType=PHONE_CONSULT&days=14&dayOffset=${dayOffset}&windowDays=3&staffMode=true`
      );
      if (!res.ok) throw new Error("Failed to load availability");
      const data = await res.json();
      setSlots(
        (data.slots || []).filter(
          (s: UnifiedSlot) => s.availabilityStatus !== "BOOKED"
        )
      );
      setCanGoBack(data.canGoBack ?? dayOffset > 0);
      setCanGoForward(data.canGoForward ?? true);
      setActiveDayIndex(0);
      setSelectedSlot(null);
    } catch {
      toast.error("Could not load available times");
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [dayOffset]);

  useEffect(() => {
    if (open) {
      setReason("");
      setSelectedSlot(null);
      setDayOffset(0);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    fetchSlots();
  }, [open, dayOffset, fetchSlots]);

  const handleSubmit = async () => {
    if (!selectedSlot) {
      toast.error("Please select a new time");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason for the reschedule");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reschedule",
          slotId: selectedSlot.slotId,
          scheduledAt: selectedSlot.startTime,
          reason: reason.trim(),
          notifyMember,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reschedule failed");

      toast.success("Booking rescheduled");
      onOpenChange(false);
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Reschedule failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reschedule consultation</DialogTitle>
          <DialogDescription>
            Change the appointment time for {patientName}. Current time:{" "}
            {formatSydneyDate(currentScheduledAt, {
              weekday: "short",
              day: "numeric",
              month: "short",
            })}{" "}
            at {formatSydneyTime(currentScheduledAt)} (Sydney).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Select new time</Label>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={!canGoBack || loading}
                onClick={() => setDayOffset((d) => Math.max(0, d - 3))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8"
                disabled={!canGoForward || loading}
                onClick={() => setDayOffset((d) => d + 3)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : groupedSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No available slots in this window. Try the next dates.
            </p>
          ) : (
            <>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {groupedSlots.map((day, idx) => (
                  <button
                    key={day.dateKey}
                    type="button"
                    onClick={() => setActiveDayIndex(idx)}
                    className={`shrink-0 px-3 py-2 rounded-lg text-center text-xs border transition-colors ${
                      activeDayIndex === idx
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 hover:bg-muted"
                    }`}
                  >
                    <div className="font-semibold">
                      {formatSydneyDate(day.date, { weekday: "short" })}
                    </div>
                    <div>{formatSydneyDate(day.date, { day: "numeric", month: "short" })}</div>
                  </button>
                ))}
              </div>

              {activeDay && (
                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                  {activeDay.slots.map((slot) => {
                    const isSelected = selectedSlot?.slotId === slot.slotId;
                    return (
                      <button
                        key={slot.slotId}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`px-2 py-2 rounded-lg text-xs border transition-colors ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : slot.availabilityStatus === "LIMITED"
                              ? "border-amber-300 bg-amber-50 hover:bg-amber-100"
                              : "hover:bg-muted"
                        }`}
                      >
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatSydneyTime(slot.startTime)}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {selectedSlot && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
              <Calendar className="h-4 w-4 text-green-700" />
              <span>
                New time:{" "}
                <strong>
                  {formatSydneyDate(selectedSlot.startTime, {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}{" "}
                  at {formatSydneyTime(selectedSlot.startTime)}
                </strong>
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="reschedule-reason">Reason for change *</Label>
            <Textarea
              id="reschedule-reason"
              placeholder="e.g. Member requested different time, doctor unavailable..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="notify-member"
              checked={notifyMember}
              onCheckedChange={(v) => setNotifyMember(v === true)}
            />
            <Label htmlFor="notify-member" className="text-sm font-normal cursor-pointer">
              Email member about the change
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !selectedSlot}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirm reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
