"use client";

import { ProgramFocusLanding } from "@/components/dashboard/ProgramFocusLanding";

export default function WomensVitalityPage() {
  return (
    <ProgramFocusLanding
      programKey="WOMENS_HEALTH_VITALITY"
      title="Vitality"
      intro="Energy, mood, sleep and hormone balance, supported by your biomarkers and a clinical care team. Track how you feel over time and adjust your plan with evidence."
      focusItems={[
        "Fatigue, low energy and brain fog",
        "Mood, stress and sleep quality",
        "Hormone and thyroid balance",
        "Iron, nutrient and metabolic health",
      ]}
      biomarkerItems={[
        "Estradiol and Progesterone",
        "FSH, LH and SHBG",
        "TSH and Free T4",
        "Ferritin, iron and transferrin saturation",
        "Vitamin D and B12",
      ]}
      quizRoute="/dashboard/programs/womens_health_vitality"
    />
  );
}
