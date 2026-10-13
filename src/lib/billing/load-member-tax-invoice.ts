import { prisma } from "@/lib/prisma";
import {
  paymentRecordToTaxInvoice,
  type TaxInvoiceInput,
} from "@/lib/billing/tax-invoice-pdf";

const INVOICE_STAFF_ROLES = new Set(["ADMIN", "CARE_PARTNER", "DOCTOR"]);

export function isInvoiceStaffRole(role?: string | null): boolean {
  return INVOICE_STAFF_ROLES.has((role || "").toUpperCase());
}

/**
 * Members only receive their own paid invoice.
 * Staff can open any paid invoice, still built from that payment record.
 */
export async function loadTaxInvoiceForViewer(
  viewerUserId: string,
  viewerRole: string | null | undefined,
  invoiceId: string
): Promise<TaxInvoiceInput | null> {
  if (!isInvoiceStaffRole(viewerRole)) {
    return loadMemberTaxInvoice(viewerUserId, invoiceId);
  }

  const owned = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    select: { userId: true },
  });
  if (!owned) return null;
  return loadMemberTaxInvoice(owned.userId, invoiceId);
}

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
