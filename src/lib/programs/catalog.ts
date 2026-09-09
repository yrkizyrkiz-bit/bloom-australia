/**
 * Unified program catalog for the post-login dashboard grid.
 *
 * Visual tokens mirror the home page BentoHero: soft gradient fills, icon circles,
 * and serif typography, no background photography.
 */

import {
  Scale,
  Sparkles,
  Activity,
  HeartPulse,
  Flower2,
  Pill,
  Beaker,
  type LucideIcon,
} from "lucide-react";
import type { ProgramKey } from "@/lib/membership/keys";

export type CardGender = "all" | "male" | "female";
export type CardTone = "light" | "dark";

export type CardTheme = {
  gradient: string;
  tone: CardTone;
  iconCircle: string;
  iconColor: string;
  badge?: { label: string; className: string };
};

export type DashboardProgramCard = {
  key: ProgramKey;
  label: string;
  tagline: string;
  icon: LucideIcon;
  gender: CardGender;
  dashboardRoute: string;
  quizRoute: string;
  theme: CardTheme;
  priceHint?: string;
};

export const PROGRAM_CARDS: DashboardProgramCard[] = [
  {
    key: "WEIGHT_MANAGEMENT",
    label: "Weight Management",
    tagline: "Doctor-led programs with personalised medical support",
    icon: Scale,
    gender: "all",
    dashboardRoute: "/dashboard/weight-management",
    quizRoute: "/dashboard/programs/weight_management",
    theme: {
      gradient: "from-[#4a6243] to-[#3d4f38]",
      tone: "dark",
      iconCircle: "bg-[#cdd8c6]/20",
      iconColor: "text-white/40",
      badge: { label: "Most popular", className: "bg-[#c17a58] text-white" },
    },
    priceHint: "$360 every 3 months",
  },
  {
    key: "HAIR_LOSS",
    label: "Hair",
    tagline: "Clinically proven treatments for thicker, fuller hair",
    icon: Sparkles,
    gender: "all",
    dashboardRoute: "/dashboard/mens-health/hair-loss",
    quizRoute: "/dashboard/programs/hair_loss",
    theme: {
      gradient: "from-[#f0e8d8] to-[#e5d7bf]",
      tone: "light",
      iconCircle: "bg-[#c17a58]/20",
      iconColor: "text-[#c17a58]",
      badge: { label: "Men & women", className: "bg-[#c17a58] text-white" },
    },
    priceHint: "$90 every 3 months",
  },
  {
    key: "MENS_HEALTH_SEXUAL",
    label: "Sexual Health",
    tagline: "Confidential care for confidence and performance",
    icon: HeartPulse,
    gender: "male",
    dashboardRoute: "/dashboard/mens-health/sexual-health",
    quizRoute: "/dashboard/programs/mens_health_sexual",
    theme: {
      gradient: "from-[#34412f] to-[#2c3628]",
      tone: "dark",
      iconCircle: "bg-white/10",
      iconColor: "text-white/50",
    },
    priceHint: "$240 every 3 months",
  },
  {
    key: "MENS_HEALTH_VITALITY",
    label: "Vitality",
    tagline: "Energy, focus and hormone optimisation",
    icon: Activity,
    gender: "male",
    dashboardRoute: "/dashboard/mens-health/vitality",
    quizRoute: "/dashboard/programs/mens_health_vitality",
    theme: {
      gradient: "from-[#cdd8c6] to-[#a8bb9e]",
      tone: "light",
      iconCircle: "bg-[#7e9a72]/30",
      iconColor: "text-[#4a6243]",
    },
    priceHint: "$240 every 3 months",
  },
  {
    key: "WOMENS_HEALTH_SEXUAL",
    label: "Sexual Health",
    tagline: "Confidential, judgement-free care",
    icon: HeartPulse,
    gender: "female",
    dashboardRoute: "/dashboard/womens-health/sexual-health",
    quizRoute: "/dashboard/programs/womens_health_sexual",
    theme: {
      gradient: "from-[#f8f4ec] to-[#f0e8d8]",
      tone: "light",
      iconCircle: "bg-[#c17a58]/20",
      iconColor: "text-[#c17a58]",
      badge: { label: "Private care", className: "bg-[#c17a58] text-white" },
    },
    priceHint: "$240 every 3 months",
  },
  {
    key: "WOMENS_HEALTH_VITALITY",
    label: "Vitality",
    tagline: "Hormone balance, energy and whole-body wellbeing",
    icon: Flower2,
    gender: "female",
    dashboardRoute: "/dashboard/womens-health/vitality",
    quizRoute: "/dashboard/programs/womens_health_vitality",
    theme: {
      gradient: "from-[#e6ebe3] to-[#cdd8c6]",
      tone: "light",
      iconCircle: "bg-[#7e9a72]/25",
      iconColor: "text-[#5c7a52]",
    },
    priceHint: "$240 every 3 months",
  },
];

export const ORGAN_CARE_CARD = {
  label: "Organ and Metabolic Care",
  titleAccent: "Metabolic Care",
  tagline: "Heart, liver, kidney, thyroid, hormones & metabolic health: one membership",
  priceHint: "Included with your membership",
  hubRoute: "/dashboard/organ-care",
  quizRoute: "/dashboard/organ-care/quiz",
  theme: {
    gradient: "from-[#cdd8c6] to-[#a8bb9e]",
    tone: "light" as CardTone,
    iconCircle: "bg-[#7e9a72]/30",
    iconColor: "text-[#4a6243]",
    badge: { label: "85+ biomarkers", className: "bg-[#4a6243] text-white" },
  },
  organs: [
    { label: "Liver", route: "/dashboard/liver-test", dot: "bg-green-500" },
    { label: "Heart", route: "/dashboard/heart-test", dot: "bg-red-400" },
    { label: "Kidney", route: "/dashboard/kidney-test", dot: "bg-sky-400" },
  ],
  /** Overlapping preview circles, matches public BentoHero biomarkers card (L · K · H). */
  organPreview: [
    { letter: "L", label: "Liver", dot: "bg-green-500" },
    { letter: "K", label: "Kidney", dot: "bg-sky-400" },
    { letter: "H", label: "Heart", dot: "bg-red-400" },
  ],
  organPreviewCaption: "Liver, Kidney, Heart & more",
} as const;

export const SUPPLEMENTS_CARD = {
  label: "Supplements & Vitamins",
  titleAccent: "Vitamins",
  tagline: "Clinician-curated nutrition to support your programs",
  route: "/dashboard/supplements",
  icon: Pill,
  theme: {
    gradient: "from-[#f8f4ec] to-[#f0e8d8]",
    tone: "light" as CardTone,
    iconCircle: "bg-[#c17a58]/20",
    iconColor: "text-[#c17a58]",
    badge: { label: "Member shop", className: "bg-[#5c7a52] text-white" },
  },
  priceHint: "Shop now",
} as const;

export const BIOMARKERS_HERO = {
  title: "Get My Biomarkers",
  titleAccent: "Biomarkers",
  tagline: "Your biological age and whole-body insights",
  route: "/dashboard",
  biomarkersRoute: "/dashboard/biomarkers/quiz",
  icon: Beaker,
  theme: {
    gradient: "from-[#4a6243] to-[#3d4f38]",
    tone: "dark" as CardTone,
    iconCircle: "bg-[#cdd8c6]/20",
    iconColor: "text-white/40",
    badge: { label: "Biological clock", className: "bg-[#1D9E75] text-white" },
  },
} as const;

export type ProgramCardFilterOptions = {
  subscriptionTier?: string | null;
  entitledProgramKeys?: ProgramKey[];
};

export function getProgramCardsForGender(
  gender?: string | null,
  options?: ProgramCardFilterOptions
): DashboardProgramCard[] {
  const rawGender = (gender || "").toLowerCase();
  const tier = (options?.subscriptionTier || "").toLowerCase();
  const entitled = new Set(options?.entitledProgramKeys ?? []);

  let preferredGender: "male" | "female" | null = null;
  if (rawGender === "female") preferredGender = "female";
  else if (rawGender === "male") preferredGender = "male";
  else if (tier.includes("womens")) preferredGender = "female";
  else if (tier.includes("mens") || tier.includes("hair")) preferredGender = "male";

  return PROGRAM_CARDS.filter((card) => {
    if (card.gender === "all") return true;
    if (entitled.has(card.key)) return true;
    if (preferredGender === "female" && card.gender === "female") return true;
    if (preferredGender === "male" && card.gender === "male") return true;
    // Prefer-not-to-say without tier: show both program families rather than defaulting to men's only.
    if (!preferredGender) return card.gender === "male" || card.gender === "female";
    return false;
  });
}
