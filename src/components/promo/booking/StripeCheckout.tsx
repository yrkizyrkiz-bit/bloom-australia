"use client";

import { useState, useEffect } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe-client";
import { Shield, Check, Loader2 } from "lucide-react";

interface CheckoutFormProps {
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  customerEmail: string;
  agreeToTerms: boolean;
}

function CheckoutForm({ onSuccess, onError, customerEmail, agreeToTerms }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!agreeToTerms) {
      setErrorMessage("Please agree to the terms and conditions");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        receipt_email: customerEmail,
        return_url: `${window.location.origin}/womens-health/book/success`,
      },
      redirect: "if_required",
    });

    if (error) {
      setErrorMessage(error.message || "An error occurred");
      onError(error.message || "Payment failed");
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(paymentIntent.id);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      {errorMessage && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {errorMessage}
        </div>
      )}

      {/* Security badges */}
      <div className="mt-6 flex items-center gap-4 text-xs text-[#7e9a72]">
        <div className="flex items-center gap-1">
          <Shield className="w-4 h-4" />
          SSL Secured
        </div>
        <div className="flex items-center gap-1">
          <Check className="w-4 h-4" />
          PCI Compliant
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing || !agreeToTerms}
        className={`
          w-full mt-6 flex items-center justify-center gap-2 px-8 py-4 rounded-full font-medium transition-all
          ${stripe && !isProcessing && agreeToTerms
            ? 'bg-[#c17a58] hover:bg-[#a86548] text-white shadow-lg'
            : 'bg-[#e8d5d5] text-[#9e8585] cursor-not-allowed'}
        `}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>Pay $149.00</>
        )}
      </button>
    </form>
  );
}

interface StripeCheckoutProps {
  clientSecret: string;
  customerEmail: string;
  agreeToTerms: boolean;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

export function StripeCheckout({
  clientSecret,
  customerEmail,
  agreeToTerms,
  onSuccess,
  onError,
}: StripeCheckoutProps) {
  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-[#c17a58]" />
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#c17a58",
            colorBackground: "#ffffff",
            colorText: "#2c3628",
            colorDanger: "#dc2626",
            fontFamily: "system-ui, sans-serif",
            borderRadius: "12px",
            spacingUnit: "4px",
          },
          rules: {
            ".Input": {
              border: "1px solid #f8e1e1",
              boxShadow: "none",
              padding: "12px 16px",
            },
            ".Input:focus": {
              border: "1px solid #c17a58",
              boxShadow: "0 0 0 2px #f8e1e1",
            },
            ".Label": {
              color: "#2c3628",
              fontWeight: "500",
              marginBottom: "8px",
            },
            ".Tab": {
              border: "1px solid #f8e1e1",
              borderRadius: "12px",
            },
            ".Tab:hover": {
              border: "1px solid #c17a58",
            },
            ".Tab--selected": {
              border: "2px solid #c17a58",
              backgroundColor: "#fdf8f6",
            },
          },
        },
      }}
    >
      <CheckoutForm
        onSuccess={onSuccess}
        onError={onError}
        customerEmail={customerEmail}
        agreeToTerms={agreeToTerms}
      />
    </Elements>
  );
}
