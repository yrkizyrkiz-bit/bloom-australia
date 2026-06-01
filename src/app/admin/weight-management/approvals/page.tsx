"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2, XCircle, Clock, Loader2, AlertTriangle,
  Calendar, Scale, User, FileText, ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  dateOfBirth: string | null;
  triageScore: number | null;
  approvalStatus: string;
  journeyStatus: string;
  createdAt: string;
  currentWeight: number | null;
  consultationDate: string | null;
  consultationStatus: string | null;
  healthProfile: {
    systolicBP: number | null;
    diastolicBP: number | null;
    onBPMedication: boolean;
  } | null;
  flaggedConditions: Array<{
    id: string;
    title: string;
    content: string;
    createdAt: string;
  }>;
}

export default function WMApprovalsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [actionType, setActionType] = useState<"APPROVE" | "DECLINE" | "DEFER" | null>(null);
  const [processing, setProcessing] = useState(false);

  // Form state
  const [planTier, setPlanTier] = useState("weight_management_3m");
  const [declineReason, setDeclineReason] = useState("");
  const [deferDate, setDeferDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await fetch("/api/admin/wm-approvals?status=PENDING");
      if (res.ok) {
        const data = await res.json();
        setPatients(data.patients);
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast.error("Failed to load patients");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedPatient || !actionType) return;

    setProcessing(true);
    try {
      const res = await fetch("/api/admin/wm-approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedPatient.id,
          action: actionType,
          planTier: actionType === "APPROVE" ? planTier : undefined,
          declineReason: actionType === "DECLINE" ? declineReason : undefined,
          deferDate: actionType === "DEFER" ? deferDate : undefined,
          notes,
        }),
      });

      if (res.ok) {
        toast.success(
          actionType === "APPROVE" ? "Patient approved successfully" :
          actionType === "DECLINE" ? "Patient declined and refund initiated" :
          "Patient deferred for follow-up"
        );
        // Remove patient from list
        setPatients(patients.filter(p => p.id !== selectedPatient.id));
        closeDialog();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to process action");
      }
    } catch (error) {
      console.error("Error processing action:", error);
      toast.error("Failed to process action");
    } finally {
      setProcessing(false);
    }
  };

  const openDialog = (patient: Patient, action: "APPROVE" | "DECLINE" | "DEFER") => {
    setSelectedPatient(patient);
    setActionType(action);
    setPlanTier("weight_management_3m");
    setDeclineReason("");
    setDeferDate("");
    setNotes("");
  };

  const closeDialog = () => {
    setSelectedPatient(null);
    setActionType(null);
  };

  const calculateAge = (dob: string | null) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getTriageColor = (score: number | null) => {
    if (score === null) return "bg-gray-100 text-gray-600";
    if (score >= 70) return "bg-red-100 text-red-700";
    if (score >= 40) return "bg-amber-100 text-amber-700";
    return "bg-green-100 text-green-700";
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
      <div className="flex items-center gap-4">
        <Link href="/admin/weight-management">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Patient Approvals</h1>
          <p className="text-muted-foreground">Review and approve weight management patients after consultation</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending Review</p>
              <p className="text-2xl font-bold">{patients.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient List */}
      {patients.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-medium">All caught up!</p>
            <p className="text-muted-foreground">No patients pending approval</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {patients.map((patient) => (
            <Card key={patient.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                  {/* Patient Info */}
                  <div className="flex-1 p-4 border-b lg:border-b-0 lg:border-r">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-primary/10 text-primary text-lg">
                          {patient.firstName[0]}{patient.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">
                            {patient.firstName} {patient.lastName}
                          </h3>
                          {patient.triageScore !== null && (
                            <Badge className={getTriageColor(patient.triageScore)}>
                              Triage: {patient.triageScore}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{patient.email}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          {patient.dateOfBirth && (
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              Age {calculateAge(patient.dateOfBirth)}
                            </span>
                          )}
                          {patient.currentWeight && (
                            <span className="flex items-center gap-1">
                              <Scale className="w-4 h-4" />
                              {patient.currentWeight} kg
                            </span>
                          )}
                          {patient.consultationDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              Consult: {new Date(patient.consultationDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Flagged Conditions */}
                    {patient.flaggedConditions.length > 0 && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-700 mb-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="font-medium text-sm">Medical Conditions</span>
                        </div>
                        <ul className="text-sm text-amber-800 space-y-1">
                          {patient.flaggedConditions.slice(0, 3).map((condition) => (
                            <li key={condition.id} className="flex items-start gap-2">
                              <span className="text-amber-500 mt-1">•</span>
                              <span>{condition.title}</span>
                            </li>
                          ))}
                          {patient.flaggedConditions.length > 3 && (
                            <li className="text-amber-600 italic">
                              +{patient.flaggedConditions.length - 3} more conditions
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Blood Pressure if available */}
                    {patient.healthProfile?.systolicBP && (
                      <div className="mt-3 text-sm">
                        <span className="text-muted-foreground">BP: </span>
                        <span className="font-medium">
                          {patient.healthProfile.systolicBP}/{patient.healthProfile.diastolicBP}
                        </span>
                        {patient.healthProfile.onBPMedication && (
                          <Badge variant="outline" className="ml-2 text-xs">On BP Meds</Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="p-4 flex flex-col gap-2 lg:w-48 bg-muted/30">
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => openDialog(patient, "APPROVE")}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => openDialog(patient, "DECLINE")}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Decline
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => openDialog(patient, "DEFER")}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Defer
                    </Button>
                    <Link href={`/admin/crm/customers/${patient.id}`} className="w-full">
                      <Button variant="ghost" className="w-full text-xs">
                        <FileText className="w-3 h-3 mr-1" />
                        View Full Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={!!actionType} onOpenChange={() => closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "APPROVE" && "Approve Patient"}
              {actionType === "DECLINE" && "Decline Patient"}
              {actionType === "DEFER" && "Defer Decision"}
            </DialogTitle>
            <DialogDescription>
              {selectedPatient && (
                <span>
                  {selectedPatient.firstName} {selectedPatient.lastName} ({selectedPatient.email})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {actionType === "APPROVE" && (
              <div className="space-y-2">
                <Label>Plan Tier</Label>
                <Select value={planTier} onValueChange={setPlanTier}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sanative_core">Sanative Core ($249 first month, then $349/mo)</SelectItem>
                    <SelectItem value="sanative_precision">Sanative Precision ($399 first month, then $499/mo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {actionType === "DECLINE" && (
              <div className="space-y-2">
                <Label>Reason for Decline</Label>
                <Select value={declineReason} onValueChange={setDeclineReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_eligible">Not Eligible (BMI criteria)</SelectItem>
                    <SelectItem value="medical_contraindication">Medical Contraindication</SelectItem>
                    <SelectItem value="requires_specialist">Requires Specialist Referral</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {actionType === "DEFER" && (
              <div className="space-y-2">
                <Label>Follow-up Date</Label>
                <Input
                  type="date"
                  value={deferDate}
                  onChange={(e) => setDeferDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any clinical notes..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button
              onClick={handleAction}
              disabled={processing || (actionType === "DECLINE" && !declineReason)}
              className={
                actionType === "APPROVE" ? "bg-green-600 hover:bg-green-700" :
                actionType === "DECLINE" ? "bg-red-600 hover:bg-red-700" :
                ""
              }
            >
              {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {actionType === "APPROVE" && "Approve & Notify Patient"}
              {actionType === "DECLINE" && "Decline & Refund"}
              {actionType === "DEFER" && "Defer for Follow-up"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
