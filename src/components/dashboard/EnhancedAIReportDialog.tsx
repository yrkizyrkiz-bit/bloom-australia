"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { generatePersonalizedReport, mockHealthScore } from "@/data/mock-data";
import { getBiomarkerById, categoryInfo } from "@/data/biomarkers";
import type { PersonalizedReport, AIInsight } from "@/types";
import {
  Sparkles,
  Download,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Link2,
  Target,
  Trophy,
  ArrowRight,
  Brain,
  Heart,
  Clock,
  Loader2
} from "lucide-react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

interface EnhancedAIReportDialogProps {
  userId: string;
  userName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EnhancedAIReportDialog({
  userId,
  userName,
  open,
  onOpenChange
}: EnhancedAIReportDialogProps) {
  const [report, setReport] = useState<PersonalizedReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const generateReport = async () => {
    setIsGenerating(true);
    // Simulate AI processing time
    await new Promise(r => setTimeout(r, 2000));
    const newReport = generatePersonalizedReport(userId);
    setReport(newReport);
    setIsGenerating(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/10 text-red-600 border-red-500/30";
      case "medium": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30";
      case "low": return "bg-green-500/10 text-green-600 border-green-500/30";
      default: return "bg-gray-500/10 text-gray-600";
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "warning": return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case "achievement": return <Trophy className="w-5 h-5 text-green-500" />;
      case "recommendation": return <Lightbulb className="w-5 h-5 text-yellow-500" />;
      case "correlation": return <Link2 className="w-5 h-5 text-blue-500" />;
      case "trend": return <TrendingUp className="w-5 h-5 text-purple-500" />;
      default: return <Brain className="w-5 h-5 text-primary" />;
    }
  };

  const InsightCard = ({ insight }: { insight: AIInsight }) => (
    <Card className="border-l-4" style={{ borderLeftColor: insight.priority === "high" ? "#ef4444" : insight.priority === "medium" ? "#eab308" : "#22c55e" }}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">{getInsightIcon(insight.type)}</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium">{insight.title}</h4>
              <Badge variant="outline" className={getPriorityColor(insight.priority)}>
                {insight.priority}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>

            {insight.relatedBiomarkers && insight.relatedBiomarkers.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {insight.relatedBiomarkers.map(id => {
                  const biomarker = getBiomarkerById(id);
                  if (!biomarker) return null;
                  return (
                    <Badge key={id} variant="outline" className="text-xs" style={{
                      borderColor: categoryInfo[biomarker.category].color,
                      color: categoryInfo[biomarker.category].color
                    }}>
                      {biomarker.shortName}
                    </Badge>
                  );
                })}
              </div>
            )}

            {insight.actionItems && insight.actionItems.length > 0 && (
              <div className="space-y-1">
                {insight.actionItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}

            {insight.projectedImprovement && (
              <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Projected Improvement</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-serif font-bold">{insight.projectedImprovement.currentValue}</span>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                  <span className="text-2xl font-serif font-bold text-green-600">{insight.projectedImprovement.projectedValue}</span>
                  <Badge className="bg-primary/10 text-primary">{insight.projectedImprovement.timeframe}</Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const downloadPDF = async () => {
    if (!report) return;
    setIsDownloading(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Cover Page
      doc.setFillColor(250, 248, 245);
      doc.rect(0, 0, pageWidth, 297, "F");

      doc.setFontSize(28);
      doc.setTextColor(60, 80, 60);
      doc.text(`${userName}'s`, pageWidth / 2, 50, { align: "center" });
      doc.text("Personalized Health Report", pageWidth / 2, 65, { align: "center" });

      doc.setFontSize(12);
      doc.setTextColor(120, 120, 120);
      doc.text(new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }), pageWidth / 2, 80, { align: "center" });

      // Health Score
      doc.setFontSize(48);
      doc.setTextColor(60, 130, 60);
      doc.text(String(mockHealthScore.overall), pageWidth / 2, 120, { align: "center" });
      doc.setFontSize(14);
      doc.setTextColor(100, 100, 100);
      doc.text("Overall Health Score", pageWidth / 2, 135, { align: "center" });

      // Summary
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      const summaryLines = doc.splitTextToSize(report.summary, pageWidth - 40);
      doc.text(summaryLines, 20, 160);

      // Key Findings Page
      doc.addPage();
      doc.setFillColor(250, 248, 245);
      doc.rect(0, 0, pageWidth, 297, "F");

      doc.setFontSize(20);
      doc.setTextColor(60, 80, 60);
      doc.text("Key Findings", 20, 30);

      let yPos = 50;
      for (const finding of report.keyFindings.slice(0, 3)) {
        doc.setFontSize(12);
        doc.setTextColor(60, 60, 60);
        doc.text(finding.title, 20, yPos);
        yPos += 8;

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        const lines = doc.splitTextToSize(finding.description, pageWidth - 40);
        doc.text(lines.slice(0, 3), 20, yPos);
        yPos += lines.slice(0, 3).length * 5 + 15;
      }

      // Recommendations Page
      doc.addPage();
      doc.setFillColor(250, 248, 245);
      doc.rect(0, 0, pageWidth, 297, "F");

      doc.setFontSize(20);
      doc.setTextColor(60, 80, 60);
      doc.text("Recommendations", 20, 30);

      yPos = 50;
      for (const rec of report.recommendations.slice(0, 3)) {
        doc.setFontSize(12);
        doc.setTextColor(60, 60, 60);
        doc.text(rec.title, 20, yPos);
        yPos += 10;

        if (rec.actionItems) {
          doc.setFontSize(10);
          doc.setTextColor(80, 80, 80);
          for (const item of rec.actionItems.slice(0, 4)) {
            doc.text(`• ${item}`, 25, yPos);
            yPos += 6;
          }
        }
        yPos += 10;
      }

      // Next Steps Page
      doc.addPage();
      doc.setFillColor(250, 248, 245);
      doc.rect(0, 0, pageWidth, 297, "F");

      doc.setFontSize(20);
      doc.setTextColor(60, 80, 60);
      doc.text("Next Steps", 20, 30);

      yPos = 50;
      report.nextSteps.forEach((step, i) => {
        doc.setFontSize(11);
        doc.setTextColor(60, 60, 60);
        doc.text(`${i + 1}. ${step}`, 20, yPos);
        yPos += 12;
      });

      doc.save(`${userName}_AI_Health_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("Report downloaded!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to download report");
    }

    setIsDownloading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Enhanced AI Health Report
          </DialogTitle>
        </DialogHeader>

        {!report ? (
          <div className="py-12 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mx-auto mb-6">
              <Brain className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-serif mb-2">Generate Your Personalized Report</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Our AI will analyze your biomarker data to provide personalized insights,
              correlations, and actionable recommendations.
            </p>
            <Button onClick={generateReport} disabled={isGenerating} size="lg" className="gap-2">
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing your data...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate AI Report
                </>
              )}
            </Button>
          </div>
        ) : (
          <ScrollArea className="h-[70vh]">
            <div className="space-y-6 pr-4">
              {/* Summary */}
              <Card className="bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-serif font-bold text-primary">{mockHealthScore.overall}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-lg mb-2">Health Summary</h3>
                      <p className="text-sm text-muted-foreground">{report.summary}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="findings">
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="findings">Key Findings</TabsTrigger>
                  <TabsTrigger value="correlations">Correlations</TabsTrigger>
                  <TabsTrigger value="recommendations">Actions</TabsTrigger>
                  <TabsTrigger value="achievements">Wins</TabsTrigger>
                  <TabsTrigger value="projections">Projections</TabsTrigger>
                </TabsList>

                <TabsContent value="findings" className="space-y-4 mt-4">
                  {report.keyFindings.map(insight => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </TabsContent>

                <TabsContent value="correlations" className="space-y-4 mt-4">
                  {report.correlations.map(insight => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-4 mt-4">
                  {report.recommendations.map(insight => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </TabsContent>

                <TabsContent value="achievements" className="space-y-4 mt-4">
                  {report.achievements.map(insight => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </TabsContent>

                <TabsContent value="projections" className="space-y-4 mt-4">
                  {report.projectedImprovements.map(insight => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </TabsContent>
              </Tabs>

              <Separator />

              {/* Risk Factors */}
              {report.riskFactors.length > 0 && (
                <div>
                  <h3 className="font-medium mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Risk Factors to Monitor
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {report.riskFactors.map((risk, i) => (
                      <Card key={i} className={`border-l-4 ${
                        risk.severity === "high" ? "border-l-red-500" :
                        risk.severity === "medium" ? "border-l-yellow-500" : "border-l-green-500"
                      }`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{risk.factor}</span>
                            <Badge className={getPriorityColor(risk.severity)}>{risk.severity}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{risk.mitigation}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Steps */}
              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Recommended Next Steps
                </h3>
                <div className="space-y-2">
                  {report.nextSteps.map((step, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <span className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium text-primary">
                        {i + 1}
                      </span>
                      <span className="text-sm">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        )}

        {report && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setReport(null)}>
              Regenerate
            </Button>
            <Button onClick={downloadPDF} disabled={isDownloading} className="gap-2">
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download PDF
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
