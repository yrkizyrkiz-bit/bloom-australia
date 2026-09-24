import { describe, expect, it } from "vitest";
import { combinedTrendStatusLabel, GP_NEXT_CONSULT_COPY, stripAskEducationalGpClosing, stripGpHandoffLanguage } from "@/lib/holistic-patient-language";

describe("combinedTrendStatusLabel", () => {
  it("pairs a drop with the current in-range band", () => {
    expect(
      combinedTrendStatusLabel({
        trend: "worsening",
        status: "optimal",
        value: 28,
        previousValue: 32,
      })
    ).toBe("Declined but still optimal");
    expect(
      combinedTrendStatusLabel({
        trend: "worsening",
        status: "normal",
        value: 40,
        previousValue: 44,
      })
    ).toBe("Declined but still normal");
  });

  it("pairs a rise with the current in-range band", () => {
    expect(
      combinedTrendStatusLabel({
        trend: "worsening",
        status: "optimal",
        value: 33,
        previousValue: 28,
      })
    ).toBe("Elevated but still optimal");
    expect(
      combinedTrendStatusLabel({
        trend: "worsening",
        status: "normal",
        band: "look_out",
        value: 48,
        previousValue: 40,
      })
    ).toBe("Elevated but still normal");
  });

  it("does not call an in-range change needs attention", () => {
    expect(combinedTrendStatusLabel({ trend: "declining", status: "optimal" })).toBe(
      "Declined but still optimal"
    );
    expect(combinedTrendStatusLabel({ trend: "worsening", status: "watch" })).toBe(
      "Declined but still normal"
    );
  });

  it("keeps improved and stable in-range copy calm", () => {
    expect(combinedTrendStatusLabel({ trend: "improving", status: "optimal" })).toBe(
      "Improved and still optimal"
    );
    expect(combinedTrendStatusLabel({ trend: "stable", status: "normal" })).toBe("Still normal");
  });

  it("uses out-of-range copy only when the result is actually out of range", () => {
    expect(
      combinedTrendStatusLabel({
        trend: "worsening",
        status: "out_of_range",
        value: 80,
        previousValue: 60,
      })
    ).toBe("Elevated and out of range");
    expect(
      combinedTrendStatusLabel({
        trend: "worsening",
        status: "out_of_range",
        value: 20,
        previousValue: 40,
      })
    ).toBe("Declined and out of range");
  });
});

describe("stripGpHandoffLanguage", () => {
  it("drops ask-your-GP instructions from card copy", () => {
    expect(
      stripGpHandoffLanguage("Talk with your GP about liver enzymes and when to retest.")
    ).toBe("");
    expect(
      stripGpHandoffLanguage(
        "Ask your GP to review both the iron studies and the CRP result at the same appointment, and to consider whether an underlying infection or inflammatory condition could be driving both."
      )
    ).toBe("");
    expect(
      stripGpHandoffLanguage("Mention GGT to your GP at the next visit.")
    ).toBe("");
    expect(stripGpHandoffLanguage(GP_NEXT_CONSULT_COPY)).toBe("");
  });

  it("keeps member actions and removes a trailing GP mention", () => {
    expect(
      stripGpHandoffLanguage("Keep alcohol modest. Mention this to your GP.")
    ).toBe("Keep alcohol modest.");
  });
});

describe("stripAskEducationalGpClosing", () => {
  it("drops the canned GP care-team Ask footer", () => {
    expect(
      stripAskEducationalGpClosing(
        "Educational only — check next steps with your GP or Sanative care team."
      )
    ).toBeUndefined();
  });
});
