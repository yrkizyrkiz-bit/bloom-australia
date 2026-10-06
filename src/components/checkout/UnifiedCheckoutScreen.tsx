"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sun,
  Sunset,
} from "lucide-react";
import {
  CLINIC_TIMEZONE,
  formatDateInTimezone,
  formatTimeInTimezone,
  getHourInTimezone,
  getTimezoneAbbreviation,
  getTimezoneCityLabel,
  isSameTimezone,
} from "@/lib/australia-timezone";

export interface UnifiedSlot {
  slotId: string;
  startTime: string;
  endTime: string;
  timezone: string;
  appointmentType: string;
  availabilityStatus: "AVAILABLE" | "LIMITED" | "BOOKED";
  availableDoctors: number;
}

export interface DaySlots {
  date: Date;
  dateStr: string;
  dayName: string;
  slots: UnifiedSlot[];
}

export interface UnifiedCheckoutFormData {
  consultationDate: string;
  consultationTime: string;
  selectedSlotId: string;
  email: string;
  firstName: string;
  lastName: string;
}

type TimePeriod = "morning" | "afternoon" | "evening";

const TIME_PERIODS: {
  id: TimePeriod;
  label: string;
  range: string;
  hourStart: number;
  hourEnd: number;
  icon: typeof Sun;
}[] = [
  { id: "morning", label: "Morning", range: "8am – 12pm", hourStart: 8, hourEnd: 12, icon: Sun },
  { id: "afternoon", label: "Afternoon", range: "12pm – 5pm", hourStart: 12, hourEnd: 17, icon: Clock },
  { id: "evening", label: "Evening", range: "5pm – 8pm", hourStart: 17, hourEnd: 21, icon: Sunset },
];

function slotMatchesPeriod(isoString: string, period: TimePeriod, displayTimezone: string): boolean {
  const h = getHourInTimezone(isoString, displayTimezone);
  const config = TIME_PERIODS.find((p) => p.id === period)!;
  return h >= config.hourStart && h < config.hourEnd;
}

function formatSlotTime(isoString: string, displayTimezone: string): string {
  return formatTimeInTimezone(isoString, displayTimezone);
}

function isSlotBooked(slot: UnifiedSlot): boolean {
  return slot.availabilityStatus === "BOOKED" || slot.availableDoctors <= 0;
}

function isSlotUnavailable(slot: UnifiedSlot, selectedSlotId: string): boolean {
  if (selectedSlotId && slot.slotId === selectedSlotId) return false;
  return isSlotBooked(slot);
}

/** @deprecated Legacy Core $249/$349 unified checkout removed — use FunnelMembershipPaymentScreen. */
export function UnifiedCheckoutScreen(): never {
  throw new Error(
    "UnifiedCheckoutScreen is retired. Use FunnelMembershipPaymentScreen for membership checkout."
  );
}

interface ConsultationPickerProps {
  groupedSlots: DaySlots[];
  formData: UnifiedCheckoutFormData;
  loadingSlots: boolean;
  slotsError: string | null;
  creatingHold: boolean;
  selectingSlotId: string | null;
  activeDayIndex: number;
  onActiveDayChange: (index: number) => void;
  onSlotSelect: (slot: UnifiedSlot) => void;
  onRetrySlots: () => void;
  dayRangeLabel: string;
  canGoBack: boolean;
  canGoForward: boolean;
  onPrevDays: () => void;
  onNextDays: () => void;
  patientTimezone: string;
  /** Split-panel layout: booking and payment are separate cards */
  splitLayout?: boolean;
  hasSelectedSlot?: boolean;
}

export function ConsultationPicker({
  groupedSlots,
  formData,
  loadingSlots,
  slotsError,
  creatingHold,
  selectingSlotId,
  activeDayIndex,
  onActiveDayChange,
  onSlotSelect,
  onRetrySlots,
  dayRangeLabel,
  canGoBack,
  canGoForward,
  onPrevDays,
  onNextDays,
  patientTimezone,
  splitLayout = false,
  hasSelectedSlot = false,
}: ConsultationPickerProps) {
  const [activePeriod, setActivePeriod] = useState<TimePeriod>("morning");
  const activeDay = groupedSlots[activeDayIndex];
  const tzAbbrev = getTimezoneAbbreviation(patientTimezone);
  const showClinicNote = !isSameTimezone(patientTimezone, CLINIC_TIMEZONE);

  const slotsInPeriod = useMemo(() => {
    if (!activeDay) return [];
    return activeDay.slots.filter((s) =>
      slotMatchesPeriod(s.startTime, activePeriod, patientTimezone)
    );
  }, [activeDay, activePeriod, patientTimezone]);

  const periodHasSlots = (period: TimePeriod) =>
    activeDay?.slots.some(
      (s) =>
        slotMatchesPeriod(s.startTime, period, patientTimezone) &&
        !isSlotUnavailable(s, formData.selectedSlotId)
    ) ?? false;

  const periodHasAnySlots = (period: TimePeriod) =>
    activeDay?.slots.some((s) => slotMatchesPeriod(s.startTime, period, patientTimezone)) ??
    false;

  useEffect(() => {
    if (!activeDay) return;
    if (periodHasSlots(activePeriod)) return;
    const fallback = TIME_PERIODS.find((p) => periodHasSlots(p.id));
    if (fallback) setActivePeriod(fallback.id);
  }, [activeDayIndex, groupedSlots, activeDay, activePeriod]);

  useEffect(() => {
    setActivePeriod("morning");
  }, [activeDayIndex]);

  return (
    <div className={`flex flex-col overflow-hidden ${splitLayout ? "h-full" : "min-h-0 space-y-3"}`}>
      <div className="flex items-center justify-between gap-2 shrink-0 mb-2">
        <div className="flex items-center gap-2 min-w-0">
        <div className="rounded-xl bg-[#5c7a52]/10 flex items-center justify-center shrink-0 w-9 h-9">
          <Calendar className="text-[#5c7a52] w-4 h-4" />
        </div>
        <div>
          <h3 className="font-semibold text-[#2c3628] text-sm">
            Book your consultation
          </h3>
          <p className="text-[10px] text-[#7e9a72]">
            Phone consult · Times in your local time{tzAbbrev ? ` (${tzAbbrev})` : ""}
          </p>
        </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onPrevDays}
            disabled={!canGoBack || loadingSlots}
            aria-label="Previous days"
            className="w-10 h-10 rounded-xl border border-[#e6ebe3] flex items-center justify-center text-[#5c7a52] hover:bg-[#f4f7f2] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-[10px] font-medium text-[#7e9a72] min-w-[72px] text-center">
            {dayRangeLabel}
          </span>
          <button
            type="button"
            onClick={onNextDays}
            disabled={!canGoForward || loadingSlots}
            aria-label="Next days"
            className="w-10 h-10 rounded-xl border border-[#e6ebe3] flex items-center justify-center text-[#5c7a52] hover:bg-[#f4f7f2] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showClinicNote && (
        <p className="text-[10px] text-[#7e9a72] bg-[#f4f7f2] rounded-lg px-2.5 py-1.5 mb-2 shrink-0 leading-snug">
          Doctor availability is scheduled in Australian Eastern (Sydney) time. Your selected time
          is shown in {getTimezoneCityLabel(patientTimezone)} time.
        </p>
      )}

      {hasSelectedSlot && (
        <p className="text-[10px] text-[#5c7a52] bg-[#5c7a52]/5 border border-[#5c7a52]/15 rounded-lg px-2.5 py-1.5 mb-2 shrink-0 leading-snug">
          Tap another day or time to change, payment updates automatically.
        </p>
      )}

      <div className={`flex-1 min-h-0 overflow-hidden ${splitLayout ? "" : ""}`}>
      {loadingSlots && (
        <div className="flex flex-col items-center py-8">
          <div className="w-8 h-8 border-2 border-[#5c7a52]/20 border-t-[#5c7a52] rounded-full animate-spin mb-2" />
          <p className="text-xs text-[#7e9a72]">Loading times...</p>
        </div>
      )}

      {slotsError && !loadingSlots && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-xs text-red-700 mb-2">{slotsError}</p>
          <button
            type="button"
            onClick={onRetrySlots}
            className="text-xs text-red-600 underline font-medium"
          >
            Try again
          </button>
        </div>
      )}

      {!loadingSlots && !slotsError && groupedSlots.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
          <AlertTriangle className="w-7 h-7 text-amber-500 mx-auto mb-2" />
          <p className="font-semibold text-amber-800 text-xs">No slots available</p>
        </div>
      )}

      {!loadingSlots && !slotsError && groupedSlots.length > 0 && (
        <div className="flex flex-col h-full min-h-0 gap-2">
          <div
            className="grid gap-1.5 shrink-0"
            style={{
              gridTemplateColumns: `repeat(${Math.min(groupedSlots.length, 3)}, minmax(0, 1fr))`,
            }}
          >
            {groupedSlots.map((daySlots, idx) => {
              const isActive = activeDayIndex === idx;
              const hasSelection = daySlots.slots.some(
                (s) => s.slotId === formData.selectedSlotId
              );

              return (
                <button
                  key={daySlots.date.toISOString()}
                  type="button"
                  onClick={() => onActiveDayChange(idx)}
                  className={`py-1.5 px-1 rounded-lg text-center transition-all duration-200 min-w-0 ${
                    isActive
                      ? "bg-[#5c7a52] text-white shadow-md"
                      : hasSelection
                        ? "bg-[#5c7a52]/10 border-2 border-[#5c7a52]/40 text-[#2c3628]"
                        : "bg-[#f4f7f2] border border-[#e6ebe3] hover:border-[#5c7a52]/40"
                  }`}
                >
                  <p
                    className={`text-[8px] font-semibold uppercase leading-none ${
                      isActive ? "text-white/80" : "text-[#7e9a72]"
                    }`}
                  >
                    {formatDateInTimezone(daySlots.date, patientTimezone, { weekday: "short" })}
                  </p>
                  <p
                    className={`text-sm font-bold leading-tight mt-0.5 ${
                      isActive ? "text-white" : "text-[#2c3628]"
                    }`}
                  >
                    {formatDateInTimezone(daySlots.date, patientTimezone, { day: "numeric" })}
                  </p>
                  <p className={`text-[8px] leading-none mt-0.5 ${isActive ? "text-white/75" : "text-[#7e9a72]"}`}>
                    {formatDateInTimezone(daySlots.date, patientTimezone, { month: "short" })}
                  </p>
                </button>
              );
            })}
          </div>

          {activeDay && (
            <div className="flex flex-col flex-1 min-h-0 gap-2">
              <p className="text-[10px] font-medium text-[#7e9a72] shrink-0">
                Preferred time of day
              </p>
              <div className="grid grid-cols-3 gap-1.5 shrink-0">
                {TIME_PERIODS.map(({ id, label, range, icon: Icon }) => {
                  const isActive = activePeriod === id;
                  const hasAny = periodHasAnySlots(id);

                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => hasAny && setActivePeriod(id)}
                      disabled={!hasAny}
                      className={`py-1.5 px-0.5 rounded-lg text-center transition-all border ${
                        isActive
                          ? "bg-[#5c7a52] text-white border-[#5c7a52] shadow-sm"
                          : hasAny
                            ? "bg-[#f4f7f2] border-[#e6ebe3] text-[#2c3628] hover:border-[#5c7a52]/50"
                            : "bg-[#f4f7f2]/50 border-[#e6ebe3] text-[#a8bb9e] opacity-60 cursor-not-allowed"
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 mx-auto mb-0.5 ${
                          isActive ? "text-white" : "text-[#5c7a52]"
                        }`}
                      />
                      <p className={`text-[10px] font-semibold leading-tight ${isActive ? "text-white" : ""}`}>
                        {label}
                      </p>
                      <p
                        className={`text-[8px] mt-0.5 leading-tight ${isActive ? "text-white/75" : "text-[#7e9a72]"}`}
                      >
                        {range}
                      </p>
                    </button>
                  );
                })}
              </div>

              {slotsInPeriod.length > 0 ? (
                <div className="flex flex-col flex-1 min-h-0">
                  <p className="text-[10px] font-medium text-[#7e9a72] mb-1 flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    Pick a time
                  </p>
                  <div className="grid grid-cols-4 gap-1.5 content-start">
                    {slotsInPeriod.map((slot) => {
                      const isSelected = formData.selectedSlotId === slot.slotId;
                      const isSelecting = selectingSlotId === slot.slotId;
                      const booked = isSlotUnavailable(slot, formData.selectedSlotId);

                      return (
                        <button
                          key={slot.slotId}
                          type="button"
                          onClick={() => !booked && onSlotSelect(slot)}
                          disabled={booked || (creatingHold && selectingSlotId === slot.slotId)}
                          className={`relative py-1.5 px-0.5 rounded-lg text-[10px] font-semibold transition-all ${
                            booked
                              ? "bg-[#f0f0f0] text-[#a8bb9e] border border-[#e6ebe3] cursor-not-allowed opacity-60"
                              : isSelected
                                ? "bg-[#5c7a52] text-white shadow-sm"
                                : isSelecting
                                  ? "bg-[#5c7a52]/10 text-[#5c7a52] border border-[#5c7a52]"
                                  : "bg-[#f4f7f2] text-[#2c3628] border border-[#e6ebe3] hover:border-[#5c7a52]"
                          } ${creatingHold && selectingSlotId === slot.slotId && !booked ? "opacity-50" : ""}`}
                        >
                          <span className={booked ? "line-through decoration-[#9ca3af] decoration-2" : ""}>
                            {formatSlotTime(slot.startTime, patientTimezone)}
                          </span>
                          {booked && (
                            <span
                              className="pointer-events-none absolute left-1 right-1 top-1/2 h-[1.5px] bg-[#9ca3af] -translate-y-1/2"
                              aria-hidden
                            />
                          )}
                          {isSelecting && !booked && (
                            <span className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-lg">
                              <div className="w-3 h-3 border-2 border-[#5c7a52]/30 border-t-[#5c7a52] rounded-full animate-spin" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-[#7e9a72] py-3 text-center bg-[#f4f7f2] rounded-lg flex-1 flex items-center justify-center">
                  No times in this period, try another.
                </p>
              )}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
