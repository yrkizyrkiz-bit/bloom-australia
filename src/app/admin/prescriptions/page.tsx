"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Pill, Plus, Search, Clock, CheckCircle, AlertCircle, RefreshCw,
  User, Calendar, Package, Send, XCircle, Loader2, ArrowRight,
  FileText, Building2, Truck, PenLine, ChevronRight
} from "lucide-react";
import Link from "next/link";

interface Prescription {
  id: string;
  patientId: string;
  medicationName: string;
  genericName: string | null;
  strength: string;
  form: string;
  dosage: string;
  frequency: string;
  instructions: string | null;
  quantity: number;
  quantityUnit: string;
  refillsTotal: number;
  refillsRemaining: number;
  daysSupply: number | null;
  prescribedAt: string;
  startDate: string;
  followUpDate: string | null;
  prescriberName: string;
  pharmacyName: string | null;
  pharmacyPhone: string | null;
  pharmacyAddress: string | null;
  status: string;
  scriptStatus: string;
  category: string;
  notes: string | null;
  pharmacyNotes: string | null;
  safetyCounsellingNotes: string | null;
  ePrescriptionId: string | null;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
    journeyStatus: string;
  };
}

// Script workflow statuses
const SCRIPT_STATUSES = [
  { value: "SCRIPT_DRAFT", label: "Draft", color: "bg-slate-100 text-slate-700", icon: PenLine },
  { value: "SCRIPT_WRITTEN", label: "Written", color: "bg-blue-100 text-blue-700", icon: FileText },
  { value: "SCRIPT_SENT_TO_PHARMACY", label: "Sent to Pharmacy", color: "bg-purple-100 text-purple-700", icon: Send },
  { value: "PHARMACY_PENDING", label: "Pharmacy Pending", color: "bg-amber-100 text-amber-700", icon: Building2 },
  { value: "DISPENSING", label: "Dispensing", color: "bg-orange-100 text-orange-700", icon: Package },
  { value: "SHIPPED", label: "Shipped", color: "bg-indigo-100 text-indigo-700", icon: Truck },
  { value: "DELIVERED", label: "Delivered", color: "bg-green-100 text-green-700", icon: CheckCircle },
];

const VALID_TRANSITIONS: Record<string, string[]> = {
  SCRIPT_DRAFT: ["SCRIPT_WRITTEN"],
  SCRIPT_WRITTEN: ["SCRIPT_SENT_TO_PHARMACY"],
  SCRIPT_SENT_TO_PHARMACY: ["PHARMACY_PENDING"],
  PHARMACY_PENDING: ["DISPENSING"],
  DISPENSING: ["SHIPPED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
};

const CATEGORIES = [
  { value: "WEIGHT_MANAGEMENT", label: "Weight Management" },
  { value: "OTHER", label: "Other" },
];

export default function PrescriptionsPage() {
  const searchParams = useSearchParams();
  const prescriptionIdParam = searchParams.get("prescriptionId");

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [scriptCounts, setScriptCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [scriptStatusFilter, setScriptStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("workflow");
  const [hasOpenedFromParam, setHasOpenedFromParam] = useState(false);

  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [targetStatus, setTargetStatus] = useState("");
  const [isProgressing, setIsProgressing] = useState(false);

  const [progressNotes, setProgressNotes] = useState("");
  const [pharmacyName, setPharmacyName] = useState("");
  const [pharmacyAddress, setPharmacyAddress] = useState("");
  const [pharmacyPhone, setPharmacyPhone] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [ePrescriptionId, setEPrescriptionId] = useState("");

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/scripts");
      if (res.ok) {
        const data = await res.json();
        setPrescriptions(data.prescriptions || []);
        setScriptCounts(data.counts || {});
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to load scripts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-open prescription from URL parameter
  useEffect(() => {
    if (prescriptionIdParam && prescriptions.length > 0 && !hasOpenedFromParam) {
      const prescription = prescriptions.find(p => p.id === prescriptionIdParam);
      if (prescription) {
        setSelectedPrescription(prescription);
        setShowViewDialog(true);
        setHasOpenedFromParam(true);
      }
    }
  }, [prescriptionIdParam, prescriptions, hasOpenedFromParam]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleProgressScript = async () => {
    if (!selectedPrescription || !targetStatus) return;
    setIsProgressing(true);
    try {
      const payload: Record<string, unknown> = {
        prescriptionId: selectedPrescription.id,
        newStatus: targetStatus,
        notes: progressNotes || undefined,
      };
      if (targetStatus === "SCRIPT_SENT_TO_PHARMACY" || targetStatus === "PHARMACY_PENDING") {
        if (pharmacyName) payload.pharmacyName = pharmacyName;
        if (pharmacyAddress) payload.pharmacyAddress = pharmacyAddress;
        if (pharmacyPhone) payload.pharmacyPhone = pharmacyPhone;
        if (ePrescriptionId) payload.ePrescriptionId = ePrescriptionId;
      }
      if (targetStatus === "SHIPPED" && trackingNumber) {
        payload.trackingNumber = trackingNumber;
        payload.deliveryMethod = "STANDARD_SHIPPING";
      }

      const res = await fetch("/api/admin/scripts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed");
      }

      toast.success(`Script progressed to ${getScriptStatusLabel(targetStatus)}`);
      setShowProgressDialog(false);
      setShowViewDialog(false);
      resetProgressForm();
      fetchData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed");
    } finally {
      setIsProgressing(false);
    }
  };

  const resetProgressForm = () => {
    setProgressNotes("");
    setPharmacyName("");
    setPharmacyAddress("");
    setPharmacyPhone("");
    setTrackingNumber("");
    setEPrescriptionId("");
    setTargetStatus("");
  };

  const filteredPrescriptions = prescriptions.filter(rx => {
    const matchesSearch = searchQuery === "" ||
      rx.medicationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rx.patient?.firstName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (rx.patient?.lastName || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesScriptStatus = scriptStatusFilter === "all" || rx.scriptStatus === scriptStatusFilter;
    return matchesSearch && matchesScriptStatus;
  });

  const groupedByScriptStatus = SCRIPT_STATUSES.reduce((acc, status) => {
    acc[status.value] = filteredPrescriptions.filter(rx => rx.scriptStatus === status.value);
    return acc;
  }, {} as Record<string, Prescription[]>);

  const getScriptStatusInfo = (scriptStatus: string) => {
    return SCRIPT_STATUSES.find(s => s.value === scriptStatus) || SCRIPT_STATUSES[0];
  };

  const getScriptStatusLabel = (scriptStatus: string) => {
    return SCRIPT_STATUSES.find(s => s.value === scriptStatus)?.label || scriptStatus;
  };

  const getPatientName = (rx: Prescription) => {
    return rx.patient ? `${rx.patient.firstName} ${rx.patient.lastName}` : "Unknown";
  };

  const getNextStatuses = (currentStatus: string) => {
    return VALID_TRANSITIONS[currentStatus] || [];
  };

  const openProgressDialog = (rx: Prescription, status: string) => {
    setSelectedPrescription(rx);
    setTargetStatus(status);
    if (rx.pharmacyName) setPharmacyName(rx.pharmacyName);
    if (rx.pharmacyAddress) setPharmacyAddress(rx.pharmacyAddress);
    if (rx.pharmacyPhone) setPharmacyPhone(rx.pharmacyPhone);
    setShowProgressDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif text-foreground">Script Management</h1>
          <p className="text-muted-foreground mt-1">Manage prescriptions and script workflow</p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" />Refresh
        </Button>
      </div>

      {/* Script Status Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {SCRIPT_STATUSES.map(status => {
          const StatusIcon = status.icon;
          const count = scriptCounts[status.value] || 0;
          const isActive = scriptStatusFilter === status.value;
          return (
            <Card
              key={status.value}
              className={`cursor-pointer transition-all ${isActive ? "ring-2 ring-primary" : "hover:border-primary/50"}`}
              onClick={() => setScriptStatusFilter(isActive ? "all" : status.value)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status.color}`}>
                    <StatusIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{count}</p>
                    <p className="text-xs text-muted-foreground truncate">{status.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="workflow">Workflow View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        {/* Workflow View */}
        <TabsContent value="workflow" className="mt-4">
          <div className="flex gap-4 overflow-x-auto pb-4">
            {SCRIPT_STATUSES.map(status => {
              const StatusIcon = status.icon;
              const scripts = groupedByScriptStatus[status.value] || [];
              return (
                <div key={status.value} className="min-w-[280px] flex-shrink-0">
                  <div className={`p-3 rounded-t-lg ${status.color} flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <StatusIcon className="w-4 h-4" />
                      <span className="font-semibold text-sm">{status.label}</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">{scripts.length}</Badge>
                  </div>
                  <div className="bg-muted/30 rounded-b-lg p-2 min-h-[400px]">
                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2 pr-2">
                        {scripts.map(rx => (
                          <Card key={rx.id} className="cursor-pointer hover:border-primary/50" onClick={() => { setSelectedPrescription(rx); setShowViewDialog(true); }}>
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <p className="font-semibold text-sm">{rx.medicationName}</p>
                                  <p className="text-xs text-muted-foreground">{rx.strength}</p>
                                </div>
                                <Badge variant="outline" className="text-xs">{rx.form}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">{getPatientName(rx)}</p>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-muted-foreground">{new Date(rx.prescribedAt).toLocaleDateString('en-AU')}</span>
                                {getNextStatuses(rx.scriptStatus).length > 0 && (
                                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={(e) => { e.stopPropagation(); openProgressDialog(rx, getNextStatuses(rx.scriptStatus)[0]); }}>
                                    <ChevronRight className="w-3 h-3 mr-1" />Progress
                                  </Button>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {scripts.length === 0 && <div className="text-center py-8 text-muted-foreground text-sm">No scripts</div>}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* List View */}
        <TabsContent value="list" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle className="text-lg">All Scripts</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-[200px]" />
                  </div>
                  <Select value={scriptStatusFilter} onValueChange={setScriptStatusFilter}>
                    <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      {SCRIPT_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {filteredPrescriptions.map(rx => {
                    const info = getScriptStatusInfo(rx.scriptStatus);
                    const StatusIcon = info.icon;
                    return (
                      <div key={rx.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => { setSelectedPrescription(rx); setShowViewDialog(true); }}>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><Pill className="w-6 h-6 text-primary" /></div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold">{rx.medicationName}</p>
                              <Badge variant="outline" className="text-xs">{rx.strength}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{getPatientName(rx)} • {rx.dosage}</p>
                            <p className="text-xs text-muted-foreground">Prescribed: {new Date(rx.prescribedAt).toLocaleDateString('en-AU')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={info.color}><StatusIcon className="w-3 h-3 mr-1" />{info.label}</Badge>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    );
                  })}
                  {filteredPrescriptions.length === 0 && <div className="text-center py-12 text-muted-foreground"><Pill className="w-12 h-12 mx-auto mb-4 opacity-20" /><p>No scripts found</p></div>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Script Details</DialogTitle></DialogHeader>
          {selectedPrescription && (
            <div className="space-y-6 pt-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center"><Pill className="w-8 h-8 text-primary" /></div>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedPrescription.medicationName}</h3>
                    <p className="text-muted-foreground">{selectedPrescription.strength} • {selectedPrescription.form}</p>
                  </div>
                </div>
                <Badge className={getScriptStatusInfo(selectedPrescription.scriptStatus).color}>{getScriptStatusLabel(selectedPrescription.scriptStatus)}</Badge>
              </div>

              {/* Workflow Progress */}
              <Card className="bg-muted/30">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Script Workflow</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1 overflow-x-auto pb-2">
                    {SCRIPT_STATUSES.map((status, idx) => {
                      const StatusIcon = status.icon;
                      const isActive = selectedPrescription.scriptStatus === status.value;
                      const isPast = SCRIPT_STATUSES.findIndex(s => s.value === selectedPrescription.scriptStatus) > idx;
                      return (
                        <div key={status.value} className="flex items-center">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? status.color : isPast ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                              {isPast ? <CheckCircle className="w-4 h-4" /> : <StatusIcon className="w-4 h-4" />}
                            </div>
                            <span className={`text-xs mt-1 whitespace-nowrap ${isActive ? "font-semibold" : "text-muted-foreground"}`}>{status.label}</span>
                          </div>
                          {idx < SCRIPT_STATUSES.length - 1 && <div className={`w-6 h-0.5 ${isPast ? "bg-green-500" : "bg-gray-200"}`} />}
                        </div>
                      );
                    })}
                  </div>
                  {getNextStatuses(selectedPrescription.scriptStatus).length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <Button onClick={() => openProgressDialog(selectedPrescription, getNextStatuses(selectedPrescription.scriptStatus)[0])}>
                        <ChevronRight className="w-4 h-4 mr-2" />Progress to {getScriptStatusLabel(getNextStatuses(selectedPrescription.scriptStatus)[0])}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{getPatientName(selectedPrescription)}</p>
                        <p className="text-sm text-muted-foreground">{selectedPrescription.patient?.email}</p>
                      </div>
                    </div>
                    <Link href={`/admin/crm/customers/${selectedPrescription.patientId}`}><Button variant="outline" size="sm">View Patient</Button></Link>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-muted-foreground">Dosage</Label><p className="font-medium">{selectedPrescription.dosage}</p></div>
                <div><Label className="text-muted-foreground">Frequency</Label><p className="font-medium">{selectedPrescription.frequency}</p></div>
                <div><Label className="text-muted-foreground">Refills</Label><p className="font-medium">{selectedPrescription.refillsRemaining}/{selectedPrescription.refillsTotal}</p></div>
                <div><Label className="text-muted-foreground">Days Supply</Label><p className="font-medium">{selectedPrescription.daysSupply || "N/A"}</p></div>
              </div>

              {selectedPrescription.pharmacyName && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Building2 className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{selectedPrescription.pharmacyName}</p>
                        {selectedPrescription.pharmacyAddress && <p className="text-sm text-muted-foreground">{selectedPrescription.pharmacyAddress}</p>}
                        {selectedPrescription.pharmacyPhone && <p className="text-sm text-muted-foreground">{selectedPrescription.pharmacyPhone}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end"><Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Progress Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Progress Script</DialogTitle>
            <DialogDescription>Move script to the next stage.</DialogDescription>
          </DialogHeader>
          {selectedPrescription && (
            <div className="space-y-4 pt-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedPrescription.medicationName} {selectedPrescription.strength}</p>
                <p className="text-sm text-muted-foreground">{getPatientName(selectedPrescription)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={getScriptStatusInfo(selectedPrescription.scriptStatus).color}>{getScriptStatusLabel(selectedPrescription.scriptStatus)}</Badge>
                  <ArrowRight className="w-4 h-4" />
                  <Badge className={getScriptStatusInfo(targetStatus).color}>{getScriptStatusLabel(targetStatus)}</Badge>
                </div>
              </div>

              {(targetStatus === "SCRIPT_SENT_TO_PHARMACY" || targetStatus === "PHARMACY_PENDING") && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Pharmacy Name</Label><Input value={pharmacyName} onChange={(e) => setPharmacyName(e.target.value)} /></div>
                    <div><Label>Phone</Label><Input value={pharmacyPhone} onChange={(e) => setPharmacyPhone(e.target.value)} /></div>
                  </div>
                  <div><Label>Address</Label><Input value={pharmacyAddress} onChange={(e) => setPharmacyAddress(e.target.value)} /></div>
                  <div><Label>ePrescription ID</Label><Input value={ePrescriptionId} onChange={(e) => setEPrescriptionId(e.target.value)} /></div>
                </div>
              )}

              {targetStatus === "SHIPPED" && (
                <div><Label>Tracking Number</Label><Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} /></div>
              )}

              <div><Label>Notes</Label><Textarea value={progressNotes} onChange={(e) => setProgressNotes(e.target.value)} rows={3} /></div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProgressDialog(false)}>Cancel</Button>
            <Button onClick={handleProgressScript} disabled={isProgressing}>
              {isProgressing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Progress
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
