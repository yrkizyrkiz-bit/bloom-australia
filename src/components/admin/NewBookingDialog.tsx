"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ChevronLeft, ChevronRight, Calendar, Clock, Search, X } from "lucide-react";
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

interface MemberOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface DoctorOption {
  id: string;
  firstName: string;
  lastName: string;
}

interface NewBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doctors: DoctorOption[];
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

function memberLabel(member: MemberOption) {
  return `${member.firstName} ${member.lastName}`.trim() || member.email;
}

export function NewBookingDialog({
  open,
  onOpenChange,
  doctors,
  onSuccess,
}: NewBookingDialogProps) {
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [selectedMember, setSelectedMember] = useState<MemberOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [slots, setSlots] = useState<UnifiedSlot[]>([]);
  const [dayOffset, setDayOffset] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(true);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<UnifiedSlot | null>(null);
  const [bookingType, setBookingType] = useState("CONSULTATION");
  const [doctorId, setDoctorId] = useState("");
  const [notes, setNotes] = useState("");
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
        (data.slots || []).filter((s: UnifiedSlot) => s.availabilityStatus !== "BOOKED")
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
    if (!open) return;
    setSearch("");
    setMembers([]);
    setSelectedMember(null);
    setSelectedSlot(null);
    setDayOffset(0);
    setBookingType("CONSULTATION");
    setDoctorId("");
    setNotes("");
    setNotifyMember(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    fetchSlots();
  }, [open, dayOffset, fetchSlots]);

  useEffect(() => {
    if (!open || selectedMember) {
      setMembers([]);
      return;
    }

    const query = search.trim();
    if (query.length < 2) {
      setMembers([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/users?role=MEMBER&lite=1&limit=8&search=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        setMembers(data.users || []);
      } catch {
        setMembers([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [open, search, selectedMember]);

  const handleSubmit = async () => {
    if (!selectedMember) {
      toast.error("Please choose a member");
      return;
    }
    if (!selectedSlot) {
      toast.error("Please select a time");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedMember.id,
          slotId: selectedSlot.slotId,
          scheduledAt: selectedSlot.startTime,
          type: bookingType,
          location: "Phone",
          notes: notes.trim() || undefined,
          doctorId: doctorId || undefined,
          notifyMember,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create booking");

      toast.success(`Booked ${memberLabel(selectedMember)}`);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create booking");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New booking</DialogTitle>
          <DialogDescription>
            Book a consultation for an existing member on an open slot.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-booking-member">Member</Label>
            {selectedMember ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                <div className="min-w-0">
                  <p className="font-medium truncate">{memberLabel(selectedMember)}</p>
                  <p className="text-xs text-muted-foreground truncate">{selectedMember.email}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => setSelectedMember(null)}
                  aria-label="Change member"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="new-booking-member"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name or email..."
                    className="pl-9"
                  />
                </div>
                {searching && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Searching...
                  </p>
                )}
                {members.length > 0 && (
                  <div className="rounded-lg border divide-y max-h-40 overflow-y-auto">
                    {members.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => {
                          setSelectedMember(member);
                          setSearch("");
                          setMembers([]);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-muted/50"
                      >
                        <p className="text-sm font-medium">{memberLabel(member)}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                      </button>
                    ))}
                  </div>
                )}
                {search.trim().length >= 2 && !searching && members.length === 0 && (
                  <p className="text-xs text-muted-foreground">No members match that search.</p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={bookingType} onValueChange={setBookingType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONSULTATION">Initial consultation</SelectItem>
                  <SelectItem value="FOLLOW_UP">Follow-up</SelectItem>
                  <SelectItem value="REVIEW">Review</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Doctor (optional)</Label>
              <Select value={doctorId || "unassigned"} onValueChange={(value) => setDoctorId(value === "unassigned" ? "" : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Assign later" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Assign later</SelectItem>
                  {doctors.map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      Dr. {doc.firstName} {doc.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Select time</Label>
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
          </div>

          {selectedSlot && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
              <Calendar className="h-4 w-4 text-green-700" />
              <span>
                {formatSydneyDate(selectedSlot.startTime, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}{" "}
                at {formatSydneyTime(selectedSlot.startTime)}
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="new-booking-notes">Notes</Label>
            <Textarea
              id="new-booking-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional note for the care team"
              rows={2}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="new-booking-notify"
              checked={notifyMember}
              onCheckedChange={(v) => setNotifyMember(v === true)}
            />
            <Label htmlFor="new-booking-notify" className="text-sm font-normal cursor-pointer">
              Email member about this booking
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !selectedMember || !selectedSlot}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
