import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { RefundPolicyContent } from "@/lib/legal/pages/refund-policy-content";

export const metadata = {
  title: "Refund Policy | Sanative",
  description: "Sanative refund policy for program fees and subscriptions.",
};

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout title="Refund Policy">
      <RefundPolicyContent />
    </LegalPageLayout>
  );
}
