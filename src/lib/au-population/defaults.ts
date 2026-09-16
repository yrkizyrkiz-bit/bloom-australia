import { bandFromAbnormalHigh, bandFromMean } from "./stats-math";
import type {
  AuAgeBandId,
  AuBandStats,
  AuMarkerDefinition,
  AuPopulationDataset,
  AuSex,
  AuStatQuality,
} from "./types";
import { AU_POPULATION_AGE_BANDS } from "./types";

const BAND_IDS = AU_POPULATION_AGE_BANDS.map((b) => b.id);

function fillBands(
  values: Record<AuAgeBandId, Omit<AuBandStats, "quality"> & { quality?: AuStatQuality }>,
  quality: AuStatQuality
): Record<AuAgeBandId, AuBandStats> {
  const out = {} as Record<AuAgeBandId, AuBandStats>;
  for (const id of BAND_IDS) {
    out[id] = { quality, ...values[id] };
  }
  return out;
}

function fromHighRates(
  rates: Record<AuAgeBandId, number>,
  threshold: number,
  sd: number,
  quality: AuStatQuality = "derived"
): Record<AuAgeBandId, AuBandStats> {
  const out = {} as Record<AuAgeBandId, AuBandStats>;
  for (const id of BAND_IDS) {
    out[id] = { quality, ...bandFromAbnormalHigh(threshold, rates[id], sd) };
  }
  return out;
}

function constantMean(
  mean: number,
  sd: number,
  quality: AuStatQuality,
  absAbnormalPercent?: number
): Record<AuAgeBandId, AuBandStats> {
  const band = bandFromMean(mean, sd);
  const out = {} as Record<AuAgeBandId, AuBandStats>;
  for (const id of BAND_IDS) {
    out[id] = { ...band, quality, absAbnormalPercent };
  }
  return out;
}

const TC_M: Record<AuAgeBandId, number> = {
  "18-24": 4.2,
  "25-34": 25.1,
  "35-44": 37.8,
  "45-54": 41.7,
  "55-64": 34.3,
  "65-74": 26.4,
  "75+": 12.8,
};
const TC_F: Record<AuAgeBandId, number> = {
  "18-24": 8.0,
  "25-34": 15.9,
  "35-44": 28.7,
  "45-54": 46.1,
  "55-64": 53.5,
  "65-74": 41.5,
  "75+": 26.4,
};

const LDL_ALL: Record<AuAgeBandId, number> = {
  "18-24": 11.4,
  "25-34": 21.6,
  "35-44": 28.4,
  "45-54": 41.0,
  "55-64": 36.0,
  "65-74": 28.4,
  "75+": 17.7,
};

/** ABS TG age groups mapped onto NHMS lipid age bands. */
const TG_ALL: Record<AuAgeBandId, number> = {
  "18-24": 8.9,
  "25-34": 11.8,
  "35-44": 14.6,
  "45-54": 16.4,
  "55-64": 18.6,
  "65-74": 16.0,
  "75+": 13.0,
};

const ALT_M: Record<AuAgeBandId, number> = {
  "18-24": 25.6,
  "25-34": 46.4,
  "35-44": 42.4,
  "45-54": 30.7,
  "55-64": 22.6,
  "65-74": 17.9,
  "75+": 9.7,
};
const ALT_F: Record<AuAgeBandId, number> = {
  "18-24": 10.6,
  "25-34": 17.9,
  "35-44": 18.6,
  "45-54": 23.5,
  "55-64": 34.3,
  "65-74": 22.9,
  "75+": 13.0,
};

const GGT_M: Record<AuAgeBandId, number> = {
  "18-24": 4.0,
  "25-34": 9.0,
  "35-44": 21.9,
  "45-54": 13.0,
  "55-64": 19.1,
  "65-74": 18.4,
  "75+": 18.7,
};
const GGT_F: Record<AuAgeBandId, number> = {
  "18-24": 3.2,
  "25-34": 8.1,
  "35-44": 11.9,
  "45-54": 13.0,
  "55-64": 29.6,
  "65-74": 19.9,
  "75+": 14.9,
};

const EGFR_LOW: Record<AuAgeBandId, number> = {
  "18-24": 0.4,
  "25-34": 0.4,
  "35-44": 0.4,
  "45-54": 0.6,
  "55-64": 4.8,
  "65-74": 12.5,
  "75+": 29.3,
};

const EGFR_MEAN: Record<AuAgeBandId, number> = {
  "18-24": 108,
  "25-34": 102,
  "35-44": 96,
  "45-54": 90,
  "55-64": 82,
  "65-74": 72,
  "75+": 62,
};

export const AU_POPULATION_DEFAULTS: AuPopulationDataset = {
  version: 1,
  sources: [
    {
      name: "ABS National Health Measures Survey (NHMS) 2022–24",
      url: "https://www.abs.gov.au/statistics/health/health-conditions-and-risks/national-health-measures-survey/latest-release",
      surveyYears: "2022–24",
      lastReviewed: "2026-09-15",
      notes:
        "Primary official source. Age- and sex-specific % beyond clinical cut-offs (lipids, ALT, GGT, eGFR). Published adult means used where stated (HDL, ALT, GGT, eGFR). Age-band means/p25/p75 for lipids are derived from those prevalence figures assuming a typical Australian SD — not published percentile tables.",
    },
  ],
  markers: [
    {
      biomarkerId: "total_cholesterol",
      name: "Total cholesterol",
      unit: "mmol/L",
      higherIsBetter: false,
      category: "heart",
      stats: {
        male: fromHighRates(TC_M, 5.5, 1.05),
        female: fromHighRates(TC_F, 5.5, 1.05),
      },
    },
    {
      biomarkerId: "ldl_cholesterol",
      name: "Bad cholesterol (LDL)",
      unit: "mmol/L",
      higherIsBetter: false,
      category: "heart",
      stats: {
        male: fromHighRates(LDL_ALL, 3.5, 0.9),
        female: fromHighRates(LDL_ALL, 3.5, 0.9),
      },
    },
    {
      biomarkerId: "hdl_cholesterol",
      name: "Good cholesterol (HDL)",
      unit: "mmol/L",
      higherIsBetter: true,
      category: "heart",
      stats: {
        male: constantMean(1.3, 0.32, "official", 11.0),
        female: constantMean(1.6, 0.38, "official", 18.7),
      },
    },
    {
      biomarkerId: "triglycerides",
      name: "Blood fats (triglycerides)",
      unit: "mmol/L",
      higherIsBetter: false,
      category: "heart",
      stats: {
        // Scale all-person TG rates to published male/female adult totals (18.3% vs 10.8%).
        male: fromHighRates(
          Object.fromEntries(
            BAND_IDS.map((id) => [id, round1((TG_ALL[id] * 18.3) / 14.5)])
          ) as Record<AuAgeBandId, number>,
          2.0,
          0.85
        ),
        female: fromHighRates(
          Object.fromEntries(
            BAND_IDS.map((id) => [id, round1((TG_ALL[id] * 10.8) / 14.5)])
          ) as Record<AuAgeBandId, number>,
          2.0,
          0.85
        ),
      },
    },
    {
      biomarkerId: "glucose",
      name: "Blood sugar (fasting)",
      unit: "mmol/L",
      higherIsBetter: false,
      category: "heart",
      stats: {
        male: fillBands(glucoseBands(5.5), "estimated"),
        female: fillBands(glucoseBands(5.2), "estimated"),
      },
    },
    {
      biomarkerId: "hba1c",
      name: "Average blood sugar (HbA1c)",
      unit: "%",
      higherIsBetter: false,
      category: "heart",
      stats: {
        male: fillBands(hba1cBands(), "estimated"),
        female: fillBands(hba1cBands(), "estimated"),
      },
    },
    {
      biomarkerId: "crp",
      name: "Inflammation marker (CRP)",
      unit: "mg/L",
      higherIsBetter: false,
      category: "heart",
      stats: {
        male: constantMean(1.9, 1.4, "estimated"),
        female: constantMean(2.2, 1.5, "estimated"),
      },
    },
    {
      biomarkerId: "homocysteine",
      name: "Homocysteine",
      unit: "µmol/L",
      higherIsBetter: false,
      category: "heart",
      stats: {
        male: constantMean(10.5, 3.2, "estimated"),
        female: constantMean(9.5, 3.0, "estimated"),
      },
    },
    {
      biomarkerId: "insulin",
      name: "Fasting insulin",
      unit: "mIU/L",
      higherIsBetter: false,
      category: "heart",
      stats: {
        male: constantMean(9.5, 5.0, "estimated"),
        female: constantMean(8.5, 4.5, "estimated"),
      },
    },
    {
      biomarkerId: "alt",
      name: "ALT",
      unit: "U/L",
      higherIsBetter: false,
      category: "liver",
      stats: {
        male: fromHighRates(ALT_M, 40, 18),
        female: fromHighRates(ALT_F, 30, 14),
      },
    },
    {
      biomarkerId: "ggt",
      name: "GGT",
      unit: "U/L",
      higherIsBetter: false,
      category: "liver",
      stats: {
        male: fromHighRates(GGT_M, 50, 22),
        female: fromHighRates(GGT_F, 35, 16),
      },
    },
    {
      biomarkerId: "ast",
      name: "AST",
      unit: "U/L",
      higherIsBetter: false,
      category: "liver",
      stats: {
        male: constantMean(28, 10, "estimated"),
        female: constantMean(24, 8, "estimated"),
      },
    },
    {
      biomarkerId: "egfr",
      name: "eGFR",
      unit: "mL/min/1.73m²",
      higherIsBetter: true,
      category: "kidney",
      stats: {
        male: eGFRBands(),
        female: eGFRBands(),
      },
    },
    {
      biomarkerId: "creatinine",
      name: "Creatinine",
      unit: "µmol/L",
      higherIsBetter: false,
      category: "kidney",
      stats: {
        male: fillBands(creatinineBands(88), "estimated"),
        female: fillBands(creatinineBands(70), "estimated"),
      },
    },
    {
      biomarkerId: "uacr",
      name: "UACR",
      unit: "mg/mmol",
      higherIsBetter: false,
      category: "kidney",
      stats: {
        male: constantMean(1.2, 1.1, "estimated"),
        female: constantMean(1.4, 1.2, "estimated"),
      },
    },
    {
      biomarkerId: "bun",
      name: "Urea",
      unit: "mmol/L",
      higherIsBetter: false,
      category: "kidney",
      stats: {
        male: constantMean(5.8, 1.4, "estimated"),
        female: constantMean(5.2, 1.3, "estimated"),
      },
    },
  ],
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function glucoseBands(adultMean: number): Record<AuAgeBandId, Omit<AuBandStats, "quality">> {
  const offsets: Record<AuAgeBandId, number> = {
    "18-24": -0.35,
    "25-34": -0.2,
    "35-44": -0.05,
    "45-54": 0.1,
    "55-64": 0.25,
    "65-74": 0.35,
    "75+": 0.4,
  };
  const out = {} as Record<AuAgeBandId, Omit<AuBandStats, "quality">>;
  for (const id of BAND_IDS) {
    out[id] = bandFromMean(adultMean + offsets[id], 0.55);
  }
  return out;
}

function hba1cBands(): Record<AuAgeBandId, Omit<AuBandStats, "quality">> {
  const means: Record<AuAgeBandId, number> = {
    "18-24": 5.1,
    "25-34": 5.15,
    "35-44": 5.25,
    "45-54": 5.35,
    "55-64": 5.45,
    "65-74": 5.55,
    "75+": 5.6,
  };
  const out = {} as Record<AuAgeBandId, Omit<AuBandStats, "quality">>;
  for (const id of BAND_IDS) {
    out[id] = bandFromMean(means[id], 0.35);
  }
  return out;
}

function eGFRBands(): Record<AuAgeBandId, AuBandStats> {
  const out = {} as Record<AuAgeBandId, AuBandStats>;
  for (const id of BAND_IDS) {
    out[id] = {
      quality: id === "18-24" || id === "75+" ? "derived" : "derived",
      absAbnormalPercent: EGFR_LOW[id],
      ...bandFromMean(EGFR_MEAN[id], 12, 0),
    };
  }
  return out;
}

function creatinineBands(adultMean: number): Record<AuAgeBandId, Omit<AuBandStats, "quality">> {
  const offsets: Record<AuAgeBandId, number> = {
    "18-24": -8,
    "25-34": -5,
    "35-44": -2,
    "45-54": 2,
    "55-64": 6,
    "65-74": 12,
    "75+": 18,
  };
  const out = {} as Record<AuAgeBandId, Omit<AuBandStats, "quality">>;
  for (const id of BAND_IDS) {
    out[id] = bandFromMean(adultMean + offsets[id], 14, 0);
  }
  return out;
}
