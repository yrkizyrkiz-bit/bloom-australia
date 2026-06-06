"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ClipboardList, AlertTriangle, CheckCircle2, Clock, User, Scale,
  Heart, FileText, Send, Loader2, Search, ChevronRight, Phone, Mail,
  Calendar, Activity, Pill, UserCheck, AlertCircle, ArrowRight,
  Stethoscope, Users, TriangleAlert, CreditCard, XCircle, TestTube,
  RefreshCcw, DollarSign, PhoneCall, MailWarning, FlaskConical
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface MedicalCondition {
  id: string;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  isSevere: boolean;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string;
  age: number | null;
  triageScore: number | null;
  journeyStatus: string;
  approvalStatus: string;
  assignedCarePartnerId: string | null;
  createdAt: string;
  updatedAt: string;
  bmi: number | null;
  currentWeight: number | null;
  healthProfile: {
    systolicBP: number | null;
    diastolicBP: number | null;
    onBPMedication: boolean;
    smokingStatus: string;
    familyHistoryCVD: boolean;
  } | null;
  medicalConditions: MedicalCondition[];
  hasContraindications: boolean;
  consultationDate: string | null;
  consultationStatus: string | null;
  assignedDoctorId: string | null;
  weightGoals: Array<{ startWeight: number; targetWeight: number }>;
  assessment?: {
    weightLossGoal: string;
    currentWeight: string;
    targetWeight: string;
    height: string;
    metabolicConditions: string[];
    digestiveConditions: string[];
    cardiovascularConditions: string[];
    mentalHealthConditions: string[];
    seriousConditions: string[];
    currentMedications: string[];
    motivations: string[];
    otherGoals: string[];
  } | null;
  intakePayment?: {
    status: string;
    amountAud: number | null;
    paidAt: string | null;
    selectedPlan: string;
  } | null;
}

interface CarePartner {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Stats {
  pendingTriage: number;
  awaitingApproval: number;
  highRisk: number;
  withContraindications: number;
  pendingTests: number;
  declined: number;
}

// Patient Brief Template
const BRIEF_TEMPLATE = `## Patient Overview
- **Name:** [PATIENT_NAME]
- **Age/Gender:** [AGE] years, [GENDER]
- **BMI:** [BMI]
- **Current Weight:** [WEIGHT] kg
- **Target Weight:** [TARGET_WEIGHT] kg

## Relevant Medical History
[MEDICAL_CONDITIONS]

## Vital Signs
- Blood Pressure: [BP]
- On BP Medication: [BP_MEDS]

## Risk Factors
- Smoking Status: [SMOKING]
- Family History CVD: [FAMILY_CVD]

## Triage Assessment
- **Triage Score:** [TRIAGE_SCORE]/100
- **Risk Level:** [RISK_LEVEL]

## Care Partner Notes
[NOTES]

## Recommendation
[RECOMMENDATION]
`;

export default function TriageQueuePage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [carePartners, setCarePartners] = useState<CarePartner[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [stats, setStats] = useState<Stats>({
    pendingTriage: 0,
    awaitingApproval: 0,
    highRisk: 0,
    withContraindications: 0,
    pendingTests: 0,
    declined: 0,
  });

  // Declined patient dialog states
  const [showDeclinedActionDialog, setShowDeclinedActionDialog] = useState(false);
  const [declinedAction, setDeclinedAction] = useState<"email" | "call" | "refund" | "review" | null>(null);
  const [declineEmailContent, setDeclineEmailContent] = useState("");
  const [callNotes, setCallNotes] = useState("");
  const [reviewDate, setReviewDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  // Dialog states
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showTriageDialog, setShowTriageDialog] = useState(false);
  const [showEscalationDialog, setShowEscalationDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Form states
  const [patientBrief, setPatientBrief] = useState("");
  const [triageScore, setTriageScore] = useState(50);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [selectedCarePartner, setSelectedCarePartner] = useState("");
  const [carePartnerNotes, setCarePartnerNotes] = useState("");
  const [recommendation, setRecommendation] = useState("approve");
  const [escalationReason, setEscalationReason] = useState("");

  const fetchTriageQueue = useCallback(async () => {
    try {
      // GAP-007: Using valid JourneyStatus values
      const status = activeTab === "pending" ? "PRE_TRIAGE_PENDING" :
                     activeTab === "awaiting" ? "AWAITING_DOCTOR_DECISION" :
                     activeTab === "new" ? "CONSULTATION_PAID" :
                     activeTab === "pre_payment" ? "pre_payment" :
                     activeTab === "pending_tests" ? "APPROVED_PENDING_TESTS" :
                     activeTab === "declined" ? "DECLINED" : "all";

      const res = await fetch(`/api/admin/triage?status=${status}`);
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients);
        setCarePartners(data.carePartners);
        setDoctors(data.doctors);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching triage queue:", error);
      toast.error("Failed to load triage queue");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchTriageQueue();
  }, [fetchTriageQueue]);

  const filteredPatients = patients.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openTriageDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setTriageScore(patient.triageScore || calculateTriageScore(patient));
    setSelectedDoctor(patient.assignedDoctorId || "");
    setCarePartnerNotes("");
    setRecommendation("approve");

    // Generate patient brief from template
    const brief = generatePatientBrief(patient);
    setPatientBrief(brief);
    setShowTriageDialog(true);
  };

  const calculateTriageScore = (patient: Patient): number => {
    let score = 30; // Base score

    // BMI factors
    if (patient.bmi) {
      if (patient.bmi >= 40) score += 25;
      else if (patient.bmi >= 35) score += 15;
      else if (patient.bmi >= 30) score += 10;
    }

    // Age factors
    if (patient.age) {
      if (patient.age >= 65) score += 15;
      else if (patient.age >= 50) score += 10;
    }

    // Medical conditions
    score += patient.medicalConditions.length * 5;

    // Contraindications
    if (patient.hasContraindications) score += 20;

    // Blood pressure
    if (patient.healthProfile?.systolicBP) {
      if (patient.healthProfile.systolicBP >= 140) score += 10;
    }

    // Family history
    if (patient.healthProfile?.familyHistoryCVD) score += 5;

    // Smoking
    if (patient.healthProfile?.smokingStatus === "CURRENT") score += 10;

    return Math.min(score, 100);
  };

  const generatePatientBrief = (patient: Patient): string => {
    const medicalConditionsText = patient.medicalConditions.length > 0
      ? patient.medicalConditions.map((c) => `- ${c.title}: ${c.content}`).join("\n")
      : "- No significant medical conditions flagged";

    const weightGoal = patient.weightGoals[0];
    const targetWeight = weightGoal?.targetWeight || "Not set";

    const riskLevel = patient.triageScore && patient.triageScore >= 70 ? "HIGH" :
                      patient.triageScore && patient.triageScore >= 40 ? "MODERATE" : "LOW";

    return BRIEF_TEMPLATE
      .replace("[PATIENT_NAME]", `${patient.firstName} ${patient.lastName}`)
      .replace("[AGE]", patient.age?.toString() || "Unknown")
      .replace("[GENDER]", patient.gender || "Not specified")
      .replace("[BMI]", patient.bmi?.toString() || "Not calculated")
      .replace("[WEIGHT]", patient.currentWeight?.toString() || "Not recorded")
      .replace("[TARGET_WEIGHT]", targetWeight.toString())
      .replace("[MEDICAL_CONDITIONS]", medicalConditionsText)
      .replace("[BP]", patient.healthProfile?.systolicBP
        ? `${patient.healthProfile.systolicBP}/${patient.healthProfile.diastolicBP}`
        : "Not recorded")
      .replace("[BP_MEDS]", patient.healthProfile?.onBPMedication ? "Yes" : "No")
      .replace("[SMOKING]", patient.healthProfile?.smokingStatus || "Unknown")
      .replace("[FAMILY_CVD]", patient.healthProfile?.familyHistoryCVD ? "Yes" : "No")
      .replace("[TRIAGE_SCORE]", (patient.triageScore || calculateTriageScore(patient)).toString())
      .replace("[RISK_LEVEL]", riskLevel)
      .replace("[NOTES]", "")
      .replace("[RECOMMENDATION]", "");
  };

  const handleAssignCarePartner = async (patientId: string, carePartnerId: string) => {
    try {
      const res = await fetch("/api/admin/triage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: patientId,
          action: "ASSIGN_CARE_PARTNER",
          assignedCarePartnerId: carePartnerId,
        }),
      });

      if (res.ok) {
        toast.success("Care partner assigned");
        fetchTriageQueue();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to assign care partner");
      }
    } catch (error) {
      console.error("Error assigning care partner:", error);
      toast.error("Failed to assign care partner");
    }
  };

  const handleStartTriage = async (patientId: string) => {
    try {
      const res = await fetch("/api/admin/triage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: patientId,
          action: "START_TRIAGE",
        }),
      });

      if (res.ok) {
        toast.success("Triage started");
        fetchTriageQueue();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to start triage");
      }
    } catch (error) {
      console.error("Error starting triage:", error);
      toast.error("Failed to start triage");
    }
  };

  const handleCompleteTriage = async () => {
    if (!selectedPatient || !selectedDoctor) {
      toast.error("Please select a doctor for review");
      return;
    }

    setProcessing(true);
    try {
      // Save patient brief first
      await fetch("/api/admin/triage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedPatient.id,
          action: "SAVE_PATIENT_BRIEF",
          patientBrief: patientBrief + `\n\n**Care Partner Notes:**\n${carePartnerNotes}\n\n**Recommendation:** ${recommendation}`,
          triageScore,
        }),
      });

      // Complete triage
      const res = await fetch("/api/admin/triage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedPatient.id,
          action: "COMPLETE_TRIAGE",
          assignedDoctorId: selectedDoctor,
          triageScore,
          notes: carePartnerNotes,
        }),
      });

      if (res.ok) {
        toast.success("Triage completed - patient sent to doctor for approval");
        setShowTriageDialog(false);
        setSelectedPatient(null);
        fetchTriageQueue();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to complete triage");
      }
    } catch (error) {
      console.error("Error completing triage:", error);
      toast.error("Failed to complete triage");
    } finally {
      setProcessing(false);
    }
  };

  const handleEscalate = async () => {
    if (!selectedPatient || !escalationReason) {
      toast.error("Please provide escalation reason");
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch("/api/admin/triage", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedPatient.id,
          action: "ESCALATE",
          escalationReason,
          triageScore: 95, // High score for escalations
          notes: carePartnerNotes,
        }),
      });

      if (res.ok) {
        toast.success("Patient escalated - doctors notified immediately");
        setShowEscalationDialog(false);
        setShowTriageDialog(false);
        setSelectedPatient(null);
        fetchTriageQueue();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to escalate");
      }
    } catch (error) {
      console.error("Error escalating:", error);
      toast.error("Failed to escalate");
    } finally {
      setProcessing(false);
    }
  };

  const getTriageScoreColor = (score: number | null) => {
    if (!score) return "bg-gray-100 text-gray-600";
    if (score >= 70) return "bg-red-100 text-red-700";
    if (score >= 40) return "bg-amber-100 text-amber-700";
    return "bg-green-100 text-green-700";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "LEAD":
        return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">Lead</Badge>;
      case "SURVEY_COMPLETED":
        return <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-200">Survey Done</Badge>;
      case "CONSULTATION_BOOKED":
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Booked</Badge>;
      case "CONSULTATION_PAID":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Paid</Badge>;
      case "PRE_TRIAGE_PENDING":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">In Triage</Badge>;
      case "PRE_TRIAGE_COMPLETE":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Triage Done</Badge>;
      case "AWAITING_DOCTOR_DECISION":
        return <Badge variant="outline" className="bg-violet-50 text-violet-700 border-violet-200">Awaiting Doctor</Badge>;
      case "APPROVED_PENDING_TESTS":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Pending Tests</Badge>;
      case "DECLINED":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Declined</Badge>;
      case "ACTIVE":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
      default:
        return <Badge variant="outline">{status.replace(/_/g, ' ')}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="w-6 h-6" />
            Triage Queue
          </h1>
          <p className="text-muted-foreground">Review patient intake data and prepare briefs for doctor approval</p>
        </div>
        <Link href="/admin/weight-management/approvals">
          <Button variant="outline">
            <Stethoscope className="w-4 h-4 mr-2" />
            Doctor Approvals
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className={stats.pendingTriage > 0 ? "border-amber-300" : ""}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending Triage</p>
              <p className="text-2xl font-bold">{stats.pendingTriage}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Awaiting Doctor</p>
              <p className="text-2xl font-bold">{stats.awaitingApproval}</p>
            </div>
          </CardContent>
        </Card>

        <Card className={stats.highRisk > 0 ? "border-red-300" : ""}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">High Risk</p>
              <p className="text-2xl font-bold">{stats.highRisk}</p>
            </div>
          </CardContent>
        </Card>

        <Card className={stats.withContraindications > 0 ? "border-red-300" : ""}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <TriangleAlert className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Contraindications</p>
              <p className="text-2xl font-bold">{stats.withContraindications}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="pre_payment" className="flex items-center gap-1">
              <CreditCard className="w-4 h-4" />
              Pre-Payment
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              Paid - New
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              In Triage
            </TabsTrigger>
            <TabsTrigger value="awaiting" className="flex items-center gap-1">
              <UserCheck className="w-4 h-4" />
              Awaiting Doctor
            </TabsTrigger>
            <TabsTrigger value="pending_tests" className="flex items-center gap-1">
              <FlaskConical className="w-4 h-4" />
              Pending Tests
              {stats.pendingTests > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{stats.pendingTests}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="declined" className="flex items-center gap-1">
              <XCircle className="w-4 h-4" />
              Declined
              {stats.declined > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">{stats.declined}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <TabsContent value="pre_payment" className="mt-4">
          <PatientList
            patients={filteredPatients}
            carePartners={carePartners}
            getStatusBadge={getStatusBadge}
            getTriageScoreColor={getTriageScoreColor}
            prePayment
          />
        </TabsContent>

        <TabsContent value="new" className="mt-4">
          <PatientList
            patients={filteredPatients}
            carePartners={carePartners}
            onStartTriage={handleStartTriage}
            onAssignCarePartner={handleAssignCarePartner}
            getStatusBadge={getStatusBadge}
            getTriageScoreColor={getTriageScoreColor}
            showAssignment
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-4">
          <PatientList
            patients={filteredPatients}
            carePartners={carePartners}
            onOpenTriage={openTriageDialog}
            getStatusBadge={getStatusBadge}
            getTriageScoreColor={getTriageScoreColor}
          />
        </TabsContent>

        <TabsContent value="awaiting" className="mt-4">
          <PatientList
            patients={filteredPatients}
            carePartners={carePartners}
            getStatusBadge={getStatusBadge}
            getTriageScoreColor={getTriageScoreColor}
            viewOnly
          />
        </TabsContent>

        <TabsContent value="pending_tests" className="mt-4">
          <PatientList
            patients={filteredPatients}
            carePartners={carePartners}
            getStatusBadge={getStatusBadge}
            getTriageScoreColor={getTriageScoreColor}
            pendingTests
            onDeclinedAction={(patient, action) => {
              setSelectedPatient(patient);
              setDeclinedAction(action);
              setShowDeclinedActionDialog(true);
            }}
          />
        </TabsContent>

        <TabsContent value="declined" className="mt-4">
          <PatientList
            patients={filteredPatients}
            carePartners={carePartners}
            getStatusBadge={getStatusBadge}
            getTriageScoreColor={getTriageScoreColor}
            declined
            onDeclinedAction={(patient, action) => {
              setSelectedPatient(patient);
              setDeclinedAction(action);
              setShowDeclinedActionDialog(true);
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Triage Dialog */}
      <Dialog open={showTriageDialog} onOpenChange={setShowTriageDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Triage: {selectedPatient?.firstName} {selectedPatient?.lastName}
            </DialogTitle>
            <DialogDescription>
              Review patient data and prepare brief for doctor approval
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Patient Summary */}
                {selectedPatient && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Patient Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Age:</span>
                          <span className="ml-2 font-medium">{selectedPatient.age || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Gender:</span>
                          <span className="ml-2 font-medium">{selectedPatient.gender}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">BMI:</span>
                          <span className="ml-2 font-medium">{selectedPatient.bmi || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Weight:</span>
                          <span className="ml-2 font-medium">{selectedPatient.currentWeight || "N/A"} kg</span>
                        </div>
                      </div>

                      {/* Contraindications Alert */}
                      {selectedPatient.hasContraindications && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center gap-2 text-red-700">
                            <AlertTriangle className="w-5 h-5" />
                            <span className="font-semibold">Potential Contraindications Detected</span>
                          </div>
                          <p className="text-sm text-red-600 mt-1">
                            This patient has flagged conditions that may contraindicate GLP-1 treatment. Review carefully.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Quiz Assessment Summary */}
                {selectedPatient?.assessment && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <ClipboardList className="w-4 h-4" />
                        Health Assessment (Quiz)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <span className="text-muted-foreground">Height:</span>
                          <span className="ml-1 font-medium">{selectedPatient.assessment.height || "—"} cm</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Goal:</span>
                          <span className="ml-1 font-medium">{selectedPatient.assessment.weightLossGoal || "—"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Target:</span>
                          <span className="ml-1 font-medium">{selectedPatient.assessment.targetWeight || "—"} kg</span>
                        </div>
                        {selectedPatient.intakePayment && (
                          <div>
                            <span className="text-muted-foreground">First month:</span>
                            <span className="ml-1 font-medium">
                              {selectedPatient.intakePayment.status === "PAID"
                                ? `Paid${selectedPatient.intakePayment.amountAud ? ` $${selectedPatient.intakePayment.amountAud}` : ""}`
                                : selectedPatient.intakePayment.status}
                            </span>
                          </div>
                        )}
                      </div>
                      {selectedPatient.assessment.motivations.length > 0 && (
                        <div>
                          <span className="text-muted-foreground">Motivations:</span>
                          <p className="mt-1">{selectedPatient.assessment.motivations.join(", ")}</p>
                        </div>
                      )}
                      {selectedPatient.assessment.currentMedications.filter(m => m && !m.toLowerCase().includes("none")).length > 0 && (
                        <div>
                          <span className="text-muted-foreground">Medications:</span>
                          <p className="mt-1">{selectedPatient.assessment.currentMedications.join(", ")}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Medical Conditions */}
                {selectedPatient && selectedPatient.medicalConditions.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Pill className="w-4 h-4" />
                        Medical Conditions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {selectedPatient.medicalConditions.map((condition) => (
                          <div
                            key={condition.id}
                            className={`p-3 rounded-lg border ${condition.isSevere ? "bg-red-50 border-red-200" : "bg-gray-50"}`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <span className={`font-medium ${condition.isSevere ? "text-red-700" : ""}`}>
                                  {condition.isSevere && <AlertCircle className="w-4 h-4 inline mr-1" />}
                                  {condition.title}
                                </span>
                                <p className="text-sm text-muted-foreground mt-1">{condition.content}</p>
                              </div>
                              {condition.isSevere && (
                                <Badge variant="destructive" className="text-xs">Severe</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Triage Score */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Triage Assessment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Triage Score (0-100)</Label>
                      <div className="flex items-center gap-4 mt-2">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={triageScore}
                          onChange={(e) => setTriageScore(Number(e.target.value))}
                          className="w-24"
                        />
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getTriageScoreColor(triageScore)}`}>
                          {triageScore >= 70 ? "High Risk" : triageScore >= 40 ? "Moderate Risk" : "Low Risk"}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Assign to Doctor for Review</Label>
                      <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select doctor..." />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map((doc) => (
                            <SelectItem key={doc.id} value={doc.id}>
                              Dr. {doc.firstName} {doc.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Recommendation</Label>
                      <Select value={recommendation} onValueChange={setRecommendation}>
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approve">Recommend Approval</SelectItem>
                          <SelectItem value="review">Needs Careful Review</SelectItem>
                          <SelectItem value="decline">Recommend Decline</SelectItem>
                          <SelectItem value="defer">Recommend Deferral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Patient Brief */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Patient Brief for Doctor</CardTitle>
                    <CardDescription>Edit the brief that will be sent to the reviewing doctor</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      value={patientBrief}
                      onChange={(e) => setPatientBrief(e.target.value)}
                      className="min-h-[200px] font-mono text-sm"
                    />

                    <div>
                      <Label>Additional Care Partner Notes</Label>
                      <Textarea
                        value={carePartnerNotes}
                        onChange={(e) => setCarePartnerNotes(e.target.value)}
                        placeholder="Add any observations or concerns not covered in the brief..."
                        className="mt-2"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </div>

          <Separator className="my-4" />

          <DialogFooter className="flex-shrink-0">
            <div className="flex items-center justify-between w-full">
              <Button
                variant="destructive"
                onClick={() => {
                  setShowEscalationDialog(true);
                }}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Escalate
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowTriageDialog(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCompleteTriage}
                  disabled={processing || !selectedDoctor}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Send className="w-4 h-4 mr-2" />
                  Complete & Send to Doctor
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Escalation Dialog */}
      <Dialog open={showEscalationDialog} onOpenChange={setShowEscalationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Escalate Patient
            </DialogTitle>
            <DialogDescription>
              This will immediately notify all doctors and flag the patient for urgent review
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Escalation Reason</Label>
              <Select value={escalationReason} onValueChange={setEscalationReason}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eating_disorder">History of Eating Disorder</SelectItem>
                  <SelectItem value="pregnancy">Pregnancy or Planning Pregnancy</SelectItem>
                  <SelectItem value="pancreatitis">History of Pancreatitis</SelectItem>
                  <SelectItem value="thyroid_cancer">Personal/Family History Thyroid Cancer</SelectItem>
                  <SelectItem value="severe_kidney">Severe Kidney Disease</SelectItem>
                  <SelectItem value="severe_liver">Severe Liver Disease</SelectItem>
                  <SelectItem value="type1_diabetes">Type 1 Diabetes</SelectItem>
                  <SelectItem value="multiple_conditions">Multiple High-Risk Conditions</SelectItem>
                  <SelectItem value="other">Other (specify in notes)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Additional Details</Label>
              <Textarea
                value={carePartnerNotes}
                onChange={(e) => setCarePartnerNotes(e.target.value)}
                placeholder="Provide additional context for the escalation..."
                className="mt-2"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEscalationDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleEscalate}
              disabled={processing || !escalationReason}
            >
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm Escalation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Declined Patient Action Dialog */}
      <Dialog open={showDeclinedActionDialog} onOpenChange={setShowDeclinedActionDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {declinedAction === "email" && <><MailWarning className="w-5 h-5 text-red-500" /> Send Decline Email</>}
              {declinedAction === "call" && <><PhoneCall className="w-5 h-5 text-blue-500" /> Schedule Patient Call</>}
              {declinedAction === "refund" && <><DollarSign className="w-5 h-5 text-green-500" /> Initiate Refund</>}
              {declinedAction === "review" && <><RefreshCcw className="w-5 h-5 text-amber-500" /> Schedule Re-review</>}
            </DialogTitle>
            <DialogDescription>
              {selectedPatient && `Patient: ${selectedPatient.firstName} ${selectedPatient.lastName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {declinedAction === "email" && (
              <>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  <strong>Note:</strong> This will send a compassionate decline email to the patient explaining their options.
                </div>
                <div>
                  <Label>Email Message (optional customization)</Label>
                  <Textarea
                    value={declineEmailContent}
                    onChange={(e) => setDeclineEmailContent(e.target.value)}
                    placeholder="Add any personalized message to include in the decline email..."
                    className="mt-2"
                    rows={4}
                  />
                </div>
              </>
            )}

            {declinedAction === "call" && (
              <>
                <div>
                  <Label>Call Purpose</Label>
                  <Select defaultValue="decline_discussion">
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="decline_discussion">Discuss Decline Decision</SelectItem>
                      <SelectItem value="alternative_options">Discuss Alternative Options</SelectItem>
                      <SelectItem value="gp_referral">Arrange GP Referral</SelectItem>
                      <SelectItem value="reapplication">Discuss Reapplication Process</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Call Notes / Talking Points</Label>
                  <Textarea
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="Notes for the call..."
                    className="mt-2"
                    rows={3}
                  />
                </div>
              </>
            )}

            {declinedAction === "refund" && (
              <>
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                  <strong>Warning:</strong> This will initiate a full refund of the consultation fee to the patient&apos;s original payment method.
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Refund will be processed within 5-10 business days.</p>
                  <p className="mt-2">Patient will receive an email confirmation of the refund.</p>
                </div>
              </>
            )}

            {declinedAction === "review" && (
              <>
                <div>
                  <Label>Re-review Date</Label>
                  <Input
                    type="date"
                    value={reviewDate}
                    onChange={(e) => setReviewDate(e.target.value)}
                    className="mt-2"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <Label>Reason for Re-review</Label>
                  <Select defaultValue="health_change">
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="health_change">Health Circumstances Changed</SelectItem>
                      <SelectItem value="test_results">New Test Results Available</SelectItem>
                      <SelectItem value="medication_change">Medication Changes</SelectItem>
                      <SelectItem value="patient_request">Patient Request</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="Additional notes for the re-review..."
                    className="mt-2"
                    rows={2}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeclinedActionDialog(false);
              setDeclinedAction(null);
              setDeclineEmailContent("");
              setCallNotes("");
              setReviewDate("");
            }}>
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!selectedPatient) return;
                setProcessing(true);
                try {
                  const res = await fetch("/api/admin/declined-actions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      userId: selectedPatient.id,
                      action: declinedAction,
                      emailContent: declineEmailContent,
                      callNotes,
                      reviewDate,
                    }),
                  });
                  if (res.ok) {
                    toast.success(
                      declinedAction === "email" ? "Decline email sent" :
                      declinedAction === "call" ? "Call scheduled" :
                      declinedAction === "refund" ? "Refund initiated" :
                      "Re-review scheduled"
                    );
                    setShowDeclinedActionDialog(false);
                    setDeclinedAction(null);
                    fetchTriageQueue();
                  } else {
                    const error = await res.json();
                    toast.error(error.error || "Action failed");
                  }
                } catch (error) {
                  console.error("Error:", error);
                  toast.error("Action failed");
                } finally {
                  setProcessing(false);
                }
              }}
              disabled={processing || (declinedAction === "review" && !reviewDate)}
              className={declinedAction === "refund" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {declinedAction === "email" && "Send Email"}
              {declinedAction === "call" && "Schedule Call"}
              {declinedAction === "refund" && "Confirm Refund"}
              {declinedAction === "review" && "Schedule Re-review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Patient List Component
interface PatientListProps {
  patients: Patient[];
  carePartners: CarePartner[];
  onStartTriage?: (patientId: string) => void;
  onOpenTriage?: (patient: Patient) => void;
  onAssignCarePartner?: (patientId: string, carePartnerId: string) => void;
  onDeclinedAction?: (patient: Patient, action: "email" | "call" | "refund" | "review") => void;
  getStatusBadge: (status: string) => React.ReactNode;
  getTriageScoreColor: (score: number | null) => string;
  showAssignment?: boolean;
  viewOnly?: boolean;
  prePayment?: boolean;
  declined?: boolean;
  pendingTests?: boolean;
}

function PatientList({
  patients,
  carePartners,
  onStartTriage,
  onOpenTriage,
  onAssignCarePartner,
  onDeclinedAction,
  getStatusBadge,
  getTriageScoreColor,
  showAssignment,
  viewOnly,
  prePayment,
  declined,
  pendingTests,
}: PatientListProps) {
  if (patients.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <p className="text-lg font-medium">No patients in this queue</p>
          <p className="text-muted-foreground">Check other tabs or refresh</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {patients.map((patient) => (
        <Card
          key={patient.id}
          className={`hover:shadow-md transition-shadow ${patient.hasContraindications ? "border-red-300" : ""}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className={`text-lg ${patient.hasContraindications ? "bg-red-100 text-red-700" : "bg-primary/10 text-primary"}`}>
                    {patient.firstName[0]}{patient.lastName[0]}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{patient.firstName} {patient.lastName}</span>
                    {getStatusBadge(patient.journeyStatus)}
                    {patient.hasContraindications && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Alert
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {patient.email}
                    </span>
                    {patient.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {patient.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* Metrics */}
                <div className="text-right text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">BMI:</span>
                    <span className="font-medium">{patient.bmi || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Age:</span>
                    <span className="font-medium">{patient.age || "N/A"}</span>
                  </div>
                </div>

                {/* Triage Score */}
                {patient.triageScore !== null && (
                  <div className={`px-3 py-2 rounded-lg text-center ${getTriageScoreColor(patient.triageScore)}`}>
                    <div className="text-xs">Triage</div>
                    <div className="text-lg font-bold">{patient.triageScore}</div>
                  </div>
                )}

                {/* Medical conditions count */}
                {patient.medicalConditions.length > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Pill className="w-3 h-3" />
                    {patient.medicalConditions.length}
                  </Badge>
                )}

                {/* Actions */}
                {prePayment && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-amber-600 border-amber-300">
                      Awaiting Payment
                    </Badge>
                    <Link href={`/admin/crm/customers/${patient.id}`}>
                      <Button variant="outline" size="sm">
                        View Profile
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                )}

                {showAssignment && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={patient.assignedCarePartnerId || ""}
                      onValueChange={(value) => onAssignCarePartner?.(patient.id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Assign CP..." />
                      </SelectTrigger>
                      <SelectContent>
                        {carePartners.map((cp) => (
                          <SelectItem key={cp.id} value={cp.id}>
                            {cp.firstName} {cp.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={() => onStartTriage?.(patient.id)}>
                      Start Triage
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}

                {!showAssignment && !viewOnly && !prePayment && (
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/crm/customers/${patient.id}`}>
                      <Button variant="outline" size="sm">
                        <User className="w-4 h-4 mr-1" />
                        Full Profile
                      </Button>
                    </Link>
                    <Button onClick={() => onOpenTriage?.(patient)}>
                      <FileText className="w-4 h-4 mr-2" />
                      Review & Brief
                    </Button>
                  </div>
                )}

                {viewOnly && (
                  <Link href={`/admin/crm/customers/${patient.id}`}>
                    <Button variant="outline">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                )}

                {/* Declined Patient Actions */}
                {declined && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeclinedAction?.(patient, "email")}
                    >
                      <MailWarning className="w-4 h-4 mr-1" />
                      Send Decline Email
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeclinedAction?.(patient, "call")}
                    >
                      <PhoneCall className="w-4 h-4 mr-1" />
                      Schedule Call
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeclinedAction?.(patient, "review")}
                    >
                      <RefreshCcw className="w-4 h-4 mr-1" />
                      Schedule Re-review
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeclinedAction?.(patient, "refund")}
                      className="text-red-600 hover:text-red-700"
                    >
                      <DollarSign className="w-4 h-4 mr-1" />
                      Initiate Refund
                    </Button>
                    <Link href={`/admin/crm/customers/${patient.id}`}>
                      <Button variant="outline" size="sm">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Pending Tests Actions */}
                {pendingTests && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                      <TestTube className="w-3 h-3 mr-1" />
                      Awaiting Blood Tests
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeclinedAction?.(patient, "call")}
                    >
                      <PhoneCall className="w-4 h-4 mr-1" />
                      Follow Up
                    </Button>
                    <Link href={`/admin/crm/customers/${patient.id}`}>
                      <Button variant="default" size="sm">
                        <FlaskConical className="w-4 h-4 mr-1" />
                        Upload Results
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
