import { NextResponse } from "next/server";
import { activatePublicBiomarkersAfterPayment } from "@/lib/portal/public-biomarkers-purchase";
import { requirePrePaymentConsent } from "@/lib/legal/require-pre-payment-consent";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const paymentIntentId = body?.paymentIntentId as string | undefined;
    const consentRecordId = body?.consentRecordId as string | undefined;

    if (!paymentIntentId) {
      return NextResponse.json({ error: "Missing paymentIntentId" }, { status: 400 });
    }

    const { firstName, lastName, email, phone, postcode, dateOfBirth } = body ?? {};
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !phone?.trim()) {
      return NextResponse.json({ error: "Missing required contact details" }, { status: 400 });
    }

    const consentVerification = await requirePrePaymentConsent({
      consentRecordId,
      email: String(email).trim(),
    });

    if (!consentVerification.ok) {
      return NextResponse.json(
        { error: consentVerification.error },
        { status: consentVerification.status }
      );
    }

    const activation = await activatePublicBiomarkersAfterPayment({
      paymentIntentId,
      consentRecordId,
      dateOfBirth: dateOfBirth ? String(dateOfBirth) : undefined,
      details: {
        firstName: String(firstName).trim(),
        lastName: String(lastName).trim(),
        email: String(email).trim(),
        phone: String(phone).trim(),
        postcode: postcode ? String(postcode).trim() : undefined,
      },
    });

    return NextResponse.json({
      success: true,
      userId: activation.userId,
      email: activation.email,
      publicPanelTier: activation.publicPanelTier,
    });
  } catch (error) {
    console.error("[public/biomarkers-checkout/activate]", error);
    const message = error instanceof Error ? error.message : "Failed to activate account";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
