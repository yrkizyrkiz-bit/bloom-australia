import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { TaxInvoiceDocument } from "@/components/billing/TaxInvoiceDocument";
import {
  isInvoiceStaffRole,
  loadTaxInvoiceForViewer,
} from "@/lib/billing/load-member-tax-invoice";
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

  const staff = isInvoiceStaffRole(session.user.role);
  const invoice = await loadTaxInvoiceForViewer(session.user.id, session.user.role, id);
  if (!invoice) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="mb-4">
        <Link
          href={staff ? "/admin/crm/billing" : "/dashboard/billing"}
          className="text-sm text-[#5c7a52]"
        >
          {staff ? "Back to invoices" : "Back to payment history"}
        </Link>
      </p>
      <TaxInvoiceDocument
        invoice={invoice}
        downloadHref={`/api/account/billing/invoices/${id}/pdf?download=1`}
      />
    </main>
  );
}
