import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { sendOrderConfirmationEmail, sendEmail, sendWeightManagementConfirmationEmail } from "@/lib/email";
import { sign } from "jsonwebtoken";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2026-04-22.dahlia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case "customer.subscription.paused":
        await handleSubscriptionPaused(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log("Payment succeeded:", paymentIntent.id);

  const {
    type, discount, discountType, program, userId, customerEmail, consultationType,
    selectedPlan, firstMonthAmount, ongoingAmount, discountAmount: metaDiscountAmount,
    planName, consultationDate, consultationTime,
  } = paymentIntent.metadata;
  const amountReceived = paymentIntent.amount_received / 100; // Convert from cents
  const discountAmount = discount ? parseFloat(discount) : 0;
  const originalAmount = amountReceived + discountAmount;
  const customerId = paymentIntent.customer as string;

  // First, create/update invoice record for the User (for admin visibility)
  if (userId || customerId || customerEmail) {
    try {
      let userEmail: string | undefined;
      let userForInvoice: { id: string; firstName: string; lastName: string; email: string } | null = null;

      // Get user by userId from metadata or by customer email
      if (userId) {
        userForInvoice = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, firstName: true, lastName: true, email: true },
        });
      }

      // Try by customerEmail in metadata
      if (!userForInvoice && customerEmail) {
        userForInvoice = await prisma.user.findUnique({
          where: { email: customerEmail.toLowerCase() },
          select: { id: true, firstName: true, lastName: true, email: true },
        });
      }

      if (!userForInvoice && customerId) {
        const stripeCustomer = await stripe.customers.retrieve(customerId);
        if (stripeCustomer && !stripeCustomer.deleted && stripeCustomer.email) {
          userEmail = stripeCustomer.email;
          userForInvoice = await prisma.user.findUnique({
            where: { email: stripeCustomer.email },
            select: { id: true, firstName: true, lastName: true, email: true },
          });
        }
      }

      if (userForInvoice) {
        // Create invoice record
        await prisma.invoice.create({
          data: {
            userId: userForInvoice.id,
            stripeId: paymentIntent.id,
            amount: amountReceived,
            currency: "AUD",
            status: "PAID",
            paidAt: new Date(),
            description: program || consultationType || "Weight Management Program",
          },
        });

        // Auto-assign care partner for weight management patients
        let assignedCarePartnerId: string | null = null;
        const isWeightManagement = program === "weight_management" || consultationType === "weight_management";

        if (isWeightManagement) {
          // Find available care partner with fewest assigned patients
          const carePartners = await prisma.user.findMany({
            where: { role: "CARE_PARTNER" },
            select: {
              id: true,
              _count: {
                select: {
                  // This would need a proper relation, for now use a simple round-robin
                },
              },
            },
          });

          if (carePartners.length > 0) {
            // Simple assignment - pick first available
            assignedCarePartnerId = carePartners[0].id;
          }
        }

        // GAP-018: Separate payment status from program status
        // After first-month payment succeeds:
        // - Set payment status: PAID (via paymentStatus field or subscriptionStatus)
        // - Set journey status: CONSULTATION_PAID (not ACTIVE)
        // - Program status remains pending until doctor approval
        // Payment success does NOT imply clinical approval or activate program dashboard

        // Determine plan details from metadata
        const planNameFromMeta = selectedPlan === 'precision' ? 'Weight Management - Precision' :
                                 selectedPlan === 'core' ? 'Weight Management - Core' :
                                 planName || program || 'Weight Management';
        const planAmount = selectedPlan === 'precision' ? 499 :
                          selectedPlan === 'core' ? 349 :
                          ongoingAmount ? parseFloat(ongoingAmount) / 100 : 199;

        await prisma.user.update({
          where: { id: userForInvoice.id },
          data: {
            subscriptionStatus: "INACTIVE", // GAP-018: Not ACTIVE until doctor approved - payment status tracked by journeyStatus
            subscriptionTier: program || (isWeightManagement ? "weight_management" : undefined),
            journeyStatus: isWeightManagement ? "CONSULTATION_PAID" : "CONSULTATION_PAID",
            assignedCarePartnerId: assignedCarePartnerId || undefined,
          },
        });

        // UAT8-GAP-004: Do NOT create MembershipSubscription here
        // The recurring subscription should only be created AFTER doctor approval
        // The Invoice record above tracks the first-month payment
        // Subscription creation happens in /api/admin/doctor/decision after APPROVED
        // This prevents "ACTIVE" subscription status before clinical approval
        console.log(`[Stripe Webhook] First-month payment recorded for ${userForInvoice.id}. Subscription pending doctor approval.`);

        // Store the selected plan info on the user for later subscription creation
        await prisma.user.update({
          where: { id: userForInvoice.id },
          data: {
            // Store plan selection for use when subscription is created after approval
            subscriptionTier: selectedPlan === 'precision' ? 'weight_management_precision' : 'weight_management_core',
          },
        }).catch(console.error);

        // Log care partner assignment if applicable
        if (assignedCarePartnerId) {
          const carePartner = await prisma.user.findUnique({
            where: { id: assignedCarePartnerId },
            select: { firstName: true, lastName: true },
          });

          await prisma.internalNote.create({
            data: {
              userId: userForInvoice.id,
              memberId: userForInvoice.id,
              authorId: "system",
              authorName: "System",
              createdBy: "system",
              category: "GENERAL",
              title: "Care Partner Auto-Assigned",
              content: `Patient automatically assigned to care partner: ${carePartner?.firstName} ${carePartner?.lastName} after consultation payment.`,
              isPinned: false,
            },
          }).catch(console.error);
        }

        // Log automation
        await prisma.automationLog.create({
          data: {
            userId: userForInvoice.id,
            automationType: "consultation_paid",
            triggerEvent: "payment_intent.succeeded",
            channel: "stripe_webhook",
            status: "completed",
            metadata: {
              stripePaymentIntentId: paymentIntent.id,
              assignedCarePartnerId,
              autoTriageStarted: isWeightManagement,
            },
          }
        }).catch(console.error);

        // Send order confirmation email
        const programName = program || consultationType || "Weight Management";

        // Check if this is a Weight Management plan with new pricing structure
        const isNewWMPlan = selectedPlan && (selectedPlan === 'core' || selectedPlan === 'precision');

        if (isNewWMPlan) {
          // Send WM-specific confirmation email with plan details
          const wmPlanName = selectedPlan === 'precision' ? 'Sanative Precision' : 'Sanative Core';
          await sendWeightManagementConfirmationEmail(userForInvoice.email, {
            firstName: userForInvoice.firstName,
            lastName: userForInvoice.lastName,
            planName: wmPlanName as 'Sanative Core' | 'Sanative Precision',
            consultationDate: consultationDate || 'TBA',
            consultationTime: consultationTime || 'TBA',
            firstMonthPrice: firstMonthAmount ? parseFloat(firstMonthAmount) / 100 : (selectedPlan === 'precision' ? 499 : 349),
            discount: metaDiscountAmount ? parseFloat(metaDiscountAmount) / 100 : 100,
            dueToday: amountReceived,
            ongoingPrice: ongoingAmount ? parseFloat(ongoingAmount) / 100 : (selectedPlan === 'precision' ? 499 : 349),
          });
        } else {
          // Send generic order confirmation
          await sendOrderConfirmationEmail(userForInvoice.email, {
            firstName: userForInvoice.firstName,
            program: programName,
            originalAmount,
            discountAmount,
            discountType: discountType || undefined,
            finalAmount: amountReceived,
          });
        }

        // Send magic link email for portal access
        await sendMagicLinkEmail(userForInvoice);

        // Send SMS confirmation
        await sendPaymentConfirmationSMS(userForInvoice.id);

        console.log(`User ${userForInvoice.id} invoice created, confirmation email sent, magic link sent`);
      }
    } catch (invoiceError) {
      console.error("Error creating user invoice:", invoiceError);
    }
  }

  // Also handle ProgramMember if exists
  if (type === "membership" && customerId) {
    const customer = await stripe.customers.retrieve(customerId);

    if (customer && !customer.deleted && customer.email) {
      const member = await prisma.programMember.findUnique({
        where: { email: customer.email },
      });

      if (member) {
        // Update membership status
        await prisma.programMember.update({
          where: { id: member.id },
          data: {
            stripeCustomerId: customerId,
            membershipStatus: "ACTIVE",
          },
        });

        // Create notification for member
        await prisma.memberNotification.create({
          data: {
            memberId: member.id,
            type: "GENERAL",
            message: "Your payment was successful! Welcome to Sanative Health.",
          },
        });

        // If member has a clinic, notify the GP
        if (member.clinicId) {
          await prisma.gpNotification.create({
            data: {
              clinicId: member.clinicId,
              type: "ENROLMENT",
              message: `${member.firstName} ${member.lastName} has completed payment and enrolled in the ${member.program} program`,
              patientName: `${member.firstName} ${member.lastName}`,
              patientId: member.id,
            },
          });
        }

        console.log(`Member ${member.id} payment confirmed`);
      }
    }
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log("Payment failed:", paymentIntent.id);

  const customerId = paymentIntent.customer as string;

  if (customerId) {
    const customer = await stripe.customers.retrieve(customerId);

    if (customer && !customer.deleted && customer.email) {
      const member = await prisma.programMember.findUnique({
        where: { email: customer.email },
      });

      if (member) {
        // Create notification for failed payment
        await prisma.memberNotification.create({
          data: {
            memberId: member.id,
            type: "GENERAL",
            message: "Your payment could not be processed. Please try again or contact support.",
          },
        });
      }
    }
  }
}

// Helper to safely get subscription period dates
function getSubscriptionPeriod(subscription: Stripe.Subscription): { start: Date; end: Date } {
  // Access properties that may vary by API version
  const subData = subscription as unknown as Record<string, unknown>;
  const now = new Date();

  let start = now;
  let end = new Date();
  end.setFullYear(end.getFullYear() + 1);

  // Try to get actual period dates if available
  if (typeof subData.current_period_start === 'number') {
    start = new Date(subData.current_period_start * 1000);
  }
  if (typeof subData.current_period_end === 'number') {
    end = new Date(subData.current_period_end * 1000);
  }

  return { start, end };
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log("Subscription created:", subscription.id);

  const customerId = subscription.customer as string;
  const customer = await stripe.customers.retrieve(customerId);

  if (customer && !customer.deleted && customer.email) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: customer.email },
    });

    if (user) {
      const period = getSubscriptionPeriod(subscription);

      // Create or update membership subscription
      await prisma.membershipSubscription.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0]?.price.id,
          status: "ACTIVE",
          startDate: period.start,
          currentPeriodEnd: period.end,
        },
        update: {
          stripeSubscriptionId: subscription.id,
          stripePriceId: subscription.items.data[0]?.price.id,
          status: "ACTIVE",
          currentPeriodEnd: period.end,
        },
      });
    }
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log("Subscription updated:", subscription.id);

  const membershipSubscription = await prisma.membershipSubscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (membershipSubscription) {
    let status: "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED" = "ACTIVE";

    switch (subscription.status) {
      case "active":
        status = "ACTIVE";
        break;
      case "past_due":
        status = "PAST_DUE";
        break;
      case "canceled":
      case "unpaid":
        status = "CANCELLED";
        break;
      default:
        status = "ACTIVE";
    }

    const period = getSubscriptionPeriod(subscription);
    const subData = subscription as unknown as Record<string, unknown>;
    const canceledAt = typeof subData.canceled_at === 'number'
      ? new Date(subData.canceled_at * 1000)
      : null;

    await prisma.membershipSubscription.update({
      where: { id: membershipSubscription.id },
      data: {
        status,
        currentPeriodEnd: period.end,
        cancelledAt: canceledAt,
      },
    });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("Subscription deleted:", subscription.id);

  const membershipSubscription = await prisma.membershipSubscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (membershipSubscription) {
    await prisma.membershipSubscription.update({
      where: { id: membershipSubscription.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    // Also update program member if applicable
    const user = await prisma.user.findUnique({
      where: { id: membershipSubscription.userId },
    });

    if (user) {
      const programMember = await prisma.programMember.findUnique({
        where: { email: user.email },
      });

      if (programMember) {
        await prisma.programMember.update({
          where: { id: programMember.id },
          data: {
            membershipStatus: "CANCELLED",
          },
        });
      }
    }
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log("Invoice paid:", invoice.id);

  const customerId = invoice.customer as string;
  const customer = await stripe.customers.retrieve(customerId);

  if (customer && !customer.deleted && customer.email) {
    const user = await prisma.user.findUnique({
      where: { email: customer.email },
    });

    if (user) {
      // Create invoice record
      await prisma.invoice.create({
        data: {
          userId: user.id,
          stripeId: invoice.id,
          amount: (invoice.amount_paid || 0) / 100, // Convert from cents
          currency: invoice.currency?.toUpperCase() || "AUD",
          status: "PAID",
          paidAt: new Date(),
          description: invoice.description || "Sanative Health Membership",
        },
      });
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log("Invoice payment failed:", invoice.id);

  const customerId = invoice.customer as string;
  // Access subscription from invoice data safely (may vary by API version)
  const invoiceData = invoice as unknown as Record<string, unknown>;
  const subscriptionId = (invoiceData.subscription as string | null) || null;
  const customer = await stripe.customers.retrieve(customerId);

  if (!customer || customer.deleted || !customer.email) {
    console.log("No valid customer found for failed invoice:", invoice.id);
    return;
  }

  const userEmail = customer.email;

  // ─── Update User record ─────────────────────────────────────────────────────
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      assignedCarePartnerId: true,
      subscriptionStatus: true,
      journeyStatus: true,
    },
  });

  if (user) {
    // Update user subscription status to indicate payment issue
    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: "INACTIVE", // Mark as inactive due to payment failure
      },
    });

    // ─── Update MembershipSubscription ─────────────────────────────────────────
    if (subscriptionId) {
      await prisma.membershipSubscription.updateMany({
        where: { stripeSubscriptionId: subscriptionId },
        data: {
          status: "PAST_DUE",
        },
      });
    }

    // ─── Create Invoice record for failed payment ─────────────────────────────
    try {
      await prisma.invoice.create({
        data: {
          userId: user.id,
          stripeId: invoice.id,
          amount: (invoice.amount_due || 0) / 100,
          currency: invoice.currency?.toUpperCase() || "AUD",
          status: "FAILED",
          description: `Payment failed: ${invoice.description || "Monthly subscription"}`,
        },
      });
    } catch (invoiceError) {
      console.error("Error creating failed invoice record:", invoiceError);
    }

    // ─── Create care communication task for follow-up ─────────────────────────
    const attemptNumber = invoice.attempt_count || 1;
    const nextAttempt = invoice.next_payment_attempt
      ? new Date(invoice.next_payment_attempt * 1000)
      : null;

    await prisma.careCommunication.create({
      data: {
        userId: user.id,
        type: "BILLING",
        priority: attemptNumber >= 3 ? "HIGH" : "NORMAL",
        subject: `Payment Failed (Attempt ${attemptNumber}): ${user.firstName} ${user.lastName}`,
        notes: `Monthly subscription payment failed.

**Invoice ID:** ${invoice.id}
**Amount:** ${((invoice.amount_due || 0) / 100).toFixed(2)} AUD
**Attempt:** ${attemptNumber}
${nextAttempt ? `**Next Retry:** ${nextAttempt.toLocaleDateString("en-AU")}` : "**No automatic retry scheduled**"}

**Actions Required:**
1. Contact patient to update payment method
2. If no response after 3 days, send reminder SMS
3. After 7 days, consider pausing program access
4. Document all contact attempts

**Customer Portal:** Patient can update payment at ${process.env.NEXTAUTH_URL || "https://sanative.com.au"}/dashboard/billing`,
        status: "PENDING",
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        assignedTo: user.assignedCarePartnerId || undefined,
      },
    });

    // ─── Create internal note ─────────────────────────────────────────────────
    await prisma.internalNote.create({
      data: {
        userId: user.id,
        category: "BILLING",
        title: `Subscription Payment Failed (Attempt ${attemptNumber})`,
        content: `Payment of ${((invoice.amount_due || 0) / 100).toFixed(2)} failed.

Invoice: ${invoice.id}
Subscription: ${subscriptionId || "N/A"}
Attempt: ${attemptNumber}
${nextAttempt ? `Next retry: ${nextAttempt.toLocaleDateString("en-AU")}` : "No automatic retry"}

Patient has been notified via email.`,
        createdBy: "system",
      },
    }).catch(console.error);

    // ─── Log automation event ─────────────────────────────────────────────────
    await prisma.automationLog.create({
      data: {
        userId: user.id,
        automationType: "subscription_payment_failed",
        triggerEvent: "invoice.payment_failed",
        channel: "stripe_webhook",
        status: "completed",
        metadata: {
          invoiceId: invoice.id,
          subscriptionId,
          amountDue: invoice.amount_due,
          attemptCount: attemptNumber,
          nextRetry: nextAttempt?.toISOString() || null,
        },
      },
    }).catch(console.error);

    // ─── Send payment failure email to patient ────────────────────────────────
    const updatePaymentUrl = `${process.env.NEXTAUTH_URL || "https://sanative.com.au"}/dashboard/billing`;

    await sendEmail({
      to: user.email,
      subject: "Action required: Update your payment method",
      body: `
        <h2>Hi ${user.firstName},</h2>
        <p>We were unable to process your monthly payment of <strong>${((invoice.amount_due || 0) / 100).toFixed(2)}</strong>.</p>

        <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin:16px 0;">
          <p style="margin:0;color:#92400e;">
            <strong>Please update your payment method to continue your program without interruption.</strong>
          </p>
        </div>

        <div style="margin: 24px 0;">
          <a href="${updatePaymentUrl}" style="display:inline-block;background:#059669;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
            Update Payment Method
          </a>
        </div>

        ${nextAttempt ? `
        <p style="color:#666;">We'll automatically retry your payment on ${nextAttempt.toLocaleDateString("en-AU")}.</p>
        ` : ""}

        <p>If you have any questions or need assistance, please contact our care team.</p>

        <p style="color:#666;margin-top:24px;">The Sanative Health Team</p>
      `,
    }).catch((emailError) => {
      console.error("Failed to send payment failure email:", emailError);
    });

    // ─── Send SMS reminder for high-priority failures ─────────────────────────
    if (attemptNumber >= 2 && user.phone) {
      await prisma.sMSNotification.create({
        data: {
          recipientId: user.id,
          recipientPhone: user.phone,
          message: `Hi ${user.firstName}, your Sanative payment couldn't be processed. Please update your payment method at sanative.com.au to avoid service interruption. Reply STOP to opt out.`,
          status: "PENDING",
          provider: process.env.SMS_PROVIDER || "mock",
        },
      }).catch(console.error);
    }

    console.log(`Payment failure handled for user ${user.id}, attempt ${attemptNumber}`);
  }

  // ─── Also update ProgramMember if exists ────────────────────────────────────
  const programMember = await prisma.programMember.findUnique({
    where: { email: userEmail },
  });

  if (programMember) {
    await prisma.programMember.update({
      where: { id: programMember.id },
      data: {
        membershipStatus: "PAST_DUE",
      },
    });

    await prisma.memberNotification.create({
      data: {
        memberId: programMember.id,
        type: "GENERAL",
        message: "Your payment could not be processed. Please update your payment method to continue your membership.",
      },
    });
  }
}

/**
 * Send magic link email for portal access
 */
async function sendMagicLinkEmail(user: { id: string; email: string; firstName: string }) {
  try {
    // Generate a signed JWT token valid for 7 days
    const token = sign(
      { userId: user.id, email: user.email, purpose: "magic_login" },
      process.env.MAGIC_LINK_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret-change-me",
      { expiresIn: "7d" }
    );

    const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const magicLink = `${portalUrl}/auth/magic?token=${token}`;

    // UAT8-GAP-013: Updated wording - removed "consultation fee" language
    await sendEmail({
      to: user.email,
      subject: "Your Sanative account is ready — click to get started",
      body: `
        <h2>Welcome to Sanative Health, ${user.firstName}!</h2>
        <p>Your payment has been received and your account is ready.</p>
        <p>Click the button below to set your password and access your health portal:</p>
        <a href="${magicLink}" style="display:inline-block;background:#059669;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">
          Access My Portal
        </a>
        <p style="color:#666;font-size:13px;">This link expires in 7 days. If you didn't create this account, please ignore this email.</p>
        <p style="color:#666;font-size:13px;">Your next step: check your inbox for consultation confirmation details, or view your dashboard for appointment info.</p>
      `,
    });

    console.log(`Magic link email sent to ${user.email}`);
  } catch (error) {
    console.error("Failed to send magic link email:", error);
  }
}

/**
 * Send SMS confirmation for payment
 */
async function sendPaymentConfirmationSMS(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, phone: true },
    });

    if (!user?.phone) {
      console.log("No phone number for SMS confirmation");
      return;
    }

    // Create SMS notification record
    await prisma.sMSNotification.create({
      data: {
        recipientId: userId,
        recipientPhone: user.phone,
        message: `Hi ${user.firstName}, your Sanative payment is confirmed! Check your email for portal access. Reply STOP to opt out.`,
        status: "PENDING",
        provider: process.env.SMS_PROVIDER || "mock",
      },
    });

    // Note: Actual SMS sending happens via the SMS API based on provider config
    console.log(`SMS confirmation queued for ${user.phone}`);
  } catch (error) {
    console.error("Failed to queue SMS confirmation:", error);
  }
}

/**
 * Handle charge.refunded event - track refunds in our system
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log("Charge refunded:", charge.id);

  const customerId = charge.customer as string | null;
  if (!customerId) return;

  const customer = await stripe.customers.retrieve(customerId);
  if (!customer || customer.deleted || !customer.email) return;

  const user = await prisma.user.findUnique({
    where: { email: customer.email },
    select: { id: true, firstName: true, lastName: true, journeyStatus: true },
  });

  if (user) {
    // Get refund details from the charge
    const chargeData = charge as unknown as Record<string, unknown>;
    const amountRefunded = typeof chargeData.amount_refunded === "number"
      ? chargeData.amount_refunded / 100
      : (charge.amount || 0) / 100;
    const refundReason = typeof chargeData.refund_reason === "string"
      ? chargeData.refund_reason
      : "requested_by_customer";

    // Update user journey status if it was a full refund (declined patient)
    if (user.journeyStatus === "REFUND_PENDING") {
      await prisma.user.update({
        where: { id: user.id },
        data: { journeyStatus: "REFUNDED" },
      });
    }

    // Create invoice record for the refund
    await prisma.invoice.create({
      data: {
        userId: user.id,
        stripeId: charge.id,
        amount: -amountRefunded, // Negative amount for refund
        currency: "AUD",
        status: "REFUNDED",
        paidAt: new Date(),
        description: `Refund: ${refundReason}`,
      },
    }).catch(console.error);

    // Create internal note
    await prisma.internalNote.create({
      data: {
        userId: user.id,
        category: "BILLING",
        title: "Payment Refunded",
        content: `Refund of ${amountRefunded.toFixed(2)} AUD processed.

Charge ID: ${charge.id}
Reason: ${refundReason}`,
        createdBy: "system",
      },
    }).catch(console.error);

    // Log automation
    await prisma.automationLog.create({
      data: {
        userId: user.id,
        automationType: "payment_refunded",
        triggerEvent: "charge.refunded",
        channel: "stripe_webhook",
        status: "completed",
        metadata: {
          chargeId: charge.id,
          amountRefunded,
          refundReason,
        },
      },
    }).catch(console.error);

    // Send confirmation email
    await sendEmail({
      to: customer.email,
      subject: "Your Sanative refund has been processed",
      body: `
        <h2>Hi ${user.firstName},</h2>
        <p>Your refund of <strong>${amountRefunded.toFixed(2)} AUD</strong> has been processed.</p>
        <p>Please allow 5-10 business days for the refund to appear in your account, depending on your bank.</p>
        <p>If you have any questions, please don't hesitate to contact our support team.</p>
        <p style="color:#666;margin-top:24px;">The Sanative Health Team</p>
      `,
    }).catch(console.error);

    console.log(`Refund handled for user ${user.id}: ${amountRefunded.toFixed(2)}`);
  }
}

/**
 * Handle customer.subscription.paused event
 */
async function handleSubscriptionPaused(subscription: Stripe.Subscription) {
  console.log("Subscription paused:", subscription.id);

  const membershipSubscription = await prisma.membershipSubscription.findFirst({
    where: { stripeSubscriptionId: subscription.id },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          assignedCarePartnerId: true,
        },
      },
    },
  });

  if (!membershipSubscription) return;

  const user = membershipSubscription.user;

  // Update membership status
  await prisma.membershipSubscription.update({
    where: { id: membershipSubscription.id },
    data: {
      status: "CANCELLED", // Using CANCELLED as proxy for PAUSED (no PAUSED enum)
    },
  });

  // Update user
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: "INACTIVE",
      journeyStatus: "PAUSED",
    },
  });

  // Create care task
  await prisma.careCommunication.create({
    data: {
      userId: user.id,
      type: "FOLLOW_UP",
      priority: "NORMAL",
      subject: `Subscription Paused: ${user.firstName} ${user.lastName}`,
      notes: `Patient's subscription has been paused.

**Subscription ID:** ${subscription.id}

**Actions:**
1. Contact patient to understand reason for pause
2. Discuss options for resuming
3. Document feedback for improvement`,
      status: "PENDING",
      dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      assignedTo: user.assignedCarePartnerId || undefined,
    },
  }).catch(console.error);

  // Create internal note
  await prisma.internalNote.create({
    data: {
      userId: user.id,
      category: "BILLING",
      title: "Subscription Paused",
      content: `Subscription ${subscription.id} has been paused.`,
      createdBy: "system",
    },
  }).catch(console.error);

  // Log automation
  await prisma.automationLog.create({
    data: {
      userId: user.id,
      automationType: "subscription_paused",
      triggerEvent: "customer.subscription.paused",
      channel: "stripe_webhook",
      status: "completed",
      metadata: {
        subscriptionId: subscription.id,
      },
    },
  }).catch(console.error);

  // Send email notification
  await sendEmail({
    to: user.email,
    subject: "Your Sanative subscription has been paused",
    body: `
      <h2>Hi ${user.firstName},</h2>
      <p>Your Sanative subscription has been paused.</p>
      <p>If you'd like to resume your program at any time, please contact our care team or visit your dashboard.</p>
      <p>We're always here to support you on your health journey.</p>
      <p style="color:#666;margin-top:24px;">The Sanative Health Team</p>
    `,
  }).catch(console.error);

  console.log(`Subscription paused for user ${user.id}`);
}
