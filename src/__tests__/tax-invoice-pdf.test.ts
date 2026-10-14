import { describe, expect, it } from "vitest";
import { formatAudFromCents, gstIncludedCents } from "@/lib/billing/gst";
import {
  buildSampleMembershipTaxInvoice,
  buildTaxInvoicePdf,
  paymentRecordToTaxInvoice,
  taxInvoiceTotals,
} from "@/lib/billing/tax-invoice-pdf";

describe("tax invoice GST", () => {
  it("takes one-eleventh of a GST-inclusive total", () => {
    expect(gstIncludedCents(36500)).toBe(3318);
    expect(formatAudFromCents(3318)).toBe("$33.18");
    expect(gstIncludedCents(129600)).toBe(11782);
    expect(formatAudFromCents(11782)).toBe("$117.82");
  });

  it("builds a sample membership PDF that names the GST amount", () => {
    const totals = taxInvoiceTotals([
      { description: "Sanative Membership", amountCents: 36500 },
    ]);
    expect(totals.totalCents).toBe(36500);
    expect(totals.gstCents).toBe(3318);

    const pdf = buildSampleMembershipTaxInvoice();
    const text = Buffer.from(pdf).toString("latin1");
    expect(text.startsWith("%PDF")).toBe(true);
    expect(text).toContain("Tax invoice");
    expect(text).toContain("Sanative Membership");
    expect(text).toContain("Payment includes $33.18 GST");
    expect(text).toContain("ABN 30 609 735 533");
  });

  it("builds a member tax invoice from a payment without storing a file", () => {
    const invoice = paymentRecordToTaxInvoice({
      sequence: 7,
      amountAud: 365,
      description: "Sanative Membership: annual auto-renew",
      billToName: "Maria Zekry",
      billToEmail: "maria@example.com",
    });
    expect(invoice.invoiceNumber).toBe("SAN-0007");
    expect(invoice.lines[0]?.amountCents).toBe(36500);
    expect(invoice.sample).toBeUndefined();

    const text = Buffer.from(buildTaxInvoicePdf(invoice)).toString("latin1");
    expect(text).toContain("Tax invoice");
    expect(text).toContain("SAN-0007");
    expect(text).toContain("Sanative Membership: annual auto-renew");
    expect(text).toContain("Maria Zekry");
    expect(text).toContain("Payment includes $33.18 GST");
    expect(text).toContain("ABN 30 609 735 533");
    expect(text).not.toContain("Sample only");
    expect(text).toContain("Sanative");
    expect(text).not.toContain("Sanative Health");
    expect(text).not.toContain("This tax invoice was issued by Sanative");
  });
});
