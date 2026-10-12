import { SANATIVE_LEGAL } from "@/lib/legal/constants";
import { formatAudFromCents } from "@/lib/billing/gst";
import {
  taxInvoiceTotals,
  type TaxInvoiceInput,
} from "@/lib/billing/tax-invoice-pdf";

export function TaxInvoiceDocument({
  invoice,
  eyebrow,
  footnote,
  downloadHref,
}: {
  invoice: TaxInvoiceInput;
  eyebrow?: string;
  footnote?: string;
  downloadHref?: string;
}) {
  const { totalCents, gstCents } = taxInvoiceTotals(invoice.lines);

  return (
    <>
      <article className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-[#e6ebe3]">
        <header className="flex items-end justify-between bg-[#5c7a52] px-8 py-6 text-white">
          <div>
            <p className="font-serif text-3xl">Sanative</p>
            {eyebrow ? <p className="mt-1 text-sm text-white/90">{eyebrow}</p> : null}
          </div>
          <div className="text-right">
            <p className="font-serif text-2xl">Tax invoice</p>
            <p className="mt-1 text-sm">{invoice.invoiceNumber}</p>
          </div>
        </header>

        <div className="bg-[#fdfbf7] px-8 py-6">
          <div className="text-sm leading-6 text-[#5c7a52]">
            <p className="font-semibold text-[#34412f]">Sanative</p>
            <p>{SANATIVE_LEGAL.supportEmail}</p>
            <p>sanative.com.au</p>
            <p>ABN {SANATIVE_LEGAL.abn}</p>
          </div>
        </div>

        <div className="px-8 py-6">
          <p className="text-xs font-semibold tracking-wide text-[#5c7a52]">BILL TO</p>
          <p className="mt-2 text-lg font-semibold text-[#34412f]">{invoice.billToName}</p>
          <p className="text-sm text-[#5c7a52]">{invoice.billToEmail}</p>

          <table className="mt-8 w-full text-sm">
            <thead>
              <tr className="bg-[#5c7a52] text-left text-xs tracking-wide text-white">
                <th className="px-3 py-2 font-semibold">DESCRIPTION</th>
                <th className="px-3 py-2 text-right font-semibold">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {invoice.lines.map((line) => (
                <tr key={line.description} className="border-b border-[#e6ebe3]">
                  <td className="px-3 py-3">
                    <p className="font-semibold text-[#34412f]">{line.description}</p>
                    {line.detail ? (
                      <p className="mt-1 text-xs text-[#5c7a52]">{line.detail}</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-[#34412f]">
                    {formatAudFromCents(line.amountCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex justify-end gap-8 text-sm font-semibold text-[#34412f]">
            <span>Total paid</span>
            <span>{formatAudFromCents(totalCents)} AUD</span>
          </div>

          <p className="mt-4 rounded-md bg-[#f4f7f2] px-4 py-3 text-sm font-semibold text-[#5c7a52]">
            Payment includes {formatAudFromCents(gstCents)} GST
          </p>
        </div>

        <footer className="space-y-2 px-8 pb-8 text-xs leading-5 text-[#5c7a52]">
          {footnote ? <p>{footnote}</p> : null}
          <p>
            Sanative · <span className="text-[10px]">{SANATIVE_LEGAL.address}</span>
          </p>
        </footer>
      </article>

      {downloadHref ? (
        <p className="mt-6">
          <a
            href={downloadHref}
            className="inline-block rounded-full bg-[#34412f] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Download PDF
          </a>
        </p>
      ) : null}
    </>
  );
}
