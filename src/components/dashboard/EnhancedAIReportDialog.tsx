"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  HolisticHealthReportEmpty,
  HolisticHealthReportView,
} from "@/components/dashboard/HolisticHealthReportView";
import { useHolisticHealthReport } from "@/hooks/useHolisticHealthReport";
import { Sparkles, Loader2 } from "lucide-react";

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
  onOpenChange,
}: EnhancedAIReportDialogProps) {
  const {
    state,
    loading,
    generateError,
    waitingForClaude,
    generateReport,
  } = useHolisticHealthReport({
    userId,
    enabled: open,
  });

  const report = state?.report;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#5c7a52]" />
            AI-Powered Health Report
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-[#5c7a52]" />
            Preparing your holistic report...
          </div>
        ) : !report ? (
          <HolisticHealthReportEmpty
            biomarkerCount={state?.biomarkerCount || 0}
            canGenerate={Boolean(state?.canGenerate || state?.generationError || generateError)}
            waitingForClaude={waitingForClaude}
            generateError={generateError || state?.generationError || null}
            onGenerate={generateReport}
          />
        ) : (
          <ScrollArea className="h-[70vh]">
            <div className="pr-4">
              <HolisticHealthReportView
                report={report}
                userId={userId}
                userName={userName}
                dataDate={state?.dataDate}
                canGenerate={state?.canGenerate}
                waitingForClaude={waitingForClaude}
                onGenerate={generateReport}
              />
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
