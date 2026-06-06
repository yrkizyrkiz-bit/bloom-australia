"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Download,
  FileText,
  FileSpreadsheet,
  Calendar,
  Clock,
  CheckCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface ExportConfig {
  format: "csv" | "pdf";
  dateRange: "7d" | "30d" | "90d" | "1y" | "all";
  includeFields: string[];
}

interface ExportHistory {
  id: string;
  name: string;
  format: "csv" | "pdf";
  dateRange: string;
  recordCount: number;
  generatedAt: string;
  size: string;
  status: "completed" | "processing" | "failed";
}

interface DataExportProps {
  dataType: "members" | "goals" | "tests" | "notifications" | "analytics";
  availableFields: { id: string; label: string; default: boolean }[];
}

const mockExportHistory: ExportHistory[] = [
  { id: "e1", name: "Members Export", format: "csv", dateRange: "Last 30 days", recordCount: 156, generatedAt: "2024-01-15 14:30", size: "45 KB", status: "completed" },
  { id: "e2", name: "Goals Report", format: "pdf", dateRange: "Last 90 days", recordCount: 89, generatedAt: "2024-01-14 10:15", size: "1.2 MB", status: "completed" },
  { id: "e3", name: "Test Results", format: "csv", dateRange: "Last 7 days", recordCount: 34, generatedAt: "2024-01-13 16:45", size: "28 KB", status: "completed" },
];

export function DataExport({ dataType, availableFields }: DataExportProps) {
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory] = useState<ExportHistory[]>(mockExportHistory);
  const [config, setConfig] = useState<ExportConfig>({
    format: "csv",
    dateRange: "30d",
    includeFields: availableFields.filter(f => f.default).map(f => f.id)
  });

  const handleExport = async () => {
    if (config.includeFields.length === 0) {
      toast.error("Please select at least one field to export");
      return;
    }

    setIsExporting(true);

    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock data for export
    const mockData = generateMockExportData(dataType, config);

    if (config.format === "csv") {
      downloadCSV(mockData, `${dataType}_export_${Date.now()}.csv`);
    } else {
      downloadPDF(mockData, `${dataType}_report_${Date.now()}.pdf`);
    }

    setIsExporting(false);
    setIsExportDialogOpen(false);
    toast.success(`${config.format.toUpperCase()} export completed`);
  };

  const toggleField = (fieldId: string) => {
    setConfig(prev => ({
      ...prev,
      includeFields: prev.includeFields.includes(fieldId)
        ? prev.includeFields.filter(f => f !== fieldId)
        : [...prev.includeFields, fieldId]
    }));
  };

  const selectAllFields = () => {
    setConfig(prev => ({
      ...prev,
      includeFields: availableFields.map(f => f.id)
    }));
  };

  const deselectAllFields = () => {
    setConfig(prev => ({
      ...prev,
      includeFields: []
    }));
  };

  return (
    <div className="space-y-6">
      {/* Export Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Download className="w-5 h-5 text-primary" />
                Data Export
              </CardTitle>
              <CardDescription>Export {dataType} data as CSV or PDF reports</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => { setConfig(prev => ({ ...prev, format: "csv" })); setIsExportDialogOpen(true); }}
              >
                <FileSpreadsheet className="w-4 h-4 mr-1" />
                Export CSV
              </Button>
              <Button
                onClick={() => { setConfig(prev => ({ ...prev, format: "pdf" })); setIsExportDialogOpen(true); }}
              >
                <FileText className="w-4 h-4 mr-1" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Recent Exports */}
          <div>
            <h4 className="text-sm font-medium mb-3">Recent Exports</h4>
            <div className="space-y-2">
              {exportHistory.map(export_ => (
                <div key={export_.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                  <div className="flex items-center gap-3">
                    {export_.format === "csv" ? (
                      <FileSpreadsheet className="w-8 h-8 text-green-600" />
                    ) : (
                      <FileText className="w-8 h-8 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{export_.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{export_.recordCount} records</span>
                        <span>|</span>
                        <span>{export_.dateRange}</span>
                        <span>|</span>
                        <span>{export_.size}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {export_.generatedAt}
                      </div>
                    </div>
                    {export_.status === "completed" ? (
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    ) : export_.status === "processing" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Badge variant="destructive">Failed</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {config.format === "csv" ? (
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
              ) : (
                <FileText className="w-5 h-5 text-red-600" />
              )}
              Export {config.format.toUpperCase()}
            </DialogTitle>
            <DialogDescription>
              Configure your {dataType} data export
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Format Selection */}
            <div>
              <Label>Export Format</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  variant={config.format === "csv" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setConfig(prev => ({ ...prev, format: "csv" }))}
                >
                  <FileSpreadsheet className="w-4 h-4 mr-1" />
                  CSV
                </Button>
                <Button
                  variant={config.format === "pdf" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setConfig(prev => ({ ...prev, format: "pdf" }))}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  PDF Report
                </Button>
              </div>
            </div>

            {/* Date Range */}
            <div>
              <Label>Date Range</Label>
              <Select
                value={config.dateRange}
                onValueChange={(v: ExportConfig["dateRange"]) => setConfig(prev => ({ ...prev, dateRange: v }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Field Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Include Fields</Label>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAllFields}>
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={deselectAllFields}>
                    Clear
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                {availableFields.map(field => (
                  <label
                    key={field.id}
                    className="flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer"
                  >
                    <Checkbox
                      checked={config.includeFields.includes(field.id)}
                      onCheckedChange={() => toggleField(field.id)}
                    />
                    <span className="text-sm">{field.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {config.includeFields.length} of {availableFields.length} fields selected
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Helper functions for export
function generateMockExportData(dataType: string, config: ExportConfig): Record<string, unknown>[] {
  // Generate mock data based on data type
  const mockRecords = [];
  const recordCount = config.dateRange === "7d" ? 25 : config.dateRange === "30d" ? 100 : 250;

  for (let i = 0; i < recordCount; i++) {
    const record: Record<string, unknown> = {};
    config.includeFields.forEach(field => {
      record[field] = `Sample ${field} ${i + 1}`;
    });
    mockRecords.push(record);
  }

  return mockRecords;
}

function downloadCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map(row => headers.map(h => `"${row[h]}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

function downloadPDF(data: Record<string, unknown>[], filename: string) {
  // For PDF, we'll create a simple HTML-based printable document
  // In production, you'd use a library like jsPDF or html2pdf
  const headers = data.length > 0 ? Object.keys(data[0]) : [];

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${filename}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f4f4f4; }
        tr:nth-child(even) { background-color: #fafafa; }
        .footer { margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <h1>Sanative Health Export Report</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <p>Total Records: ${data.length}</p>
      <table>
        <thead>
          <tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${data.slice(0, 50).map(row => `
            <tr>${headers.map(h => `<td>${row[h]}</td>`).join("")}</tr>
          `).join("")}
        </tbody>
      </table>
      ${data.length > 50 ? `<p class="footer">Showing first 50 of ${data.length} records</p>` : ""}
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: "text/html" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename.replace(".pdf", ".html");
  link.click();

  // Note: For actual PDF generation, integrate jsPDF or similar library
  toast.info("PDF exported as HTML. For full PDF support, integrate a PDF library.");
}

// Pre-configured export fields for different data types
export const memberExportFields = [
  { id: "name", label: "Name", default: true },
  { id: "email", label: "Email", default: true },
  { id: "phone", label: "Phone", default: false },
  { id: "joinDate", label: "Join Date", default: true },
  { id: "healthScore", label: "Health Score", default: true },
  { id: "lastLogin", label: "Last Login", default: false },
  { id: "testsCompleted", label: "Tests Completed", default: true },
  { id: "goalsActive", label: "Active Goals", default: true },
  { id: "goalsCompleted", label: "Completed Goals", default: true },
];

export const goalExportFields = [
  { id: "memberName", label: "Member Name", default: true },
  { id: "biomarker", label: "Biomarker", default: true },
  { id: "targetValue", label: "Target Value", default: true },
  { id: "currentValue", label: "Current Value", default: true },
  { id: "startDate", label: "Start Date", default: true },
  { id: "targetDate", label: "Target Date", default: true },
  { id: "progress", label: "Progress %", default: true },
  { id: "status", label: "Status", default: true },
];

export const testExportFields = [
  { id: "memberName", label: "Member Name", default: true },
  { id: "testDate", label: "Test Date", default: true },
  { id: "pathologyLab", label: "Pathology Lab", default: true },
  { id: "testType", label: "Test Type", default: true },
  { id: "status", label: "Status", default: true },
  { id: "resultsReceived", label: "Results Received", default: false },
];

export const analyticsExportFields = [
  { id: "date", label: "Date", default: true },
  { id: "activeMembers", label: "Active Members", default: true },
  { id: "newMembers", label: "New Members", default: true },
  { id: "logins", label: "Total Logins", default: true },
  { id: "testsCompleted", label: "Tests Completed", default: true },
  { id: "goalsAchieved", label: "Goals Achieved", default: true },
  { id: "avgHealthScore", label: "Avg Health Score", default: true },
];
