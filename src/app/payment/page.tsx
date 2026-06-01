"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

const PROGRAM_DETAILS: Record<string, { title: string; description: string; color: string }> = {
  weight_management: {
    title: "Weight Management Consultation",
    description: "AHPRA-registered doctor consultation with personalised treatment plan",
    color: "#5c7a52",
  },
  womens_health: {
    title: "Women's Health Consultation",
    description: "Specialist consultation and personalised care plan",
    color: "#c17a58",
  },
  mens_health: {
    title: "Men's Health Consultation",
    description: "Doctor review and personalised treatment recommendation",
    color: "#5c7a52",
  },
  hair_loss: {
    title: "Hair Loss Consultation",
    description: "Practitioner consultation and personalised treatment plan",
    color: "#5c7a52",
  },
  fatty_liver: {
    title: "Fatty Liver Health Consultation",
    description: "Doctor review and personalised liver health plan",
    color: "#c17a32",
  },
};

function CheckoutForm({ clientSecret, amount, program }: { clientSecret: string; amount: number; program: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || "Payment failed");
        setIsProcessing(false);
        return;
      }

      const { error: paymentError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success?program=${program}`,
        },
        redirect: "if_required",
      });

      if (paymentError) {
        setError(paymentError.message || "Payment failed");
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        router.push(`/payment/success?program=${program}`);
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError("An unexpected error occurred");
      setIsProcessing(false);
    }
  };

  const programInfo = PROGRAM_DETAILS[program] || PROGRAM_DETAILS.weight_management;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#e6ebe3] p-6">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full py-4 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ backgroundColor: programInfo.color, color: "white" }}
      >
        {isProcessing ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </>
        ) : (
          <>
            Pay ${(amount / 100).toFixed(2)} AUD
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </>
        )}
      </button>

      <p className="text-center text-xs text-[#7e9a72]">
        Secure payment powered by Stripe. Your payment information is encrypted.
      </p>
    </form>
  );
}

function PaymentPageContent() {
  const searchParams = useSearchParams();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [discount, setDiscount] = useState<number>(0);
  const [originalAmount, setOriginalAmount] = useState<number>(4900);

  const userId = searchParams.get("userId");
  const program = searchParams.get("program") || "weight_management";

  // Check for discount from sessionStorage
  const storedDiscount = typeof window !== 'undefined' ? sessionStorage.getItem("paymentDiscount") : null;
  const storedOriginalAmount = typeof window !== 'undefined' ? sessionStorage.getItem("paymentOriginalAmount") : null;
  const discountAmount = storedDiscount ? Number.parseInt(storedDiscount, 10) * 100 : 0; // Convert to cents
  const baseAmount = storedOriginalAmount ? Number.parseInt(storedOriginalAmount, 10) * 100 : 4900;
  const amount = Math.max(0, baseAmount - discountAmount);

  useEffect(() => {
    // Check for existing clientSecret from sessionStorage (from assessment flow)
    const storedClientSecret = sessionStorage.getItem("paymentClientSecret");

    if (storedClientSecret) {
      setClientSecret(storedClientSecret);
      // Set discount state from sessionStorage
      const storedDiscountVal = sessionStorage.getItem("paymentDiscount");
      const storedOriginalVal = sessionStorage.getItem("paymentOriginalAmount");
      if (storedDiscountVal) setDiscount(Number.parseInt(storedDiscountVal, 10) * 100);
      if (storedOriginalVal) setOriginalAmount(Number.parseInt(storedOriginalVal, 10) * 100);
      setLoading(false);
      return;
    }

    if (!userId) {
      setError("Missing user information. Please complete the assessment first.");
      setLoading(false);
      return;
    }

    // Create PaymentIntent (fallback if not coming from assessment)
    const createPaymentIntent = async () => {
      try {
        // Check for new member discount
        const hasDiscount = sessionStorage.getItem('newMemberDiscountApplied') === 'true';
        const discountVal = hasDiscount ? 5000 : 0;
        const finalAmount = Math.max(0, 4900 - discountVal);

        const response = await fetch("/api/stripe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: finalAmount,
            userId,
            program,
            discount: hasDiscount ? 50 : 0,
            discountType: hasDiscount ? "new_member_promotion" : null,
          }),
        });

        const data = await response.json();

        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          if (hasDiscount) {
            setDiscount(5000);
            setOriginalAmount(4900);
          }
        } else {
          setError(data.error || "Failed to initialize payment");
        }
      } catch (err) {
        console.error("Error creating payment intent:", err);
        setError("Failed to initialize payment. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [userId, program]);

  const programInfo = PROGRAM_DETAILS[program] || PROGRAM_DETAILS.weight_management;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4" style={{ color: programInfo.color }} viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-[#5c7a52]">Preparing secure checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fdfbf7]">
        <header className="sticky top-0 bg-[#fdfbf7]/95 backdrop-blur-sm z-40 border-b border-[#e6ebe3]">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <Link href="/" className="text-2xl font-serif text-[#34412f]">
              Sanative
            </Link>
          </div>
        </header>
        <main className="max-w-lg mx-auto px-4 py-16">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="text-xl font-semibold text-red-800 mb-2">Payment Error</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-[#5c7a52] text-white rounded-xl font-medium hover:bg-[#4a6343] transition-colors"
            >
              Return Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {/* Header */}
      <header className="sticky top-0 bg-[#fdfbf7]/95 backdrop-blur-sm z-40 border-b border-[#e6ebe3]">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-serif text-[#34412f]">
            Sanative
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: programInfo.color }}
          >
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-serif text-[#2c3628]">Complete Your Payment</h1>
          <p className="mt-2 text-[#5c7a52]">Secure checkout</p>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-xl border border-[#e6ebe3] p-6 mb-6">
          <h2 className="font-medium text-[#2c3628] mb-4">Order Summary</h2>
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-[#2c3628]">{programInfo.title}</p>
              <p className="text-sm text-[#5c7a52] mt-1">{programInfo.description}</p>
            </div>
            <p className="font-semibold text-[#2c3628]">${(baseAmount / 100).toFixed(2)}</p>
          </div>

          {/* New Member Discount */}
          {discountAmount > 0 && (
            <div className="flex justify-between items-center mt-3 py-2 px-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <span className="text-sm font-medium text-green-800">New member promotion</span>
              </div>
              <span className="font-semibold text-green-700">-${(discountAmount / 100).toFixed(2)}</span>
            </div>
          )}

          <div className="border-t border-[#e6ebe3] mt-4 pt-4 flex justify-between items-center">
            <span className="font-medium text-[#2c3628]">Total</span>
            <div className="text-right">
              {discountAmount > 0 && (
                <span className="text-sm text-[#7e9a72] line-through mr-2">
                  ${(baseAmount / 100).toFixed(2)}
                </span>
              )}
              <span className="font-bold text-lg" style={{ color: programInfo.color }}>
                {amount === 0 ? 'FREE' : `${(amount / 100).toFixed(2)} AUD`}
              </span>
            </div>
          </div>
        </div>

        {/* Stripe Elements */}
        {clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: programInfo.color,
                  borderRadius: "12px",
                },
              },
            }}
          >
            <CheckoutForm clientSecret={clientSecret} amount={amount} program={program} />
          </Elements>
        )}

        {/* Trust badges */}
        <div className="mt-8 flex justify-center gap-6 text-[#7e9a72]">
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Secure
          </div>
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Encrypted
          </div>
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Stripe
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-[#5c7a52]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-[#5c7a52]">Loading...</p>
        </div>
      </div>
    }>
      <PaymentPageContent />
    </Suspense>
  );
}
