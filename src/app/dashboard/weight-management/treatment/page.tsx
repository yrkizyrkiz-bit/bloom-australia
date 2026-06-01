"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Pill, Calendar, Clock, CheckCircle2, Loader2, User, Building2, Package, Truck, AlertCircle, FileText, RefreshCw } from "lucide-react";
import Link from "next/link";

// GAP-021: Remove patient self-add medication
// GAP-027: Surface script/pharmacy/dispensing statuses

interface Treatment {
  id: string;
  medicationName: string;
  genericName: string | null;
  strength: string;
  form: string;
  dosage: string;
  frequency: string;
  instructions: string | null;
  status: string;
  scriptStatus: string;
  scriptStatusLabel: string;
  scriptStatusDescription: string;
  startDate: string | null;
  followUpDate: string | null;
  nextRefillDate: string | null;
  daysSupply: number;
  daysIntoTreatment: number;
  refillsTotal: number;
  refillsRemaining: number;
  prescriberName: string | null;
  pharmacyName: string | null;
  pharmacyPhone: string | null;
  isShipped: boolean;
  isDelivered: boolean;
  trackingNumber: string | null;
  deliveryMethod: string | null;
  deliveredAt: string | null;
  isActive: boolean;
  isReadyForNextRefill: boolean;
}

interface JourneyStatus {
  journeyStatus: string;
  stage: string;
  stageDescription: string;
  isApproved: boolean;
  approvalStatus: string;
  hasPrescription: boolean;
  scriptStatus: string | null;
  isActive: boolean;
  pendingTests: boolean;
  effectiveStatus: string;
}

// GAP-027: Status timeline steps
const TIMELINE_STEPS = [
  { key: "APPROVED", label: "Doctor approved", icon: CheckCircle2 },
  { key: "SCRIPT_WRITTEN", label: "Script written", icon: FileText },
  { key: "PHARMACY_PENDING", label: "Pharmacy preparing treatment", icon: Package },
  { key: "SHIPPED", label: "Dispatched", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
  { key: "ONBOARDING_COMPLETE", label: "Onboarding complete", icon: CheckCircle2 },
  { key: "ACTIVE", label: "Program active", icon: CheckCircle2 },
];

// Get the step index for current status
function getStepIndex(status: string): number {
  const statusMap: Record<string, number> = {
    APPROVED: 0,
    SCRIPT_DRAFT: 0,
    SCRIPT_WRITTEN: 1,
    SCRIPT_SENT_TO_PHARMACY: 1,
    PHARMACY_PENDING: 2,
    DISPENSING: 2,
    SHIPPED: 3,
    DELIVERED: 4,
    ONBOARDING_PENDING: 4,
    ONBOARDING_COMPLETE: 5,
    ACTIVE: 6,
  };
  return statusMap[status] ?? -1;
}

export default function TreatmentPage() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [journeyStatus, setJourneyStatus] = useState<JourneyStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch journey status
      const statusRes = await fetch("/api/weight-management/journey-status");
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setJourneyStatus(statusData);
      }

      // Fetch treatments (doctor-prescribed only from Prescription model)
      const treatmentRes = await fetch("/api/weight-management/treatment");
      if (treatmentRes.ok) {
        const treatmentData = await treatmentRes.json();
        setTreatments(treatmentData.treatments || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Use effectiveStatus for timeline (combines journey and script status)
  const effectiveStatus = journeyStatus?.effectiveStatus || journeyStatus?.journeyStatus || "LEAD";
  const currentStepIndex = getStepIndex(effectiveStatus);
  const isApproved = journeyStatus?.isApproved || false;
  const hasPrescription = treatments.length > 0;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/weight-management">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Treatment</h1>
          <p className="text-muted-foreground">Your doctor-prescribed treatment plan</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* GAP-021: Before approval - show pending message */}
      {!isApproved && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  Treatment plan pending
                </h3>
                <p className="text-amber-800 dark:text-amber-200 text-sm leading-relaxed">
                  Your treatment plan will appear here if your Sanative doctor confirms the program is clinically suitable and prescribes treatment.
                </p>
                <p className="text-amber-700 dark:text-amber-300 text-sm mt-3">
                  <strong>Current status:</strong> {journeyStatus?.stageDescription || "Awaiting doctor consultation"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GAP-027: Treatment preparation timeline (after approval) */}
      {isApproved && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-600" />
              Treatment Progress
            </CardTitle>
            <CardDescription>
              Track your treatment preparation and delivery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

              {/* Timeline steps */}
              <div className="space-y-4">
                {TIMELINE_STEPS.map((step, index) => {
                  const isComplete = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const StepIcon = step.icon;

                  return (
                    <div key={step.key} className="flex items-center gap-4 relative">
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center z-10 transition-colors
                        ${isComplete
                          ? "bg-emerald-600 text-white"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                        }
                        ${isCurrent ? "ring-4 ring-emerald-200 dark:ring-emerald-900" : ""}
                      `}>
                        <StepIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${isComplete ? "text-emerald-700 dark:text-emerald-400" : "text-gray-500"}`}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                            Current step
                          </p>
                        )}
                      </div>
                      {isComplete && index < currentStepIndex && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GAP-027: Show shipping tracking if shipped */}
      {isApproved && treatments.some(t => t.trackingNumber) && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900 dark:text-blue-100">Your order is on the way!</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Tracking: <span className="font-mono">{treatments.find(t => t.trackingNumber)?.trackingNumber}</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GAP-021: Doctor-prescribed treatments (read-only) */}
      {isApproved && hasPrescription && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Pill className="w-5 h-5 text-purple-600" />
            Your Prescribed Treatment
          </h2>

          {treatments.map((treatment) => (
            <Card key={treatment.id} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Pill className="w-5 h-5 text-purple-600" />
                      {treatment.medicationName}
                      {treatment.strength && <span className="text-sm font-normal text-muted-foreground">({treatment.strength})</span>}
                    </CardTitle>
                    <CardDescription>{treatment.dosage} • {treatment.frequency}</CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={treatment.isActive ? "default" : "secondary"}>
                      {treatment.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {treatment.scriptStatusLabel}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                {treatment.instructions && (
                  <div className="bg-muted/50 rounded-lg p-4 mb-4">
                    <p className="text-sm font-medium text-muted-foreground mb-1">Instructions from your doctor</p>
                    <p className="text-sm">{treatment.instructions}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {treatment.startDate && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <Calendar className="w-4 h-4 text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">Started</p>
                      <p className="font-medium text-sm">{new Date(treatment.startDate).toLocaleDateString()}</p>
                    </div>
                  )}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <Clock className="w-4 h-4 text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">Day</p>
                    <p className="font-medium text-sm">{treatment.daysIntoTreatment > 0 ? treatment.daysIntoTreatment : "Starting"}</p>
                  </div>
                  {treatment.refillsRemaining > 0 && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <RefreshCw className="w-4 h-4 text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">Refills</p>
                      <p className="font-medium text-sm">{treatment.refillsRemaining} remaining</p>
                    </div>
                  )}
                  {treatment.prescriberName && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <User className="w-4 h-4 text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">Doctor</p>
                      <p className="font-medium text-sm">{treatment.prescriberName}</p>
                    </div>
                  )}
                  {treatment.pharmacyName && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <Building2 className="w-4 h-4 text-muted-foreground mb-1" />
                      <p className="text-xs text-muted-foreground">Pharmacy</p>
                      <p className="font-medium text-sm">{treatment.pharmacyName}</p>
                    </div>
                  )}
                </div>

                {/* Delivery info */}
                {treatment.isDelivered && treatment.deliveredAt && (
                  <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-emerald-700 dark:text-emerald-400">Delivered</p>
                      <p className="text-sm text-emerald-600">{new Date(treatment.deliveredAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}

                {/* Next refill reminder */}
                {treatment.isReadyForNextRefill && (
                  <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="w-5 h-5 text-amber-600" />
                      <div>
                        <p className="font-medium text-amber-700 dark:text-amber-400">Refill available</p>
                        <p className="text-sm text-amber-600">Contact your care team to request a refill</p>
                      </div>
                    </div>
                    <Link href="/dashboard/weight-management/support">
                      <Button size="sm" variant="outline">Request Refill</Button>
                    </Link>
                  </div>
                )}

                {/* Script status description */}
                <div className="mt-4 p-3 bg-muted/30 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">{treatment.scriptStatusDescription}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* GAP-021: Approved but no prescription yet */}
      {isApproved && !hasPrescription && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Prescription being prepared
                </h3>
                <p className="text-blue-800 dark:text-blue-200 text-sm leading-relaxed">
                  Your doctor has approved your program. Your prescription is being prepared and will appear here once ready.
                </p>
                {journeyStatus?.pendingTests && (
                  <p className="text-blue-700 dark:text-blue-300 text-sm mt-3">
                    <strong>Note:</strong> Your doctor has requested blood tests before finalizing your treatment plan.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help section */}
      <Card className="bg-gray-50 dark:bg-gray-900/50">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Questions about your treatment?</strong> Contact your care team through the{" "}
            <Link href="/dashboard/weight-management/coach" className="text-emerald-600 underline">
              Coach
            </Link>{" "}
            section or call us at <a href="tel:1800123456" className="text-emerald-600">1800 123 456</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
