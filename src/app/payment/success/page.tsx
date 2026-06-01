"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const PROGRAM_DETAILS: Record<string, { title: string; nextSteps: string[]; dashboardPath: string; color: string }> = {
  weight_management: {
    title: "Weight Management",
    nextSteps: [
      "Check your email for a confirmation and next steps",
      "A doctor will review your assessment within 24-48 hours",
      "You'll receive a personalised treatment plan via email",
      "If approved, medication will be shipped to you discreetly",
    ],
    dashboardPath: "/dashboard/weight-management",
    color: "#5c7a52",
  },
  womens_health: {
    title: "Women's Health",
    nextSteps: [
      "Check your email for a confirmation",
      "A specialist will review your profile",
      "You'll receive your personalised care plan",
      "We'll schedule any follow-up appointments needed",
    ],
    dashboardPath: "/dashboard",
    color: "#c17a58",
  },
  mens_health: {
    title: "Men's Health",
    nextSteps: [
      "Check your email for a confirmation",
      "A doctor will review your assessment within 24 hours",
      "You'll receive a personalised treatment recommendation",
      "Discreet delivery to your door if treatment is approved",
    ],
    dashboardPath: "/dashboard/mens-health",
    color: "#5c7a52",
  },
  hair_loss: {
    title: "Hair Loss Treatment",
    nextSteps: [
      "Check your email for confirmation",
      "A practitioner will review your assessment",
      "You'll receive a personalised treatment plan",
      "Medication ships discreetly to your door",
    ],
    dashboardPath: "/dashboard/mens-health/hair-loss",
    color: "#5c7a52",
  },
  fatty_liver: {
    title: "Fatty Liver Health",
    nextSteps: [
      "Check your email for confirmation",
      "A doctor will review your liver health profile",
      "You'll receive an evidence-based treatment plan",
      "Regular monitoring and support included",
    ],
    dashboardPath: "/dashboard",
    color: "#c17a32",
  },
};

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const program = searchParams.get("program") || "weight_management";
  const [countdown, setCountdown] = useState(10);

  const programInfo = PROGRAM_DETAILS[program] || PROGRAM_DETAILS.weight_management;

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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
      <main className="max-w-lg mx-auto px-4 py-16">
        <div className="text-center mb-8">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `${programInfo.color}15` }}
          >
            <svg
              className="w-10 h-10"
              style={{ color: programInfo.color }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-serif text-[#2c3628]">Payment Successful!</h1>
          <p className="mt-3 text-[#5c7a52]">
            Thank you for booking your {programInfo.title} consultation.
          </p>
        </div>

        {/* Confirmation box */}
        <div className="bg-white rounded-xl border border-[#e6ebe3] p-6 mb-6">
          <h2 className="font-semibold text-[#2c3628] mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" style={{ color: programInfo.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            What happens next
          </h2>
          <ol className="space-y-3">
            {programInfo.nextSteps.map((step, index) => (
              <li key={index} className="flex gap-3 text-sm text-[#5c7a52]">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium"
                  style={{ backgroundColor: `${programInfo.color}15`, color: programInfo.color }}
                >
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Important info */}
        <div
          className="rounded-xl p-4 mb-6"
          style={{ backgroundColor: `${programInfo.color}10` }}
        >
          <div className="flex gap-3">
            <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: programInfo.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-sm font-medium" style={{ color: programInfo.color }}>Check your inbox</p>
              <p className="text-sm text-[#5c7a52] mt-1">
                A confirmation email has been sent with your receipt and login details for the patient portal.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <Link
            href={programInfo.dashboardPath}
            className="block w-full py-4 text-center font-medium rounded-xl transition-colors"
            style={{ backgroundColor: programInfo.color, color: "white" }}
          >
            Go to Patient Dashboard
          </Link>
          <Link
            href="/"
            className="block w-full py-4 text-center font-medium rounded-xl border transition-colors hover:bg-[#f8f8f6]"
            style={{ borderColor: "#e6ebe3", color: "#5c7a52" }}
          >
            Return to Home
          </Link>
        </div>

        {/* Support info */}
        <p className="text-center text-xs text-[#7e9a72] mt-8">
          Questions? Contact us at{" "}
          <a href="mailto:support@sanative.com.au" className="underline">
            support@sanative.com.au
          </a>
        </p>
      </main>
    </div>
  );
}

export default function PaymentSuccessPage() {
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
      <SuccessPageContent />
    </Suspense>
  );
}
