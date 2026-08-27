"use client";

import { useEffect, useState, type FormEvent } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Check, Loader2, Lock, Shield } from "lucide-react";
import { PrePaymentConsentCheckbox } from "@/components/legal/PrePaymentConsentCheckbox";
import type { CheckoutPaymentSuccess } from "@/lib/checkout/payment-success";
import { stripePaymentMethodBillingDetails } from "@/lib/checkout/stripe-billing-details";
import { STRIPE_CHECKOUT_WALLETS } from "@/lib/checkout/stripe-payment-methods";
import {
  ensurePrePaymentConsentRecorded,
  paymentSourcePage,
} from "@/lib/legal/ensure-pre-payment-consent";
import marqueeStyles from "@/components/promo/sections/MembershipPricingCard.module.css";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const MEMBERSHIP_MARQUEE = [
  {
    src: "/images/membership/mens-marquee/biomarker-vial.webp",
    alt: "Sanative biomarker blood test vial with metabolic markers",
  },
  {
    src: "/images/membership/mens-marquee/organ-dashboard.webp",
    alt: "Sanative organ and metabolic health dashboard",
  },
  {
    src: "/images/membership/mens-marquee/app-insights.webp",
    alt: "Sanative app showing health score and biomarker insights",
  },
] as const;

const MEMBERSHIP_COPY =
  "Sanative starts with a comprehensive health check, including 85+ biomarkers, to help your doctor understand factors relevant to your health and weight.";

function ImageMarquee() {
  const loop = [...MEMBERSHIP_MARQUEE, ...MEMBERSHIP_MARQUEE];
  return (
    <div className={marqueeStyles.viewport} aria-hidden>
      <div className={marqueeStyles.track}>
        {loop.map((item, index) => (
          // eslint-disable-next-line @next/next/no-img-element -- CSS marquee needs plain imgs
          <img
            key={`${item.src}-${index}`}
            src={item.src}
            alt=""
            className="h-40 w-64 sm:h-48 sm:w-80 shrink-0 rounded-2xl object-cover"
            draggable={false}
          />
        ))}
      </div>
    </div>
  );
}

function CardPaymentForm({
  amountAud,
  customerEmail,
  customerName,
  userId,
  onSuccess,
}: {
  amountAud: number;
  customerEmail?: string;
  customerName?: string;
  userId?: string;
  onSuccess: (result: CheckoutPaymentSuccess) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
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
        return_url: `${window.location.origin}/weight-management/assessment`,
        ...stripePaymentMethodBillingDetails({
          name: customerName,
          email: customerEmail,
        }),
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
      return;
    }

    setError("Payment was not completed. Please try again.");
    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#c17a58] mb-2">
          Payment
        </p>
        <h1 className="text-2xl sm:text-3xl font-semibold text-[#1c1c1c] tracking-tight">
          Enter your card details
        </h1>
        <p className="mt-1.5 text-sm text-black/55">
          Pay ${amountAud} for Sanative Membership. Auto-renews annually. Cancel anytime.
        </p>
      </div>

      <PaymentElement
        options={{
          layout: "tabs",
          wallets: STRIPE_CHECKOUT_WALLETS,
          fields: {
            billingDetails: {
              email: "never",
              name: "never",
            },
          },
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
        className="w-full py-4 bg-[#1c1c1c] hover:bg-black disabled:opacity-50 text-white font-semibold rounded-full text-base transition-colors flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay $${amountAud}`
        )}
      </button>

      <div className="flex items-center justify-center gap-4 text-black/35">
        <span className="inline-flex items-center gap-1.5 text-xs">
          <Lock className="w-3.5 h-3.5" />
          256-bit SSL
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs">
          <Shield className="w-3.5 h-3.5" />
          AHPRA registered
        </span>
      </div>
    </form>
  );
}

export function FunnelMembershipPaymentScreen({
  userId,
  email,
  firstName,
  lastName,
  phone,
  dateOfBirth,
  gender,
  streetAddress,
  addressUnit,
  suburb,
  state,
  postcode,
  alreadyPaid,
  onContinueAfterPaid,
  onSuccess,
  onError,
}: {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  streetAddress?: string;
  addressUnit?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  alreadyPaid?: boolean;
  onContinueAfterPaid?: () => void;
  onSuccess: (result: CheckoutPaymentSuccess) => void;
  onError: (error: string) => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [amountAud, setAmountAud] = useState(365);
  const [priceLabel, setPriceLabel] = useState("$365/yr");
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    if (alreadyPaid) return;

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setInitError(null);
      try {
        const res = await fetch("/api/public/membership-checkout/funnel-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            email,
            phone,
            firstName,
            lastName,
            postcode,
            intentProgram: "weight_management",
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to initialise payment");
        if (cancelled) return;
        setClientSecret(data.clientSecret);
        setSubscriptionId(data.subscriptionId ?? null);
        if (typeof data.amountAud === "number") setAmountAud(data.amountAud);
        if (typeof data.priceLabel === "string") setPriceLabel(data.priceLabel);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Failed to initialise payment";
        setInitError(message);
        onError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
    // onError is unstable from the parent; only re-init when account fields change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alreadyPaid, userId, email, phone, firstName, lastName, postcode]);

  const handlePaid = async (result: CheckoutPaymentSuccess) => {
    setActivating(true);
    try {
      const res = await fetch("/api/public/membership-checkout/funnel-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          paymentIntentId: result.paymentIntentId,
          subscriptionId,
          consentRecordId: result.consentRecordId,
          firstName,
          lastName,
          email,
          phone,
          dateOfBirth,
          addressLine1: streetAddress,
          addressLine2: addressUnit,
          suburb,
          state,
          postcode,
          gender,
          intentProgram: "weight_management",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Payment succeeded but membership could not be activated");
      onSuccess(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not activate membership";
      onError(message);
    } finally {
      setActivating(false);
    }
  };

  const summary = (
    <div className="bg-white rounded-2xl border border-black/10 shadow-[0_8px_40px_rgba(0,0,0,0.06)] p-5 sm:p-6 lg:p-7">
      <p className="text-sm font-semibold text-[#1c1c1c] mb-4">Order summary</p>
      <ImageMarquee />
      <p className="mt-5 text-sm leading-relaxed text-black/70">{MEMBERSHIP_COPY}</p>
        <div className="mt-6 pt-5 border-t border-black/10">
        <h2 className="text-lg font-semibold text-[#1c1c1c]">Sanative Membership</h2>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-4xl font-semibold tracking-tight text-[#1c1c1c] tabular-nums">
            $1
          </span>
          <span className="text-base text-black/60">a day</span>
        </div>
        <p className="mt-1 text-sm text-black/50">{priceLabel.replace("/yr", "")} billed annually</p>
        <div className="mt-5 flex items-center justify-between text-base font-semibold text-[#1c1c1c]">
          <span>Total</span>
          <span>${amountAud}</span>
        </div>
        <p className="mt-2 text-xs text-black/40">
          Auto-renews yearly · cancel anytime
        </p>
      </div>
    </div>
  );

  const summaryColumn = (
    <div className="space-y-3 lg:sticky lg:top-8">
      {summary}
      <div className="rounded-2xl border border-[#e6ebe3] bg-[#f4f7f2] px-4 py-3.5">
        <p className="text-sm leading-relaxed text-[#2c3628]">
          Your first 30 days of doctor-led medical weight loss care are included. After that,
          continue for $360 every three months. Cancel anytime.
        </p>
      </div>
    </div>
  );

  if (alreadyPaid) {
    return (
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div className="order-2 lg:order-1 bg-white rounded-2xl border border-black/10 p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
              <Check className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium text-green-800">Payment successful</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#1c1c1c]">You&apos;re a member</h1>
          <p className="text-sm text-black/60">
            Next, book your doctor consultation. A care partner assigns your doctor and you enter triage.
          </p>
          <button
            type="button"
            onClick={onContinueAfterPaid}
            className="w-full py-4 bg-[#1c1c1c] hover:bg-black text-white font-semibold rounded-full"
          >
            Book your doctor
          </button>
        </div>
        <div className="order-1 lg:order-2">{summaryColumn}</div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
      <div className="order-2 lg:order-1 bg-white rounded-2xl border border-black/10 p-6 sm:p-8">
        {activating ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#4f6038]" />
            <p className="text-sm text-black/55">Activating your membership...</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#4f6038]" />
            <p className="text-sm text-black/55">Preparing secure payment...</p>
          </div>
        ) : initError ? (
          <p className="text-sm text-red-600">{initError}</p>
        ) : clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#1c1c1c",
                  borderRadius: "12px",
                },
              },
            }}
          >
            <CardPaymentForm
              amountAud={amountAud}
              customerEmail={email}
              customerName={`${firstName} ${lastName}`.trim()}
              userId={userId}
              onSuccess={handlePaid}
            />
          </Elements>
        ) : null}
      </div>
      <div className="order-1 lg:order-2">{summaryColumn}</div>
    </div>
  );
}
