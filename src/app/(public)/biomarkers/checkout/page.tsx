"use client";

import { useState, Suspense, useLayoutEffect, useRef, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Beaker,
  CheckCircle,
  Lock,
  Shield,
  User,
  Mail,
  Phone,
  Calendar,
  Loader2,
  Stethoscope,
  Sparkles,
} from "lucide-react";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { PrePaymentConsentCheckbox } from "@/components/legal/PrePaymentConsentCheckbox";
import {
  getBiomarkerSubscriptionPlan,
  type BiomarkerSubscriptionTier,
} from "@/lib/biomarkers/public-subscription-panels";
import { isValidPublicPanelTier } from "@/lib/biomarkers/public-checkout-tier-map";
import { BiomarkersDoctorBooking } from "@/components/biomarkers/BiomarkersDoctorBooking";
import { PublicBiomarkersPanelQuiz } from "@/components/biomarkers/PublicBiomarkersPanelQuiz";
import type { CheckoutPaymentSuccess } from "@/lib/checkout/payment-success";
import {
  ensurePrePaymentConsentRecorded,
  paymentSourcePage,
} from "@/lib/legal/ensure-pre-payment-consent";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

type Step = "details" | "payment" | "doctor" | "quiz" | "activate";

const STEP_LABELS: Record<Step, string> = {
  details: "Your details",
  payment: "Payment",
  doctor: "Doctor consultation",
  quiz: "Health questionnaire",
  activate: "Activate portal",
};

const FULL_STEP_ORDER: Step[] = ["details", "payment", "doctor", "quiz", "activate"];
const SKIP_QUIZ_STEP_ORDER: Step[] = ["details", "payment", "doctor", "activate"];

type FunnelCheckoutPrefill = {
  source?: string;
  skipQuiz?: boolean;
  panelTier?: string;
  resolvedProgram?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  postcode?: string;
  gender?: string;
  /** Hair assessment answers */
  hairQuizAnswers?: Record<string, unknown>;
  /** Women's assessment answers */
  womensQuizAnswers?: Record<string, unknown>;
};

function isWomensHealthSource(source: string | null | undefined): boolean {
  return (
    source === "womens_health" ||
    source === "womens_health_sexual" ||
    source === "womens_health_vitality"
  );
}

function readFunnelCheckoutPrefill(
  sourceParam: string | null
): FunnelCheckoutPrefill | null {
  if (typeof window === "undefined") return null;
  const keys =
    sourceParam === "hair_loss"
      ? ["hair_biomarkers_checkout"]
      : isWomensHealthSource(sourceParam)
        ? ["womens_biomarkers_checkout"]
        : ["hair_biomarkers_checkout", "womens_biomarkers_checkout"];
  try {
    for (const key of keys) {
      const raw = sessionStorage.getItem(key);
      if (!raw) continue;
      return JSON.parse(raw) as FunnelCheckoutPrefill;
    }
    return null;
  } catch {
    return null;
  }
}

/** Convert DD/MM/YYYY (hair quiz) to YYYY-MM-DD for date inputs. */
function toIsoDateInput(value: string | undefined): string {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return "";
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function BiomarkersPaymentForm({
  onSuccess,
  amountAud,
  customerEmail,
}: {
  onSuccess: (result: CheckoutPaymentSuccess) => void;
  amountAud: number;
  customerEmail: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    const consentResult = await ensurePrePaymentConsentRecorded({
      consentChecked,
      sourcePage: paymentSourcePage(),
      email: customerEmail,
    });

    if (!consentResult.ok) {
      setError(consentResult.error);
      setIsProcessing(false);
      return;
    }

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/biomarkers/checkout?step=doctor`,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message || "Payment failed");
      setIsProcessing(false);
      return;
    }

    if (paymentIntent?.status === "succeeded") {
      onSuccess({
        paymentIntentId: paymentIntent.id,
        consentRecordId: consentResult.consentRecordId,
      });
    } else {
      setError("Payment was not completed. Please try again.");
    }
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      <PrePaymentConsentCheckbox
        checked={consentChecked}
        onCheckedChange={setConsentChecked}
        disabled={isProcessing}
      />
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || isProcessing || !consentChecked}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 py-4"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Pay ${amountAud} AUD
          </>
        )}
      </button>
    </form>
  );
}

function BiomarkersCheckoutContent() {
  const searchParams = useSearchParams();
  const packageParam = searchParams.get("package");
  const sourceParam = searchParams.get("source");
  const skipQuizParam = searchParams.get("skipQuiz");
  const panelTier: BiomarkerSubscriptionTier = isValidPublicPanelTier(packageParam)
    ? packageParam
    : "advanced";

  const skipQuiz =
    skipQuizParam === "1" ||
    skipQuizParam === "true" ||
    sourceParam === "hair_loss" ||
    isWomensHealthSource(sourceParam);
  const sourceProgram =
    sourceParam === "hair_loss"
      ? "hair_loss"
      : isWomensHealthSource(sourceParam)
        ? sourceParam || "womens_health"
        : sourceParam || undefined;
  const stepOrder = useMemo(
    () => (skipQuiz ? SKIP_QUIZ_STEP_ORDER : FULL_STEP_ORDER),
    [skipQuiz]
  );

  const [step, setStep] = useState<Step>("details");
  const selectedPlan = getBiomarkerSubscriptionPlan(panelTier);
  const [prefill, setPrefill] = useState<FunnelCheckoutPrefill | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [postcode, setPostcode] = useState("");

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [consentRecordId, setConsentRecordId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [portalMagicLink, setPortalMagicLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stepContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!skipQuiz && sourceParam !== "hair_loss" && !isWomensHealthSource(sourceParam)) {
      return;
    }
    const stored = readFunnelCheckoutPrefill(sourceParam);
    if (!stored) return;
    setPrefill(stored);
    if (stored.firstName) setFirstName(stored.firstName);
    if (stored.lastName) setLastName(stored.lastName);
    if (stored.email) setEmail(stored.email);
    if (stored.phone) setPhone(stored.phone);
    if (stored.postcode) setPostcode(stored.postcode);
    if (stored.dateOfBirth) setDateOfBirth(toIsoDateInput(stored.dateOfBirth));
  }, [skipQuiz, sourceParam]);

  useLayoutEffect(() => {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    stepContentRef.current?.scrollIntoView({ block: "start" });
  }, [step]);

  const stepIndex = (current: Step) => stepOrder.indexOf(current) + 1;

  const canProceedDetails =
    firstName.trim() && lastName.trim() && email.trim() && phone.trim() && postcode.length >= 4;

  const finalizeEnrollment = async (answers: Record<string, string> = {}) => {
    if (!userId || !paymentIntentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/public/biomarkers-checkout/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          paymentIntentId,
          publicPanelTier: panelTier,
          answers,
          skipQuiz,
          sourceProgram,
          priorQuizAnswers:
            prefill?.womensQuizAnswers ||
            prefill?.hairQuizAnswers ||
            (prefill?.resolvedProgram
              ? { resolvedProgram: prefill.resolvedProgram }
              : undefined),
          clientOrigin: typeof window !== "undefined" ? window.location.origin : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to complete enrollment");
      if (typeof data.magicLink === "string" && data.magicLink) {
        setPortalMagicLink(data.magicLink);
      }
      try {
        sessionStorage.removeItem("hair_biomarkers_checkout");
        sessionStorage.removeItem("womens_biomarkers_checkout");
      } catch {
        // ignore
      }
      setStep("activate");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not complete enrollment");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const createPaymentIntent = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/public/biomarkers-checkout/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicPanelTier: panelTier,
          firstName,
          lastName,
          email,
          phone,
          postcode,
          sourceProgram,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initialize payment");
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setStep("payment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (result: CheckoutPaymentSuccess) => {
    if (!result.paymentIntentId) return;
    setPaymentIntentId(result.paymentIntentId);
    setConsentRecordId(result.consentRecordId ?? null);
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/public/biomarkers-checkout/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId: result.paymentIntentId,
          consentRecordId: result.consentRecordId,
          firstName,
          lastName,
          email,
          phone,
          postcode,
          dateOfBirth: dateOfBirth || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to activate account");
      setUserId(data.userId);
      setStep("doctor");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Activation failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizComplete = async (answers: Record<string, string>) => {
    await finalizeEnrollment(answers);
  };

  const handleDoctorComplete = async () => {
    if (skipQuiz) {
      await finalizeEnrollment({});
      return;
    }
    setStep("quiz");
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-[#f4f7f2] to-white py-12 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#5c7a52]">
                Step {stepIndex(step)} of {stepOrder.length}
              </span>
              <span className="text-sm text-[#5c7a52]">{STEP_LABELS[step]}</span>
            </div>
            <div className="h-2 bg-[#e6ebe3] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#5c7a52] rounded-full transition-all duration-500"
                style={{ width: `${(stepIndex(step) / stepOrder.length) * 100}%` }}
              />
            </div>
          </div>

          {skipQuiz && sourceProgram === "hair_loss" && (
            <div className="mb-6 rounded-2xl border border-[#cdd8c6] bg-[#f4f7f2] p-4 text-sm text-[#34412f]">
              Continuing from your hair assessment — your questionnaire is already complete.
              After payment and your doctor consultation, we&apos;ll activate your Advanced panel.
            </div>
          )}

          {skipQuiz && isWomensHealthSource(sourceProgram) && (
            <div className="mb-6 rounded-2xl border border-[#f8e1e1] bg-[#fef4f0] p-4 text-sm text-[#34412f]">
              Continuing from your women&apos;s health assessment — your questionnaire is already
              complete. After payment and your doctor consultation, we&apos;ll activate your{" "}
              {selectedPlan.name} panel.
            </div>
          )}

          <div className="bg-white rounded-2xl border border-[#e6ebe3] p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#5c7a52]/10 flex items-center justify-center">
                  <Beaker className="w-6 h-6 text-[#5c7a52]" />
                </div>
                <div>
                  <p className="font-medium text-[#2c3628]">{selectedPlan.name} Panel</p>
                  <p className="text-sm text-[#7e9a72]">
                    {selectedPlan.markerCount} biomarkers · {selectedPlan.billingLabel}
                  </p>
                </div>
              </div>
              <p className="text-2xl font-serif text-[#2c3628]">${selectedPlan.priceAud}</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div ref={stepContentRef} className="scroll-mt-6" aria-hidden="true" />

          {step === "details" && (
            <div>
              <h1 className="text-2xl lg:text-3xl font-serif text-[#2c3628] mb-2">Your details</h1>
              <p className="text-[#5c7a52] mb-8">
                We&apos;ll use this to set up your account and doctor consultation
              </p>

              <div className="space-y-6 mb-8">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2c3628] mb-2">First name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a8bb9e]" />
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#e6ebe3] bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2c3628] mb-2">Last name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[#e6ebe3] bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2c3628] mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a8bb9e]" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#e6ebe3] bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2c3628] mb-2">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a8bb9e]" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#e6ebe3] bg-white"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2c3628] mb-2">
                      Date of birth
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a8bb9e]" />
                      <input
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#e6ebe3] bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2c3628] mb-2">Postcode</label>
                    <input
                      type="text"
                      value={postcode}
                      onChange={(e) => setPostcode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="e.g. 2000"
                      className="w-full px-4 py-3 rounded-xl border border-[#e6ebe3] bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t border-[#e6ebe3]">
                <Link
                  href={
                    sourceProgram === "hair_loss"
                      ? "/hair-assessment"
                      : isWomensHealthSource(sourceProgram)
                        ? "/womens-health/assessment"
                        : "/biomarker-intake"
                  }
                  className="btn-secondary flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </Link>
                <button
                  type="button"
                  onClick={createPaymentIntent}
                  disabled={!canProceedDetails || isLoading}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Continue to payment
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === "payment" && clientSecret && (
            <div>
              <h1 className="text-2xl lg:text-3xl font-serif text-[#2c3628] mb-2">Payment</h1>
              <p className="text-[#5c7a52] mb-8">Secure annual membership — powered by Stripe</p>

              <div className="grid lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3">
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <BiomarkersPaymentForm
                      onSuccess={handlePaymentSuccess}
                      amountAud={selectedPlan.priceAud}
                      customerEmail={email}
                    />
                  </Elements>
                  <div className="flex items-center gap-2 mt-4 text-xs text-[#7e9a72]">
                    <Shield className="w-4 h-4" />
                    Encrypted and secure
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <div className="bg-[#f4f7f2] rounded-2xl p-6 sticky top-8">
                    <h3 className="font-medium text-[#2c3628] mb-4">Order summary</h3>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-[#5c7a52]">{selectedPlan.name} Panel</span>
                      <span>${selectedPlan.priceAud}</span>
                    </div>
                    <div className="mt-3 mb-4 space-y-2 rounded-xl border border-[#e6ebe3] bg-white/70 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#5c7a52]">
                        Your price includes
                      </p>
                      {[
                        "Your initial doctor consultation",
                        "12-month access to Biological Age & Biomarkers Portal",
                        "Comprehensive health overview for your treatment plan",
                      ].map((item) => (
                        <div key={item} className="flex items-start gap-2 text-sm text-[#34412f]">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#5c7a52]" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between pt-4 border-t border-[#e6ebe3]">
                      <span className="font-medium">Total due today</span>
                      <span className="text-xl font-serif">${selectedPlan.priceAud}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="btn-secondary flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
              </div>
            </div>
          )}

          {step === "doctor" && userId && paymentIntentId && consentRecordId && (
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Stethoscope className="w-7 h-7 text-[#5c7a52]" />
                <h1 className="text-2xl lg:text-3xl font-serif text-[#2c3628]">
                  Book your doctor consultation
                </h1>
              </div>
              <p className="text-[#5c7a52] mb-8">
                Your doctor will review your health profile and arrange your pathology referral after
                this call. Choose a phone consultation time that suits you.
              </p>

              <div className="bg-white rounded-2xl border border-[#e6ebe3] p-6">
                <BiomarkersDoctorBooking
                  userId={userId}
                  paymentIntentId={paymentIntentId}
                  consentRecordId={consentRecordId}
                  firstName={firstName}
                  lastName={lastName}
                  email={email}
                  phone={phone}
                  postcode={postcode}
                  sourceProgram={sourceProgram}
                  onComplete={() => {
                    void handleDoctorComplete();
                  }}
                />
              </div>
            </div>
          )}

          {step === "doctor" && userId && paymentIntentId && !consentRecordId && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
              <p className="font-semibold text-amber-900 mb-2">Payment consent required</p>
              <p className="text-sm text-amber-800 mb-4">
                We could not verify your payment consent for this session. Please return to payment
                and complete checkout again.
              </p>
              <button
                type="button"
                onClick={() => setStep("payment")}
                className="btn-primary inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to payment
              </button>
            </div>
          )}

          {step === "quiz" && !skipQuiz && (
            <div>
              <div className="mb-4 shrink-0">
                <h1 className="text-2xl font-serif text-[#2c3628] lg:text-3xl">
                  Health questionnaire
                </h1>
                <p className="mt-1 text-sm text-[#5c7a52]">
                  A few quick questions so your doctor can personalise your panel.
                </p>
              </div>
              <PublicBiomarkersPanelQuiz
                tier={panelTier}
                onComplete={handleQuizComplete}
                onBack={() => setStep("doctor")}
              />
            </div>
          )}

          {step === "activate" && (
            <div className="text-center max-w-lg mx-auto">
              <div className="w-20 h-20 rounded-full bg-[#5c7a52] flex items-center justify-center mx-auto mb-8">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-serif text-[#2c3628] mb-4">Activate your portal</h1>
              <p className="text-[#5c7a52] mb-8">
                Your {selectedPlan.name} biomarkers program is enrolled.
                {sourceProgram === "hair_loss"
                  ? " Set your password to unlock Hair Loss and your Biomarkers portal."
                  : isWomensHealthSource(sourceProgram)
                    ? " Set your password to unlock Women's Health and your Biomarkers portal."
                  : " Set your password to open your Biological Age and Biomarkers portal."}
              </p>

              <div className="bg-[#f4f7f2] rounded-2xl p-6 mb-8 text-left space-y-3">
                <div className="flex items-center gap-2 text-sm text-[#34412f]">
                  <Check className="w-4 h-4 text-[#5c7a52]" />
                  {selectedPlan.name} panel membership active
                </div>
                <div className="flex items-center gap-2 text-sm text-[#34412f]">
                  <Check className="w-4 h-4 text-[#5c7a52]" />
                  Initial doctor consultation included
                </div>
                <div className="flex items-center gap-2 text-sm text-[#34412f]">
                  <Check className="w-4 h-4 text-[#5c7a52]" />
                  12-month Biological Age & Biomarkers Portal access
                </div>
                {sourceProgram === "hair_loss" && (
                  <div className="flex items-center gap-2 text-sm text-[#34412f]">
                    <Check className="w-4 h-4 text-[#5c7a52]" />
                    Hair Loss program section unlocked
                  </div>
                )}
                {isWomensHealthSource(sourceProgram) && (
                  <div className="flex items-center gap-2 text-sm text-[#34412f]">
                    <Check className="w-4 h-4 text-[#5c7a52]" />
                    Women&apos;s Health program section unlocked
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-[#34412f]">
                  <Check className="w-4 h-4 text-[#5c7a52]" />
                  {skipQuiz
                    ? isWomensHealthSource(sourceProgram)
                      ? "Women's health questionnaire already completed"
                      : sourceProgram === "hair_loss"
                        ? "Hair assessment questionnaire already completed"
                        : "Prior assessment questionnaire already completed"
                    : "Clinical questionnaire submitted"}
                </div>
              </div>

              <a
                href={
                  portalMagicLink ||
                  `/login?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(
                    sourceProgram === "hair_loss"
                      ? "/dashboard/programs?onboarding=hair-biomarkers"
                      : isWomensHealthSource(sourceProgram)
                        ? "/dashboard/womens-health?onboarding=womens-biomarkers"
                      : "/dashboard/programs"
                  )}`
                }
                className="btn-primary inline-flex items-center gap-2 w-full justify-center py-4"
              >
                <Sparkles className="w-5 h-5" />
                {portalMagicLink ? "Set password & activate portal" : "Go to my portal"}
                <ArrowRight className="w-5 h-5" />
              </a>
              <p className="text-xs text-[#7e9a72] mt-4">
                {portalMagicLink
                  ? `We'll open a secure link for ${email} so you can choose your portal password — same as weight management.`
                  : `Use the email you provided (${email}) to sign in or set your password.`}
              </p>
            </div>
          )}

          {isLoading && step !== "details" && step !== "payment" && (
            <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
              <Loader2 className="w-10 h-10 animate-spin text-white" />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function BiomarkersCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#5c7a52]" />
        </div>
      }
    >
      <BiomarkersCheckoutContent />
    </Suspense>
  );
}
