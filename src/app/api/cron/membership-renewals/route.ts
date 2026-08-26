import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assertCronAuthorized } from "@/lib/security/cron-auth";
import { syncEntitlementsFromSignals } from "@/lib/membership/entitlement-service";
import {
  getSanativeMembershipPricing,
  SANATIVE_MEMBERSHIP_PRODUCT_SLUG,
} from "@/lib/portal/sanative-membership";
import {
  sendMembershipRenewalReminderEmail,
  sendMembershipExpiredEmail,
} from "@/lib/email";

// GET /api/cron/membership-renewals
// Protected by: Authorization: Bearer {CRON_SECRET}
// Schedule: daily.
//
// New Sanative Memberships are Stripe Subscriptions with card-on-file
// auto-renewal, Stripe charges them and invoice.paid / invoice.payment_failed
// webhooks keep access in sync.
//
// This cron only covers legacy one-off memberships (no stripeSubscriptionId):
// remind 14 days out, then expire after a 3-day grace.
const REMINDER_DAYS = 14;
const GRACE_DAYS = 3;

const REMINDER_CHANGE_TYPE = "RENEWAL_REMINDER_SENT";
const EXPIRED_CHANGE_TYPE = "MEMBERSHIP_EXPIRED";

export async function GET(request: NextRequest) {
  try {
    const cronAuth = assertCronAuthorized(request);
    if (cronAuth) return cronAuth;

    const now = new Date();
    const reminderCutoff = new Date(now.getTime() + REMINDER_DAYS * 24 * 60 * 60 * 1000);
    const expiryCutoff = new Date(now.getTime() - GRACE_DAYS * 24 * 60 * 60 * 1000);
    const pricing = await getSanativeMembershipPricing();

    const summary = { remindersSent: 0, expired: 0, skippedAutoRenew: 0, errors: 0 };

    // ── 1) Renewal reminders (legacy one-off only) ──────────────────────────
    const dueForReminder = await prisma.memberSubscription.findMany({
      where: {
        status: "ACTIVE",
        stripeSubscriptionId: null,
        product: { slug: SANATIVE_MEMBERSHIP_PRODUCT_SLUG },
        currentPeriodEnd: { gte: now, lte: reminderCutoff },
      },
      include: {
        user: { select: { email: true, firstName: true } },
        history: {
          where: { changeType: REMINDER_CHANGE_TYPE },
          orderBy: { effectiveAt: "desc" },
          take: 1,
        },
      },
    });

    for (const sub of dueForReminder) {
      if (!sub.currentPeriodEnd || !sub.user.email) continue;
      const periodKey = sub.currentPeriodEnd.toISOString();
      const alreadySent = sub.history.some((h) => h.notes === periodKey);
      if (alreadySent) continue;

      try {
        await sendMembershipRenewalReminderEmail({
          to: sub.user.email,
          firstName: sub.user.firstName || "",
          renewalDate: sub.currentPeriodEnd,
          priceLabel: pricing.priceLabel,
        });
        await prisma.memberSubscriptionHistory.create({
          data: {
            memberSubscriptionId: sub.id,
            changeType: REMINDER_CHANGE_TYPE,
            changedBy: "cron:membership-renewals",
            notes: periodKey,
          },
        });
        summary.remindersSent += 1;
      } catch (err) {
        summary.errors += 1;
        console.error("[cron/membership-renewals] reminder failed:", sub.id, err);
      }
    }

    // Count auto-renew memberships that are near end-of-period (informational).
    summary.skippedAutoRenew = await prisma.memberSubscription.count({
      where: {
        status: "ACTIVE",
        stripeSubscriptionId: { not: null },
        product: { slug: SANATIVE_MEMBERSHIP_PRODUCT_SLUG },
        currentPeriodEnd: { gte: now, lte: reminderCutoff },
      },
    });

    // ── 2) Expire lapsed legacy memberships ─────────────────────────────────
    const lapsed = await prisma.memberSubscription.findMany({
      where: {
        status: "ACTIVE",
        stripeSubscriptionId: null,
        product: { slug: SANATIVE_MEMBERSHIP_PRODUCT_SLUG },
        currentPeriodEnd: { lt: expiryCutoff },
      },
      include: { user: { select: { id: true, email: true, firstName: true } } },
    });

    for (const sub of lapsed) {
      try {
        await prisma.memberSubscription.update({
          where: { id: sub.id },
          data: { status: "EXPIRED" },
        });
        await prisma.membershipSubscription
          .updateMany({
            where: { userId: sub.userId, status: "ACTIVE" },
            data: { status: "EXPIRED" },
          })
          .catch(() => undefined);
        await prisma.memberSubscriptionHistory.create({
          data: {
            memberSubscriptionId: sub.id,
            changeType: EXPIRED_CHANGE_TYPE,
            changedBy: "cron:membership-renewals",
            notes: sub.currentPeriodEnd?.toISOString() ?? "",
          },
        });
        await syncEntitlementsFromSignals(sub.userId);
        if (sub.user.email) {
          await sendMembershipExpiredEmail({
            to: sub.user.email,
            firstName: sub.user.firstName || "",
          }).catch((err) =>
            console.error("[cron/membership-renewals] expiry email failed:", err)
          );
        }
        summary.expired += 1;
      } catch (err) {
        summary.errors += 1;
        console.error("[cron/membership-renewals] expiry failed:", sub.id, err);
      }
    }

    return NextResponse.json({ ok: true, ...summary });
  } catch (error) {
    console.error("[cron/membership-renewals]", error);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
