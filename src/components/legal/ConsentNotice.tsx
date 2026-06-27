import Link from "next/link";
import { LEGAL_LINKS } from "@/lib/legal/constants";

type ConsentVariant = "quiz" | "contact" | "payment";

const copy: Record<ConsentVariant, React.ReactNode> = {
  quiz: (
    <>
      By continuing, you confirm Sanative is not an emergency service (call{" "}
      <strong>000</strong> in an emergency). You consent to us collecting health information to
      assess your suitability for care, and you agree to our{" "}
      <Link href={LEGAL_LINKS.terms} className="underline text-[#5c7a52]">
        Terms &amp; Conditions
      </Link>
      ,{" "}
      <Link href={LEGAL_LINKS.privacy} className="underline text-[#5c7a52]">
        Privacy Policy
      </Link>
      ,{" "}
      <Link href={LEGAL_LINKS.telehealthConsent} className="underline text-[#5c7a52]">
        Telehealth Consent
      </Link>{" "}
      and{" "}
      <Link href={LEGAL_LINKS.medicalDisclaimer} className="underline text-[#5c7a52]">
        Medical Disclaimer
      </Link>
      . Treatment decisions are made by an Australian doctor after clinical assessment.
    </>
  ),
  contact: (
    <>
      By providing your contact details and continuing, you consent to service-related SMS and
      email about your assessment, booking, program, billing, and care. Marketing messages are
      optional. See our{" "}
      <Link href={LEGAL_LINKS.privacy} className="underline text-[#5c7a52]">
        Privacy Policy
      </Link>
      .
    </>
  ),
  payment: (
    <>
      By completing payment, you agree to our{" "}
      <Link href={LEGAL_LINKS.terms} className="underline text-[#5c7a52]">
        Terms &amp; Conditions
      </Link>
      ,{" "}
      <Link href={LEGAL_LINKS.subscriptionTerms} className="underline text-[#5c7a52]">
        Subscription Terms
      </Link>{" "}
      and{" "}
      <Link href={LEGAL_LINKS.refundPolicy} className="underline text-[#5c7a52]">
        Refund Policy
      </Link>
      . Your payment is for clinical assessment, program onboarding, and care coordination. No
      specific treatment, prescription, medication, or health outcome is guaranteed.
    </>
  ),
};

export function ConsentNotice({
  variant,
  className = "",
}: {
  variant: ConsentVariant;
  className?: string;
}) {
  return (
    <p className={`text-xs text-[#7e9a72] leading-relaxed ${className}`}>
      {copy[variant]}
    </p>
  );
}
