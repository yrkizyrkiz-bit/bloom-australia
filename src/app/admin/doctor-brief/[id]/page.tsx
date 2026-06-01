"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  User,
  Phone,
  Calendar,
  Scale,
  Ruler,
  Activity,
  AlertTriangle,
  Pill,
  FileText,
  CreditCard,
  CheckCircle2,
  Clock,
  ChevronLeft,
  Clipboard,
  Heart,
  Stethoscope,
  Shield,
  Upload,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

interface DoctorBriefData {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phone: string | null;
    dateOfBirth: string | null;
    age: number | null;
    gender: string | null;
  };
  metrics: {
    height: number | null;
    weight: number | null;
    bmi: number | null;
    bmiCategory: string | null;
  };
  consultation: {
    id: string;
    scheduledAt: string;
    appointmentType: string;
    selectedPlan: string | null;
    status: string;
    doctorName: string | null;
  };
  medicalHistory: {
    conditions: string[];
    metabolicConditions: string[];
    digestiveConditions: string[];
    cardiovascularConditions: string[];
    mentalHealthConditions: string[];
    seriousConditions: string[];
  };
  medications: Array<{
    name: string;
    dose: string | null;
    frequency: string | null;
  }>;
  allergies: string[];
  riskFlags: string[];
  consent: {
    status: string;
    consentedAt: string | null;
    privacyAccepted: boolean;
    termsAccepted: boolean;
  };
  payment: {
    status: string;
    paymentIntentId: string | null;
    amount: number | null;
    plan: string | null;
  };
  intakeData: Record<string, unknown>;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    uploadedAt: string;
  }>;
  notes: Array<{
    id: string;
    content: string;
    category: string;
    createdAt: string;
    authorName: string;
  }>;
}

function calculateAge(dateOfBirth: string | null): number | null {
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

function getBMICategory(bmi: number | null): string | null {
  if (!bmi) return null;
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  if (bmi < 35) return "Obese Class I";
  if (bmi < 40) return "Obese Class II";
  return "Obese Class III";
}

export default function DoctorBriefPage() {
  const params = useParams();
  const router = useRouter();
  const intakeId = params.id as string;

  const [data, setData] = useState<DoctorBriefData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBrief() {
      try {
        const response = await fetch(`/api/admin/doctor-brief/${intakeId}`);
        if (!response.ok) {
          throw new Error("Failed to load doctor brief");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    fetchBrief();
  }, [intakeId]);

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 text-red-700">
              <AlertTriangle className="w-6 h-6" />
              <div>
                <h2 className="font-semibold">Error Loading Doctor Brief</h2>
                <p className="text-sm">{error || "Brief not found"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { patient, metrics, consultation, medicalHistory, medications, allergies, riskFlags, consent, payment, documents, notes } = data;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-blue-600" />
              Doctor Brief
            </h1>
            <p className="text-sm text-gray-500">
              Patient consultation summary for {patient.fullName}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={
            consultation.status === "BOOKING_CONFIRMED"
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }
        >
          {consultation.status === "BOOKING_CONFIRMED" ? "Confirmed" : consultation.status}
        </Badge>
      </div>

      {/* Risk Flags Alert */}
      {riskFlags.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-800">Risk Flags</h3>
                <ul className="mt-1 space-y-1">
                  {riskFlags.map((flag, i) => (
                    <li key={i} className="text-sm text-red-700">• {flag}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patient Info & Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Patient Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Patient Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Name</span>
              <span className="font-medium">{patient.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Phone</span>
              <span className="font-medium flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                {patient.phone || "Not provided"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Date of Birth</span>
              <span className="font-medium">
                {patient.dateOfBirth
                  ? new Date(patient.dateOfBirth).toLocaleDateString("en-AU")
                  : "Not provided"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Age</span>
              <span className="font-medium">{patient.age ? `${patient.age} years` : "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Gender</span>
              <span className="font-medium capitalize">{patient.gender || "Not specified"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Email</span>
              <span className="font-medium text-sm">{patient.email}</span>
            </div>
          </CardContent>
        </Card>

        {/* Physical Metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Scale className="w-5 h-5 text-green-600" />
              Physical Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 flex items-center gap-2">
                <Ruler className="w-4 h-4" />
                Height
              </span>
              <span className="font-medium">
                {metrics.height ? `${metrics.height} cm` : "Not provided"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Weight
              </span>
              <span className="font-medium">
                {metrics.weight ? `${metrics.weight} kg` : "Not provided"}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">BMI</span>
              <div className="text-right">
                <span className="font-bold text-lg">
                  {metrics.bmi ? metrics.bmi.toFixed(1) : "N/A"}
                </span>
                {metrics.bmiCategory && (
                  <Badge
                    variant="outline"
                    className={`ml-2 ${
                      metrics.bmiCategory === "Normal"
                        ? "bg-green-50 text-green-700"
                        : metrics.bmiCategory.includes("Obese")
                        ? "bg-red-50 text-red-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {metrics.bmiCategory}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Consultation & Payment */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Consultation Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-600" />
              Consultation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Scheduled</span>
              <span className="font-medium">
                {new Date(consultation.scheduledAt).toLocaleString("en-AU", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Type</span>
              <Badge variant="outline">{consultation.appointmentType}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Selected Plan</span>
              <Badge className="bg-blue-100 text-blue-700">
                {consultation.selectedPlan || "Not selected"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Doctor</span>
              <span className="font-medium">{consultation.doctorName || "TBA"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Status</span>
              <Badge
                className={
                  payment.status === "PAID"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }
              >
                {payment.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Amount</span>
              <span className="font-medium">
                {payment.amount ? `$${(payment.amount / 100).toFixed(2)}` : "N/A"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Plan</span>
              <span className="font-medium">{payment.plan || "N/A"}</span>
            </div>
            {payment.paymentIntentId && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Payment ID</span>
                <span className="font-mono text-xs text-gray-400">
                  {payment.paymentIntentId.substring(0, 20)}...
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Medical History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Medical History
          </CardTitle>
          <CardDescription>Patient-reported conditions from intake assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {medicalHistory.metabolicConditions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Metabolic</h4>
                <div className="flex flex-wrap gap-1">
                  {medicalHistory.metabolicConditions.map((c, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {medicalHistory.cardiovascularConditions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Cardiovascular</h4>
                <div className="flex flex-wrap gap-1">
                  {medicalHistory.cardiovascularConditions.map((c, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {medicalHistory.digestiveConditions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Digestive</h4>
                <div className="flex flex-wrap gap-1">
                  {medicalHistory.digestiveConditions.map((c, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {medicalHistory.mentalHealthConditions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Mental Health</h4>
                <div className="flex flex-wrap gap-1">
                  {medicalHistory.mentalHealthConditions.map((c, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {medicalHistory.seriousConditions.length > 0 && (
              <div className="md:col-span-2">
                <h4 className="text-sm font-semibold text-red-700 mb-2">⚠️ Serious Conditions</h4>
                <div className="flex flex-wrap gap-1">
                  {medicalHistory.seriousConditions.map((c, i) => (
                    <Badge key={i} variant="outline" className="border-red-200 text-red-700 text-xs">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {Object.values(medicalHistory).every(arr => arr.length === 0) && (
              <p className="text-sm text-gray-500 col-span-full">No conditions reported</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Medications & Allergies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Medications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Pill className="w-5 h-5 text-blue-500" />
              Current Medications
            </CardTitle>
          </CardHeader>
          <CardContent>
            {medications.length > 0 ? (
              <div className="space-y-3">
                {medications.map((med, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium">{med.name}</p>
                    {(med.dose || med.frequency) && (
                      <p className="text-sm text-gray-500">
                        {med.dose && `${med.dose}`}
                        {med.dose && med.frequency && " - "}
                        {med.frequency && med.frequency}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No medications reported</p>
            )}
          </CardContent>
        </Card>

        {/* Allergies */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Allergies
            </CardTitle>
          </CardHeader>
          <CardContent>
            {allergies.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allergies.map((allergy, i) => (
                  <Badge key={i} variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                    {allergy}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No allergies reported</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Consent Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Consent Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              {consent.privacyAccepted ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <Clock className="w-5 h-5 text-amber-500" />
              )}
              <span className="text-sm">Privacy Policy</span>
            </div>
            <div className="flex items-center gap-2">
              {consent.termsAccepted ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <Clock className="w-5 h-5 text-amber-500" />
              )}
              <span className="text-sm">Terms of Service</span>
            </div>
            {consent.consentedAt && (
              <span className="text-sm text-gray-500">
                Consented: {new Date(consent.consentedAt).toLocaleString("en-AU")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      {documents.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-500" />
              Uploaded Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-sm">{doc.name}</p>
                    <p className="text-xs text-gray-500">
                      {doc.type} • {new Date(doc.uploadedAt).toLocaleDateString("en-AU")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clinical Notes */}
      {notes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clipboard className="w-5 h-5 text-gray-500" />
              Clinical Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notes.map((note) => (
                <div key={note.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {note.category}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {note.authorName} • {new Date(note.createdAt).toLocaleString("en-AU")}
                    </span>
                  </div>
                  <p className="text-sm">{note.content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => window.print()}>
          Print Brief
        </Button>
        <Button onClick={() => router.push(`/admin/doctor?consultationId=${consultation.id}`)}>
          Open Doctor Dashboard
        </Button>
      </div>
    </div>
  );
}
