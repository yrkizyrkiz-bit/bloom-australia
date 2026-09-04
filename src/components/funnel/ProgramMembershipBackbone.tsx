"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  Loader2,
  Lock,
  MessageCircle,
  Package,
  Shield,
  Stethoscope,
} from "lucide-react";
import { AustralianAddressLookup } from "@/components/checkout/AustralianAddressLookup";
import { FunnelMembershipPaymentScreen } from "@/components/checkout/FunnelMembershipPaymentScreen";
import { MembershipConsultationBooking } from "@/components/membership/MembershipConsultationBooking";
import { ConsentNotice } from "@/components/legal/ConsentNotice";
import type { CheckoutPaymentSuccess } from "@/lib/checkout/payment-success";
import type { ClinicalProgramFunnelConfig } from "@/lib/funnel/clinical-program-funnel";
import {
  FunnelStepProgress,
  backboneProgressPhase,
  funnelProgressAccentForProgram,
} from "@/components/funnel/FunnelStepProgress";

export type FunnelProfileFields = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender?: string;
  streetAddress: string;
  addressUnit: string;
  suburb: string;
  state: string;
  postcode: string;
};

type BackbonePhase = "qualify" | "profile" | "pay" | "book" | "welcome";

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatDobInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function getAgeFromDob(dob: string): number {
  if (dob.length !== 10) return 0;
  const [day, month, year] = dob.split("/").map(Number);
  if (!day || !month || !year) return 0;
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
}

function magicTokenFromLink(link: string): string | null {
  try {
    const url = new URL(link, "https://sanative.com.au");
    return url.searchParams.get("token") || url.searchParams.get("magic") || null;
  } catch {
    return null;
  }
}

function compactFieldClass(hasError?: boolean) {
  return `w-full border-2 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors bg-white ${
    hasError ? "border-red-400" : "border-[#e6ebe3] focus:border-[#5c7a52]"
  }`;
}

export function ProgramMembershipBackbone({
  config,
  userId,
  profile,
  returnPath,
  onProfileSave,
  advanceToPay = false,
}: {
  config: ClinicalProgramFunnelConfig;
  userId: string | null;
  profile: FunnelProfileFields;
  returnPath: string;
  onProfileSave: (next: FunnelProfileFields) => Promise<boolean>;
  advanceToPay?: boolean;
}) {
  const [phase, setPhase] = useState<BackbonePhase>("qualify");
  const [fields, setFields] = useState<FunnelProfileFields>(profile);
  const [membershipPaid, setMembershipPaid] = useState(false);
  const [checkoutPayment, setCheckoutPayment] = useState<CheckoutPaymentSuccess | null>(null);
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [consultationDate, setConsultationDate] = useState("");
  const [consultationTime, setConsultationTime] = useState("");

  useEffect(() => {
    if (advanceToPay && userId) setPhase("pay");
  }, [advanceToPay, userId]);

  return (
    <div
      className={`h-[100dvh] flex flex-col overflow-hidden ${
        phase === "welcome" ? "bg-[#5c7a52]" : "bg-[#fdfbf7]"
      }`}
    >
      {phase !== "welcome" && (
        <header className="flex-shrink-0 bg-[#fdfbf7]/95 backdrop-blur-sm z-40 border-b border-[#e6ebe3]">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-3 pb-0 flex items-center justify-between">
            <Link href="/" className="font-serif text-xl text-[#34412f]">
              Sanative
            </Link>
            <span className="text-xs font-medium text-[#5c7a52]">{config.label}</span>
          </div>
          <FunnelStepProgress
            currentPhase={backboneProgressPhase(phase)}
            compact
            accent={funnelProgressAccentForProgram(config.id)}
          />
        </header>
      )}

      <main
        className={
          phase === "pay"
            ? "flex-1 min-h-0 overflow-y-auto max-w-6xl mx-auto w-full px-4 sm:px-6 py-8"
            : "flex-1 min-h-0 flex flex-col overflow-hidden"
        }
      >
        {phase === "qualify" && (
          <QualificationStep
            config={config}
            onContinue={() => setPhase("profile")}
          />
        )}
        {phase === "profile" && (
          <CompleteProfileStep
            fields={fields}
            onBack={() => setPhase("qualify")}
            onSave={async (next) => {
              setFields(next);
              const ok = await onProfileSave(next);
              if (ok) setPhase("pay");
              return ok;
            }}
          />
        )}
        {phase === "pay" && !userId && (
          <div className="flex flex-1 items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[#5c7a52]" />
          </div>
        )}
        {phase === "pay" && userId && (
          <FunnelMembershipPaymentScreen
            userId={userId}
            email={fields.email}
            firstName={fields.firstName}
            lastName={fields.lastName}
            phone={fields.phone}
            dateOfBirth={fields.dateOfBirth}
            gender={fields.gender}
            streetAddress={fields.streetAddress}
            addressUnit={fields.addressUnit}
            suburb={fields.suburb}
            state={fields.state}
            postcode={fields.postcode}
            alreadyPaid={membershipPaid}
            intentProgram={config.intentProgram}
            source={config.source}
            returnPath={returnPath}
            membershipCopy={config.membershipCopy}
            paymentNote={config.paymentNote}
            onContinueAfterPaid={() => setPhase("book")}
            onSuccess={(result) => {
              setCheckoutPayment(result);
              setMembershipPaid(true);
              toast.success("Payment successful!", {
                description: "Your Sanative Membership is active. Book your doctor consultation.",
              });
              setPhase("book");
            }}
            onError={(error) => {
              toast.error("Payment failed", { description: error });
            }}
          />
        )}
        {phase === "book" && userId && checkoutPayment && (
          <div className="max-w-lg mx-auto w-full px-4 py-6 space-y-6 overflow-y-auto">
            <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
                <Check className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-medium text-green-800">Membership active</span>
            </div>
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#5c7a52]">
                Book your doctor
              </p>
              <h1 className="font-serif text-2xl text-[#2c3628]">Choose your consultation time</h1>
              <p className="mt-1 text-sm text-[#5c7a52]">
                Your doctor is assigned during triage by a care partner. You&apos;ll receive
                confirmation once your appointment is locked in.
              </p>
            </div>
            <MembershipConsultationBooking
              userId={userId}
              paymentIntentId={checkoutPayment.paymentIntentId || ""}
              consentRecordId={checkoutPayment.consentRecordId}
              firstName={fields.firstName}
              lastName={fields.lastName}
              email={fields.email}
              phone={fields.phone}
              postcode={fields.postcode}
              programType={config.programType}
              selectedPlan={config.programType === "WEIGHT_MANAGEMENT" ? "CORE" : undefined}
              onComplete={(result) => {
                setMagicLink(result?.magicLink || null);
                setConsultationDate(result?.consultationDate || "");
                setConsultationTime(result?.consultationTime || "");
                setPhase("welcome");
              }}
            />
          </div>
        )}
        {phase === "welcome" && userId && (
          <WelcomeStep
            firstName={fields.firstName}
            email={fields.email}
            consultationDate={consultationDate}
            consultationTime={consultationTime}
            magicLink={magicLink}
            userId={userId}
            postCheckoutPath={config.postCheckoutPath}
          />
        )}
      </main>
    </div>
  );
}

function QualificationStep({
  config,
  onContinue,
}: {
  config: ClinicalProgramFunnelConfig;
  onContinue: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-gradient-to-b from-[#f8faf8] to-white px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1.5 sm:px-6">
      <div className="mx-auto flex h-full w-full max-w-md min-h-0 flex-1 flex-col overflow-hidden">
        <div
          className={
            config.qualificationImagePortrait
              ? "relative mx-auto mb-2 w-full max-w-[220px] min-h-[9rem] max-h-[280px] flex-1 overflow-hidden rounded-2xl shadow-sm"
              : "relative mb-2 min-h-[9rem] max-h-[280px] flex-1 overflow-hidden rounded-2xl shadow-sm"
          }
        >
          <Image
            src={config.qualificationImage}
            alt={config.qualificationImageAlt}
            fill
            sizes={
              config.qualificationImagePortrait
                ? "220px"
                : "(max-width: 448px) 100vw, 448px"
            }
            className={
              config.qualificationImagePortrait
                ? "object-contain object-top"
                : "object-cover object-center"
            }
            priority
          />
        </div>
        <div className="mb-2.5 shrink-0 text-center">
          <div className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#5c7a52]/10">
            <CheckCircle2 className="h-4 w-4 text-[#5c7a52]" />
          </div>
          <h1 className="font-serif text-lg leading-tight text-[#2c3628] sm:text-xl">
            Thanks for completing your assessment
          </h1>
          <p className="mt-1 text-sm leading-snug text-[#5c7a52]">
            Preliminary assessment complete. Here&apos;s what happens next.
          </p>
        </div>
        <div className="space-y-2 shrink-0">
          {config.nextSteps.map((step, index) => (
            <div
              key={step.title}
              className="flex items-start gap-3 rounded-xl border border-[#e6ebe3] bg-white px-3 py-2.5"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#5c7a52] text-xs font-semibold text-white">
                {index + 1}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#2c3628]">{step.title}</p>
                <p className="text-xs text-[#5c7a52] leading-snug">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onContinue}
          className="mt-3 w-full rounded-full bg-[#5c7a52] py-3.5 text-base font-semibold text-white hover:bg-[#4a6343]"
        >
          Complete your profile
        </button>
      </div>
    </div>
  );
}

function CompleteProfileStep({
  fields,
  onBack,
  onSave,
}: {
  fields: FunnelProfileFields;
  onBack: () => void;
  onSave: (next: FunnelProfileFields) => Promise<boolean>;
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [local, setLocal] = useState(fields);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const firstNameRef = useRef<HTMLDivElement>(null) as RefObject<HTMLDivElement>;
  const dateOfBirthRef = useRef<HTMLDivElement>(null) as RefObject<HTMLDivElement>;
  const emailRef = useRef<HTMLDivElement>(null) as RefObject<HTMLDivElement>;
  const lastNameRef = useRef<HTMLDivElement>(null) as RefObject<HTMLDivElement>;
  const phoneRef = useRef<HTMLDivElement>(null) as RefObject<HTMLDivElement>;
  const addressRef = useRef<HTMLDivElement>(null) as RefObject<HTMLDivElement>;

  const fieldRefs: Record<string, RefObject<HTMLDivElement>> = {
    firstName: firstNameRef,
    dateOfBirth: dateOfBirthRef,
    email: emailRef,
    lastName: lastNameRef,
    phone: phoneRef,
    postcode: addressRef,
    address: addressRef,
    suburb: addressRef,
    state: addressRef,
  };

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setSubmitError(null);
  };

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!local.firstName.trim()) errs.firstName = "First name is required";
    if (!local.dateOfBirth.trim()) errs.dateOfBirth = "Date of birth is required";
    else if (local.dateOfBirth.length !== 10 || getAgeFromDob(local.dateOfBirth) < 18) {
      errs.dateOfBirth =
        getAgeFromDob(local.dateOfBirth) > 0 && getAgeFromDob(local.dateOfBirth) < 18
          ? "You must be 18 or older"
          : "Enter a valid date of birth (DD/MM/YYYY)";
    }
    if (!local.email.trim()) errs.email = "Email is required";
    else if (!EMAIL_FORMAT.test(local.email.trim())) errs.email = "Enter a valid email address";
    if (!local.lastName.trim()) errs.lastName = "Last name is required";
    if (!local.phone.trim()) errs.phone = "Mobile number is required";
    else if (!/^(\+61|0)[4-9]\d{8}$/.test(local.phone.replace(/\s/g, ""))) {
      errs.phone = "Enter a valid Australian mobile number";
    }
    if (!local.postcode.trim()) errs.postcode = "Postcode is required";
    else if (!/^\d{4}$/.test(local.postcode.trim())) errs.postcode = "Enter a valid 4-digit postcode";
    if (!local.streetAddress.trim()) errs.address = "Street address is required";
    if (!local.suburb.trim()) errs.suburb = "Suburb is required";
    if (!local.state.trim()) errs.state = "State / territory is required";
    return errs;
  };

  const handleContinue = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setSubmitError("Please complete the required fields above.");
      const firstKey = ["firstName", "dateOfBirth", "email", "lastName", "phone", "address"].find(
        (key) => errs[key]
      );
      fieldRefs[firstKey || ""]?.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setIsSaving(true);
    setSubmitError(null);
    try {
      const ok = await onSave({
        ...local,
        firstName: local.firstName.trim(),
        lastName: local.lastName.trim(),
        email: local.email.trim().toLowerCase(),
        phone: local.phone.trim(),
        streetAddress: local.streetAddress.trim(),
        suburb: local.suburb.trim(),
        state: local.state.trim(),
        postcode: local.postcode.trim(),
      });
      if (!ok) setSubmitError("We couldn't save your details. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 max-w-md mx-auto w-full px-4">
      <div className="flex-1 min-h-0 overflow-y-auto px-0.5 pt-3">
        <h1 className="text-xl font-serif text-[#2c3628] leading-tight">
          Let&apos;s complete your profile
        </h1>
        <p className="text-xs text-[#5c7a52] mt-0.5 leading-snug mb-3">
          These details set up your account and help us prepare your order if your doctor confirms
          the program is clinically suitable.
        </p>
        <div className="bg-[#f4f7f2] rounded-xl p-3 mb-3">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div ref={fieldRefs.firstName}>
              <label className="block text-xs font-medium text-gray-700 mb-1">First name</label>
              <input
                type="text"
                value={local.firstName}
                onChange={(e) => {
                  setLocal((prev) => ({ ...prev, firstName: e.target.value }));
                  clearFieldError("firstName");
                }}
                className={compactFieldClass(Boolean(fieldErrors.firstName))}
              />
            </div>
            <div ref={fieldRefs.dateOfBirth}>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date of birth</label>
              <input
                type="text"
                inputMode="numeric"
                value={local.dateOfBirth}
                onChange={(e) => {
                  setLocal((prev) => ({ ...prev, dateOfBirth: formatDobInput(e.target.value) }));
                  clearFieldError("dateOfBirth");
                }}
                placeholder="DD/MM/YYYY"
                className={compactFieldClass(Boolean(fieldErrors.dateOfBirth))}
              />
            </div>
          </div>
          <div ref={fieldRefs.email} className="mb-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={local.email}
              onChange={(e) => {
                setLocal((prev) => ({ ...prev, email: e.target.value }));
                clearFieldError("email");
              }}
              className={compactFieldClass(Boolean(fieldErrors.email))}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div ref={fieldRefs.lastName}>
              <label className="block text-xs font-medium text-gray-700 mb-1">Last name</label>
              <input
                type="text"
                value={local.lastName}
                onChange={(e) => {
                  setLocal((prev) => ({ ...prev, lastName: e.target.value }));
                  clearFieldError("lastName");
                }}
                className={compactFieldClass(Boolean(fieldErrors.lastName))}
              />
            </div>
            <div ref={fieldRefs.phone}>
              <label className="block text-xs font-medium text-gray-700 mb-1">Mobile</label>
              <input
                type="tel"
                value={local.phone}
                onChange={(e) => {
                  setLocal((prev) => ({ ...prev, phone: e.target.value }));
                  clearFieldError("phone");
                }}
                placeholder="0400 000 000"
                className={compactFieldClass(Boolean(fieldErrors.phone))}
              />
            </div>
          </div>
        </div>
        <div className="pt-2.5 border-t border-[#e6ebe3]">
          <div className="flex items-center gap-1.5 mb-2">
            <Package className="w-4 h-4 text-[#5c7a52]" />
            <p className="text-sm font-semibold text-[#2c3628]">Delivery address</p>
          </div>
          <div ref={addressRef}>
            <AustralianAddressLookup
              compact
              value={{
                addressLine1: local.streetAddress,
                addressLine2: local.addressUnit,
                suburb: local.suburb,
                state: local.state,
                postcode: local.postcode,
              }}
              onChange={(next) => {
                setLocal((prev) => ({
                  ...prev,
                  streetAddress: next.addressLine1,
                  addressUnit: next.addressLine2,
                  suburb: next.suburb,
                  state: next.state,
                  postcode: next.postcode,
                }));
                setFieldErrors((prev) => {
                  const copy = { ...prev };
                  delete copy.address;
                  delete copy.suburb;
                  delete copy.state;
                  delete copy.postcode;
                  return copy;
                });
              }}
              errors={{
                addressLine1: fieldErrors.address,
                suburb: fieldErrors.suburb,
                state: fieldErrors.state,
                postcode: fieldErrors.postcode,
              }}
            />
          </div>
        </div>
      </div>
      <div className="shrink-0 bg-[#fdfbf7] pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {submitError && (
          <div className="mb-2 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-600" />
            <p className="text-xs leading-snug text-red-700">{submitError}</p>
          </div>
        )}
        <ConsentNotice variant="contact" className="mb-2 leading-snug text-[11px]" />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-3 rounded-xl border border-[#cdd8c6] text-[#5c7a52]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => void handleContinue()}
            disabled={isSaving}
            className="flex-1 py-3 bg-[#5c7a52] hover:bg-[#4a6343] disabled:opacity-50 text-white font-semibold rounded-full flex items-center justify-center gap-2"
          >
            {isSaving ? "Saving..." : "Continue to payment"}
            {!isSaving && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-1.5">
          <Shield className="w-3.5 h-3.5 text-[#7e9a72]" />
          <span className="text-[10px] text-[#7e9a72] font-medium tracking-wide">
            256-BIT TLS SECURITY
          </span>
        </div>
      </div>
    </div>
  );
}

function WelcomeStep({
  firstName,
  email,
  consultationDate,
  consultationTime,
  magicLink,
  userId,
  postCheckoutPath,
}: {
  firstName: string;
  email: string;
  consultationDate: string;
  consultationTime: string;
  magicLink: string | null;
  userId: string;
  postCheckoutPath: string;
}) {
  const portalLink = (() => {
    if (!magicLink) return `/login?redirect=${encodeURIComponent(postCheckoutPath)}`;
    try {
      const url = new URL(magicLink, "https://sanative.com.au");
      url.searchParams.set("redirect", postCheckoutPath);
      return `${url.pathname}${url.search}`;
    } catch {
      const separator = magicLink.includes("?") ? "&" : "?";
      return `${magicLink}${separator}redirect=${encodeURIComponent(postCheckoutPath)}`;
    }
  })();
  const [needsPassword, setNeedsPassword] = useState(Boolean(userId));
  const [checkingAccess, setCheckingAccess] = useState(Boolean(magicLink));
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!magicLink) {
      setCheckingAccess(false);
      return;
    }
    const token = magicTokenFromLink(magicLink);
    if (!token) {
      setCheckingAccess(false);
      return;
    }
    let cancelled = false;
    void fetch("/api/auth/magic-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!cancelled && res.ok) setNeedsPassword(Boolean(data.needsPassword));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setCheckingAccess(false);
      });
    return () => {
      cancelled = true;
    };
  }, [magicLink]);

  const activatePortal = async () => {
    if (needsPassword) {
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      setSaving(true);
      try {
        const res = await fetch("/api/auth/set-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Could not set your password");
        const token = magicLink ? magicTokenFromLink(magicLink) : null;
        if (token && email) {
          const result = await signIn("credentials", {
            email,
            magicToken: token,
            redirect: false,
          });
          if (result?.ok) {
            window.location.href = postCheckoutPath;
            return;
          }
        }
        window.location.href = portalLink;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not set your password");
        setSaving(false);
      }
      return;
    }
    window.location.href = portalLink;
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-gradient-to-b from-[#5c7a52] to-[#4a6343]">
      <div className="mx-auto flex w-full max-w-sm min-h-0 flex-1 flex-col px-4 pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="shrink-0 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20">
            <CheckCircle2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="font-serif text-2xl text-white">
            Welcome to Sanative{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-2 text-sm text-white/90">
            Your consultation is booked. Set a password to open your portal and follow your program
            journey.
          </p>
        </div>
        <div className="my-3 min-h-0 flex-1 overflow-y-auto">
          <div className="rounded-2xl bg-white p-4 shadow-2xl">
            {(consultationDate || consultationTime) && (
              <div className="flex items-center gap-3 border-b border-[#e6ebe3] pb-3">
                <Calendar className="h-5 w-5 flex-shrink-0 text-[#5c7a52]" />
                <div className="text-left">
                  <p className="text-xs text-[#7e9a72]">Your consultation</p>
                  <p className="text-sm font-semibold text-[#2c3628]">{consultationDate}</p>
                  <p className="text-sm text-[#5c7a52]">{consultationTime}</p>
                </div>
              </div>
            )}
            <div className="space-y-2.5 pt-3">
              <div className="flex items-start gap-2.5">
                <MessageCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#5c7a52]" />
                <p className="text-xs text-[#5c7a52]">Confirmation email sent to {email}</p>
              </div>
              <div className="flex items-start gap-2.5">
                <Stethoscope className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#5c7a52]" />
                <p className="text-xs text-[#5c7a52]">
                  Your doctor will confirm your care plan during the consultation
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <Package className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#5c7a52]" />
                <p className="text-xs text-[#5c7a52]">
                  A care partner will reach out within 24 hours
                </p>
              </div>
            </div>
            {checkingAccess ? (
              <div className="mt-3 flex items-center justify-center border-t border-[#e6ebe3] pt-4">
                <Loader2 className="h-5 w-5 animate-spin text-[#5c7a52]" />
              </div>
            ) : needsPassword ? (
              <div className="mt-3 space-y-3 border-t border-[#e6ebe3] pt-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[#5c7a52]" />
                  <p className="text-sm font-semibold text-[#2c3628]">Set your portal password</p>
                </div>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Password (min 8 characters)"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  className="w-full rounded-xl border-2 border-[#e6ebe3] px-4 py-3 text-sm outline-none focus:border-[#5c7a52]"
                />
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError(null);
                  }}
                  className="w-full rounded-xl border-2 border-[#e6ebe3] px-4 py-3 text-sm outline-none focus:border-[#5c7a52]"
                />
                {error && <p className="text-sm text-red-600">{error}</p>}
              </div>
            ) : (
              <p className="mt-3 border-t border-[#e6ebe3] pt-3 text-xs leading-relaxed text-[#7e9a72]">
                Your portal is ready. Open it to follow your program journey.
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void activatePortal()}
          disabled={saving || checkingAccess}
          className="block w-full rounded-full bg-white py-3.5 text-center text-base font-semibold text-[#2c3628] disabled:opacity-60"
        >
          {saving ? "Saving..." : needsPassword ? "Set password & open portal" : "Open my portal"}
        </button>
      </div>
    </div>
  );
}
