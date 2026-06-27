"use client";

import Link from "next/link";
import { LEGAL_LINKS } from "@/lib/legal/constants";
import { PRE_PAYMENT_CONSENT_CHECKBOX_LABEL } from "@/lib/legal/pre-payment-consent";

export { PRE_PAYMENT_CONSENT_CHECKBOX_LABEL };

type PrePaymentConsentCheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
};

export function PrePaymentConsentCheckbox({
  checked,
  onCheckedChange,
  disabled = false,
  className = "",
  id = "pre-payment-consent",
}: PrePaymentConsentCheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-3 rounded-xl border border-[#e6ebe3] bg-[#fafbf9] p-3 cursor-pointer select-none ${disabled ? "opacity-60 cursor-not-allowed" : ""} ${className}`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#cdd8c6] text-[#5c7a52] focus:ring-[#5c7a52]/30"
        aria-required
      />
      <span className="text-xs text-[#5c7a52] leading-relaxed">
        I agree to the{" "}
        <Link href={LEGAL_LINKS.terms} className="underline text-[#5c7a52]" target="_blank">
          Terms
        </Link>
        ,{" "}
        <Link href={LEGAL_LINKS.privacy} className="underline text-[#5c7a52]" target="_blank">
          Privacy Policy
        </Link>
        ,{" "}
        <Link
          href={LEGAL_LINKS.telehealthConsent}
          className="underline text-[#5c7a52]"
          target="_blank"
        >
          Telehealth Consent
        </Link>
        . I understand treatment decisions are made by an Australian doctor after clinical
        assessment.
      </span>
    </label>
  );
}
