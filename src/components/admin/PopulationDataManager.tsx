"use client";

import { useState } from "react";
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
import {
  BarChart3,
  Edit,
  Upload,
  Download,
  RefreshCw,
  Save,
  AlertCircle,
  CheckCircle,
  Info
} from "lucide-react";
import { toast } from "sonner";

interface PopulationStat {
  biomarkerId: string;
  biomarkerName: string;
  unit: string;
  mean: number;
  median: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
  sampleSize: number;
  lastUpdated: string;
  source: string;
}

const mockPopulationData: PopulationStat[] = [
  { biomarkerId: "alt", biomarkerName: "ALT", unit: "U/L", mean: 28, median: 24, p10: 12, p25: 18, p75: 35, p90: 48, sampleSize: 15420, lastUpdated: "2024-01-15", source: "ABS Health Survey 2023" },
  { biomarkerId: "ast", biomarkerName: "AST", unit: "U/L", mean: 26, median: 23, p10: 12, p25: 17, p75: 32, p90: 42, sampleSize: 15420, lastUpdated: "2024-01-15", source: "ABS Health Survey 2023" },
  { biomarkerId: "ggt", biomarkerName: "GGT", unit: "U/L", mean: 32, median: 26, p10: 12, p25: 18, p75: 42, p90: 58, sampleSize: 15420, lastUpdated: "2024-01-15", source: "ABS Health Survey 2023" },
  { biomarkerId: "glucose", biomarkerName: "Fasting Glucose", unit: "mg/dL", mean: 98, median: 94, p10: 78, p25: 85, p75: 108, p90: 118, sampleSize: 18500, lastUpdated: "2024-01-15", source: "ABS Health Survey 2023" },
  { biomarkerId: "hba1c", biomarkerName: "HbA1c", unit: "%", mean: 5.6, median: 5.4, p10: 4.8, p25: 5.1, p75: 6.0, p90: 6.4, sampleSize: 18500, lastUpdated: "2024-01-15", source: "ABS Health Survey 2023" },
  { biomarkerId: "insulin", biomarkerName: "Fasting Insulin", unit: "μIU/mL", mean: 9.5, median: 8, p10: 3, p25: 5, p75: 14, p90: 20, sampleSize: 12800, lastUpdated: "2024-01-15", source: "ABS Health Survey 2023" },
  { biomarkerId: "total_cholesterol", biomarkerName: "Total Cholesterol", unit: "mg/dL", mean: 198, median: 195, p10: 150, p25: 170, p75: 225, p90: 250, sampleSize: 22000, lastUpdated: "2024-01-15", source: "ABS Health Survey 2023" },
  { biomarkerId: "triglycerides", biomarkerName: "Triglycerides", unit: "mg/dL", mean: 135, median: 120, p10: 60, p25: 85, p75: 175, p90: 220, sampleSize: 22000, lastUpdated: "2024-01-15", source: "ABS Health Survey 2023" },
  { biomarkerId: "ldl_cholesterol", biomarkerName: "LDL Cholesterol", unit: "mg/dL", mean: 115, median: 110, p10: 65, p25: 85, p75: 140, p90: 165, sampleSize: 22000, lastUpdated: "2024-01-15", source: "ABS Health Survey 2023" },
  { biomarkerId: "hdl_cholesterol", biomarkerName: "HDL Cholesterol", unit: "mg/dL", mean: 52, median: 50, p10: 35, p25: 42, p75: 62, p90: 75, sampleSize: 22000, lastUpdated: "2024-01-15", source: "ABS Health Survey 2023" },
  { biomarkerId: "crp", biomarkerName: "CRP", unit: "mg/L", mean: 2.1, median: 1.5, p10: 0.3, p25: 0.6, p75: 3.2, p90: 5.5, sampleSize: 14200, lastUpdated: "2024-01-15", source: "ABS Health Survey 2023" },
  { biomarkerId: "ferritin", biomarkerName: "Ferritin", unit: "ng/mL", mean: 85, median: 70, p10: 25, p25: 40, p75: 120, p90: 180, sampleSize: 16800, lastUpdated: "2024-01-15", source: "ABS Health Survey 2023" },
  { biomarkerId: "uric_acid", biomarkerName: "Uric Acid", unit: "mg/dL", mean: 5.8, median: 5.5, p10: 3.5, p25: 4.5, p75: 6.8, p90: 7.8, sampleSize: 14200, lastUpdated: "2024-01-15", source: "ABS Health Survey 2023" },
];

export function PopulationDataManager() {
  const [data, setData] = useState<PopulationStat[]>(mockPopulationData);
  const [editingItem, setEditingItem] = useState<PopulationStat | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const handleEdit = (item: PopulationStat) => {
    setEditingItem({ ...item });
    setIsEditDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingItem) return;

    setData(prev => prev.map(item =>
      item.biomarkerId === editingItem.biomarkerId
        ? { ...editingItem, lastUpdated: new Date().toISOString().split('T')[0] }
        : item
    ));
    setIsEditDialogOpen(false);
    setEditingItem(null);
    toast.success("Population data updated successfully");
  };

  const handleExport = () => {
    const csv = [
      ["Biomarker", "Unit", "Mean", "Median", "P10", "P25", "P75", "P90", "Sample Size", "Source", "Last Updated"],
      ...data.map(d => [d.biomarkerName, d.unit, d.mean, d.median, d.p10, d.p25, d.p75, d.p90, d.sampleSize, d.source, d.lastUpdated])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "population_data.csv";
    a.click();
    toast.success("Data exported successfully");
  };

  const handleBulkUpdate = () => {
    toast.success("Bulk update feature - would open file upload dialog");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Population Reference Data
              </CardTitle>
              <CardDescription>
                Manage the Australian population statistics used for member comparisons
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-1" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleBulkUpdate}>
                <Upload className="w-4 h-4 mr-1" />
                Bulk Update
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Info Banner */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 mb-6">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-700 dark:text-blue-400">Data Source Information</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Population data is sourced from the Australian Bureau of Statistics Health Survey.
                  Data represents Australian adults aged 30-50 and is updated quarterly.
                </p>
              </div>
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-4 mb-4">
            <Label>Filter by category:</Label>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Biomarkers</SelectItem>
                <SelectItem value="liver">Liver Enzymes</SelectItem>
                <SelectItem value="metabolic">Metabolic</SelectItem>
                <SelectItem value="lipid">Lipid Profile</SelectItem>
                <SelectItem value="inflammation">Inflammation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Biomarker</TableHead>
                  <TableHead className="text-right">Mean</TableHead>
                  <TableHead className="text-right">Median</TableHead>
                  <TableHead className="text-right">P10</TableHead>
                  <TableHead className="text-right">P25</TableHead>
                  <TableHead className="text-right">P75</TableHead>
                  <TableHead className="text-right">P90</TableHead>
                  <TableHead className="text-right">Sample</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.biomarkerId}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{item.biomarkerName}</span>
                        <span className="text-xs text-muted-foreground ml-1">({item.unit})</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">{item.mean}</TableCell>
                    <TableCell className="text-right font-mono">{item.median}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{item.p10}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{item.p25}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{item.p75}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{item.p90}</TableCell>
                    <TableCell className="text-right">{item.sampleSize.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {item.lastUpdated}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Population Data - {editingItem?.biomarkerName}</DialogTitle>
            <DialogDescription>
              Update the percentile values for this biomarker
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Mean</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editingItem.mean}
                    onChange={(e) => setEditingItem({ ...editingItem, mean: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Median</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editingItem.median}
                    onChange={(e) => setEditingItem({ ...editingItem, median: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label>P10</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editingItem.p10}
                    onChange={(e) => setEditingItem({ ...editingItem, p10: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>P25</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editingItem.p25}
                    onChange={(e) => setEditingItem({ ...editingItem, p25: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>P75</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editingItem.p75}
                    onChange={(e) => setEditingItem({ ...editingItem, p75: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>P90</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editingItem.p90}
                    onChange={(e) => setEditingItem({ ...editingItem, p90: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sample Size</Label>
                  <Input
                    type="number"
                    value={editingItem.sampleSize}
                    onChange={(e) => setEditingItem({ ...editingItem, sampleSize: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Data Source</Label>
                  <Input
                    value={editingItem.source}
                    onChange={(e) => setEditingItem({ ...editingItem, source: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-1" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
