import { prisma } from "@/lib/prisma";
import {
  paymentRecordToTaxInvoice,
  type TaxInvoiceInput,
} from "@/lib/billing/tax-invoice-pdf";

/** Builds a tax invoice from a paid payment. Returns null when it is not this member's paid record. */
export async function loadMemberTaxInvoice(
  userId: string,
  invoiceId: string
): Promise<TaxInvoiceInput | null> {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
    select: {
      id: true,
      amount: true,
      status: true,
      description: true,
      issuedAt: true,
      user: {
        select: { firstName: true, lastName: true, email: true },
      },
    },
  });

  if (!invoice || invoice.status.toUpperCase() !== "PAID") return null;

  const sequence = await prisma.invoice.count({
    where: {
      OR: [
        { issuedAt: { lt: invoice.issuedAt } },
        { issuedAt: invoice.issuedAt, id: { lte: invoice.id } },
      ],
    },
  });

  const billToName = [invoice.user.firstName, invoice.user.lastName]
    .filter(Boolean)
    .join(" ");

  return paymentRecordToTaxInvoice({
    sequence,
    amountAud: invoice.amount,
    description: invoice.description,
    billToName,
    billToEmail: invoice.user.email,
  });
}
