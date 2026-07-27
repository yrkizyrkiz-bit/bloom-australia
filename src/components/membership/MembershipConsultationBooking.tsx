"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import {
  ConsultationPicker,
  type UnifiedSlot,
} from "@/components/checkout/UnifiedCheckoutScreen";
import { resolveAustralianTimezone, formatDateInTimezone } from "@/lib/australia-timezone";

const WINDOW_DAYS = 2;

type Props = {
  userId: string;
  paymentIntentId: string;
  consentRecordId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  postcode?: string;
  programType?: "ORGAN_CARE" | "MEMBERSHIP" | "BIOLOGICAL_CLOCK" | "HAIR_LOSS" | "WOMENS_HEALTH" | "MENS_HEALTH";
  riskFlags?: string[];
  onComplete: () => void;
};

function formatSlotDate(isoString: string, timezone: string) {
  return formatDateInTimezone(new Date(isoString), timezone, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatSlotTime(isoString: string, timezone: string) {
  return new Date(isoString).toLocaleTimeString("en-AU", {
    timeZone: timezone,
    hour: "numeric",
    minute: "2-digit",
  });
}

function slotStatusForDoctorCount(availableDoctors: number): UnifiedSlot["availabilityStatus"] {
  if (availableDoctors <= 0) return "BOOKED";
  if (availableDoctors >= 2) return "AVAILABLE";
  return "LIMITED";
}

function patchSlotCapacity(
  slots: UnifiedSlot[],
  slotId: string,
  delta: number
): UnifiedSlot[] {
  return slots.map((slot) => {
    if (slot.slotId !== slotId) return slot;
    const availableDoctors = Math.max(0, slot.availableDoctors + delta);
    return {
      ...slot,
      availableDoctors,
      availabilityStatus: slotStatusForDoctorCount(availableDoctors),
    };
  });
}

function groupSlotsByDay(slots: UnifiedSlot[], displayTimezone: string) {
  const grouped = new Map<
    string,
    {
      date: Date;
      dateStr: string;
      dayName: string;
      slots: UnifiedSlot[];
    }
  >();

  for (const slot of slots) {
    const date = new Date(slot.startTime);
    const dateKey = date.toLocaleDateString("en-CA", { timeZone: displayTimezone });

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, {
        date,
        dateStr: formatSlotDate(slot.startTime, displayTimezone),
        dayName: date.toLocaleDateString("en-AU", {
          timeZone: displayTimezone,
          weekday: "long",
        }),
        slots: [],
      });
    }

    grouped.get(dateKey)!.slots.push(slot);
  }

  return Array.from(grouped.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function MembershipConsultationBooking({
  userId,
  paymentIntentId,
  consentRecordId,
  firstName,
  lastName,
  email,
  phone,
  postcode,
  programType = "MEMBERSHIP",
  riskFlags = ["ORGAN_CARE_MEMBERSHIP"],
  onComplete,
}: Props) {
  const patientTimezone = resolveAustralianTimezone(null, postcode || "");
  const [availableSlots, setAvailableSlots] = useState<UnifiedSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [dayWindowOffset, setDayWindowOffset] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [dayRangeLabel, setDayRangeLabel] = useState("");
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [consultationDate, setConsultationDate] = useState("");
  const [consultationTime, setConsultationTime] = useState("");
  const [bookingHoldId, setBookingHoldId] = useState<string | null>(null);
  const [creatingHold, setCreatingHold] = useState(false);
  const [selectingSlotId, setSelectingSlotId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const holdRequestRef = useRef(0);
  const bookingHoldIdRef = useRef<string | null>(null);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    bookingHoldIdRef.current = bookingHoldId;
  }, [bookingHoldId]);

  const fetchSlots = useCallback(
    async (offset: number, options?: { preserveDayIndex?: boolean }) => {
      setLoadingSlots(true);
      setSlotsError(null);
      let advancing = false;
      try {
        const params = new URLSearchParams({
          appointmentType: "PHONE_CONSULT",
          dayOffset: String(offset),
          windowDays: String(WINDOW_DAYS),
          userId,
        });
        const response = await fetch(`/api/bookings/availability?${params}`);
        if (!response.ok) throw new Error("Failed to load available times");
        const data = await response.json();
        const slots: UnifiedSlot[] = data.slots || [];
        setCanGoBack(Boolean(data.canGoBack));
        setCanGoForward(Boolean(data.canGoForward));

        // Skip empty windows so the calendar lands on the next date with slots
        if (slots.length === 0 && data.canGoForward) {
          advancing = true;
          setDayWindowOffset(offset + WINDOW_DAYS);
          return;
        }

        setAvailableSlots(slots);
        if (!options?.preserveDayIndex) {
          setActiveDayIndex(0);
        }

        const days = groupSlotsByDay(slots, patientTimezone);
        if (days.length >= 2) {
          setDayRangeLabel(`${days[0].dateStr} – ${days[1].dateStr}`);
        } else if (days.length === 1) {
          setDayRangeLabel(days[0].dateStr);
        } else {
          setDayRangeLabel("No dates available");
        }
      } catch {
        setSlotsError("Unable to load available times. Please try again.");
        setAvailableSlots([]);
      } finally {
        if (!advancing) setLoadingSlots(false);
      }
    },
    [patientTimezone, userId]
  );

  useEffect(() => {
    fetchSlots(dayWindowOffset);
  }, [dayWindowOffset, fetchSlots]);

  const groupedSlots = useMemo(
    () => groupSlotsByDay(availableSlots, patientTimezone),
    [availableSlots, patientTimezone]
  );

  const handleSlotSelection = async (slot: UnifiedSlot) => {
    if (slot.availabilityStatus === "BOOKED" || creatingHold) return;
    if (selectedSlotId === slot.slotId && bookingHoldId) return;

    const requestId = ++holdRequestRef.current;
    const previousSlotId = selectedSlotId;
    const previousHoldId = bookingHoldIdRef.current;

    setCreatingHold(true);
    setSelectingSlotId(slot.slotId);
    setSlotsError(null);

    setSelectedSlotId(slot.slotId);
    setConsultationDate(formatSlotDate(slot.startTime, patientTimezone));
    setConsultationTime(formatSlotTime(slot.startTime, patientTimezone));

    try {
      const response = await fetch("/api/bookings/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          slotId: slot.slotId,
          programType,
          patientPhone: phone || undefined,
          riskFlags,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to reserve this time");
      }

      if (requestId !== holdRequestRef.current) {
        fetch(`/api/bookings/hold?holdId=${data.bookingHoldId}`, { method: "DELETE" }).catch(
          () => {}
        );
        return;
      }

      setBookingHoldId(data.bookingHoldId);

      if (previousSlotId && previousSlotId !== slot.slotId) {
        setAvailableSlots((slots) => patchSlotCapacity(slots, previousSlotId, 1));
      }
    } catch (error) {
      if (requestId !== holdRequestRef.current) {
        return;
      }

      const message =
        error instanceof Error ? error.message : "Failed to reserve this time";
      setSlotsError(message);
      toast.error("Could not reserve this slot", { description: message });

      if (previousSlotId) {
        setSelectedSlotId(previousSlotId);
        const previousSlot = availableSlots.find((s) => s.slotId === previousSlotId);
        if (previousSlot) {
          setConsultationDate(formatSlotDate(previousSlot.startTime, patientTimezone));
          setConsultationTime(formatSlotTime(previousSlot.startTime, patientTimezone));
        }
      } else {
        setSelectedSlotId("");
        setConsultationDate("");
        setConsultationTime("");
      }
      setBookingHoldId(previousHoldId);
    } finally {
      if (requestId === holdRequestRef.current) {
        setCreatingHold(false);
        setSelectingSlotId(null);
      }
    }
  };

  const resetHoldSelection = useCallback(() => {
    setBookingHoldId(null);
    setSelectedSlotId("");
    setConsultationDate("");
    setConsultationTime("");
  }, []);

  const confirmBooking = async () => {
    if (!bookingHoldId) return;

    if (!consentRecordId?.trim()) {
      const message =
        "Payment consent is missing. Please return to the payment step and try again.";
      setSlotsError(message);
      toast.error("Cannot confirm booking", { description: message });
      return;
    }

    setConfirming(true);
    setSlotsError(null);

    try {
      const response = await fetch("/api/bookings/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingHoldId,
          paymentIntentId,
          consentRecordId,
          userId,
          clientOrigin: typeof window !== "undefined" ? window.location.origin : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to confirm booking");
      }

      toast.success("Consultation booked", {
        description: `${consultationDate} at ${consultationTime}`,
      });
      onComplete();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to confirm booking";
      setSlotsError(message);
      toast.error("Could not confirm booking", { description: message });

      const staleHold =
        /hold not found|not in held status|expired|no longer available/i.test(message);
      if (staleHold) {
        resetHoldSelection();
        await fetchSlots(dayWindowOffset, { preserveDayIndex: true });
      }
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="space-y-4">
      <ConsultationPicker
        groupedSlots={groupedSlots}
        formData={{
          consultationDate,
          consultationTime,
          selectedSlotId,
          email,
          firstName,
          lastName,
        }}
        loadingSlots={loadingSlots}
        slotsError={slotsError}
        creatingHold={creatingHold}
        selectingSlotId={selectingSlotId}
        activeDayIndex={Math.min(activeDayIndex, Math.max(0, groupedSlots.length - 1))}
        onActiveDayChange={setActiveDayIndex}
        onSlotSelect={handleSlotSelection}
        onRetrySlots={() => fetchSlots(dayWindowOffset, { preserveDayIndex: true })}
        dayRangeLabel={dayRangeLabel}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onPrevDays={() => setDayWindowOffset((o) => Math.max(0, o - WINDOW_DAYS))}
        onNextDays={() => setDayWindowOffset((o) => o + WINDOW_DAYS)}
        patientTimezone={patientTimezone}
        splitLayout={false}
        hasSelectedSlot={Boolean(bookingHoldId)}
      />

      {bookingHoldId && (
        <button
          type="button"
          onClick={confirmBooking}
          disabled={confirming}
          className="w-full py-3.5 bg-gray-900 hover:bg-black disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {confirming ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Confirming...
            </>
          ) : (
            <>
              Confirm consultation
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
