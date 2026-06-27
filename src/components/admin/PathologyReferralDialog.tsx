"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Mail, FlaskConical } from "lucide-react";
import { PathologyReferralFormFields } from "@/components/admin/pathology/PathologyReferralFormFields";
import {
  usePathologyReferralForm,
  type PathologyReferralPatientInput,
} from "@/components/admin/pathology/usePathologyReferralForm";

export type { PathologyReferralPatientInput };

type PathologyReferralDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: PathologyReferralPatientInput;
  consultationId?: string | null;
};

export function PathologyReferralDialog({
  open,
  onOpenChange,
  patient,
  consultationId,
}: PathologyReferralDialogProps) {
  const form = usePathologyReferralForm({
    patient,
    consultationId,
    active: open,
  });

  const handleGenerate = async () => {
    await form.generateReferral({
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col gap-0 p-0 overflow-hidden sm:max-w-2xl">
        <DialogHeader className="px-6 pt-6 pb-3 shrink-0 border-b">
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-amber-600" />
            Pathology Referral
          </DialogTitle>
          <DialogDescription>
            Complete referral details and clinical notes, then select panels for{" "}
            {patient.fullName}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
          <PathologyReferralFormFields form={form} />
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-col sm:flex-row px-6 py-4 border-t bg-white shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={form.submitting}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={form.submitting}>
            {form.submitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : form.emailToPatient ? (
              <Mail className="w-4 h-4 mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {form.emailToPatient ? "Generate PDF & email patient" : "Generate & download PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
