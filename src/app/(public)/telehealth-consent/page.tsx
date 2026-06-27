import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { TelehealthConsentContent } from "@/lib/legal/pages/telehealth-consent-content";

export const metadata = {
  title: "Telehealth Consent | Sanative",
  description: "Consent information for Sanative telehealth consultations.",
};

export default function TelehealthConsentPage() {
  return (
    <LegalPageLayout title="Consent to Telehealth">
      <TelehealthConsentContent />
    </LegalPageLayout>
  );
}
