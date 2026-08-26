import Link from "next/link";
import {
  LegalSection,
  LegalP,
  LegalUl,
  LegalOl,
  LegalH3,
} from "@/components/legal/LegalPageLayout";
import { LEGAL_LINKS, SANATIVE_LEGAL } from "@/lib/legal/constants";

export function TermsContent() {
  return (
    <>
      <LegalSection title="Important notices: please read">
        <LegalUl>
          <li>
            <strong>Not for emergencies.</strong> Sanative is not an emergency service. If you think
            you have a medical emergency or mental health crisis, call <strong>000</strong>{" "}
            immediately or go to your nearest emergency department. For crisis support, contact
            Lifeline on <strong>13 11 14</strong>.
          </li>
          <li>
            <strong>Doctor-led care.</strong> Sanative coordinates access to AHPRA-registered
            practitioners. Sanative does not replace your ongoing relationship with your regular GP
            where in-person care is required.
          </li>
          <li>
            <strong>No guaranteed outcomes.</strong> Clinical suitability and care options are
            determined by your doctor after assessment. No specific treatment, prescription,
            medication, or health outcome is guaranteed.
          </li>
          <li>
            <strong>Australian Consumer Law.</strong> Nothing in these Terms excludes, restricts, or
            modifies any consumer guarantee, warranty, or remedy that cannot lawfully be excluded under
            the Australian Consumer Law or other applicable legislation.
          </li>
        </LegalUl>
      </LegalSection>

      <LegalSection title="Introduction">
        <LegalP>
          These Terms &amp; Conditions (&quot;Terms&quot;) govern your access to and use of the
          Sanative website, patient portal, health assessments, booking tools, and doctor-led health
          programs (collectively, the &quot;Services&quot;) provided by {SANATIVE_LEGAL.entityName}{" "}
          (&quot;Sanative&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
        </LegalP>
        <LegalP>
          By accessing or using the Services, you acknowledge that you have read, understood, and
          agree to be legally bound by these Terms and our{" "}
          <Link href={LEGAL_LINKS.privacy} className="underline text-[#5c7a52]">
            Privacy Policy
          </Link>
          , which is incorporated by reference. If you do not agree, you must not use the Services.
        </LegalP>
        <LegalP>
          We may update these Terms from time to time. Changes take effect when posted on the
          Services unless applicable law requires additional notice. Your continued use after changes
          are posted constitutes acceptance. The Terms that apply when you request or receive a
          Service are those in effect at that time.
        </LegalP>
        <LegalP>These Terms contain sections covering:</LegalP>
        <LegalUl>
          <li>Eligibility, accounts, and the Services we provide</li>
          <li>Your relationship with practitioners and telehealth</li>
          <li>Payments, subscriptions, refunds, and communications</li>
          <li>Acceptable use, intellectual property, and liability</li>
          <li>Governing law, complaints, and contact details</li>
        </LegalUl>
      </LegalSection>

      <LegalSection title="Eligibility">
        <LegalP>To use the clinical Services, you represent and warrant that:</LegalP>
        <LegalOl>
          <li>You are at least 18 years of age</li>
          <li>You are located in Australia when accessing clinical Services</li>
          <li>You are capable of entering a legally binding agreement</li>
          <li>You provide accurate, complete, and up-to-date information</li>
          <li>You agree to these Terms and our Privacy Policy</li>
          <li>You use the Services only for personal, non-commercial purposes unless agreed otherwise</li>
        </LegalOl>
        <LegalP>
          Meeting eligibility requirements does not guarantee acceptance into any program or access to
          any treatment. Clinical suitability is assessed by a practitioner in their professional
          judgment. We reserve the right to refuse or discontinue Services where information is
          inaccurate, incomplete, or where we reasonably believe the Services are not appropriate.
        </LegalP>
      </LegalSection>

      <LegalSection title="Accounts and security">
        <LegalP>
          Certain parts of the Services require you to create an account. You may only create one
          account per person unless we expressly permit otherwise. You are responsible for:
        </LegalP>
        <LegalUl>
          <li>Maintaining the confidentiality of your login credentials</li>
          <li>All activity that occurs under your account</li>
          <li>Notifying us immediately if you suspect unauthorised access</li>
          <li>Keeping your contact and health information accurate and up to date</li>
        </LegalUl>
        <LegalP>
          We may suspend or terminate your account if we reasonably suspect a breach of these Terms,
          fraudulent activity, or a risk to patient safety or platform security.
        </LegalP>
      </LegalSection>

      <LegalSection title="Services overview">
        <LegalP>
          Sanative provides a technology platform and care coordination services for doctor-led
          metabolic and general health programs in Australia. Depending on your program, the Services
          may include:
        </LegalP>
        <LegalUl>
          <li>Online health assessments and questionnaires</li>
          <li>Telehealth consultations with AHPRA-registered practitioners</li>
          <li>Care partner support and patient portal access</li>
          <li>Progress tracking, biomarker monitoring, and program resources where clinically appropriate</li>
          <li>Booking, billing, and subscription management</li>
          <li>Coordination with pathology, pharmacy, or other third-party providers where required</li>
        </LegalUl>
        <LegalP>
          Program fees cover clinical assessment, onboarding, and ongoing program access as described
          at checkout. Program fees are separate from costs associated with medicines, pathology,
          supplements, or third-party services unless expressly stated.
        </LegalP>
        <LegalP>
          Sanative is based in Australia. We make no representation that the Services are appropriate
          or available outside Australia. If you access the Services from outside Australia, you do so
          at your own risk and are responsible for compliance with local laws.
        </LegalP>
      </LegalSection>

      <LegalSection title="Relationship with health practitioners">
        <LegalH3>Sanative is not your doctor</LegalH3>
        <LegalP>
          Sanative provides a platform for you to access AHPRA-registered practitioners and related
          support services. Sanative does not itself provide medical services. When you consult with a
          practitioner through the Services, you may enter into a practitioner–patient relationship
          with that practitioner. Sanative is not a party to that relationship.
        </LegalP>
        <LegalP>
          Practitioners operate with clinical independence and are solely responsible for the health
          care services they provide, including compliance with professional standards, record keeping,
          and applicable privacy laws. They have the same obligations to you as if they were consulting
          you in person, subject to the limitations of telehealth.
        </LegalP>

        <LegalH3>Clinical decisions</LegalH3>
        <LegalP>
          Completing an assessment or paying a program fee does not guarantee clinical suitability,
          approval for any program, or access to any specific treatment. Your practitioner determines,
          in their professional judgment:
        </LegalP>
        <LegalUl>
          <li>Whether telehealth is appropriate for your circumstances</li>
          <li>Whether to provide the services or treatments you request</li>
          <li>What care plan, prescriptions, referrals, or follow-up is clinically appropriate</li>
        </LegalUl>
        <LegalP>
          A practitioner may refuse to prescribe, refer, or continue treatment where they consider it
          clinically inappropriate or unsafe. We do not guarantee that you will consult with a
          particular practitioner.
        </LegalP>

        <LegalH3>Records and communication with your GP</LegalH3>
        <LegalP>
          Practitioners may create clinical records as part of your care. Sanative may hold copies of
          assessment and care coordination records in accordance with our Privacy Policy. You should
          inform your regular GP of treatments or medicines prescribed through Sanative. If you would
          like us or your practitioner to share information with your GP, please request this during
          your consultation.
        </LegalP>
      </LegalSection>

      <LegalSection title="Telehealth">
        <LegalP>
          Telehealth involves the delivery of clinical services using phone, video, or secure messaging
          when you and your practitioner are not in the same location. By using telehealth Services,
          you agree to our{" "}
          <Link href={LEGAL_LINKS.telehealthConsent} className="underline text-[#5c7a52]">
            Telehealth Consent
          </Link>
          , which is incorporated by reference.
        </LegalP>
        <LegalP>
          Telehealth may not be appropriate for all conditions or examinations. Your practitioner may
          recommend in-person assessment, emergency care, or referral to another provider. Electronic
          communications are not guaranteed to be completely secure or uninterrupted.
        </LegalP>
      </LegalSection>

      <LegalSection title="Pathology, pharmacy, and third-party services">
        <LegalH3>Sanative Membership biomarkers and blood collection</LegalH3>
        <LegalP>
          Sanative Membership biomarker testing requires a blood test (and any other samples your
          doctor orders) at a pathology collection centre or other suitable collection location. Blood
          collection is performed by third-party pathology providers, not by Sanative.
        </LegalP>

        <LegalH3>Pathology and biomarker testing fees</LegalH3>
        <LegalP>
          Some Sanative programs require blood tests or other pathology testing as part of your
          clinical assessment and ongoing care.
        </LegalP>
        <LegalP>
          If you are eligible for Medicare, some pathology tests may be eligible for a Medicare
          benefit where they are clinically indicated by your treating doctor and meet the relevant
          Medicare Benefits Schedule requirements. Medicare eligibility and coverage cannot be
          guaranteed and may vary depending on the tests ordered and the pathology provider used.
        </LegalP>
        <LegalP>
          If you are not eligible for Medicare, or where a test is not eligible for a Medicare
          benefit, including certain specialised or additional biomarker tests, pathology laboratory
          fees may apply. These fees are charged separately by the pathology provider and are{" "}
          <strong>not included</strong> in your Sanative membership or program fees unless expressly
          stated otherwise.
        </LegalP>
        <LegalP>
          Where practicable, you will be informed if additional pathology fees are expected before
          proceeding with testing.
        </LegalP>

        <LegalH3>Pathology network and availability</LegalH3>
        <LegalP>
          Sanative may refer members to pathology providers within its network based on the
          member&apos;s location and the testing required. Where possible, we will identify a
          suitable pathology collection centre reasonably close to you.
        </LegalP>
        <LegalP>
          While Sanative aims to provide access to pathology services across Australia, we cannot
          guarantee that a participating pathology provider or collection centre will be available in
          every location nationally. Availability may vary depending on geographic location, the type
          of testing required, pathology provider coverage and local operating arrangements.
        </LegalP>
        <LegalP>
          In some regional, rural or remote areas, members may be required to travel to an alternative
          collection centre or use another suitable pathology provider.
        </LegalP>

        <LegalH3>Pharmacy and other third parties</LegalH3>
        <LegalP>
          If a prescription is issued, you may fulfil it through a pharmacy partner or a pharmacy of
          your choice, subject to availability and the pharmacy&apos;s clinical discretion. Sanative
          is not a pharmacy. We do not guarantee availability, pricing, or suitability of any
          medicine. You must follow directions for use and read all product information provided.
        </LegalP>
        <LegalP>
          Your use of third-party pathology, pharmacy, or delivery services may be subject to those
          providers&apos; own terms and privacy policies.
        </LegalP>
      </LegalSection>

      <LegalSection title="Financial responsibility">
        <LegalP>
          Unless expressly stated otherwise, Sanative programs are provided on a fee-for-service
          basis. Sanative and affiliated practitioners generally do not bulk bill or accept Medicare
          rebates for Services provided through the platform. You are responsible for fees displayed at
          checkout and any separate costs for medicines, pathology, or third-party services.
        </LegalP>
        <LegalP>
          If you have private health insurance, you are responsible for determining eligibility and
          submitting claims to your insurer. We may provide invoices or receipts to assist where
          available.
        </LegalP>
      </LegalSection>

      <LegalSection title="Payments and subscriptions">
        <LegalH3>Prices and GST</LegalH3>
        <LegalP>
          All prices quoted for Sanative membership and program fees are in Australian dollars (AUD)
          and <strong>include GST</strong>, unless expressly stated otherwise at checkout.
        </LegalP>

        <LegalH3>Sanative Membership, $1/day billing</LegalH3>
        <LegalP>
          Where Sanative Membership is marketed as <strong>$1/day</strong>, that figure is an
          illustrative daily equivalent of the annual membership fee. Membership is charged as{" "}
          <strong>$365 billed annually</strong> (including GST), unless a different price is shown at
          checkout.
        </LegalP>
        <LegalP>
          By purchasing Sanative Membership, you authorise Sanative and our payment processor to charge{" "}
          <strong>$365 billed annually</strong> (or the then-current annual membership price displayed
          at checkout), and to process renewals in accordance with our{" "}
          <Link href={LEGAL_LINKS.subscriptionTerms} className="underline text-[#5c7a52]">
            Subscription Terms
          </Link>
          .
        </LegalP>

        <LegalH3>What is included in the $365 Sanative Membership</LegalH3>
        <LegalP>
          Subject to clinical appropriateness and the details shown at checkout, the $365 annual
          Sanative Membership includes:
        </LegalP>
        <LegalUl>
          <li>
            Access to your Sanative Essential biomarker panel pathway (analysis of the biomarkers in
            your selected panel, as described at checkout)
          </li>
          <li>
            <strong>Doctor consultation included:</strong> an initial telehealth consultation with an
            AHPRA-registered Sanative doctor for assessment, pathology referral where clinically
            indicated, and review of your membership pathway
          </li>
          <li>
            <strong>Follow-up doctor consultations included:</strong> follow-up telehealth
            consultations with a Sanative doctor where clinically indicated to review your membership
            biomarker results, discuss findings, and support your personalised health action plan,
            subject to reasonable clinical use and any limits stated at checkout or in your care plan.
            Follow-up doctor consultations outside those included above are{" "}
            <strong>not included</strong> in the $365 membership fee unless they form part of another
            Sanative care program you have purchased or that is otherwise included with your
            membership (for example, an eligible care program&apos;s included period)
          </li>
          <li>
            <strong>Biological-age reporting included:</strong> Biological Clock / biological-age
            reporting where available for your panel and results
          </li>
          <li>
            <strong>App / portal access included:</strong> access to the Sanative patient portal (and
            any related member app features Sanative makes available) to view results, plans and
            program information
          </li>
          <li>
            <strong>Ongoing biomarker tracking included:</strong> ongoing tracking in the Sanative
            portal of the biomarker results already obtained under your membership panel during the
            12-month membership period. Extra or repeat biomarker tracking within that period that
            requires new blood tests and additional doctor consultations is not included (see
            exclusions below)
          </li>
          <li>
            Clinician review of results with flagging of issues where clinically appropriate
          </li>
          <li>Personalised health action plan based on your assessment and results</li>
          <li>Organ Care dashboards in your portal where available for your membership</li>
          <li>
            First 30 days of one eligible Sanative care program, subject to clinical suitability, as
            described below
          </li>
        </LegalUl>
        <LegalH3>Included care program period</LegalH3>
        <LegalP>
          The Sanative Membership includes the first 30 days of one eligible Sanative care program,
          subject to clinical suitability. You must nominate your chosen program before or during
          your initial doctor consultation so that your doctor can undertake the relevant clinical
          assessment and review the medical history required for that program. The included 30-day
          period is not available for a program selected after the initial consultation. Ongoing
          program fees apply after the included period if you elect to continue.
        </LegalP>
        <LegalP>
          <strong>Not included in the $365 membership fee</strong> (unless expressly stated otherwise
          at checkout): follow-up doctor consultations outside those included above for membership
          biomarker review and care planning (unless they form part of another Sanative care program
          you have purchased or that is otherwise included with your membership); extra or ongoing
          biomarker tracking during the 12-month membership period that requires new blood tests and
          further doctor consultations (including any related pathology laboratory / collection fees
          and consultation fees); pathology laboratory / collection fees charged by third-party
          pathology providers for your membership panel or any additional testing; prescription
          medicines, supplements or pharmacy dispensing fees; courier or delivery charges; and
          care-program fees after any included introductory period.
        </LegalP>

        <LegalH3>Authorisation and other terms</LegalH3>
        <LegalP>
          Fees are displayed at checkout. By submitting payment details, you authorise Sanative and our
          payment processor to charge the amounts shown, including recurring subscription fees where
          applicable.
        </LegalP>
        <LegalP>
          Subscription billing, cancellation, and plan changes are governed by our{" "}
          <Link href={LEGAL_LINKS.subscriptionTerms} className="underline text-[#5c7a52]">
            Subscription Terms
          </Link>
          . Refunds are governed by our{" "}
          <Link href={LEGAL_LINKS.refundPolicy} className="underline text-[#5c7a52]">
            Refund Policy
          </Link>
          .
        </LegalP>
        <LegalP>
          You are responsible for keeping payment information accurate. If payment fails, we may retry
          the charge and contact you to update details. Continued failure may suspend access until
          resolved.
        </LegalP>
        <LegalP>
          Except as stated in our Refund Policy or required by the Australian Consumer Law, fees are
          generally non-refundable once Services for a billing period have commenced.
        </LegalP>
      </LegalSection>

      <LegalSection title="Communications">
        <LegalP>
          By using the Services and providing your contact details, you consent to service-related
          communications by email and SMS about your assessment, booking, program, billing, clinical
          care, and account. These operational messages are necessary to provide the Services.
        </LegalP>
        <LegalP>
          Marketing messages are sent only where permitted by law. You may opt out of marketing by
          using unsubscribe links or contacting us. Reply STOP to opt out of marketing SMS where
          supported.
        </LegalP>
        <LegalP>
          Email and SMS are not encrypted end-to-end. If you choose to send sensitive health
          information by SMS or email, you do so at your own risk. For clinical concerns, use the
          patient portal or contact us directly.
        </LegalP>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <LegalP>You must not misuse the Services. Without limitation, you must not:</LegalP>
        <LegalUl>
          <li>Provide false, misleading, or incomplete health or identity information</li>
          <li>Impersonate another person or access another user&apos;s account</li>
          <li>Use the Services for commercial purposes without our written consent</li>
          <li>Attempt to reverse engineer, scrape, or interfere with the platform or its security</li>
          <li>Upload unlawful, harmful, abusive, or infringing content</li>
          <li>Harass practitioners, staff, or other users</li>
          <li>Use automated tools to access the Services without permission</li>
          <li>Circumvent clinical safeguards or obtain prescriptions fraudulently</li>
          <li>Use the Services in breach of any applicable law or regulation</li>
        </LegalUl>
        <LegalP>
          We may investigate suspected breaches and cooperate with law enforcement where required.
          Providing incorrect information to obtain prescription medicines may constitute a criminal
          offence.
        </LegalP>
      </LegalSection>

      <LegalSection title="User content and feedback">
        <LegalP>
          Information you submit through assessments, messages, surveys, or support channels may be
          used to provide the Services, improve our platform, and comply with legal obligations, as
          described in our Privacy Policy. Unless required by law or agreed otherwise, feedback you
          provide may be used by Sanative without obligation to compensate you.
        </LegalP>
        <LegalP>
          If you post content in any community or public area of the Services (where available), you
          understand it may be visible to others. Do not post information you wish to keep private.
        </LegalP>
      </LegalSection>

      <LegalSection title="Intellectual property">
        <LegalP>
          All content, software, design, trademarks, and materials on the Services (&quot;Sanative
          Content&quot;) are owned by or licensed to Sanative. You receive a limited, personal,
          non-exclusive, revocable licence to access and use the Services for their intended purpose.
        </LegalP>
        <LegalP>
          You must not copy, modify, distribute, sell, or create derivative works from Sanative
          Content except as permitted by these Terms or with our written consent.
        </LegalP>
      </LegalSection>

      <LegalSection title="Third-party links">
        <LegalP>
          The Services may contain links to third-party websites or services. We do not control and
          are not responsible for third-party content, products, or practices. Your use of third-party
          services is at your own risk and subject to their terms.
        </LegalP>
      </LegalSection>

      <LegalSection title="Disclaimer of warranties">
        <LegalP>
          To the maximum extent permitted by law, the Services are provided on an &quot;as is&quot; and
          &quot;as available&quot; basis. General health information on our website is for informational
          purposes only and is not medical advice. See our{" "}
          <Link href={LEGAL_LINKS.medicalDisclaimer} className="underline text-[#5c7a52]">
            Medical Disclaimer
          </Link>
          .
        </LegalP>
        <LegalP>
          We do not warrant that the Services will be uninterrupted, error-free, or free from viruses
          or security vulnerabilities. You use the Services at your own risk.
        </LegalP>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <LegalP>
          To the extent permitted by law, Sanative and its directors, officers, employees, contractors,
          and affiliates are not liable for any indirect, incidental, special, consequential, or
          punitive loss arising from your use of the Services, including loss of data, profits, or
          goodwill.
        </LegalP>
        <LegalP>
          To the extent permitted by law, our total liability for any claim relating to the Services
          is limited to the greater of (a) AUD $100, or (b) the amount you paid to Sanative for the
          relevant program in the 12 months before the claim, except where liability cannot be limited
          by law (including under the Australian Consumer Law).
        </LegalP>
        <LegalP>
          We are not liable for the acts or omissions of independent practitioners, pharmacies,
          laboratories, or other third-party providers, except where liability cannot be excluded by
          law.
        </LegalP>
      </LegalSection>

      <LegalSection title="Indemnity">
        <LegalP>
          You agree to indemnify and hold harmless Sanative and its related entities, officers,
          employees, and contractors from any claim, loss, or expense (including reasonable legal
          fees) arising from your breach of these Terms, misuse of the Services, provision of
          inaccurate information, or violation of any law or third-party rights.
        </LegalP>
      </LegalSection>

      <LegalSection title="Termination">
        <LegalP>
          You may stop using the Services at any time. You may cancel subscriptions in accordance with
          our Subscription Terms. We may suspend or terminate your access immediately if you breach
          these Terms, pose a safety risk, or where required by law.
        </LegalP>
        <LegalP>
          Provisions that by their nature should survive termination (including disclaimers, limitation
          of liability, indemnity, and governing law) continue to apply.
        </LegalP>
        <LegalP>
          Termination of platform access does not necessarily terminate your practitioner&apos;s
          obligations regarding clinical records or continuing care where required by professional or
          legal standards.
        </LegalP>
      </LegalSection>

      <LegalSection title="Privacy">
        <LegalP>
          Your personal and health information is handled in accordance with our{" "}
          <Link href={LEGAL_LINKS.privacy} className="underline text-[#5c7a52]">
            Privacy Policy
          </Link>
          .
        </LegalP>
      </LegalSection>

      <LegalSection title="Complaints">
        <LegalP>
          If you have a concern or complaint about the Services, billing, or platform access, contact
          us at{" "}
          <a href={`mailto:${SANATIVE_LEGAL.supportEmail}`} className="underline text-[#5c7a52]">
            {SANATIVE_LEGAL.supportEmail}
          </a>
          . We will endeavour to respond promptly.
        </LegalP>
        <LegalP>
          Complaints about clinical care should be directed to the treating practitioner and relevant
          professional or regulatory bodies where appropriate. We can assist with routing clinical
          complaints where possible.
        </LegalP>
      </LegalSection>

      <LegalSection title="Governing law">
        <LegalP>
          These Terms are governed by the laws of {SANATIVE_LEGAL.governingLaw}. You submit to the
          non-exclusive jurisdiction of the courts of New South Wales, Australia and any courts that
          may hear appeals from those courts.
        </LegalP>
        <LegalP>
          If a dispute arises, the parties agree to attempt to resolve it in good faith through
          direct communication before commencing formal proceedings, where reasonable.
        </LegalP>
      </LegalSection>

      <LegalSection title="General">
        <LegalP>
          If any provision of these Terms is invalid or unenforceable, the remaining provisions
          continue in full force. Our failure to enforce a provision is not a waiver. You may not
          assign your rights under these Terms without our consent. We may assign our rights in
          connection with a corporate transaction.
        </LegalP>
        <LegalP>
          These Terms, together with the Privacy Policy and documents incorporated by reference,
          constitute the entire agreement between you and Sanative regarding the Services.
        </LegalP>
      </LegalSection>

      <LegalSection title="Contact">
        <LegalP>
          {SANATIVE_LEGAL.entityName}
          <br />
          {SANATIVE_LEGAL.address}
          <br />
          <a href={`mailto:${SANATIVE_LEGAL.supportEmail}`} className="underline text-[#5c7a52]">
            {SANATIVE_LEGAL.supportEmail}
          </a>
        </LegalP>
      </LegalSection>
    </>
  );
}
