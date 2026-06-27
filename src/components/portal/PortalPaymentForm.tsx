"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { CardElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrePaymentConsentCheckbox } from "@/components/legal/PrePaymentConsentCheckbox";
import type { CheckoutPaymentSuccess } from "@/lib/checkout/payment-success";
import {
  ensurePrePaymentConsentRecorded,
  paymentSourcePage,
} from "@/lib/legal/ensure-pre-payment-consent";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

const cardStyle = {
  style: {
    base: {
      fontSize: "16px",
      color: "#2c3628",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      "::placeholder": {
        color: "#7e9a72",
      },
    },
    invalid: {
      color: "#dc2626",
      iconColor: "#dc2626",
    },
  },
  hidePostalCode: true,
};

type PortalPaymentFormProps = {
  clientSecret: string;
  amountLabel: string;
  submitLabel: string;
  userId?: string;
  customerEmail?: string;
  onConfirmed: (result: CheckoutPaymentSuccess) => Promise<void>;
};

function CheckoutInner({
  clientSecret,
  amountLabel,
  submitLabel,
  userId,
  customerEmail,
  onConfirmed,
}: PortalPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card input not found. Please refresh and try again.");
      return;
    }

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
      const { error: paymentError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardElement },
      });

      if (paymentError) {
        setError(paymentError.message || "Payment failed");
        setProcessing(false);
        return;
      }

      if (paymentIntent?.status === "requires_action") {
        const { error: confirmError, paymentIntent: confirmedIntent } =
          await stripe.confirmCardPayment(clientSecret);
        if (confirmError) {
          setError(confirmError.message || "Authentication failed");
          setProcessing(false);
          return;
        }
        if (confirmedIntent?.status === "succeeded") {
          await onConfirmed({
            paymentIntentId: confirmedIntent.id,
            consentRecordId: consentResult.consentRecordId,
          });
          return;
        }
      }

      if (paymentIntent?.status === "succeeded") {
        await onConfirmed({
          paymentIntentId: paymentIntent.id,
          consentRecordId: consentResult.consentRecordId,
        });
      } else {
        setError("Payment was not completed. Please try again.");
        setProcessing(false);
      }
    } catch (err) {
      console.error("[PortalPaymentForm]", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
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
          <span className="text-sm font-medium text-[#2c3628]">Card details</span>
        </div>

        <div className="rounded-lg border border-[#e6ebe3] px-3 py-3 focus-within:border-[#5c7a52] focus-within:ring-1 focus-within:ring-[#5c7a52]/20">
          <CardElement
            options={cardStyle}
            onReady={() => setCardReady(true)}
            onChange={(event) => {
              if (event.error) {
                setError(event.error.message || "Card error");
              } else {
                setError(null);
              }
            }}
          />
        </div>
      </div>

      <PrePaymentConsentCheckbox
        checked={consentChecked}
        onCheckedChange={setConsentChecked}
        disabled={processing}
      />

      <Button
        type="submit"
        disabled={!stripe || !cardReady || !consentChecked || processing}
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
  if (!props.clientSecret) return null;

  return (
    <Elements
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
