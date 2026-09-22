import type { RingWeekScore } from "@/lib/weight-management/score-ring-week";

const RING_WEEK_CACHE_KEY = "sanative_wm_ring_week_v1";
const HOME_CACHE_KEY = "sanative_wm_home_v1";
const CACHE_TTL_MS = 5 * 60 * 1000;

export type WmHomeCachePayload = {
  journeyStatus?: Record<string, unknown> | null;
  showOnboarding?: boolean;
  clinicalAssessment?: { status?: "needed" | "deferred" | "complete" | null };
  checkInStatus?: Record<string, unknown> | null;
  progress?: Record<string, unknown> | null;
  ringWeek?: RingWeekScore | null;
};

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; value: T };
    if (!parsed?.value || Date.now() - parsed.at > CACHE_TTL_MS) return null;
    return parsed.value;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), value }));
  } catch {
    /* ignore quota */
  }
}

export function readRingWeekCache(): RingWeekScore | null {
  const fromValue = readJson<RingWeekScore>(RING_WEEK_CACHE_KEY);
  if (fromValue) return fromValue;
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(RING_WEEK_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; week?: RingWeekScore };
    if (!parsed?.week || Date.now() - parsed.at > CACHE_TTL_MS) return null;
    return parsed.week;
  } catch {
    return null;
  }
}

export function writeRingWeekCache(week: RingWeekScore) {
  writeJson(RING_WEEK_CACHE_KEY, week);
}

export function readWmHomeCache(): WmHomeCachePayload | null {
  return readJson<WmHomeCachePayload>(HOME_CACHE_KEY);
}

export function writeWmHomeCache(payload: WmHomeCachePayload) {
  writeJson(HOME_CACHE_KEY, payload);
  if (payload.ringWeek) writeRingWeekCache(payload.ringWeek);
}

let inflightHome: Promise<WmHomeCachePayload | null> | null = null;

/** Shared /home fetch so the programs hub and the WM page do not start two lambdas. */
export function fetchWmHome(force = false): Promise<WmHomeCachePayload | null> {
  if (inflightHome) return inflightHome;
  if (!force) {
    const cached = readWmHomeCache();
    if (cached) return Promise.resolve(cached);
  }

  inflightHome = (async () => {
    try {
      const res = await fetch("/api/weight-management/home", { cache: "no-store" });
      if (!res.ok) return null;
      const data = (await res.json()) as WmHomeCachePayload;
      writeWmHomeCache(data);
      return data;
    } catch {
      return null;
    } finally {
      inflightHome = null;
    }
  })();

  return inflightHome;
}

/** Warm the home function and stash the payload before the member opens WM. */
export function prefetchWmHome(): Promise<void> {
  return fetchWmHome(false).then(() => undefined);
}
