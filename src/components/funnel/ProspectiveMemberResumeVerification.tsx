"use client";

import { useEffect, useState } from "react";
import { Loader2, Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  sendPublicResumeVerificationCode,
  verifyPublicResumeCode,
} from "@/lib/funnel/intake-response";

type ProspectiveMemberResumeVerificationProps = {
  open: boolean;
  email: string;
  firstName?: string | null;
  onVerified: (sessionToken: string) => void | Promise<void>;
  onUseDifferentEmail: () => void;
  accentClass?: string;
};

export function ProspectiveMemberResumeVerification({
  open,
  email,
  firstName,
  onVerified,
  onUseDifferentEmail,
  accentClass = "bg-[#5c7a52] hover:bg-[#4a6343]",
}: ProspectiveMemberResumeVerificationProps) {
  const [step, setStep] = useState<"send" | "verify">("send");
  const [code, setCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStep("send");
      setCode("");
      setError(null);
      setIsSending(false);
      setIsVerifying(false);
    }
  }, [open]);

  if (!open) return null;

  const handleSendCode = async () => {
    setIsSending(true);
    setError(null);
    try {
      const result = await sendPublicResumeVerificationCode(email);
      if (!result.ok) {
        setError(result.message);
        toast.error("Could not send code", { description: result.message });
        return;
      }
      setStep("verify");
      toast.success("Verification code sent", {
        description: `Check ${email} for your 6-digit code.`,
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async () => {
    if (code.trim().length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setIsVerifying(true);
    setError(null);
    try {
      const result = await verifyPublicResumeCode(email, code.trim());
      if (!result.ok) {
        setError(result.message);
        toast.error("Verification failed", { description: result.message });
        return;
      }
      await onVerified(result.sessionToken);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex items-center justify-center w-12 h-12 bg-[#eef4eb] rounded-full mx-auto mb-4">
          {step === "send" ? (
            <Mail className="w-6 h-6 text-[#5c7a52]" />
          ) : (
            <ShieldCheck className="w-6 h-6 text-[#5c7a52]" />
          )}
        </div>

        <h3 className="text-xl font-serif text-[#2c3628] text-center mb-2">
          Verify your email to continue
        </h3>
        <p className="text-sm text-[#5c7a52] text-center mb-6">
          {firstName ? `Welcome back, ${firstName}. ` : ""}
          We found an unfinished application for <strong>{email}</strong>. Enter the
          verification code we send to this address to resume safely.
        </p>

        {error && (
          <p className="text-sm text-red-600 text-center mb-4">{error}</p>
        )}

        {step === "send" ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleSendCode}
              disabled={isSending}
              className={`w-full py-3 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 ${accentClass}`}
            >
              {isSending ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending code...
                </span>
              ) : (
                "Send verification code"
              )}
            </button>
            <button
              type="button"
              onClick={onUseDifferentEmail}
              className="w-full py-3 bg-white border-2 border-[#e6ebe3] hover:border-[#5c7a52] text-[#2c3628] font-semibold rounded-xl transition-colors"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit code"
              className="w-full px-4 py-3 rounded-xl border border-[#cdd8c6] text-center text-lg tracking-[0.3em] font-mono focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 outline-none"
            />
            <button
              type="button"
              onClick={handleVerify}
              disabled={isVerifying || code.length !== 6}
              className={`w-full py-3 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 ${accentClass}`}
            >
              {isVerifying ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying...
                </span>
              ) : (
                "Verify and continue"
              )}
            </button>
            <button
              type="button"
              onClick={handleSendCode}
              disabled={isSending}
              className="w-full py-2 text-sm text-[#5c7a52] hover:text-[#2c3628] transition-colors"
            >
              Resend code
            </button>
            <button
              type="button"
              onClick={onUseDifferentEmail}
              className="w-full py-3 bg-white border-2 border-[#e6ebe3] hover:border-[#5c7a52] text-[#2c3628] font-semibold rounded-xl transition-colors"
            >
              Use a different email
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
