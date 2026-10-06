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
          These Subscription Terms apply to Sanative Membership and to continuing Sanative care
          programs billed on a recurring basis (typically quarterly in advance after any included
          membership period), as stated at checkout. They supplement our{" "}
          <Link href={LEGAL_LINKS.terms} className="underline text-[#5c7a52]">
            Terms &amp; Conditions
          </Link>{" "}
          and our{" "}
          <Link href={LEGAL_LINKS.refundPolicy} className="underline text-[#5c7a52]">
            Refund Policy
          </Link>
          . If there is a conflict, these Subscription Terms prevail for subscription-specific matters.
        </LegalP>
        <LegalP>
          By purchasing Sanative Membership or a continuing care program subscription, you agree to
          these Subscription Terms and authorise recurring charges as described at checkout.
        </LegalP>
      </LegalSection>

      <LegalSection title="What your subscription includes">
        <LegalP>
          Sanative Membership fees principally cover access to the Sanative digital health platform and
          membership features, as described in our Terms &amp; Conditions. Continuing care program fees
          cover access to Sanative&apos;s doctor-led program Services as applicable to the program you
          continue. Depending on your membership and program, this may include:
        </LegalP>
        <LegalUl>
          <li>
            Telehealth consultations with AHPRA-registered practitioners (as included for your membership
            or program)
          </li>
          <li>Secure messaging and care partner support between consultations where offered</li>
          <li>Patient portal access, progress tracking, and program resources</li>
          <li>Doctor-reviewed biomarker monitoring and care plan updates where clinically appropriate</li>
          <li>Onboarding and program curriculum materials</li>
        </LegalUl>
        <LegalP>
          <strong>Fees do not include (unless expressly stated otherwise):</strong>
        </LegalP>
        <LegalUl>
          <li>Prescription medicines, supplements, or pharmacy dispensing fees</li>
          <li>Pathology, laboratory, or diagnostic testing fees</li>
          <li>Third-party delivery or courier charges</li>
          <li>Additional consultations beyond what is included with your membership or program</li>
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
        <LegalH3>Prices and GST</LegalH3>
        <LegalP>
          All prices quoted for Sanative membership and program fees are in Australian dollars (AUD)
          and <strong>include GST</strong>, unless expressly stated otherwise at checkout.
        </LegalP>

        <LegalH3>Sanative Membership: $1/day / $365/year</LegalH3>
        <LegalP>
          Where Sanative Membership is described as <strong>$1/day</strong>, that is an illustrative
          daily equivalent. Sanative Membership is charged as{" "}
          <strong>$365/year</strong> (including GST), unless a different price is shown at
          checkout. Further detail on what the $365 membership includes is set out in our{" "}
          <Link href={LEGAL_LINKS.terms} className="underline text-[#5c7a52]">
            Terms &amp; Conditions
          </Link>{" "}
          under Payments and subscriptions.
        </LegalP>

        <LegalH3>Included 30-day care program period</LegalH3>
        <LegalP>
          The Sanative Membership includes the first 30 days of one eligible Sanative care program,
          subject to clinical suitability. You must nominate your chosen program before or during
          your initial doctor consultation so that your doctor can undertake the relevant clinical
          assessment and review the medical history required for that program. The included 30-day
          period is not available for a program selected after the initial consultation.
        </LegalP>
        <LegalUl>
          <li>
            Ongoing program fees apply after the included period if you elect to continue, at the
            rate shown for that program at checkout or on the relevant program page
          </li>
          <li>
            Payments are processed automatically via Stripe or our payment processor using your saved
            payment method
          </li>
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
          current period except as stated in our{" "}
          <Link href={LEGAL_LINKS.refundPolicy} className="underline text-[#5c7a52]">
            Refund Policy
          </Link>{" "}
          or required by law.
        </LegalP>
        <LegalP>
          After cancellation, you retain access through the end of the paid billing period. Prescription
          or clinical Services may cease earlier if your practitioner determines continued care
          requires an active membership. Discuss with your care team before discontinuing treatment.
        </LegalP>
      </LegalSection>

      <LegalSection title="Pausing membership">
        <LegalP>
          Pause options may be available for membership or care programs at our discretion or as stated
          at checkout.
          Pausing stops billing for the pause period but may also suspend clinical Services and
          prescription renewals. Contact support for eligibility.
        </LegalP>
      </LegalSection>

      <LegalSection title="Program changes">
        <LegalP>
          You may request to change or add an eligible Sanative care program subject to clinical
          suitability and availability. Any price differences will be explained before a change takes
          effect. Changing programs may require a new clinical assessment.
        </LegalP>
      </LegalSection>

      <LegalSection title="Consultation limits and additional fees">
        <LegalP>
          Your membership or care program may include a defined number of medical consultations per
          year or billing period. Additional consultations or tests ordered beyond those inclusions may
          incur separate fees, which will be communicated before charging where practicable.
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
