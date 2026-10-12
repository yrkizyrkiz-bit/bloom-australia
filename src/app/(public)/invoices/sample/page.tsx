import { TaxInvoiceDocument } from "@/components/billing/TaxInvoiceDocument";
import { SAMPLE_MEMBERSHIP_INVOICE } from "@/lib/billing/tax-invoice-pdf";

export default function SampleTaxInvoicePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="mb-4 text-sm text-[#5c7a52]">
        This is a sample. It is not a record of a real payment.
      </p>
      <TaxInvoiceDocument
        invoice={SAMPLE_MEMBERSHIP_INVOICE}
        eyebrow="Sample only"
        footnote="Sample only. This is not a record of a real payment. The price is GST-inclusive."
        downloadHref="/api/invoices/sample?download=1"
      />
    </main>
  );
}
