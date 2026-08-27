"use client";

import { useState } from "react";
import { PaymentElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrePaymentConsentCheckbox } from "@/components/legal/PrePaymentConsentCheckbox";
import type { CheckoutPaymentSuccess } from "@/lib/checkout/payment-success";
import {
  ensurePrePaymentConsentRecorded,
  paymentSourcePage,
} from "@/lib/legal/ensure-pre-payment-consent";
import { stripePromise } from "@/lib/stripe-client";
import { STRIPE_CHECKOUT_WALLETS } from "@/lib/checkout/stripe-payment-methods";

function friendlyPortalPaymentError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid api key") || lower.includes("api_key")) {
    return "Payment system is misconfigured. Please contact support.";
  }
  if (lower.includes("processing error")) {
    return "Your card could not be processed. Please check your details or try another card, then tap Subscribe again.";
  }
  if (lower.includes("token") && lower.includes("invalid")) {
    return "Card details could not be verified. Please refresh the page and try again.";
  }
  return message;
}

type PortalPaymentFormProps = {
  clientSecret: string;
  paymentIntentId: string;
  amountLabel: string;
  submitLabel: string;
  userId?: string;
  customerEmail?: string;
  returnUrl: string;
  onConfirmed: (result: CheckoutPaymentSuccess) => Promise<void>;
  onPaymentFailed?: () => void;
};

function CheckoutInner({
  amountLabel,
  submitLabel,
  userId,
  customerEmail,
  returnUrl,
  onConfirmed,
  onPaymentFailed,
}: Omit<PortalPaymentFormProps, "paymentIntentId" | "clientSecret">) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setError(null);

    const consentResult = await ensurePrePaymentConsentRecorded({
      consentChecked,
      sourcePage: paymentSourcePage(),
      email: customerEmail,
      userId,
    });

    if (!consentResult.ok) {
      setError(consentResult.error);
      setProcessing(false);
      return;
    }

    try {
      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl,
          receipt_email: customerEmail || undefined,
        },
        redirect: "if_required",
      });

      if (paymentError) {
        const message = friendlyPortalPaymentError(
          paymentError.message || "Payment failed"
        );
        setError(message);
        onPaymentFailed?.();
        setProcessing(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        try {
          await onConfirmed({
            paymentIntentId: paymentIntent.id,
            consentRecordId: consentResult.consentRecordId,
          });
        } catch (err) {
          console.error("[PortalPaymentForm] confirm failed after payment", err);
          setError(
            friendlyPortalPaymentError(
              err instanceof Error
                ? err.message
                : "Payment succeeded but activation failed. Please contact support."
            )
          );
        }
        return;
      }

      setError("Payment was not completed. Please try again.");
      onPaymentFailed?.();
    } catch (err) {
      console.error("[PortalPaymentForm]", err);
      setError(
        friendlyPortalPaymentError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        )
      );
      onPaymentFailed?.();
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-[#e6ebe3] bg-white p-4">
        <div className="mb-4 flex items-baseline justify-between">
          <span className="text-sm text-[#5c7a52]">Total due today</span>
          <span className="font-semibold text-emerald-800">{amountLabel}</span>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-[#5c7a52]" />
          <span className="text-sm font-medium text-[#2c3628]">Payment details</span>
        </div>

        <PaymentElement
          options={{
            layout: "tabs",
            wallets: STRIPE_CHECKOUT_WALLETS,
          }}
        />
      </div>

      <PrePaymentConsentCheckbox
        checked={consentChecked}
        onCheckedChange={setConsentChecked}
        disabled={processing}
      />

      <Button
        type="submit"
        disabled={!stripe || !elements || !consentChecked || processing}
        className="w-full bg-emerald-700 hover:bg-emerald-800"
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing payment
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
}

export function PortalPaymentForm(props: PortalPaymentFormProps) {
  if (!props.clientSecret || !props.paymentIntentId) return null;

  if (!stripePromise) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        Payment is unavailable, Stripe is not configured for this environment.
      </div>
    );
  }

  return (
    <Elements
      key={props.paymentIntentId}
      stripe={stripePromise}
      options={{
        clientSecret: props.clientSecret,
        appearance: { theme: "stripe" },
      }}
    >
      <CheckoutInner {...props} />
    </Elements>
  );
}
