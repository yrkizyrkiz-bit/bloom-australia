"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Shield, Lock, CreditCard, AlertCircle, RefreshCw } from "lucide-react";

// Initialize Stripe - use a getter to handle SSR
let stripePromise: ReturnType<typeof loadStripe> | null = null;
const getStripe = () => {
  if (!stripePromise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.error("Stripe publishable key is not set");
      return null;
    }
    stripePromise = loadStripe(key);
  }
  return stripePromise;
};

interface PaymentFormProps {
  userId: string;
  selectedPlan: "core" | "precision";
  firstMonthAmount: number;
  ongoingMonthlyAmount: number;
  discountAmount: number;
  consultationDate: string;
  consultationTime: string;
  customerEmail: string;
  customerName: string;
  bookingHoldId?: string;
  intakeId?: string;
  onSuccess: (paymentIntentId?: string) => void;
  onError: (error: string) => void;
}

// Inner form component that uses Stripe hooks
function CheckoutForm({
  onSuccess,
  onError,
  amount,
  planName,
  clientSecret,
}: {
  onSuccess: (paymentIntentId?: string) => void;
  onError: (error: string) => void;
  amount: number;
  planName: string;
  clientSecret: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setErrorMessage("Payment form is still loading. Please wait...");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setErrorMessage("Card input not found. Please refresh the page.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        const errorMsg = error.message || "Payment failed. Please try again.";
        setErrorMessage(errorMsg);
        onError(errorMsg);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        onSuccess(paymentIntent.id);
      } else if (paymentIntent && paymentIntent.status === "requires_action") {
        // Handle 3D Secure
        const { error: confirmError, paymentIntent: confirmedIntent } = await stripe.confirmCardPayment(clientSecret);
        if (confirmError) {
          setErrorMessage(confirmError.message || "Authentication failed.");
          onError(confirmError.message || "Authentication failed.");
        } else if (confirmedIntent?.status === "succeeded") {
          onSuccess(confirmedIntent.id);
        }
      } else {
        const statusMsg = `Payment status: ${paymentIntent?.status || 'unknown'}`;
        setErrorMessage(statusMsg);
        onError(statusMsg);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment failed";
      setErrorMessage(message);
      onError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const cardStyle = {
    style: {
      base: {
        fontSize: '16px',
        color: '#2c3628',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        '::placeholder': {
          color: '#7e9a72',
        },
      },
      invalid: {
        color: '#dc2626',
        iconColor: '#dc2626',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Card Input */}
      <div className="bg-white rounded-2xl border border-[#e6ebe3] p-5">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-[#5c7a52]" />
          <p className="font-semibold text-[#2c3628]">Payment details</p>
        </div>

        <div className="border-2 border-[#e6ebe3] rounded-xl p-4 focus-within:border-[#5c7a52] transition-colors">
          <CardElement
            options={cardStyle}
            onReady={() => {
              console.log("[StripePaymentForm] CardElement is ready");
              setIsReady(true);
            }}
            onChange={(event) => {
              if (event.error) {
                setErrorMessage(event.error.message || "Card error");
              } else {
                setErrorMessage(null);
              }
            }}
          />
        </div>

        <p className="text-xs text-[#7e9a72] mt-3">
          Test card: 4242 4242 4242 4242 · Any future date · Any CVC
        </p>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-700">{errorMessage}</p>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-xs text-red-600 underline mt-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Security Badges */}
      <div className="flex items-center justify-center gap-4 py-3">
        <div className="flex items-center gap-1.5 text-xs text-[#7e9a72]">
          <Lock className="w-3.5 h-3.5" />
          <span>256-bit SSL</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#7e9a72]">
          <Shield className="w-3.5 h-3.5" />
          <span>PCI compliant</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#7e9a72]">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>Stripe secured</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full py-4 bg-[#2c3628] hover:bg-[#34412f] active:bg-[#1a1f17] text-white font-semibold rounded-full text-base sm:text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 touch-manipulation"
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing payment...
          </>
        ) : (
          <>
            Pay ${(amount / 100).toFixed(0)} and book doctor assessment
            <Lock className="w-4 h-4" />
          </>
        )}
      </button>

      {/* Refund Policy */}
      <p className="text-center text-xs text-[#7e9a72]">
        By completing payment, you agree to our{" "}
        <a href="/terms" className="underline">terms of service</a>.
        Full refund if treatment is not clinically appropriate.
      </p>
    </form>
  );
}

// Main payment form wrapper with Elements provider
export function StripePaymentForm({
  userId,
  selectedPlan,
  firstMonthAmount,
  ongoingMonthlyAmount,
  discountAmount,
  consultationDate,
  consultationTime,
  customerEmail,
  customerName,
  bookingHoldId,
  intakeId,
  onSuccess,
  onError,
}: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [useTestMode, setUseTestMode] = useState(false);
  const [isProcessingTest, setIsProcessingTest] = useState(false);

  const planName = selectedPlan === "precision" ? "Sanative Precision" : "Sanative Core";
  const amount = selectedPlan === "precision" ? 39900 : 24900; // cents

  // Check if we're in a preview/iframe environment
  const isPreviewEnvironment = typeof window !== 'undefined' &&
    (window.location.hostname.includes('preview.same-app.com') ||
     window.location.hostname.includes('localhost') ||
     window.self !== window.top);

  // Track if we've already created a payment intent to prevent duplicate calls
  const [hasCreatedIntent, setHasCreatedIntent] = useState(false);

  // Handle test mode payment simulation
  const handleTestPayment = async () => {
    setIsProcessingTest(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Call success with a test payment intent ID
    onSuccess(`pi_test_${Date.now()}`);
    setIsProcessingTest(false);
  };

  const createPaymentIntent = useCallback(async () => {
    if (!userId) {
      setLoadError("User session not found. Please go back and try again.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);

    try {
      console.log("[StripePaymentForm] Creating payment intent for user:", userId);
      const response = await fetch("/api/stripe/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          planId: selectedPlan,
          billingType: "one_time",
          selectedPlan,
          firstMonthAmount,
          ongoingMonthlyAmount,
          discountAmount,
          consultationDate,
          consultationTime,
          customerEmail,
          customerName,
          bookingHoldId,
          intakeId,
        }),
      });

      const data = await response.json();
      console.log("[StripePaymentForm] API response:", { ok: response.ok, hasSecret: !!data.clientSecret });

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize payment");
      }

      if (!data.clientSecret) {
        throw new Error("Payment setup incomplete. Please try again.");
      }

      setClientSecret(data.clientSecret);
      setHasCreatedIntent(true);
      setLoadError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to initialize payment";
      console.error("[StripePaymentForm] Payment init error:", message);
      setLoadError(message);
      onError(message);
    } finally {
      setIsLoading(false);
    }
  }, [userId, selectedPlan, firstMonthAmount, ongoingMonthlyAmount, discountAmount, consultationDate, consultationTime, customerEmail, customerName, bookingHoldId, intakeId, onError]);

  // Create payment intent on mount
  useEffect(() => {
    createPaymentIntent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Handle retry
  useEffect(() => {
    if (retryCount > 0) {
      createPaymentIntent();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount]);

  const handleRetry = () => {
    setHasCreatedIntent(false);
    setClientSecret(null);
    setRetryCount(prev => prev + 1);
  };

  // Check if Stripe key is available
  const stripeInstance = getStripe();
  if (!stripeInstance) {
    return (
      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 mb-1">Payment temporarily unavailable</p>
            <p className="text-sm text-amber-600">
              Please contact support or try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-[#e6ebe3] p-8 flex flex-col items-center justify-center min-h-[200px]">
        <div className="w-10 h-10 border-4 border-[#5c7a52]/20 border-t-[#5c7a52] rounded-full animate-spin mb-4" />
        <p className="text-sm text-[#7e9a72] font-medium">Preparing secure checkout...</p>
        <p className="text-xs text-[#a8bb9e] mt-1">This may take a few seconds</p>
      </div>
    );
  }

  // Error state
  if (loadError) {
    return (
      <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <div>
            <p className="font-semibold text-red-800 mb-1">Payment setup failed</p>
            <p className="text-sm text-red-600">{loadError}</p>
          </div>
        </div>
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 border border-red-300 text-red-600 font-medium rounded-xl transition-colors hover:bg-red-50"
          >
            Refresh page
          </button>
        </div>
      </div>
    );
  }

  // No client secret yet
  if (!clientSecret) {
    return (
      <div className="bg-white rounded-2xl border border-[#e6ebe3] p-8 flex flex-col items-center justify-center min-h-[200px]">
        <AlertCircle className="w-8 h-8 text-amber-500 mb-3" />
        <p className="text-sm text-[#7e9a72] text-center mb-4">
          Unable to load payment form
        </p>
        <button
          onClick={handleRetry}
          className="px-6 py-2 bg-[#5c7a52] text-white rounded-lg text-sm font-medium hover:bg-[#4a6343] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Test mode UI for preview environment
  if (useTestMode) {
    return (
      <div className="space-y-5">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <p className="font-semibold text-amber-800">Test Mode</p>
          </div>
          <p className="text-sm text-amber-700 mb-4">
            Stripe payment is unavailable in this preview environment.
            Click below to simulate a successful payment and continue testing.
          </p>

          <div className="bg-white rounded-xl p-4 mb-4">
            <p className="text-sm font-medium text-[#2c3628]">{planName}</p>
            <p className="text-2xl font-bold text-[#2c3628]">${(amount / 100).toFixed(0)} AUD</p>
          </div>

          <button
            onClick={handleTestPayment}
            disabled={isProcessingTest}
            className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-full transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isProcessingTest ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Simulate Payment (Test Mode)
              </>
            )}
          </button>

          <button
            onClick={() => setUseTestMode(false)}
            className="w-full mt-3 py-2 text-sm text-amber-700 hover:text-amber-800"
          >
            Try real payment again
          </button>
        </div>
      </div>
    );
  }

  // Elements options with clientSecret for proper CardElement initialization
  const elementsOptions = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#5c7a52',
        colorBackground: '#ffffff',
        colorText: '#2c3628',
        colorDanger: '#dc2626',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        borderRadius: '12px',
      },
    },
  };

  return (
    <div className="space-y-5">
      <Elements stripe={stripeInstance} options={elementsOptions}>
        <CheckoutForm
          onSuccess={onSuccess}
          onError={onError}
          amount={amount}
          planName={planName}
          clientSecret={clientSecret}
        />
      </Elements>

      {/* Test mode fallback for preview environment */}
      {isPreviewEnvironment && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-600 mb-2">
            Having trouble with the card input? This may be a preview environment limitation.
          </p>
          <button
            onClick={() => setUseTestMode(true)}
            className="text-sm text-[#5c7a52] font-medium underline"
          >
            Use test mode instead
          </button>
        </div>
      )}
    </div>
  );
}

export default StripePaymentForm;
