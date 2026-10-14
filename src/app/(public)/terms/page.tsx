import { LegalEmbeddedDocument, LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { MedicalDisclaimerContent } from "@/lib/legal/pages/medical-disclaimer-content";
import { SubscriptionTermsContent } from "@/lib/legal/pages/subscription-terms-content";
import { TelehealthConsentContent } from "@/lib/legal/pages/telehealth-consent-content";
import { TermsContent } from "@/lib/legal/pages/terms-content";
import { publicPageMeta } from "@/lib/seo/public-page-meta";


export const metadata = publicPageMeta.terms;

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms & Conditions">
      <TermsContent />
      <LegalEmbeddedDocument id="medical-disclaimer" title="Medical Disclaimer">
        <MedicalDisclaimerContent />
      </LegalEmbeddedDocument>
      <LegalEmbeddedDocument id="telehealth-consent" title="Telehealth Consent">
        <TelehealthConsentContent />
      </LegalEmbeddedDocument>
      <LegalEmbeddedDocument id="subscription-terms" title="Subscription Terms">
        <SubscriptionTermsContent />
      </LegalEmbeddedDocument>
    </LegalPageLayout>
  );
}
