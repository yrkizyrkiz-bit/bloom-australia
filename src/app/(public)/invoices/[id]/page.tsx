import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { TaxInvoiceDocument } from "@/components/billing/TaxInvoiceDocument";
import { loadMemberTaxInvoice } from "@/lib/billing/load-member-tax-invoice";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MemberTaxInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }

  const invoice = await loadMemberTaxInvoice(session.user.id, id);
  if (!invoice) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="mb-4">
        <Link href="/dashboard/billing" className="text-sm text-[#5c7a52]">
          Back to payment history
        </Link>
      </p>
      <TaxInvoiceDocument
        invoice={invoice}
        downloadHref={`/api/account/billing/invoices/${id}/pdf?download=1`}
      />
    </main>
  );
}
