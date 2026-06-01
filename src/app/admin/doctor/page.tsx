"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
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
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  Calendar,
  Scale,
  User,
  Stethoscope,
  ClipboardList,
  FlaskConical,
  Heart,
  Activity,
  ChevronRight,
  RefreshCw,
  Users,
  MessageSquare,
  FileText,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format, isToday, isTomorrow, isPast, formatDistanceToNow } from "date-fns";
import Link from "next/link";

// Types
interface Consultation {
  id: string;
  scheduledAt: string;
  duration: number;
  status: string;
  completedAt: string | null;
  appointmentType: string;
  doctorId: string | null;
  doctorName: string | null;
  patientPhone: string | null;
  patientBmi: number | null;
  riskFlags: string[];
  selectedPlan: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone: string | null;
    dateOfBirth: string | null;
    gender: string;
    journeyStatus: string;
    approvalStatus: string;
    triageScore: number | null;
    currentWeight: number | null;
    healthProfile: {
      systolicBP: number | null;
      diastolicBP: number | null;
      onBPMedication: boolean;
    } | null;
    medicalNotes: Array<{
      id: string;
      title: string;
      content: string;
      createdAt: string;
      isPinned: boolean;
    }>;
  };
  notes: string | null;
  isCallCompleted: boolean;
  isAwaitingDecision: boolean;
  isPast: boolean;
}

interface PatientBrief {
  patient: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    age: number | null;
    gender: string;
    address: string;
  };
  status: {
    journeyStatus: string;
    approvalStatus: string;
    triageScore: number | null;
    selectedPlan: string | null;
  };
  metrics: {
    currentWeight: number | null;
    startWeight: number | null;
    targetWeight: number | null;
    height: number | null;
    bmi: number | null;
    bmiCategory: string | null;
  };
  healthProfile: {
    bloodPressure: {
      systolic: number | null;
      diastolic: number | null;
      onMedication: boolean;
    } | null;
    smokingStatus: string;
    familyHistoryCVD: boolean;
  };
  medicalHistory: {
    conditions: {
      metabolic: string[];
      digestive: string[];
      cardiovascular: string[];
      mentalHealth: string[];
      serious: string[];
    };
    currentMedications: string[];
    hasContraindications: boolean;
  };
  riskAssessment: {
    riskFlags: string[];
    riskLevel: string;
    triageScore: number | null;
    recommendation: string;
  };
  patientGoals: {
    weightLossGoal: string;
    motivations: string[];
    previousAttempts: string[];
  };
  clinicalNotes: Array<{
    id: string;
    title: string;
    content: string;
    category: string;
    isPinned: boolean;
    createdAt: string;
    author: string | null;
  }>;
}

// Update DecisionOptions interface to remove medications and add medicationForms
interface DecisionOptions {
  medicationForms: string[];
  declineReasons: Array<{ id: string; text: string }>;
  bloodTests: Array<{
    id: string;
    name: string;
    description: string;
    reason: string;
  }>;
  followUpOptions: Array<{ id: string; label: string }>;
  repeatsOptions: Array<{ value: number; label: string }>;
  frequencyOptions: Array<{ id: string; label: string }>;
  quantityUnits: string[];
}

// Patient type for My Patients tab
interface DoctorPatient {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string | null;
  age: number | null;
  gender: string;
  journeyStatus: string;
  approvalStatus: string;
  subscriptionStatus: string;
  subscriptionTier: string | null;
  triageScore: number | null;
  currentWeight: number | null;
  targetWeight: number | null;
  bmi: number | null;
  createdAt: string;
  consultation: {
    id: string;
    scheduledAt: string;
    status: string;
    completedAt: string | null;
    selectedPlan: string | null;
  } | null;
  prescription: {
    id: string;
    medicationName: string;
    status: string;
    scriptStatus: string;
  } | null;
}

// Care Communication type
interface CareCommunication {
  id: string;
  userId: string;
  patientName: string;
  type: string;
  priority: string | null;
  subject: string | null;
  notes: string | null;
  status: string;
  dueDate: string | null;
  createdAt: string;
}

export default function DoctorDashboardPage() {
  // Main view state
  const [mainView, setMainView] = useState<"consultations" | "patients" | "care-comms">("consultations");
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [patientBrief, setPatientBrief] = useState<PatientBrief | null>(null);
  const [loadingBrief, setLoadingBrief] = useState(false);
  const [decisionOptions, setDecisionOptions] = useState<DecisionOptions | null>(null);
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState("today");
  const [counts, setCounts] = useState({
    total: 0,
    pending: 0,
    awaitingDecision: 0,
    completed: 0,
    todayCount: 0,
  });

  // My Patients state
  const [patients, setPatients] = useState<DoctorPatient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientStats, setPatientStats] = useState({
    totalPatients: 0,
    activePatients: 0,
    pendingApproval: 0,
    approved: 0,
    declined: 0,
    pendingCareComms: 0,
    highPriorityCareComms: 0,
  });

  // Care Communications state
  const [careCommunications, setCareCommunications] = useState<CareCommunication[]>([]);
  const [loadingCareComs, setLoadingCareComs] = useState(false);

  // Decision form state
  const [decisionType, setDecisionType] = useState<"APPROVED" | "DECLINED" | "APPROVED_PENDING_TESTS" | "APPROVED_NO_TREATMENT" | null>(null);
  const [consultationCompleted, setConsultationCompleted] = useState(false);
  const [clinicalNotes, setClinicalNotes] = useState("");
  // Manual medication entry fields
  const [medicationName, setMedicationName] = useState("");
  const [medicationGenericName, setMedicationGenericName] = useState("");
  const [medicationStrength, setMedicationStrength] = useState("");
  const [medicationForm, setMedicationForm] = useState("");
  const [medicationDosage, setMedicationDosage] = useState("");
  const [medicationFrequency, setMedicationFrequency] = useState("");
  const [medicationQuantity, setMedicationQuantity] = useState("");
  const [medicationQuantityUnit, setMedicationQuantityUnit] = useState("");
  const [repeats, setRepeats] = useState(2);
  const [contraindicationsReviewed, setContraindicationsReviewed] = useState(false);
  const [patientCounsellingDocumented, setPatientCounsellingDocumented] = useState(false);
  const [followUpTiming, setFollowUpTiming] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [declineReasonOther, setDeclineReasonOther] = useState("");
  const [safeNextStepGuidance, setSafeNextStepGuidance] = useState("");
  const [carePartnerFollowUpRequired, setCarePartnerFollowUpRequired] = useState(true);
  const [gpReferralSuggested, setGpReferralSuggested] = useState(false);
  const [testsRequired, setTestsRequired] = useState<string[]>([]);
  const [reasonForTests, setReasonForTests] = useState("");
  const [treatmentMustWaitForResults, setTreatmentMustWaitForResults] = useState(true);
  const [testFollowUpTimeframe, setTestFollowUpTimeframe] = useState("2 weeks");

  useEffect(() => {
    fetchConsultations();
    fetchDecisionOptions();
  }, []);

  useEffect(() => {
    if (mainView === "patients" || mainView === "care-comms") {
      fetchPatientsAndCareComs();
    }
  }, [mainView]);

  const fetchPatientsAndCareComs = async () => {
    try {
      setLoadingPatients(true);
      setLoadingCareComs(true);
      const res = await fetch("/api/admin/doctor/my-patients?includeCareComs=true");
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients);
        setCareCommunications(data.careCommunications);
        setPatientStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Failed to load patients");
    } finally {
      setLoadingPatients(false);
      setLoadingCareComs(false);
    }
  };

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/doctor/consultations");
      if (res.ok) {
        const data = await res.json();
        setConsultations(data.consultations);
        setCounts(data.counts);
      }
    } catch (error) {
      console.error("Error fetching consultations:", error);
      toast.error("Failed to load consultations");
    } finally {
      setLoading(false);
    }
  };

  const fetchDecisionOptions = async () => {
    try {
      const res = await fetch("/api/admin/doctor/decision");
      if (res.ok) {
        const data = await res.json();
        setDecisionOptions(data);
      }
    } catch (error) {
      console.error("Error fetching decision options:", error);
    }
  };

  const fetchPatientBrief = async (patientId: string) => {
    try {
      setLoadingBrief(true);
      const res = await fetch(`/api/admin/doctor/patient-brief/${patientId}`);
      if (res.ok) {
        const data = await res.json();
        setPatientBrief(data);
      }
    } catch (error) {
      console.error("Error fetching patient brief:", error);
      toast.error("Failed to load patient brief");
    } finally {
      setLoadingBrief(false);
    }
  };

  const openPatientBrief = (consultation: Consultation) => {
    setSelectedConsultation(consultation);
    fetchPatientBrief(consultation.patient.id);
  };

  const markCallCompleted = async (consultationId: string) => {
    try {
      const res = await fetch("/api/admin/doctor/consultations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consultationId, callCompleted: true }),
      });
      if (res.ok) {
        toast.success("Call marked as completed");
        fetchConsultations();
        if (selectedConsultation?.id === consultationId) {
          setSelectedConsultation({ ...selectedConsultation, isCallCompleted: true, isAwaitingDecision: true });
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to update");
    }
  };

  const openDecisionDialog = (type: "APPROVED" | "DECLINED" | "APPROVED_PENDING_TESTS" | "APPROVED_NO_TREATMENT") => {
    setDecisionType(type);
    setConsultationCompleted(false);
    setClinicalNotes("");
    setMedicationName("");
    setMedicationGenericName("");
    setMedicationStrength("");
    setMedicationForm("");
    setMedicationDosage("");
    setMedicationFrequency("");
    setMedicationQuantity("");
    setMedicationQuantityUnit("");
    setRepeats(2);
    setContraindicationsReviewed(false);
    setPatientCounsellingDocumented(false);
    setFollowUpTiming("");
    setDeclineReason("");
    setDeclineReasonOther("");
    setSafeNextStepGuidance("");
    setCarePartnerFollowUpRequired(true);
    setGpReferralSuggested(false);
    setTestsRequired([]);
    setReasonForTests("");
    setTreatmentMustWaitForResults(true);
    setTestFollowUpTimeframe("2 weeks");
    setShowDecisionDialog(true);
  };

  const submitDecision = async () => {
    if (!selectedConsultation || !decisionType) return;
    setProcessing(true);
    try {
      const payload: Record<string, unknown> = {
        userId: selectedConsultation.patient.id,
        consultationId: selectedConsultation.id,
        decision: decisionType,
        consultationCompleted,
        clinicalNotes,
      };
      if (decisionType === "APPROVED") {
        // Send prescribeTreatment flag and individual medication fields (backend expects this format)
        payload.prescribeTreatment = true;
        payload.medicationName = medicationName;
        payload.genericName = medicationGenericName;
        payload.strength = medicationStrength;
        payload.form = medicationForm;
        payload.dosage = medicationDosage;
        payload.frequency = medicationFrequency;
        payload.quantity = parseInt(medicationQuantity) || 1;
        payload.quantityUnit = medicationQuantityUnit;
        payload.repeats = repeats;
        payload.contraindicationsReviewed = contraindicationsReviewed;
        payload.patientCounsellingDocumented = patientCounsellingDocumented;
        payload.followUpTiming = followUpTiming;
      } else if (decisionType === "APPROVED_NO_TREATMENT") {
        payload.noTreatment = true;
        payload.contraindicationsReviewed = contraindicationsReviewed;
        payload.patientCounsellingDocumented = patientCounsellingDocumented;
        payload.followUpTiming = followUpTiming;
      } else if (decisionType === "DECLINED") {
        payload.declineReason = declineReason;
        payload.declineReasonOther = declineReasonOther;
        payload.safeNextStepGuidance = safeNextStepGuidance;
        payload.carePartnerFollowUpRequired = carePartnerFollowUpRequired;
        payload.gpReferralSuggested = gpReferralSuggested;
      } else if (decisionType === "APPROVED_PENDING_TESTS") {
        payload.testsRequired = testsRequired;
        payload.reasonForTests = reasonForTests;
        payload.treatmentMustWaitForResults = treatmentMustWaitForResults;
        payload.testFollowUpTimeframe = testFollowUpTimeframe;
      }
      const res = await fetch("/api/admin/doctor/decision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const result = await res.json();
        toast.success(result.message || "Decision submitted");
        setShowDecisionDialog(false);
        setSelectedConsultation(null);
        setPatientBrief(null);
        fetchConsultations();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (c: Consultation) => {
    if (c.status === "BOOKING_COMPLETED") return <Badge className="bg-green-100 text-green-700">Completed</Badge>;
    if (c.isAwaitingDecision) return <Badge className="bg-amber-100 text-amber-700">Awaiting Decision</Badge>;
    if (c.isCallCompleted) return <Badge className="bg-blue-100 text-blue-700">Call Done</Badge>;
    if (isPast(new Date(c.scheduledAt))) return <Badge className="bg-red-100 text-red-700">Overdue</Badge>;
    return <Badge className="bg-slate-100 text-slate-700">Scheduled</Badge>;
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return `Today at ${format(date, "h:mm a")}`;
    if (isTomorrow(date)) return `Tomorrow at ${format(date, "h:mm a")}`;
    return format(date, "EEE, d MMM 'at' h:mm a");
  };

  const getRiskBadge = (level: string) => {
    if (level === "HIGH") return <Badge className="bg-red-100 text-red-700">High Risk</Badge>;
    if (level === "MODERATE") return <Badge className="bg-amber-100 text-amber-700">Moderate</Badge>;
    return <Badge className="bg-green-100 text-green-700">Low Risk</Badge>;
  };

  const getApprovalBadge = (status: string) => {
    if (status === "APPROVED") return <Badge className="bg-green-100 text-green-700">Approved</Badge>;
    if (status === "DECLINED") return <Badge className="bg-red-100 text-red-700">Declined</Badge>;
    if (status === "APPROVED_WITH_TESTS") return <Badge className="bg-blue-100 text-blue-700">Tests Pending</Badge>;
    return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
  };

  const getPriorityBadge = (priority: string | null) => {
    if (priority === "HIGH") return <Badge className="bg-red-100 text-red-700">High</Badge>;
    if (priority === "URGENT") return <Badge className="bg-red-500 text-white">Urgent</Badge>;
    return <Badge variant="outline">Normal</Badge>;
  };

  const filtered = consultations.filter((c) => {
    if (activeTab === "today") return isToday(new Date(c.scheduledAt));
    if (activeTab === "pending") return c.status === "BOOKING_CONFIRMED" && !c.isCallCompleted;
    if (activeTab === "awaiting") return c.isAwaitingDecision;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Doctor Dashboard</h1>
            <p className="text-slate-500">Manage consultations, patients, and care communications</p>
          </div>
          <Button onClick={() => { fetchConsultations(); fetchPatientsAndCareComs(); }} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-lg"><Calendar className="w-5 h-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{counts.todayCount}</p><p className="text-sm text-slate-500">Today</p></div></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-amber-100 rounded-lg"><Clock className="w-5 h-5 text-amber-600" /></div><div><p className="text-2xl font-bold">{counts.pending}</p><p className="text-sm text-slate-500">Pending</p></div></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-purple-100 rounded-lg"><ClipboardList className="w-5 h-5 text-purple-600" /></div><div><p className="text-2xl font-bold">{counts.awaitingDecision}</p><p className="text-sm text-slate-500">Decisions</p></div></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-green-100 rounded-lg"><CheckCircle2 className="w-5 h-5 text-green-600" /></div><div><p className="text-2xl font-bold">{counts.completed}</p><p className="text-sm text-slate-500">Completed</p></div></div></CardContent></Card>
          <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-slate-100 rounded-lg"><Users className="w-5 h-5 text-slate-600" /></div><div><p className="text-2xl font-bold">{patientStats.totalPatients}</p><p className="text-sm text-slate-500">My Patients</p></div></div></CardContent></Card>
        </div>

        {/* Main navigation tabs */}
        <Tabs value={mainView} onValueChange={(v) => setMainView(v as typeof mainView)}>
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="consultations" className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4" />Consultations
              {counts.pending > 0 && <Badge className="ml-1 bg-amber-500 text-white text-xs">{counts.pending}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="patients" className="flex items-center gap-2">
              <Users className="w-4 h-4" />My Patients
            </TabsTrigger>
            <TabsTrigger value="care-comms" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />Care Comms
              {patientStats.highPriorityCareComms > 0 && <Badge className="ml-1 bg-red-500 text-white text-xs">{patientStats.highPriorityCareComms}</Badge>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="consultations" className="mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-lg">Consultations</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full rounded-none border-b">
                    <TabsTrigger value="today" className="flex-1">Today</TabsTrigger>
                    <TabsTrigger value="pending" className="flex-1">Pending</TabsTrigger>
                    <TabsTrigger value="awaiting" className="flex-1">Decisions</TabsTrigger>
                  </TabsList>
                  <ScrollArea className="h-[600px]">
                    <div className="p-3 space-y-2">
                      {filtered.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                          <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No consultations</p>
                        </div>
                      ) : filtered.map((c) => (
                        <button key={c.id} onClick={() => openPatientBrief(c)} className={`w-full text-left p-3 rounded-lg border transition-all ${selectedConsultation?.id === c.id ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8"><AvatarFallback className="bg-slate-200 text-slate-700 text-xs">{c.patient.firstName[0]}{c.patient.lastName[0]}</AvatarFallback></Avatar>
                              <div><p className="font-medium text-sm">{c.patient.fullName}</p><p className="text-xs text-slate-500">{formatTime(c.scheduledAt)}</p></div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </div>
                          <div className="flex items-center gap-2 flex-wrap">
                            {getStatusBadge(c)}
                            {c.riskFlags.length > 0 && <Badge className="bg-red-50 text-red-600 text-xs">{c.riskFlags.length} flags</Badge>}
                            {c.patientBmi && <Badge variant="outline" className="text-xs">BMI {c.patientBmi.toFixed(1)}</Badge>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            {!selectedConsultation ? (
              <Card className="h-full flex items-center justify-center"><CardContent className="text-center py-16"><User className="w-16 h-16 mx-auto mb-4 text-slate-300" /><h3 className="text-lg font-medium text-slate-700">Select a Patient</h3></CardContent></Card>
            ) : loadingBrief ? (
              <Card className="h-full flex items-center justify-center"><CardContent className="text-center py-16"><Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" /></CardContent></Card>
            ) : patientBrief ? (
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14"><AvatarFallback className="bg-blue-100 text-blue-700 text-lg">{patientBrief.patient.fullName.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                        <div>
                          <h2 className="text-xl font-bold">{patientBrief.patient.fullName}</h2>
                          <div className="flex items-center gap-3 text-sm text-slate-500">
                            <span>{patientBrief.patient.age} years</span><span>•</span><span>{patientBrief.patient.gender}</span><span>•</span><span>{patientBrief.status.selectedPlan || "No plan"}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">{getRiskBadge(patientBrief.riskAssessment.riskLevel)}<Badge variant="outline">Triage: {patientBrief.status.triageScore || "N/A"}</Badge></div>
                        </div>
                      </div>
                      {selectedConsultation.patientPhone && <Button variant="outline" size="sm" asChild><a href={`tel:${selectedConsultation.patientPhone}`}><Phone className="w-4 h-4 mr-2" />Call</a></Button>}
                    </div>
                  </CardContent>
                </Card>

                {patientBrief.riskAssessment.riskFlags.length > 0 && (
                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-red-800">Risk Flags</h3>
                          <ul className="mt-1 space-y-1">{patientBrief.riskAssessment.riskFlags.map((f, i) => <li key={i} className="text-sm text-red-700">• {f}</li>)}</ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card><CardContent className="p-3 text-center"><Scale className="w-5 h-5 mx-auto mb-1 text-slate-400" /><p className="text-xl font-bold">{patientBrief.metrics.currentWeight || "—"} kg</p><p className="text-xs text-slate-500">Weight</p></CardContent></Card>
                  <Card><CardContent className="p-3 text-center"><Activity className="w-5 h-5 mx-auto mb-1 text-slate-400" /><p className="text-xl font-bold">{patientBrief.metrics.bmi?.toFixed(1) || "—"}</p><p className="text-xs text-slate-500">BMI</p></CardContent></Card>
                  <Card><CardContent className="p-3 text-center"><Heart className="w-5 h-5 mx-auto mb-1 text-slate-400" /><p className="text-xl font-bold">{patientBrief.healthProfile.bloodPressure?.systolic || "—"}/{patientBrief.healthProfile.bloodPressure?.diastolic || "—"}</p><p className="text-xs text-slate-500">BP</p></CardContent></Card>
                  <Card><CardContent className="p-3 text-center"><Stethoscope className="w-5 h-5 mx-auto mb-1 text-slate-400" /><p className="text-xl font-bold">{patientBrief.metrics.targetWeight || "—"} kg</p><p className="text-xs text-slate-500">Target</p></CardContent></Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Medical Conditions</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0">
                      <ScrollArea className="h-[180px]">
                        <div className="space-y-3">
                          {patientBrief.medicalHistory.conditions.serious.length > 0 && <div><p className="text-xs font-semibold text-red-600 mb-1">Serious</p><div className="flex flex-wrap gap-1">{patientBrief.medicalHistory.conditions.serious.map((c, i) => <Badge key={i} className="bg-red-50 text-red-700 text-xs">{c}</Badge>)}</div></div>}
                          {patientBrief.medicalHistory.conditions.metabolic.filter(c => c !== "None of these apply").length > 0 && <div><p className="text-xs font-semibold text-slate-600 mb-1">Metabolic</p><div className="flex flex-wrap gap-1">{patientBrief.medicalHistory.conditions.metabolic.filter(c => c !== "None of these apply").map((c, i) => <Badge key={i} variant="outline" className="text-xs">{c}</Badge>)}</div></div>}
                          {patientBrief.medicalHistory.currentMedications.length > 0 && <div><p className="text-xs font-semibold text-slate-600 mb-1">Medications</p><div className="flex flex-wrap gap-1">{patientBrief.medicalHistory.currentMedications.map((m, i) => <Badge key={i} className="bg-purple-50 text-purple-700 text-xs">{m}</Badge>)}</div></div>}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Patient Goals</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0">
                      <ScrollArea className="h-[180px]">
                        <div className="space-y-3">
                          <div><p className="text-xs font-semibold text-slate-600 mb-1">Weight Loss Goal</p><p className="text-sm">{patientBrief.patientGoals.weightLossGoal || "Not specified"}</p></div>
                          {patientBrief.patientGoals.motivations.length > 0 && <div><p className="text-xs font-semibold text-slate-600 mb-1">Motivations</p><div className="flex flex-wrap gap-1">{patientBrief.patientGoals.motivations.map((m, i) => <Badge key={i} className="bg-green-50 text-green-700 text-xs">{m}</Badge>)}</div></div>}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                {patientBrief.clinicalNotes.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Clinical Notes</CardTitle></CardHeader>
                    <CardContent className="p-4 pt-0">
                      <ScrollArea className="h-[120px]">
                        <div className="space-y-2">{patientBrief.clinicalNotes.slice(0,3).map((n) => <div key={n.id} className="p-2 bg-slate-50 rounded"><p className="text-xs font-semibold">{n.title}</p><p className="text-xs text-slate-600 line-clamp-2">{n.content}</p></div>)}</div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                )}

                <Card className="border-2 border-dashed border-slate-300">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4">Doctor Decision</h3>
                    {!selectedConsultation.isCallCompleted ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-amber-50 rounded-lg">
                          <div className="flex items-center gap-2 text-amber-700"><Phone className="w-5 h-5" /><span className="font-medium">Call patient to complete consultation</span></div>
                          <p className="text-sm text-amber-600 mt-1">Phone: {selectedConsultation.patientPhone || patientBrief.patient.phone || "Not available"}</p>
                        </div>
                        <Button onClick={() => markCallCompleted(selectedConsultation.id)} className="w-full"><CheckCircle2 className="w-4 h-4 mr-2" />Mark Call Completed</Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-500 mb-4">Select decision:</p>
                        <div className="grid grid-cols-4 gap-3">
                          <Button onClick={() => openDecisionDialog("APPROVED")} className="bg-green-600 hover:bg-green-700 h-auto py-4 flex-col"><CheckCircle2 className="w-6 h-6 mb-1" /><span className="font-semibold">Approve</span><span className="text-xs opacity-80">Prescribe</span></Button>
                          <Button onClick={() => openDecisionDialog("APPROVED_NO_TREATMENT")} className="bg-blue-600 hover:bg-blue-700 h-auto py-4 flex-col"><CheckCircle2 className="w-6 h-6 mb-1" /><span className="font-semibold">Approve</span><span className="text-xs opacity-80">No Treatment</span></Button>
                          <Button onClick={() => openDecisionDialog("DECLINED")} variant="destructive" className="h-auto py-4 flex-col"><XCircle className="w-6 h-6 mb-1" /><span className="font-semibold">Decline</span><span className="text-xs opacity-80">Refund</span></Button>
                          <Button onClick={() => openDecisionDialog("APPROVED_PENDING_TESTS")} className="bg-amber-600 hover:bg-amber-700 h-auto py-4 flex-col"><FlaskConical className="w-6 h-6 mb-1" /><span className="font-semibold">Tests</span><span className="text-xs opacity-80">Blood work</span></Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </div>
        </div>
          </TabsContent>

          {/* My Patients Tab */}
          <TabsContent value="patients" className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 rounded-lg"><Users className="w-5 h-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{patientStats.totalPatients}</p><p className="text-sm text-slate-500">Total Patients</p></div></div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-green-100 rounded-lg"><CheckCircle2 className="w-5 h-5 text-green-600" /></div><div><p className="text-2xl font-bold">{patientStats.approved}</p><p className="text-sm text-slate-500">Approved</p></div></div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-amber-100 rounded-lg"><Clock className="w-5 h-5 text-amber-600" /></div><div><p className="text-2xl font-bold">{patientStats.pendingApproval}</p><p className="text-sm text-slate-500">Pending</p></div></div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-purple-100 rounded-lg"><TrendingUp className="w-5 h-5 text-purple-600" /></div><div><p className="text-2xl font-bold">{patientStats.activePatients}</p><p className="text-sm text-slate-500">Active</p></div></div></CardContent></Card>
              </div>

              <Card>
                <CardHeader><CardTitle>My Patients</CardTitle></CardHeader>
                <CardContent>
                  {loadingPatients ? (
                    <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
                  ) : patients.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="font-medium">No patients assigned yet</p>
                      <p className="text-sm mt-1">Patients will appear here after consultations are assigned to you</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {patients.map((patient) => (
                        <div key={patient.id} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10"><AvatarFallback className="bg-blue-100 text-blue-700">{patient.firstName[0]}{patient.lastName[0]}</AvatarFallback></Avatar>
                              <div>
                                <p className="font-medium">{patient.fullName}</p>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                  {patient.age && <span>{patient.age}y</span>}
                                  <span>•</span>
                                  <span>{patient.gender}</span>
                                  {patient.subscriptionTier && <><span>•</span><span className="capitalize">{patient.subscriptionTier.replace(/_/g, ' ')}</span></>}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getApprovalBadge(patient.approvalStatus)}
                              <Button variant="outline" size="sm" asChild><Link href={`/admin/crm/customers/${patient.id}`}><FileText className="w-4 h-4 mr-1" />View</Link></Button>
                            </div>
                          </div>
                          <div className="mt-3 grid grid-cols-4 gap-4 text-sm">
                            <div><p className="text-slate-500">Weight</p><p className="font-medium">{patient.currentWeight ? `${patient.currentWeight} kg` : "—"}</p></div>
                            <div><p className="text-slate-500">BMI</p><p className="font-medium">{patient.bmi?.toFixed(1) || "—"}</p></div>
                            <div><p className="text-slate-500">Last Consultation</p><p className="font-medium">{patient.consultation?.scheduledAt ? format(new Date(patient.consultation.scheduledAt), "d MMM") : "—"}</p></div>
                            <div><p className="text-slate-500">Prescription</p><p className="font-medium">{patient.prescription?.medicationName || "None"}</p></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Care Communications Tab */}
          <TabsContent value="care-comms" className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-amber-100 rounded-lg"><MessageSquare className="w-5 h-5 text-amber-600" /></div><div><p className="text-2xl font-bold">{patientStats.pendingCareComms}</p><p className="text-sm text-slate-500">Pending Tasks</p></div></div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-red-100 rounded-lg"><AlertCircle className="w-5 h-5 text-red-600" /></div><div><p className="text-2xl font-bold">{patientStats.highPriorityCareComms}</p><p className="text-sm text-slate-500">High Priority</p></div></div></CardContent></Card>
                <Card><CardContent className="p-4"><div className="flex items-center gap-3"><div className="p-2 bg-green-100 rounded-lg"><CheckCircle2 className="w-5 h-5 text-green-600" /></div><div><p className="text-2xl font-bold">{careCommunications.filter(c => c.status === "COMPLETED").length}</p><p className="text-sm text-slate-500">Completed</p></div></div></CardContent></Card>
              </div>

              <Card>
                <CardHeader><CardTitle>Care Communications</CardTitle></CardHeader>
                <CardContent>
                  {loadingCareComs ? (
                    <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>
                  ) : careCommunications.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
                      <p className="font-medium">No care communications</p>
                      <p className="text-sm mt-1">Tasks related to your patients will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {careCommunications.map((cc) => (
                        <div key={cc.id} className="p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {getPriorityBadge(cc.priority)}
                                <Badge variant="outline" className="capitalize">{cc.type.replace(/_/g, ' ')}</Badge>
                              </div>
                              <p className="font-medium">{cc.subject || "Care Task"}</p>
                              <p className="text-sm text-slate-500 mt-1">Patient: <Link href={`/admin/crm/customers/${cc.userId}`} className="text-blue-600 hover:underline">{cc.patientName}</Link></p>
                              {cc.notes && <p className="text-sm text-slate-600 mt-2 line-clamp-2">{cc.notes}</p>}
                            </div>
                            <div className="text-right text-sm text-slate-500">
                              {cc.dueDate && <p className="font-medium text-amber-600">Due: {format(new Date(cc.dueDate), "d MMM")}</p>}
                              <p className="mt-1">Created {formatDistanceToNow(new Date(cc.createdAt), { addSuffix: true })}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showDecisionDialog} onOpenChange={setShowDecisionDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {decisionType === "APPROVED" && "Approve Patient"}
              {decisionType === "APPROVED_NO_TREATMENT" && "Approve Patient (No Treatment)"}
              {decisionType === "DECLINED" && "Decline Patient"}
              {decisionType === "APPROVED_PENDING_TESTS" && "Approve Pending Tests"}
            </DialogTitle>
            <DialogDescription>Complete the required fields below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="consultationCompleted" checked={consultationCompleted} onCheckedChange={(c) => setConsultationCompleted(c === true)} />
                <Label htmlFor="consultationCompleted" className="font-semibold">Consultation completed *</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinicalNotes">Clinical Notes *</Label>
                <Textarea id="clinicalNotes" value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)} placeholder="Document findings..." rows={4} />
              </div>
            </div>
            <Separator />

            {decisionType === "APPROVED" && decisionOptions && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Medication Name *</Label>
                    <Input value={medicationName} onChange={(e) => setMedicationName(e.target.value)} placeholder="e.g. Ozempic" />
                  </div>
                  <div className="space-y-2">
                    <Label>Generic Name *</Label>
                    <Input value={medicationGenericName} onChange={(e) => setMedicationGenericName(e.target.value)} placeholder="e.g. Semaglutide" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Strength *</Label>
                    <Input value={medicationStrength} onChange={(e) => setMedicationStrength(e.target.value)} placeholder="e.g. 0.25mg" />
                  </div>
                  <div className="space-y-2">
                    <Label>Form *</Label>
                    <Select value={medicationForm} onValueChange={setMedicationForm}>
                      <SelectTrigger><SelectValue placeholder="Select form" /></SelectTrigger>
                      <SelectContent>
                        {decisionOptions.medicationForms.map((form) => (
                          <SelectItem key={form} value={form}>{form}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Dosage *</Label>
                    <Input value={medicationDosage} onChange={(e) => setMedicationDosage(e.target.value)} placeholder="e.g. 0.25mg weekly" />
                  </div>
                  <div className="space-y-2">
                    <Label>Frequency *</Label>
                    <Select value={medicationFrequency} onValueChange={setMedicationFrequency}>
                      <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
                      <SelectContent>
                        {decisionOptions.frequencyOptions.map((f) => (
                          <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input value={medicationQuantity} onChange={(e) => setMedicationQuantity(e.target.value)} placeholder="e.g. 4" />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantity Unit *</Label>
                    <Select value={medicationQuantityUnit} onValueChange={setMedicationQuantityUnit}>
                      <SelectTrigger><SelectValue placeholder="Select unit" /></SelectTrigger>
                      <SelectContent>
                        {decisionOptions.quantityUnits.map((unit) => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Repeats</Label>
                    <Select value={repeats.toString()} onValueChange={(v) => setRepeats(Number(v))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{decisionOptions.repeatsOptions.map((o) => <SelectItem key={o.value} value={o.value.toString()}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Follow-up</Label>
                    <Select value={followUpTiming} onValueChange={setFollowUpTiming}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{decisionOptions.followUpOptions.map((o) => <SelectItem key={o.id} value={o.label}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center space-x-2"><Checkbox id="contra" checked={contraindicationsReviewed} onCheckedChange={(c) => setContraindicationsReviewed(c === true)} /><Label htmlFor="contra">Contraindications reviewed *</Label></div>
                  <div className="flex items-center space-x-2"><Checkbox id="counsel" checked={patientCounsellingDocumented} onCheckedChange={(c) => setPatientCounsellingDocumented(c === true)} /><Label htmlFor="counsel">Patient counselling documented *</Label></div>
                </div>
              </div>
            )}

            {decisionType === "APPROVED_NO_TREATMENT" && decisionOptions && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Follow-up</Label>
                    <Select value={followUpTiming} onValueChange={setFollowUpTiming}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{decisionOptions.followUpOptions.map((o) => <SelectItem key={o.id} value={o.label}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center space-x-2"><Checkbox id="contra" checked={contraindicationsReviewed} onCheckedChange={(c) => setContraindicationsReviewed(c === true)} /><Label htmlFor="contra">Contraindications reviewed *</Label></div>
                  <div className="flex items-center space-x-2"><Checkbox id="counsel" checked={patientCounsellingDocumented} onCheckedChange={(c) => setPatientCounsellingDocumented(c === true)} /><Label htmlFor="counsel">Patient counselling documented *</Label></div>
                </div>
              </div>
            )}

            {decisionType === "DECLINED" && decisionOptions && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Decline Reason *</Label>
                  <Select value={declineReason} onValueChange={setDeclineReason}>
                    <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                    <SelectContent>{decisionOptions.declineReasons.map((r) => <SelectItem key={r.id} value={r.id}>{r.text}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {declineReason === "other_medical" && <div className="space-y-2"><Label>Specify</Label><Input value={declineReasonOther} onChange={(e) => setDeclineReasonOther(e.target.value)} /></div>}
                <div className="space-y-2">
                  <Label>Safe Next-Step Guidance *</Label>
                  <Textarea value={safeNextStepGuidance} onChange={(e) => setSafeNextStepGuidance(e.target.value)} placeholder="Guidance for patient..." rows={3} />
                </div>
                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center space-x-2"><Checkbox id="cpFollow" checked={carePartnerFollowUpRequired} onCheckedChange={(c) => setCarePartnerFollowUpRequired(c === true)} /><Label htmlFor="cpFollow">Care partner follow-up required</Label></div>
                  <div className="flex items-center space-x-2"><Checkbox id="gpRef" checked={gpReferralSuggested} onCheckedChange={(c) => setGpReferralSuggested(c === true)} /><Label htmlFor="gpRef">GP referral suggested</Label></div>
                </div>
              </div>
            )}

            {decisionType === "APPROVED_PENDING_TESTS" && decisionOptions && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tests Required *</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-[180px] overflow-y-auto p-2 border rounded-lg">
                    {decisionOptions.bloodTests.map((t) => (
                      <div key={t.id} className="flex items-start space-x-2">
                        <Checkbox id={`test-${t.id}`} checked={testsRequired.includes(t.id)} onCheckedChange={(c) => { if (c) setTestsRequired([...testsRequired, t.id]); else setTestsRequired(testsRequired.filter(x => x !== t.id)); }} />
                        <Label htmlFor={`test-${t.id}`} className="text-sm cursor-pointer"><span className="font-medium">{t.name}</span><span className="text-xs text-slate-500 block">{t.description}</span></Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Reason for Tests *</Label>
                  <Textarea value={reasonForTests} onChange={(e) => setReasonForTests(e.target.value)} placeholder="Why tests are needed..." rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Follow-up Timeframe</Label>
                    <Select value={testFollowUpTimeframe} onValueChange={setTestFollowUpTimeframe}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1 week">1 week</SelectItem>
                        <SelectItem value="2 weeks">2 weeks</SelectItem>
                        <SelectItem value="3 weeks">3 weeks</SelectItem>
                        <SelectItem value="4 weeks">4 weeks</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <div className="flex items-center space-x-2"><Checkbox id="waitResults" checked={treatmentMustWaitForResults} onCheckedChange={(c) => setTreatmentMustWaitForResults(c === true)} /><Label htmlFor="waitResults" className="text-sm">Must wait for results</Label></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDecisionDialog(false)}>Cancel</Button>
            <Button onClick={submitDecision} disabled={processing || !consultationCompleted || !clinicalNotes} className={
              decisionType === "APPROVED" ? "bg-green-600 hover:bg-green-700" :
              decisionType === "APPROVED_NO_TREATMENT" ? "bg-blue-600 hover:bg-blue-700" :
              decisionType === "DECLINED" ? "bg-red-600 hover:bg-red-700" :
              "bg-amber-600 hover:bg-amber-700"
            }>
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {decisionType === "APPROVED" && "Approve & Prescribe"}
              {decisionType === "APPROVED_NO_TREATMENT" && "Approve (No Treatment)"}
              {decisionType === "DECLINED" && "Decline & Refund"}
              {decisionType === "APPROVED_PENDING_TESTS" && "Submit & Order Tests"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
