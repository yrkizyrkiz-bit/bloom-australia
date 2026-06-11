import crypto from "crypto";
import prisma from "@/lib/prisma";
import { getDataDate } from "@/lib/ai-report-cache";

export const HEART_BIOMARKER_IDS = [
  "total_cholesterol",
  "ldl_cholesterol",
  "hdl_cholesterol",
  "triglycerides",
  "non_hdl_cholesterol",
  "vldl",
  "apob",
  "lpa",
  "crp",
  "homocysteine",
  "fibrinogen",
  "glucose",
  "hba1c",
  "insulin",
  "sodium",
  "potassium",
  "magnesium",
  "hemoglobin",
  "hematocrit",
  "rbc",
] as const;

export type AscvdSmokingStatus = "NEVER" | "FORMER" | "CURRENT";
export type AscvdRace = "WHITE" | "AFRICAN_AMERICAN" | "ASIAN" | "HISPANIC" | "OTHER";

export interface AscvdProfileInputs {
  systolicBP: number | null;
  diastolicBP: number | null;
  onBPMedication: boolean;
  smokingStatus: AscvdSmokingStatus;
  race: AscvdRace;
  familyHistoryCVD: boolean;
}

export interface AscvdLabInputs {
  age: number | null;
  sex: "male" | "female";
  sexLabel: string;
  totalCholesterol: number | null;
  totalCholesterolMgDl: number | null;
  hdlCholesterol: number | null;
  hdlCholesterolMgDl: number | null;
  diabetes: boolean;
  diabetesDetail: string | null;
  hasCholesterolData: boolean;
  canCalculateAscvd: boolean;
  ascvdNote: string | null;
  dataDate: string | null;
  hasHeartBiomarkers: boolean;
}

export interface AscvdInputsPayload {
  labInputs: AscvdLabInputs;
  profile: AscvdProfileInputs;
  hasExistingReport: boolean;
  biomarkerHash: string;
  analysisHash: string;
  missingForFirstRun: string[];
  readyForFirstRun: boolean;
}

export function createBiomarkerHash(
  biomarkers: { id: string; value: number; testedAt: string }[]
): string {
  const sortedData = biomarkers
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((b) => `${b.id}:${b.value}:${b.testedAt}`)
    .join("|");
  return crypto.createHash("md5").update(sortedData).digest("hex");
}

export function buildProfileKey(profile: AscvdProfileInputs): string {
  return JSON.stringify({
    systolicBP: profile.systolicBP ?? null,
    diastolicBP: profile.diastolicBP ?? null,
    onBPMedication: profile.onBPMedication ?? null,
    smokingStatus: profile.smokingStatus ?? null,
    race: profile.race ?? null,
    familyHistoryCVD: profile.familyHistoryCVD ?? null,
  });
}

export function buildHeartAnalysisHash(
  biomarkerHash: string,
  profile: AscvdProfileInputs
): string {
  return crypto
    .createHash("md5")
    .update(`${biomarkerHash}|${buildProfileKey(profile)}`)
    .digest("hex");
}

export function defaultAscvdProfile(): AscvdProfileInputs {
  return {
    systolicBP: null,
    diastolicBP: null,
    onBPMedication: false,
    smokingStatus: "NEVER",
    race: "OTHER",
    familyHistoryCVD: false,
  };
}

export function profileFromDb(
  profile: {
    systolicBP: number | null;
    diastolicBP: number | null;
    onBPMedication: boolean;
    smokingStatus: string;
    race: string;
    familyHistoryCVD: boolean;
  } | null
): AscvdProfileInputs {
  if (!profile) return defaultAscvdProfile();

  return {
    systolicBP: profile.systolicBP,
    diastolicBP: profile.diastolicBP,
    onBPMedication: profile.onBPMedication,
    smokingStatus: (profile.smokingStatus as AscvdSmokingStatus) || "NEVER",
    race: (profile.race as AscvdRace) || "OTHER",
    familyHistoryCVD: profile.familyHistoryCVD,
  };
}

function calculateAge(dateOfBirth: Date | null): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export async function gatherAscvdInputsForUser(userId: string): Promise<AscvdInputsPayload> {
  const results = await prisma.biomarkerResult.findMany({
    where: {
      userId,
      biomarkerId: { in: [...HEART_BIOMARKER_IDS] },
    },
    orderBy: { testedAt: "desc" },
    include: { biomarker: true },
  });

  const latestByBiomarker = new Map<string, (typeof results)[0]>();
  for (const result of results) {
    if (!latestByBiomarker.has(result.biomarkerId)) {
      latestByBiomarker.set(result.biomarkerId, result);
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { gender: true, dateOfBirth: true },
  });

  const sex = user?.gender?.toUpperCase() === "FEMALE" ? "female" : "male";
  const age = calculateAge(user?.dateOfBirth ?? null);

  const biomarkerData = Array.from(latestByBiomarker.values()).map((r) => ({
    id: r.biomarkerId,
    value: r.value,
    testedAt: r.testedAt.toISOString(),
  }));

  const biomarkerMap = new Map(biomarkerData.map((b) => [b.id, b.value]));
  const totalCholesterol = biomarkerMap.get("total_cholesterol") ?? null;
  const hdlCholesterol = biomarkerMap.get("hdl_cholesterol") ?? null;
  const hba1c = biomarkerMap.get("hba1c");
  const glucose = biomarkerMap.get("glucose");

  let diabetes = false;
  let diabetesDetail: string | null = null;
  if (hba1c !== undefined && hba1c >= 6.5) {
    diabetes = true;
    diabetesDetail = `HbA1c ${hba1c}%`;
  } else if (glucose !== undefined && glucose >= 7.0) {
    diabetes = true;
    diabetesDetail = `Glucose ${glucose} mmol/L`;
  }

  const hasCholesterolData = totalCholesterol !== null && hdlCholesterol !== null;
  const canCalculateAscvd =
    hasCholesterolData && age !== null && age >= 40 && age <= 79;

  let ascvdNote: string | null = null;
  if (!hasCholesterolData) {
    ascvdNote = "Upload total and HDL cholesterol to enable the ASCVD calculator.";
  } else if (age === null) {
    ascvdNote = "Add your date of birth to your profile to enable the ASCVD calculator.";
  } else if (age < 40 || age > 79) {
    ascvdNote = "The ASCVD calculator is validated for ages 40–79.";
  }

  const labInputs: AscvdLabInputs = {
    age,
    sex,
    sexLabel: sex === "female" ? "Female" : "Male",
    totalCholesterol,
    totalCholesterolMgDl: totalCholesterol !== null ? Math.round(totalCholesterol * 38.67) : null,
    hdlCholesterol,
    hdlCholesterolMgDl: hdlCholesterol !== null ? Math.round(hdlCholesterol * 38.67) : null,
    diabetes,
    diabetesDetail,
    hasCholesterolData,
    canCalculateAscvd,
    ascvdNote,
    dataDate: getDataDate(biomarkerData.map((b) => b.testedAt)),
    hasHeartBiomarkers: biomarkerData.length > 0,
  };

  const healthProfile = await prisma.healthProfile.findUnique({
    where: { userId },
  });
  const profile = profileFromDb(healthProfile);

  const biomarkerHash = createBiomarkerHash(biomarkerData);
  const analysisHash = buildHeartAnalysisHash(biomarkerHash, profile);

  const [cachedReport, historyCount] = await Promise.all([
    prisma.aIAnalysisCache.findUnique({
      where: {
        userId_analysisType: {
          userId,
          analysisType: "heart",
        },
      },
    }),
    prisma.aIAnalysisHistory.count({
      where: { userId, analysisType: "heart" },
    }),
  ]);

  const hasExistingReport = Boolean(cachedReport) || historyCount > 0;

  const missingForFirstRun: string[] = [];
  if (!profile.systolicBP) missingForFirstRun.push("systolic blood pressure");
  if (!profile.diastolicBP) missingForFirstRun.push("diastolic blood pressure");
  if (!labInputs.hasHeartBiomarkers) missingForFirstRun.push("heart blood test results");

  return {
    labInputs,
    profile,
    hasExistingReport,
    biomarkerHash,
    analysisHash,
    missingForFirstRun,
    readyForFirstRun: missingForFirstRun.length === 0,
  };
}

export function profilesAffectHeartAnalysis(
  previous: AscvdProfileInputs,
  next: AscvdProfileInputs
): boolean {
  return buildProfileKey(previous) !== buildProfileKey(next);
}
