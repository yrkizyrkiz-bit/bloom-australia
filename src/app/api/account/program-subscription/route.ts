import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getBillingSummaryBySlug,
  getMemberBillingOverview,
} from "@/lib/billing/member-billing-summary";
import { resolveProgramSubscriptionGate } from "@/lib/billing/subscription-gate";
import {
  MEMBERSHIP_INCLUDED_SCOPE_SLUGS,
  SANATIVE_MEMBERSHIP_SLUG,
} from "@/lib/billing/program-slugs";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const program = new URL(request.url).searchParams.get("program");
    if (!program) {
      return NextResponse.json({ error: "Missing program slug" }, { status: 400 });
    }

    const overview = await getMemberBillingOverview(session.user.id);
    const summary = getBillingSummaryBySlug(overview, program);
    const membership = getBillingSummaryBySlug(overview, SANATIVE_MEMBERSHIP_SLUG);
    const includedWithMembership = (
      MEMBERSHIP_INCLUDED_SCOPE_SLUGS as readonly string[]
    ).includes(program);

    if (!summary && includedWithMembership && membership?.subscriptionAccess.isActive) {
      const gate = resolveProgramSubscriptionGate({
        found: true,
        subscriptionAccess: membership.subscriptionAccess,
        programLabel: program === "organ_care" ? "Organ Care" : "Biological Clock",
      });

      return NextResponse.json({
        program,
        programLabel: program === "organ_care" ? "Organ Care" : "Biological Clock",
        billingModel: "annual_subscription",
        paidTill: membership.recurring.paidTill,
        recurringStatus: membership.recurring.status,
        found: true,
        billingKnown: gate.billingKnown,
        gateAction: gate.gateAction,
        subscriptionAccess: {
          ...gate.subscriptionAccess,
          message: null,
        },
      });
    }

    if (!summary) {
      const gate = resolveProgramSubscriptionGate({
        found: false,
        programLabel: program,
        reason: "not_found",
      });

      return NextResponse.json({
        program,
        found: false,
        billingKnown: gate.billingKnown,
        gateAction: gate.gateAction,
        subscriptionAccess: gate.subscriptionAccess,
      });
    }

    const gate = resolveProgramSubscriptionGate({
      found: true,
      subscriptionAccess: summary.subscriptionAccess,
      programLabel: summary.programLabel,
    });

    return NextResponse.json({
      program: summary.program,
      programLabel: summary.programLabel,
      billingModel: summary.billingModel,
      paidTill: summary.recurring.paidTill,
      recurringStatus: summary.recurring.status,
      found: true,
      billingKnown: gate.billingKnown,
      gateAction: gate.gateAction,
      subscriptionAccess: gate.subscriptionAccess,
    });
  } catch (error) {
    console.error("[account/program-subscription]", error);

    const gate = resolveProgramSubscriptionGate({
      found: false,
      reason: "load_error",
    });

    return NextResponse.json(
      {
        error: "Failed to load subscription",
        billingKnown: gate.billingKnown,
        gateAction: gate.gateAction,
        subscriptionAccess: gate.subscriptionAccess,
      },
      { status: 500 }
    );
  }
}
