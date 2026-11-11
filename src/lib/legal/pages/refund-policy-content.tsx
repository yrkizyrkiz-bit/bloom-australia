import {
  LegalSection,
  LegalP,
  LegalUl,
  LegalH3,
} from "@/components/legal/LegalPageLayout";
import { SANATIVE_LEGAL } from "@/lib/legal/constants";

export function RefundPolicyContent() {
  return (
    <>
      <LegalSection title="Refunds, Cancellations and Program Payments">
        <LegalP>
          We want Sanative Membership and program fees to be clear and easy to understand.
        </LegalP>
        <LegalP>
          Sanative Membership primarily provides access to the{" "}
          <strong>Sanative digital health platform</strong>, together with the membership features,
          tools, information and services made available through that platform.
        </LegalP>
        <LegalP>
          Certain healthcare, clinical and other services accessible through Sanative are provided by
          doctors, healthcare professionals, laboratories, pharmacies and other service providers who
          contract, collaborate or partner with Sanative.
        </LegalP>
        <LegalP>
          Those professional and third-party services are provided by the relevant provider rather than
          by Sanative itself, unless we expressly tell you otherwise.
        </LegalP>
        <LegalP>
          Nothing in these Terms limits any rights or remedies you may have under the Australian
          Consumer Law.
        </LegalP>
      </LegalSection>

      <LegalSection title="Refund and Cancellation">
        <LegalH3>Annual Sanative Membership</LegalH3>
        <LegalUl>
          <li>
            <strong>Before your initial consultation:</strong> Full change-of-mind refund available.
          </li>
          <li>
            <strong>After your initial consultation commences:</strong> No change-of-mind refund.
          </li>
          <li>
            <strong>Missed or unavailable initial consultation:</strong> No change-of-mind refund
            where the consultation was reasonably made available.
          </li>
          <li>
            <strong>Clinical ineligibility for a treatment or program:</strong> Does not, by itself,
            entitle you to a membership refund.
          </li>
        </LegalUl>

        <LegalH3>Medical Weight Management Program</LegalH3>
        <LegalUl>
          <li>
            <strong>$49 initial consultation fee:</strong> Refundable in the event the patient is
            not medically eligible for the Sanative medical weight loss program.
          </li>
          <li>
            <strong>Eligible first-time patients:</strong> Covered by the 30-day Love it or Leave it
            Guarantee.
          </li>
          <li>
            <strong>Refund requests:</strong> Must be received in writing within 30 calendar days of
            the first prescribed medication delivery.
          </li>
          <li>
            The guarantee can only be claimed once, and only by new customers of the Love it or Leave
            it campaign.
          </li>
          <li>
            The guarantee applies to Sanative weight management subscription fees only.
          </li>
        </LegalUl>

        <LegalH3>Continuing Healthcare Programs</LegalH3>
        <LegalUl>
          <li>Cancel at any time to prevent future renewal.</li>
          <li>
            Commenced quarterly payments are generally not refundable for change of mind, except
            where an applicable guarantee provides otherwise.
          </li>
        </LegalUl>
      </LegalSection>

      <LegalSection title="Requesting Cancellation or a Refund">
        <LegalP>
          You may cancel future membership or program renewals using the cancellation method provided
          through your Sanative account or by contacting Sanative support.
        </LegalP>
        <LegalP>
          If you believe you are entitled to a refund or another remedy, please contact Sanative with
          sufficient information for us to review your request.
        </LegalP>
        <LegalP>
          We will consider requests reasonably and in accordance with these Terms and applicable
          Australian law. Contact{" "}
          <a href={`mailto:${SANATIVE_LEGAL.supportEmail}`} className="underline text-[#5c7a52]">
            {SANATIVE_LEGAL.supportEmail}
          </a>
          .
        </LegalP>
      </LegalSection>
    </>
  );
}
