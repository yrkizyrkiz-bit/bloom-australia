import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fetchWmHome,
  prefetchWmHome,
  readWmHomeCache,
  writeWmHomeCache,
  readRingWeekCache,
} from "@/lib/weight-management/wm-client-cache";
import type { RingWeekScore } from "@/lib/weight-management/score-ring-week";

const week: RingWeekScore = {
  weekStart: "2026-09-14",
  weeklyTargetLoss: 0.5,
  dailyCalorieGoal: 1800,
  dailyExerciseMin: 30,
  days: [],
};

function installSessionStorage() {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
  };
  vi.stubGlobal("sessionStorage", storage);
  vi.stubGlobal("window", { sessionStorage: storage });
}

beforeEach(() => {
  installSessionStorage();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("wm-client-cache", () => {
  it("still reads the previous ring-week cache shape", () => {
    sessionStorage.setItem(
      "sanative_wm_ring_week_v1",
      JSON.stringify({ at: Date.now(), week })
    );
    expect(readRingWeekCache()?.weekStart).toBe("2026-09-14");
  });

  it("round-trips home and ring week together", () => {
    writeWmHomeCache({
      journeyStatus: { isActive: true, journeyStatus: "ACTIVE" },
      ringWeek: week,
    });

    expect(readWmHomeCache()?.journeyStatus).toEqual({
      isActive: true,
      journeyStatus: "ACTIVE",
    });
    expect(readRingWeekCache()?.weekStart).toBe("2026-09-14");
  });

  it("dedupes concurrent /home fetches from hub prefetch and page init", async () => {
    let calls = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        calls += 1;
        await new Promise((resolve) => setTimeout(resolve, 20));
        return {
          ok: true,
          json: async () => ({ journeyStatus: { isActive: true }, ringWeek: week }),
        };
      })
    );

    const [fromHub, fromPage] = await Promise.all([prefetchWmHome(), fetchWmHome(true)]);

    expect(calls).toBe(1);
    expect(fromPage?.ringWeek?.weekStart).toBe("2026-09-14");
    expect(fromHub).toBeUndefined();
    expect(readWmHomeCache()?.ringWeek?.weekStart).toBe("2026-09-14");
  });
});
