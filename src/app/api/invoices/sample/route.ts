import { NextRequest, NextResponse } from "next/server";
import { buildSampleMembershipTaxInvoice } from "@/lib/billing/tax-invoice-pdf";

/** Sample tax invoice PDF for review. Not a record of a real payment. */
export async function GET(request: NextRequest) {
  const pdf = buildSampleMembershipTaxInvoice();
  const download = request.nextUrl.searchParams.get("download") === "1";

  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="sanative-tax-invoice-sample.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
