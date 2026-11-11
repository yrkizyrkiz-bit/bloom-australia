"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatTimeInTimezone, getHourInTimezone } from "@/lib/australia-timezone";
import type { LpWmAvailabilitySlot } from "@/lib/lp/availability";
import { isLpWmClosedWeekday, type LpWmSlot } from "@/lib/lp/weight-management-funnel";
import {
  addSydneyDays,
  getSydneyDateKey,
  getSydneyYmd,
  sydneyLocalToUtc,
  SYDNEY_TZ,
} from "@/lib/sydney-time";

const WINDOW_DAYS = 7;
const CLINIC_TZ = SYDNEY_TZ;
const PERIODS = ["Morning", "Afternoon", "Evening"] as const;
type Period = (typeof PERIODS)[number];

const SLOTS_CACHE_KEY = "lp_wm_availability_slots";
const SLOTS_CACHE_MS = 60_000;

type DayCard = {
  key: string;
  date: Date;
  weekday: string;
  dayNum: string;
  month: string;
  openCount: number;
  bookedOut: boolean;
  pending: boolean;
  slots: LpWmAvailabilitySlot[];
};

type Props = {
  selected: LpWmSlot | null;
  onSelect: (slot: LpWmSlot) => void;
  initialSlots?: LpWmAvailabilitySlot[];
};

function isOpenSlot(slot: LpWmAvailabilitySlot): boolean {
  if (isLpWmClosedWeekday(slot.startTime)) return false;
  return slot.availabilityStatus !== "BOOKED" && slot.availableDoctors > 0;
}

function periodForSlot(iso: string): Period {
  const hour = getHourInTimezone(iso, CLINIC_TZ);
  if (hour < 12) return "Morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

function readCachedSlots(): LpWmAvailabilitySlot[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SLOTS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at?: number; slots?: LpWmAvailabilitySlot[] };
    if (!parsed.at || !Array.isArray(parsed.slots)) return null;
    if (Date.now() - parsed.at > SLOTS_CACHE_MS) return null;
    return parsed.slots;
  } catch {
    return null;
  }
}

function writeCachedSlots(slots: LpWmAvailabilitySlot[]) {
  try {
    sessionStorage.setItem(SLOTS_CACHE_KEY, JSON.stringify({ at: Date.now(), slots }));
  } catch {
    /* ignore quota */
  }
}

function buildWindowDays(slots: LpWmAvailabilitySlot[], loaded: boolean): DayCard[] {
  const byDay = new Map<string, LpWmAvailabilitySlot[]>();
  for (const slot of slots) {
    const key = getSydneyDateKey(slot.startTime);
    const list = byDay.get(key) ?? [];
    list.push(slot);
    byDay.set(key, list);
  }

  const first = addSydneyDays(getSydneyYmd(new Date()), 1);
  const days: DayCard[] = [];
  for (let i = 0; i < WINDOW_DAYS; i += 1) {
    const ymd = addSydneyDays(first, i);
    const noon = sydneyLocalToUtc(ymd.year, ymd.month, ymd.day, 12, 0);
    const key = getSydneyDateKey(noon);
    const daySlots = byDay.get(key) ?? [];
    const closed = isLpWmClosedWeekday(noon);
    const open = closed ? [] : daySlots.filter(isOpenSlot);
    days.push({
      key,
      date: noon,
      weekday: noon.toLocaleDateString("en-AU", { timeZone: CLINIC_TZ, weekday: "short" }),
      dayNum: noon.toLocaleDateString("en-AU", { timeZone: CLINIC_TZ, day: "numeric" }),
      month: noon.toLocaleDateString("en-AU", { timeZone: CLINIC_TZ, month: "short" }),
      openCount: open.length,
      bookedOut: closed || (loaded && open.length === 0),
      pending: !loaded && !closed,
      slots: open,
    });
  }
  return days;
}

function firstOpenIndex(days: DayCard[]): number {
  const withSlots = days.findIndex((day) => !day.bookedOut && day.openCount > 0);
  if (withSlots >= 0) return withSlots;
  const openish = days.findIndex((day) => day.pending || !day.bookedOut);
  return openish < 0 ? 0 : openish;
}

function applySlots(
  slots: LpWmAvailabilitySlot[],
  setDays: (days: DayCard[]) => void,
  setActiveIndex: (updater: (current: number) => number) => void
) {
  const nextDays = buildWindowDays(slots, true);
  setDays(nextDays);
  setActiveIndex((current) =>
    nextDays[current] && !nextDays[current].bookedOut ? current : firstOpenIndex(nextDays)
  );
}

export function LpWmSlotPicker({ selected, onSelect, initialSlots = [] }: Props) {
  const stripRef = useRef<HTMLDivElement>(null);
  const [days, setDays] = useState<DayCard[]>(() =>
    buildWindowDays(initialSlots, initialSlots.length > 0)
  );
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(() => firstOpenIndex(days));
  const [period, setPeriod] = useState<Period>("Morning");

  const load = useCallback(async (silent = false) => {
    if (!silent) setError(null);
    try {
      const response = await fetch("/api/lp/weight-management/availability", {
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("Failed to load available times");
      const data = await response.json();
      const slots = (data.slots || []) as LpWmAvailabilitySlot[];
      writeCachedSlots(slots);
      applySlots(slots, setDays, setActiveIndex);
    } catch {
      if (!silent) {
        setError("Unable to load available times. Please try again.");
      }
    }
  }, []);

  useEffect(() => {
    if (initialSlots.length > 0) {
      writeCachedSlots(initialSlots);
      void load(true);
      return;
    }
    const cached = readCachedSlots();
    if (cached?.length) {
      applySlots(cached, setDays, setActiveIndex);
      void load(true);
      return;
    }
    void load(false);
  }, [initialSlots, load]);

  useEffect(() => {
    const node = stripRef.current?.children[activeIndex] as HTMLElement | undefined;
    node?.scrollIntoView({ behavior: "auto", inline: "center", block: "nearest" });
  }, [activeIndex, days.length]);

  const activeDay = days[activeIndex];
  const slotsByPeriod = useMemo(() => {
    const groups: Record<Period, LpWmAvailabilitySlot[]> = {
      Morning: [],
      Afternoon: [],
      Evening: [],
    };
    if (!activeDay || activeDay.bookedOut) return groups;
    for (const slot of activeDay.slots) {
      groups[periodForSlot(slot.startTime)].push(slot);
    }
    return groups;
  }, [activeDay]);

  useEffect(() => {
    if (!activeDay || activeDay.bookedOut) return;
    if (selected && activeDay.slots.some((slot) => slot.slotId === selected.slotId)) {
      setPeriod(periodForSlot(selected.startTime));
      return;
    }
    const firstOpen = PERIODS.find((label) => slotsByPeriod[label].length > 0);
    if (firstOpen) setPeriod(firstOpen);
  }, [activeDay, selected?.slotId, slotsByPeriod]);

  const visibleSlots = slotsByPeriod[period];

  const monthLabel = (activeDay?.month || days[0]?.month || "").toUpperCase();

  const scrollStrip = (direction: -1 | 1) => {
    stripRef.current?.scrollBy({ left: direction * 160, behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}{" "}
          <button type="button" className="underline" onClick={() => void load(false)}>
            Try again
          </button>
        </div>
      )}

      {days.length > 0 && (
        <>
          <div className="flex items-end justify-between gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-400">
              {monthLabel}
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                aria-label="Previous dates"
                onClick={() => scrollStrip(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-neutral-700 hover:bg-neutral-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next dates"
                onClick={() => scrollStrip(1)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 text-neutral-700 hover:bg-neutral-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            ref={stripRef}
            className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {days.map((day, index) => {
              const active = index === activeIndex;
              return (
                <button
                  key={day.key}
                  type="button"
                  onClick={() =>
                    setActiveIndex(day.bookedOut ? firstOpenIndex(days) : index)
                  }
                  aria-label={
                    day.bookedOut
                      ? `${day.weekday} ${day.dayNum}, booked out`
                      : day.pending
                        ? `${day.weekday} ${day.dayNum}, loading times`
                        : `${day.weekday} ${day.dayNum}, available`
                  }
                  className={`w-[7.6rem] shrink-0 rounded-xl border px-4 py-4 text-left transition-colors ${
                    active
                      ? "border-black"
                      : day.bookedOut
                        ? "border-black/10 text-neutral-400"
                        : "border-black/15 hover:border-black/40"
                  }`}
                >
                  <p className="text-sm text-neutral-500">{day.weekday}</p>
                  <p className="mt-1 text-[2.35rem] font-medium leading-none tracking-tight">
                    {day.dayNum}
                  </p>
                  <p className="mt-3 flex items-center gap-1.5 text-xs">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        day.bookedOut ? "bg-red-400" : "lp-funnel-pulse"
                      }`}
                    />
                    {day.bookedOut ? "Booked out" : null}
                  </p>
                </button>
              );
            })}
          </div>

          {activeDay?.pending ? (
            <p className="py-6 text-center text-sm text-neutral-500">Loading times…</p>
          ) : activeDay?.bookedOut ? (
            <p className="py-6 text-center text-sm text-neutral-500">
              That day is fully booked. We&apos;ve highlighted the next open date.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {PERIODS.map((label) => {
                  const count = slotsByPeriod[label].length;
                  const active = period === label;
                  return (
                    <button
                      key={label}
                      type="button"
                      disabled={count === 0}
                      onClick={() => setPeriod(label)}
                      className={`rounded-[14px] border px-2 py-3 text-[15px] transition-colors ${
                        active
                          ? "border-black bg-black text-white"
                          : count === 0
                            ? "cursor-not-allowed border-black/10 text-neutral-300"
                            : "border-black bg-white hover:bg-neutral-50"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {visibleSlots.length === 0 ? (
                <p className="py-4 text-center text-sm text-neutral-500">
                  No {period.toLowerCase()} times on this day.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {visibleSlots.map((slot) => {
                    const isSelected = selected?.slotId === slot.slotId;
                    return (
                      <button
                        key={slot.slotId}
                        type="button"
                        onClick={() =>
                          onSelect({
                            slotId: slot.slotId,
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                          })
                        }
                        className={`w-full rounded-[14px] border px-2 py-3.5 text-[15px] tabular-nums transition-colors ${
                          isSelected
                            ? "border-black bg-black text-white"
                            : "border-black bg-white hover:bg-neutral-50"
                        }`}
                      >
                        {formatTimeInTimezone(slot.startTime, CLINIC_TZ)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
