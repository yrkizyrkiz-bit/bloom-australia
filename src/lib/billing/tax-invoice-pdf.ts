import { jsPDF } from "jspdf";
import { SANATIVE_LEGAL } from "@/lib/legal/constants";
import { formatAudFromCents, gstIncludedCents } from "@/lib/billing/gst";

const GREEN: [number, number, number] = [92, 122, 82];
const INK: [number, number, number] = [52, 65, 47];
const CREAM: [number, number, number] = [253, 251, 247];
const ROW: [number, number, number] = [244, 247, 242];
const LINE: [number, number, number] = [230, 235, 227];
const MUTED: [number, number, number] = [92, 122, 82];

export type TaxInvoiceLine = {
  description: string;
  detail?: string;
  amountCents: number;
};

export type TaxInvoiceInput = {
  invoiceNumber: string;
  billToName: string;
  billToEmail: string;
  lines: TaxInvoiceLine[];
  /** Overrides the registered ABN when a document needs a different number. */
  abn?: string | null;
  sample?: boolean;
};

export function taxInvoiceTotals(lines: TaxInvoiceLine[]) {
  const totalCents = lines.reduce((sum, line) => sum + line.amountCents, 0);
  return {
    totalCents,
    gstCents: gstIncludedCents(totalCents),
  };
}

export function buildTaxInvoicePdf(input: TaxInvoiceInput): Uint8Array {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210;
  const { totalCents, gstCents } = taxInvoiceTotals(input.lines);
  const abn = input.abn?.trim() || SANATIVE_LEGAL.abn;

  doc.setFillColor(...GREEN);
  doc.rect(0, 0, pageW, 38, "F");

  doc.setFont("times", "bold");
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text("Sanative", 16, 18);

  if (input.sample) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Sample only", 16, 27);
  }

  doc.setFont("times", "bold");
  doc.setFontSize(16);
  doc.text("Tax invoice", pageW - 16, 18, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(input.invoiceNumber, pageW - 16, 27, { align: "right" });

  doc.setFillColor(...CREAM);
  doc.rect(0, 38, pageW, 46, "F");

  doc.setTextColor(...INK);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Sanative", 16, 50);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  const seller = [
    SANATIVE_LEGAL.supportEmail,
    SANATIVE_LEGAL.website.replace("https://", ""),
    `ABN ${abn}`,
  ];
  seller.forEach((line, index) => {
    doc.text(line, 16, 57 + index * 5, { maxWidth: 110 });
  });

  doc.setTextColor(...MUTED);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("BILL TO", 16, 98);
  doc.setTextColor(...INK);
  doc.setFontSize(12);
  doc.text(input.billToName, 16, 106);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(input.billToEmail, 16, 112);

  const tableTop = 124;
  doc.setFillColor(...GREEN);
  doc.rect(16, tableTop, 178, 9, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("DESCRIPTION", 20, tableTop + 6);
  doc.text("AMOUNT", 188, tableTop + 6, { align: "right" });

  let y = tableTop + 9;
  input.lines.forEach((line, index) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    const descriptionLines = doc.splitTextToSize(line.description, 120) as string[];
    const detailLines = line.detail
      ? (doc.splitTextToSize(line.detail, 120) as string[])
      : [];
    const rowH = 8 + descriptionLines.length * 5 + (detailLines.length ? detailLines.length * 4 + 1 : 0);
    doc.setFillColor(...(index % 2 === 0 ? [255, 255, 255] : ROW));
    doc.rect(16, y, 178, rowH, "F");
    doc.setTextColor(...INK);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    descriptionLines.forEach((text, lineIndex) => {
      doc.text(text, 20, y + 7 + lineIndex * 5);
    });
    doc.text(formatAudFromCents(line.amountCents), 188, y + 7, { align: "right" });
    if (detailLines.length) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);
      detailLines.forEach((text, lineIndex) => {
        doc.text(text, 20, y + 7 + descriptionLines.length * 5 + lineIndex * 4);
      });
    }
    y += rowH;
  });

  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(16, y, 194, y);

  y += 12;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...INK);
  doc.text("Total paid", 120, y);
  doc.text(`${formatAudFromCents(totalCents)} AUD`, 188, y, { align: "right" });

  y += 10;
  doc.setFillColor(...ROW);
  doc.roundedRect(16, y, 178, 14, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...GREEN);
  doc.text(`Payment includes ${formatAudFromCents(gstCents)} GST`, 20, y + 9);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  if (input.sample) {
    doc.text(
      "Sample only. This is not a record of a real payment. The price is GST-inclusive.",
      16,
      270,
      { maxWidth: 178 }
    );
  }
  const footerPrefix = "Sanative · ";
  const prefixWidth = doc.getTextWidth(footerPrefix);
  doc.text(footerPrefix, 16, 282);
  doc.setFontSize(6.5);
  doc.text(SANATIVE_LEGAL.address, 16 + prefixWidth, 282);

  return new Uint8Array(doc.output("arraybuffer"));
}

/** Preview of a paid annual membership, using the live $365 price. */
export const SAMPLE_MEMBERSHIP_INVOICE: TaxInvoiceInput = {
  sample: true,
  invoiceNumber: "SAN-SAMPLE-0001",
  billToName: "Alex Morgan",
  billToEmail: "alex.morgan@example.com",
  lines: [
    {
      description: "Sanative Membership",
      detail:
        "Annual membership. Includes Essential biomarker insights, Biological Clock and Organ Care.",
      amountCents: 36500,
    },
  ],
};

export function buildSampleMembershipTaxInvoice(): Uint8Array {
  return buildTaxInvoicePdf(SAMPLE_MEMBERSHIP_INVOICE);
}

export function audToCents(amountAud: number): number {
  if (!Number.isFinite(amountAud)) return 0;
  return Math.round(amountAud * 100);
}

/** Short invoice number from the payment's place in issue order. Nothing extra is stored. */
export function taxInvoiceNumber(sequence: number): string {
  const safe = Number.isFinite(sequence) ? Math.max(1, Math.trunc(sequence)) : 1;
  return `SAN-${String(safe).padStart(4, "0")}`;
}

export function paymentRecordToTaxInvoice(payment: {
  sequence: number;
  amountAud: number;
  description?: string | null;
  billToName: string;
  billToEmail: string;
}): TaxInvoiceInput {
  const name = payment.billToName.trim();
  return {
    invoiceNumber: taxInvoiceNumber(payment.sequence),
    billToName: name || payment.billToEmail,
    billToEmail: payment.billToEmail,
    lines: [
      {
        description: payment.description?.trim() || "Payment",
        amountCents: audToCents(payment.amountAud),
      },
    ],
  };
}
