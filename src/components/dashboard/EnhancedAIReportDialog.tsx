"use client";

import { useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  HolisticHealthReportEmpty,
  HolisticHealthReportView,
} from "@/components/dashboard/HolisticHealthReportView";
import {
  GeorgeReportLoader,
  preloadGeorgeLoaderFrames,
} from "@/components/dashboard/GeorgeReportLoader";
import { useHolisticHealthReport } from "@/hooks/useHolisticHealthReport";
import { useGeorgeLoaderPhase } from "@/hooks/useGeorgeLoaderPhase";
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
  const generationError = generateError || state?.generationError || null;
  const { showLoader, complete } = useGeorgeLoaderPhase(
    waitingForClaude,
    Boolean(generationError)
  );

  useEffect(() => {
    if (open) preloadGeorgeLoaderFrames();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#5c7a52]" />
            Doctor-Assisted AI-Powered Report
          </DialogTitle>
        </DialogHeader>

        {showLoader ? (
          <GeorgeReportLoader complete={complete} className="george-loader--compact" />
        ) : loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-[#5c7a52]" />
            Preparing your holistic report...
          </div>
        ) : !report ? (
          <HolisticHealthReportEmpty
            biomarkerCount={state?.biomarkerCount || 0}
            canGenerate={Boolean(state?.canGenerate || generationError)}
            waitingForClaude={waitingForClaude}
            generateError={generationError}
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
