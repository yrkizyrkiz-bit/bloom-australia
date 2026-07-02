"use client";

import { useState, Suspense } from "react";
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

const STEP_ORDER: Step[] = ["details", "payment", "doctor", "quiz", "activate"];

function stepIndex(step: Step) {
  return STEP_ORDER.indexOf(step) + 1;
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
  const panelTier: BiomarkerSubscriptionTier = isValidPublicPanelTier(packageParam)
    ? packageParam
    : "advanced";

  const [step, setStep] = useState<Step>("details");
  const selectedPlan = getBiomarkerSubscriptionPlan(panelTier);

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canProceedDetails =
    firstName.trim() && lastName.trim() && email.trim() && phone.trim() && postcode.length >= 4;

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
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to complete enrollment");
      setStep("activate");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save questionnaire");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-[#f4f7f2] to-white py-12 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#5c7a52]">
                Step {stepIndex(step)} of {STEP_ORDER.length}
              </span>
              <span className="text-sm text-[#5c7a52]">{STEP_LABELS[step]}</span>
            </div>
            <div className="h-2 bg-[#e6ebe3] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#5c7a52] rounded-full transition-all duration-500"
                style={{ width: `${(stepIndex(step) / STEP_ORDER.length) * 100}%` }}
              />
            </div>
          </div>

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
                <Link href="/biomarker-intake" className="btn-secondary flex items-center gap-2">
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
                    <div className="flex justify-between text-sm mb-4">
                      <span className="text-[#5c7a52]">Doctor consultation</span>
                      <span className="text-[#5c7a52]">Included</span>
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

          {step === "doctor" && userId && paymentIntentId && (
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
                  consentRecordId={consentRecordId ?? ""}
                  firstName={firstName}
                  lastName={lastName}
                  email={email}
                  phone={phone}
                  postcode={postcode}
                  onComplete={() => setStep("quiz")}
                />
              </div>
            </div>
          )}

          {step === "quiz" && (
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
                Your {selectedPlan.name} biomarkers program is enrolled. Sign in to track results,
                biological age, and your personalised care plan.
              </p>

              <div className="bg-[#f4f7f2] rounded-2xl p-6 mb-8 text-left space-y-3">
                <div className="flex items-center gap-2 text-sm text-[#34412f]">
                  <Check className="w-4 h-4 text-[#5c7a52]" />
                  {selectedPlan.name} panel membership active
                </div>
                <div className="flex items-center gap-2 text-sm text-[#34412f]">
                  <Check className="w-4 h-4 text-[#5c7a52]" />
                  Doctor consultation booked
                </div>
                <div className="flex items-center gap-2 text-sm text-[#34412f]">
                  <Check className="w-4 h-4 text-[#5c7a52]" />
                  Clinical questionnaire submitted
                </div>
              </div>

              <Link
                href={`/login?email=${encodeURIComponent(email)}`}
                className="btn-primary inline-flex items-center gap-2 w-full justify-center py-4"
              >
                <Sparkles className="w-5 h-5" />
                Go to my portal
                <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-xs text-[#7e9a72] mt-4">
                Use the email you provided ({email}) to sign in or set your password.
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
