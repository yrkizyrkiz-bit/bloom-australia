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

const STEP_SHORT_LABELS: Record<Step, string> = {
  details: "Details",
  payment: "Payment",
  doctor: "Consult",
  quiz: "Quiz",
  activate: "Activate",
};

const FULL_STEP_ORDER: Step[] = ["details", "payment", "doctor", "quiz", "activate"];
const SKIP_QUIZ_STEP_ORDER: Step[] = ["details", "payment", "doctor", "activate"];

function CheckoutStepProgress({
  steps,
  current,
}: {
  steps: Step[];
  current: Step;
}) {
  const currentIndex = steps.indexOf(current);

  return (
    <nav aria-label="Checkout progress" className="mb-3 lg:mb-4">
      <ol className="flex items-center w-full">
        {steps.map((stepKey, index) => {
          const isComplete = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={stepKey}
              className={`flex items-center ${isLast ? "flex-shrink-0" : "flex-1"}`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <div
                  className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-semibold transition-all duration-300 ${
                    isComplete
                      ? "border-[#2D6A5F] bg-[#2D6A5F] text-white"
                      : isCurrent
                        ? "border-[#2D6A5F] bg-white text-[#2D6A5F] shadow-[0_0_0_3px_rgba(45,106,95,0.12)]"
                        : "border-gray-200 bg-white text-gray-400"
                  }`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isComplete ? (
                    <Check className="h-3 w-3" strokeWidth={2.5} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={`hidden sm:inline text-xs font-medium whitespace-nowrap ${
                    isComplete || isCurrent ? "text-[#2D6A5F]" : "text-gray-400"
                  }`}
                >
                  {STEP_SHORT_LABELS[stepKey]}
                </span>
              </div>

              {!isLast && (
                <div
                  className="mx-2 sm:mx-3 h-0.5 flex-1 rounded-full transition-colors duration-500"
                  aria-hidden="true"
                  style={{
                    backgroundColor:
                      index < currentIndex ? "#2D6A5F" : "#e5e7eb",
                  }}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

import {
  clearProgramBiomarkersHandoff,
  isProgramBiomarkersCheckoutSource,
  isWomensHealthCheckoutSource,
  persistProgramBiomarkersHandoff,
  readProgramBiomarkersHandoff,
  shouldSkipBiomarkersQuiz,
  type ProgramBiomarkersCheckoutHandoff,
} from "@/lib/funnel/program-biomarkers-checkout-handoff";

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
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 py-3"
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

function BiomarkersPanelOrderSummary({
  plan,
}: {
  plan: ReturnType<typeof getBiomarkerSubscriptionPlan>;
}) {
  const includeItems = [
    "Initial doctor consultation",
    "At-home collection kit",
    "12-month Biomarkers Portal",
    "Pathology organised near you",
  ];
  const highlightItems = (plan.highlights ?? []).slice(0, 3);
  const testItems = (plan.pathologyTests ?? []).slice(0, 4);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-3.5 lg:p-4 h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <h2 className="text-sm font-semibold text-gray-900">Order Summary</h2>
        {plan.popular && (
          <span className="rounded-full bg-[#2D6A5F] px-2 py-0.5 text-[10px] font-semibold text-white">
            Most popular
          </span>
        )}
      </div>

      <div className="rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50/80 to-emerald-50/50 px-3 py-2.5 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white shadow-sm">
            <Beaker className="h-4 w-4 text-[#2D6A5F]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-teal-950 leading-tight">
              {plan.name} Biomarker Panel
            </p>
            <p className="text-[11px] text-teal-700 mt-0.5">
              {plan.markerCount} markers · ${plan.priceAud}/{plan.billingLabel.replace(/^per /, "")}
            </p>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-teal-900/80 leading-snug line-clamp-2">
          {plan.tagline}
        </p>
      </div>

      <div className="flex-1 min-h-0 space-y-2.5 overflow-hidden">
        <div>
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Includes
          </p>
          <div className="grid grid-cols-1 gap-1">
            {includeItems.map((item) => (
              <div key={item} className="flex items-start gap-1.5">
                <Check className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-[11px] text-gray-600 leading-snug">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {highlightItems.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Panel highlights
            </p>
            <div className="grid grid-cols-1 gap-1">
              {highlightItems.map((item) => (
                <div key={item} className="flex items-start gap-1.5">
                  <Check className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-[11px] text-gray-600 leading-snug line-clamp-2">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {testItems.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Key tests
            </p>
            <div className="grid grid-cols-1 gap-1">
              {testItems.map((item) => (
                <div key={item} className="flex items-start gap-1.5">
                  <Check className="w-3 h-3 text-[#2D6A5F] flex-shrink-0 mt-0.5" />
                  <span className="text-[11px] text-gray-600 leading-snug line-clamp-1">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 pt-2.5 mt-auto">
        <div className="flex items-center justify-between text-xs mb-0.5">
          <span className="text-gray-600">{plan.name} Panel</span>
          <span className="font-semibold">${plan.priceAud}</span>
        </div>
        <div className="flex items-center justify-between text-sm font-bold">
          <span>Total due today</span>
          <span>${plan.priceAud}</span>
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5">AUD · billed annually</p>
      </div>
    </div>
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
    shouldSkipBiomarkersQuiz(sourceParam);
  const sourceProgram =
    sourceParam === "hair_loss"
      ? "hair_loss"
      : isWomensHealthCheckoutSource(sourceParam)
        ? sourceParam || "womens_health"
        : sourceParam === "mens_health"
          ? "mens_health"
          : sourceParam || undefined;
  const stepOrder = useMemo(
    () => (skipQuiz ? SKIP_QUIZ_STEP_ORDER : FULL_STEP_ORDER),
    [skipQuiz]
  );

  const [step, setStep] = useState<Step>("details");
  const selectedPlan = getBiomarkerSubscriptionPlan(panelTier);
  const [prefill, setPrefill] = useState<ProgramBiomarkersCheckoutHandoff | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [postcode, setPostcode] = useState("");
  const [address, setAddress] = useState("");

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [consentRecordId, setConsentRecordId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [portalMagicLink, setPortalMagicLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stepContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!skipQuiz && !isProgramBiomarkersCheckoutSource(sourceParam)) {
      return;
    }
    const stored = readProgramBiomarkersHandoff(sourceParam);
    if (!stored) return;
    setPrefill(stored);
    if (stored.firstName) setFirstName(stored.firstName);
    if (stored.lastName) setLastName(stored.lastName);
    if (stored.email) setEmail(stored.email);
    if (stored.phone) setPhone(stored.phone);
    if (stored.postcode) setPostcode(stored.postcode);
    if (stored.address) setAddress(stored.address);
    if (
      !stored.address &&
      stored.quizAnswers &&
      typeof stored.quizAnswers.address === "string"
    ) {
      setAddress(stored.quizAnswers.address);
    }
    if (stored.dateOfBirth) setDateOfBirth(toIsoDateInput(stored.dateOfBirth));
  }, [skipQuiz, sourceParam]);

  useLayoutEffect(() => {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    stepContentRef.current?.scrollIntoView({ block: "start" });
  }, [step]);

  const canProceedDetails =
    firstName.trim() &&
    lastName.trim() &&
    email.trim() &&
    phone.trim() &&
    postcode.length >= 4 &&
    address.trim();

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
          priorQuizAnswers: prefill?.quizAnswers
            ? {
                ...prefill.quizAnswers,
                ...(prefill.resolvedProgram
                  ? { resolvedProgram: prefill.resolvedProgram }
                  : {}),
              }
            : undefined,
          clientOrigin: typeof window !== "undefined" ? window.location.origin : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to complete enrollment");
      if (typeof data.magicLink === "string" && data.magicLink) {
        setPortalMagicLink(data.magicLink);
      }
      try {
        clearProgramBiomarkersHandoff();
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
      if (prefill) {
        persistProgramBiomarkersHandoff({
          ...prefill,
          firstName,
          lastName,
          email,
          phone,
          postcode,
          address,
          dateOfBirth: dateOfBirth || prefill.dateOfBirth,
          quizAnswers: {
            ...(prefill.quizAnswers || {}),
            phone,
            postcode,
            address,
          },
        });
      }

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
          address,
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
          address,
          dateOfBirth: dateOfBirth || undefined,
          sourceProgram,
          priorQuizAnswers: prefill?.quizAnswers
            ? {
                ...prefill.quizAnswers,
                phone,
                postcode,
                address,
                ...(prefill.resolvedProgram
                  ? { resolvedProgram: prefill.resolvedProgram }
                  : {}),
              }
            : undefined,
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

  const showCheckoutSummary = step === "details" || step === "payment";

  const backHref =
    sourceProgram === "hair_loss"
      ? "/hair-assessment"
      : isWomensHealthCheckoutSource(sourceProgram)
        ? "/womens-health/assessment"
        : sourceProgram === "mens_health"
          ? "/mens-health/assessment"
          : "/biomarker-intake";

  return (
    <>
      <Header />
      <main
        className={`bg-gray-50 ${
          showCheckoutSummary
            ? "min-h-[calc(100dvh-4rem)] py-3 lg:py-4"
            : "min-h-screen py-5 lg:py-8"
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <CheckoutStepProgress steps={stepOrder} current={step} />

          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div ref={stepContentRef} className="scroll-mt-4" aria-hidden="true" />

          {showCheckoutSummary ? (
            <div className="grid lg:grid-cols-2 gap-4 lg:gap-5 lg:items-stretch lg:h-[calc(100dvh-15rem)]">
              <div className="order-2 lg:order-1 min-h-0 flex">
                <div className="bg-white rounded-2xl border border-gray-200 p-3.5 lg:p-4 w-full h-full flex flex-col min-h-0">
                  {step === "details" && (
                    <div className="flex flex-col flex-1 min-h-0">
                      <h1 className="text-lg lg:text-xl font-bold text-gray-900">
                        Your details
                      </h1>
                      <p className="text-xs text-gray-500 mt-0.5 mb-3">
                        Please check your details, enter your address and mobile number and
                        proceed to checkout.
                      </p>

                      <div className="space-y-2 flex-1 min-h-0">
                        <div className="grid sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">
                              First name
                            </label>
                            <div className="relative">
                              <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                              <input
                                type="text"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                className="w-full pl-8 pr-2.5 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">
                              Last name
                            </label>
                            <input
                              type="text"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              className="w-full px-2.5 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            Email
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full pl-8 pr-2.5 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                            />
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">
                              Mobile number
                            </label>
                            <div className="relative">
                              <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                              <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="04XX XXX XXX"
                                className="w-full pl-8 pr-2.5 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-0.5">
                              Postcode
                            </label>
                            <input
                              type="text"
                              value={postcode}
                              onChange={(e) =>
                                setPostcode(e.target.value.replace(/\D/g, "").slice(0, 4))
                              }
                              placeholder="e.g. 2000"
                              className="w-full px-2.5 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            Delivery address
                          </label>
                          <input
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Street address"
                            className="w-full px-2.5 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-0.5">
                            Date of birth
                          </label>
                          <div className="relative">
                            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                            <input
                              type="date"
                              value={dateOfBirth}
                              onChange={(e) => setDateOfBirth(e.target.value)}
                              className="w-full pl-8 pr-2.5 py-2 rounded-lg border border-gray-200 bg-white text-sm"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-3 mt-auto border-t border-gray-200">
                        <Link
                          href={backHref}
                          className="btn-secondary flex items-center gap-1.5 py-2 px-3 text-sm"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Back
                        </Link>
                        <div className="flex items-center gap-3 text-gray-400">
                          <span className="hidden sm:inline-flex items-center gap-1 text-[10px]">
                            <Lock className="w-3 h-3" />
                            SSL
                          </span>
                          <button
                            type="button"
                            onClick={createPaymentIntent}
                            disabled={!canProceedDetails || isLoading}
                            className="btn-primary flex items-center gap-1.5 disabled:opacity-50 py-2 px-3 text-sm"
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                Continue to payment
                                <ArrowRight className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {step === "payment" && clientSecret && (
                    <div className="flex flex-col flex-1 min-h-0">
                      <h1 className="text-lg lg:text-xl font-bold text-gray-900">Payment</h1>
                      <p className="text-xs text-gray-500 mt-0.5 mb-3">
                        Secure annual panel — powered by Stripe
                      </p>

                      <div className="flex-1 min-h-0 overflow-y-auto">
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                          <BiomarkersPaymentForm
                            onSuccess={handlePaymentSuccess}
                            amountAud={selectedPlan.priceAud}
                            customerEmail={email}
                          />
                        </Elements>
                      </div>

                      <button
                        type="button"
                        onClick={() => setStep("details")}
                        className="btn-secondary mt-3 flex items-center gap-1.5 py-2 px-3 text-sm self-start"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="order-1 lg:order-2 min-h-0 flex">
                <div className="w-full h-full min-h-[22rem] lg:min-h-0">
                  <BiomarkersPanelOrderSummary plan={selectedPlan} />
                </div>
              </div>
            </div>
          ) : (
            <>
              {step === "doctor" && userId && paymentIntentId && consentRecordId && (
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <Stethoscope className="w-7 h-7 text-[#5c7a52]" />
                    <h1 className="text-2xl lg:text-3xl font-serif text-[#2c3628]">
                      Book your doctor consultation
                    </h1>
                  </div>
                  <p className="text-[#5c7a52] mb-8">
                    Your doctor will review your health profile and arrange your pathology referral
                    after this call. Choose a phone consultation time that suits you.
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
                    We could not verify your payment consent for this session. Please return to
                    payment and complete checkout again.
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
                      : isWomensHealthCheckoutSource(sourceProgram)
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
                    {isWomensHealthCheckoutSource(sourceProgram) && (
                      <div className="flex items-center gap-2 text-sm text-[#34412f]">
                        <Check className="w-4 h-4 text-[#5c7a52]" />
                        Women&apos;s Health program section unlocked
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-[#34412f]">
                      <Check className="w-4 h-4 text-[#5c7a52]" />
                      {skipQuiz
                        ? isWomensHealthCheckoutSource(sourceProgram)
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
                          : isWomensHealthCheckoutSource(sourceProgram)
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
            </>
          )}

          {isLoading && step !== "details" && step !== "payment" && (
            <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
              <Loader2 className="w-10 h-10 animate-spin text-white" />
            </div>
          )}
        </div>
      </main>
      {!showCheckoutSummary && <Footer />}
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
