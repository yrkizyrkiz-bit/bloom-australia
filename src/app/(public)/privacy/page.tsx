import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { PrivacyContent } from "@/lib/legal/pages/privacy-content";

export const metadata = {
  title: "Privacy Policy | Sanative",
  description: "How Sanative Health Pty Ltd collects, uses, and protects your personal and health information.",
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy">
      <PrivacyContent />
    </LegalPageLayout>
  );
}
