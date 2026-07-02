"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  programType?: "ORGAN_CARE" | "BIOLOGICAL_CLOCK";
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
  programType = "ORGAN_CARE",
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
  const [slotsRefreshKey, setSlotsRefreshKey] = useState(0);

  const fetchSlots = useCallback(
    async (offset: number) => {
      setLoadingSlots(true);
      setSlotsError(null);
      try {
        const params = new URLSearchParams({
          appointmentType: "PHONE_CONSULT",
          dayOffset: String(offset),
          windowDays: String(WINDOW_DAYS),
        });
        const response = await fetch(`/api/bookings/availability?${params}`);
        if (!response.ok) throw new Error("Failed to load available times");
        const data = await response.json();
        setAvailableSlots(data.slots || []);
        setCanGoBack(Boolean(data.canGoBack));
        setCanGoForward(Boolean(data.canGoForward));
        setActiveDayIndex(0);

        const days = groupSlotsByDay(data.slots || [], patientTimezone);
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
        setLoadingSlots(false);
      }
    },
    [patientTimezone]
  );

  useEffect(() => {
    fetchSlots(dayWindowOffset);
  }, [dayWindowOffset, slotsRefreshKey, fetchSlots]);

  const groupedSlots = useMemo(
    () => groupSlotsByDay(availableSlots, patientTimezone),
    [availableSlots, patientTimezone]
  );

  const handleSlotSelection = async (slot: UnifiedSlot) => {
    if (slot.availabilityStatus === "BOOKED" || creatingHold) return;
    if (selectedSlotId === slot.slotId) return;

    const previousHoldId = bookingHoldId;
    setCreatingHold(true);
    setSelectingSlotId(slot.slotId);
    setSlotsError(null);

    try {
      setSelectedSlotId(slot.slotId);
      setConsultationDate(formatSlotDate(slot.startTime, patientTimezone));
      setConsultationTime(formatSlotTime(slot.startTime, patientTimezone));

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

      setBookingHoldId(data.bookingHoldId);
      setSlotsRefreshKey((k) => k + 1);

      if (previousHoldId && previousHoldId !== data.bookingHoldId) {
        fetch(`/api/bookings/hold?holdId=${previousHoldId}`, { method: "DELETE" }).catch(
          () => {}
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reserve this time";
      setSlotsError(message);
      toast.error("Could not reserve this slot", { description: message });
    } finally {
      setCreatingHold(false);
      setSelectingSlotId(null);
    }
  };

  const confirmBooking = async () => {
    if (!bookingHoldId) return;
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
        onRetrySlots={() => fetchSlots(dayWindowOffset)}
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
