import Link from "next/link";
import {
  LegalSection,
  LegalP,
  LegalUl,
  LegalOl,
  LegalH3,
} from "@/components/legal/LegalPageLayout";
import { LEGAL_LINKS, SANATIVE_LEGAL } from "@/lib/legal/constants";

export function SubscriptionTermsContent() {
  return (
    <>
      <LegalSection title="Introduction">
        <LegalP>
          These Subscription Terms apply to recurring Sanative program memberships, including Sanative
          Core and Sanative Precision Weight Management plans (and other subscription programs where
          stated at checkout). They supplement our{" "}
          <Link href={LEGAL_LINKS.terms} className="underline text-[#5c7a52]">
            Terms &amp; Conditions
          </Link>{" "}
          and{" "}
          <Link href={LEGAL_LINKS.refundPolicy} className="underline text-[#5c7a52]">
            Refund Policy
          </Link>
          . If there is a conflict, these Subscription Terms prevail for subscription-specific matters.
        </LegalP>
        <LegalP>
          By purchasing a subscription plan, you agree to these Subscription Terms and authorise
          recurring charges as described at checkout.
        </LegalP>
      </LegalSection>

      <LegalSection title="What your subscription includes">
        <LegalP>
          Program membership fees cover access to Sanative&apos;s doctor-led program Services as
          applicable to your plan. Depending on your selected plan, this may include:
        </LegalP>
        <LegalUl>
          <li>Initial and ongoing telehealth consultations with AHPRA-registered practitioners (up to
            the limits stated for your plan)</li>
          <li>Secure messaging and care partner support between consultations where offered</li>
          <li>Patient portal access, progress tracking, and program resources</li>
          <li>Doctor-reviewed biomarker monitoring and care plan updates where clinically appropriate</li>
          <li>Onboarding and program curriculum materials</li>
        </LegalUl>
        <LegalP>
          <strong>Program fees do not include:</strong>
        </LegalP>
        <LegalUl>
          <li>Prescription medicines, supplements, or pharmacy dispensing fees</li>
          <li>Pathology, laboratory, or diagnostic testing fees</li>
          <li>Third-party delivery or courier charges</li>
          <li>Additional consultations beyond plan limits (where additional fees apply)</li>
        </LegalUl>
        <LegalP>
          Some care options discussed with your doctor may involve separate costs. You will be informed
          before incurring additional charges where practicable.
        </LegalP>
      </LegalSection>

      <LegalSection title="Not health insurance">
        <LegalP>
          Sanative program membership is <strong>not health insurance</strong> and is not a substitute
          for private health insurance or Medicare. It does not meet any individual health insurance
          mandate. You should maintain your existing health cover and GP relationship.
        </LegalP>
      </LegalSection>

      <LegalSection title="Billing and payment">
        <LegalH3>First month and ongoing fees</LegalH3>
        <LegalUl>
          <li>Promotional first-month pricing, where offered, applies to eligible new patients as
            displayed at checkout</li>
          <li>Ongoing monthly fees apply after the first month at the rate shown during checkout</li>
          <li>All prices are in Australian dollars (AUD) and include GST where applicable</li>
          <li>Payments are processed automatically via Stripe or our payment processor using your saved
            payment method</li>
        </LegalUl>

        <LegalH3>Automatic renewal</LegalH3>
        <LegalP>
          Subscriptions renew automatically each billing cycle unless cancelled before the cutoff
          described below. By subscribing, you authorise us to charge your payment method on each
          renewal date for the applicable program fee.
        </LegalP>
        <LegalP>
          <strong>
            You will be charged each billing period even if you do not use all included Services
          </strong>
          , unless you cancel before the next renewal date.
        </LegalP>

        <LegalH3>Price changes</LegalH3>
        <LegalP>
          We may change subscription prices for future billing periods with reasonable notice where
          required by law. Price changes apply from your next renewal after notice. You may cancel
          before the change takes effect if you do not wish to continue at the new price.
        </LegalP>

        <LegalH3>Failed payments</LegalH3>
        <LegalP>
          If a payment fails, we may retry the charge and contact you to update your payment details.
          Continued failure may suspend portal access, booking, or program Services until payment is
          resolved. We are not obliged to provide clinical Services while payment is outstanding.
        </LegalP>
      </LegalSection>

      <LegalSection title="Cancellation">
        <LegalP>You may cancel your subscription at any time by:</LegalP>
        <LegalUl>
          <li>Using the subscription management options in your patient portal, or</li>
          <li>Emailing{" "}
            <a href={`mailto:${SANATIVE_LEGAL.supportEmail}`} className="underline text-[#5c7a52]">
              {SANATIVE_LEGAL.supportEmail}
            </a>{" "}
            from your registered email address
          </li>
        </LegalUl>
        <LegalP>
          To avoid charge for the next billing cycle, cancel at least <strong>48 hours</strong> before
          your renewal date. Cancellation stops future automatic charges but does not refund the
          current period except as stated in our Refund Policy or required by law.
        </LegalP>
        <LegalP>
          After cancellation, you retain access through the end of the paid billing period. Prescription
          or clinical Services may cease earlier if your practitioner determines continued care
          requires an active membership — discuss with your care team before discontinuing treatment.
        </LegalP>
      </LegalSection>

      <LegalSection title="Pausing membership">
        <LegalP>
          Pause options may be available for certain plans at our discretion or as stated at checkout.
          Pausing stops billing for the pause period but may also suspend clinical Services and
          prescription renewals. Contact support for eligibility.
        </LegalP>
      </LegalSection>

      <LegalSection title="Plan changes">
        <LegalP>
          You may request to upgrade or downgrade your plan (e.g. Core to Precision) subject to
          clinical suitability and availability. Price differences will be explained before any change
          takes effect. Plan changes may require a new clinical assessment.
        </LegalP>
      </LegalSection>

      <LegalSection title="Consultation limits and additional fees">
        <LegalP>
          Your plan may include a defined number of medical consultations per year or billing period.
          Additional consultations or tests ordered beyond plan inclusions may incur separate fees,
          which will be communicated before charging where practicable.
        </LegalP>
      </LegalSection>

      <LegalSection title="Clinical unsuitability">
        <LegalP>
          If your doctor determines the program is not clinically suitable following your initial
          consultation, your first-month fee may be refunded in accordance with our{" "}
          <Link href={LEGAL_LINKS.refundPolicy} className="underline text-[#5c7a52]">
            Refund Policy
          </Link>
          . Your subscription will not continue unless you are accepted into ongoing care.
        </LegalP>
      </LegalSection>

      <LegalSection title="Program changes and discontinuation">
        <LegalP>
          We may modify program inclusions, features, or pricing with reasonable notice where required.
          We may discontinue a program with reasonable notice so you can arrange alternative care. Neither
          Sanative nor affiliated practitioners guarantee the continued availability of any specific
          program or treatment pathway.
        </LegalP>
      </LegalSection>

      <LegalSection title="Termination by Sanative">
        <LegalP>
          We may suspend or terminate your subscription if you breach our Terms, provide fraudulent
          information, abuse staff or practitioners, or where required for patient safety or legal
          compliance. We will provide notice where reasonable except in urgent circumstances.
        </LegalP>
      </LegalSection>

      <LegalSection title="Refunds">
        <LegalP>
          Refund eligibility is set out in our{" "}
          <Link href={LEGAL_LINKS.refundPolicy} className="underline text-[#5c7a52]">
            Refund Policy
          </Link>
          . Nothing in these Subscription Terms limits your rights under the Australian Consumer Law.
        </LegalP>
      </LegalSection>

      <LegalSection title="Contact">
        <LegalP>
          Subscription and billing questions:{" "}
          <a href={`mailto:${SANATIVE_LEGAL.supportEmail}`} className="underline text-[#5c7a52]">
            {SANATIVE_LEGAL.supportEmail}
          </a>
        </LegalP>
      </LegalSection>
    </>
  );
}
