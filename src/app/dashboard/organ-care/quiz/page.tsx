"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  HeartPulse,
  Loader2,
  Sparkles,
  Stethoscope,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { usePortalContext } from "@/hooks/usePortalContext";
import {
  biomarkersQuizGenderLabel,
  deriveOrganCareQuizResult,
  getOrganCareQuizQuestions,
  isBiomarkersQuestionAnswered,
  organCareQuizMissingAnswers,
  parseBiomarkersAnswer,
  resolveBiomarkersQuizGender,
  toggleBiomarkersMultiAnswer,
} from "@/lib/programs/quizzes/organ-care-intake-quiz";
import {
  BIOMARKERS_PANEL_META,
  BIOMARKERS_UPSELL_META,
  ORGAN_CARE_UPSELL_META,
  type BiomarkersPanelTier,
  type OrganCareBillingTerm,
} from "@/lib/programs/offers";
import { ORGAN_CARE_CARD } from "@/lib/programs/catalog";
import { isOrganCareEntitled } from "@/lib/membership/organ-care-access";
import { PortalPaymentForm } from "@/components/portal/PortalPaymentForm";

const PROGRAMS_HUB = "/dashboard/programs";

type OrganCarePricing = {
  organCare: {
    name: string;
    description: string;
    options: Array<{
      term: OrganCareBillingTerm;
      label: string;
      priceLabel: string;
      amountAud: number;
      billingPriceId: string;
      promo: string | null;
    }>;
  };
  biomarkersUpsell: {
    panels: Array<{
      tier: BiomarkersPanelTier;
      name: string;
      description: string;
      markerCount: number;
      priceLabel: string | null;
      amountAud: number | null;
    }>;
  };
};

export default function OrganCareQuizPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { data: portal, isLoading: portalLoading } = usePortalContext();
  const hasOrganCare = isOrganCareEntitled(portal?.membership);

  useEffect(() => {
    if (portalLoading || !hasOrganCare) return;
    router.replace(ORGAN_CARE_CARD.hubRoute);
  }, [portalLoading, hasOrganCare, router]);

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [organCareTerm, setOrganCareTerm] = useState<OrganCareBillingTerm>("annual");
  const [addBiomarkers, setAddBiomarkers] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState<BiomarkersPanelTier>("essential");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [paidMessage, setPaidMessage] = useState<string | null>(null);
  const [pricing, setPricing] = useState<OrganCarePricing | null>(null);
  const [pricingLoading, setPricingLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/program-pricing?organCare=true")
      .then((r) => r.json())
      .then((data) => setPricing(data))
      .catch(() => setPricing(null))
      .finally(() => setPricingLoading(false));
  }, []);

  const questions = useMemo(
    () => getOrganCareQuizQuestions(user?.gender, answers),
    [user?.gender, answers]
  );
  const quizGender = resolveBiomarkersQuizGender(user?.gender, answers.clinicalSex);
  const genderLabel =
    quizGender === "neutral" ? null : biomarkersQuizGenderLabel(quizGender);
  const totalSteps = questions.length;
  const totalProgressSteps = totalSteps + 2;

  const question = questions[step];
  const onReview = step === totalSteps;
  const onCheckout = step === totalSteps + 1 || showCheckout;
  const previewResult = useMemo(
    () => (step >= totalSteps ? deriveOrganCareQuizResult(answers, user?.gender) : null),
    [step, totalSteps, answers, user?.gender]
  );

  const selectAnswer = (optionId: string) => {
    if (!question) return;

    if (question.id === "clinicalSex") {
      const nextAnswers = { clinicalSex: optionId };
      setAnswers(nextAnswers);
      setStep(0);
      return;
    }

    if (question.allowMultiple) {
      const nextValue = toggleBiomarkersMultiAnswer(answers[question.id], optionId);
      setAnswers((prev) => ({ ...prev, [question.id]: nextValue }));
      return;
    }

    const nextAnswers = { ...answers, [question.id]: optionId };
    const nextStep = step + 1;
    setAnswers(nextAnswers);
    setStep(nextStep);
  };

  const continueFromQuestion = () => {
    if (!question || !isBiomarkersQuestionAnswered(question, answers[question.id])) return;
    setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step === 0) return;
    setStep((s) => s - 1);
    setShowCheckout(false);
  };

  const goToCheckout = () => {
    const missing = organCareQuizMissingAnswers(user?.gender, answers);
    if (missing.length > 0) {
      setError("Please complete all questions before checkout.");
      return;
    }
    setShowCheckout(true);
    setStep(totalSteps + 1);
  };

  const startPayment = async () => {
    setLoadingPayment(true);
    setError(null);
    try {
      const res = await fetch("/api/portal/organ-care-checkout/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organCareTerm,
          addBiomarkers,
          panelTier: addBiomarkers ? selectedPanel : undefined,
          answers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not start checkout");
      setClientSecret(data.clientSecret);
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
    setSubmitting(true);
    try {
      const res = await fetch("/api/portal/organ-care-checkout/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId: result.paymentIntentId,
          consentRecordId: result.consentRecordId,
          organCareTerm,
          addBiomarkers,
          panelTier: addBiomarkers ? selectedPanel : undefined,
          answers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not confirm payment");
      setPaidMessage(data.message);
      setPaymentComplete(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const organOptions = pricing?.organCare.options ?? [];
  const panelOptions =
    pricing?.biomarkersUpsell.panels ??
    (Object.keys(BIOMARKERS_PANEL_META) as BiomarkersPanelTier[]).map((t) => ({
      ...BIOMARKERS_PANEL_META[t],
      priceLabel: null as string | null,
      amountAud: null as number | null,
    }));

  const selectedOrganOption = organOptions.find((o) => o.term === organCareTerm);
  const checkoutTotalAud =
    (selectedOrganOption?.amountAud ?? 0) +
    (addBiomarkers ? panelOptions.find((p) => p.tier === selectedPanel)?.amountAud ?? 0 : 0);
  const checkoutPriceLabel = pricingLoading
    ? "…"
    : checkoutTotalAud > 0
      ? `$${checkoutTotalAud} due today`
      : "—";

  if (portalLoading || hasOrganCare) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5c7a52]" />
      </div>
    );
  }

  if (paymentComplete) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-700" />
          </div>
          <h1 className="font-serif text-2xl text-[#2c3628]">Welcome to Organ Care</h1>
          <p className="mt-2 text-[#5c7a52]">
            {paidMessage || "Thank you — your membership is confirmed."}
          </p>
        </div>
        <Card className="mt-8 border-[#e6ebe3]">
          <CardContent className="p-6">
            <h2 className="font-medium text-[#2c3628]">What happens next</h2>
            <ol className="mt-4 space-y-4 text-sm text-[#5c7a52]">
              <li>Our care team reviews your organ health intake and clinical indications.</li>
              <li>An AHPRA doctor confirms Medicare-eligible blood tests where criteria are met.</li>
              <li>
                {addBiomarkers
                  ? "Your biomarker panel referral and organ dashboards are activated in your portal."
                  : "Your organ dashboards unlock — add biomarkers anytime for deeper insight."}
              </li>
            </ol>
          </CardContent>
        </Card>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild className="bg-emerald-700 hover:bg-emerald-800">
            <Link href={ORGAN_CARE_CARD.hubRoute}>Go to Organ Care</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={PROGRAMS_HUB}>Back to programs</Link>
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
          <HeartPulse className="h-3.5 w-3.5" /> {ORGAN_CARE_UPSELL_META.name}
        </span>
        <h1 className="font-serif text-2xl text-[#2c3628]">Organ health assessment</h1>
        <p className="text-sm text-[#5c7a52]">
          ~3 minutes · helps your doctor order the right blood tests with Medicare indications where eligible
          {genderLabel && (
            <span className="ml-2 rounded-full bg-[#e6ebe3] px-2 py-0.5 text-xs font-medium text-[#5c7a52]">
              {genderLabel} reference ranges
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
        {onReview ? "Review" : onCheckout ? "Choose plan" : `Question ${step + 1} of ${totalSteps} · ${question?.sectionTitle}`}
      </p>

      {onReview && previewResult ? (
        <Card className="border-[#e6ebe3]">
          <CardContent className="p-6">
            <div className="mb-5 flex items-start gap-3 rounded-2xl bg-[#f4f7f2] p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5c7a52]/10">
                <Stethoscope className="h-5 w-5 text-[#5c7a52]" />
              </div>
              <div>
                <h2 className="font-serif text-xl text-[#2c3628]">Clinical review summary</h2>
                <p className="mt-2 text-sm leading-relaxed text-[#5c7a52]">
                  We&apos;ve mapped {previewResult.sections.length} clinical categories from your answers.
                  Your doctor will confirm Medicare-eligible pathology and arrange any private tests.
                </p>
              </div>
            </div>

            {previewResult.organFocusAreas.length > 0 && (
              <div className="mb-4 rounded-xl border border-[#cdd8c6] bg-[#f4f7f2] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-[#5c7a52]">Your focus</p>
                <p className="mt-1 text-sm text-[#2c3628]">{previewResult.organFocusAreas.join(" · ")}</p>
              </div>
            )}

            <div className="mb-4 space-y-3">
              {previewResult.sections.slice(0, 6).map((section) => (
                <div key={section.sectionId + section.categoryName} className="rounded-xl border border-[#e6ebe3] bg-white px-4 py-3">
                  <p className="text-sm font-medium text-[#2c3628]">{section.categoryName}</p>
                  <p className="mt-1 text-xs text-[#5c7a52]">{section.clinicalIndications[0]}</p>
                  {section.medicareNotes[0] && (
                    <p className="mt-1 text-xs text-[#7e9a72]">Medicare: {section.medicareNotes[0]}</p>
                  )}
                </div>
              ))}
            </div>

            <Button onClick={goToCheckout} className="w-full bg-emerald-700 hover:bg-emerald-800">
              Continue to membership
            </Button>
            <Button variant="ghost" size="sm" className="mt-3 w-full text-[#5c7a52]" onClick={goBack}>
              Back
            </Button>
          </CardContent>
        </Card>
      ) : onCheckout && previewResult ? (
        <Card className="border-[#e6ebe3]">
          <CardContent className="p-6">
            <h2 className="font-serif text-xl text-[#2c3628]">Organ & Metabolic Care membership</h2>
            <p className="mt-2 text-sm text-[#5c7a52]">{ORGAN_CARE_CARD.tagline}</p>

            <div className="mt-5 space-y-2">
              <p className="text-sm font-medium text-[#34412f]">Choose your plan</p>
              {organOptions.map((option) => {
                const selected = organCareTerm === option.term;
                return (
                  <button
                    key={option.term}
                    type="button"
                    onClick={() => {
                      setOrganCareTerm(option.term);
                      setClientSecret(null);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-left transition-all ${
                      selected ? "border-emerald-600 bg-emerald-50" : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"
                    }`}
                  >
                    <span>
                      <span className="font-medium text-[#2c3628]">{option.label}</span>
                      {option.promo && (
                        <span className="ml-2 rounded-full bg-[#4a6243] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                          {option.promo}
                        </span>
                      )}
                    </span>
                    <span className="font-semibold text-emerald-800">{option.priceLabel}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-6 rounded-xl border border-[#cdd8c6] bg-gradient-to-br from-[#f4f7f2] to-white p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={addBiomarkers}
                  onChange={(e) => {
                    setAddBiomarkers(e.target.checked);
                    setClientSecret(null);
                  }}
                  className="mt-1"
                />
                <span className="flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#5c7a52]" />
                    <span className="font-medium text-[#2c3628]">{BIOMARKERS_UPSELL_META.headline}</span>
                    <span className="rounded-full bg-[#1D9E75] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                      {BIOMARKERS_UPSELL_META.badge}
                    </span>
                  </span>
                  <span className="mt-2 block text-sm text-[#5c7a52]">{BIOMARKERS_UPSELL_META.description}</span>
                </span>
              </label>
            </div>

            {addBiomarkers && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-[#34412f]">Biomarker panel</p>
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
                      className={`w-full rounded-xl border-2 px-4 py-3 text-left transition-all ${
                        selected ? "border-emerald-600 bg-emerald-50" : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-4">
                        <span className="font-medium text-[#2c3628]">{panel.name}</span>
                        <span className="font-semibold text-emerald-800">{panel.priceLabel ?? "—"}</span>
                      </div>
                      <p className="mt-1 text-sm text-[#5c7a52]">{panel.description}</p>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-baseline justify-between">
                <span className="font-medium text-[#2c3628]">Due today</span>
                <span className="font-semibold text-emerald-800">{checkoutPriceLabel}</span>
              </div>
              <p className="mt-2 text-xs text-[#5c7a52]">
                Includes doctor review of your intake and clinically indicated test ordering.
              </p>
            </div>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            {clientSecret ? (
              <div className="mt-4">
                <PortalPaymentForm
                  clientSecret={clientSecret}
                  amountLabel={checkoutPriceLabel}
                  submitLabel="Subscribe to Organ Care"
                  userId={user?.id}
                  customerEmail={user?.email}
                  onConfirmed={confirmPayment}
                />
              </div>
            ) : (
              <Button
                onClick={startPayment}
                disabled={loadingPayment || submitting}
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

            <Button variant="ghost" size="sm" className="mt-3 w-full text-[#5c7a52]" onClick={goBack}>
              Back
            </Button>
          </CardContent>
        </Card>
      ) : question ? (
        <Card className="border-[#e6ebe3]">
          <CardContent className="p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#7e9a72]">
              {question.sectionTitle}
            </p>
            <h2 className="mt-2 font-serif text-xl text-[#2c3628] sm:text-2xl">{question.prompt}</h2>
            {question.subtitle && <p className="mt-2 text-sm text-[#5c7a52]">{question.subtitle}</p>}

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
                        ? "border-[#5c7a52] bg-[#5c7a52]/10"
                        : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6] hover:bg-[#f4f7f2]"
                    }`}
                  >
                    <span>
                      <span className="block font-medium text-[#2c3628]">{option.label}</span>
                      {option.description && (
                        <span className="mt-0.5 block text-sm text-[#5c7a52]">{option.description}</span>
                      )}
                    </span>
                    {!question.allowMultiple && <ArrowRight className="h-4 w-4 shrink-0 text-[#7e9a72]" />}
                  </button>
                );
              })}
            </div>

            {question.allowMultiple && (
              <Button
                onClick={continueFromQuestion}
                disabled={!isBiomarkersQuestionAnswered(question, answers[question.id])}
                className="mt-5 w-full bg-emerald-700 hover:bg-emerald-800"
              >
                Continue
              </Button>
            )}

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
