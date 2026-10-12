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
import { normalizeProgramKey, PROGRAM_LABELS, type ProgramKey } from "@/lib/membership/keys";
import {
  getProgramOffer,
  PORTAL_PROGRAM_BILLING_TERM_OPTIONS,
  type ProgramBillingTerm,
} from "@/lib/programs/offers";
import { PROGRAM_CARDS } from "@/lib/programs/catalog";
import { isHiddenVitalityProgram } from "@/lib/programs/release-flags";
import { GENERIC_PROGRAM_QUIZ } from "@/lib/programs/quizzes/generic-program-quiz";
import {
  getSexualHealthConsultationSummary,
  getSexualHealthFocusLabel,
  getSexualHealthQuizSteps,
  isSexualHealthProgram,
} from "@/lib/programs/quizzes/sexual-health-quiz";
import { getPublicFunnelQuizSteps } from "@/lib/programs/quizzes/public-funnel-quizzes";
import { resolveHairQuizSex } from "@/lib/programs/quizzes/hair-assessment-options";
import { useAuth } from "@/contexts/AuthContext";
import { usePortalContext } from "@/hooks/usePortalContext";
import { hasProgramMembership } from "@/lib/membership/program-access";
import { PortalPaymentForm } from "@/components/portal/PortalPaymentForm";
import { PrePaymentConsentCheckbox } from "@/components/legal/PrePaymentConsentCheckbox";
import { ensurePrePaymentConsentRecorded } from "@/lib/legal/ensure-pre-payment-consent";

const PROGRAMS_HUB = "/dashboard/programs";

function withPostCheckoutOnboarding(route: string): string {
  const [path, query = ""] = route.split("?");
  const params = new URLSearchParams(query);
  params.set("onboarding", "post-checkout");
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

type TermQuote = {
  term: ProgramBillingTerm;
  label: string;
  dueTodayAud?: number;
  dueTodayLabel?: string;
  recurringLabel?: string;
  priceLabel?: string;
  compareAtAud?: number | null;
  savingsPercent?: number | null;
  savingsLabel?: string | null;
  error?: boolean;
};

function getQuizSteps(
  programKey: ProgramKey,
  answers: Record<string, string>,
  gender?: string | null
) {
  const sexualHealthSteps = getSexualHealthQuizSteps(programKey, answers);
  if (sexualHealthSteps) return sexualHealthSteps;
  const funnelSteps = getPublicFunnelQuizSteps(programKey, gender, answers);
  if (funnelSteps) return funnelSteps;
  return GENERIC_PROGRAM_QUIZ;
}

export default function InPortalProgramPage() {
  const params = useParams<{ program: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { data: portal, isLoading: portalLoading, refetch: refetchPortal } = usePortalContext();
  const programKey = useMemo(
    () => normalizeProgramKey(params?.program) as ProgramKey | null,
    [params?.program]
  );

  const existingProgram = programKey ? portal?.membership?.programs?.[programKey] : null;
  const shouldRedirectToDashboard =
    Boolean(programKey && hasProgramMembership(portal?.membership, programKey));

  const [funnelQuizChecked, setFunnelQuizChecked] = useState(false);
  const [funnelQuizReady, setFunnelQuizReady] = useState(false);

  useEffect(() => {
    if (isHiddenVitalityProgram(programKey)) {
      router.replace(PROGRAMS_HUB);
      return;
    }
    if (portalLoading || !programKey || !shouldRedirectToDashboard) return;
    const card = PROGRAM_CARDS.find((c) => c.key === programKey);
    if (card?.dashboardRoute) {
      router.replace(card.dashboardRoute);
    }
  }, [portalLoading, programKey, shouldRedirectToDashboard, router]);

  // Public clinical funnel already collected this quiz — restore access and open the program.
  useEffect(() => {
    if (portalLoading || !programKey || shouldRedirectToDashboard || funnelQuizChecked) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/portal/ensure-funnel-program", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ programKey }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data?.entitled) {
          setFunnelQuizReady(true);
          await refetchPortal();
          const card = PROGRAM_CARDS.find((c) => c.key === programKey);
          router.replace(data.dashboardRoute || card?.dashboardRoute || PROGRAMS_HUB);
          return;
        }
      } catch {
        // Fall through to in-portal quiz.
      } finally {
        if (!cancelled) setFunnelQuizChecked(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    portalLoading,
    programKey,
    shouldRedirectToDashboard,
    funnelQuizChecked,
    refetchPortal,
    router,
  ]);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [amountLabel, setAmountLabel] = useState<string | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [billingTerm, setBillingTerm] = useState<ProgramBillingTerm>("3m");
  const [termQuotes, setTermQuotes] = useState<TermQuote[]>([]);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [includedCare, setIncludedCare] = useState(false);
  const [includedDays, setIncludedDays] = useState(30);
  const [chargeLeadDays, setChargeLeadDays] = useState(7);
  const [consentChecked, setConsentChecked] = useState(false);

  // Prefer DB gender from portal context — session JWT can lag after funnel signup.
  const knownQuizSex = useMemo(
    () => resolveHairQuizSex(portal?.gender || user?.gender),
    [portal?.gender, user?.gender]
  );

  useEffect(() => {
    if (!knownQuizSex) return;
    setAnswers((prev) => (prev.gender ? prev : { ...prev, gender: knownQuizSex }));
  }, [knownQuizSex]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  useEffect(() => {
    if (!programKey) return;
    setPricingLoading(true);
    fetch(`/api/portal/program-pricing?programKey=${programKey}`)
      .then((r) => r.json())
      .then((data) => {
        setTermQuotes(data.terms ?? []);
        setIncludedCare(data.includedCare === true);
        if (typeof data.includedDays === "number") setIncludedDays(data.includedDays);
        if (typeof data.chargeLeadDays === "number") setChargeLeadDays(data.chargeLeadDays);
      })
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

  if (
    isHiddenVitalityProgram(programKey) ||
    portalLoading ||
    shouldRedirectToDashboard ||
    !funnelQuizChecked ||
    funnelQuizReady
  ) {
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
  const quizSteps = getQuizSteps(programKey, answers, knownQuizSex || user?.gender);
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
      if (includedCare) {
        const consentResult = await ensurePrePaymentConsentRecorded({
          consentChecked,
          sourcePage: `/dashboard/programs/${programKey.toLowerCase()}`,
          email: user?.email,
          userId: user?.id,
        });
        if (!consentResult.ok) {
          throw new Error(consentResult.error);
        }
      }
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
      if (data.includedCare) {
        await refetchPortal();
        setPaymentComplete(true);
        return;
      }
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setAmountLabel(data.dueTodayLabel || data.priceLabel || selectedQuote?.dueTodayLabel || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoadingPayment(false);
    }
  };

  const confirmPayment = async (result: {
    paymentIntentId?: string;
    consentRecordId: string;
  }) => {
    const res = await fetch("/api/portal/checkout/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentIntentId: result.paymentIntentId,
        consentRecordId: result.consentRecordId,
        answers,
        programKey,
        billingTerm,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      const message = data?.error || "Could not confirm payment";
      if (/consent|unauthorized|belong/i.test(message)) {
        setClientSecret(null);
        setPaymentIntentId(null);
        setAmountLabel(null);
      }
      throw new Error(message);
    }
    await refetchPortal();
    setPaymentComplete(true);
  };

  const resetPaymentSession = () => {
    setClientSecret(null);
    setPaymentIntentId(null);
    setAmountLabel(null);
  };

  if (paymentComplete) {
    const firstName = user?.firstName?.trim();
    return (
      <div className="mx-auto max-w-xl px-4 py-12 text-center sm:py-16">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
          <CheckCircle2 className="h-8 w-8 text-emerald-700" />
        </div>
        <h1 className="mb-3 font-serif text-2xl text-[#2c3628]">
          {firstName ? `Thanks, ${firstName}` : "You're all set"}
        </h1>
        <p className="mx-auto max-w-md text-[#5c7a52] leading-relaxed">
          Thanks for completing your {label} enrolment. Your care partner will be in touch to
          review your intake and book a doctor consultation for you.
        </p>
        {sexualHealth ? (
          <p className="mx-auto mt-4 max-w-md text-sm text-[#5c7a52]/90 leading-relaxed">
            If treatment is recommended, your doctor will only prescribe after confirming
            it&apos;s safe and right for you.
          </p>
        ) : null}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="bg-emerald-700 hover:bg-emerald-800">
            <Link href={withPostCheckoutOnboarding(card?.dashboardRoute || "/dashboard")}>
              {`Go to ${label}`}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={PROGRAMS_HUB}>Back to programs</Link>
          </Button>
        </div>
      </div>
    );
  }

  const progress = totalProgress > 0 ? Math.min(100, Math.round(((step + 1) / totalProgress) * 100)) : 0;
  const focusLabel =
    sexualHealth && answers.treatmentFocus
      ? getSexualHealthFocusLabel(programKey, answers.treatmentFocus)
      : null;

  return (
    <div className="mx-auto max-w-lg py-2 sm:py-4">
      <Link
        href={PROGRAMS_HUB}
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-[#5c7a52] hover:text-[#34412f]"
      >
        <ArrowLeft className="h-4 w-4" /> Programs
      </Link>

      <div className="mb-5">
        <p className="text-xs font-medium tracking-wide text-[#7e9a72]">
          {onQuiz ? `Question ${step + 1} of ${quizSteps.length}` : "Your plan"}
        </p>
        <h1 className="mt-1 font-serif text-2xl text-[#2c3628] sm:text-[1.75rem]">{label}</h1>
        <p className="mt-1 text-sm leading-relaxed text-[#5c7a52]">{offer.headline}</p>
        {focusLabel && step > 0 && (
          <p className="mt-3 inline-flex rounded-full bg-[#f4f7f2] px-3 py-1 text-sm text-[#34412f]">
            {focusLabel}
          </p>
        )}
      </div>

      <div className="mb-6 h-1 overflow-hidden rounded-full bg-[#e6ebe3]">
        <div
          className="h-full rounded-full bg-[#5c7a52] transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {onQuiz && question ? (
        <div>
          <h2 className="font-serif text-xl leading-snug text-[#2c3628] sm:text-2xl">
            {question.prompt}
          </h2>
          {question.subtitle && (
            <p className="mt-2 text-sm leading-relaxed text-[#5c7a52]">{question.subtitle}</p>
          )}
          <div className="mt-5 space-y-2.5">
            {question.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => selectAnswer(option.id)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-[#e6ebe3] bg-white px-4 py-4 text-left shadow-sm transition-colors hover:border-[#5c7a52] hover:bg-[#f7faf6]"
              >
                <span className="min-w-0">
                  <span className="block font-medium leading-snug text-[#2c3628]">{option.label}</span>
                  {option.description && (
                    <span className="mt-1 block text-sm leading-relaxed text-[#5c7a52]">
                      {option.description}
                    </span>
                  )}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#7e9a72]" />
              </button>
            ))}
          </div>
          {step > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="mt-5 inline-flex items-center gap-1.5 text-sm text-[#5c7a52] hover:text-[#34412f]"
            >
              <ArrowLeft className="h-4 w-4" /> Previous question
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {sexualHealth && (
            <div className="flex items-start gap-3 rounded-2xl bg-[#f4f7f2] px-4 py-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
                <Stethoscope className="h-5 w-5 text-[#5c7a52]" />
              </div>
              <div className="min-w-0">
                <h2 className="font-medium text-[#2c3628]">Doctor consultation included</h2>
                <p className="mt-1 text-sm leading-relaxed text-[#5c7a52]">
                  {getSexualHealthConsultationSummary(programKey, answers.treatmentFocus)}
                </p>
              </div>
            </div>
          )}

          <div>
            <h2 className="font-serif text-xl text-[#2c3628]">Choose how to pay</h2>
            <p className="mt-1 text-sm leading-relaxed text-[#5c7a52]">
              {includedCare
                ? "No charge today. Pick how often the program fee runs after the included period."
                : "Every 3 months, or once a year and save 10%."}
            </p>
          </div>

          <div className="space-y-3">
            {PORTAL_PROGRAM_BILLING_TERM_OPTIONS.map((option) => {
              const quote = termQuotes.find((t) => t.term === option.term);
              const selected = billingTerm === option.term;
              const isAnnual = option.term === "12m";
              const amount = pricingLoading
                ? "…"
                : quote?.error
                  ? "Unavailable"
                  : includedCare
                    ? "No charge today"
                    : isAnnual
                      ? `$${quote?.dueTodayAud?.toFixed(0) ?? "—"}/year`
                      : quote?.dueTodayAud != null
                        ? `$${quote.dueTodayAud.toFixed(0)}`
                        : "—";
              const detail = quote?.error
                ? "This price is not available yet."
                : includedCare
                  ? quote?.priceLabel
                    ? `Then ${quote.priceLabel}`
                    : ""
                  : isAnnual
                    ? quote?.compareAtAud != null
                      ? `$${quote.compareAtAud.toFixed(0)} if billed every 3 months`
                      : "Billed once a year"
                    : "Billed every 3 months";

              return (
                <button
                  key={option.term}
                  type="button"
                  disabled={pricingLoading || quote?.error}
                  onClick={() => {
                    setBillingTerm(option.term);
                    resetPaymentSession();
                  }}
                  className={`w-full rounded-2xl border px-4 py-4 text-left transition-colors disabled:opacity-60 ${
                    selected
                      ? "border-[#5c7a52] bg-[#f4f7f2] ring-1 ring-[#5c7a52]"
                      : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"
                  }`}
                >
                  <span className="flex items-start justify-between gap-4">
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-2 font-medium text-[#2c3628]">
                        {option.label}
                        {isAnnual && !quote?.error && (
                          <span className="rounded-full bg-[#5c7a52] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                            Save 10%
                          </span>
                        )}
                      </span>
                      {detail && (
                        <span className="mt-1 block text-sm leading-relaxed text-[#5c7a52]">
                          {isAnnual && quote?.compareAtAud != null && !quote.error && !includedCare ? (
                            <>
                              <span className="line-through">${quote.compareAtAud.toFixed(0)}</span>
                              {" if billed every 3 months"}
                            </>
                          ) : (
                            detail
                          )}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-right text-base font-semibold text-[#2c3628]">
                      {amount}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <p className="flex items-start gap-2 text-sm leading-relaxed text-[#5c7a52]">
            <Shield className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {includedCare
                ? `The first ${includedDays} days are included after your doctor approves ${label}. Your card is charged ${chargeLeadDays} days before the paid period starts. An AHPRA-registered doctor consultation is included.`
                : "Charged today, then on the same cadence. An AHPRA-registered doctor consultation is included."}
            </span>
          </p>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          )}

          {clientSecret && paymentIntentId && amountLabel ? (
            <div>
              <PortalPaymentForm
                clientSecret={clientSecret}
                paymentIntentId={paymentIntentId}
                amountLabel={amountLabel}
                submitLabel={`Pay and start ${label}`}
                userId={user?.id}
                customerEmail={user?.email}
                returnUrl={
                  typeof window !== "undefined"
                    ? `${window.location.origin}/dashboard/programs/${params?.program ?? programKey.toLowerCase()}`
                    : "/dashboard/programs"
                }
                onConfirmed={confirmPayment}
                onPaymentFailed={resetPaymentSession}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {includedCare && (
                <PrePaymentConsentCheckbox
                  checked={consentChecked}
                  onCheckedChange={setConsentChecked}
                  disabled={loadingPayment}
                />
              )}
              <Button
                onClick={startPayment}
                disabled={loadingPayment || pricingLoading || (includedCare && !consentChecked)}
                className="h-12 w-full bg-[#5c7a52] text-base hover:bg-[#4a6343]"
              >
                {loadingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing
                  </>
                ) : includedCare ? (
                  "Start included care"
                ) : (
                  `Continue to payment`
                )}
              </Button>
            </div>
          )}

          <button
            type="button"
            onClick={goBack}
            className="inline-flex items-center gap-1.5 text-sm text-[#5c7a52] hover:text-[#34412f]"
          >
            <ArrowLeft className="h-4 w-4" /> Previous question
          </button>
        </div>
      )}
    </div>
  );
}
