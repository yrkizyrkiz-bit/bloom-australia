import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { MedicalDisclaimerContent } from "@/lib/legal/pages/medical-disclaimer-content";

export const metadata = {
  title: "Medical Disclaimer | Sanative",
  description: "Important medical disclaimer for Sanative health information and assessments.",
};

export default function MedicalDisclaimerPage() {
  return (
    <LegalPageLayout title="Medical Disclaimer">
      <MedicalDisclaimerContent />
    </LegalPageLayout>
  );
}
