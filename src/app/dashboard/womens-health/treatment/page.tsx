"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  MessageCircle,
  Package,
  Pill,
  RefreshCw,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgramDoseSection } from "@/components/program/ProgramDoseSection";
import { ProgramSideEffectHistory } from "@/components/program/ProgramSideEffectHistory";

type Prescription = {
  id: string;
  medicationName: string;
  genericName: string | null;
  strength: string;
  form: string;
  dosage: string;
  frequency: string;
  instructions: string | null;
  refillsRemaining: number;
  prescriberName: string;
  pharmacyName: string | null;
  pharmacyPhone: string | null;
  status: string;
  scriptStatus: string;
  scriptStatusLabel: string;
  scriptStatusDescription: string;
  category: string;
  diagnosis: string | null;
  startDate: string;
  followUpDate: string | null;
  nextRefillDate: string | null;
  trackingNumber: string | null;
  deliveryMethod: string | null;
  deliveredAt: string | null;
};

type Treatment = {
  id: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  instructions: string | null;
  nextDoseDate: string | null;
  adherence: number | null;
};

type TreatmentData = {
  summary: {
    isApproved: boolean;
    hasPrescription: boolean;
    hasActiveTreatment: boolean;
    activePrescriptionCount: number;
    activeTreatmentCount: number;
  };
  prescriptions: Prescription[];
  treatments: Treatment[];
};

const timelineSteps = [
  { key: "SCRIPT_DRAFT", label: "Script prepared", icon: FileText },
  { key: "SCRIPT_WRITTEN", label: "Script written", icon: CheckCircle2 },
  { key: "SCRIPT_SENT_TO_PHARMACY", label: "Sent to pharmacy", icon: Package },
  { key: "DISPENSING", label: "Being dispensed", icon: Package },
  { key: "SHIPPED", label: "Shipped", icon: Truck },
  { key: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
];

function getStepIndex(status: string) {
  const index = timelineSteps.findIndex((step) => step.key === status);
  if (status === "PHARMACY_PENDING") return 2;
  return index;
}

function formatDate(date: string | null) {
  if (!date) return "Not set";
  return new Date(date).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function WomensHealthTreatmentPage() {
  const [data, setData] = useState<TreatmentData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/womens-health/treatment");
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const primaryPrescription = data?.prescriptions[0] || null;
  const currentStep = primaryPrescription ? getStepIndex(primaryPrescription.scriptStatus) : -1;

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/dashboard/womens-health">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Pill className="w-6 h-6 text-rose-600" />
            Treatment
          </h1>
          <p className="text-muted-foreground">Doctor-prescribed Women&apos;s Health treatment and prescription status.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : !data?.summary.hasPrescription ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-1" />
              <div>
                <h2 className="font-semibold text-amber-900">No Women&apos;s Health prescription yet</h2>
                <p className="text-sm text-amber-800 mt-2">
                  If your Sanative doctor prescribes treatment, it will appear here. Members cannot add medications manually.
                </p>
                <Button asChild className="mt-4 bg-amber-600 hover:bg-amber-700">
                  <Link href="/dashboard/womens-health/care">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Contact care team
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {primaryPrescription && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-rose-600" />
                  Prescription progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="font-semibold">{primaryPrescription.medicationName}</h2>
                      <p className="text-sm text-muted-foreground">
                        {primaryPrescription.strength} · {primaryPrescription.dosage} · {primaryPrescription.frequency}
                      </p>
                    </div>
                    <Badge className="bg-rose-100 text-rose-800">
                      {primaryPrescription.scriptStatusLabel}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">
                    {primaryPrescription.scriptStatusDescription}
                  </p>
                </div>

                <div className="grid sm:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-xl border p-3">
                    <p className="text-muted-foreground">Prescriber</p>
                    <p className="font-medium">{primaryPrescription.prescriberName}</p>
                  </div>
                  <div className="rounded-xl border p-3">
                    <p className="text-muted-foreground">Next refill</p>
                    <p className="font-medium">{formatDate(primaryPrescription.nextRefillDate)}</p>
                  </div>
                  <div className="rounded-xl border p-3">
                    <p className="text-muted-foreground">Follow-up</p>
                    <p className="font-medium">{formatDate(primaryPrescription.followUpDate)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {timelineSteps.map((step, index) => {
                    const complete = currentStep >= index;
                    const StepIcon = step.icon;
                    return (
                      <div key={step.key} className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${complete ? "bg-rose-600 text-white" : "bg-muted text-muted-foreground"}`}>
                          <StepIcon className="w-4 h-4" />
                        </div>
                        <p className={complete ? "font-medium text-rose-700" : "text-muted-foreground"}>
                          {step.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {data.treatments.length > 0 && (
            <>
              <ProgramDoseSection />
              <ProgramSideEffectHistory />
            </>
          )}

          <Card>
            <CardHeader>
              <CardTitle>All active Women&apos;s Health prescriptions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.prescriptions.map((rx) => (
                <div key={rx.id} className="rounded-xl border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{rx.medicationName}</p>
                      <p className="text-sm text-muted-foreground">
                        {rx.strength} · {rx.form} · {rx.frequency}
                      </p>
                      {rx.instructions && (
                        <p className="text-sm text-muted-foreground mt-2">{rx.instructions}</p>
                      )}
                    </div>
                    <Badge variant="secondary">{rx.category.replace(/_/g, " ")}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
