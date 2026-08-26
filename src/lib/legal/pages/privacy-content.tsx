import Link from "next/link";
import {
  LegalSection,
  LegalP,
  LegalUl,
  LegalOl,
  LegalH3,
} from "@/components/legal/LegalPageLayout";
import { LEGAL_LINKS, LEGAL_SUBPROCESSORS, SANATIVE_LEGAL } from "@/lib/legal/constants";

export function PrivacyContent() {
  return (
    <>
      <LegalSection title="Introduction">
        <LegalP>
          This Privacy Policy (&quot;Privacy Policy&quot;) describes how {SANATIVE_LEGAL.entityName}{" "}
          (&quot;Sanative&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses,
          discloses, stores, and protects personal information when you visit our website at{" "}
          {SANATIVE_LEGAL.website}, use our patient portal, complete health assessments, book
          consultations, purchase programs, or otherwise interact with our services (collectively,
          the &quot;Services&quot;).
        </LegalP>
        <LegalP>
          Sanative provides doctor-led metabolic and general health programs in Australia. Because
          our Services involve health assessments, telehealth, and clinical care coordination, we
          routinely collect <strong>sensitive information</strong>, including health information, as
          defined under the <em>Privacy Act 1988</em> (Cth) and the Australian Privacy Principles
          (APPs).
        </LegalP>
        <LegalP>
          <strong>
            Please read this Privacy Policy carefully to understand how we handle your information.
          </strong>{" "}
          If you do not agree with this Privacy Policy, please do not use the Services. This Privacy
          Policy is incorporated into our{" "}
          <Link href={LEGAL_LINKS.terms} className="underline text-[#5c7a52]">
            Terms &amp; Conditions
          </Link>
          .
        </LegalP>
        <LegalP>This Privacy Policy contains the following sections:</LegalP>
        <LegalUl>
          <li>Who we are and scope of this policy</li>
          <li>The information we collect and how we collect it</li>
          <li>Why we use and disclose your information</li>
          <li>Direct marketing, cookies, and online analytics</li>
          <li>Overseas disclosure and subprocessors</li>
          <li>Health records, security, and retention</li>
          <li>Your rights, complaints, and notifiable data breaches</li>
          <li>Children and changes to this policy</li>
        </LegalUl>
      </LegalSection>

      <LegalSection title="Who we are">
        <LegalP>
          {SANATIVE_LEGAL.entityName} operates the Sanative platform and coordinates access to
          AHPRA-registered practitioners and clinical support services. We are responsible for the
          personal information we collect through the Services, except where a health practitioner
          acts as a separate controller of clinical records they create in the course of providing
          care to you.
        </LegalP>
        <LegalP>
          Contact: {SANATIVE_LEGAL.address} ·{" "}
          <a href={`mailto:${SANATIVE_LEGAL.privacyEmail}`} className="underline text-[#5c7a52]">
            {SANATIVE_LEGAL.privacyEmail}
          </a>
        </LegalP>
      </LegalSection>

      <LegalSection title="Scope: who this policy applies to">
        <LegalP>This Privacy Policy applies to:</LegalP>
        <LegalUl>
          <li>Visitors to our website and marketing pages</li>
          <li>Users who start but do not complete health assessments or onboarding</li>
          <li>Registered patients and program members</li>
          <li>Individuals who contact us by email, phone, SMS, or through support channels</li>
          <li>Individuals whose information is provided to us by a practitioner or partner in
            connection with your care (where permitted)</li>
        </LegalUl>
        <LegalP>
          Some third parties you interact with through the Services, such as independent
          practitioners, pathology providers, or pharmacies, may have their own privacy policies
          and record-keeping obligations. We encourage you to read their policies where relevant.
        </LegalP>
      </LegalSection>

      <LegalSection title="Information we collect">
        <LegalH3>Information you provide to us</LegalH3>
        <LegalP>
          We collect information you provide directly when you use the Services. The specific types
          of information depend on the Services you use and the information you choose to provide.
          This may include:
        </LegalP>
        <LegalUl>
          <li>
            <strong>Identity and contact details:</strong> name, email address, phone number,
            postal address, date of birth, gender, and emergency contact details where provided
          </li>
          <li>
            <strong>Account information:</strong> username, password, account preferences, and
            portal activity
          </li>
          <li>
            <strong>Health and clinical information:</strong> symptoms, medical history, lifestyle
            information, height, weight, goals, medications, allergies, conditions, pregnancy
            status, mental health information where relevant, biomarker and pathology results,
            consultation notes, treatment plans, and photos or documents you upload for clinical
            review
          </li>
          <li>
            <strong>Booking and program information:</strong> appointment times, selected plans,
            program progress, care partner communications, and internal clinical flags
          </li>
          <li>
            <strong>Billing information:</strong> payment method details processed by our payment
            provider (we do not store full card numbers on our servers), billing address, transaction
            history, subscription status, refunds, and invoices
          </li>
          <li>
            <strong>Communications:</strong> emails, SMS messages, portal messages, support tickets,
            feedback, surveys, and recordings or transcripts of calls where you are notified
          </li>
          <li>
            <strong>Marketing preferences:</strong> whether you have opted in or out of promotional
            communications
          </li>
          <li>
            <strong>Other information:</strong> any other information you choose to provide in
            connection with your use of the Services
          </li>
        </LegalUl>
        <LegalP>
          We only collect health information about you with your consent (including when you provide
          it to us as part of an assessment or by continuing through our onboarding flow), or
          otherwise in accordance with the Privacy Act and applicable State or Territory health
          privacy laws.
        </LegalP>

        <LegalH3>Information collected automatically</LegalH3>
        <LegalP>
          When you use our website or portal, we and our service providers may automatically collect
          certain technical and usage information, including:
        </LegalP>
        <LegalUl>
          <li>IP address, browser type and language, operating system, and device identifiers</li>
          <li>Pages viewed, links clicked, referral URLs, session duration, and error logs</li>
          <li>Approximate location derived from IP address (e.g. city or state)</li>
          <li>Cookie identifiers and similar online tracking technologies</li>
        </LegalUl>
        <LegalP>
          We use web server logs, cookies, tags, pixels, and similar technologies to operate the
          Services, remember preferences, understand usage, improve performance, and measure
          marketing effectiveness. You can manage cookies through your browser settings. Blocking
          cookies may affect certain features of the Services.
        </LegalP>

        <LegalH3>Information from other sources</LegalH3>
        <LegalP>We may receive information about you from:</LegalP>
        <LegalUl>
          <li>AHPRA-registered practitioners and clinicians involved in your care</li>
          <li>Pathology and diagnostic laboratories where tests are ordered</li>
          <li>Pharmacies or dispensing partners where prescriptions are fulfilled</li>
          <li>Payment processors, email and SMS providers, and other operational partners</li>
          <li>Publicly available sources where relevant and permitted by law</li>
        </LegalUl>
        <LegalP>
          If we collect personal information about you from a third party, we will take reasonable
          steps to ensure you are aware of the collection and how we will use the information,
          unless an exception applies under the Privacy Act.
        </LegalP>
      </LegalSection>

      <LegalSection title="Why we collect, use, and disclose information">
        <LegalP>
          We collect, use, and disclose personal information for the purposes described in this
          Privacy Policy, including:
        </LegalP>
        <LegalH3>Provide and manage the Services</LegalH3>
        <LegalUl>
          <li>Create and administer your account and patient portal</li>
          <li>Run health assessments, eligibility checks, and onboarding</li>
          <li>Facilitate telehealth consultations and clinical care coordination</li>
          <li>Provide care partner support, progress tracking, and program communications</li>
          <li>Process orders, subscriptions, payments, refunds, and billing enquiries</li>
          <li>Arrange pathology, biomarker testing, or pharmacy services where clinically appropriate</li>
          <li>Verify your identity where required for clinical or regulatory purposes</li>
        </LegalUl>

        <LegalH3>Improve, secure, and operate our platform</LegalH3>
        <LegalUl>
          <li>Monitor service quality, troubleshoot errors, and maintain platform security</li>
          <li>Conduct internal research and analytics to improve our Services (often using
            de-identified or aggregated data)</li>
          <li>Train staff and monitor communications for quality assurance where permitted and
            with appropriate notice</li>
          <li>Detect, prevent, and investigate fraud, misuse, or security incidents</li>
        </LegalUl>

        <LegalH3>Marketing and communications</LegalH3>
        <LegalUl>
          <li>Send service-related emails and SMS (appointments, program updates, billing, care
            reminders). These are not marketing messages and you cannot opt out where they are
            necessary to provide the Services</li>
          <li>Send promotional communications about Sanative programs where permitted by law and
            with your consent or applicable soft opt-in rules</li>
          <li>Measure and improve the effectiveness of our advertising</li>
        </LegalUl>

        <LegalH3>Legal and regulatory purposes</LegalH3>
        <LegalUl>
          <li>Comply with laws, regulations, court orders, and regulatory requests</li>
          <li>Meet clinical governance, pharmacy, and health record-keeping obligations</li>
          <li>Establish, exercise, or defend legal claims and manage disputes</li>
          <li>Facilitate corporate transactions (e.g. merger or acquisition) subject to appropriate
            safeguards</li>
        </LegalUl>

        <LegalP>
          We will not use or disclose your personal information for a purpose other than those
          described above unless you consent, or we are required or authorised by law.
        </LegalP>
      </LegalSection>

      <LegalSection title="Direct marketing">
        <LegalP>
          We may send you marketing communications by email or SMS about Sanative programs, offers,
          and health-related content where permitted by law. You can opt out of marketing at any
          time by:
        </LegalP>
        <LegalUl>
          <li>Clicking the unsubscribe link in marketing emails</li>
          <li>Replying STOP to marketing SMS where supported</li>
          <li>Contacting us at{" "}
            <a href={`mailto:${SANATIVE_LEGAL.privacyEmail}`} className="underline text-[#5c7a52]">
              {SANATIVE_LEGAL.privacyEmail}
            </a>
          </li>
        </LegalUl>
        <LegalP>
          Opting out of marketing does not affect service-related communications about your account,
          appointments, clinical care, or billing.
        </LegalP>
        <LegalP>
          We do not sell your personal information. We do not disclose mobile numbers or SMS consent
          information to third parties for their own marketing purposes.
        </LegalP>
      </LegalSection>

      <LegalSection title="Cookies and online analytics">
        <LegalP>
          We may use third-party analytics services to understand how users interact with our
          website and to improve the Services. These providers may use cookies and similar
          technologies to collect usage information.
        </LegalP>
        <LegalP>
          We may also use advertising technologies to measure campaign performance and, where
          permitted, deliver relevant Sanative advertising on other websites. You can manage
          advertising preferences through your browser settings and industry opt-out tools where
          available.
        </LegalP>
        <LegalP>
          If you receive email from us, we may use tracking pixels to understand open and click
          rates to improve our communications.
        </LegalP>
      </LegalSection>

      <LegalSection title="Artificial intelligence">
        <LegalP>
          Where enabled, Sanative may use artificial intelligence (AI) technologies to assist with
          program insights, operational efficiency, drafting support, or customer service. AI may
          process information described in this Privacy Policy for legitimate business purposes
          subject to appropriate safeguards.
        </LegalP>
        <LegalP>
          <strong>
            Clinical decisions regarding your health care always involve human oversight from
            qualified healthcare professionals.
          </strong>{" "}
          We may use third-party AI services subject to vendor management processes. AI processing
          is subject to the same data protection standards described in this policy.
        </LegalP>
      </LegalSection>

      <LegalSection title="Who we disclose information to">
        <LegalP>We may disclose personal information to:</LegalP>
        <LegalUl>
          <li>
            <strong>Health practitioners and clinicians:</strong> AHPRA-registered doctors and
            other clinicians who provide or support your care
          </li>
          <li>
            <strong>Care partners and internal staff:</strong> employees and contractors who support
            program delivery, subject to confidentiality obligations
          </li>
          <li>
            <strong>Pathology and diagnostic providers:</strong> where tests are clinically ordered
          </li>
          <li>
            <strong>Pharmacies and dispensing partners:</strong> where prescriptions are fulfilled
            after consultation
          </li>
          <li>
            <strong>Payment processors:</strong> e.g. Stripe, to process transactions
          </li>
          <li>
            <strong>Communication providers:</strong> email (e.g. Resend) and SMS providers for
            service messages
          </li>
          <li>
            <strong>Technology and hosting providers:</strong> cloud hosting, security, analytics,
            scheduling, and platform support
          </li>
          <li>
            <strong>Professional advisers:</strong> lawyers, accountants, and insurers where required
          </li>
          <li>
            <strong>Regulators and law enforcement:</strong> where required or authorised by law
          </li>
          <li>
            <strong>Successors:</strong> in connection with a merger, acquisition, or sale of assets,
            subject to applicable law
          </li>
        </LegalUl>
        <LegalP>
          We may also disclose de-identified or aggregated information that cannot reasonably identify
          you for research, analytics, or business improvement purposes.
        </LegalP>
      </LegalSection>

      <LegalSection title="Overseas disclosure">
        <LegalP>
          Sanative&apos;s primary systems and patient data are hosted in <strong>Australia</strong>.
          However, some of our subprocessors may store or process limited personal information
          outside Australia, including in the United States and other countries where those providers
          operate.
        </LegalP>
        <LegalP>
          Where we disclose personal information to overseas recipients, we take reasonable steps to
          ensure they handle information in accordance with applicable privacy law. By using the
          Services and providing your information, you acknowledge that Australian Privacy Principle
          8.1 may not apply to certain overseas disclosures and that overseas recipients may not be
          subject to the Privacy Act. You may not be able to seek redress under the Privacy Act against
          an overseas recipient that breaches the APPs.
        </LegalP>
        <LegalP>Subprocessors used in our Services may include:</LegalP>
        <LegalUl>
          {LEGAL_SUBPROCESSORS.map((sp) => (
            <li key={sp.name}>
              <strong>{sp.name}</strong>: {sp.purpose}. Location: {sp.location}.
            </li>
          ))}
        </LegalUl>
      </LegalSection>

      <LegalSection title="Health records and clinical partners">
        <LegalP>
          Health practitioners who consult with you through Sanative may create clinical records as
          part of your treatment. Those practitioners have professional and legal obligations to
          maintain clinical records in accordance with applicable standards and State or Territory
          health record laws.
        </LegalP>
        <LegalP>
          Sanative may hold copies of clinical notes, assessment data, and care coordination records
          to provide the Services and will maintain their security in accordance with this Privacy
          Policy. In some circumstances, we may be required to retain health information even if you
          request deletion, where retention is required by law or for clinical governance purposes.
        </LegalP>
        <LegalP>
          Telehealth consultations may be documented in your record. Calls may be recorded for
          quality, training, or compliance purposes where you are notified and permitted by law.
        </LegalP>
      </LegalSection>

      <LegalSection title="Security">
        <LegalP>
          We implement technical and organisational measures designed to protect personal information
          against unauthorised access, loss, misuse, alteration, or disclosure. These measures may
          include access controls, encryption in transit (such as TLS), secure hosting, staff
          training, and incident response procedures.
        </LegalP>
        <LegalP>
          No method of transmission over the internet or electronic storage is completely secure. You
          acknowledge that you provide information at your own risk. You are responsible for keeping
          your account password confidential and for logging out of shared devices.
        </LegalP>
        <LegalP>
          Information you disclose in public areas of the Services (if any) may be visible to others.
          Please take care when sharing information.
        </LegalP>
      </LegalSection>

      <LegalSection title="Retention">
        <LegalP>
          We retain personal information for as long as necessary to provide the Services, fulfil the
          purposes described in this Privacy Policy, comply with legal and clinical record-keeping
          obligations, and resolve disputes.
        </LegalP>
        <LegalP>
          Retention periods depend on the nature and sensitivity of the information, the purposes for
          which it was collected, and applicable State or Territory health record laws. Health records
          may need to be retained for minimum periods prescribed by law, even after you close your
          account or stop using the Services.
        </LegalP>
        <LegalP>
          When information is no longer required, we take reasonable steps to destroy or de-identify
          it, subject to legal retention requirements.
        </LegalP>
      </LegalSection>

      <LegalSection title="Your rights">
        <LegalP>
          Under the Privacy Act and APPs, you may have the right to:
        </LegalP>
        <LegalUl>
          <li>Request access to personal information we hold about you</li>
          <li>Request correction of inaccurate, out-of-date, incomplete, or misleading information</li>
          <li>Withdraw consent to marketing communications</li>
          <li>Make a complaint about our handling of your personal information</li>
        </LegalUl>
        <LegalP>
          To make a request, contact us at{" "}
          <a href={`mailto:${SANATIVE_LEGAL.privacyEmail}`} className="underline text-[#5c7a52]">
            {SANATIVE_LEGAL.privacyEmail}
          </a>
          . We may need to verify your identity before responding. We will respond within a reasonable
          timeframe and in accordance with applicable law.
        </LegalP>
        <LegalP>
          In some cases we may not be able to provide access or make corrections, for example, where
          access would unreasonably affect the privacy of others, where denial is required by law, or
          where access would prejudice legal proceedings. If we refuse a request, we will explain why
          and inform you of complaint options.
        </LegalP>
        <LegalP>
          Requesting deletion of information may affect our ability to provide clinical Services. We
          may be legally required to retain certain health records regardless of a deletion request.
        </LegalP>
      </LegalSection>

      <LegalSection title="Complaints">
        <LegalP>
          If you believe we have breached the APPs or mishandled your personal information, please
          contact us first at{" "}
          <a href={`mailto:${SANATIVE_LEGAL.privacyEmail}`} className="underline text-[#5c7a52]">
            {SANATIVE_LEGAL.privacyEmail}
          </a>{" "}
          with &quot;Privacy complaint&quot; in the subject line. Include your name, contact details,
          and a description of your concern. We will acknowledge your complaint and endeavour to
          resolve it promptly.
        </LegalP>
        <LegalP>
          If you are not satisfied with our response, you may contact the Office of the Australian
          Information Commissioner (OAIC):
        </LegalP>
        <LegalUl>
          <li>
            Website:{" "}
            <a href="https://www.oaic.gov.au" className="underline text-[#5c7a52]">
              oaic.gov.au
            </a>
          </li>
          <li>Phone: 1300 363 992</li>
        </LegalUl>
      </LegalSection>

      <LegalSection title="Notifiable data breaches">
        <LegalP>
          If we become aware of a data breach that is likely to result in serious harm to individuals,
          we will comply with the Notifiable Data Breaches scheme under the Privacy Act. This may
          include notifying affected individuals and the OAIC, and taking steps to contain and
          remediate the breach.
        </LegalP>
      </LegalSection>

      <LegalSection title="Third-party links">
        <LegalP>
          Our website may contain links to third-party websites or services. We are not responsible
          for the privacy practices of those third parties. We encourage you to read their privacy
          policies before providing personal information.
        </LegalP>
      </LegalSection>

      <LegalSection title="Children">
        <LegalP>
          Our Services are intended for persons aged 18 and over. We do not knowingly collect personal
          information from children under 18 without appropriate parental or guardian consent. If you
          believe we have collected information from a child, please contact us and we will take
          reasonable steps to delete it.
        </LegalP>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <LegalP>
          We may update this Privacy Policy from time to time to reflect changes in our practices,
          technology, legal requirements, or the Services. The effective date at the top of this page
          will be updated when changes are made.
        </LegalP>
        <LegalP>
          Material changes may be notified by email or through the Services where required. Your
          continued use of the Services after changes are posted constitutes acceptance of the updated
          policy, except where applicable law requires your explicit consent.
        </LegalP>
      </LegalSection>
    </>
  );
}
