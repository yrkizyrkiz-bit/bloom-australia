import { LegalPageLayout } from "@/components/legal/LegalPageLayout";
import { RefundPolicyContent } from "@/lib/legal/pages/refund-policy-content";
import { publicPageMeta } from "@/lib/seo/public-page-meta";


export const metadata = publicPageMeta.refundPolicy;

export default function RefundPolicyPage() {
  return (
    <LegalPageLayout title="Refunds, Cancellations and Program Payments">
      <RefundPolicyContent />
    </LegalPageLayout>
  );
}
