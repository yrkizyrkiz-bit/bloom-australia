import Link from "next/link";
import {
  LegalSection,
  LegalP,
  LegalUl,
  LegalOl,
  LegalH3,
} from "@/components/legal/LegalPageLayout";
import { LEGAL_LINKS, SANATIVE_LEGAL } from "@/lib/legal/constants";

export function RefundPolicyContent() {
  return (
    <>
      <LegalSection title="Overview">
        <LegalP>
          This Refund Policy explains when refunds may be available for fees paid to{" "}
          {SANATIVE_LEGAL.entityName} (&quot;Sanative&quot;) for doctor-led health programs. It should
          be read together with our{" "}
          <Link href={LEGAL_LINKS.terms} className="underline text-[#5c7a52]">
            Terms &amp; Conditions
          </Link>
          ,{" "}
          <Link href={LEGAL_LINKS.subscriptionTerms} className="underline text-[#5c7a52]">
            Subscription Terms
          </Link>
          , and{" "}
          <Link href={LEGAL_LINKS.medicalDisclaimer} className="underline text-[#5c7a52]">
            Medical Disclaimer
          </Link>
          .
        </LegalP>
        <LegalP>
          Program fees cover clinical assessment, onboarding, care coordination, and program access as
          described at checkout. They do not include medicines, pathology, pharmacy dispensing, or
          third-party fees unless expressly stated.
        </LegalP>
      </LegalSection>

      <LegalSection title="Clinical unsuitability: first month program fee">
        <LegalP>
          If your Sanative doctor determines that the program is{" "}
          <strong>not clinically suitable</strong> for you following your initial consultation, your{" "}
          <strong>first-month program fee</strong> will be refunded in full, provided:
        </LegalP>
        <LegalUl>
          <li>Payment was made directly to Sanative for that program</li>
          <li>You attended your initial consultation (or attempted to as scheduled)</li>
          <li>The unsuitability determination was made by the treating practitioner in their clinical
            judgment</li>
        </LegalUl>
        <LegalP>
          This refund applies to the Sanative program membership fee, not to separate charges for
          pathology, pharmacy, or third-party services.
        </LegalP>
        <LegalP>
          Refunds are processed to the original payment method. Please allow 5–10 business days for
          the refund to appear, depending on your financial institution. Some banks may take longer.
        </LegalP>
      </LegalSection>

      <LegalSection title="Automatic refunds in other circumstances">
        <LegalP>We may automatically refund program fees where:</LegalP>
        <LegalUl>
          <li>
            You paid at checkout but were subsequently deemed unsuitable before services commenced,
            and no consultation took place
          </li>
          <li>
            A treatment or onboarding request expired because required steps were not completed within
            the stated timeframe, and you were charged in error
          </li>
          <li>
            A duplicate or erroneous charge was processed by our payment system
          </li>
        </LegalUl>
        <LegalP>
          We will notify you by email when an automatic refund is issued.
        </LegalP>
      </LegalSection>

      <LegalSection title="What is not automatically refunded">
        <LegalP>The following are generally not refundable through Sanative unless required by law:</LegalP>
        <LegalUl>
          <li>Pathology, laboratory, or diagnostic fees paid to third-party providers</li>
          <li>Pharmacy, medicine, or supplement costs</li>
          <li>Ongoing monthly program fees after the first month where you remain in the program</li>
          <li>Fees for consultations you did not attend without reasonable notice (no-shows)</li>
          <li>Partial months of membership after cancellation takes effect</li>
          <li>Promotional or discounted amounts where the offer terms stated non-refundability</li>
          <li>Third-party delivery, courier, or dispensing fees</li>
        </LegalUl>
      </LegalSection>

      <LegalSection title="Cancellation and billing periods">
        <LegalP>
          You may cancel your subscription in accordance with our{" "}
          <Link href={LEGAL_LINKS.subscriptionTerms} className="underline text-[#5c7a52]">
            Subscription Terms
          </Link>
          . Cancellation stops future billing but does not automatically refund fees already paid for
          the current billing period unless:
        </LegalP>
        <LegalUl>
          <li>You are entitled to a refund under this Refund Policy</li>
          <li>A refund is required under the Australian Consumer Law</li>
          <li>A specific promotional offer at checkout stated a refund entitlement</li>
        </LegalUl>
        <LegalP>
          You retain access to program Services through the end of the billing period for which you
          have already paid, unless we terminate access earlier for breach of Terms or safety reasons.
        </LegalP>
      </LegalSection>

      <LegalSection title="Missed appointments">
        <LegalP>
          If you miss a scheduled consultation without rescheduling within the notice period stated
          at booking, we may not refund fees associated with that appointment. Repeated no-shows may
          result in suspension of booking privileges. Contact us if you were unable to attend due to
          circumstances beyond your control. We will consider each case fairly.
        </LegalP>
      </LegalSection>

      <LegalSection title="Chargebacks and disputes">
        <LegalP>
          If you dispute a charge with your bank or payment provider (chargeback) before contacting us,
          we may suspend your account while the dispute is investigated. We encourage you to email{" "}
          <a href={`mailto:${SANATIVE_LEGAL.supportEmail}`} className="underline text-[#5c7a52]">
            {SANATIVE_LEGAL.supportEmail}
          </a>{" "}
          first so we can resolve the issue directly.
        </LegalP>
      </LegalSection>

      <LegalSection title="Australian Consumer Law">
        <LegalP>
          Our Services come with guarantees that cannot be excluded under the Australian Consumer Law.
          You are entitled to a replacement or refund for a major failure and compensation for any
          other reasonably foreseeable loss or damage. You are also entitled to have Services
          supplied again if they fail to be of acceptable quality and the failure does not amount to a
          major failure.
        </LegalP>
        <LegalP>
          Nothing in this Refund Policy limits those rights. If you believe a consumer guarantee has
          been breached, contact us with details of your concern.
        </LegalP>
      </LegalSection>

      <LegalSection title="How to request a refund">
        <LegalP>To request a refund, email{" "}
          <a href={`mailto:${SANATIVE_LEGAL.supportEmail}`} className="underline text-[#5c7a52]">
            {SANATIVE_LEGAL.supportEmail}
          </a>{" "}
          with:
        </LegalP>
        <LegalOl>
          <li>Subject line: &quot;Refund request&quot;</li>
          <li>Your full name and account email</li>
          <li>Program name and date of payment</li>
          <li>Reason for the request and any supporting information</li>
        </LegalOl>
        <LegalP>
          We will acknowledge your request and respond within a reasonable timeframe, usually within
          10 business days. We may ask for additional information to verify your identity and assess
          eligibility.
        </LegalP>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <LegalP>
          We may update this Refund Policy from time to time. Changes apply to purchases made after the
          updated policy is posted, unless otherwise required by law. The refund terms displayed at
          checkout at the time of your purchase also form part of your agreement with us.
        </LegalP>
      </LegalSection>
    </>
  );
}
