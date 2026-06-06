"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  CreditCard,
  Dna,
  Lock,
  RefreshCw,
  Shield,
  Stethoscope,
  Sun,
  Sunset,
  Timer,
} from "lucide-react";
import { StripePaymentForm } from "@/components/checkout/StripePaymentForm";
import {
  CLINIC_TIMEZONE,
  formatDateInTimezone,
  formatTimeInTimezone,
  getDateKeyInTimezone,
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

const WINDOW_DAYS = 2;
const CHECKOUT_HOUR_START = 8;
const CHECKOUT_HOUR_END = 20;
/** Right summary column height on desktop */
const CHECKOUT_COLUMN_HEIGHT =
  "h-auto min-h-0 lg:h-[720px] lg:min-h-[720px] lg:max-h-[720px]";
/** Fixed booking card — calendar fits without internal scroll */
const BOOKING_CARD_HEIGHT = "h-[440px] min-h-[440px] max-h-[440px]";
/** Premium card shell shared by booking + payment panels */
const CHECKOUT_PANEL_CLASS =
  "bg-white rounded-3xl border border-[#e6ebe3] shadow-[0_8px_40px_rgba(44,54,40,0.07)] overflow-hidden";

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

function isSlotInClinicHours(isoString: string): boolean {
  const h = getHourInTimezone(isoString, CLINIC_TIMEZONE);
  return h >= CHECKOUT_HOUR_START && h <= CHECKOUT_HOUR_END;
}

function slotMatchesPeriod(isoString: string, period: TimePeriod, displayTimezone: string): boolean {
  const h = getHourInTimezone(isoString, displayTimezone);
  const config = TIME_PERIODS.find((p) => p.id === period)!;
  return h >= config.hourStart && h < config.hourEnd;
}

const CORE_PRICING = {
  planName: "Sanative Core",
  firstMonthList: 349,
  dueToday: 249,
  ongoingPrice: 349,
  discount: 100,
};

const TRUST_BADGES = [
  {
    icon: Shield,
    title: "Refundable if not suitable",
    description: "Full refund if the program isn't right for you.",
  },
  {
    icon: RefreshCw,
    title: "Cancel anytime",
    description: "No lock-in contracts.",
  },
  {
    icon: Dna,
    title: "Biomarker-based program",
    description: "Precision health tracking.",
  },
];

const VALUE_PROPS = [
  "Doctor-led assessment",
  "Treatment if clinically prescribed",
  "Biomarker monitoring",
];

function groupSlotsByDay(slots: UnifiedSlot[], displayTimezone: string): DaySlots[] {
  const grouped = new Map<string, DaySlots>();

  for (const slot of slots) {
    const date = new Date(slot.startTime);
    const dateKey = getDateKeyInTimezone(date, displayTimezone);

    if (!grouped.has(dateKey)) {
      grouped.set(dateKey, {
        date,
        dateStr: formatDateInTimezone(date, displayTimezone, {
          weekday: "short",
          day: "numeric",
          month: "short",
        }),
        dayName: formatDateInTimezone(date, displayTimezone, { weekday: "long" }),
        slots: [],
      });
    }

    grouped.get(dateKey)!.slots.push(slot);
  }

  return Array.from(grouped.values())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((day) => ({
      ...day,
      slots: day.slots
        .filter((s) => isSlotInClinicHours(s.startTime))
        .sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        ),
    }));
}

function formatSlotTime(isoString: string, displayTimezone: string): string {
  return formatTimeInTimezone(isoString, displayTimezone);
}

function isSlotBooked(slot: UnifiedSlot): boolean {
  return slot.availabilityStatus === "BOOKED" || slot.availableDoctors <= 0;
}

function formatHoldCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatOfferCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

interface OrderSummaryCardProps {
  formData: UnifiedCheckoutFormData;
  offerCountdown: number;
  holdCountdown: number;
  hasSlot: boolean;
  className?: string;
}

function OrderSummaryCard({
  formData,
  offerCountdown,
  holdCountdown,
  hasSlot,
  className = "",
}: OrderSummaryCardProps) {
  const pricing = CORE_PRICING;

  return (
    <div
      className={`bg-white rounded-3xl border border-[#e6ebe3] shadow-[0_8px_40px_rgba(44,54,40,0.08)] overflow-hidden flex flex-col ${CHECKOUT_COLUMN_HEIGHT} ${className}`}
    >
      <div className="bg-gradient-to-br from-[#2c3628] via-[#34412f] to-[#1D9E75] text-white shrink-0 px-6 py-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/75 mb-1">
          Limited offer
        </p>
        <h2 className="font-serif text-2xl lg:text-3xl leading-tight">{pricing.planName}</h2>

        {offerCountdown > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 py-2 px-3 bg-amber-400/20 border border-amber-300/40 rounded-lg">
            <Timer className="w-4 h-4 text-amber-200 flex-shrink-0" />
            <span className="text-sm font-semibold text-amber-50">
              Save $100 · ends in {formatOfferCountdown(offerCountdown)}
            </span>
          </div>
        )}

        <div className="flex items-end gap-3 mt-4">
          <span className="text-5xl lg:text-6xl font-bold tracking-tight leading-none">
            ${pricing.dueToday}
          </span>
          <div className="pb-1">
            <span className="text-xl text-white/50 line-through block">${pricing.firstMonthList}</span>
            <span className="text-sm text-white/80 font-medium">first month</span>
          </div>
        </div>
        <p className="text-sm text-white/70 mt-2">
          Then ${pricing.ongoingPrice}/month · cancel anytime
        </p>
      </div>

      <div className="flex flex-col flex-1 min-h-0 overflow-hidden px-6 py-4 gap-3">
        <ul className="space-y-2 shrink-0">
          {VALUE_PROPS.map((prop) => (
            <li key={prop} className="flex items-center gap-2 text-[#2c3628]">
              <span className="w-5 h-5 rounded-full bg-[#5c7a52]/10 flex items-center justify-center flex-shrink-0">
                <Check className="w-3 h-3 text-[#5c7a52]" />
              </span>
              <span className="text-sm font-medium">{prop}</span>
            </li>
          ))}
        </ul>

        <div className="space-y-2 border-t border-[#e6ebe3] pt-3 shrink-0">
          {TRUST_BADGES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex gap-2.5 items-start">
              <div className="w-7 h-7 rounded-lg bg-[#f4f7f2] flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-[#5c7a52]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#2c3628]">{title}</p>
                <p className="text-[11px] text-[#7e9a72] leading-snug">{description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-[#f4f7f2] p-4 shrink-0">
          <div className="flex justify-between items-baseline">
            <span className="text-base font-medium text-[#5c7a52]">Due today</span>
            <span className="text-2xl font-bold text-[#2c3628]">${pricing.dueToday}</span>
          </div>
        </div>

        <div className="h-[52px] shrink-0 flex items-center gap-2.5 px-3 rounded-lg bg-[#5c7a52]/5 border border-[#5c7a52]/15">
          <Calendar className="w-4 h-4 text-[#5c7a52] flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-[#7e9a72] uppercase tracking-wide">Consultation</p>
            <p className="text-sm font-medium text-[#2c3628] truncate">
              {hasSlot && formData.consultationDate
                ? `${formData.consultationDate} · ${formData.consultationTime}`
                : "Select a time on the left"}
            </p>
          </div>
          {hasSlot && holdCountdown > 0 && (
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-bold text-[#5c7a52] tabular-nums">
                {formatHoldCountdown(holdCountdown)}
              </p>
              <p className="text-[10px] text-[#7e9a72]">held</p>
            </div>
          )}
        </div>
      </div>
    </div>
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

function ConsultationPicker({
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
        slotMatchesPeriod(s.startTime, period, patientTimezone) && !isSlotBooked(s)
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
          Tap another day or time to change — payment updates automatically.
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
                (s) => s.slotId === formData.selectedSlotId && !isSlotBooked(s)
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
                      const booked = isSlotBooked(slot);

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
                  No times in this period — try another.
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

export interface UnifiedCheckoutScreenProps {
  formData: UnifiedCheckoutFormData;
  userId: string | null;
  bookingHoldId: string | null;
  holdCountdown: number;
  offerCountdown: number;
  slotsError: string | null;
  slotsRefreshKey?: number;
  creatingHold: boolean;
  selectingSlotId: string | null;
  onSlotSelect: (slot: UnifiedSlot) => void;
  onSlotsError: (error: string | null) => void;
  onPaymentSuccess: (paymentIntentId?: string) => void;
  onPaymentError: (error: string) => void;
  /** Patient IANA timezone for display (from profile address) */
  patientTimezone?: string;
}

const PAYMENT_FORM_ID = "wm-unified-checkout-payment";

export function UnifiedCheckoutScreen({
  formData,
  userId,
  bookingHoldId,
  holdCountdown,
  offerCountdown,
  slotsError,
  slotsRefreshKey = 0,
  creatingHold,
  selectingSlotId,
  onSlotSelect,
  onSlotsError,
  onPaymentSuccess,
  onPaymentError,
  patientTimezone: patientTimezoneProp,
}: UnifiedCheckoutScreenProps) {
  const patientTimezone = patientTimezoneProp ?? CLINIC_TIMEZONE;
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [stripeReady, setStripeReady] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<UnifiedSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [dayWindowOffset, setDayWindowOffset] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(true);
  const [dayRangeLabel, setDayRangeLabel] = useState("");

  const fetchSlots = async (offset: number) => {
    setLoadingSlots(true);
    onSlotsError(null);
    try {
      const params = new URLSearchParams({
        appointmentType: "PHONE_CONSULT",
        dayOffset: String(offset),
        windowDays: String(WINDOW_DAYS),
      });
      const response = await fetch(`/api/bookings/availability?${params}`);
      if (!response.ok) {
        throw new Error("Failed to load available times");
      }
      const data = await response.json();
      setAvailableSlots(data.slots || []);
      setCanGoBack(Boolean(data.canGoBack));
      setCanGoForward(Boolean(data.canGoForward));
      setActiveDayIndex(0);

      const days = groupSlotsByDay(data.slots || [], patientTimezone);
      if (days.length >= 2) {
        const a = formatDateInTimezone(days[0].date, patientTimezone, { day: "numeric", month: "short" });
        const b = formatDateInTimezone(days[1].date, patientTimezone, { day: "numeric", month: "short" });
        setDayRangeLabel(`${a} – ${b}`);
      } else if (days.length === 1) {
        setDayRangeLabel(
          formatDateInTimezone(days[0].date, patientTimezone, {
            weekday: "short",
            day: "numeric",
            month: "short",
          })
        );
      } else {
        setDayRangeLabel("No dates");
      }
    } catch (error) {
      console.error("Error fetching slots:", error);
      onSlotsError("Unable to load available times. Please try again.");
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchSlots(dayWindowOffset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayWindowOffset, slotsRefreshKey, patientTimezone]);

  useEffect(() => {
    setStripeReady(false);
  }, [bookingHoldId, formData.selectedSlotId]);

  const groupedSlots = useMemo(
    () => groupSlotsByDay(availableSlots, patientTimezone),
    [availableSlots, patientTimezone]
  );

  const safeDayIndex = Math.min(activeDayIndex, Math.max(0, groupedSlots.length - 1));

  const hasSlot = Boolean(formData.selectedSlotId && bookingHoldId);
  const holdExpired = hasSlot && holdCountdown <= 0;
  const pricing = CORE_PRICING;

  const canPay =
    Boolean(userId) &&
    hasSlot &&
    !holdExpired &&
    !creatingHold &&
    stripeReady &&
    !paymentProcessing;

  const ctaDisabled = !canPay;
  const ctaLoading = paymentProcessing || creatingHold;

  const orderSummaryProps: OrderSummaryCardProps = {
    formData,
    offerCountdown,
    holdCountdown,
    hasSlot,
  };

  const pickerProps = {
    groupedSlots,
    formData,
    loadingSlots,
    slotsError,
    creatingHold,
    selectingSlotId,
    activeDayIndex: safeDayIndex,
    onActiveDayChange: setActiveDayIndex,
    onSlotSelect,
    onRetrySlots: () => fetchSlots(dayWindowOffset),
    dayRangeLabel,
    canGoBack,
    canGoForward,
    onPrevDays: () => setDayWindowOffset((o) => Math.max(0, o - WINDOW_DAYS)),
    onNextDays: () => setDayWindowOffset((o) => o + WINDOW_DAYS),
    patientTimezone,
    hasSelectedSlot: hasSlot,
    splitLayout: true,
  };

  const paymentBlockProps = {
    hasSlot,
    holdExpired,
    userId,
    formData,
    bookingHoldId,
    pricing,
    onPaymentSuccess,
    onPaymentError,
    onReadyChange: setStripeReady,
    onProcessingChange: setPaymentProcessing,
    showPayButton: true as const,
    payDisabled: ctaDisabled,
    payLoading: ctaLoading,
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      <div className="w-full max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8 lg:pb-10">
        <div className="text-center mb-6 lg:mb-7">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5c7a52]/10 text-[#5c7a52] text-xs font-semibold mb-2">
            <Stethoscope className="w-3.5 h-3.5" />
            Final step
          </div>
          <h1 className="text-2xl font-serif text-[#2c3628] mb-1">Complete your booking</h1>
          <p className="text-xs text-[#5c7a52] max-w-sm mx-auto">
            Choose your consultation time, then complete secure payment below.
          </p>
        </div>

        {/* Mobile: summary + split booking / payment cards */}
        <div className="lg:hidden space-y-5">
          <OrderSummaryCard {...orderSummaryProps} className="!h-auto !min-h-0 !max-h-none" />
          <div className={`${CHECKOUT_PANEL_CLASS} p-4 sm:p-5`}>
            <ConsultationPicker {...pickerProps} splitLayout={false} />
          </div>
          <CheckoutPaymentPanel
            hasSlot={hasSlot}
            holdCountdown={holdCountdown}
            holdExpired={holdExpired}
          >
            <PaymentBlock {...paymentBlockProps} compact />
          </CheckoutPaymentPanel>
        </div>

        {/* Desktop: left stack (booking + payment) · right summary */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-6 xl:gap-8 lg:items-start">
          <div className="flex flex-col gap-5">
            <div className={`${CHECKOUT_PANEL_CLASS} ${BOOKING_CARD_HEIGHT}`}>
              <div className="p-5 xl:p-6 h-full flex flex-col min-h-0">
                <ConsultationPicker {...pickerProps} />
              </div>
            </div>

            <CheckoutPaymentPanel
              hasSlot={hasSlot}
              holdCountdown={holdCountdown}
              holdExpired={holdExpired}
            >
              <PaymentBlock {...paymentBlockProps} compact inPanel />
            </CheckoutPaymentPanel>
          </div>

          <OrderSummaryCard {...orderSummaryProps} />
        </div>
      </div>
    </div>
  );
}

function CheckoutPaymentPanel({
  children,
  hasSlot,
  holdCountdown,
  holdExpired,
}: {
  children: ReactNode;
  hasSlot: boolean;
  holdCountdown: number;
  holdExpired: boolean;
}) {
  return (
    <div className={CHECKOUT_PANEL_CLASS}>
      <div className="px-5 xl:px-6 py-3.5 bg-gradient-to-r from-[#f8faf6] via-[#fdfbf7] to-[#f4f7f2] border-b border-[#e6ebe3]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#e6ebe3] shadow-sm flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-[#5c7a52]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#2c3628] leading-tight">Secure payment</p>
              <p className="text-[10px] text-[#7e9a72]">Stripe · PCI compliant · SSL encrypted</p>
            </div>
          </div>
          {hasSlot && holdCountdown > 0 && !holdExpired && (
            <div className="text-right shrink-0 rounded-lg bg-white/80 border border-[#5c7a52]/15 px-2.5 py-1.5">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-[#7e9a72]">
                Slot held
              </p>
              <p className="text-sm font-bold text-[#5c7a52] tabular-nums leading-none mt-0.5">
                {formatHoldCountdown(holdCountdown)}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 xl:px-6 py-4 xl:py-5">
        {holdExpired && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 flex gap-2 mb-3">
            <Timer className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 leading-snug">
              Your slot expired — choose a new time in the calendar above.
            </p>
          </div>
        )}
        {children}
        {hasSlot && holdCountdown > 0 && holdCountdown < 300 && !holdExpired && (
          <p className="text-center text-[10px] text-amber-600 mt-3">
            Complete payment within {formatHoldCountdown(holdCountdown)} to keep your slot
          </p>
        )}
      </div>
    </div>
  );
}

function PaymentBlock({
  hasSlot,
  holdExpired,
  userId,
  formData,
  bookingHoldId,
  pricing,
  onPaymentSuccess,
  onPaymentError,
  onReadyChange,
  onProcessingChange,
  compact = false,
  showPayButton = false,
  payDisabled = true,
  payLoading = false,
  inPanel = false,
}: {
  hasSlot: boolean;
  holdExpired: boolean;
  userId: string | null;
  formData: UnifiedCheckoutFormData;
  bookingHoldId: string | null;
  pricing: typeof CORE_PRICING;
  onPaymentSuccess: (paymentIntentId?: string) => void;
  onPaymentError: (error: string) => void;
  onReadyChange: (ready: boolean) => void;
  onProcessingChange: (processing: boolean) => void;
  compact?: boolean;
  showPayButton?: boolean;
  payDisabled?: boolean;
  payLoading?: boolean;
  inPanel?: boolean;
}) {
  return (
    <div className={`flex flex-col ${compact ? "space-y-2" : "space-y-3"}`}>
      {!inPanel && (
        <div className="flex items-center gap-2">
          <CreditCard className={`text-[#5c7a52] ${compact ? "w-4 h-4" : "w-5 h-5"}`} />
          <h3 className={`font-semibold text-[#2c3628] ${compact ? "text-sm" : ""}`}>
            Payment details
          </h3>
        </div>
      )}

      {!hasSlot ? (
        <div
          className={`rounded-xl border border-dashed border-[#cdd8c6] bg-[#f4f7f2]/50 text-center ${
            compact ? "p-3" : "p-8"
          }`}
        >
          <Calendar className={`text-[#a8bb9e] mx-auto mb-1.5 ${compact ? "w-5 h-5" : "w-8 h-8"}`} />
          <p className={`text-[#7e9a72] ${compact ? "text-[11px]" : "text-sm"}`}>
            Select a time to unlock payment
          </p>
        </div>
      ) : !userId ? (
        <div className="rounded-xl border border-[#e6ebe3] p-6 flex flex-col items-center">
          <div className="w-7 h-7 border-2 border-[#5c7a52]/30 border-t-[#5c7a52] rounded-full animate-spin mb-2" />
          <p className="text-xs text-[#7e9a72]">Preparing account...</p>
        </div>
      ) : (
        <StripePaymentForm
          userId={userId}
          selectedPlan="core"
          firstMonthAmount={pricing.dueToday * 100}
          ongoingMonthlyAmount={pricing.ongoingPrice * 100}
          discountAmount={pricing.discount * 100}
          consultationDate={formData.consultationDate}
          consultationTime={formData.consultationTime}
          customerEmail={formData.email}
          customerName={`${formData.firstName} ${formData.lastName}`.trim()}
          bookingHoldId={bookingHoldId || undefined}
          embedded
          splitCardFields
          showEmbeddedSubmit={showPayButton}
          submitLabel={`Pay $${pricing.dueToday} & book consultation`}
          submitDisabled={payDisabled}
          formId={PAYMENT_FORM_ID}
          enabled={hasSlot && !holdExpired}
          onReadyChange={onReadyChange}
          onProcessingChange={onProcessingChange}
          onSuccess={onPaymentSuccess}
          onError={onPaymentError}
        />
      )}

      {!inPanel && (
        <div className={`flex items-center justify-center gap-3 ${compact ? "pt-1" : "pt-2"}`}>
          <span className="flex items-center gap-1 text-[9px] text-[#a8bb9e]">
            <Lock className="w-3 h-3" />
            SSL secured
          </span>
          <span className="text-[9px] text-[#a8bb9e]">Stripe · PCI compliant</span>
        </div>
      )}
    </div>
  );
}
