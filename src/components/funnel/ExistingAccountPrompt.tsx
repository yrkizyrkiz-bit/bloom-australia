"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

type ExistingAccountPromptProps = {
  open: boolean;
  firstName?: string | null;
  loginHref: string;
  onUseDifferentEmail: () => void;
  /** Primary CTA color — defaults to Sanative green */
  accentClass?: string;
  accentHoverClass?: string;
};

export function ExistingAccountPrompt({
  open,
  firstName,
  loginHref,
  onUseDifferentEmail,
  accentClass = "bg-[#5c7a52] hover:bg-[#4a6343]",
  accentHoverClass,
}: ExistingAccountPromptProps) {
  if (!open) return null;

  const buttonClass = accentHoverClass
    ? `${accentClass} ${accentHoverClass}`
    : accentClass;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex items-center justify-center w-12 h-12 bg-amber-100 rounded-full mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        </div>
        <h3 className="text-xl font-serif text-[#2c3628] text-center mb-2">
          Account already exists
        </h3>
        <p className="text-sm text-[#5c7a52] text-center mb-6">
          {firstName ? (
            <>
              Hi {firstName}! It looks like you already have an account with us.
              Please log in to continue.
            </>
          ) : (
            <>
              This email is already registered. Please log in to your patient
              portal to continue.
            </>
          )}
        </p>

        <div className="space-y-3">
          <Link
            href={loginHref}
            className={`block w-full py-3 text-white font-semibold rounded-xl text-center transition-colors ${buttonClass}`}
          >
            Log in to your portal
          </Link>

          <button
            type="button"
            onClick={onUseDifferentEmail}
            className="w-full py-3 bg-white border-2 border-[#e6ebe3] hover:border-[#5c7a52] text-[#2c3628] font-semibold rounded-xl transition-colors"
          >
            Use a different email
          </button>
        </div>
      </div>
    </div>
  );
}
