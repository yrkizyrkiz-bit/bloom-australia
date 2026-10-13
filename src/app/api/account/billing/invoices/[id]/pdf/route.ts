import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { loadTaxInvoiceForViewer } from "@/lib/billing/load-member-tax-invoice";
import { buildTaxInvoicePdf } from "@/lib/billing/tax-invoice-pdf";

/** Builds the tax invoice when the member opens it. The PDF is not stored. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const invoice = await loadTaxInvoiceForViewer(session.user.id, session.user.role, id);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const pdf = buildTaxInvoicePdf(invoice);
  const download = request.nextUrl.searchParams.get("download") === "1";
  const filename = `sanative-tax-invoice-${id}.pdf`;

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
