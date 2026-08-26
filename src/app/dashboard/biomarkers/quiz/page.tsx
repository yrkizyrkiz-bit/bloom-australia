"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Beaker,
  CheckCircle2,
  Loader2,
  PlayCircle,
  RotateCcw,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { usePortalContext } from "@/hooks/usePortalContext";
import {
  biomarkersQuizGenderLabel,
  biomarkersQuizMissingAnswers,
  biomarkersQuizTotalSteps,
  deriveBiomarkersQuizResult,
  getBiomarkersQuizQuestions,
  isBiomarkersQuestionAnswered,
  parseBiomarkersAnswer,
  resolveBiomarkersQuizGender,
  toggleBiomarkersMultiAnswer,
} from "@/lib/programs/quizzes/biomarkers-intake-quiz";
import {
  canResumeBiomarkersQuiz,
  clearBiomarkersQuizProgress,
  getBiomarkersQuizProgressPercent,
  readBiomarkersQuizProgressRaw,
  saveBiomarkersQuizProgress,
} from "@/lib/programs/quizzes/biomarkers-quiz-storage";
import {
  BIOMARKERS_PANEL_META,
  type BiomarkersPanelTier,
} from "@/lib/programs/offers";
import { PortalPaymentForm } from "@/components/portal/PortalPaymentForm";

const PROGRAMS_HUB = "/dashboard/programs";

type BiomarkersPricing = {
  panels: Array<{
    tier: BiomarkersPanelTier;
    name: string;
    description: string;
    markerCount: number;
    priceLabel: string | null;
    amountAud: number | null;
  }>;
};

export default function BiomarkersQuizPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { data: portal, isLoading: portalLoading } = usePortalContext();
  const hasBiomarkersEntitlement = Boolean(
    portal?.membership?.scopes?.BIOLOGICAL_CLOCK?.hasEntitlement
  );

  useEffect(() => {
    if (portalLoading || !hasBiomarkersEntitlement) return;
    const clockReady = portal?.membership?.biologicalClock?.state === "ready";
    router.replace(clockReady ? "/dashboard/biological-age" : "/dashboard/biomarkers");
  }, [portalLoading, hasBiomarkersEntitlement, portal?.membership?.biologicalClock?.state, router]);

  const [hydrated, setHydrated] = useState(false);
  const [resumeOffer, setResumeOffer] = useState<{
    stepIndex: number;
    answers: Record<string, string>;
    percent: number;
  } | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPanelPicker, setShowPanelPicker] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState<BiomarkersPanelTier>("essential");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [paidMessage, setPaidMessage] = useState<string | null>(null);
  const [pricing, setPricing] = useState<BiomarkersPricing | null>(null);
  const [pricingLoading, setPricingLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/program-pricing?biomarkers=true")
      .then((r) => r.json())
      .then((data) => setPricing(data))
      .catch(() => setPricing(null))
      .finally(() => setPricingLoading(false));
  }, []);

  const questions = useMemo(
    () => getBiomarkersQuizQuestions(user?.gender, answers),
    [user?.gender, answers]
  );
  const quizGender = resolveBiomarkersQuizGender(user?.gender, answers.clinicalSex);
  const genderLabel =
    quizGender === "neutral" ? null : biomarkersQuizGenderLabel(quizGender);
  const totalSteps = questions.length;
  const totalProgressSteps = totalSteps + 2; // review + panel picker
  const resumeInitRef = useRef(false);

  useEffect(() => {
    if (!user?.id) return;
    setHydrated(true);
    if (resumeInitRef.current) return;
    resumeInitRef.current = true;

    const saved = readBiomarkersQuizProgressRaw(user.id);
    if (!saved) return;

    const savedTotalSteps = biomarkersQuizTotalSteps(user.gender, saved.answers);
    if (saved.stepIndex > savedTotalSteps) return;
    if (!canResumeBiomarkersQuiz(saved, savedTotalSteps)) return;

    setResumeOffer({
      stepIndex: saved.stepIndex,
      answers: saved.answers,
      percent: getBiomarkersQuizProgressPercent(saved, savedTotalSteps),
    });
  }, [user?.id, user?.gender]);

  const persist = useCallback(
    (nextStep: number, nextAnswers: Record<string, string>, completed = false) => {
      if (!user?.id) return;
      saveBiomarkersQuizProgress(user.id, {
        stepIndex: nextStep,
        answers: nextAnswers,
        completed,
      });
    },
    [user?.id]
  );

  const question = questions[step];
  const onReview = step === totalSteps;
  const onPanelPicker = step === totalSteps + 1 || showPanelPicker;
  const previewResult = useMemo(
    () => (step >= totalSteps ? deriveBiomarkersQuizResult(answers, user?.gender) : null),
    [step, totalSteps, answers, user?.gender]
  );

  const selectAnswer = (optionId: string) => {
    if (!question) return;

    if (question.id === "clinicalSex") {
      const nextAnswers = { clinicalSex: optionId };
      setAnswers(nextAnswers);
      setStep(0);
      persist(0, nextAnswers);
      return;
    }

    if (question.allowMultiple) {
      const nextValue = toggleBiomarkersMultiAnswer(answers[question.id], optionId);
      const nextAnswers = { ...answers, [question.id]: nextValue };
      setAnswers(nextAnswers);
      persist(step, nextAnswers);
      return;
    }

    const nextAnswers = { ...answers, [question.id]: optionId };
    const nextStep = step + 1;
    setAnswers(nextAnswers);
    setStep(nextStep);
    persist(nextStep, nextAnswers);
  };

  const continueFromQuestion = () => {
    if (!question || !isBiomarkersQuestionAnswered(question, answers[question.id])) return;
    const nextStep = step + 1;
    setStep(nextStep);
    persist(nextStep, answers);
  };

  const goBack = () => {
    if (step === 0) return;
    setStep((s) => s - 1);
  };

  const startFresh = () => {
    if (user?.id) clearBiomarkersQuizProgress(user.id);
    setResumeOffer(null);
    setStep(0);
    setAnswers({});
    setPaymentComplete(false);
    setError(null);
  };

  const resumeQuiz = () => {
    if (!resumeOffer) return;
    setAnswers(resumeOffer.answers);
    setStep(Math.min(resumeOffer.stepIndex, totalSteps));
    setResumeOffer(null);
  };

  const goToPanelPicker = () => {
    setShowPanelPicker(true);
    setStep(totalSteps + 1);
    const suggested = previewResult?.suggestedPanel;
    if (suggested === "extended" || suggested === "comprehensive" || suggested === "essential") {
      setSelectedPanel(suggested);
    }
  };

  const startPanelPayment = async () => {
    setLoadingPayment(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/biomarkers-checkout/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          panelTier: selectedPanel,
          answers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not start checkout");
      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoadingPayment(false);
    }
  };

  const confirmPanelPayment = async (result: {
    paymentIntentId?: string;
    consentRecordId: string;
  }) => {
    const res = await fetch("/api/portal/biomarkers-checkout/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentIntentId: result.paymentIntentId,
        consentRecordId: result.consentRecordId,
        panelTier: selectedPanel,
        answers,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "Could not confirm payment");
    if (user?.id) clearBiomarkersQuizProgress(user.id);
    setPaidMessage(
      data.message ||
        "Payment received. Our care team will book your consultation and arrange your biomarker panel."
    );
    setPaymentComplete(true);
  };

  const panelOptions = pricing?.panels ?? (Object.keys(BIOMARKERS_PANEL_META) as BiomarkersPanelTier[]).map((t) => ({
    ...BIOMARKERS_PANEL_META[t],
    priceLabel: null as string | null,
    amountAud: null as number | null,
  }));

  const checkoutTotalAud =
    panelOptions.find((p) => p.tier === selectedPanel)?.amountAud ?? 0;
  const checkoutPriceLabel = pricingLoading
    ? "…"
    : checkoutTotalAud > 0
      ? `$${checkoutTotalAud} due today`
      : "—";

  if (!hydrated || portalLoading || hasBiomarkersEntitlement) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5c7a52]" />
      </div>
    );
  }

  if (resumeOffer && !paymentComplete && step === 0 && Object.keys(answers).length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card className="border-[#e6ebe3]">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4f7f2]">
              <Beaker className="h-7 w-7 text-[#5c7a52]" />
            </div>
            <h1 className="font-serif text-2xl text-[#2c3628]">Continue your biomarkers quiz?</h1>
            <p className="mt-2 text-sm text-[#5c7a52]">
              You&apos;re about {resumeOffer.percent}% through, pick up where you left off.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                className="bg-emerald-700 hover:bg-emerald-800"
                onClick={resumeQuiz}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Resume quiz
              </Button>
              <Button variant="outline" onClick={startFresh}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Start over
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (paymentComplete) {
    const purchasedPanel = panelOptions.find((p) => p.tier === selectedPanel);

    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-700" />
          </div>
          <h1 className="font-serif text-2xl text-[#2c3628]">Payment received</h1>
          <p className="mt-2 text-[#5c7a52]">
            {paidMessage ||
              "Thank you, your biomarker subscription is confirmed."}
          </p>
        </div>

        <Card className="mt-8 border-[#e6ebe3]">
          <CardContent className="p-6">
            <h2 className="font-medium text-[#2c3628]">What happens next</h2>
            <ol className="mt-4 space-y-4 text-sm text-[#5c7a52]">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">
                  1
                </span>
                <span>
                  Our care team reviews your intake
                  {purchasedPanel ? ` and ${purchasedPanel.name}` : ""}.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">
                  2
                </span>
                <span>
                  We&apos;ll book your doctor consultation, included in your first year.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">
                  3
                </span>
                <span>
                  Your pathology referral is arranged and you&apos;ll receive collection instructions.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">
                  4
                </span>
                <span>
                  When results are in, your Biological Clock insights and follow-up review appear in
                  your portal.
                </span>
              </li>
            </ol>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="bg-emerald-700 hover:bg-emerald-800">
            <Link href={PROGRAMS_HUB}>Back to programs</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/biomarkers">Biomarkers hub</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Link
        href={PROGRAMS_HUB}
        className="mb-6 inline-flex items-center gap-1 text-sm text-[#5c7a52] hover:text-[#34412f]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to programs
      </Link>

      <div className="mb-6">
        <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-[#e6ebe3] px-3 py-1 text-xs font-medium text-[#5c7a52]">
          <Beaker className="h-3.5 w-3.5" /> Get My Biomarkers
        </span>
        <h1 className="font-serif text-2xl text-[#2c3628]">Clinical intake</h1>
        <p className="text-sm text-[#5c7a52]">
          ~2 minutes · helps your doctor request the right tests
          {genderLabel && (
            <span className="ml-2 rounded-full bg-[#e6ebe3] px-2 py-0.5 text-xs font-medium text-[#5c7a52]">
              Personalised for {genderLabel.toLowerCase()} reference ranges
            </span>
          )}
        </p>
      </div>

      <div className="mb-2 flex gap-1">
        {Array.from({ length: totalProgressSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-[#5c7a52]" : "bg-[#e6ebe3]"}`}
          />
        ))}
      </div>
      <p className="mb-6 text-xs text-[#7e9a72]">
        {onReview
          ? "Review"
          : onPanelPicker
            ? "Choose panel"
            : `Section ${step + 1} of ${totalSteps} · ${question?.sectionTitle}`}
      </p>

      {onReview && previewResult ? (
        <Card className="border-[#e6ebe3]">
          <CardContent className="p-6">
            <div className="mb-5 flex items-start gap-3 rounded-2xl bg-[#f4f7f2] p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5c7a52]/10">
                <Stethoscope className="h-5 w-5 text-[#5c7a52]" />
              </div>
              <div>
                <h2 className="font-serif text-xl text-[#2c3628]">Doctor review next</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#5c7a52]">
                  Based on your answers, we&apos;ve mapped clinical indications across{" "}
                  {previewResult.sections.length} categories. An AHPRA doctor will confirm
                  Medicare-eligible tests and arrange your Sanative panel.
                </p>
              </div>
            </div>

            <div className="mb-4 space-y-3">
              {previewResult.sections.map((section) => (
                <div
                  key={section.sectionId}
                  className="rounded-xl border border-[#e6ebe3] bg-white px-4 py-3"
                >
                  <p className="text-sm font-medium text-[#2c3628]">{section.categoryName}</p>
                  <p className="mt-1 text-xs text-[#5c7a52]">
                    {section.clinicalIndications[0]}
                  </p>
                </div>
              ))}
            </div>

            <p className="mb-4 text-xs text-[#7e9a72]">
              Panel level:{" "}
              <span className="capitalize text-[#5c7a52]">{previewResult.suggestedPanel}</span>
              {previewResult.hasMedicareEligibleIndications &&
                " · Medicare indications documented"}
            </p>

            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
            <Button
              onClick={goToPanelPicker}
              className="w-full bg-emerald-700 hover:bg-emerald-800"
            >
              Let&apos;s get you tested
            </Button>
            <Button variant="ghost" size="sm" className="mt-3 w-full text-[#5c7a52]" onClick={goBack}>
              Back
            </Button>
          </CardContent>
        </Card>
      ) : onPanelPicker && previewResult ? (
        <Card className="border-[#e6ebe3]">
          <CardContent className="p-6">
            <h2 className="font-serif text-xl text-[#2c3628]">Select your biomarker panel</h2>
            <p className="mt-2 text-sm text-[#5c7a52]">
              Annual subscriptions. All panels include a doctor consultation, follow-up review, and
              Biological Clock insights in your first year.
            </p>

            <div className="mt-5 space-y-3">
              {panelOptions.map((panel) => {
                const selected = selectedPanel === panel.tier;
                return (
                  <button
                    key={panel.tier}
                    type="button"
                    onClick={() => {
                      setSelectedPanel(panel.tier);
                      setClientSecret(null);
                    }}
                    className={`w-full rounded-xl border-2 px-4 py-4 text-left transition-all ${
                      selected
                        ? "border-emerald-600 bg-emerald-50"
                        : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-medium text-[#2c3628]">{panel.name}</span>
                      <span className="font-semibold text-emerald-800">
                        {pricingLoading ? "…" : panel.priceLabel ?? "—"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-[#5c7a52]">{panel.description}</p>
                    <p className="mt-1 text-xs text-[#7e9a72]">{panel.markerCount}+ markers · annual</p>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-xl border border-[#e6ebe3] bg-[#f4f7f2] p-4">
              <p className="font-medium text-[#2c3628]">
                Biological Clock + Organ Care included
              </p>
              <p className="mt-1 text-sm text-[#5c7a52]">
                Every panel unlocks your Biological Clock and Organ Care dashboards
                at no extra cost.
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-baseline justify-between">
                <span className="font-medium text-[#2c3628]">Due today</span>
                <span className="font-semibold text-emerald-800">{checkoutPriceLabel}</span>
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            {clientSecret && paymentIntentId ? (
              <div className="mt-4">
                <PortalPaymentForm
                  clientSecret={clientSecret}
                  paymentIntentId={paymentIntentId}
                  amountLabel={checkoutPriceLabel}
                  submitLabel="Subscribe & book testing"
                  userId={user?.id}
                  customerEmail={user?.email}
                  returnUrl={`${typeof window !== "undefined" ? window.location.origin : ""}/dashboard/biomarkers/quiz`}
                  onConfirmed={confirmPanelPayment}
                  onPaymentFailed={() => {
                    setClientSecret(null);
                    setPaymentIntentId(null);
                  }}
                />
              </div>
            ) : (
              <Button
                onClick={startPanelPayment}
                disabled={loadingPayment}
                className="mt-4 w-full bg-emerald-700 hover:bg-emerald-800"
              >
                {loadingPayment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Preparing checkout
                  </>
                ) : (
                  "Continue to payment"
                )}
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="mt-3 w-full text-[#5c7a52]"
              onClick={() => {
                setShowPanelPicker(false);
                setStep(totalSteps);
                setClientSecret(null);
              }}
            >
              Back
            </Button>
          </CardContent>
        </Card>
      ) : question ? (
        <Card className="border-[#e6ebe3]">
          <CardContent className="p-6">
            <p className="text-xs font-medium uppercase tracking-wide text-[#7e9a72]">
              {question.sectionTitle}
            </p>
            <p className="mt-1 text-sm text-[#5c7a52]">{question.sectionDescription}</p>
            <h2 className="mt-4 font-serif text-xl text-[#2c3628] sm:text-2xl">{question.prompt}</h2>
            {question.subtitle && (
              <p className="mt-2 text-sm text-[#7e9a72]">{question.subtitle}</p>
            )}
            {question.allowMultiple && (
              <p className="mt-2 text-sm font-medium text-[#5c7a52]">Select all that apply</p>
            )}
            <div className="mt-5 space-y-3">
              {question.options.map((option) => {
                const selected = question.allowMultiple
                  ? parseBiomarkersAnswer(answers[question.id]).includes(option.id)
                  : answers[question.id] === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => selectAnswer(option.id)}
                    className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-4 text-left transition-all ${
                      selected
                        ? "border-emerald-600 bg-emerald-50"
                        : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6] hover:bg-[#f4f7f2]"
                    }`}
                  >
                    <span className="flex items-start gap-3">
                      {question.allowMultiple && (
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                            selected
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "border-[#cdd8c6] bg-white"
                          }`}
                          aria-hidden
                        >
                          {selected ? "✓" : ""}
                        </span>
                      )}
                      <span>
                        <span className="block font-medium text-[#2c3628]">{option.label}</span>
                        {option.description && (
                          <span className="mt-0.5 block text-sm text-[#5c7a52]">{option.description}</span>
                        )}
                      </span>
                    </span>
                    {!question.allowMultiple && (
                      <ArrowRight className="h-4 w-4 shrink-0 text-[#7e9a72]" />
                    )}
                  </button>
                );
              })}
            </div>
            {question.allowMultiple ? (
              <Button
                onClick={continueFromQuestion}
                disabled={!isBiomarkersQuestionAnswered(question, answers[question.id])}
                className="mt-5 w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50"
              >
                Continue
              </Button>
            ) : null}
            {step > 0 && (
              <Button variant="ghost" size="sm" className="mt-4 text-[#5c7a52]" onClick={goBack}>
                Back
              </Button>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
