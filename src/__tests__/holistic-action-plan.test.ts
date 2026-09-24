import { describe, expect, it } from "vitest";
import { buildHolisticActionPlan } from "@/lib/holistic-action-plan";
import {
  sanitizeHolisticHealthReport,
  type HolisticHealthReport,
  type HolisticMarkerItem,
  type HolisticOrganSystem,
} from "@/lib/holistic-health-report-types";

function marker(
  biomarkerId: string,
  extras: Partial<HolisticMarkerItem> = {}
): HolisticMarkerItem {
  return {
    biomarkerId,
    name: extras.name || biomarkerId,
    category: extras.category || "lab",
    value: extras.value ?? 1,
    unit: extras.unit || "",
    status: extras.status || "out_of_range",
    testedAt: extras.testedAt || "2026-09-01",
    plainEnglish: extras.plainEnglish || `${biomarkerId} is flagged.`,
    band: extras.band || "needs_attention",
    ...extras,
  };
}

function organ(
  id: HolisticOrganSystem["id"],
  goal: string,
  extras: Partial<HolisticOrganSystem> = {}
): HolisticOrganSystem {
  return {
    id,
    label: extras.label || id,
    score: extras.score ?? 70,
    status: extras.status || "watch",
    trend: extras.trend || "stable",
    summary: extras.summary || `${id} summary`,
    biomarkersTracked: extras.biomarkersTracked ?? 3,
    highlights: extras.highlights || [],
    goal,
    ...extras,
  };
}

function report(
  extras: Partial<HolisticHealthReport> = {}
): HolisticHealthReport {
  const built = sanitizeHolisticHealthReport({
    approvalStatus: "approved",
    executiveSummary: "Summary.",
    organSystems: extras.organSystems,
    priorityBands: extras.priorityBands,
    recommendations: extras.recommendations,
    urgentActions: extras.urgentActions,
    retestingGuidance: extras.retestingGuidance || "Retest in 8–12 weeks.",
    ...extras,
  });
  if (!built) throw new Error("expected a report");
  return built;
}

describe("buildHolisticActionPlan", () => {
  it("nests how-to steps under each organ goal and maps leftover recs", () => {
    const plan = buildHolisticActionPlan(
      report({
        organSystems: [
          organ("liver", "Bring Liver enzyme (ALT) into a healthier liver range by your next blood test", {
            label: "Liver",
            riskFactor: "ALT is outside the preferred liver range.",
          }),
          organ("kidney", "Improve Kidney waste marker (creatinine) for kidney health by your next blood test", {
            label: "Kidney",
            riskFactor: "Creatinine is higher than preferred.",
          }),
          organ(
            "heart",
            "Book a GP appointment specifically to investigate the sharp rise in your inflammation marker (CRP) and rule out any underlying cause.",
            { label: "Heart", riskFactor: "CRP rose sharply on this panel." }
          ),
          organ(
            "thyroid",
            "Keep your thyroid monitoring on schedule by including TSH in your next annual blood panel.",
            { label: "Thyroid Function", status: "optimal" }
          ),
          organ(
            "metabolic",
            "Aim to reduce refined carbohydrates and increase daily movement to help bring fasting blood sugar back below 5.5 mmol/L before your next test.",
            { label: "Metabolic Panel", riskFactor: "Fasting glucose is 5.6 mmol/L." }
          ),
          organ("blood", "Bring Red-cell size (MCV) into a healthier blood and iron range by your next blood test", {
            label: "Blood & iron",
            riskFactor: "MCV is outside the preferred range.",
          }),
        ],
        priorityBands: {
          good: [marker("tsh", { name: "Thyroid signal (TSH)", value: 1.8, unit: "mIU/L", band: "good", status: "normal" })],
          lookOut: [
            marker("glucose", {
              name: "Blood sugar",
              value: 5.6,
              unit: "mmol/L",
              band: "look_out",
              status: "borderline",
            }),
          ],
          needsAttention: [
            marker("alt", { name: "Liver enzyme (ALT)", value: 52, unit: "U/L" }),
            marker("creatinine", { name: "Kidney waste marker (creatinine)", value: 108, unit: "µmol/L" }),
            marker("mcv", { name: "Red-cell size (MCV)", value: 77, unit: "fL" }),
          ],
          immediate: [
            marker("crp", {
              name: "Inflammation marker (CRP)",
              value: 21.1,
              unit: "mg/L",
              band: "immediate",
              status: "critical",
            }),
          ],
        },
        recommendations: [
          {
            category: "follow_up",
            priority: "high",
            action: "Ask your GP to review low iron stores.",
            rationale: "Iron is low.",
          },
          {
            category: "follow_up",
            priority: "high",
            action: "Book a GP appointment to investigate the CRP rise.",
            rationale: "CRP is high.",
          },
          {
            category: "nutrition",
            priority: "medium",
            action: "Reduce refined carbohydrates and sugary drinks.",
            rationale: "Supports fasting blood sugar.",
          },
          {
            category: "lifestyle",
            priority: "medium",
            action: "Add 30 minutes of daily movement.",
            rationale: "Helps glucose and heart health.",
          },
          {
            category: "lifestyle",
            priority: "medium",
            action: "Stay well hydrated and avoid extra protein loading.",
            rationale: "Supports kidney waste clearance.",
          },
          {
            category: "lifestyle",
            priority: "medium",
            action: "Keep alcohol intake modest.",
            rationale: "Supports liver enzymes.",
          },
          {
            category: "nutrition",
            priority: "medium",
            action: "Include iron-rich foods with vitamin C.",
            rationale: "Supports iron stores and red-cell size.",
          },
          {
            category: "testing",
            priority: "medium",
            action: "Retest the panel in 8–12 weeks.",
            rationale: "Generic follow-up.",
          },
        ],
        urgentActions: ["Book a prompt review of CRP."],
      })
    );

    const byId = Object.fromEntries(plan.items.map((item) => [item.organId, item]));

    expect(byId.liver.outcome).toMatch(/ALT/i);
    expect(byId.liver.steps.join(" ")).toMatch(/alcohol/i);
    expect(byId.liver.steps.join(" ")).toMatch(/liver enzymes/i);

    expect(byId.kidney.outcome).toMatch(/creatinine/i);
    expect(byId.kidney.steps.join(" ")).toMatch(/hydrat|ibuprofen|creatinine/i);

    expect(byId.heart.outcome).not.toMatch(/book a gp/i);
    expect(byId.heart.outcome).toMatch(/cause of the rise/i);
    expect(byId.heart.steps.join(" ")).toMatch(/infection|dental|temporary/i);
    expect(byId.heart.steps.join(" ")).not.toMatch(/bring crp down with diet/i);

    expect(byId.thyroid.steps.join(" ")).toMatch(/annual|TSH/i);
    expect(byId.thyroid.steps.join(" ")).toMatch(/already in range/i);

    expect(byId.metabolic.outcome).toMatch(/below 5\.5 mmol\/L/i);
    expect(byId.metabolic.outcome).not.toMatch(/aim to reduce refined/i);
    expect(byId.metabolic.steps.join(" ")).toMatch(/refined carbohydrate/i);
    expect(byId.metabolic.steps.join(" ")).toMatch(/walk|movement/i);

    expect(byId.blood.steps.join(" ")).toMatch(/iron-rich/i);
    expect(byId.blood.steps.join(" ")).toMatch(/MCV/i);

    expect(plan.leftoverRecommendations).toEqual([]);
    expect(plan.leftoverUrgent).toEqual([]);
  });

  it("does not treat a one-off CRP spike as a diet-first heart goal", () => {
    const plan = buildHolisticActionPlan(
      report({
        organSystems: [
          organ("heart", "Improve inflammation marker (CRP) for heart health by your next blood test", {
            label: "Heart",
          }),
        ],
        priorityBands: {
          good: [],
          lookOut: [],
          needsAttention: [],
          immediate: [marker("crp", { name: "Inflammation marker (CRP)", value: 21.1, unit: "mg/L", band: "immediate" })],
        },
        recommendations: [],
      })
    );

    expect(plan.items[0].why).toMatch(/21\.1/);
    expect(plan.items[0].steps[0]).toMatch(/temporary|infection/i);
    expect(plan.items[0].steps.some((step) => /repeat crp/i.test(step))).toBe(true);
  });

  it("rebuilds an outcome from the marker when the stored goal was stripped", () => {
    const plan = buildHolisticActionPlan(
      report({
        organSystems: [organ("liver", "", { label: "Liver", riskFactor: "ALP rose from 78 to 100 U/L." })],
        priorityBands: {
          good: [marker("albumin", { name: "Blood protein (albumin)", value: 48, unit: "g/L", band: "good", status: "normal" })],
          lookOut: [marker("alp", { name: "Liver enzyme (ALP)", value: 100, unit: "U/L", band: "look_out" })],
          needsAttention: [],
          immediate: [],
        },
        recommendations: [
          {
            category: "lifestyle",
            priority: "medium",
            action: "Keep alcohol intake modest to support liver enzymes.",
            rationale: "Liver support",
          },
        ],
      })
    );

    expect(plan.items[0].outcome).toMatch(/ALP|liver enzyme/i);
    expect(plan.items[0].focusMarkers[0].biomarkerId).toBe("alp");
    expect(plan.items[0].steps.filter((step) => /alcohol/i.test(step))).toHaveLength(1);
  });

  it("keeps glucose steps on metabolic, not heart, when both exist", () => {
    const plan = buildHolisticActionPlan(
      report({
        organSystems: [
          organ("heart", "Find the cause of the rise in inflammation marker (CRP)", { label: "Heart" }),
          organ("metabolic", "Bring fasting blood sugar back below 5.5 mmol/L by your next test", {
            label: "Metabolic Panel",
          }),
        ],
        priorityBands: {
          good: [],
          lookOut: [marker("glucose", { name: "Blood sugar", value: 5.6, unit: "mmol/L", band: "look_out" })],
          needsAttention: [],
          immediate: [marker("crp", { name: "CRP", value: 12, unit: "mg/L", band: "immediate" })],
        },
        recommendations: [
          {
            category: "lifestyle",
            priority: "medium",
            action: "Cut refined carbohydrates to help fasting glucose.",
            rationale: "Metabolic support",
            organId: "metabolic",
          },
        ],
      })
    );

    const heart = plan.items.find((item) => item.organId === "heart")!;
    const metabolic = plan.items.find((item) => item.organId === "metabolic")!;
    expect(heart.steps.join(" ")).not.toMatch(/refined carbohydrate/i);
    expect(metabolic.steps.join(" ")).toMatch(/refined carbohydrate/i);
  });
});
