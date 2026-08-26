"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft, User, Mail, Phone, Calendar, MapPin, Edit, Save, X, Loader2,
  Activity, Heart, Droplets, Flame, Scale, FileText, CreditCard, Clock,
  CheckCircle, AlertCircle, TrendingUp, TrendingDown, Plus, Zap, Shield, Sparkles, FlaskConical,
  ClipboardList, AlertTriangle, Target, Pill, Brain, Utensils, ExternalLink,
  Receipt, RefreshCcw, DollarSign, CalendarClock, Package, Download, KeyRound, Ban
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  MEMBER_STATUS_BADGE_STYLES,
  formatMemberStatus,
  type PortalMemberStatus,
} from "@/lib/member-status";
import { RescheduleBookingDialog } from "@/components/admin/RescheduleBookingDialog";
import { CancelBookingDialog } from "@/components/admin/CancelBookingDialog";
import { BookingChangeHistory } from "@/components/admin/BookingChangeHistory";
import {
  MemberQuizAssessmentTabs,
  type PortalQuizSubmissionView,
} from "@/components/admin/MemberProgramQuizTabs";
import {
  getBiomarkerStatusBadgeClass,
  getBiomarkerStatusDotClass,
  getBiomarkerStatusLabel,
  getBiomarkerStatusRowClass,
} from "@/lib/biomarker-status";
import { biomarkerDefinitions } from "@/data/biomarkers";
import {
  calculateAllHealthTestScores,
  calculateStatusBasedScore,
  getProgressColor,
  getScoreColor,
  type BiomarkerResultInput,
} from "@/lib/healthTestScoring";
import { isProspectiveEnrollment as checkProspectiveEnrollment } from "@/lib/funnel/member-enrollment-phase";

interface CustomerData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string;
  addressLine1: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  subscriptionStatus: string;
  subscriptionTier: string | null;
  memberStatus?: PortalMemberStatus | null;
  journeyStatus: string | null;
  createdAt: string;
}

interface AssessmentData {
  weightLossGoal: string;
  currentWeight: string;
  targetWeight: string;
  height: string;
  gender: string;
  dateOfBirth: string;
  ethnicity: string;
  metabolicConditions: string[];
  digestiveConditions: string[];
  cardiovascularConditions: string[];
  mentalHealthConditions: string[];
  seriousConditions: string[];
  currentMedications: string[];
  motivations: string[];
  otherGoals: string[];
  howHeard: string;
  consultationDate: string;
  consultationTime: string;
  submittedAt: string;
}

const JOURNEY_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  LEAD: { label: "Lead", color: "bg-gray-100 text-gray-700" },
  CONSULTATION_PAID: { label: "Paid", color: "bg-blue-100 text-blue-700" },
  PRE_TRIAGE_PENDING: { label: "Pre-Triage", color: "bg-yellow-100 text-yellow-700" },
  AWAITING_DOCTOR_CALL: { label: "Awaiting Call", color: "bg-purple-100 text-purple-700" },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-700" },
  ACTIVE: { label: "Active", color: "bg-emerald-100 text-emerald-700" },
  PAUSED: { label: "Paused", color: "bg-orange-100 text-orange-700" },
  CANCELLED: { label: "Cancelled", color: "bg-red-100 text-red-700" },
};

const HEALTH_CATEGORIES = [
  { key: "metabolic", label: "Metabolic", icon: Flame, color: "text-orange-500" },
  { key: "cardiovascular", label: "Heart", icon: Heart, color: "text-red-500" },
  { key: "liver", label: "Liver", icon: Activity, color: "text-green-500" },
  { key: "kidney", label: "Kidney", icon: Droplets, color: "text-blue-500" },
  { key: "thyroid", label: "Thyroid", icon: Zap, color: "text-purple-500" },
  { key: "inflammation", label: "Inflammation", icon: Shield, color: "text-amber-500" },
];

/** Maps sidebar category keys to health test scoring ids (member dashboard). */
const HOLISTIC_TEST_ID_BY_CATEGORY: Record<string, string> = {
  metabolic: "metabolic",
  cardiovascular: "heart",
  liver: "liver",
  kidney: "kidney",
  thyroid: "thyroid",
};

// Biomarker panels with conditions they're relevant for
const BIOMARKER_PANELS = [
  {
    id: "metabolic",
    name: "Metabolic Health Panel",
    description: "HbA1c, Fasting Glucose, Insulin, HOMA-IR",
    icon: Flame,
    color: "text-orange-500",
    relevantConditions: ["insulin resistance", "type 2 diabetes", "prediabetes", "high blood sugar", "pcos"],
    priority: "high",
  },
  {
    id: "thyroid",
    name: "Thyroid Function Panel",
    description: "TSH, Free T4, Free T3, Thyroid Antibodies",
    icon: Zap,
    color: "text-purple-500",
    relevantConditions: ["thyroid", "hypothyroidism", "hyperthyroidism"],
    priority: "high",
  },
  {
    id: "liver",
    name: "Liver Health Panel",
    description: "ALT, AST, GGT, Albumin, Bilirubin",
    icon: Activity,
    color: "text-green-500",
    relevantConditions: ["fatty liver", "liver", "gallstones", "gallbladder"],
    priority: "medium",
  },
  {
    id: "cardiovascular",
    name: "Cardiovascular Panel",
    description: "Total Cholesterol, LDL, HDL, Triglycerides",
    icon: Heart,
    color: "text-red-500",
    relevantConditions: ["high blood pressure", "high cholesterol", "high triglycerides", "heart disease", "angina", "heart attack", "heart failure", "arrhythmia", "stroke"],
    priority: "high",
  },
  {
    id: "inflammation",
    name: "Inflammation Markers",
    description: "CRP, ESR, Ferritin, Homocysteine",
    icon: Shield,
    color: "text-amber-500",
    relevantConditions: ["inflammation", "chronic", "crohn", "colitis"],
    priority: "medium",
  },
  {
    id: "hormones",
    name: "Hormone Balance Panel",
    description: "Testosterone, Estrogen, Cortisol, DHEA",
    icon: Brain,
    color: "text-pink-500",
    relevantConditions: ["pcos", "hormonal", "hormone"],
    priority: "medium",
  },
];

// Helper function to get recommended biomarker panels based on conditions
function getRecommendedPanels(assessment: AssessmentData | null): typeof BIOMARKER_PANELS {
  if (!assessment) return [];

  const allConditions = [
    ...(assessment.metabolicConditions || []),
    ...(assessment.digestiveConditions || []),
    ...(assessment.cardiovascularConditions || []),
    ...(assessment.mentalHealthConditions || []),
    ...(assessment.seriousConditions || []),
  ]
    .filter(c => c && !c.toLowerCase().includes("none"))
    .map(c => c.toLowerCase());

  // Also check medications for conditions
  const medications = (assessment.currentMedications || [])
    .filter(m => m && !m.toLowerCase().includes("none"))
    .map(m => m.toLowerCase());

  // Calculate BMI if available
  const height = parseFloat(assessment.height) || 0;
  const weight = parseFloat(assessment.currentWeight) || 0;
  const bmi = height > 0 ? weight / Math.pow(height / 100, 2) : 0;

  const recommendations: typeof BIOMARKER_PANELS = [];

  for (const panel of BIOMARKER_PANELS) {
    const matchesCondition = panel.relevantConditions.some(rc =>
      allConditions.some(c => c.includes(rc) || rc.includes(c.split(' ')[0]))
    );

    const matchesMedication = panel.relevantConditions.some(rc =>
      medications.some(m => m.includes(rc))
    );

    // Always recommend metabolic panel for weight management with elevated BMI
    const isMetabolicDefault = panel.id === "metabolic" && bmi >= 27;

    if (matchesCondition || matchesMedication || isMetabolicDefault) {
      recommendations.push(panel);
    }
  }

  // Sort by priority
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) -
           (priorityOrder[b.priority as keyof typeof priorityOrder] || 2);
  });
}

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [assessmentData, setAssessmentData] = useState<Record<string, unknown> | null>(null);
  const [portalQuizAllSubmissions, setPortalQuizAllSubmissions] = useState<
    PortalQuizSubmissionView[]
  >([]);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(true);
  const [isLoadingAssessment, setIsLoadingAssessment] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<CustomerData>>({});

  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteCategory, setNewNoteCategory] = useState("GENERAL");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Password reset state
  const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [sendPasswordEmail, setSendPasswordEmail] = useState(true);
  const [customPassword, setCustomPassword] = useState("");
  const [billingUpgradeOfferLoading, setBillingUpgradeOfferLoading] = useState(false);
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [changePlanLoading, setChangePlanLoading] = useState(false);
  const [selectedCadenceId, setSelectedCadenceId] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);
  const [tierUpgradeLoading, setTierUpgradeLoading] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelProgramSlug, setCancelProgramSlug] = useState("");
  const [cancelProgramLabel, setCancelProgramLabel] = useState("");
  const [cancelEffective, setCancelEffective] = useState<"period_end" | "immediate">("period_end");
  const [cancelReason, setCancelReason] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<Record<string, unknown> | null>(null);
  const [cancelBooking, setCancelBooking] = useState<Record<string, unknown> | null>(null);
  const [expandedLabDates, setExpandedLabDates] = useState<string[]>([]);

  const fetchCustomer = useCallback(async () => {
    setIsLoadingCustomer(true);
    try {
      const customerRes = await fetch(`/api/users/${customerId}`);
      if (customerRes.ok) {
        const data = await customerRes.json();
        setCustomer(data.user);
        setEditData(data.user);
      } else {
        setCustomer(null);
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
      toast.error("Failed to load customer profile");
      setCustomer(null);
    } finally {
      setIsLoadingCustomer(false);
    }
  }, [customerId]);

  const fetchAssessmentData = useCallback(async () => {
    setIsLoadingAssessment(true);
    try {
      const assessmentRes = await fetch(`/api/admin/customer-assessment?userId=${customerId}`);
      const assessmentJson = await assessmentRes.json().catch(() => ({}));

      if (assessmentRes.ok) {
        setAssessmentData(assessmentJson);
        if (Array.isArray(assessmentJson.portalQuizAllSubmissions)) {
          setPortalQuizAllSubmissions(
            assessmentJson.portalQuizAllSubmissions as PortalQuizSubmissionView[]
          );
        } else if (Array.isArray(assessmentJson.portalQuizzes)) {
          setPortalQuizAllSubmissions(assessmentJson.portalQuizzes as PortalQuizSubmissionView[]);
        }
      } else {
        console.error("Assessment fetch failed:", assessmentJson);
        toast.error(
          assessmentJson.error ||
            "Some billing and assessment details could not be loaded. Try refreshing the page."
        );
      }
    } catch (error) {
      console.error("Error fetching assessment data:", error);
      toast.error("Failed to load billing and assessment data");
    } finally {
      setIsLoadingAssessment(false);
    }
  }, [customerId]);

  const fetchData = useCallback(async () => {
    await fetchCustomer();
    void fetchAssessmentData();
  }, [fetchCustomer, fetchAssessmentData]);

  useEffect(() => {
    if (customerId) fetchData();
  }, [customerId, fetchData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Send only editable profile fields; normalise DOB to YYYY-MM-DD
      const payload = {
        email: editData.email,
        firstName: editData.firstName,
        lastName: editData.lastName,
        phone: editData.phone,
        gender: editData.gender,
        dateOfBirth: editData.dateOfBirth
          ? String(editData.dateOfBirth).split("T")[0]
          : null,
        addressLine1: editData.addressLine1,
        addressLine2: editData.addressLine2,
        suburb: editData.suburb,
        state: editData.state,
        postcode: editData.postcode,
        country: editData.country,
      };
      const res = await fetch(`/api/users/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setCustomer(data.user);
        setEditData(data.user);
        setIsEditing(false);
        toast.success("Customer updated");
      } else {
        toast.error(data.error || "Failed to update customer");
      }
    } catch (error) {
      toast.error("Failed to update");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteTitle || !newNoteContent) return;
    setIsAddingNote(true);
    try {
      const res = await fetch("/api/admin/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: customerId,
          title: newNoteTitle,
          content: newNoteContent,
          category: newNoteCategory,
        }),
      });
      if (res.ok) {
        toast.success("Note added");
        setNewNoteTitle("");
        setNewNoteContent("");
        fetchData();
      }
    } catch (error) {
      toast.error("Failed to add note");
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleResetPassword = async () => {
    setIsResettingPassword(true);
    setGeneratedPassword(null);
    try {
      const res = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: customerId,
          newPassword: customPassword || undefined,
          sendEmail: sendPasswordEmail,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message || "Password reset successfully");
        if (data.temporaryPassword) {
          setGeneratedPassword(data.temporaryPassword);
        } else {
          // If email was sent, close the dialog
          setShowResetPasswordDialog(false);
          setCustomPassword("");
        }
        fetchData(); // Refresh to show the new note about password reset
      } else {
        toast.error(data.error || "Failed to reset password");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error("Failed to reset password");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const biomarkers = useMemo(
    () => (assessmentData?.biomarkers as Array<Record<string, unknown>>) || [],
    [assessmentData?.biomarkers]
  );

  const biomarkersByTestDate = useMemo(() => {
    const groups = new Map<string, Array<Record<string, unknown>>>();
    for (const result of biomarkers) {
      const testedAt = result.testedAt as string | undefined;
      let dateKey = "unknown";
      if (testedAt) {
        const parsed = new Date(testedAt);
        if (!Number.isNaN(parsed.getTime())) {
          dateKey = parsed.toLocaleDateString("en-CA");
        }
      }
      const existing = groups.get(dateKey) ?? [];
      existing.push(result);
      groups.set(dateKey, existing);
    }
    return Array.from(groups.entries()).sort((a, b) => {
      if (a[0] === "unknown") return 1;
      if (b[0] === "unknown") return -1;
      return b[0].localeCompare(a[0]);
    });
  }, [biomarkers]);

  const labDateKeys = useMemo(
    () => biomarkersByTestDate.map(([dateKey]) => dateKey),
    [biomarkersByTestDate]
  );

  useEffect(() => {
    if (labDateKeys.length === 0) return;
    setExpandedLabDates((prev) => {
      const valid = prev.filter((key) => labDateKeys.includes(key));
      if (valid.length > 0) return valid;
      return [labDateKeys[0]];
    });
  }, [labDateKeys]);

  const memberGender = (customer?.gender === "FEMALE" ? "female" : "male") as "male" | "female";

  /** Latest value per biomarker, same rule as member dashboard (most recent testedAt). */
  const latestBiomarkerResults = useMemo((): BiomarkerResultInput[] => {
    const latest = new Map<string, BiomarkerResultInput>();
    for (const r of biomarkers) {
      const biomarkerId = r.biomarkerId as string | undefined;
      if (!biomarkerId || latest.has(biomarkerId)) continue;
      const value = typeof r.value === "number" ? r.value : Number(r.value);
      if (!Number.isFinite(value)) continue;
      latest.set(biomarkerId, {
        id: (r.id as string) ?? biomarkerId,
        biomarkerId,
        value,
        status: String(r.status ?? "NORMAL").toLowerCase(),
        testedAt: (r.testedAt as string) ?? new Date().toISOString(),
      });
    }
    return Array.from(latest.values());
  }, [biomarkers]);

  const holisticInsights = useMemo(() => {
    if (latestBiomarkerResults.length === 0) return null;

    const healthScores = calculateAllHealthTestScores(
      memberGender,
      latestBiomarkerResults
    );

    const inflammationIds = biomarkerDefinitions
      .filter((b) => b.category === "inflammation")
      .map((b) => b.id);
    const inflammation = calculateStatusBasedScore(
      inflammationIds,
      memberGender,
      latestBiomarkerResults
    );

    const byKey: Record<
      string,
      {
        score: number;
        hasData: boolean;
        optimal: number;
        normal: number;
        outOfRange: number;
      }
    > = {};

    for (const cat of HEALTH_CATEGORIES) {
      if (cat.key === "inflammation") {
        byKey.inflammation = {
          score: inflammation.score,
          hasData: inflammation.hasData,
          optimal: inflammation.optimal,
          normal: inflammation.normal,
          outOfRange: inflammation.outOfRange,
        };
        continue;
      }

      const testId = HOLISTIC_TEST_ID_BY_CATEGORY[cat.key];
      const match = healthScores.categories.find((c) => c.id === testId);
      byKey[cat.key] = match
        ? {
            score: match.score,
            hasData: match.hasData,
            optimal: match.optimal,
            normal: match.normal,
            outOfRange: match.outOfRange,
          }
        : { score: 0, hasData: false, optimal: 0, normal: 0, outOfRange: 0 };
    }

    return {
      overall: healthScores.overall,
      lastUpdated: healthScores.lastUpdated,
      byKey,
    };
  }, [latestBiomarkerResults, memberGender]);

  if (isLoadingCustomer) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Customer not found</h2>
        <Link href="/admin/crm/customers"><Button variant="outline">Back</Button></Link>
      </div>
    );
  }

  const notes = (assessmentData?.notes as Array<Record<string, unknown>>) || [];
  const weightLogs = (assessmentData?.weightLogs as Array<Record<string, unknown>>) || [];
  const invoices = (assessmentData?.invoices as Array<Record<string, unknown>>) || [];
  const bookings = (assessmentData?.bookings as Array<Record<string, unknown>>) || [];
  const prescriptions = (assessmentData?.prescriptions as Array<Record<string, unknown>>) || [];
  const subscription = assessmentData?.subscription as {
    program?: string;
    programLabel?: string;
    id: string | null;
    planName: string;
    amount: number | null;
    currency: string;
    billingCycle: string;
    status: string;
    startDate: string | null;
    currentPeriodEnd: string | null;
    cancelledAt: string | null;
    stripeCustomerId: string | null;
    stripeSubscriptionId: string | null;
    selectedPlan?: string | null;
    firstMonth?: { status: string; amountAud: number | null; paidAt: string | null };
    recurring?: {
      status: string;
      label: string;
      amountAud: number | null;
      billingLabel: string | null;
      paidTill: string | null;
      nextBillingDate: string | null;
    };
    availableCadences?: Array<{
      billingPriceId: string;
      label: string;
      amountAud: number;
      billingInterval: string;
    }>;
    history?: Array<{
      id: string;
      changeType: string;
      fromLabel: string | null;
      toLabel: string;
      effectiveAt: string;
    }>;
  } | null;

  type ProgramSubscriptionView = NonNullable<typeof subscription> & {
    billingModel?: "program_first_month" | "annual_subscription";
    program?: string;
    programLabel?: string;
  };

  const openCancelDialog = (programSub: ProgramSubscriptionView) => {
    setCancelProgramSlug(programSub.program || subscription?.program || "");
    setCancelProgramLabel(
      programSub.programLabel || programSub.planName || "Membership"
    );
    setCancelEffective("period_end");
    setCancelReason("");
    setCancelDialogOpen(true);
  };

  const isProgramCancellable = (programSub: ProgramSubscriptionView) =>
    programSub.status !== "CANCELLED" &&
    programSub.recurring?.status !== "cancelled" &&
    programSub.program !== "other";

  const programSubscriptions: ProgramSubscriptionView[] =
    (assessmentData?.programSubscriptions as ProgramSubscriptionView[] | undefined)?.length
      ? (assessmentData!.programSubscriptions as ProgramSubscriptionView[])
      : subscription
        ? [subscription]
        : [];

  const assessment = assessmentData?.assessment as AssessmentData | null;
  const rawSurveyData =
    (assessmentData?.rawSurveyData as Record<string, unknown> | null) || null;
  const isHairLossQuestionnaire =
    rawSurveyData?.programType === "HAIR_LOSS" ||
    customer.subscriptionTier === "hair_loss" ||
    assessmentData?.program === "HAIR_LOSS";
  const billingSummary = assessmentData?.billingSummary as {
    planLabel?: string;
    selectedPlan?: string | null;
    firstMonth?: { status: string; amountAud: number | null; paidAt: string | null };
    recurring?: { label: string; amountAud: number | null; billingLabel: string | null };
  } | null;

  const formatPlanLabel = (tier: string | null | undefined) => {
    if (!tier) return "—";
    const lower = tier.toLowerCase();
    if (lower === "membership" || lower === "sanative_membership") {
      return "Sanative Membership";
    }
    if (lower.includes("biomarker")) return "Biomarkers";
    if (lower.includes("precision")) return "Sanative Precision";
    if (lower.includes("core")) return "Sanative Core";
    if (lower.includes("weight")) return "Weight Management";
    if (lower.includes("mens")) return "Men's Health";
    if (lower.includes("womens")) return "Women's Health";
    if (lower.includes("hair")) return "Hair Loss";
    return tier.replace(/_/g, " ");
  };

  const isProspectiveEnrollment =
    (assessmentData?.isProspectiveEnrollment as boolean | undefined) ??
    checkProspectiveEnrollment({
      memberStatus: customer.memberStatus,
      journeyStatus: customer.journeyStatus,
    });

  const prospectiveProgramLabel =
    formatPlanLabel(customer.subscriptionTier) !== "—"
      ? formatPlanLabel(customer.subscriptionTier)
      : typeof assessmentData?.program === "string"
        ? formatPlanLabel(assessmentData.program)
        : "Health program";

  const displayPlanName =
    subscription?.planName ||
    billingSummary?.planLabel ||
    formatPlanLabel(customer.subscriptionTier);

  const recommendedPanels = getRecommendedPanels(assessment);
  const statusInfo = JOURNEY_STATUS_LABELS[customer.journeyStatus || "LEAD"] || { label: customer.journeyStatus, color: "bg-gray-100" };

  // Calculate BMI if available
  const height = parseFloat(assessment?.height || "0");
  const weight = parseFloat(assessment?.currentWeight || "0");
  const quizAssessmentProgramCount = (() => {
    const keys = new Set<string>();
    if (assessment) keys.add("WEIGHT_MANAGEMENT");
    for (const sub of portalQuizAllSubmissions) keys.add(sub.programKey);
    if (isHairLossQuestionnaire && rawSurveyData && !keys.has("HAIR_LOSS")) {
      keys.add("HAIR_LOSS");
    }
    return keys.size;
  })();
  const bmi = height > 0 ? (weight / Math.pow(height / 100, 2)).toFixed(1) : null;

  return (
    <div className="space-y-6">
      {isLoadingAssessment && (
        <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading billing, assessment, and program details…
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/crm/customers">
            <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
          </Link>
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {customer.firstName?.[0] ?? "?"}{customer.lastName?.[0] ?? ""}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{customer.firstName} {customer.lastName}</h1>
            <div className="flex gap-2 mt-1">
              <Badge
                variant="outline"
                className={MEMBER_STATUS_BADGE_STYLES[customer.memberStatus || "POTENTIAL_MEMBER"]}
              >
                {formatMemberStatus(customer.memberStatus || "POTENTIAL_MEMBER")}
              </Badge>
              <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
              {customer.subscriptionTier && (
                <Badge variant="outline">{formatPlanLabel(customer.subscriptionTier)}</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}><X className="w-4 h-4 mr-2" />Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}Save
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={() => setIsEditing(true)}><Edit className="w-4 h-4 mr-2" />Edit</Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-5 h-5" />Customer Information</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>First Name</Label>
                  {isEditing ? (
                    <Input value={editData.firstName || ""} onChange={(e) => setEditData({ ...editData, firstName: e.target.value })} />
                  ) : (
                    <p className="font-medium">{customer.firstName}</p>
                  )}
                </div>
                <div>
                  <Label>Last Name</Label>
                  {isEditing ? (
                    <Input value={editData.lastName || ""} onChange={(e) => setEditData({ ...editData, lastName: e.target.value })} />
                  ) : (
                    <p className="font-medium">{customer.lastName}</p>
                  )}
                </div>
                <div>
                  <Label className="flex items-center gap-1"><Mail className="w-3 h-3" />Email</Label>
                  {isEditing ? (
                    <Input type="email" value={editData.email || ""} onChange={(e) => setEditData({ ...editData, email: e.target.value })} />
                  ) : (
                    <p className="font-medium">{customer.email}</p>
                  )}
                </div>
                <div>
                  <Label className="flex items-center gap-1"><Phone className="w-3 h-3" />Phone</Label>
                  {isEditing ? (
                    <Input value={editData.phone || ""} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} />
                  ) : (
                    <p className="font-medium">{customer.phone || "—"}</p>
                  )}
                </div>
                <div>
                  <Label className="flex items-center gap-1"><Calendar className="w-3 h-3" />DOB</Label>
                  {isEditing ? (
                    <Input type="date" value={editData.dateOfBirth?.split("T")[0] || ""} onChange={(e) => setEditData({ ...editData, dateOfBirth: e.target.value })} />
                  ) : (
                    <p className="font-medium">{customer.dateOfBirth ? new Date(customer.dateOfBirth).toLocaleDateString() : "—"}</p>
                  )}
                </div>
                <div>
                  <Label>Gender</Label>
                  {isEditing ? (
                    <Select value={editData.gender || "OTHER"} onValueChange={(v) => setEditData({ ...editData, gender: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium">{customer.gender}</p>
                  )}
                </div>
                <div className="col-span-2">
                  <Label className="flex items-center gap-1"><MapPin className="w-3 h-3" />Address</Label>
                  {isEditing ? (
                    <div className="grid grid-cols-4 gap-2 mt-1">
                      <Input className="col-span-2" placeholder="Street" value={editData.addressLine1 || ""} onChange={(e) => setEditData({ ...editData, addressLine1: e.target.value })} />
                      <Input placeholder="Suburb" value={editData.suburb || ""} onChange={(e) => setEditData({ ...editData, suburb: e.target.value })} />
                      <div className="flex gap-1">
                        <Input placeholder="State" value={editData.state || ""} onChange={(e) => setEditData({ ...editData, state: e.target.value })} />
                        <Input placeholder="Post" value={editData.postcode || ""} onChange={(e) => setEditData({ ...editData, postcode: e.target.value })} />
                      </div>
                    </div>
                  ) : (
                    <p className="font-medium">{[customer.addressLine1, customer.suburb, customer.state, customer.postcode].filter(Boolean).join(", ") || "—"}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="quiz-assessment">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
              <TabsTrigger value="quiz-assessment">
                Quiz Assessment
                {quizAssessmentProgramCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-800">
                    {quizAssessmentProgramCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="subscription">Subscription</TabsTrigger>
              <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="biomarkers">Lab Results</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
            </TabsList>

            <TabsContent value="quiz-assessment" className="mt-4">
              <MemberQuizAssessmentTabs
                submissions={portalQuizAllSubmissions}
                memberGender={customer?.gender}
                assessment={assessment}
                bmi={bmi}
                rawSurveyData={rawSurveyData}
                isHairLossQuestionnaire={isHairLossQuestionnaire}
                assessmentSubmittedAt={
                  assessment?.submittedAt ||
                  (assessmentData?.submittedAt as string | undefined) ||
                  null
                }
              />
            </TabsContent>

            {/* Prescriptions Tab */}
            <TabsContent value="prescriptions" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Pill className="w-5 h-5" />
                    Prescriptions
                  </CardTitle>
                  <CardDescription>
                    Medications prescribed by doctors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {prescriptions.length > 0 ? (
                    <div className="space-y-4">
                      {prescriptions.map((rx: Record<string, unknown>) => {
                        const status = rx.status as string;
                        const scriptStatus = rx.scriptStatus as string;
                        const statusColor =
                          status === "ACTIVE" ? "bg-green-100 text-green-700" :
                          status === "COMPLETED" ? "bg-blue-100 text-blue-700" :
                          status === "CANCELLED" ? "bg-red-100 text-red-700" :
                          status === "ON_HOLD" ? "bg-amber-100 text-amber-700" :
                          "bg-gray-100 text-gray-700";
                        const scriptStatusColor =
                          scriptStatus === "SCRIPT_WRITTEN" ? "bg-blue-100 text-blue-700" :
                          scriptStatus === "SCRIPT_SENT_TO_PHARMACY" ? "bg-purple-100 text-purple-700" :
                          scriptStatus === "PHARMACY_PENDING" ? "bg-amber-100 text-amber-700" :
                          scriptStatus === "DISPENSING" ? "bg-cyan-100 text-cyan-700" :
                          scriptStatus === "SHIPPED" ? "bg-indigo-100 text-indigo-700" :
                          scriptStatus === "DELIVERED" ? "bg-green-100 text-green-700" :
                          "bg-gray-100 text-gray-700";

                        return (
                          <div key={rx.id as string} className="border rounded-xl p-4 bg-card hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-foreground">{rx.medicationName as string}</h4>
                                {(rx.genericName as string) ? (
                                  <p className="text-sm text-muted-foreground">({rx.genericName as string})</p>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={statusColor}>{status}</Badge>
                                {scriptStatus && scriptStatus !== "SCRIPT_DRAFT" && (
                                  <Badge className={scriptStatusColor}>{(scriptStatus as string).replace(/_/g, " ")}</Badge>
                                )}
                                <Link href={`/admin/prescriptions?prescriptionId=${rx.id as string}`}>
                                  <Button variant="outline" size="sm" className="h-7 gap-1.5">
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    Manage
                                  </Button>
                                </Link>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <p className="text-muted-foreground">Strength</p>
                                <p className="font-medium">{rx.strength as string}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Dosage</p>
                                <p className="font-medium">{rx.dosage as string}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Frequency</p>
                                <p className="font-medium">{rx.frequency as string}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Quantity</p>
                                <p className="font-medium">{rx.quantity as number} {rx.quantityUnit as string}</p>
                              </div>
                            </div>

                            {(rx.instructions as string) ? (
                              <div className="mt-3 p-2 bg-muted/30 rounded-lg">
                                <p className="text-xs text-muted-foreground">Instructions</p>
                                <p className="text-sm">{rx.instructions as string}</p>
                              </div>
                            ) : null}

                            <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-4">
                                <span>Prescribed by: <span className="font-medium text-foreground">{rx.prescriberName as string}</span></span>
                                <span>Date: <span className="font-medium text-foreground">{new Date(rx.prescribedAt as string).toLocaleDateString("en-AU")}</span></span>
                              </div>
                              {(rx.refillsTotal as number) > 0 && (
                                <span>Refills: <span className="font-medium text-foreground">{rx.refillsRemaining as number}/{rx.refillsTotal as number}</span></span>
                              )}
                            </div>

                            {(rx.pharmacyName as string) ? (
                              <div className="mt-2 text-xs text-muted-foreground">
                                Pharmacy: <span className="font-medium text-foreground">{rx.pharmacyName as string}</span>
                              </div>
                            ) : null}

                            {/* Refill History */}
                            {(rx.refills as Array<Record<string, unknown>>)?.length > 0 && (
                              <div className="mt-3 pt-3 border-t">
                                <p className="text-xs font-medium text-muted-foreground mb-2">Recent Refills</p>
                                <div className="space-y-1">
                                  {(rx.refills as Array<Record<string, unknown>>).slice(0, 3).map((refill) => (
                                    <div key={refill.id as string} className="flex items-center justify-between text-xs bg-muted/20 rounded px-2 py-1">
                                      <span>{new Date(refill.filledAt as string).toLocaleDateString("en-AU")}</span>
                                      <Badge variant="outline" className="text-xs">{refill.status as string}</Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <Pill className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No prescriptions</p>
                      <p className="text-sm text-muted-foreground mt-1">Prescriptions will appear here once approved by a doctor.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notes" className="space-y-4 mt-4">
              <Card>
                <CardContent className="pt-4 space-y-4">
                  <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                    <Input placeholder="Note title..." value={newNoteTitle} onChange={(e) => setNewNoteTitle(e.target.value)} />
                    <Textarea placeholder="Write note..." value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} rows={2} />
                    <div className="flex justify-between">
                      <Select value={newNoteCategory} onValueChange={setNewNoteCategory}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GENERAL">General</SelectItem>
                          <SelectItem value="MEDICAL">Medical</SelectItem>
                          <SelectItem value="BILLING">Billing</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={handleAddNote} disabled={isAddingNote}>
                        {isAddingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}Add
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="h-[300px]">
                    {notes.length > 0 ? notes.map((note: Record<string, unknown>) => (
                      <div key={note.id as string} className="p-3 border rounded-lg mb-2">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium text-sm">{note.title as string}</span>
                          <Badge variant="outline" className="text-xs">{note.category as string}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{note.content as string}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(note.createdAt as string).toLocaleString()}</p>
                      </div>
                    )) : <p className="text-center text-muted-foreground py-8">No notes</p>}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="biomarkers" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FlaskConical className="w-5 h-5" />
                    Lab Results
                  </CardTitle>
                  <CardDescription>
                    Pathology and biomarker test values from completed blood work, not intake quiz answers.
                    For in-portal quiz submissions, see the <span className="font-medium">Program Quizzes</span> tab.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {biomarkers.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm text-muted-foreground">
                          {biomarkersByTestDate.length} test date{biomarkersByTestDate.length === 1 ? "" : "s"} · {biomarkers.length} results
                        </p>
                        {labDateKeys.length > 1 && (
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setExpandedLabDates(labDateKeys)}
                            >
                              Expand all
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setExpandedLabDates([])}
                            >
                              Collapse all
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pb-1">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full status-dot-optimal" />
                          Optimal
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full status-dot-normal" />
                          Normal
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full status-dot-out-of-range" />
                          Attention
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full status-dot-critical" />
                          Critical
                        </span>
                      </div>
                      <Accordion
                        type="multiple"
                        value={expandedLabDates}
                        onValueChange={setExpandedLabDates}
                        className="w-full"
                      >
                        {biomarkersByTestDate.map(([dateKey, dateResults]) => (
                          <AccordionItem key={dateKey} value={dateKey}>
                            <AccordionTrigger className="hover:no-underline py-3">
                              <div className="flex items-center gap-2 text-left">
                                <Calendar className="w-4 h-4 text-primary shrink-0" />
                                <span className="font-semibold">
                                  {dateKey !== "unknown"
                                    ? new Date(`${dateKey}T12:00:00`).toLocaleDateString("en-AU", {
                                        weekday: "short",
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })
                                    : "Unknown date"}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {dateResults.length} biomarker{dateResults.length === 1 ? "" : "s"}
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 pt-1">
                                {dateResults.map((b: Record<string, unknown>) => {
                                  const status = String(b.status ?? "NORMAL");
                                  const displayValue =
                                    typeof b.value === "number"
                                      ? b.value
                                      : Number(b.value);
                                  return (
                                    <div
                                      key={b.id as string}
                                      className={`flex items-center justify-between gap-3 p-3 border rounded-lg ${getBiomarkerStatusRowClass(status)}`}
                                    >
                                      <div className="flex items-center gap-2 min-w-0">
                                        <span
                                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${getBiomarkerStatusDotClass(status)}`}
                                        />
                                        <p className="font-medium truncate">
                                          {(b.biomarker as Record<string, unknown>)?.name as string ||
                                            (b.biomarkerId as string)}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0 text-right">
                                        <span className="font-semibold tabular-nums">
                                          {Number.isFinite(displayValue) ? displayValue : "—"}{" "}
                                          <span className="font-normal text-muted-foreground">
                                            {(b.biomarker as Record<string, unknown>)?.unit as string}
                                          </span>
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className={`text-xs ${getBiomarkerStatusBadgeClass(status)}`}
                                        >
                                          {getBiomarkerStatusLabel(status)}
                                        </Badge>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No biomarker results</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Subscription Tab */}
            <TabsContent value="subscription" className="space-y-4 mt-4">
              {programSubscriptions.length > 0 ? (
                <>
                  {programSubscriptions.map((programSub, index) => (
                    <Card key={programSub.program || programSub.id || index} className="border-primary/20 bg-primary/5">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Package className="w-5 h-5 text-primary" />
                          {programSub.programLabel || programSub.planName || "Program & Billing"}
                        </CardTitle>
                        <CardDescription>
                          {programSub.recurring?.label || "Billing status from intake and Stripe"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="p-4 bg-white rounded-xl border">
                            <p className="text-xs text-muted-foreground mb-1">Plan</p>
                            <p className="text-lg font-bold text-primary">
                              {programSub.planName}
                            </p>
                            {programSub.selectedPlan && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Tier: {programSub.selectedPlan}
                              </p>
                            )}
                          </div>
                          <div className="p-4 bg-white rounded-xl border">
                            <p className="text-xs text-muted-foreground mb-1">Recurring</p>
                            <p className="text-lg font-bold">
                              {programSub.amount != null ? `$${programSub.amount}` : "—"}
                              {programSub.recurring?.billingLabel && (
                                <span className="text-sm font-normal text-muted-foreground">
                                  {" "}/ {programSub.recurring.billingLabel.toLowerCase()}
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="p-4 bg-white rounded-xl border">
                            <p className="text-xs text-muted-foreground mb-1">Status</p>
                            <Badge className={`text-sm ${
                              programSub.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                              programSub.status === "PAST_DUE" ? "bg-red-100 text-red-700" :
                              programSub.status === "CANCELLED" ? "bg-gray-100 text-gray-700" :
                              "bg-yellow-100 text-yellow-700"
                            }`}>
                              {programSub.status || "PENDING"}
                            </Badge>
                          </div>
                          <div className="p-4 bg-white rounded-xl border">
                            <p className="text-xs text-muted-foreground mb-1">Paid till</p>
                            <p className="text-lg font-bold">
                              {programSub.recurring?.paidTill || programSub.currentPeriodEnd
                                ? new Date(programSub.recurring?.paidTill || programSub.currentPeriodEnd!).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
                                : "—"}
                            </p>
                          </div>
                        </div>

                        <Separator className="my-4" />

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-muted-foreground">
                              {programSub.billingModel === "annual_subscription"
                                ? "Annual payment"
                                : programSub.firstMonth?.status === "included"
                                  ? "First 30 days"
                                  : "First month"}
                            </Label>
                            <div className="font-medium flex items-center gap-2 flex-wrap">
                              <span>
                                {programSub.firstMonth?.status === "included"
                                  ? "Included with membership"
                                  : programSub.firstMonth?.amountAud != null
                                    ? `$${programSub.firstMonth.amountAud}`
                                    : "—"}
                              </span>
                              <Badge variant="outline">
                                {programSub.firstMonth?.status === "included"
                                  ? "included"
                                  : programSub.firstMonth?.status || "pending"}
                              </Badge>
                            </div>
                            {programSub.firstMonth?.paidAt && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Paid {new Date(programSub.firstMonth.paidAt).toLocaleDateString("en-AU")}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label className="text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Billing period start
                            </Label>
                            <p className="font-medium">
                              {programSub.startDate
                                ? new Date(programSub.startDate).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })
                                : "—"}
                            </p>
                          </div>
                          <div>
                            <Label className="text-muted-foreground flex items-center gap-1">
                              <CalendarClock className="w-3 h-3" />
                              Next billing date
                            </Label>
                            <p className="font-medium">
                              {programSub.recurring?.nextBillingDate || programSub.currentPeriodEnd
                                ? new Date(programSub.recurring?.nextBillingDate || programSub.currentPeriodEnd!).toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })
                                : "—"}
                            </p>
                          </div>
                        </div>

                        {programSub.cancelledAt && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">
                              <AlertCircle className="w-4 h-4 inline mr-1" />
                              Cancelled on {new Date(programSub.cancelledAt).toLocaleDateString("en-AU")}
                            </p>
                          </div>
                        )}

                        {isProgramCancellable(programSub) && (
                          <div className="mt-4 flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                              onClick={() => openCancelDialog(programSub)}
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Cancel membership
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}

                  {programSubscriptions.some((p) => p.history && p.history.length > 0) && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Plan history</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {programSubscriptions.map((programSub) =>
                          programSub.history && programSub.history.length > 0 ? (
                            <div key={programSub.program || programSub.planName} className="space-y-2">
                              {programSubscriptions.length > 1 && (
                                <p className="text-sm font-medium text-muted-foreground">
                                  {programSub.programLabel || programSub.planName}
                                </p>
                              )}
                              {programSub.history.map((h) => (
                                <div key={h.id} className="text-sm border rounded-lg p-3">
                                  <p className="font-medium">
                                    {h.fromLabel ? `${h.fromLabel} → ${h.toLabel}` : h.toLabel}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {h.changeType.replace(/_/g, " ")} ·{" "}
                                    {new Date(h.effectiveAt).toLocaleDateString("en-AU")}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : null
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Subscription Management</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!subscription?.availableCadences?.length}
                        onClick={() => {
                          setSelectedCadenceId(subscription?.availableCadences?.[0]?.billingPriceId || "");
                          setChangePlanOpen(true);
                        }}
                      >
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Change billing cadence
                      </Button>
                      {programSubscriptions.some(isProgramCancellable) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                          onClick={() => {
                            const first = programSubscriptions.find(isProgramCancellable);
                            if (first) openCancelDialog(first);
                          }}
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          Cancel membership
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={portalLoading || !subscription?.stripeCustomerId}
                        onClick={async () => {
                          setPortalLoading(true);
                          try {
                            const res = await fetch("/api/admin/billing/portal", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ memberId: customer.id }),
                            });
                            if (!res.ok) {
                              const err = await res.json().catch(() => ({}));
                              throw new Error(err.error || "Failed");
                            }
                            const data = await res.json();
                            if (data.url) window.open(data.url, "_blank");
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Failed to open portal");
                          } finally {
                            setPortalLoading(false);
                          }
                        }}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        {portalLoading ? "Opening..." : "Update payment (Stripe)"}
                      </Button>
                      {subscription?.selectedPlan === "CORE" &&
                        subscription?.stripeSubscriptionId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={async () => {
                            setTierUpgradeLoading(true);
                            try {
                              const res = await fetch("/api/admin/billing/upgrade-tier", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  memberId: customer.id,
                                  notes: "Precision tier upgrade from CRM",
                                }),
                              });
                              if (!res.ok) {
                                const err = await res.json().catch(() => ({}));
                                throw new Error(err.error || "Failed");
                              }
                              toast.success("Upgraded to Precision (effective next period)");
                              fetchData();
                            } catch (e) {
                              toast.error(
                                e instanceof Error ? e.message : "Failed to upgrade tier"
                              );
                            } finally {
                              setTierUpgradeLoading(false);
                            }
                          }}
                          disabled={tierUpgradeLoading}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          {tierUpgradeLoading ? "Upgrading..." : "Upgrade to Precision"}
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const quarterly = subscription?.availableCadences?.find(
                            (c) => c.billingInterval === "QUARTERLY"
                          );
                          if (!quarterly) {
                            setBillingUpgradeOfferLoading(true);
                            try {
                              const res = await fetch("/api/care-comms", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  action: "createBillingUpgradeOffer",
                                  memberId: customer.id,
                                }),
                              });
                              if (!res.ok) throw new Error("Failed");
                              toast.success("Billing upgrade task created");
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : "Failed");
                            } finally {
                              setBillingUpgradeOfferLoading(false);
                            }
                            return;
                          }
                          setChangePlanLoading(true);
                          try {
                            const res = await fetch("/api/admin/billing/change-plan", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                memberId: customer.id,
                                targetBillingPriceId: quarterly.billingPriceId,
                                effective: "next_period",
                                notes: "Quarterly upgrade from CRM",
                              }),
                            });
                            if (!res.ok) {
                              const err = await res.json().catch(() => ({}));
                              throw new Error(err.error || "Failed");
                            }
                            toast.success("Switched to quarterly billing");
                            fetchData();
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Failed to change plan");
                          } finally {
                            setChangePlanLoading(false);
                          }
                        }}
                        disabled={billingUpgradeOfferLoading || changePlanLoading}
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        {billingUpgradeOfferLoading || changePlanLoading
                          ? "Processing..."
                          : "Offer Quarterly / 6-Month"}
                      </Button>
                    </CardContent>
                  </Card>

                  <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cancel membership</DialogTitle>
                        <DialogDescription>
                          Process a member cancellation request. Access continues until the chosen effective date.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {programSubscriptions.filter(isProgramCancellable).length > 1 && (
                          <div className="space-y-2">
                            <Label>Program</Label>
                            <Select
                              value={cancelProgramSlug}
                              onValueChange={(slug) => {
                                const match = programSubscriptions.find((p) => p.program === slug);
                                setCancelProgramSlug(slug);
                                setCancelProgramLabel(
                                  match?.programLabel || match?.planName || "Membership"
                                );
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select program" />
                              </SelectTrigger>
                              <SelectContent>
                                {programSubscriptions.filter(isProgramCancellable).map((p) => (
                                  <SelectItem key={p.program || p.planName} value={p.program || ""}>
                                    {p.programLabel || p.planName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {programSubscriptions.filter(isProgramCancellable).length <= 1 && (
                          <div className="rounded-lg border p-3 bg-muted/40">
                            <p className="text-sm font-medium">{cancelProgramLabel}</p>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label>When should cancellation take effect?</Label>
                          <Select
                            value={cancelEffective}
                            onValueChange={(v) =>
                              setCancelEffective(v as "period_end" | "immediate")
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="period_end">
                                End of billing period (recommended)
                              </SelectItem>
                              <SelectItem value="immediate">
                                Immediately, revoke access now
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Cancellation reason / notes</Label>
                          <Textarea
                            placeholder="Member requested cancellation via phone/email..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                          Keep membership
                        </Button>
                        <Button
                          variant="destructive"
                          disabled={!cancelProgramSlug || cancelLoading}
                          onClick={async () => {
                            setCancelLoading(true);
                            try {
                              const res = await fetch("/api/admin/billing/cancel-subscription", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  memberId: customer.id,
                                  program: cancelProgramSlug,
                                  effective: cancelEffective,
                                  reason: cancelReason.trim() || undefined,
                                }),
                              });
                              const data = await res.json().catch(() => ({}));
                              if (!res.ok) {
                                throw new Error(data.error || "Failed to cancel membership");
                              }
                              toast.success(data.message || "Membership cancelled");
                              setCancelDialogOpen(false);
                              fetchData();
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : "Failed to cancel");
                            } finally {
                              setCancelLoading(false);
                            }
                          }}
                        >
                          {cancelLoading ? "Cancelling..." : "Confirm cancellation"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={changePlanOpen} onOpenChange={setChangePlanOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change billing cadence</DialogTitle>
                        <DialogDescription>
                          Updates the member&apos;s Stripe subscription. Changes apply at the next billing period unless configured otherwise in Stripe.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2">
                        <Label>Billing cadence</Label>
                        <Select value={selectedCadenceId} onValueChange={setSelectedCadenceId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select cadence" />
                          </SelectTrigger>
                          <SelectContent>
                            {(subscription?.availableCadences || []).map((c) => (
                              <SelectItem key={c.billingPriceId} value={c.billingPriceId}>
                                {c.label}, ${c.amountAud}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setChangePlanOpen(false)}>
                          Cancel
                        </Button>
                        <Button
                          disabled={!selectedCadenceId || changePlanLoading}
                          onClick={async () => {
                            setChangePlanLoading(true);
                            try {
                              const res = await fetch("/api/admin/billing/change-plan", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                  memberId: customer.id,
                                  targetBillingPriceId: selectedCadenceId,
                                  effective: "next_period",
                                }),
                              });
                              if (!res.ok) {
                                const err = await res.json().catch(() => ({}));
                                throw new Error(err.error || "Failed");
                              }
                              toast.success("Billing cadence updated");
                              setChangePlanOpen(false);
                              fetchData();
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : "Failed");
                            } finally {
                              setChangePlanLoading(false);
                            }
                          }}
                        >
                          {changePlanLoading ? "Saving..." : "Apply change"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              ) : isProspectiveEnrollment &&
                (customer.subscriptionTier || assessmentData?.program) ? (
                <Card className="border-amber-200 bg-amber-50/30">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-600" />
                      Prospective enrollment
                    </CardTitle>
                    <CardDescription>
                      Assessment complete, checkout and payment not finished yet.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-4 bg-white rounded-xl border border-amber-100">
                      <p className="text-xs text-muted-foreground mb-1">Program interest</p>
                      <p className="text-lg font-semibold text-[#2c3628]">
                        {prospectiveProgramLabel}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      No subscription or billing is active yet. Plan details, Stripe records, and
                      membership dates appear after successful checkout payment.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Journey status:{" "}
                      <span className="font-medium text-foreground">
                        {JOURNEY_STATUS_LABELS[customer.journeyStatus || "SURVEY_COMPLETED"]
                          ?.label || customer.journeyStatus || "Survey completed"}
                      </span>
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No program or subscription on file</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Plan details appear after checkout or when a subscription is created.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Billing / Payment History Tab */}
            <TabsContent value="billing" className="space-y-4 mt-4">
              {programSubscriptions.length > 0 && (
                <div className="space-y-4">
                  {programSubscriptions.map((programSub, index) => (
                    <Card key={programSub.program || programSub.id || index} className="border-primary/20 bg-primary/5">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Package className="w-5 h-5 text-primary" />
                          {programSub.programLabel || programSub.planName || "Subscription snapshot"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Plan</p>
                            <p className="font-semibold">{programSub.planName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Recurring</p>
                            <p className="font-semibold">
                              {programSub.amount != null ? `$${programSub.amount}` : "—"}
                              {programSub.recurring?.billingLabel
                                ? ` / ${programSub.recurring.billingLabel.toLowerCase()}`
                                : ""}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Paid till</p>
                            <p className="font-semibold">
                              {programSub.recurring?.paidTill || programSub.currentPeriodEnd
                                ? new Date(
                                    programSub.recurring?.paidTill || programSub.currentPeriodEnd!
                                  ).toLocaleDateString("en-AU", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })
                                : "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <Badge variant="outline">{programSub.status || "PENDING"}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Receipt className="w-5 h-5" />
                      Payment History
                    </CardTitle>
                    <div className="text-sm text-muted-foreground">
                      {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {invoices.length > 0 ? (
                    <div className="space-y-3">
                      {invoices.map((inv: Record<string, unknown>) => (
                        <div key={inv.id as string} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              inv.status === "PAID" ? "bg-green-100" : "bg-yellow-100"
                            }`}>
                              {inv.status === "PAID" ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <Clock className="w-5 h-5 text-yellow-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{inv.description as string || "Invoice"}</p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span>{new Date(inv.createdAt as string).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}</span>
                                {(inv.paymentMethod as string) && (
                                  <span className="flex items-center gap-1">
                                    <CreditCard className="w-3 h-3" />
                                    {inv.paymentMethod as string}
                                  </span>
                                )}
                                {(inv.paidAt as string) && (
                                  <span>Paid {new Date(inv.paidAt as string).toLocaleDateString("en-AU")}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <p className="font-bold text-lg">${(inv.amount as number).toFixed(2)}</p>
                              <Badge className={`text-xs ${
                                inv.status === "PAID" ? "bg-green-100 text-green-700" :
                                inv.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                                inv.status === "REFUNDED" ? "bg-blue-100 text-blue-700" :
                                "bg-gray-100 text-gray-700"
                              }`}>
                                {inv.status as string}
                              </Badge>
                            </div>
                            {inv.status === "PAID" && (
                              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                <Download className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center">
                      <Receipt className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No billing history</p>
                      <p className="text-sm text-muted-foreground mt-1">Payment records will appear here when the customer makes a purchase.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Billing Summary */}
              {invoices.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Billing Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-muted/30 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-600">
                          ${invoices.filter((i: Record<string, unknown>) => i.status === "PAID").reduce((sum: number, i: Record<string, unknown>) => sum + (i.amount as number), 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Total Paid</p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg text-center">
                        <p className="text-2xl font-bold text-yellow-600">
                          ${invoices.filter((i: Record<string, unknown>) => i.status === "PENDING").reduce((sum: number, i: Record<string, unknown>) => sum + (i.amount as number), 0).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Pending</p>
                      </div>
                      <div className="p-4 bg-muted/30 rounded-lg text-center">
                        <p className="text-2xl font-bold">
                          {invoices.filter((i: Record<string, unknown>) => i.status === "PAID").length}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Payments</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="bookings" className="mt-4">
              <Card>
                <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Calendar className="w-5 h-5" />Bookings</CardTitle></CardHeader>
                <CardContent>
                  {bookings.length > 0 ? bookings.map((b: Record<string, unknown>) => {
                    const status = b.status as string;
                    const manageable = !["BOOKING_CANCELLED", "BOOKING_COMPLETED", "CANCELLED", "COMPLETED"].includes(status);
                    const scheduledAt = typeof b.scheduledAt === "string"
                      ? b.scheduledAt
                      : (b.scheduledAt as Date)?.toISOString?.() || String(b.scheduledAt);
                    return (
                      <div key={b.id as string} className="p-3 border rounded-lg mb-3 space-y-2">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="font-medium">{new Date(scheduledAt).toLocaleDateString("en-AU", { weekday: "long", day: "numeric", month: "long" })}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(scheduledAt).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })}
                              {b.doctorName ? ` • ${b.doctorName as string}` : ""}
                            </p>
                          </div>
                          <Badge>{status}</Badge>
                        </div>
                        {manageable && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRescheduleBooking(b)}
                            >
                              <CalendarClock className="w-3.5 h-3.5 mr-1" />
                              Reschedule
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600"
                              onClick={() => setCancelBooking(b)}
                            >
                              Cancel
                            </Button>
                          </div>
                        )}
                        <BookingChangeHistory bookingId={b.id as string} />
                      </div>
                    );
                  }) : <p className="text-center text-muted-foreground py-8">No bookings</p>}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Recommended Biomarker Testing */}
          {recommendedPanels.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-amber-800">
                  <FlaskConical className="w-5 h-5" />
                  Recommended Testing
                </CardTitle>
                <CardDescription className="text-amber-700">
                  Based on reported conditions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recommendedPanels.map((panel) => {
                  const Icon = panel.icon;
                  return (
                    <div key={panel.id} className="flex items-start gap-3 p-3 rounded-lg bg-white border border-amber-200/50">
                      <div className={`p-2 rounded-lg bg-amber-100/50 ${panel.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-amber-900">{panel.name}</p>
                        <p className="text-xs text-amber-700 mt-0.5">{panel.description}</p>
                        {panel.priority === "high" && (
                          <Badge className="mt-1.5 bg-amber-100 text-amber-800 text-xs">High Priority</Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
                <p className="text-xs text-amber-600 pt-2">
                  Note: Testing is only requested where clinically appropriate by the treating doctor.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Holistic Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Holistic Insights
              </CardTitle>
              <CardDescription>
                Health overview from latest lab results
                {holisticInsights?.lastUpdated && (
                  <span className="block text-xs mt-0.5">
                    Updated{" "}
                    {new Date(holisticInsights.lastUpdated).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {!holisticInsights ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No lab results yet. Upload biomarkers to see health scores.
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <span className="text-sm font-medium">Overall health score</span>
                    <span className={`text-2xl font-bold ${getScoreColor(holisticInsights.overall)}`}>
                      {holisticInsights.overall}
                    </span>
                  </div>
                  {HEALTH_CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const insight = holisticInsights.byKey[cat.key];
                    const hasData = insight?.hasData ?? false;
                    const score = insight?.score ?? 0;
                    return (
                      <div key={cat.key} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <div className={`p-2 rounded-lg bg-background ${cat.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium">{cat.label}</p>
                            {hasData && insight.outOfRange > 0 && (
                              <span className="text-xs text-orange-600 shrink-0">
                                {insight.outOfRange} need attention
                              </span>
                            )}
                          </div>
                          <div className="h-2 bg-muted rounded-full mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${hasData ? getProgressColor(score) : "bg-gray-300"}`}
                              style={{ width: hasData ? `${Math.min(100, Math.max(0, score))}%` : "0%" }}
                            />
                          </div>
                        </div>
                        <span
                          className={`text-sm font-semibold tabular-nums shrink-0 ${hasData ? getScoreColor(score) : "text-muted-foreground"}`}
                        >
                          {hasData ? score : "—"}
                        </span>
                      </div>
                    );
                  })}
                </>
              )}
            </CardContent>
          </Card>

          {/* Weight Progress */}
          {weightLogs.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Scale className="w-5 h-5" />Weight</CardTitle></CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{(weightLogs[0] as Record<string, unknown>).weight as number} kg</div>
                {weightLogs.length > 1 && (
                  <div className={`flex items-center gap-1 text-sm mt-1 ${
                    ((weightLogs[0] as Record<string, unknown>).weight as number) < ((weightLogs[weightLogs.length - 1] as Record<string, unknown>).weight as number) ? "text-green-600" : "text-red-600"
                  }`}>
                    {((weightLogs[0] as Record<string, unknown>).weight as number) < ((weightLogs[weightLogs.length - 1] as Record<string, unknown>).weight as number) ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                    {Math.abs(((weightLogs[0] as Record<string, unknown>).weight as number) - ((weightLogs[weightLogs.length - 1] as Record<string, unknown>).weight as number)).toFixed(1)} kg
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2"><Mail className="w-4 h-4" />Send Email</Button>
              <Button variant="outline" className="w-full justify-start gap-2"><Phone className="w-4 h-4" />Log Call</Button>
              <Button variant="outline" className="w-full justify-start gap-2"><Calendar className="w-4 h-4" />Schedule</Button>
              <Button variant="outline" className="w-full justify-start gap-2"><FileText className="w-4 h-4" />Upload Results</Button>
              <Separator className="my-2" />
              <Button
                variant="outline"
                className="w-full justify-start gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                onClick={() => {
                  setCustomPassword("");
                  setGeneratedPassword(null);
                  setSendPasswordEmail(true);
                  setShowResetPasswordDialog(true);
                }}
              >
                <KeyRound className="w-4 h-4" />
                Reset Password
              </Button>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Clock className="w-5 h-5" />Activity</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 rounded-full bg-green-500" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-xs text-muted-foreground">{new Date(customer.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {bookings[0] && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Consultation</p>
                      <p className="text-xs text-muted-foreground">{new Date((bookings[0] as Record<string, unknown>).scheduledAt as string).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-amber-600" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Reset password for {customer.firstName} {customer.lastName} ({customer.email})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {generatedPassword ? (
              // Show the generated password after successful reset without email
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-semibold">Password Reset Successfully</span>
                  </div>
                  <p className="text-sm text-green-600 mb-3">
                    The new password was not emailed. Please share it securely with the customer:
                  </p>
                  <div className="p-3 bg-white border border-green-300 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Temporary Password:</p>
                    <p className="font-mono text-lg font-bold text-green-800 select-all">{generatedPassword}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Advise the customer to change their password after logging in.
                </p>
              </div>
            ) : (
              // Password reset form
              <>
                <div className="space-y-3">
                  <div>
                    <Label>Custom Password (optional)</Label>
                    <Input
                      type="text"
                      placeholder="Leave blank to generate random password"
                      value={customPassword}
                      onChange={(e) => setCustomPassword(e.target.value)}
                      className="mt-1.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Minimum 8 characters. If left blank, a secure password will be generated.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg">
                    <Checkbox
                      id="sendEmail"
                      checked={sendPasswordEmail}
                      onCheckedChange={(checked) => setSendPasswordEmail(checked === true)}
                    />
                    <Label htmlFor="sendEmail" className="cursor-pointer">
                      <span className="font-medium">Send password via email</span>
                      <p className="text-xs text-muted-foreground">
                        Email the new password to {customer.email}
                      </p>
                    </Label>
                  </div>
                </div>

                {!sendPasswordEmail && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-2 text-amber-700">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <p className="text-sm">
                        The password will be shown to you after reset. You&apos;ll need to share it with the customer securely.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            {generatedPassword ? (
              <Button
                onClick={() => {
                  setShowResetPasswordDialog(false);
                  setGeneratedPassword(null);
                  setCustomPassword("");
                }}
              >
                Done
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowResetPasswordDialog(false);
                    setCustomPassword("");
                  }}
                  disabled={isResettingPassword}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleResetPassword}
                  disabled={isResettingPassword || (customPassword.length > 0 && customPassword.length < 8)}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {isResettingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 mr-2" />
                      Reset Password
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {rescheduleBooking && customer && (
        <RescheduleBookingDialog
          open={!!rescheduleBooking}
          onOpenChange={(open) => !open && setRescheduleBooking(null)}
          bookingId={rescheduleBooking.id as string}
          patientName={`${customer.firstName} ${customer.lastName}`.trim()}
          currentScheduledAt={
            typeof rescheduleBooking.scheduledAt === "string"
              ? rescheduleBooking.scheduledAt
              : new Date(rescheduleBooking.scheduledAt as string).toISOString()
          }
          onSuccess={() => {
            setRescheduleBooking(null);
            fetchData();
          }}
        />
      )}

      {cancelBooking && customer && (
        <CancelBookingDialog
          open={!!cancelBooking}
          onOpenChange={(open) => !open && setCancelBooking(null)}
          bookingId={cancelBooking.id as string}
          patientName={`${customer.firstName} ${customer.lastName}`.trim()}
          scheduledAt={
            typeof cancelBooking.scheduledAt === "string"
              ? cancelBooking.scheduledAt
              : new Date(cancelBooking.scheduledAt as string).toISOString()
          }
          onSuccess={() => {
            setCancelBooking(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
