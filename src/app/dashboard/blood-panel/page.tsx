"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useBiomarkerResults } from "@/hooks/useApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getBiomarkerById } from "@/data/biomarkers";
import {
  bloodPanelConfig,
  getBiomarkerStatus,
  getEffectiveRange,
  hasGenderSpecificRanges,
  getDisplayRanges,
  type BloodPanelCategoryKey,
  type BloodPanelBiomarker,
  type Gender
} from "@/data/bloodPanelConfig";
import type { BiomarkerResult } from "@/types";
import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  Loader2,
  Droplet,
  Activity,
  User
} from "lucide-react";

// Normalize status to consistent labels
type NormalizedStatus = "Optimal" | "Normal" | "Attention" | "Critical" | "Not Tested";

function normalizeStatus(status: string): { label: NormalizedStatus; color: string; bgColor: string } {
  if (status === "Optimal") {
    return { label: "Optimal", color: "text-green-600", bgColor: "bg-green-100" };
  }
  if (status === "Normal") {
    return { label: "Normal", color: "text-yellow-600", bgColor: "bg-yellow-100" };
  }
  if (status === "Critical Low" || status === "Critical High") {
    return { label: "Critical", color: "text-red-700", bgColor: "bg-red-100" };
  }
  if (status === "Not Tested") {
    return { label: "Not Tested", color: "text-gray-500", bgColor: "bg-gray-100" };
  }
  // "Low", "High", or any other out of range status -> "Attention"
  return { label: "Attention", color: "text-orange-600", bgColor: "bg-orange-100" };
}

function StatusIcon({ status }: { status: NormalizedStatus }) {
  if (status === "Optimal") return <CheckCircle className="w-4 h-4 text-green-600" />;
  if (status === "Normal") return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
  if (status === "Critical") return <AlertCircle className="w-4 h-4 text-red-600" />;
  if (status === "Not Tested") return <Info className="w-4 h-4 text-gray-400" />;
  return <AlertTriangle className="w-4 h-4 text-orange-600" />; // Attention
}

export default function BloodPanelPage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Get user gender for gender-specific ranges
  const gender: Gender = user?.gender === "female" ? "female" : "male";

  // Fetch real biomarker data from API
  const { data: biomarkerData, isLoading, error } = useBiomarkerResults(undefined, { latest: true });

  // Transform API data to a lookup map
  // Also derive missing biomarkers from available data
  const biomarkerValues = useMemo(() => {
    const map: Record<string, { value: number; testedAt: string; status: string }> = {};
    if (biomarkerData?.results) {
      for (const r of biomarkerData.results) {
        map[r.biomarkerId] = {
          value: r.value,
          testedAt: r.testedAt,
          status: r.status?.toLowerCase() || "normal"
        };
      }

      // ===== DERIVE MISSING BIOMARKERS =====
      // If we have absolute counts and WBC but not percentages, calculate them
      const wbc = map["wbc"];

      if (wbc && wbc.value > 0) {
        // Derive Lymphocyte % from absolute count if missing
        if (map["lymphocytes"] && !map["lymphocyte_percent"]) {
          const rawPercent = (map["lymphocytes"].value / wbc.value) * 100;
          const roundedPercent = Math.round(rawPercent * 10) / 10;
          if (roundedPercent >= 0 && roundedPercent <= 100) {
            map["lymphocyte_percent"] = {
              value: roundedPercent,
              testedAt: map["lymphocytes"].testedAt,
              status: "normal"
            };
          }
        }

        // Derive Neutrophil % from absolute count if missing
        if (map["neutrophils"] && !map["neutrophil_percent"]) {
          const rawPercent = (map["neutrophils"].value / wbc.value) * 100;
          const roundedPercent = Math.round(rawPercent * 10) / 10;
          if (roundedPercent >= 0 && roundedPercent <= 100) {
            map["neutrophil_percent"] = {
              value: roundedPercent,
              testedAt: map["neutrophils"].testedAt,
              status: "normal"
            };
          }
        }

        // Derive Monocyte % from absolute count if missing
        if (map["monocytes"] && !map["monocyte_percent"]) {
          const rawPercent = (map["monocytes"].value / wbc.value) * 100;
          const roundedPercent = Math.round(rawPercent * 10) / 10;
          if (roundedPercent >= 0 && roundedPercent <= 100) {
            map["monocyte_percent"] = {
              value: roundedPercent,
              testedAt: map["monocytes"].testedAt,
              status: "normal"
            };
          }
        }

        // Derive Eosinophil % from absolute count if missing
        if (map["eosinophils"] && !map["eosinophil_percent"]) {
          const rawPercent = (map["eosinophils"].value / wbc.value) * 100;
          const roundedPercent = Math.round(rawPercent * 10) / 10;
          if (roundedPercent >= 0 && roundedPercent <= 100) {
            map["eosinophil_percent"] = {
              value: roundedPercent,
              testedAt: map["eosinophils"].testedAt,
              status: "normal"
            };
          }
        }

        // Derive Basophil % from absolute count if missing
        if (map["basophils"] && !map["basophil_percent"]) {
          const rawPercent = (map["basophils"].value / wbc.value) * 100;
          const roundedPercent = Math.round(rawPercent * 10) / 10;
          if (roundedPercent >= 0 && roundedPercent <= 100) {
            map["basophil_percent"] = {
              value: roundedPercent,
              testedAt: map["basophils"].testedAt,
              status: "normal"
            };
          }
        }
      }

      // Derive cholesterol ratios if missing
      const tc = map["total_cholesterol"];
      const hdl = map["hdl_cholesterol"];
      const ldl = map["ldl_cholesterol"];
      const tg = map["triglycerides"];

      if (tc && hdl && hdl.value > 0 && !map["tc_hdl_ratio"]) {
        const ratio = Math.round((tc.value / hdl.value) * 10) / 10;
        if (ratio > 0 && ratio < 15) {
          map["tc_hdl_ratio"] = { value: ratio, testedAt: tc.testedAt, status: "normal" };
        }
      }

      if (ldl && hdl && hdl.value > 0 && !map["ldl_hdl_ratio"]) {
        const ratio = Math.round((ldl.value / hdl.value) * 10) / 10;
        if (ratio > 0 && ratio < 10) {
          map["ldl_hdl_ratio"] = { value: ratio, testedAt: ldl.testedAt, status: "normal" };
        }
      }

      if (tg && hdl && hdl.value > 0 && !map["tg_hdl_ratio"]) {
        const ratio = Math.round((tg.value / hdl.value) * 10) / 10;
        if (ratio > 0 && ratio < 15) {
          map["tg_hdl_ratio"] = { value: ratio, testedAt: tg.testedAt, status: "normal" };
        }
      }

      // Derive Non-HDL cholesterol if missing
      if (tc && hdl && !map["non_hdl_cholesterol"]) {
        const nonHdl = Math.round((tc.value - hdl.value) * 100) / 100;
        if (nonHdl > 0 && nonHdl < 10) {
          map["non_hdl_cholesterol"] = { value: nonHdl, testedAt: tc.testedAt, status: "normal" };
        }
      }

      // Derive HOMA-IR if missing
      const glucose = map["glucose"];
      const insulin = map["insulin"];
      if (glucose && insulin && !map["homa_ir"]) {
        const homaIr = Math.round((insulin.value * glucose.value / 22.5) * 100) / 100;
        if (homaIr > 0 && homaIr < 20) {
          map["homa_ir"] = { value: homaIr, testedAt: glucose.testedAt, status: "normal" };
        }
      }
    }
    return map;
  }, [biomarkerData]);

  // Calculate summary stats (using gender-specific ranges)
  const stats = useMemo(() => {
    let optimal = 0;
    let normal = 0;
    let attention = 0;
    let noData = 0;

    for (const category of Object.values(bloodPanelConfig)) {
      for (const biomarker of category.biomarkers) {
        const data = biomarkerValues[biomarker.id];
        if (!data) {
          noData++;
          continue;
        }
        const status = getBiomarkerStatus(data.value, biomarker, gender);
        const normalized = normalizeStatus(status.status);
        if (normalized.label === "Optimal") optimal++;
        else if (normalized.label === "Normal") normal++;
        else attention++; // Includes both Attention and Critical
      }
    }

    const total = optimal + normal + attention;
    return { optimal, normal, attention, noData, total };
  }, [biomarkerValues, gender]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading blood panel data...</p>
        </div>
      </div>
    );
  }

  const categories = activeCategory === "all"
    ? Object.entries(bloodPanelConfig)
    : Object.entries(bloodPanelConfig).filter(([key]) => key === activeCategory);

  // Count total biomarkers
  const totalBiomarkers = Object.values(bloodPanelConfig).reduce(
    (acc, cat) => acc + cat.biomarkers.length, 0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Droplet className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-foreground">
              Full Blood Panel
            </h1>
            <p className="text-muted-foreground text-sm">
              {totalBiomarkers}+ biomarkers across {Object.keys(bloodPanelConfig).length} vital health categories
            </p>
          </div>
        </div>
        {/* Gender indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg">
          <User className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {gender === 'male' ? 'Male' : 'Female'} reference ranges
          </span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Tests Taken</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 border-green-200/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.optimal}</p>
                <p className="text-xs text-muted-foreground">Optimal</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50/50 border-yellow-200/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.normal}</p>
                <p className="text-xs text-muted-foreground">Normal</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50/50 border-orange-200/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{stats.attention}</p>
                <p className="text-xs text-muted-foreground">Attention</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-50/50 border-gray-200/50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-500/10 flex items-center justify-center">
                <Info className="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-500">{stats.noData}</p>
                <p className="text-xs text-muted-foreground">Not Tested</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Badge
          variant={activeCategory === "all" ? "default" : "outline"}
          className="cursor-pointer px-3 py-1.5"
          onClick={() => setActiveCategory("all")}
        >
          All Panels
        </Badge>
        {Object.entries(bloodPanelConfig).map(([key, config]) => (
          <Badge
            key={key}
            variant={activeCategory === key ? "default" : "outline"}
            className="cursor-pointer px-3 py-1.5 gap-1"
            onClick={() => setActiveCategory(key)}
            style={activeCategory === key ? { backgroundColor: config.color } : undefined}
          >
            <config.icon className="w-3 h-3" />
            {config.name}
          </Badge>
        ))}
      </div>

      {/* Panel Tables */}
      <div className="space-y-8">
        {categories.map(([key, config]) => {
          const Icon = config.icon;
          const panelBiomarkers = config.biomarkers.map(b => {
            const data = biomarkerValues[b.id];
            const rawStatus = getBiomarkerStatus(data?.value, b, gender);
            const normalizedStatus = normalizeStatus(rawStatus.status);
            return {
              ...b,
              data,
              ranges: getDisplayRanges(b, gender),
              hasGenderRange: hasGenderSpecificRanges(b),
              status: normalizedStatus
            };
          });

          const panelOptimal = panelBiomarkers.filter(b => b.data && b.status.label === "Optimal").length;
          const panelNormal = panelBiomarkers.filter(b => b.data && b.status.label === "Normal").length;
          const panelAttention = panelBiomarkers.filter(b => b.data && (b.status.label === "Attention" || b.status.label === "Critical")).length;

          return (
            <Card key={key}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" style={{ color: config.color }} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{config.name}</CardTitle>
                      <CardDescription>{config.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {panelOptimal} Optimal
                    </Badge>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                      {panelNormal} Normal
                    </Badge>
                    {panelAttention > 0 && (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        {panelAttention} Attention
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[200px]">Biomarker</TableHead>
                        <TableHead className="text-center">Your Value</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-center text-green-600">Optimal Range</TableHead>
                        <TableHead className="text-center text-yellow-600">Normal Range</TableHead>
                        <TableHead className="text-center">Unit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {panelBiomarkers.map((biomarker) => (
                        <TableRow key={biomarker.id} className={biomarker.data ? "" : "opacity-50"}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{biomarker.shortName}</span>
                              <span className="text-muted-foreground text-sm hidden sm:inline">
                                {biomarker.name}
                              </span>
                              {biomarker.hasGenderRange && (
                                <span title={`${gender === 'male' ? 'Male' : 'Female'} specific range`}>
                                  <User className="w-3 h-3 text-purple-500" />
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {biomarker.data ? (
                              <span className="font-bold text-lg">{biomarker.data.value}</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <StatusIcon status={biomarker.status.label} />
                              <Badge className={`${biomarker.status.bgColor} ${biomarker.status.color} border-0`}>
                                {biomarker.status.label}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="inline-flex items-center px-2 py-1 rounded bg-green-50 text-green-700 text-sm font-medium">
                              {biomarker.ranges.optimal}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="inline-flex items-center px-2 py-1 rounded bg-yellow-50 text-yellow-700 text-sm">
                              {biomarker.ranges.normal}
                            </div>
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground text-sm">
                            {biomarker.unit}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Info className="w-4 h-4 text-muted-foreground" />
            Reference Range Guide (Australian SI Units)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50">
              <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <p className="font-medium text-green-700">Optimal</p>
                <p className="text-xs text-green-600">Values in the ideal range for best health outcomes</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-700">Normal</p>
                <p className="text-xs text-yellow-600">Within standard reference range but not optimal</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-700">Attention</p>
                <p className="text-xs text-orange-600">Outside normal range, may need attention</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-700">Critical</p>
                <p className="text-xs text-red-600">Significantly abnormal, consult your doctor</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4 text-purple-500" />
              <span>Indicates gender-specific reference range</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Note: Reference ranges are based on Australian pathology standards (SI units) and may vary by laboratory.
            Hormone ranges for females may vary depending on menstrual cycle phase.
            Always consult with your healthcare provider for interpretation of your results.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
