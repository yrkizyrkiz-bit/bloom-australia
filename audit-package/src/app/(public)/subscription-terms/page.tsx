import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { SubscriptionTermsContent } from "@/lib/legal/pages/subscription-terms-content";

export const metadata = {
  title: "Subscription Terms | Sanative",
  description: "Subscription billing and cancellation terms for Sanative programs.",
};

export default function SubscriptionTermsPage() {
  return (
    <LegalPageLayout title="Subscription Terms">
      <SubscriptionTermsContent />
    </LegalPageLayout>
  );
}
