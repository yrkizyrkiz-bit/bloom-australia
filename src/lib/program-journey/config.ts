import type { ProgramKey } from "@/lib/membership/keys";

export type ProgramJourneyTheme = {
  headerGradient: string;
  accentText: string;
  mutedText: string;
  statusBorder: string;
  statusBackground: string;
  iconBackground: string;
  iconColor: string;
  currentRing: string;
  completeBackground: string;
  completeText: string;
};

export type ProgramJourneyConfig = {
  programKey: ProgramKey;
  programLabel: string;
  prepTitle: string;
  prepItems: string[];
  theme: ProgramJourneyTheme;
};

export const PROGRAM_JOURNEY_CONFIG: Partial<Record<ProgramKey, ProgramJourneyConfig>> = {
  WEIGHT_MANAGEMENT: {
    programKey: "WEIGHT_MANAGEMENT",
    programLabel: "Weight Management",
    prepTitle: "Prepare for your doctor call",
    prepItems: [
      "Find a quiet place with good phone reception",
      "Have your ID and Medicare details nearby",
      "List any medications and supplements you take",
      "Note questions you want to ask your doctor",
    ],
    theme: {
      headerGradient: "from-[#4a6243] via-[#3d4f38] to-[#34412f]",
      accentText: "text-[#cdd8c6]",
      mutedText: "text-[#a8bb9e]",
      statusBorder: "border-[#cdd8c6]",
      statusBackground: "from-[#f8f4ec] to-[#e6ebe3]",
      iconBackground: "bg-[#cdd8c6]/40",
      iconColor: "text-[#4a6243]",
      currentRing: "ring-[#cdd8c6]",
      completeBackground: "bg-[#cdd8c6] text-[#4a6243]",
      completeText: "text-[#2c3628]",
    },
  },
  HAIR_LOSS: {
    programKey: "HAIR_LOSS",
    programLabel: "Hair Restoration",
    prepTitle: "Prepare for your hair assessment",
    prepItems: [
      "Find a quiet place with good phone reception",
      "Have photos of your hair loss pattern ready if asked",
      "List any medications or supplements you currently take",
      "Note how long you have noticed changes and any family history",
    ],
    theme: {
      headerGradient: "from-violet-900 via-purple-900 to-slate-900",
      accentText: "text-violet-300",
      mutedText: "text-violet-200",
      statusBorder: "border-violet-200",
      statusBackground: "from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20",
      iconBackground: "bg-violet-100 dark:bg-violet-900/50",
      iconColor: "text-violet-600",
      currentRing: "ring-violet-200",
      completeBackground: "bg-violet-100 text-violet-600",
      completeText: "text-violet-900 dark:text-violet-100",
    },
  },
};

export function getProgramJourneyConfig(programKey: ProgramKey): ProgramJourneyConfig {
  return (
    PROGRAM_JOURNEY_CONFIG[programKey] ?? {
      programKey,
      programLabel: "Your Program",
      prepTitle: "Prepare for your doctor call",
      prepItems: [
        "Find a quiet place with good phone reception",
        "Have your ID and Medicare details nearby",
        "List any medications and supplements you take",
      ],
      theme: {
        headerGradient: "from-slate-800 via-slate-700 to-teal-800",
        accentText: "text-teal-300",
        mutedText: "text-slate-200",
        statusBorder: "border-slate-200",
        statusBackground: "from-slate-50 to-teal-50 dark:from-slate-950/20 dark:to-teal-950/20",
        iconBackground: "bg-teal-100 dark:bg-teal-900/50",
        iconColor: "text-teal-600",
        currentRing: "ring-teal-200",
        completeBackground: "bg-teal-100 text-teal-600",
        completeText: "text-slate-900 dark:text-slate-100",
      },
    }
  );
}
