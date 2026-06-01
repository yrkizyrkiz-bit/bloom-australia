"use client";

import { useState, useEffect, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Check, Shield, Lock, ArrowRight, Mail, Phone, Loader2, Calendar, ExternalLink } from "lucide-react";
import Link from "next/link";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Cal.com configuration
const CALCOM_USERNAME = process.env.NEXT_PUBLIC_CALCOM_USERNAME || "sanative";
const CALCOM_EVENT_SLUG = process.env.NEXT_PUBLIC_CALCOM_EVENT_SLUG || "initial-consultation";

// ─── Cal.com Embed Hook ────────────────────────────────────────────────────
function useCalEmbed() {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if ((window as WindowWithCal).Cal) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://app.cal.com/embed/embed.js";
    script.async = true;
    script.onload = () => {
      const Cal = (window as WindowWithCal).Cal;
      if (Cal) {
        Cal("init", { origin: "https://app.cal.com" });
        setIsLoaded(true);
      }
    };
    document.head.appendChild(script);
  }, []);

  return isLoaded;
}

// ─── Cal.com Inline Embed Component ────────────────────────────────────────
function CalComEmbed({
  email,
  name,
  onBookingComplete,
}: {
  email: string;
  name: string;
  onBookingComplete: () => void;
}) {
  const isCalLoaded = useCalEmbed();
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const Cal = (window as WindowWithCal).Cal;
    if (!isCalLoaded || !Cal) return;

    Cal("inline", {
      elementOrSelector: "#cal-inline-embed",
      calLink: `${CALCOM_USERNAME}/${CALCOM_EVENT_SLUG}`,
      config: {
        name: name,
        email: email,
        theme: "light",
      },
    });

    Cal("on", {
      action: "bookingSuccessful",
      callback: () => {
        onBookingComplete();
      },
    });

    const timeout = setTimeout(() => {
      const embed = document.getElementById("cal-inline-embed");
      if (embed && embed.childElementCount === 0) {
        setShowFallback(true);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isCalLoaded, email, name, onBookingComplete]);

  if (!isCalLoaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div>
      <div
        id="cal-inline-embed"
        className="min-h-[500px] rounded-xl overflow-hidden border border-gray-200"
        style={{ width: "100%" }}
      />
      {showFallback && (
        <div className="mt-4 p-4 bg-gray-50 rounded-xl text-center">
          <p className="text-sm text-gray-600 mb-3">
            Having trouble loading the calendar?
          </p>
          <a
            href={`https://cal.com/${CALCOM_USERNAME}/${CALCOM_EVENT_SLUG}?email=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white
              rounded-lg text-sm font-medium hover:bg-black transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Open booking page
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}

// Type for window with Cal
interface WindowWithCal extends Window {
  Cal?: (action: string, ...args: unknown[]) => void;
}

// ─── Types ─────────────────────────────────────────────────────────────────
type Step = "verify" | "payment" | "onboard" | "booking" | "complete";

// ─── Constants ─────────────────────────────────────────────────────────────
const MEMBERSHIP_BENEFITS = [
  "Initial Doctor consultation to discuss your health goals",
  "1 comprehensive annual Biomarker report",
  "80+ biomarkers covering metabolic, nutrient, inflammation & biological age",
  "Biological Age Score",
  "Personalised Protocol with nutrition, supplements & lifestyle recommendations",
  "Unlimited chat support with Sanative Care partners",
  "24/7 AI Health Assistant",
  "Access to Sanative Marketplace",
  "Discounts on advanced testing & all Sanative programs",
];

// ─── Payment Form Component ────────────────────────────────────────────────
function PaymentForm({
  onSuccess,
}: {
  onSuccess: (paymentIntentId: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

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
      onSuccess(paymentIntent.id);
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
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-4 bg-[#f97316] hover:bg-[#ea580c] disabled:opacity-50
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
            Pay $199 AUD
          </>
        )}
      </button>
    </form>
  );
}

// ─── Main Checkout Page ────────────────────────────────────────────────────
export default function MembershipCheckoutPage() {
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

  // Booking state - now handled by Cal.com embed

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
      const res = await fetch("/api/stripe/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          email: email || (verifyMethod === "email" ? contact : null),
          postcode,
          firstName,
          lastName,
          phone: phone || (verifyMethod === "phone" ? contact : null),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setClientSecret(data.clientSecret);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize payment");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    setPaymentIntentId(paymentId);
    setStep("onboard");
  };

  const completeOnboarding = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/stripe/subscription", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId,
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
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUserId(data.userId);
      setStep("booking");
      // Booking is now handled by Cal.com embed
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  // Note: Booking is now handled by Cal.com embed, no manual slot management needed

  // ─── Render Steps ────────────────────────────────────────────────────────

  const renderVerificationStep = () => (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800
          rounded-full text-xs font-semibold mb-4">
          1
        </span>
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800
          rounded-full text-xs font-semibold mb-4">
          2
        </span>
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
                colorPrimary: "#f97316",
                borderRadius: "12px",
              },
            },
          }}
        >
          <PaymentForm onSuccess={handlePaymentSuccess} />
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800
          rounded-full text-xs font-semibold mb-4">
          3
        </span>
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
              Continue
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Get user's full name and email for Cal.com
  const fullName = `${firstName} ${lastName}`.trim();
  const userEmail = email || (verifyMethod === "email" ? contact : "");

  const handleBookingComplete = useCallback(() => {
    setStep("complete");
  }, []);

  const renderBookingStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200
        rounded-xl">
        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
          <Check className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm text-green-800 font-medium">Profile completed</span>
      </div>

      <div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-800
          rounded-full text-xs font-semibold mb-4">
          4
        </span>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          Book your initial consultation
        </h3>
        <p className="text-sm text-gray-500">
          Choose a time to speak with your Care Health Partner
        </p>
      </div>

      {/* Cal.com Embed */}
      <CalComEmbed
        email={userEmail}
        name={fullName}
        onBookingComplete={handleBookingComplete}
      />

      <button
        onClick={() => setStep("complete")}
        className="w-full text-sm text-gray-500 hover:text-gray-700"
      >
        Skip for now - I&apos;ll book later
      </button>
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
          Your membership is now active. Check your email for next steps.
        </p>
      </div>

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

      <div className="space-y-3">
        <Link
          href="/dashboard"
          className="block w-full py-3.5 bg-gray-900 hover:bg-black text-white
            font-semibold rounded-xl transition-colors"
        >
          Go to Dashboard
        </Link>
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
              <div className="mb-6">
                <span className="inline-block px-3 py-1 bg-[#f97316] text-white text-xs
                  font-semibold rounded-full">
                  Sanative Membership
                </span>
              </div>

              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                A health check like never before
              </h1>
              <p className="text-gray-500 mb-6">
                Access 80+ biomarkers, personalised protocols, and 24/7 health support.
              </p>

              {/* Trust indicator */}
              <div className="flex items-center gap-3 mb-8">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-400
                        border-2 border-white"
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">Trusted by thousands of members</span>
              </div>

              {/* Form steps */}
              {step === "verify" && renderVerificationStep()}
              {step === "payment" && renderPaymentStep()}
              {step === "onboard" && renderOnboardingStep()}
              {step === "booking" && renderBookingStep()}
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

              {/* Product image placeholder */}
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-6 mb-6
                flex items-center justify-center min-h-[200px]">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500
                    mx-auto mb-4 flex items-center justify-center">
                    <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 21a9 9 0 100-18 9 9 0 000 18z" />
                      <path d="M12 6v6l4 2" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-teal-900">Your Health Journey</p>
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-2">Sanative Membership</h3>
              <p className="text-sm text-gray-500 mb-4">
                80+ biomarkers, personalised protocols, and 24/7 access to your care team.
              </p>

              {/* Benefits list */}
              <div className="space-y-2 mb-6">
                {MEMBERSHIP_BENEFITS.slice(0, 5).map((benefit, i) => (
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
                  <span className="font-semibold">$199 <span className="text-gray-400 font-normal">/yr</span></span>
                </div>
                <div className="flex items-center justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>$199</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">Billed annually</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
