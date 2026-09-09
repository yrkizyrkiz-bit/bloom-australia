import { describe, expect, it } from "vitest";
import {
  applyAustralianDateGuards,
  normalizeAustralianTestDate,
  reconcileDayMonthSwappedIsoDates,
} from "@/lib/blood-test/australian-dates";

describe("australian-dates", () => {
  it("parses AU slash and month-name dates as day-first", () => {
    expect(normalizeAustralianTestDate("03/09/2026")).toBe("2026-09-03");
    expect(normalizeAustralianTestDate("9/3/26")).toBe("2026-03-09");
    expect(normalizeAustralianTestDate("03-Sep-26")).toBe("2026-09-03");
    expect(normalizeAustralianTestDate("03-Sep-2026")).toBe("2026-09-03");
  });

  it("reconciles day/month swapped ISO dates toward the majority AU date", () => {
    const map = reconcileDayMonthSwappedIsoDates([
      "2026-09-03",
      "2026-09-03",
      "2026-09-03",
      "2026-03-09",
    ]);
    expect(map.get("2026-03-09")).toBe("2026-09-03");
  });

  it("applies guards across a biomarker batch", () => {
    const result = applyAustralianDateGuards(
      [
        { testDate: "2026-09-03", biomarkerId: "a" },
        { testDate: "2026-09-03", biomarkerId: "b" },
        { testDate: "2026-03-09", biomarkerId: "c" },
        { testDate: "03/09/2026", biomarkerId: "d" },
      ],
      ["2026-03-09", "2026-09-03"]
    );
    expect(result.biomarkers.every((b) => b.testDate === "2026-09-03")).toBe(
      true
    );
    expect(result.testDates).toEqual(["2026-09-03"]);
  });
});
