export const AU_POPULATION_AGE_BANDS = [
  { id: "18-24", min: 18, max: 24, label: "18–24 years" },
  { id: "25-34", min: 25, max: 34, label: "25–34 years" },
  { id: "35-44", min: 35, max: 44, label: "35–44 years" },
  { id: "45-54", min: 45, max: 54, label: "45–54 years" },
  { id: "55-64", min: 55, max: 64, label: "55–64 years" },
  { id: "65-74", min: 65, max: 74, label: "65–74 years" },
  { id: "75+", min: 75, max: 120, label: "75 years and over" },
] as const;

export type AuAgeBandId = (typeof AU_POPULATION_AGE_BANDS)[number]["id"];
export type AuSex = "male" | "female";
export type AuPopulationCategory = "heart" | "liver" | "kidney";
export type AuStatQuality = "official" | "derived" | "estimated";

export type AuBandStats = {
  mean: number;
  p25: number;
  p75: number;
  /** ABS published % of this age/sex group beyond the clinical cut-off, if available. */
  absAbnormalPercent?: number;
  quality: AuStatQuality;
};

export type AuMarkerDefinition = {
  biomarkerId: string;
  name: string;
  unit: string;
  higherIsBetter: boolean;
  category: AuPopulationCategory;
  stats: Record<AuSex, Record<AuAgeBandId, AuBandStats>>;
};

export type AuPopulationSource = {
  name: string;
  url: string;
  surveyYears: string;
  lastReviewed: string;
  notes: string;
};

export type AuPopulationDataset = {
  version: number;
  sources: AuPopulationSource[];
  markers: AuMarkerDefinition[];
};
