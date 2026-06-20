import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createPortalProgramPaymentIntent } from "@/lib/portal/program-purchase";
import { isProgramBillingTerm } from "@/lib/programs/offers";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const billingTerm = body?.billingTerm ?? "1m";
    if (!isProgramBillingTerm(billingTerm)) {
      return NextResponse.json({ error: "Invalid billing term" }, { status: 400 });
    }

    const result = await createPortalProgramPaymentIntent({
      userId: session.user.id,
      programKey: body?.programKey,
      billingTerm,
      answers: body?.answers,
      intent: body?.intent ?? "program_subscription",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[portal/checkout/intent]", error);
    const message = error instanceof Error ? error.message : "Failed to create payment";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
