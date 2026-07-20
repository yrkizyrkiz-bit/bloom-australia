import Link from "next/link";
import {
  LegalSection,
  LegalP,
  LegalUl,
  LegalOl,
  LegalH3,
} from "@/components/legal/LegalPageLayout";
import { LEGAL_LINKS, SANATIVE_LEGAL } from "@/lib/legal/constants";

export function TelehealthConsentContent() {
  return (
    <>
      <LegalSection title="Introduction">
        <LegalP>
          This document explains telehealth services provided through Sanative and records your consent
          to receive care by telehealth where clinically appropriate. It supplements our{" "}
          <Link href={LEGAL_LINKS.terms} className="underline text-[#5c7a52]">
            Terms &amp; Conditions
          </Link>{" "}
          and{" "}
          <Link href={LEGAL_LINKS.privacy} className="underline text-[#5c7a52]">
            Privacy Policy
          </Link>
          .
        </LegalP>
        <LegalP>
          By booking, attending, or participating in a Sanative telehealth consultation — or by
          continuing through our onboarding flow that includes telehealth consent — you acknowledge
          that you have read and agree to this Telehealth Consent.
        </LegalP>
      </LegalSection>

      <LegalSection title="What is telehealth?">
        <LegalP>
          Telehealth (also called telemedicine) means the delivery of clinical services using
          electronic communications and information technology when you and your practitioner are not
          in the same physical location. Telehealth may include:
        </LegalP>
        <LegalUl>
          <li>Video consultations</li>
          <li>Telephone consultations</li>
          <li>Secure messaging through the patient portal</li>
          <li>Electronic transmission of health information, photos, pathology results, and records</li>
          <li>Remote monitoring and follow-up where clinically appropriate</li>
        </LegalUl>
      </LegalSection>

      <LegalSection title="Your consent">
        <LegalP>
          By using Sanative telehealth Services, you consent to:
        </LegalP>
        <LegalUl>
          <li>Receiving assessment, consultation, and follow-up care by telehealth where your
            practitioner determines it is clinically appropriate</li>
          <li>Your practitioner creating and maintaining clinical records of telehealth consultations</li>
          <li>Sanative and your practitioner sending you disclosures, messages, reports, and care
            instructions electronically (including by email, SMS, or portal notification)</li>
          <li>The use of third-party video, messaging, or scheduling tools that support telehealth
            delivery, as described in our Privacy Policy</li>
        </LegalUl>
        <LegalP>
          Your consent is ongoing for the duration of your care unless you withdraw it (see below).
        </LegalP>
      </LegalSection>

      <LegalSection title="Benefits of telehealth">
        <LegalUl>
          <li>Convenient access to AHPRA-registered practitioners without travel</li>
          <li>Ability to participate from a location of your choice (subject to privacy requirements)</li>
          <li>Continuity of care and follow-up through secure messaging where offered</li>
          <li>Reduced time away from work or other commitments for suitable consult types</li>
        </LegalUl>
      </LegalSection>

      <LegalSection title="Risks and limitations">
        <LegalP>
          Telehealth has limitations compared with in-person care. You acknowledge that:
        </LegalP>
        <LegalUl>
          <li>
            <strong>Not all conditions can be assessed remotely.</strong> Your practitioner may not be
            able to perform a physical examination and may rely on information and images you provide
          </li>
          <li>
            <strong>Technology may fail.</strong> Video, audio, or internet disruptions may delay or
            interrupt consultations
          </li>
          <li>
            <strong>Privacy risks exist.</strong> You are responsible for participating from a private
            location and using secure networks where possible
          </li>
          <li>
            <strong>Electronic communication is not 100% secure.</strong> Despite safeguards, there is
            a residual risk of unauthorised access
          </li>
          <li>
            <strong>Telehealth may not be appropriate</strong> for emergencies, certain mental health
            crises, or conditions requiring urgent in-person assessment
          </li>
          <li>
            <strong>Your practitioner may decline telehealth</strong> or recommend in-person care,
            referral, or emergency services instead
          </li>
        </LegalUl>
      </LegalSection>

      <LegalSection title="Your responsibilities">
        <LegalP>To help ensure safe and effective telehealth care, you agree to:</LegalP>
        <LegalOl>
          <li>Provide accurate, complete, and up-to-date health information</li>
          <li>Attend scheduled appointments on time or reschedule with reasonable notice</li>
          <li>Participate from a private, quiet location suitable for discussing health matters</li>
          <li>Ensure your device, camera, microphone, and internet connection are functional</li>
          <li>Inform your practitioner promptly if your condition changes or worsens</li>
          <li>Seek emergency care (000) for urgent or life-threatening symptoms — do not rely on
            telehealth for emergencies</li>
          <li>Maintain an ongoing relationship with your regular GP where recommended</li>
          <li>Advise your GP of treatments or medicines prescribed through Sanative</li>
          <li>Follow your practitioner&apos;s advice regarding medicines, tests, and follow-up</li>
        </LegalOl>
      </LegalSection>

      <LegalSection title="Emergency care">
        <LegalP>
          Sanative telehealth is <strong>not</strong> an emergency service. If you experience chest
          pain, difficulty breathing, severe bleeding, loss of consciousness, thoughts of self-harm, or
          any other emergency, call <strong>000</strong> immediately or attend the nearest emergency
          department.
        </LegalP>
      </LegalSection>

      <LegalSection title="Privacy and clinical records">
        <LegalP>
          Telehealth consultations are documented in your clinical record in accordance with our{" "}
          <Link href={LEGAL_LINKS.privacy} className="underline text-[#5c7a52]">
            Privacy Policy
          </Link>{" "}
          and applicable health record laws. Consultations may be recorded for quality assurance,
          training, or compliance where you are notified and this is permitted by law. You may inform
          the practitioner if you do not wish a recording to be kept where alternatives exist.
        </LegalP>
        <LegalP>
          Health information transmitted electronically is protected using reasonable security measures,
          but no system is completely risk-free.
        </LegalP>
      </LegalSection>

      <LegalSection title="Prescriptions and follow-up">
        <LegalP>
          If your practitioner determines that telehealth is appropriate, they may issue prescriptions,
          referrals, or care plans electronically where permitted. You are responsible for collecting
          or arranging fulfilment of prescriptions and completing ordered tests. Your practitioner may
          require a follow-up telehealth or in-person review before continuing treatment.
        </LegalP>
      </LegalSection>

      <LegalSection title="Withdrawal of consent">
        <LegalP>
          You may withdraw consent to telehealth at any time by contacting{" "}
          <a href={`mailto:${SANATIVE_LEGAL.supportEmail}`} className="underline text-[#5c7a52]">
            {SANATIVE_LEGAL.supportEmail}
          </a>{" "}
          or informing your practitioner. Withdrawal may affect our ability to provide certain Services.
          Your practitioner may recommend alternative care arrangements, including in-person
          consultation with your GP or another provider.
        </LegalP>
        <LegalP>
          Withdrawing telehealth consent does not automatically delete clinical records already created,
          which may be retained as required by law.
        </LegalP>
      </LegalSection>

      <LegalSection title="Acknowledgement">
        <LegalP>
          By continuing to use Sanative telehealth Services, you confirm that you have read this
          Telehealth Consent, understand its benefits and limitations, and agree to receive care by
          telehealth where your practitioner considers it clinically appropriate.
        </LegalP>
      </LegalSection>
    </>
  );
}
