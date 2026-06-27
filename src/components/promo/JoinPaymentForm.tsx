"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Loader2, Lock, CreditCard } from "lucide-react";
import { PrePaymentConsentCheckbox } from "@/components/legal/PrePaymentConsentCheckbox";
import type { CheckoutPaymentSuccess } from "@/lib/checkout/payment-success";
import {
  ensurePrePaymentConsentRecorded,
  paymentSourcePage,
} from "@/lib/legal/ensure-pre-payment-consent";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

interface PaymentFormProps {
  clientSecret: string;
  onSuccess: (result: CheckoutPaymentSuccess) => void;
  onError: (error: string) => void;
  amount: number;
  disabled?: boolean;
  userId?: string;
  customerEmail?: string;
}

function CheckoutForm({
  onSuccess,
  onError,
  amount,
  disabled,
  userId,
  customerEmail,
}: Omit<PaymentFormProps, "clientSecret">) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements || disabled) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const consentResult = await ensurePrePaymentConsentRecorded({
      consentChecked,
      sourcePage: paymentSourcePage(),
      email: customerEmail,
      userId,
    });

    if (!consentResult.ok) {
      setErrorMessage(consentResult.error);
      onError(consentResult.error);
      setIsProcessing(false);
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/welcome`,
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(error.message || "Payment failed");
        onError(error.message || "Payment failed");
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess({
          paymentIntentId: paymentIntent.id,
          consentRecordId: consentResult.consentRecordId,
        });
      }
    } catch {
      setErrorMessage("An unexpected error occurred");
      onError("An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
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
        disabled={isProcessing || disabled}
      />

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{errorMessage}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing || disabled || !consentChecked}
        className="w-full py-4 bg-[#1D9E75] text-white font-semibold rounded-full hover:bg-[#178a64] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Pay ${amount}/year
          </>
        )}
      </button>

      <p className="text-center text-xs text-[#5c7a52] flex items-center justify-center gap-1">
        <CreditCard className="w-3 h-3" />
        Secured by Stripe
      </p>
    </form>
  );
}

export function JoinPaymentForm({
  clientSecret,
  onSuccess,
  onError,
  amount,
  disabled,
  userId,
  customerEmail,
}: PaymentFormProps) {
  const appearance = {
    theme: "stripe" as const,
    variables: {
      colorPrimary: "#1D9E75",
      colorBackground: "#ffffff",
      colorText: "#34412f",
      colorDanger: "#ef4444",
      fontFamily: "system-ui, sans-serif",
      borderRadius: "12px",
      spacingUnit: "4px",
    },
    rules: {
      ".Input": {
        border: "1px solid #e6ebe3",
        boxShadow: "none",
        padding: "12px 16px",
      },
      ".Input:focus": {
        border: "1px solid #1D9E75",
        boxShadow: "0 0 0 2px rgba(29, 158, 117, 0.1)",
      },
      ".Label": {
        fontSize: "14px",
        fontWeight: "500",
        color: "#34412f",
        marginBottom: "4px",
      },
      ".Tab": {
        borderRadius: "8px",
        border: "1px solid #e6ebe3",
      },
      ".Tab--selected": {
        borderColor: "#1D9E75",
        backgroundColor: "rgba(29, 158, 117, 0.05)",
      },
    },
  };

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance,
      }}
    >
      <CheckoutForm
        onSuccess={onSuccess}
        onError={onError}
        amount={amount}
        disabled={disabled}
        userId={userId}
        customerEmail={customerEmail}
      />
    </Elements>
  );
}

export function PaymentFormLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-12 bg-gray-100 rounded-xl" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-12 bg-gray-100 rounded-xl" />
        <div className="h-12 bg-gray-100 rounded-xl" />
      </div>
      <div className="h-14 bg-gray-100 rounded-full" />
    </div>
  );
}
