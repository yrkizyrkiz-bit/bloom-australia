"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, AlertCircle, Sparkles, Clock, Shield } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { toast } from "sonner";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

interface Plan {
  id: string;
  name: string;
  price: number;
  priceId: string;
  duration: string;
  features: string[];
  savings?: string;
  popular?: boolean;
  billingType: "one_time" | "subscription";
}

const PLANS: Plan[] = [
  {
    id: "sanative_core",
    name: "Sanative Core",
    price: 249,
    priceId: process.env.STRIPE_WM_CORE_FIRST_MONTH_PRICE_ID || "price_core_placeholder",
    duration: "first month",
    billingType: "one_time",
    popular: true,
    savings: "$100 off first month",
    features: [
      "Doctor consultation & assessment",
      "Treatment if prescribed",
      "Care partner support",
      "Health portal access",
      "Biomarker monitoring",
      "Then $349/month ongoing",
    ],
  },
  {
    id: "sanative_precision",
    name: "Sanative Precision",
    price: 399,
    priceId: process.env.STRIPE_WM_PRECISION_FIRST_MONTH_PRICE_ID || "price_precision_placeholder",
    duration: "first month",
    billingType: "one_time",
    features: [
      "Everything in Sanative Core",
      "Enhanced clinical monitoring",
      "Priority doctor access",
      "Advanced biomarker panels",
      "Health Age tracking",
      "Then $499/month ongoing",
    ],
  },
];

function PlanSelectionContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get("userId");

  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ firstName: string; email: string } | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!userId) {
      setError("Invalid link. Please use the link from your approval email.");
      setLoading(false);
      return;
    }

    // Verify user is approved
    async function verifyUser() {
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (!res.ok) {
          setError("User not found. Please contact support.");
          return;
        }
        const data = await res.json();

        if (data.approvalStatus !== "APPROVED") {
          setError("Your application is still being reviewed. Please wait for approval.");
          return;
        }

        if (data.journeyStatus === "ACTIVE") {
          router.push("/dashboard/weight-management");
          return;
        }

        setUser({ firstName: data.firstName, email: data.email });
      } catch (err) {
        setError("Failed to verify your account. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    verifyUser();
  }, [userId, router]);

  const handleSelectPlan = async (plan: Plan) => {
    setSelectedPlan(plan);
    setProcessing(true);

    try {
      const res = await fetch("/api/stripe/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          priceId: plan.priceId,
          planId: plan.id,
          billingType: plan.billingType,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create payment");
      }

      const data = await res.json();
      setClientSecret(data.clientSecret);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to process payment");
      setSelectedPlan(null);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-4">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Unable to Continue</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button className="mt-4" onClick={() => router.push("/")}>
              Return Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (clientSecret && selectedPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-12 px-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Complete Your Payment</h1>
            <p className="text-muted-foreground mt-2">
              {selectedPlan.name} — ${selectedPlan.price} {selectedPlan.duration}
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <CheckoutForm userId={userId!} planId={selectedPlan.id} />
              </Elements>
            </CardContent>
          </Card>

          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => {
              setClientSecret(null);
              setSelectedPlan(null);
            }}
          >
            ← Choose a different plan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            <Sparkles className="w-3 h-3 mr-1" />
            You're Approved!
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Choose Your Weight Management Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {user && `Hi ${user.firstName}, `}congratulations on taking this step!
            Select the plan that best fits your goals.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`relative overflow-hidden transition-all hover:shadow-lg ${
                plan.popular ? "border-emerald-500 border-2 shadow-md" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                  MOST POPULAR
                </div>
              )}

              <CardHeader className="pb-4">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.duration}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  {plan.billingType === "subscription" && (
                    <span className="text-muted-foreground">/month</span>
                  )}
                  {plan.savings && (
                    <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                      {plan.savings}
                    </Badge>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${plan.popular ? "bg-emerald-600 hover:bg-emerald-700" : ""}`}
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSelectPlan(plan)}
                  disabled={processing}
                >
                  {processing && selectedPlan?.id === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Select {plan.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>AHPRA Registered Doctors</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Start Within 48 Hours</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>100% Australian</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckoutForm({ userId, planId }: { userId: string; planId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || "Payment failed");
      setProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success?program=weight_management&userId=${userId}&plan=${planId}`,
      },
    });

    if (confirmError) {
      setError(confirmError.message || "Payment failed");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement className="mb-6" />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        className="w-full bg-emerald-600 hover:bg-emerald-700"
        disabled={!stripe || processing}
      >
        {processing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Processing...
          </>
        ) : (
          "Complete Payment"
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center mt-4">
        Secure payment powered by Stripe. Your payment details are encrypted.
      </p>
    </form>
  );
}

export default function SelectPlanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    }>
      <PlanSelectionContent />
    </Suspense>
  );
}
