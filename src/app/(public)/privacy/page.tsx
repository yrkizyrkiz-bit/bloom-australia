import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { PrivacyContent } from "@/lib/legal/pages/privacy-content";
import { publicPageMeta } from "@/lib/seo/public-page-meta";


export const metadata = publicPageMeta.privacy;

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" entityName="Sanative">
      <PrivacyContent />
    </LegalPageLayout>
  );
}
