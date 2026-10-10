"use client";

import { Component, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
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
  consentStorageKey,
  isStripeTerminalElementsError,
  stripePaymentIntentCanInitializeElements,
  stripePaymentIntentIsSucceeded,
} from "@/lib/checkout/stripe-payment-intent-state";
import {
  ensurePrePaymentConsentRecorded,
  paymentSourcePage,
} from "@/lib/legal/ensure-pre-payment-consent";
import marqueeStyles from "@/components/promo/sections/MembershipPricingCard.module.css";
import { MEMBERSHIP_BENEFITS, MEMBERSHIP_PITCH } from "@/lib/membership/membership-benefits";
import { ORDER_SUMMARY_MARQUEE } from "@/lib/membership/order-summary-marquee";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

/** Stripe Dahlia rejects boolean `radios` — must be always | auto | never | if_multiple. */
const PAYMENT_ELEMENT_OPTIONS = {
  layout: {
    type: "accordion" as const,
    defaultCollapsed: false,
    radios: "never" as const,
    spacedAccordionItems: true,
  },
  wallets: STRIPE_CHECKOUT_WALLETS,
  fields: {
    billingDetails: {
      email: "never" as const,
      name: "never" as const,
    },
  },
};

class StripeFormErrorBoundary extends Component<
  { children: ReactNode; onError: (message: string) => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    this.props.onError(error.message || "Payment form failed to load");
  }

  render() {
    if (this.state.failed) {
      return (
        <p className="text-sm text-red-600">
          Payment form failed to load. Please refresh and try again.
        </p>
      );
    }
    return this.props.children;
  }
}

function readStoredConsentId(userId?: string, email?: string): string | undefined {
  try {
    return sessionStorage.getItem(consentStorageKey(userId || email || "anon")) || undefined;
  } catch {
    return undefined;
  }
}

function ImageMarquee() {
  const loop = [...ORDER_SUMMARY_MARQUEE, ...ORDER_SUMMARY_MARQUEE];
  return (
    <div
      className={`${marqueeStyles.viewport} ${marqueeStyles.viewportBlend} max-w-full`}
      aria-hidden
      title="Hover to pause"
    >
      <div className={marqueeStyles.track}>
        {loop.map((item, index) => {
          const isContain = item.fit === "contain";
          return (
            <div
              key={`${item.src}-${index}`}
              className={`${marqueeStyles.slide} ${marqueeStyles.slideBlend} h-40 w-64 sm:h-48 sm:w-80 lg:h-56 lg:w-[22rem]`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- CSS marquee needs plain imgs */}
              <img
                src={item.src}
                alt=""
                width={720}
                height={405}
                decoding="async"
                loading={index < 3 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                className={`${marqueeStyles.slideImg} ${
                  isContain ? "object-contain p-2 sm:p-3" : "object-cover"
                }`}
                draggable={false}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MembershipBenefitsList() {
  return (
    <div className="space-y-2.5 sm:space-y-3">
      {MEMBERSHIP_BENEFITS.map((benefit) => (
        <div key={benefit} className="flex items-start gap-2.5 sm:gap-3">
          <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <span className="text-sm sm:text-[15px] lg:text-base text-gray-700 leading-snug">
            {benefit}
          </span>
        </div>
      ))}
    </div>
  );
}

function CardPaymentForm({
  amountAud,
  customerEmail,
  customerName,
  userId,
  clientSecret,
  returnPath,
  onSuccess,
}: {
  amountAud: number;
  customerEmail?: string;
  customerName?: string;
  userId?: string;
  clientSecret: string;
  returnPath: string;
  onSuccess: (result: CheckoutPaymentSuccess) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

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

    try {
      sessionStorage.setItem(consentStorageKey(userId || customerEmail || "anon"), consentResult.consentRecordId);
    } catch {
      /* ignore */
    }

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${returnPath}`,
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
      setCompleted(true);
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

      <div className="w-full min-w-0 overflow-x-hidden [&_iframe]:max-w-full">
        {!completed ? (
          <PaymentElement
            options={PAYMENT_ELEMENT_OPTIONS}
            onLoadError={(event) => {
              const message = event.error?.message || "Payment form failed to load";
              if (!isStripeTerminalElementsError(message) || !stripe) {
                setError(message);
                return;
              }
              void stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
                if (stripePaymentIntentIsSucceeded(paymentIntent?.status) && paymentIntent) {
                  setCompleted(true);
                  onSuccess({
                    paymentIntentId: paymentIntent.id,
                    consentRecordId: readStoredConsentId(userId, customerEmail),
                  });
                  return;
                }
                setError(message);
              });
            }}
          />
        ) : null}
      </div>

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
          AHPRA Registered Doctors
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
  intentProgram = "weight_management",
  source = "weight_management_assessment",
  returnPath = "/weight-management/assessment",
  paymentNote = "Your first 30 days of doctor-led medical weight loss care are included. After that, continue for $360 every three months. Cancel anytime.",
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
  intentProgram?: string;
  source?: string;
  returnPath?: string;
  /** Accepted for callers; Order Summary uses shared membership pitch copy. */
  membershipCopy?: string;
  paymentNote?: string;
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
  const completingRef = useRef(false);

  const elementsOptions = useMemo(
    () =>
      clientSecret
        ? {
            clientSecret,
            appearance: {
              theme: "stripe" as const,
              variables: {
                colorPrimary: "#1c1c1c",
                borderRadius: "12px",
              },
            },
          }
        : undefined,
    [clientSecret]
  );

  const handlePaid = async (
    result: CheckoutPaymentSuccess & { stripeSubscriptionId?: string | null }
  ) => {
    if (completingRef.current) return;
    completingRef.current = true;
    setActivating(true);
    setClientSecret(null);
    try {
      if (!result.paymentIntentId) {
        onSuccess(result);
        return;
      }
      const res = await fetch("/api/public/membership-checkout/funnel-complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          paymentIntentId: result.paymentIntentId,
          subscriptionId: result.stripeSubscriptionId ?? subscriptionId,
          consentRecordId: result.consentRecordId || readStoredConsentId(userId, email),
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
          intentProgram,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Payment succeeded but membership could not be activated");
      onSuccess(result);
    } catch (err) {
      completingRef.current = false;
      const message = err instanceof Error ? err.message : "Could not activate membership";
      onError(message);
    } finally {
      setActivating(false);
    }
  };

  useEffect(() => {
    if (alreadyPaid) return;

    let cancelled = false;
    const run = async () => {
      setLoading(true);
      setInitError(null);
      try {
        const stripe = await stripePromise;
        const params = new URLSearchParams(window.location.search);
        const redirectSecret = params.get("payment_intent_client_secret");
        const redirectIntentId = params.get("payment_intent");
        if (stripe && redirectSecret) {
          const { paymentIntent } = await stripe.retrievePaymentIntent(redirectSecret);
          if (cancelled) return;
          if (stripePaymentIntentIsSucceeded(paymentIntent?.status) && paymentIntent) {
            window.history.replaceState({}, "", window.location.pathname);
            await handlePaid({
              paymentIntentId: paymentIntent.id,
              consentRecordId: readStoredConsentId(userId, email),
            });
            return;
          }
        } else if (params.get("redirect_status") === "succeeded" && redirectIntentId) {
          window.history.replaceState({}, "", window.location.pathname);
          await handlePaid({
            paymentIntentId: redirectIntentId,
            consentRecordId: readStoredConsentId(userId, email),
          });
          return;
        }

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
            intentProgram,
            source,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to initialise payment");
        if (cancelled) return;
        setSubscriptionId(data.subscriptionId ?? null);
        if (typeof data.amountAud === "number") setAmountAud(data.amountAud);
        if (typeof data.priceLabel === "string") setPriceLabel(data.priceLabel);

        if (data.alreadyPaid) {
          await handlePaid({
            paymentIntentId: data.paymentIntentId,
            stripeSubscriptionId: data.subscriptionId,
            consentRecordId: readStoredConsentId(userId, email),
          });
          return;
        }

        if (!data.clientSecret) {
          throw new Error("Failed to initialise payment");
        }

        if (stripe) {
          const { paymentIntent } = await stripe.retrievePaymentIntent(data.clientSecret);
          if (cancelled) return;
          if (stripePaymentIntentIsSucceeded(paymentIntent?.status) && paymentIntent) {
            await handlePaid({
              paymentIntentId: paymentIntent.id,
              stripeSubscriptionId: data.subscriptionId,
              consentRecordId: readStoredConsentId(userId, email),
            });
            return;
          }
          if (!stripePaymentIntentCanInitializeElements(paymentIntent?.status)) {
            throw new Error("Could not initialise payment. Please refresh and try again.");
          }
        }

        setClientSecret(data.clientSecret);
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
    // onError is unstable from the parent; only re-init when the account identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alreadyPaid, userId, email]);

  const yearlyLabel = priceLabel.includes("/yr")
    ? priceLabel.replace("/yr", "/year")
    : priceLabel.includes("/")
      ? priceLabel
      : `${priceLabel}/year`;

  const summary = (
    <div className="min-w-0 max-w-full overflow-hidden bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 lg:p-8">
      <div className="mb-3 sm:mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">
          Order Summary
        </h2>
        <p className="text-sm sm:text-base font-semibold text-gray-900">
          Sanative Membership
        </p>
      </div>

      <div className="min-w-0 rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 lg:p-5 mb-4 sm:mb-5">
        <div className="min-w-0">
          <ImageMarquee />
        </div>
      </div>

      <p className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-gray-900 leading-snug">
        {MEMBERSHIP_PITCH}
      </p>

      <div className="mb-4 sm:mb-6">
        <MembershipBenefitsList />
      </div>

      <div className="border-t border-gray-200 pt-3 sm:pt-4">
        <div className="flex items-center justify-between gap-3 mb-2 text-sm sm:text-base">
          <span className="text-gray-600 min-w-0">Sanative Membership</span>
          <span className="font-semibold tabular-nums shrink-0">{yearlyLabel}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-base sm:text-lg font-bold">
          <span>Total</span>
          <span className="tabular-nums">${amountAud}</span>
        </div>
        <p className="text-[11px] sm:text-xs text-gray-400 mt-2 leading-snug">
          Everything included · auto-renews yearly · cancel anytime
        </p>
      </div>
    </div>
  );

  const summaryColumn = (
    <div className="min-w-0 max-w-full space-y-3 lg:sticky lg:top-8">
      {summary}
      <div className="rounded-2xl border border-[#e6ebe3] bg-[#f4f7f2] px-3.5 py-3 sm:px-4 sm:py-3.5">
        <p className="text-xs sm:text-sm leading-relaxed text-[#2c3628]">
          {paymentNote}
        </p>
      </div>
    </div>
  );

  if (alreadyPaid) {
    return (
      <div className="grid w-full min-w-0 grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-12 items-start">
        <div className="order-2 lg:order-1 min-w-0 bg-white rounded-2xl border border-black/10 p-4 sm:p-8 space-y-5">
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
    <div className="grid w-full min-w-0 grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-12 items-start">
      <div className="order-2 lg:order-1 min-w-0 overflow-x-hidden bg-white rounded-2xl border border-black/10 p-4 sm:p-8">
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
        ) : clientSecret && elementsOptions ? (
          <StripeFormErrorBoundary
            onError={(message) => {
              if (isStripeTerminalElementsError(message) && clientSecret) {
                void stripePromise.then(async (stripe) => {
                  if (!stripe) {
                    setInitError(message);
                    onError(message);
                    return;
                  }
                  const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
                  if (stripePaymentIntentIsSucceeded(paymentIntent?.status) && paymentIntent) {
                    await handlePaid({
                      paymentIntentId: paymentIntent.id,
                      consentRecordId: readStoredConsentId(userId, email),
                    });
                    return;
                  }
                  setInitError(message);
                  onError(message);
                });
                return;
              }
              setInitError(message);
              onError(message);
            }}
          >
            <Elements
              key={clientSecret}
              stripe={stripePromise}
              options={elementsOptions}
            >
              <CardPaymentForm
                amountAud={amountAud}
                customerEmail={email}
                customerName={`${firstName} ${lastName}`.trim()}
                userId={userId}
                clientSecret={clientSecret}
                returnPath={returnPath}
                onSuccess={handlePaid}
              />
            </Elements>
          </StripeFormErrorBoundary>
        ) : null}
      </div>
      <div className="order-1 lg:order-2">{summaryColumn}</div>
    </div>
  );
}
