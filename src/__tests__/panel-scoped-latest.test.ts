import { describe, expect, it } from "vitest";
import {
  filterToLatestPanelDate,
  filterToLatestPanelForMarkers,
  getLatestPanelDateKey,
  pairCurrentPanelWithPrevious,
  testedAtUtcDayKey,
} from "@/lib/biomarkers/panel-scoped";

type Row = { biomarkerId: string; value: number; testedAt: string };

function row(biomarkerId: string, value: number, day: string): Row {
  return { biomarkerId, value, testedAt: `${day}T02:00:00.000Z` };
}

describe("panel-scoped latest results", () => {
  const georgeLike: Row[] = [
    // Sep 13 panel — 3 markers (incomplete vs Sep 3)
    row("alt", 28, "2026-09-13"),
    row("ast", 22, "2026-09-13"),
    row("hemoglobin", 140, "2026-09-13"),
    // Sep 3 panel — includes markers missing on Sep 13
    row("alt", 30, "2026-09-03"),
    row("ast", 24, "2026-09-03"),
    row("hemoglobin", 138, "2026-09-03"),
    row("iron", 12, "2026-09-03"),
    row("crp", 1.2, "2026-09-03"),
    // March — older previous for iron/CRP
    row("iron", 10, "2026-03-03"),
    row("crp", 2.0, "2026-03-03"),
    row("alt", 35, "2026-03-03"),
  ];

  it("uses UTC day keys matching history API grouping", () => {
    expect(testedAtUtcDayKey("2026-09-13T14:30:00.000Z")).toBe("2026-09-13");
    expect(testedAtUtcDayKey(new Date("2026-09-03T00:00:00.000Z"))).toBe("2026-09-03");
  });

  it("picks the newest panel date across all results", () => {
    expect(getLatestPanelDateKey(georgeLike)).toBe("2026-09-13");
  });

  it("does not backfill Sep-3-only markers into the Sep-13 current panel", () => {
    const current = filterToLatestPanelDate(georgeLike);
    const ids = current.map((r) => r.biomarkerId).sort();
    expect(ids).toEqual(["alt", "ast", "hemoglobin"]);
    expect(current).toHaveLength(3);
    expect(current.every((r) => testedAtUtcDayKey(r.testedAt) === "2026-09-13")).toBe(true);
    expect(current.find((r) => r.biomarkerId === "iron")).toBeUndefined();
    expect(current.find((r) => r.biomarkerId === "crp")).toBeUndefined();
  });

  it("pairs previous for current-panel markers to the prior panel (Sep 3), not March", () => {
    const pairs = pairCurrentPanelWithPrevious(georgeLike);
    expect(pairs).toHaveLength(3);

    const alt = pairs.find((p) => p.biomarkerId === "alt")!;
    expect(testedAtUtcDayKey(alt.current.testedAt)).toBe("2026-09-13");
    expect(alt.current.value).toBe(28);
    expect(alt.previous?.value).toBe(30);
    expect(testedAtUtcDayKey(alt.previous!.testedAt)).toBe("2026-09-03");

    expect(pairs.some((p) => p.biomarkerId === "iron")).toBe(false);
    expect(pairs.some((p) => p.biomarkerId === "crp")).toBe(false);
  });

  it("falls back to the prior panel that includes requested organ markers", () => {
    const withHeart = [
      ...georgeLike,
      row("total_cholesterol", 5.2, "2026-09-03"),
      row("ldl_cholesterol", 3.1, "2026-09-03"),
      row("hdl_cholesterol", 1.2, "2026-09-03"),
      row("triglycerides", 1.4, "2026-09-03"),
    ];
    const heartIds = [
      "total_cholesterol",
      "ldl_cholesterol",
      "hdl_cholesterol",
      "triglycerides",
      "crp",
    ];
    const resolved = filterToLatestPanelForMarkers(withHeart, heartIds);
    expect(resolved.overallLatestPanelDate).toBe("2026-09-13");
    expect(resolved.panelDate).toBe("2026-09-03");
    expect(resolved.fromPriorPanel).toBe(true);
    expect(resolved.results.map((r) => r.biomarkerId).sort()).toEqual([
      "crp",
      "hdl_cholesterol",
      "ldl_cholesterol",
      "total_cholesterol",
      "triglycerides",
    ]);
    expect(
      resolved.results.every((r) => testedAtUtcDayKey(r.testedAt) === "2026-09-03")
    ).toBe(true);
  });

  it("does not mark fromPriorPanel when organ markers are on the newest draw", () => {
    const withHeartOnLatest = [
      ...georgeLike,
      row("total_cholesterol", 5.0, "2026-09-13"),
      row("ldl_cholesterol", 3.0, "2026-09-13"),
    ];
    const resolved = filterToLatestPanelForMarkers(withHeartOnLatest, [
      "total_cholesterol",
      "ldl_cholesterol",
    ]);
    expect(resolved.panelDate).toBe("2026-09-13");
    expect(resolved.fromPriorPanel).toBe(false);
  });
});
