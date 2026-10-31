import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { createEmailDraft } from "@/lib/email-draft";
import { LEGAL_LINKS, SANATIVE_LEGAL } from "@/lib/legal/constants";
import { HEART_DRIVER_TITLES, HEART_RESULT_DISCLAIMER, HEART_RESULT_HEADLINES } from "@/lib/promo/heart-assessment-results";
import { KIDNEY_DRIVER_TITLES, KIDNEY_RESULT_DISCLAIMER, KIDNEY_RESULT_HEADLINES } from "@/lib/promo/kidney-assessment-results";
import { LIVER_DRIVER_TITLES, LIVER_RESULT_DISCLAIMER, LIVER_RESULT_HEADLINES } from "@/lib/promo/liver-assessment-results";
import {
  isOrganResultTier,
  sanitizeAssessmentFirstName,
  sanitizeOrganDrivers,
  type OrganAssessmentKind,
  type OrganResultTier,
} from "@/lib/promo/organ-assessment-results";
import { isValidContactEmail } from "@/lib/public/contact-chat";
import { RATE_LIMITS, rateLimitBucketKey } from "@/lib/security/rate-limit-config";
import {
  enforceDbRateLimits,
  getClientIp,
  rateLimitExceededResponse,
} from "@/lib/security/rate-limit-http";

type OrganEmailCopy = {
  rateLimitPrefix: string;
  logTag: string;
  visitorSubject: (firstName: string) => string;
  checkoutPath: string;
  ctaLabel: string;
  markersSentence: string;
  disclaimer: string;
  headlines: Record<OrganResultTier, string>;
  driverTitles: readonly string[];
  consentError: string;
  visitorTips: string;
  supportIntro: string;
  supportConsent: string;
};

const ORGAN_EMAIL: Record<OrganAssessmentKind, OrganEmailCopy> = {
  liver: {
    rateLimitPrefix: "liver-results",
    logTag: "liver-assessment-results",
    visitorSubject: (firstName) => `${firstName}, your Sanative liver check`,
    checkoutPath: "/membership/checkout?source=fatty_liver&button=liver_quiz_email",
    ctaLabel: "Check My Liver Risk",
    markersSentence:
      "A blood test can look at ALT, AST, GGT, HbA1c, insulin, triglycerides and HDL. A Sanative doctor reviews those results with you.",
    disclaimer: LIVER_RESULT_DISCLAIMER,
    headlines: LIVER_RESULT_HEADLINES,
    driverTitles: LIVER_DRIVER_TITLES,
    consentError: "Tick the box to email your results and liver health tips.",
    visitorTips: "You asked for liver health tips from Sanative.",
    supportIntro: "Someone asked to email their liver check results.",
    supportConsent: "They consented to results and liver health tips.",
  },
  heart: {
    rateLimitPrefix: "heart-results",
    logTag: "heart-assessment-results",
    visitorSubject: (firstName) => `${firstName}, your Sanative heart check`,
    checkoutPath: "/membership/checkout?source=heart_health&button=heart_quiz_email",
    ctaLabel: "Check My Heart Risk",
    markersSentence:
      "A blood test can look at LDL, HDL, triglycerides, total cholesterol, hs-CRP, HbA1c and ApoB. A Sanative doctor reviews those results with you.",
    disclaimer: HEART_RESULT_DISCLAIMER,
    headlines: HEART_RESULT_HEADLINES,
    driverTitles: HEART_DRIVER_TITLES,
    consentError: "Tick the box to email your results and heart health tips.",
    visitorTips: "You asked for heart health tips from Sanative.",
    supportIntro: "Someone asked to email their heart check results.",
    supportConsent: "They consented to results and heart health tips.",
  },
  kidney: {
    rateLimitPrefix: "kidney-results",
    logTag: "kidney-assessment-results",
    visitorSubject: (firstName) => `${firstName}, your Sanative kidney check`,
    checkoutPath: "/membership/checkout?source=kidney_health&button=kidney_quiz_email",
    ctaLabel: "Check My Kidneys Risk",
    markersSentence:
      "A blood test can look at eGFR, creatinine, uACR, BUN, HbA1c, insulin and electrolytes. A Sanative doctor reviews those results with you.",
    disclaimer: KIDNEY_RESULT_DISCLAIMER,
    headlines: KIDNEY_RESULT_HEADLINES,
    driverTitles: KIDNEY_DRIVER_TITLES,
    consentError: "Tick the box to email your results and kidney health tips.",
    visitorTips: "You asked for kidney health tips from Sanative.",
    supportIntro: "Someone asked to email their kidney check results.",
    supportConsent: "They consented to results and kidney health tips.",
  },
};

function siteOrigin() {
  return (process.env.NEXTAUTH_URL || "https://sanative.com.au").replace(/\/$/, "");
}

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function isOrganAssessmentKind(value: unknown): value is OrganAssessmentKind {
  return value === "liver" || value === "heart" || value === "kidney";
}

export function composeOrganAssessmentVisitorEmail(params: {
  organ: OrganAssessmentKind;
  firstName: string;
  email: string;
  tier: OrganResultTier;
  drivers: string[];
}) {
  const copy = ORGAN_EMAIL[params.organ];
  const checkoutUrl = `${siteOrigin()}${copy.checkoutPath}`;
  const privacyUrl = `${siteOrigin()}${LEGAL_LINKS.privacy}`;
  const driverHtml =
    params.drivers.length > 0
      ? `<p><strong>What's driving your result</strong></p><ul>${params.drivers
          .map((title) => `<li>${escapeHtml(title)}</li>`)
          .join("")}</ul>`
      : "";

  return {
    to: params.email,
    subject: copy.visitorSubject(params.firstName),
    html: `<p>Hi ${escapeHtml(params.firstName)},</p>
<p>${escapeHtml(copy.headlines[params.tier])}</p>
${driverHtml}
<p>${copy.markersSentence}</p>
<p><a href="${checkoutUrl}">${copy.ctaLabel}</a></p>
<p>${escapeHtml(copy.disclaimer)}</p>
<p>${copy.visitorTips} You can unsubscribe any time via the <a href="${privacyUrl}">privacy policy</a> or by emailing ${SANATIVE_LEGAL.supportEmail}.</p>
<p>Sanative</p>`,
  };
}

async function sendOrganQuizDraftReviewEmail(params: {
  organ: OrganAssessmentKind;
  firstName: string;
  email: string;
  tier: OrganResultTier;
  drivers: string[];
  composed: { subject: string; html: string };
}) {
  const copy = ORGAN_EMAIL[params.organ];
  return sendEmail({
    to: SANATIVE_LEGAL.supportEmail,
    replyTo: params.email,
    process: "crm",
    subject: `[DRAFT FOR REVIEW — not sent] ${params.composed.subject}`,
    body: `<p><strong>DRAFT FOR REVIEW — this was not sent to the visitor.</strong></p>
<p>Mailbox drafts were unavailable. Review the message below, then send it yourself from Gmail (To: the visitor address).</p>
<p>${copy.supportIntro}</p>
<p><strong>Send to:</strong> ${escapeHtml(params.email)}</p>
<p><strong>Subject:</strong> ${escapeHtml(params.composed.subject)}</p>
<p><strong>Name:</strong> ${escapeHtml(params.firstName)}</p>
<p><strong>Tier:</strong> ${params.tier}</p>
<p><strong>Drivers:</strong> ${params.drivers.length ? escapeHtml(params.drivers.join(", ")) : "None"}</p>
<p>${copy.supportConsent}</p>
<hr />
${params.composed.html}`,
  });
}

export async function handleOrganAssessmentResultsPost(
  request: NextRequest,
  organ: OrganAssessmentKind,
  parsedBody?: Record<string, unknown>
) {
  const copy = ORGAN_EMAIL[organ];

  try {
    const body = parsedBody ?? ((await request.json().catch(() => ({}))) as Record<string, unknown>);
    const firstName = sanitizeAssessmentFirstName(body.firstName);
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const consent = body.consent === true;
    const tier = isOrganResultTier(body.tier) ? body.tier : null;
    const drivers = sanitizeOrganDrivers(body.drivers, copy.driverTitles);

    if (!firstName) {
      return NextResponse.json({ error: "Please enter your first name." }, { status: 400 });
    }
    if (!isValidContactEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
    }
    if (!consent) {
      return NextResponse.json({ error: copy.consentError }, { status: 400 });
    }
    if (!tier) {
      return NextResponse.json({ error: "Please complete the assessment first." }, { status: 400 });
    }

    const limited = await enforceDbRateLimits([
      {
        bucketKey: rateLimitBucketKey(`${copy.rateLimitPrefix}:ip`, getClientIp(request)),
        config: RATE_LIMITS.contactChatIp,
      },
      {
        bucketKey: rateLimitBucketKey(`${copy.rateLimitPrefix}:email`, email),
        config: RATE_LIMITS.contactChatEmail,
      },
    ]);
    if (!limited.allowed) {
      return rateLimitExceededResponse(limited.retryAfterSec);
    }

    const composed = composeOrganAssessmentVisitorEmail({
      organ,
      firstName,
      email,
      tier,
      drivers,
    });

    const draftResult = await createEmailDraft({
      to: email,
      process: "crm",
      subject: composed.subject,
      html: composed.html,
    });

    if (!draftResult.success) {
      const review = await sendOrganQuizDraftReviewEmail({
        organ,
        firstName,
        email,
        tier,
        drivers,
        composed,
      });
      if (!review.success) {
        return NextResponse.json(
          { error: "We could not send that email. Please try again." },
          { status: 502 }
        );
      }
      console.warn(
        `[${copy.logTag}] mailbox draft unavailable; left a review copy in ${SANATIVE_LEGAL.supportEmail}`
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(`[${copy.logTag}] request failed`, error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again or email info@sanative.com.au." },
      { status: 500 }
    );
  }
}
