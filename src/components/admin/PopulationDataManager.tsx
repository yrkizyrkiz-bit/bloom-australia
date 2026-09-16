"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart3, RotateCcw, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AU_POPULATION_AGE_BANDS,
  type AuAgeBandId,
  type AuPopulationCategory,
  type AuPopulationDataset,
  type AuSex,
} from "@/lib/au-population";

export function PopulationDataManager() {
  const [dataset, setDataset] = useState<AuPopulationDataset | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [usingOverride, setUsingOverride] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [category, setCategory] = useState<AuPopulationCategory>("heart");
  const [sex, setSex] = useState<AuSex>("male");
  const [band, setBand] = useState<AuAgeBandId>("45-54");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/population-references");
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      setDataset(json.dataset);
      setUpdatedAt(json.updatedAt);
      setUsingOverride(Boolean(json.usingOverride));
    } catch {
      toast.error("Could not load population reference data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const rows = useMemo(() => {
    if (!dataset) return [];
    return dataset.markers.filter((m) => m.category === category);
  }, [dataset, category]);

  const updateCell = (
    biomarkerId: string,
    field: "mean" | "p25" | "p75" | "absAbnormalPercent",
    value: number
  ) => {
    setDataset((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        markers: prev.markers.map((m) => {
          if (m.biomarkerId !== biomarkerId) return m;
          const stats = { ...m.stats[sex][band], [field]: value };
          return {
            ...m,
            stats: {
              ...m.stats,
              [sex]: { ...m.stats[sex], [band]: stats },
            },
          };
        }),
      };
    });
  };

  const save = async () => {
    if (!dataset) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/population-references", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dataset }),
      });
      if (!res.ok) throw new Error("Save failed");
      const json = await res.json();
      setUpdatedAt(json.updatedAt);
      setUsingOverride(true);
      toast.success("Population reference data saved");
    } catch {
      toast.error("Could not save — check you are signed in as clinical staff");
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/population-references", { method: "DELETE" });
      if (!res.ok) throw new Error("Reset failed");
      await load();
      toast.success("Restored shipped ABS defaults");
    } catch {
      toast.error("Could not restore defaults");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !dataset) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading reference data…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Population reference data
              </CardTitle>
              <CardDescription>
                Age- and sex-matched Australian comparison stats used on organ Compare tabs.
                Review annually when ABS publishes a new National Health Measures Survey.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetDefaults} disabled={saving}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Restore defaults
              </Button>
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Save
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge variant={usingOverride ? "default" : "outline"}>
              {usingOverride ? "Server override" : "Shipped defaults"}
            </Badge>
            {updatedAt && (
              <span className="text-muted-foreground">
                Last saved {new Date(updatedAt).toLocaleDateString("en-AU")}
              </span>
            )}
          </div>

          {dataset.sources[0] && (
            <p className="text-sm text-muted-foreground">
              Citation: {dataset.sources[0].name} ({dataset.sources[0].surveyYears})
            </p>
          )}

          <div className="flex flex-wrap gap-4">
            <div>
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as AuPopulationCategory)}>
                <SelectTrigger className="w-40 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="heart">Heart</SelectItem>
                  <SelectItem value="liver">Liver</SelectItem>
                  <SelectItem value="kidney">Kidney</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sex</Label>
              <Select value={sex} onValueChange={(v) => setSex(v as AuSex)}>
                <SelectTrigger className="w-36 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Age group</Label>
              <Select value={band} onValueChange={(v) => setBand(v as AuAgeBandId)}>
                <SelectTrigger className="w-48 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AU_POPULATION_AGE_BANDS.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marker</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Mean</TableHead>
                  <TableHead className="text-right">P25</TableHead>
                  <TableHead className="text-right">P75</TableHead>
                  <TableHead className="text-right">ABS abnormal %</TableHead>
                  <TableHead>Quality</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((marker) => {
                  const stats = marker.stats[sex][band];
                  return (
                    <TableRow key={marker.biomarkerId}>
                      <TableCell className="font-medium">{marker.name}</TableCell>
                      <TableCell className="text-muted-foreground">{marker.unit}</TableCell>
                      {(["mean", "p25", "p75"] as const).map((field) => (
                        <TableCell key={field} className="text-right">
                          <Input
                            className="h-8 w-24 ml-auto text-right font-mono"
                            type="number"
                            step="0.01"
                            value={stats[field]}
                            onChange={(e) =>
                              updateCell(marker.biomarkerId, field, parseFloat(e.target.value))
                            }
                          />
                        </TableCell>
                      ))}
                      <TableCell className="text-right">
                        <Input
                          className="h-8 w-24 ml-auto text-right font-mono"
                          type="number"
                          step="0.1"
                          value={stats.absAbnormalPercent ?? ""}
                          onChange={(e) =>
                            updateCell(
                              marker.biomarkerId,
                              "absAbnormalPercent",
                              parseFloat(e.target.value)
                            )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs capitalize">
                          {stats.quality}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
