import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { TermsContent } from "@/lib/legal/pages/terms-content";

export const metadata = {
  title: "Terms & Conditions | Sanative",
  description: "Terms and conditions for using Sanative Health services and website.",
};

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms & Conditions">
      <TermsContent />
    </LegalPageLayout>
  );
}
