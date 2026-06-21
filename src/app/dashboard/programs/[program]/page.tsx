"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Stethoscope,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { normalizeProgramKey, PROGRAM_LABELS, type ProgramKey } from "@/lib/membership/keys";
import { getProgramOffer, PROGRAM_BILLING_TERM_OPTIONS, type ProgramBillingTerm } from "@/lib/programs/offers";
import { PROGRAM_CARDS } from "@/lib/programs/catalog";
import { GENERIC_PROGRAM_QUIZ } from "@/lib/programs/quizzes/generic-program-quiz";
import {
  getSexualHealthConsultationSummary,
  getSexualHealthFocusLabel,
  getSexualHealthQuizSteps,
  isSexualHealthProgram,
} from "@/lib/programs/quizzes/sexual-health-quiz";
import { getPublicFunnelQuizSteps } from "@/lib/programs/quizzes/public-funnel-quizzes";
import { useAuth } from "@/contexts/AuthContext";
import { usePortalContext } from "@/hooks/usePortalContext";
import { PortalPaymentForm } from "@/components/portal/PortalPaymentForm";

const PROGRAMS_HUB = "/dashboard/programs";

type TermQuote = {
  term: ProgramBillingTerm;
  label: string;
  dueTodayAud?: number;
  dueTodayLabel?: string;
  recurringLabel?: string;
  priceLabel?: string;
  error?: boolean;
};

function getQuizSteps(
  programKey: ProgramKey,
  answers: Record<string, string>,
  gender?: string | null
) {
  const sexualHealthSteps = getSexualHealthQuizSteps(programKey, answers);
  if (sexualHealthSteps) return sexualHealthSteps;
  const funnelSteps = getPublicFunnelQuizSteps(programKey, gender);
  if (funnelSteps) return funnelSteps;
  return GENERIC_PROGRAM_QUIZ;
}

export default function InPortalProgramPage() {
  const params = useParams<{ program: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: portal, isLoading: portalLoading } = usePortalContext();
  const programKey = useMemo(
    () => normalizeProgramKey(params?.program) as ProgramKey | null,
    [params?.program]
  );

  const existingProgram = programKey ? portal?.membership?.programs?.[programKey] : null;
  const shouldRedirectToDashboard =
    Boolean(
      existingProgram?.hasEntitlement &&
        existingProgram.status !== "INACTIVE" &&
        existingProgram.state !== "inactive"
    );

  useEffect(() => {
    if (portalLoading || !programKey || !shouldRedirectToDashboard) return;
    const card = PROGRAM_CARDS.find((c) => c.key === programKey);
    if (card?.dashboardRoute) {
      router.replace(card.dashboardRoute);
    }
  }, [portalLoading, programKey, shouldRedirectToDashboard, router]);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amountLabel, setAmountLabel] = useState<string | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [billingTerm, setBillingTerm] = useState<ProgramBillingTerm>("1m");
  const [termQuotes, setTermQuotes] = useState<TermQuote[]>([]);
  const [pricingLoading, setPricingLoading] = useState(true);

  useEffect(() => {
    if (!programKey) return;
    setPricingLoading(true);
    fetch(`/api/portal/program-pricing?programKey=${programKey}`)
      .then((r) => r.json())
      .then((data) => setTermQuotes(data.terms ?? []))
      .catch(() => setTermQuotes([]))
      .finally(() => setPricingLoading(false));
  }, [programKey]);

  if (!programKey) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-gray-900">Program not found</h1>
        <Button asChild variant="outline" className="mt-6">
          <Link href={PROGRAMS_HUB}>Back to programs</Link>
        </Button>
      </div>
    );
  }

  if (portalLoading || shouldRedirectToDashboard) {
    return (
      <div className="mx-auto flex max-w-xl justify-center px-4 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[#5c7a52]" />
      </div>
    );
  }

  const selectedQuote = termQuotes.find((t) => t.term === billingTerm);
  const label = PROGRAM_LABELS[programKey];
  const offer = getProgramOffer(programKey);
  const card = PROGRAM_CARDS.find((c) => c.key === programKey);
  const sexualHealth = isSexualHealthProgram(programKey);
  const quizSteps = getQuizSteps(programKey, answers, user?.gender);
  const onQuiz = step < quizSteps.length;
  const question = quizSteps[step];
  const totalProgress = quizSteps.length + 1;

  const selectAnswer = (optionId: string) => {
    if (!question) return;

    if (question.id === "treatmentFocus") {
      setAnswers({ treatmentFocus: optionId });
      setStep(1);
      return;
    }

    setAnswers((prev) => ({ ...prev, [question.id]: optionId }));
    setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step === 0) return;
    setStep((s) => s - 1);
  };

  const startPayment = async () => {
    setLoadingPayment(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/checkout/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programKey,
          billingTerm,
          answers,
          intent: sexualHealth ? "doctor_consultation" : "program_subscription",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not start checkout");
      setClientSecret(data.clientSecret);
      setAmountLabel(data.dueTodayLabel || data.priceLabel || selectedQuote?.dueTodayLabel || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoadingPayment(false);
    }
  };

  const confirmPayment = async (paymentIntentId: string) => {
    const res = await fetch("/api/portal/checkout/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId, answers, programKey, billingTerm }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Could not confirm payment");
    setPaymentComplete(true);
  };

  if (paymentComplete) {
    const firstName = user?.firstName?.trim();
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center sm:py-16">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
          <CheckCircle2 className="h-8 w-8 text-emerald-700" />
        </div>
        <h1 className="mb-3 font-serif text-2xl text-[#2c3628]">
          {sexualHealth
            ? firstName
              ? `Welcome, ${firstName}`
              : "Welcome to Sexual Health"
            : `${label} — you're in`}
        </h1>
        {sexualHealth ? (
          <>
            <p className="mx-auto max-w-md text-[#5c7a52] leading-relaxed">
              You&apos;re all set — thank you for trusting us with your care. Your subscription
              includes a private doctor consultation, and our care team will reach out shortly to
              book a time that suits you.
            </p>
            <p className="mx-auto mt-4 max-w-md text-sm text-[#5c7a52]/90 leading-relaxed">
              If treatment is recommended, your doctor will only prescribe after confirming
              it&apos;s safe and right for you.
            </p>
          </>
        ) : (
          <p className="mx-auto max-w-md text-[#5c7a52] leading-relaxed">
            Thank you for joining. Our care team will be in touch shortly to help you get started.
          </p>
        )}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="bg-emerald-700 hover:bg-emerald-800">
            <Link href={card?.dashboardRoute || "/dashboard"}>
              {sexualHealth ? "Go to Sexual Health" : `Go to ${label}`}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={PROGRAMS_HUB}>Back to programs</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-0 py-8 sm:px-4">
      <Link
        href={PROGRAMS_HUB}
        className="mb-6 inline-flex items-center gap-1 text-sm text-[#5c7a52] hover:text-[#34412f]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to programs
      </Link>

      <div className="mb-6">
        <h1 className="font-serif text-2xl text-[#2c3628]">{label}</h1>
        <p className="text-sm text-[#5c7a52]">{offer.headline}</p>
        {sexualHealth && answers.treatmentFocus && step > 0 && (
          <p className="mt-2 text-xs font-medium uppercase tracking-wide text-[#7e9a72]">
            Path: {getSexualHealthFocusLabel(programKey, answers.treatmentFocus)}
          </p>
        )}
      </div>

      <div className="mb-6 flex gap-1">
        {Array.from({ length: totalProgress }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-[#5c7a52]" : "bg-[#e6ebe3]"}`}
          />
        ))}
      </div>

      {onQuiz && question ? (
        <Card className="border-[#e6ebe3]">
          <CardContent className="p-6">
            <h2 className="font-serif text-xl text-[#2c3628] sm:text-2xl">{question.prompt}</h2>
            {question.subtitle && (
              <p className="mt-2 text-sm text-[#5c7a52]">{question.subtitle}</p>
            )}
            <div className="mt-5 space-y-3">
              {question.options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => selectAnswer(option.id)}
                  className="flex w-full items-center justify-between rounded-xl border-2 border-[#e6ebe3] bg-white px-4 py-4 text-left transition-all hover:border-[#cdd8c6] hover:bg-[#f4f7f2]"
                >
                  <span>
                    <span className="block font-medium text-[#2c3628]">{option.label}</span>
                    {option.description && (
                      <span className="mt-0.5 block text-sm text-[#5c7a52]">{option.description}</span>
                    )}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#7e9a72]" />
                </button>
              ))}
            </div>
            {step > 0 && (
              <Button variant="ghost" size="sm" className="mt-4 text-[#5c7a52]" onClick={goBack}>
                Back
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[#e6ebe3]">
          <CardContent className="p-6">
            {sexualHealth && (
              <>
                <div className="mb-5 flex items-start gap-3 rounded-2xl bg-[#f4f7f2] p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5c7a52]/10">
                    <Stethoscope className="h-5 w-5 text-[#5c7a52]" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl text-[#2c3628]">
                      Doctor consultation included
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-[#5c7a52]">
                      {getSexualHealthConsultationSummary(programKey, answers.treatmentFocus)}
                    </p>
                  </div>
                </div>
                {answers.treatmentFocus && (
                  <div className="mb-5 rounded-xl border border-[#e6ebe3] bg-white p-4">
                    <p className="text-sm font-medium text-[#34412f]">Your focus</p>
                    <p className="mt-1 text-[#2c3628]">
                      {getSexualHealthFocusLabel(programKey, answers.treatmentFocus)}
                    </p>
                  </div>
                )}
              </>
            )}

            <h2 className="mb-1 text-lg font-medium text-[#2c3628]">Choose your plan</h2>
            <p className="mb-4 text-sm text-[#5c7a52]">
              All plans are subscriptions. Your first billing period includes your doctor
              consultation and program access — not a separate consultation fee.
            </p>

            <div className="mb-4 space-y-2">
              {PROGRAM_BILLING_TERM_OPTIONS.map((option) => {
                const quote = termQuotes.find((t) => t.term === option.term);
                const selected = billingTerm === option.term;
                return (
                  <button
                    key={option.term}
                    type="button"
                    disabled={pricingLoading || quote?.error}
                    onClick={() => {
                      setBillingTerm(option.term);
                      setClientSecret(null);
                      setAmountLabel(null);
                    }}
                    className={`flex w-full flex-col items-start rounded-xl border-2 px-4 py-3 text-left transition-all sm:flex-row sm:items-center sm:justify-between ${
                      selected
                        ? "border-emerald-600 bg-emerald-50"
                        : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"
                    }`}
                  >
                    <span className="font-medium text-[#2c3628]">{option.label}</span>
                    <span className="text-sm text-emerald-800">
                      {pricingLoading ? (
                        "Loading…"
                      ) : quote?.error ? (
                        "Not configured"
                      ) : (
                        <>
                          <span className="font-semibold">{quote?.dueTodayLabel}</span>
                          {quote?.recurringLabel && (
                            <span className="ml-1 text-[#5c7a52]">{quote.recurringLabel}</span>
                          )}
                        </>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mb-6 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                <span className="font-medium text-[#2c3628]">{label}</span>
                <span className="font-semibold text-emerald-800">
                  {selectedQuote?.dueTodayLabel ?? "—"} {selectedQuote?.recurringLabel}
                </span>
              </div>
              <p className="mt-2 text-xs text-[#5c7a52]">
                {programKey === "WEIGHT_MANAGEMENT"
                  ? "First month includes your doctor consultation, then ongoing billing at the cadence you selected."
                  : "First month includes your consultation. After your doctor confirms your treatment plan, ongoing pricing may be adjusted."}
              </p>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-[#5c7a52]">
                <Shield className="h-3.5 w-3.5" /> Consultation included in first period · AHPRA doctor
              </p>
            </div>

            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
            {clientSecret && amountLabel ? (
              <PortalPaymentForm
                clientSecret={clientSecret}
                amountLabel={amountLabel}
                submitLabel={`Subscribe to ${label}`}
                onConfirmed={confirmPayment}
              />
            ) : (
              <Button
                onClick={startPayment}
                disabled={loadingPayment}
                className="w-full bg-emerald-700 hover:bg-emerald-800"
              >
                {loadingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing checkout
                  </>
                ) : (
                  `Subscribe — ${selectedQuote?.dueTodayLabel ?? "…"}`
                )}
              </Button>
            )}
            {sexualHealth && (
              <p className="mt-3 text-center text-xs text-[#7e9a72]">
                No prescription is issued until after your consultation.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
