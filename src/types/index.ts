// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  role: "member" | "admin" | "MEMBER" | "ADMIN" | "CARE_PARTNER" | "DOCTOR";
  createdAt: string;
  subscriptionStatus: "active" | "inactive" | "pending";
  avatarUrl?: string;
}

// Biomarker types
export type BiomarkerStatus = "optimal" | "normal" | "out_of_range" | "critical";
export type BiomarkerCategory =
  | "heart"
  | "metabolic"
  | "hormones"
  | "thyroid"
  | "liver"
  | "kidney"
  | "blood"
  | "vitamins"
  | "minerals"
  | "inflammation"
  | "immunity";

export interface BiomarkerRange {
  low: number;
  optimal_low: number;
  optimal_high: number;
  high: number;
  unit: string;
}

export interface BiomarkerResult {
  id: string;
  biomarkerId: string;
  value: number;
  status: BiomarkerStatus;
  testedAt: string;
  // Optional fields from API
  userId?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  labReportId?: string;
  notes?: string;
  unit?: string;
  previousValue?: number;
  trend?: "up" | "down" | "stable";
}

export interface BiomarkerDefinition {
  id: string;
  name: string;
  shortName: string;
  category: BiomarkerCategory;
  description: string;
  whyItMatters: string;
  ranges: {
    male: BiomarkerRange;
    female: BiomarkerRange;
  };
  improvementTips: string[];
  relatedBiomarkers: string[];
}

export interface BiomarkerWithResult extends BiomarkerDefinition {
  result?: BiomarkerResult;
  history: BiomarkerResult[];
}

// Health Score
export interface HealthScore {
  overall: number;
  biologicalAge: number;
  chronologicalAge: number;
  categories: {
    category: BiomarkerCategory;
    score: number;
    optimal: number;
    normal: number;
    outOfRange: number;
  }[];
  lastUpdated: string;
}

// Lab Report
export interface LabReport {
  id: string;
  userId: string;
  fileName: string;
  uploadedAt: string;
  uploadedBy: string;
  status: "pending" | "processed" | "error";
  biomarkerCount: number;
}

// Admin types
export interface AdminStats {
  totalMembers: number;
  activeMembers: number;
  pendingResults: number;
  recentUploads: number;
}

// Health Goals
export interface HealthGoal {
  id: string;
  userId: string;
  biomarkerId: string;
  targetValue: number;
  currentValue: number;
  startValue: number;
  startDate: string;
  targetDate: string;
  status: "in_progress" | "achieved" | "missed" | "paused";
  notes?: string;
  createdAt: string;
}

// Reminders
export type ReminderType = "test" | "supplement" | "appointment" | "medication" | "custom";
export type ReminderFrequency = "once" | "daily" | "weekly" | "monthly";

export interface Reminder {
  id: string;
  userId: string;
  type: ReminderType;
  title: string;
  description?: string;
  dueDate: string;
  frequency: ReminderFrequency;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
}

// AI Report Insights
export interface AIInsight {
  id: string;
  type: "correlation" | "trend" | "recommendation" | "warning" | "achievement";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  relatedBiomarkers: string[];
  actionItems?: string[];
  projectedImprovement?: {
    biomarkerId: string;
    currentValue: number;
    projectedValue: number;
    timeframe: string;
  };
}

export interface PersonalizedReport {
  userId: string;
  generatedAt: string;
  summary: string;
  keyFindings: AIInsight[];
  correlations: AIInsight[];
  recommendations: AIInsight[];
  achievements: AIInsight[];
  projectedImprovements: AIInsight[];
  nextSteps: string[];
  riskFactors: {
    factor: string;
    severity: "low" | "medium" | "high";
    relatedBiomarkers: string[];
    mitigation: string;
  }[];
}
