"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  Check,
  Shield,
  Lock,
  ArrowRight,
  ArrowLeft,
  Mail,
  Phone,
  Loader2,
  Calendar,
  Heart,
  Activity,
  Beaker,
} from "lucide-react";
import Link from "next/link";
import { MembershipConsultationBooking } from "@/components/membership/MembershipConsultationBooking";
import {
  ORGAN_CARE_CHECKOUT_PREFILL_KEY,
  type OrganCareCheckoutPrefill,
} from "@/lib/programs/organ-care-public-offer";
import { PrePaymentConsentCheckbox } from "@/components/legal/PrePaymentConsentCheckbox";
import type { CheckoutPaymentSuccess } from "@/lib/checkout/payment-success";
import {
  ensurePrePaymentConsentRecorded,
  paymentSourcePage,
} from "@/lib/legal/ensure-pre-payment-consent";
import {
  getBiomarkersQuizQuestions,
  isBiomarkersQuestionAnswered,
  parseBiomarkersAnswer,
  toggleBiomarkersMultiAnswer,
} from "@/lib/programs/quizzes/biomarkers-intake-quiz";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ─── Types ─────────────────────────────────────────────────────────────────
type Step = "verify" | "payment" | "onboard" | "booking" | "quiz" | "complete";

// ─── Constants ─────────────────────────────────────────────────────────────
const MEMBERSHIP_BENEFITS = [
  "Comprehensive Essential biomarker panel — 70+ markers",
  "Doctor consultation and pathology referral included",
  "Biological Clock & Organ Care dashboards",
  "Personalised health insights reviewed by AHPRA doctors",
  "First 30 days of your eligible care program included",
  "Care partner support and 24/7 AI Health Assistant",
];

const SUMMARY_ICONS = [
  { icon: Beaker, label: "Panel", color: "text-emerald-600", bg: "bg-emerald-50" },
  { icon: Activity, label: "Clock", color: "text-cyan-600", bg: "bg-cyan-50" },
  { icon: Heart, label: "Organs", color: "text-rose-500", bg: "bg-rose-50" },
] as const;

const INTENT_LABELS: Record<string, string> = {
  weight_management: "Weight Management",
  hair_loss: "Hair Loss",
  mens_health: "Men's Health",
  womens_health: "Women's Health",
  biomarkers: "Biomarker Testing",
};

// ─── Payment Form Component ────────────────────────────────────────────────
function PaymentForm({
  onSuccess,
  amountAud,
  customerEmail,
  userId,
}: {
  onSuccess: (result: CheckoutPaymentSuccess) => void;
  amountAud: number;
  customerEmail?: string;
  userId?: string;
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
      userId,
    });

    if (!consentResult.ok) {
      setError(consentResult.error);
      setIsProcessing(false);
      return;
    }

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/membership/checkout?step=complete`,
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
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

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
        className="w-full py-4 bg-[#4f6038] hover:bg-[#3c4a27] disabled:opacity-50
          text-white font-semibold rounded-xl text-base transition-colors
          flex items-center justify-center gap-2"
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

// ─── Inline Intake Quiz ────────────────────────────────────────────────────
function IntakeQuizStep({
  onDone,
  onSkip,
  saving,
  error,
}: {
  onDone: (answers: Record<string, string>) => void;
  onSkip: () => void;
  saving: boolean;
  error: string | null;
}) {
  const [quizIndex, setQuizIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const questions = useMemo(
    () => getBiomarkersQuizQuestions(undefined, answers),
    [answers]
  );
  const question = questions[quizIndex];

  const advanceAfterAnswer = (
    nextAnswers: Record<string, string>,
    answeredQuestionId: string
  ) => {
    // Clinical sex is a gate question: until it's answered, the quiz only
    // contains that one item. After it, the full gender-specific list loads —
    // never treat the sex question as "last".
    if (answeredQuestionId === "clinicalSex") {
      setQuizIndex(0);
      return;
    }

    const nextQuestions = getBiomarkersQuizQuestions(undefined, nextAnswers);
    const nextIndex = quizIndex + 1;
    if (nextIndex >= nextQuestions.length) {
      onDone(nextAnswers);
      return;
    }
    setQuizIndex(nextIndex);
  };

  const selectAnswer = (optionId: string) => {
    if (!question) return;
    if (question.allowMultiple) {
      setAnswers((prev) => ({
        ...prev,
        [question.id]: toggleBiomarkersMultiAnswer(prev[question.id], optionId),
      }));
      return;
    }
    const next = { ...answers, [question.id]: optionId };
    setAnswers(next);
    advanceAfterAnswer(next, question.id);
  };

  const continueFromQuestion = () => {
    if (!question) return;
    if (!isBiomarkersQuestionAnswered(question, answers[question.id])) return;
    advanceAfterAnswer(answers, question.id);
  };

  const isLast =
    question?.id !== "clinicalSex" && quizIndex >= Math.max(questions.length - 1, 0);

  if (!question) return null;

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= quizIndex ? "bg-[#5c7a52]" : "bg-gray-200"}`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400">
        Question {quizIndex + 1} of {questions.length} · {question.sectionTitle}
      </p>

      <h3 className="text-lg font-semibold text-gray-900">{question.prompt}</h3>
      {question.subtitle && <p className="text-sm text-gray-500">{question.subtitle}</p>}
      {question.allowMultiple && (
        <p className="text-sm font-medium text-[#5c7a52]">Select all that apply</p>
      )}

      <div className="space-y-2.5">
        {question.options.map((option) => {
          const selected = question.allowMultiple
            ? parseBiomarkersAnswer(answers[question.id]).includes(option.id)
            : answers[question.id] === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => selectAnswer(option.id)}
              className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3.5 text-left transition-all ${
                selected
                  ? "border-[#5c7a52] bg-[#f4f7f2]"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <span className="flex items-start gap-3">
                {question.allowMultiple && (
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-xs ${
                      selected
                        ? "border-[#5c7a52] bg-[#5c7a52] text-white"
                        : "border-gray-300 bg-white"
                    }`}
                    aria-hidden
                  >
                    {selected ? "✓" : ""}
                  </span>
                )}
                <span>
                  <span className="block font-medium text-gray-900">{option.label}</span>
                  {option.description && (
                    <span className="mt-0.5 block text-sm text-gray-500">
                      {option.description}
                    </span>
                  )}
                </span>
              </span>
              {!question.allowMultiple && (
                <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" />
              )}
            </button>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {question.allowMultiple && (
        <button
          onClick={continueFromQuestion}
          disabled={!isBiomarkersQuestionAnswered(question, answers[question.id]) || saving}
          className="w-full py-3.5 bg-gray-900 hover:bg-black disabled:opacity-50
            text-white font-semibold rounded-xl transition-colors flex items-center
            justify-center gap-2"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : isLast ? "Finish" : "Continue"}
        </button>
      )}

      <div className="flex items-center justify-between">
        {quizIndex > 0 ? (
          <button
            onClick={() => setQuizIndex((i) => Math.max(0, i - 1))}
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
        ) : (
          <span />
        )}
        <button
          onClick={onSkip}
          disabled={saving}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          Skip — I&apos;ll complete it in my portal
        </button>
      </div>
    </div>
  );
}

// ─── Main Checkout Page ────────────────────────────────────────────────────
function MembershipCheckoutPageContent() {
  const searchParams = useSearchParams();
  const funnelSource = searchParams.get("source");
  const intentProgram = searchParams.get("intent");
  const [step, setStep] = useState<Step>("verify");
  const [verifyMethod, setVerifyMethod] = useState<"email" | "phone">("email");
  const [contact, setContact] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [existingUser, setExistingUser] = useState<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  } | null>(null);

  // Payment state
  const [postcode, setPostcode] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [consentRecordId, setConsentRecordId] = useState<string | null>(null);
  const [priceAud, setPriceAud] = useState(365);
  const [priceLabel, setPriceLabel] = useState("$365/yr");

  // Onboarding state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [suburb, setSuburb] = useState("");
  const [state, setState] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [consultationBooked, setConsultationBooked] = useState(false);
  const [quizDone, setQuizDone] = useState(false);
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);

  useEffect(() => {
    fetch("/api/public/membership-checkout/pricing")
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.amountAud === "number") setPriceAud(data.amountAud);
        if (typeof data.priceLabel === "string") setPriceLabel(data.priceLabel);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = localStorage.getItem(ORGAN_CARE_CHECKOUT_PREFILL_KEY);
    if (!raw) return;

    try {
      const prefill = JSON.parse(raw) as OrganCareCheckoutPrefill;
      const matchesSource = !funnelSource || prefill.source === funnelSource;
      if (!matchesSource || !prefill.email) return;

      setVerifyMethod("email");
      setContact(prefill.email);
      setEmail(prefill.email);
      if (prefill.firstName) setFirstName(prefill.firstName);
      if (prefill.lastName) setLastName(prefill.lastName);
      if (prefill.phone) setPhone(prefill.phone);
      if (prefill.dateOfBirth) setDateOfBirth(prefill.dateOfBirth);
      if (prefill.postcode) setPostcode(prefill.postcode);
    } catch {
      // ignore malformed prefill
    }
  }, [funnelSource]);

  // ─── Handlers ────────────────────────────────────────────────────────────

  const sendVerificationCode = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact, type: verifyMethod }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setCodeSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact, type: verifyMethod, code }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSessionToken(data.sessionToken);
      if (data.existingUser) {
        setExistingUser(data.existingUser);
        setFirstName(data.existingUser.firstName || "");
        setLastName(data.existingUser.lastName || "");
        setEmail(data.existingUser.email || "");
        setPhone(data.existingUser.phone || "");
      } else if (verifyMethod === "email") {
        setEmail(contact);
      } else {
        setPhone(contact);
      }
      setStep("payment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify code");
    } finally {
      setIsLoading(false);
    }
  };

  const createPaymentIntent = async () => {
    if (!postcode || postcode.length !== 4) {
      setError("Please enter a valid 4-digit postcode");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/public/membership-checkout/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          email: email || (verifyMethod === "email" ? contact : null),
          postcode,
          firstName,
          lastName,
          phone: phone || (verifyMethod === "phone" ? contact : null),
          intentProgram,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId ?? null);
      setSubscriptionId(data.subscriptionId ?? null);
      if (typeof data.amountAud === "number") setPriceAud(data.amountAud);
      if (typeof data.priceLabel === "string") setPriceLabel(data.priceLabel);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize payment");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (result: CheckoutPaymentSuccess) => {
    setPaymentIntentId(result.paymentIntentId ?? null);
    setConsentRecordId(result.consentRecordId);
    setStep("onboard");
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/public/membership-checkout/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId,
          subscriptionId,
          consentRecordId,
          sessionToken,
          firstName,
          lastName,
          email: email || (verifyMethod === "email" ? contact : null),
          phone: phone || (verifyMethod === "phone" ? contact : null),
          dateOfBirth,
          addressLine1,
          addressLine2,
          suburb,
          state,
          postcode,
          intentProgram,
          clientOrigin: typeof window !== "undefined" ? window.location.origin : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUserId(data.userId);
      setMagicLink(data.magicLink ?? null);
      setNeedsPassword(Boolean(data.needsPassword));
      setStep("booking");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  const submitQuiz = async (answers: Record<string, string> | null) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/public/membership-checkout/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          paymentIntentId,
          answers: answers ?? {},
          skipped: answers === null,
          intentProgram,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setQuizDone(answers !== null);
      setStep("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save your answers");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Render Steps ────────────────────────────────────────────────────────

  const stepBadge = (n: number) => (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#eef4e6] text-[#4f6038]
      rounded-full text-xs font-semibold mb-4"
    >
      {n}
    </span>
  );

  const renderVerificationStep = () => (
    <div className="space-y-6">
      <div>
        {stepBadge(1)}
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Create your account</h3>
        <p className="text-sm text-gray-500">
          We&apos;ll send you a verification code to confirm your identity
        </p>
      </div>

      {/* Method toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setVerifyMethod("email");
            setCodeSent(false);
            setCode("");
            setError(null);
          }}
          className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2
            transition-all ${
            verifyMethod === "email"
              ? "border-gray-900 bg-gray-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <Mail className="w-4 h-4" />
          <span className="font-medium">Email</span>
        </button>
        <button
          onClick={() => {
            setVerifyMethod("phone");
            setCodeSent(false);
            setCode("");
            setError(null);
          }}
          className={`flex-1 py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-2
            transition-all ${
            verifyMethod === "phone"
              ? "border-gray-900 bg-gray-50"
              : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <Phone className="w-4 h-4" />
          <span className="font-medium">Mobile</span>
        </button>
      </div>

      {!codeSent ? (
        <div className="space-y-4">
          <input
            type={verifyMethod === "email" ? "email" : "tel"}
            placeholder={verifyMethod === "email" ? "Enter your email" : "Enter mobile (04xx xxx xxx)"}
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="w-full border-2 border-gray-200 focus:border-gray-900 rounded-xl
              px-4 py-3.5 text-base outline-none transition-colors"
            autoFocus
          />
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <button
            onClick={sendVerificationCode}
            disabled={!contact || isLoading}
            className="w-full py-3.5 bg-gray-900 hover:bg-black disabled:opacity-50
              text-white font-semibold rounded-xl transition-colors flex items-center
              justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Send verification code
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-sm text-green-800">
              Code sent to{" "}
              <span className="font-semibold">
                {verifyMethod === "email" ? contact : `•••• ${contact.slice(-4)}`}
              </span>
            </p>
          </div>
          <div>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full border-2 border-gray-200 focus:border-gray-900 rounded-xl
                px-4 py-3.5 text-base text-center tracking-widest font-mono outline-none
                transition-colors"
              autoFocus
              maxLength={6}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <button
            onClick={verifyCode}
            disabled={code.length !== 6 || isLoading}
            className="w-full py-3.5 bg-gray-900 hover:bg-black disabled:opacity-50
              text-white font-semibold rounded-xl transition-colors flex items-center
              justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Verify code
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <button
            onClick={() => {
              setCodeSent(false);
              setCode("");
              setError(null);
            }}
            className="w-full text-sm text-gray-500 hover:text-gray-700"
          >
            Use a different {verifyMethod}
          </button>
        </div>
      )}
    </div>
  );

  const renderPaymentStep = () => (
    <div className="space-y-6">
      {/* Verified indicator */}
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200
        rounded-xl">
        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm text-green-800">
          Verified as{" "}
          <span className="font-medium">
            {verifyMethod === "email" ? contact : `•••• ${contact.slice(-4)}`}
          </span>
        </span>
        <button
          onClick={() => {
            setStep("verify");
            setCodeSent(false);
            setCode("");
            setClientSecret(null);
          }}
          className="ml-auto text-sm text-green-700 hover:text-green-900 font-medium"
        >
          Change
        </button>
      </div>

      <div>
        {stepBadge(2)}
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Payment</h3>
      </div>

      {/* Postcode input */}
      {!clientSecret && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Where are you located?
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Enter your postcode"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="w-full border-2 border-gray-200 focus:border-gray-900 rounded-xl
                px-4 py-3.5 text-base outline-none transition-colors"
              maxLength={4}
            />
          </div>
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          <button
            onClick={createPaymentIntent}
            disabled={postcode.length !== 4 || isLoading}
            className="w-full py-3.5 bg-gray-900 hover:bg-black disabled:opacity-50
              text-white font-semibold rounded-xl transition-colors flex items-center
              justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Continue to payment
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Stripe payment form */}
      {clientSecret && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "stripe",
              variables: {
                colorPrimary: "#4f6038",
                borderRadius: "12px",
              },
            },
          }}
        >
          <PaymentForm
            onSuccess={handlePaymentSuccess}
            amountAud={priceAud}
            customerEmail={existingUser?.email || (verifyMethod === "email" ? contact : email) || undefined}
            userId={existingUser?.id}
          />
        </Elements>
      )}
    </div>
  );

  const renderOnboardingStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200
        rounded-xl">
        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm text-green-800 font-medium">Payment successful</span>
      </div>

      <div>
        {stepBadge(3)}
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Complete your profile</h3>
        <p className="text-sm text-gray-500">
          We need a few more details to set up your membership
        </p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border-2 border-gray-200 focus:border-gray-900 rounded-xl
                px-4 py-3 text-base outline-none transition-colors"
              placeholder="First"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full border-2 border-gray-200 focus:border-gray-900 rounded-xl
                px-4 py-3 text-base outline-none transition-colors"
              placeholder="Last"
            />
          </div>
        </div>

        {verifyMethod !== "email" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-gray-200 focus:border-gray-900 rounded-xl
                px-4 py-3 text-base outline-none transition-colors"
              placeholder="you@example.com"
            />
          </div>
        )}

        {verifyMethod !== "phone" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border-2 border-gray-200 focus:border-gray-900 rounded-xl
                px-4 py-3 text-base outline-none transition-colors"
              placeholder="04xx xxx xxx"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of birth</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="DD/MM/YYYY"
            value={dateOfBirth}
            onChange={(e) => {
              let value = e.target.value.replace(/\D/g, "");
              if (value.length > 8) value = value.slice(0, 8);
              if (value.length >= 2) value = value.slice(0, 2) + "/" + value.slice(2);
              if (value.length >= 5) value = value.slice(0, 5) + "/" + value.slice(5);
              setDateOfBirth(value);
            }}
            className="w-full border-2 border-gray-200 focus:border-gray-900 rounded-xl
              px-4 py-3 text-base outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Street address</label>
          <input
            type="text"
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            className="w-full border-2 border-gray-200 focus:border-gray-900 rounded-xl
              px-4 py-3 text-base outline-none transition-colors"
            placeholder="123 Main St"
          />
        </div>

        <div>
          <input
            type="text"
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
            className="w-full border-2 border-gray-200 focus:border-gray-900 rounded-xl
              px-4 py-3 text-base outline-none transition-colors"
            placeholder="Unit / Apt (optional)"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Suburb</label>
            <input
              type="text"
              value={suburb}
              onChange={(e) => setSuburb(e.target.value)}
              className="w-full border-2 border-gray-200 focus:border-gray-900 rounded-xl
                px-4 py-3 text-base outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full border-2 border-gray-200 focus:border-gray-900 rounded-xl
                px-4 py-3 text-base outline-none transition-colors bg-white"
            >
              <option value="">Select</option>
              {["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          onClick={completeOnboarding}
          disabled={!firstName || !lastName || !dateOfBirth || isLoading}
          className="w-full py-3.5 bg-gray-900 hover:bg-black disabled:opacity-50
            text-white font-semibold rounded-xl transition-colors flex items-center
            justify-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Activate my membership
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Get user's email for booking
  const userEmail = email || (verifyMethod === "email" ? contact : "");

  const renderBookingStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200
        rounded-xl">
        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm text-green-800 font-medium">
          Membership active — welcome to Sanative
        </span>
      </div>

      <div>
        {stepBadge(4)}
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Book your doctor consultation
        </h3>
        <p className="text-sm text-gray-500">
          Your doctor reviews your health goals and issues the pathology request for your
          biomarker panel
        </p>
      </div>

      {userId && paymentIntentId && consentRecordId ? (
        <MembershipConsultationBooking
          userId={userId}
          paymentIntentId={paymentIntentId}
          consentRecordId={consentRecordId}
          firstName={firstName}
          lastName={lastName}
          email={userEmail}
          phone={phone}
          postcode={postcode}
          onComplete={() => {
            setConsultationBooked(true);
            setStep("quiz");
          }}
        />
      ) : (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          setConsultationBooked(false);
          setStep("quiz");
        }}
        className="w-full text-sm text-gray-500 hover:text-gray-700"
      >
        Skip for now - I&apos;ll book later
      </button>
    </div>
  );

  const renderQuizStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200
        rounded-xl">
        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm text-green-800 font-medium">
          {consultationBooked ? "Consultation booked" : "Membership active"}
        </span>
      </div>

      <div>
        {stepBadge(5)}
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Clinical intake</h3>
        <p className="text-sm text-gray-500">
          ~2 minutes · helps your doctor prepare and request the right tests
        </p>
      </div>

      <IntakeQuizStep
        onDone={(answers) => submitQuiz(answers)}
        onSkip={() => submitQuiz(null)}
        saving={isLoading}
        error={error}
      />
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center space-y-6 py-8">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
        <Check className="w-10 h-10 text-green-600" />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome to Sanative!
        </h2>
        <p className="text-gray-500">
          Your membership is active. We&apos;ve emailed you a secure sign-in link.
        </p>
      </div>

      {consultationBooked ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-green-600" />
            <p className="text-sm font-medium text-green-900">
              Consultation confirmed
            </p>
          </div>
          <p className="text-sm text-green-700">
            You&apos;ll receive a calendar invite with all the details shortly.
          </p>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-4 h-4 text-amber-700" />
            <p className="text-sm font-medium text-amber-900">
              Consultation not booked yet
            </p>
          </div>
          <p className="text-sm text-amber-800">
            Your membership is active. Book your doctor consultation from your
            dashboard when you&apos;re ready — we&apos;ll email you a reminder.
          </p>
        </div>
      )}

      {!quizDone && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left">
          <p className="text-sm text-gray-600">
            You skipped the clinical intake — complete it in your portal before your
            consultation so your doctor can prepare.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {magicLink ? (
          <a
            href={magicLink}
            className="block w-full py-3.5 bg-gray-900 hover:bg-black text-white
              font-semibold rounded-xl transition-colors"
          >
            {needsPassword ? "Set your password & open portal" : "Open my portal"}
          </a>
        ) : (
          <Link
            href="/dashboard"
            className="block w-full py-3.5 bg-gray-900 hover:bg-black text-white
              font-semibold rounded-xl transition-colors"
          >
            Go to Dashboard
          </Link>
        )}
        <Link
          href="/"
          className="block w-full py-3.5 border-2 border-gray-200 hover:border-gray-300
            text-gray-700 font-semibold rounded-xl transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  );

  // ─── Main Render ─────────────────────────────────────────────────────────

  const intentLabel = intentProgram ? INTENT_LABELS[intentProgram] ?? null : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-serif text-gray-900">
            Sanative
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 lg:py-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left column - Form */}
          <div className="order-2 lg:order-1">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 lg:p-8">
              {/* Membership badge */}
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="inline-block px-3 py-1 bg-[#4f6038] text-white text-xs
                  font-semibold rounded-full">
                  Sanative Membership
                </span>
                {intentLabel && (
                  <span className="inline-block px-3 py-1 bg-[#eef4e6] text-[#4f6038] text-xs
                    font-semibold rounded-full">
                    {intentLabel} pathway
                  </span>
                )}
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                One membership. Full clarity.
              </h1>
              <p className="text-gray-500 mb-6">
                Doctor-led biomarker testing and ongoing insights. {priceLabel} —
                auto-renews annually. Cancel anytime.
              </p>

              {/* Form steps */}
              {step === "verify" && renderVerificationStep()}
              {step === "payment" && renderPaymentStep()}
              {step === "onboard" && renderOnboardingStep()}
              {step === "booking" && renderBookingStep()}
              {step === "quiz" && renderQuizStep()}
              {step === "complete" && renderCompleteStep()}
            </div>

            {/* Security badges */}
            {step !== "complete" && (
              <div className="flex items-center justify-center gap-4 mt-6 text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  <span className="text-xs">256-bit SSL</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span className="text-xs">AHPRA Registered</span>
                </div>
              </div>
            )}
          </div>

          {/* Right column - Order summary */}
          <div className="order-1 lg:order-2">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 lg:p-8 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

              <div className="rounded-xl border border-[#d5e0cb] bg-gradient-to-br from-[#eef4e6]/80 to-[#e3ecd8]/50 p-5 mb-5">
                <div className="flex items-center justify-center gap-4 mb-4">
                  {SUMMARY_ICONS.map(({ icon: Icon, label, color, bg }) => (
                    <div key={label} className="flex flex-col items-center gap-1.5">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}>
                        <Icon className={`h-5 w-5 ${color}`} />
                      </div>
                      <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-center text-sm font-medium text-[#3c4a27]">
                  Essential biomarker panel + every health dashboard
                </p>
                <p className="text-center text-xs text-[#5c7a52] mt-1">
                  Biological Clock, Organ Care, heart, liver, kidney & more
                </p>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2">Sanative Membership</h3>
              <p className="text-sm text-gray-500 mb-4">
                $1 a day, charged annually to your card on file. Includes your comprehensive
                biomarker panel and doctor consultation.
              </p>

              {/* Benefits list */}
              <div className="space-y-2 mb-6">
                {MEMBERSHIP_BENEFITS.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-600">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Price */}
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600">Sanative Membership</span>
                  <span className="font-semibold">{priceLabel}</span>
                </div>
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>${priceAud}</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Everything included · auto-renews yearly · cancel anytime
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function MembershipCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <MembershipCheckoutPageContent />
    </Suspense>
  );
}
