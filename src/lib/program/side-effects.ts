/**
 * Side-effect catalog and evidence-informed mitigation for WM GLP-1 programs.
 * Escalation rules are deterministic; AI can enrich copy later.
 */

export type SideEffectSymptomId =
  | "nausea"
  | "vomiting"
  | "diarrhoea"
  | "constipation"
  | "reflux"
  | "fatigue"
  | "headache"
  | "injection_site_reaction"
  | "reduced_appetite"
  | "dizziness"
  | "abdominal_pain";

export type MitigationTip = {
  id: string;
  title: string;
  description: string;
  priority: "high" | "normal";
};

export const SIDE_EFFECT_SYMPTOMS: Array<{
  id: SideEffectSymptomId;
  label: string;
  requiresEscalation?: boolean;
}> = [
  { id: "nausea", label: "Nausea" },
  { id: "vomiting", label: "Vomiting" },
  { id: "diarrhoea", label: "Diarrhoea" },
  { id: "constipation", label: "Constipation" },
  { id: "reflux", label: "Heartburn / reflux" },
  { id: "fatigue", label: "Fatigue" },
  { id: "headache", label: "Headache" },
  { id: "injection_site_reaction", label: "Injection site reaction" },
  { id: "reduced_appetite", label: "Reduced appetite" },
  { id: "dizziness", label: "Dizziness" },
  { id: "abdominal_pain", label: "Abdominal pain", requiresEscalation: true },
];

const MITIGATION_BY_SYMPTOM: Record<SideEffectSymptomId, MitigationTip[]> = {
  nausea: [
    {
      id: "nausea-small-meals",
      title: "Eat smaller, slower meals",
      description:
        "Try plain foods (crackers, toast) and avoid greasy or very large meals for 24–48 hours.",
      priority: "high",
    },
    {
      id: "nausea-hydration",
      title: "Sip fluids regularly",
      description: "Take small sips of water or electrolyte drinks. Avoid drinking large volumes at once.",
      priority: "normal",
    },
    {
      id: "nausea-timing",
      title: "Take medication with food",
      description: "If your prescriber advised it, take your dose after a light meal rather than on an empty stomach.",
      priority: "normal",
    },
  ],
  vomiting: [
    {
      id: "vomit-hydration",
      title: "Rehydrate gradually",
      description: "Sip fluids in small amounts. If you cannot keep fluids down for 12 hours, contact your care team.",
      priority: "high",
    },
    {
      id: "vomit-rest",
      title: "Rest and bland diet",
      description: "Pause intense exercise. Reintroduce food slowly with bland options when nausea settles.",
      priority: "normal",
    },
  ],
  diarrhoea: [
    {
      id: "diarrhoea-fluids",
      title: "Replace fluids",
      description: "Drink water or oral rehydration solution. Watch for dizziness or dark urine.",
      priority: "high",
    },
    {
      id: "diarrhoea-fibre",
      title: "Temporarily reduce high-fibre foods",
      description: "Avoid large raw vegetable or legume portions until symptoms improve.",
      priority: "normal",
    },
  ],
  constipation: [
    {
      id: "constipation-fibre-water",
      title: "Fibre and fluids",
      description: "Increase water intake and include gentle fibre (oats, vegetables) unless your clinician advised otherwise.",
      priority: "high",
    },
    {
      id: "constipation-movement",
      title: "Light movement",
      description: "A short walk after meals can help bowel regularity.",
      priority: "normal",
    },
  ],
  reflux: [
    {
      id: "reflux-meal-size",
      title: "Smaller evening meals",
      description: "Finish eating 2–3 hours before bed and avoid spicy or acidic foods if they trigger symptoms.",
      priority: "high",
    },
  ],
  fatigue: [
    {
      id: "fatigue-sleep",
      title: "Prioritise sleep",
      description: "Aim for consistent bed/wake times. Fatigue often improves after the first few weeks on treatment.",
      priority: "normal",
    },
    {
      id: "fatigue-protein",
      title: "Check protein intake",
      description: "Low energy can relate to low calorie intake — ensure adequate protein across the day.",
      priority: "normal",
    },
  ],
  headache: [
    {
      id: "headache-hydration",
      title: "Hydration check",
      description: "Headaches can worsen with dehydration — drink water steadily through the day.",
      priority: "high",
    },
  ],
  injection_site_reaction: [
    {
      id: "injection-rotate",
      title: "Rotate injection sites",
      description: "Use a different site each week (abdomen, thigh, upper arm). Do not rub the area vigorously.",
      priority: "high",
    },
    {
      id: "injection-cool",
      title: "Cool compress",
      description: "A cool, clean compress for 10 minutes may ease redness or itching.",
      priority: "normal",
    },
  ],
  reduced_appetite: [
    {
      id: "appetite-protein-first",
      title: "Protein-first meals",
      description: "Even with low appetite, aim for protein at each meal to protect muscle during weight loss.",
      priority: "high",
    },
  ],
  dizziness: [
    {
      id: "dizzy-sit",
      title: "Stand up slowly",
      description: "Rise slowly from sitting. Ensure you are eating and drinking enough — contact care team if persistent.",
      priority: "high",
    },
  ],
  abdominal_pain: [
    {
      id: "abdominal-urgent",
      title: "Seek urgent review",
      description:
        "Persistent or severe abdominal pain needs prompt medical assessment. Call 000 if pain is sudden and severe.",
      priority: "high",
    },
  ],
};

const SEVERE_ESCALATION_MESSAGE =
  "Your care team has been notified. If you feel very unwell, call 000 or go to your nearest emergency department.";

export function getMitigationPlan(symptoms: string[], severity: "MILD" | "MODERATE" | "SEVERE") {
  const validSymptoms = symptoms.filter((s): s is SideEffectSymptomId =>
    SIDE_EFFECT_SYMPTOMS.some((x) => x.id === s)
  );

  const tips: MitigationTip[] = [];
  const seen = new Set<string>();

  for (const symptom of validSymptoms) {
    for (const tip of MITIGATION_BY_SYMPTOM[symptom] || []) {
      if (!seen.has(tip.id)) {
        seen.add(tip.id);
        tips.push(tip);
      }
    }
  }

  if (tips.length === 0) {
    tips.push({
      id: "general-monitor",
      title: "Monitor and rest",
      description: "Track if symptoms worsen over 24 hours. Log again tomorrow or message your care partner with updates.",
      priority: "normal",
    });
  }

  const requiresEscalation =
    severity === "SEVERE" ||
    validSymptoms.some((s) => SIDE_EFFECT_SYMPTOMS.find((x) => x.id === s)?.requiresEscalation);

  const urgentSymptoms = validSymptoms.filter(
    (s) => SIDE_EFFECT_SYMPTOMS.find((x) => x.id === s)?.requiresEscalation
  );

  return {
    tips: tips.sort((a, b) => (a.priority === "high" ? -1 : 1)),
    requiresEscalation,
    urgentSymptoms,
    escalationMessage: requiresEscalation ? SEVERE_ESCALATION_MESSAGE : null,
  };
}

export function symptomLabels(ids: string[]): string[] {
  return ids.map((id) => SIDE_EFFECT_SYMPTOMS.find((s) => s.id === id)?.label || id);
}
