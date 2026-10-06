import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { RefundPolicyContent } from "@/lib/legal/pages/refund-policy-content";

export const metadata = {
  title: "Refunds, Cancellations and Program Payments | Sanative",
  description:
    "Sanative membership and program refund, cancellation and payment terms.",
};

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout title="Refunds, Cancellations and Program Payments">
      <RefundPolicyContent />
    </LegalPageLayout>
  );
}
