import Link from "next/link";
import {
  LegalSection,
  LegalP,
  LegalUl,
  LegalH3,
} from "@/components/legal/LegalPageLayout";
import { LEGAL_LINKS } from "@/lib/legal/constants";

export function MedicalDisclaimerContent() {
  return (
    <>
      <LegalSection title="Purpose of this disclaimer">
        <LegalP>
          This Medical Disclaimer applies to content on the Sanative website, health assessments,
          marketing materials, patient portal, and communications from Sanative (other than personal
          clinical advice from your treating practitioner). Please read it together with our{" "}
          <Link href={LEGAL_LINKS.terms} className="underline text-[#5c7a52]">
            Terms &amp; Conditions
          </Link>{" "}
          and{" "}
          <Link href={LEGAL_LINKS.telehealthConsent} className="underline text-[#5c7a52]">
            Telehealth Consent
          </Link>
          .
        </LegalP>
      </LegalSection>

      <LegalSection title="General information only: not medical advice">
        <LegalP>
          Content provided through Sanative is general health and program information intended to help
          you understand our services and complete onboarding. It is <strong>not</strong> a substitute
          for professional medical advice, diagnosis, or treatment tailored to your individual
          circumstances.
        </LegalP>
        <LegalP>
          Except for advice given to you personally by an AHPRA-registered practitioner during a
          consultation, nothing on the Sanative platform should be relied on as medical advice. Always
          seek the advice of a qualified health professional with questions about a medical condition,
          symptoms, or treatment options.
        </LegalP>
        <LegalP>
          Never disregard professional medical advice or delay seeking it because of something you have
          read on our website or in an assessment result screen.
        </LegalP>
      </LegalSection>

      <LegalSection title="Not for emergencies or crisis care">
        <LegalP>
          Sanative is <strong>not an emergency service</strong> and is not suitable for urgent or
          life-threatening conditions.
        </LegalP>
        <LegalUl>
          <li>
            For medical emergencies, call <strong>000</strong> immediately or go to your nearest
            emergency department
          </li>
          <li>
            For mental health crisis support, call Lifeline on <strong>13 11 14</strong> or emergency
            services on <strong>000</strong>
          </li>
          <li>
            For poison information, call the Poisons Information Centre on <strong>13 11 26</strong>
          </li>
        </LegalUl>
        <LegalP>
          Do not use Sanative if you need immediate in-person examination, emergency treatment, or
          crisis intervention.
        </LegalP>
      </LegalSection>

      <LegalSection title="Doctor–patient relationship">
        <LegalP>
          Browsing the website, reading content, or completing an assessment does not create a
          doctor–patient relationship with Sanative or any practitioner. A clinical relationship is
          established when an AHPRA-registered practitioner accepts you as a patient and provides care
          in accordance with professional standards.
        </LegalP>
        <LegalP>
          Sanative coordinates access to practitioners but does not itself practise medicine. Your
          treating practitioner is responsible for clinical decisions made in your care.
        </LegalP>
      </LegalSection>

      <LegalSection title="Assessments and eligibility tools">
        <LegalP>
          Online assessments, BMI calculators, biomarker summaries, progress graphs, and similar tools
          are designed to support onboarding and clinical review. They:
        </LegalP>
        <LegalUl>
          <li>Do not constitute a diagnosis</li>
          <li>Do not guarantee eligibility for any program or treatment</li>
          <li>May use illustrative projections that are starting points for discussion, not promises
            of results</li>
          <li>Must be interpreted by a qualified practitioner in the context of your full health
            profile</li>
        </LegalUl>
        <LegalP>
          Completing an assessment or receiving a preliminary result does not mean you will be
          prescribed any medicine or accepted into a program.
        </LegalP>
      </LegalSection>

      <LegalSection title="No guaranteed treatment or outcomes">
        <LegalP>
          Sanative does not guarantee that any user will receive a prescription, specific medicine,
          supplement, pathology order, or treatment plan. Treatment decisions are made by your doctor
          after clinical assessment, taking into account your medical history, examination (where
          performed), test results, and professional guidelines.
        </LegalP>
        <LegalP>
          Individual health outcomes vary. Weight loss, metabolic improvement, symptom relief, and
          other results depend on many factors including adherence to care plans, underlying
          conditions, lifestyle, and individual response to treatment.
        </LegalP>
      </LegalSection>

      <LegalSection title="Medicines and therapeutic goods">
        <LegalH3>Prescription medicines</LegalH3>
        <LegalP>
          Where medicines are discussed or prescribed, they are prescription-only when clinically
          appropriate and subject to practitioner judgment, TGA approvals, and availability. Always
          read the Consumer Medicine Information (CMI) and follow your practitioner&apos;s directions.
        </LegalP>
        <LegalH3>Off-label and compounded medicines</LegalH3>
        <LegalP>
          In some circumstances a practitioner may prescribe a medicine for an indication not listed on
          the Australian Register of Therapeutic Goods (&quot;off-label use&quot;), or a compounded
          medicine prepared by a pharmacy. You will be informed where this applies. Compounded medicines
          have not been evaluated by the TGA for safety, quality, and efficacy in the same way as
          registered products.
        </LegalP>
        <LegalH3>Side effects</LegalH3>
        <LegalP>
          All medicines carry risks. If you experience side effects or your condition worsens, contact
          your practitioner, your GP, or seek urgent care as appropriate. Do not stop prescribed
          medicines without medical advice unless you are experiencing a serious reaction requiring
          emergency care.
        </LegalP>
      </LegalSection>

      <LegalSection title="Biomarkers and pathology">
        <LegalP>
          Biomarker and pathology results are interpreted in clinical context. Results outside reference
          ranges do not always indicate disease, and normal results do not always exclude a condition.
          Your practitioner will explain results and recommend follow-up where needed. You should share
          significant results with your regular GP.
        </LegalP>
      </LegalSection>

      <LegalSection title="Diet, exercise, and lifestyle content">
        <LegalP>
          Program resources may include information about nutrition, exercise, sleep, and lifestyle.
          When changing diet or exercise, consider your personal health status and consult your
          practitioner or GP, particularly if you have underlying conditions, are pregnant, or take
          medications that may be affected by dietary changes.
        </LegalP>
      </LegalSection>

      <LegalSection title="Third-party content and links">
        <LegalP>
          Sanative may reference or link to third-party resources, studies, or products. We do not
          endorse all third-party content and are not responsible for its accuracy or suitability. External
          links are provided for convenience only.
        </LegalP>
      </LegalSection>

      <LegalSection title="Australian Consumer Law">
        <LegalP>
          Nothing in this Medical Disclaimer excludes, restricts, or modifies any consumer guarantee or
          remedy that cannot be excluded under the Australian Consumer Law.
        </LegalP>
      </LegalSection>
    </>
  );
}
