"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import type { CheckoutPaymentSuccess } from "@/lib/checkout/payment-success";
import {
  rememberMetaFunnelSource,
  trackMetaEvent,
  trackMetaPurchaseOnce,
} from "@/lib/analytics/meta-pixel";
import {
  detectCheckoutWalletOs,
  stripeCheckoutElementsPaymentMethodOrder,
} from "@/lib/checkout/stripe-payment-methods";
import { LP_FUNNEL_SOURCE, LP_PATH, PRICING } from "@/lib/lp/weight-management";
import { trackLpWmFunnelProgress } from "@/lib/lp/weight-management-analytics";
import {
  formatAppointmentSydney,
  isLpWmClosedWeekday,
  isLpWmHiddenWeekday,
  LP_WM_FUNNEL_STAGE_LABELS,
  lpWmPaymentGate,
  validateLpWmContact,
  validateLpWmQuizAnswers,
  visibleLpWmQuizSteps,
  type LpWmContact,
  type LpWmSlot,
} from "@/lib/lp/weight-management-funnel";
import type { LpWmAvailabilitySlot } from "@/lib/lp/availability";
import { LpWmPaymentForm } from "./payment-form";
import { LpWmQualificationStep } from "./qualification-step";
import { LpWmQuizStep } from "./quiz-step";
import { LpWmSlotPicker } from "./slot-picker";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
const DRAFT_KEY = "lp_wm_funnel_draft";
const TOKEN_KEY = "lp_wm_funnel_token";

type Step = "quiz" | "qualify" | "details" | "payment" | "thanks";

type Draft = LpWmContact & {
  slot: LpWmSlot | null;
  paymentIntentId?: string;
  clientSecret?: string;
  accessToken?: string;
  paid?: boolean;
  quizAnswers?: Record<string, string>;
  screen?: "quiz" | "qualify" | "details" | "payment";
};

function StageNav({ current }: { current: "quiz" | "book" | "pay" }) {
  const currentIndex = LP_WM_FUNNEL_STAGE_LABELS.findIndex((stage) => stage.id === current);
  return (
    <ol className="mb-8 flex gap-2">
      {LP_WM_FUNNEL_STAGE_LABELS.map((stage, index) => {
        const active = index <= currentIndex;
        return (
          <li
            key={stage.id}
            className={`flex-1 text-center text-[11px] font-medium sm:text-xs ${
              active ? "text-[#4f6038]" : "text-neutral-400"
            }`}
          >
            <div className={`mb-2 h-1 rounded-full ${active ? "bg-[#4f6038]" : "bg-gray-200"}`} />
            {stage.label}
          </li>
        );
      })}
    </ol>
  );
}

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function currentSearch(fallback = "") {
  if (typeof window === "undefined") return fallback;
  return window.location.search.replace(/^\?/, "");
}

function scrollToGap(target: "time" | "details") {
  const id = target === "time" ? "lp-wm-calendar" : "lp-wm-details";
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
}

type FunnelProps = {
  initialSlots?: LpWmAvailabilitySlot[];
  initialSearch?: string;
};

export function LpWmFunnelClient({ initialSlots = [], initialSearch = "" }: FunnelProps) {
  const search = currentSearch(initialSearch);
  const [step, setStep] = useState<Step>("quiz");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [slot, setSlot] = useState<LpWmSlot | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [leadToken, setLeadToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [intentLoading, setIntentLoading] = useState(false);
  const [leadSaving, setLeadSaving] = useState(false);
  const [paid, setPaid] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const paidRef = useRef(false);
  const paymentIntentIdRef = useRef<string | null>(null);
  const clientSecretRef = useRef<string | null>(null);
  const intentInFlightRef = useRef<Promise<string | null> | null>(null);
  const trackedCheckoutRef = useRef(false);
  const detailsRef = useRef({ firstName: "", lastName: "", email: "", phone: "", slot: null as LpWmSlot | null });
  const accessTokenRef = useRef<string | null>(null);
  const leadTokenRef = useRef<string | null>(null);
  const attachedPiRef = useRef("");
  const quizAnswersRef = useRef<Record<string, string>>({});
  const [funnelEpoch, setFunnelEpoch] = useState(0);

  const contact = useMemo(
    () => ({ firstName, lastName, email, phone }),
    [firstName, lastName, email, phone]
  );
  detailsRef.current = { firstName, lastName, email, phone, slot };
  quizAnswersRef.current = quizAnswers;
  const contactValid = validateLpWmContact(contact);
  const paymentGate = lpWmPaymentGate({ slot, contact: contactValid });
  const canContinue = paymentGate.ok;
  const quizValid = validateLpWmQuizAnswers(quizAnswers);

  useEffect(() => {
    const params = new URLSearchParams(currentSearch(initialSearch));
    rememberMetaFunnelSource(params.get("source") || LP_FUNNEL_SOURCE);
  }, [initialSearch]);

  const persistLead = useCallback(
    async (details: LpWmContact, booked: LpWmSlot | null, screen: Draft["screen"] = "quiz") => {
      const res = await fetch("/api/lp/weight-management/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: leadTokenRef.current,
          paymentIntentId: paymentIntentIdRef.current,
          ...details,
          ...(booked
            ? {
                slotId: booked.slotId,
                startTime: booked.startTime,
                endTime: booked.endTime,
              }
            : {}),
          quizAnswers: quizAnswersRef.current,
          search: `?${search}`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save your details");
      leadTokenRef.current = data.accessToken;
      setLeadToken(data.accessToken);
      if (paymentIntentIdRef.current) {
        attachedPiRef.current = paymentIntentIdRef.current;
      }
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          ...details,
          slot: booked,
          paymentIntentId: paymentIntentIdRef.current ?? undefined,
          clientSecret: clientSecretRef.current ?? undefined,
          accessToken: data.accessToken,
          paid: paidRef.current,
          quizAnswers: quizAnswersRef.current,
          screen,
        } satisfies Draft)
      );
      return data.accessToken as string;
    },
    [search]
  );

  const persistComplete = useCallback(
    async (piId: string, details: LpWmContact, booked: LpWmSlot) => {
      paidRef.current = true;
      setPaid(true);
      paymentIntentIdRef.current = piId;
      setPaymentIntentId(piId);
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          ...details,
          slot: booked,
          paymentIntentId: piId,
          clientSecret: clientSecretRef.current ?? undefined,
          accessToken: leadTokenRef.current ?? undefined,
          paid: true,
          quizAnswers: quizAnswersRef.current,
          screen: "payment",
        } satisfies Draft)
      );
      setError(null);
      try {
        const res = await fetch("/api/lp/weight-management/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentIntentId: piId,
            accessToken: leadTokenRef.current,
            ...details,
            slotId: booked.slotId,
            startTime: booked.startTime,
            endTime: booked.endTime,
            quizAnswers: quizAnswersRef.current,
            search: `?${search}`,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Could not save your booking");
        accessTokenRef.current = data.accessToken;
        sessionStorage.setItem(TOKEN_KEY, data.accessToken);
        sessionStorage.removeItem(DRAFT_KEY);
        trackLpWmFunnelProgress({ stage: "complete", questionCount: Object.keys(quizAnswersRef.current).length });
        setStep("thanks");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save your booking");
      }
    },
    [search]
  );

  const goBackToHomepage = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(DRAFT_KEY);
  }, []);

  useEffect(() => {
    const draft = readJson<Draft>(DRAFT_KEY);
    const params = new URLSearchParams(currentSearch(initialSearch));
    const redirectedPi = params.get("payment_intent");
    const redirectStatus = params.get("redirect_status");
    const succeededRedirect = Boolean(redirectedPi && redirectStatus === "succeeded");
    const token = sessionStorage.getItem(TOKEN_KEY);
    // A leftover booking token must not lock the funnel on a later visit.
    // Only restore "you're booked" for a Stripe return or a paid draft in this tab.
    if (token && !succeededRedirect && !draft?.paid) {
      sessionStorage.removeItem(TOKEN_KEY);
    } else if (token && succeededRedirect && !draft) {
      accessTokenRef.current = token;
      paidRef.current = true;
      setPaid(true);
      setStep("thanks");
    }
    if (draft) {
      setFirstName(draft.firstName || "");
      setLastName(draft.lastName || "");
      setEmail(draft.email || "");
      setPhone(draft.phone || "");
      if (draft.quizAnswers) {
        quizAnswersRef.current = draft.quizAnswers;
        setQuizAnswers(draft.quizAnswers);
      }
      if (
        draft.slot &&
        !isLpWmClosedWeekday(draft.slot.startTime) &&
        !isLpWmHiddenWeekday(draft.slot.startTime)
      ) {
        setSlot(draft.slot);
      }
      if (draft.paymentIntentId) {
        paymentIntentIdRef.current = draft.paymentIntentId;
        setPaymentIntentId(draft.paymentIntentId);
      }
      if (draft.clientSecret) {
        clientSecretRef.current = draft.clientSecret;
        setClientSecret(draft.clientSecret);
      }
      if (draft.accessToken) {
        leadTokenRef.current = draft.accessToken;
        setLeadToken(draft.accessToken);
      }
      if (draft.paid || succeededRedirect) {
        paidRef.current = true;
        setPaid(true);
        setStep("thanks");
      } else if (draft.accessToken && draft.screen === "payment" && draft.slot) {
        setStep("payment");
      } else if (draft.screen === "details") {
        setStep("details");
      } else if (draft.screen === "qualify" || validateLpWmQuizAnswers(draft.quizAnswers ?? {}).ok) {
        setStep("qualify");
      }
    }

    const piId = succeededRedirect ? redirectedPi : draft?.paymentIntentId;
    const canResume =
      Boolean(piId) &&
      Boolean(draft?.slot) &&
      Boolean(draft?.email) &&
      Boolean(draft?.firstName) &&
      Boolean(draft?.lastName) &&
      Boolean(draft?.phone);
    const mustFinish = Boolean(draft?.paid || succeededRedirect);

    let cancelled = false;
    (async () => {
      if (canResume && piId && draft?.slot && mustFinish) {
        try {
          const res = await fetch("/api/lp/weight-management/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentIntentId: piId,
              accessToken: draft.accessToken,
              firstName: draft.firstName,
              lastName: draft.lastName,
              email: draft.email,
              phone: draft.phone,
              slotId: draft.slot.slotId,
              startTime: draft.slot.startTime,
              endTime: draft.slot.endTime,
              quizAnswers: draft.quizAnswers,
              search: `?${search}`,
            }),
          });
          const data = await res.json().catch(() => ({}));
          if (cancelled) return;
          if (res.ok) {
            paidRef.current = true;
            setPaid(true);
            accessTokenRef.current = data.accessToken;
            sessionStorage.setItem(TOKEN_KEY, data.accessToken);
            sessionStorage.removeItem(DRAFT_KEY);
            trackLpWmFunnelProgress({ stage: "complete" });
            setStep("thanks");
            setHydrated(true);
            return;
          }
          setError(data.error || "Could not save your booking");
        } catch {
          if (!cancelled) setError("Could not save your booking");
        }
      }
      if (!cancelled) setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [initialSearch, search]);

  useEffect(() => {
    if (!hydrated || step === "thanks") return;
    const draft: Draft = {
      ...contact,
      slot,
      paymentIntentId: paymentIntentId ?? undefined,
      clientSecret: clientSecret ?? undefined,
      accessToken: leadToken ?? undefined,
      paid: paid || paidRef.current,
      quizAnswers,
      screen:
        step === "payment"
          ? "payment"
          : step === "details"
            ? "details"
            : step === "qualify"
              ? "qualify"
              : "quiz",
    };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [clientSecret, contact, hydrated, leadToken, paid, paymentIntentId, quizAnswers, slot, step]);

  const ensurePaymentIntent = useCallback(async (force = false) => {
    if (paidRef.current) return clientSecretRef.current;
    if (!force && clientSecretRef.current) return clientSecretRef.current;
    if (intentInFlightRef.current) {
      const existing = await intentInFlightRef.current;
      if (!force && existing) return existing;
    }

    const run = (async () => {
      const details = detailsRef.current;
      const res = await fetch("/api/lp/weight-management/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: details.firstName,
          lastName: details.lastName,
          email: details.email,
          phone: details.phone,
          slotId: details.slot?.slotId,
          startTime: details.slot?.startTime,
          endTime: details.slot?.endTime,
          paymentIntentId: paymentIntentIdRef.current,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to initialise payment");
      if (data.clientSecret) {
        clientSecretRef.current = data.clientSecret;
        setClientSecret(data.clientSecret);
      }
      if (data.paymentIntentId) {
        paymentIntentIdRef.current = data.paymentIntentId;
        setPaymentIntentId(data.paymentIntentId);
      }
      if (!trackedCheckoutRef.current) {
        trackedCheckoutRef.current = true;
        trackMetaEvent("InitiateCheckout", {
          content_name: "Weight management assessment",
          content_ids: ["lp_wm_assessment"],
          content_type: "product",
          content_category: "weight_management",
          currency: "AUD",
          value: PRICING.assessmentFee,
          num_items: 1,
        });
      }
      return (data.clientSecret as string | undefined) ?? clientSecretRef.current;
    })();

    intentInFlightRef.current = run;
    try {
      return await run;
    } finally {
      if (intentInFlightRef.current === run) intentInFlightRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!hydrated || paidRef.current || paid) return;
    if (step !== "details" && step !== "payment") return;
    if (clientSecretRef.current) return;
    setIntentLoading(true);
    void ensurePaymentIntent()
      .catch((err) => {
        if (!clientSecretRef.current) {
          setError(err instanceof Error ? err.message : "Failed to initialise payment");
        }
      })
      .finally(() => setIntentLoading(false));
  }, [ensurePaymentIntent, hydrated, paid, step]);

  useEffect(() => {
    if (!leadToken || !paymentIntentId || paid || paidRef.current) return;
    if (attachedPiRef.current === paymentIntentId) return;
    if (!contactValid.ok || !slot) return;
    attachedPiRef.current = paymentIntentId;
    void persistLead(contactValid.value, slot, "payment").catch(() => {
      attachedPiRef.current = "";
    });
  }, [contactValid, leadToken, paid, paymentIntentId, persistLead, slot]);

  useEffect(() => {
    if (!hydrated) return;
    if (step === "qualify") {
      trackLpWmFunnelProgress({
        stage: "qualify",
        questionCount: visibleLpWmQuizSteps(quizAnswers).length,
      });
    }
    if (step === "details") {
      trackLpWmFunnelProgress({
        stage: "book",
        questionCount: visibleLpWmQuizSteps(quizAnswers).length,
      });
    }
    if (step === "payment") {
      trackLpWmFunnelProgress({
        stage: "pay",
        questionCount: visibleLpWmQuizSteps(quizAnswers).length,
      });
    }
  }, [hydrated, quizAnswers, step]);

  const handleContinueToPayment = async () => {
    if (!quizValid.ok) {
      setError(quizValid.error);
      setStep("quiz");
      return;
    }
    if (!paymentGate.ok) {
      setError(paymentGate.error);
      scrollToGap(paymentGate.target);
      return;
    }
    if (!contactValid.ok || !slot) return;
    setLeadSaving(true);
    setError(null);
    try {
      await ensurePaymentIntent(true);
      await persistLead(contactValid.value, slot, "payment");
      setStep("payment");
      window.scrollTo({ top: 0, behavior: "auto" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your details");
    } finally {
      setLeadSaving(false);
    }
  };

  const handleGateFail = (target: "time" | "details") => {
    setStep("details");
    window.setTimeout(() => scrollToGap(target), 50);
  };

  const handlePaymentSuccess = async (result: CheckoutPaymentSuccess) => {
    const piId = result.paymentIntentId;
    if (!piId || !slot || !contactValid.ok) {
      setError("Payment succeeded but we could not save your booking. Please refresh.");
      return;
    }
    trackMetaPurchaseOnce({
      paymentIntentId: piId,
      value: PRICING.assessmentFee,
      currency: "AUD",
      content_name: "Weight management assessment",
      content_ids: ["lp_wm_assessment"],
      content_category: "weight_management",
    });
    setStep("thanks");
    void persistComplete(piId, contactValid.value, slot);
  };

  const applyQuizIdentity = (answers: Record<string, string>) => {
    setQuizAnswers(answers);
    quizAnswersRef.current = answers;
    if (answers.firstName) setFirstName(answers.firstName);
    if (answers.email) setEmail(answers.email);
  };

  const handleLeadCapture = async (answers: Record<string, string>) => {
    applyQuizIdentity(answers);
    try {
      await persistLead(
        {
          firstName: answers.firstName || firstName,
          lastName,
          email: answers.email || email,
          phone,
        },
        slot,
        "quiz"
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your details");
      throw err;
    }
  };

  const handleQuizDone = (answers: Record<string, string>) => {
    applyQuizIdentity(answers);
    setError(null);
    void persistLead(
      {
        firstName: answers.firstName || firstName,
        lastName,
        email: answers.email || email,
        phone,
      },
      slot,
      "qualify"
    ).catch(() => {});
    setStep("qualify");
    window.scrollTo({ top: 0, behavior: "auto" });
  };

  const inputClass =
    "w-full rounded-xl border border-black/15 px-4 py-3.5 text-base outline-none transition-colors focus:border-black";

  const paymentMounted = Boolean(clientSecret) && !paid && step === "payment";
  const stripeElementsOptions = useMemo(
    () =>
      clientSecret
        ? {
            clientSecret,
            appearance: {
              theme: "stripe" as const,
              variables: {
                colorPrimary: "#111111",
                borderRadius: "12px",
              },
            },
            paymentMethodOrder: stripeCheckoutElementsPaymentMethodOrder(
              detectCheckoutWalletOs(
                typeof navigator !== "undefined" ? navigator.userAgent : ""
              )
            ),
          }
        : null,
    [clientSecret]
  );

  return (
    <div>
      {step !== "thanks" && step !== "qualify" && (
        <StageNav current={step === "payment" ? "pay" : step === "details" ? "book" : "quiz"} />
      )}

      {step === "quiz" && (
        <LpWmQuizStep
          key={funnelEpoch}
          error={error}
          initialAnswers={quizAnswers}
          onAnswersChange={applyQuizIdentity}
          onLeadCapture={handleLeadCapture}
          onDone={handleQuizDone}
        />
      )}

      {step === "qualify" && (
        <LpWmQualificationStep
          firstName={firstName}
          gender={quizAnswers.gender}
          onBack={() => {
            setError(null);
            setStep("quiz");
          }}
          onContinue={(claimedOffer) => {
            applyQuizIdentity(
              claimedOffer ? { ...quizAnswers, introOffer: "claimed" } : quizAnswers
            );
            setError(null);
            setStep("details");
            window.scrollTo({ top: 0, behavior: "auto" });
          }}
        />
      )}

      {step === "details" && (
        <div className="space-y-10">
          <div>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep("qualify");
              }}
              className="text-sm font-medium text-neutral-500 hover:text-black"
            >
              ← Back
            </button>
            <h1 className="mt-4 font-serif text-[2.15rem] font-normal leading-[1.15] tracking-tight text-black sm:text-5xl">
              Pick a time
            </h1>
          </div>

          <div id="lp-wm-calendar">
            <LpWmSlotPicker selected={slot} onSelect={setSlot} initialSlots={initialSlots} />
          </div>

          {slot && (
            <div id="lp-wm-details" className="space-y-4">
              <h2 className="font-serif text-3xl font-normal tracking-tight text-black">
                Complete your profile
              </h2>
              <p className="text-[15px] leading-relaxed text-neutral-500">
                Complete your details. Enter your surname and mobile number.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-600">First name</label>
                  <input
                    type="text"
                    autoComplete="given-name"
                    placeholder="First"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-600">Last name</label>
                  <input
                    type="text"
                    autoComplete="family-name"
                    placeholder="Last"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-600">Email</label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-600">Mobile</label>
                <input
                  type="tel"
                  autoComplete="tel"
                  placeholder="04xx xxx xxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={() => void handleContinueToPayment()}
                disabled={!canContinue || leadSaving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4f6038] py-4 text-base font-semibold text-white transition-colors hover:bg-[#3c4a27] disabled:opacity-50"
              >
                {leadSaving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving your details…
                  </>
                ) : (
                  "Proceed to payment"
                )}
              </button>
              {!canContinue && (
                <p className="text-sm text-neutral-500">
                  {paymentGate.ok ? "" : paymentGate.error}
                </p>
              )}
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      )}

      {step === "payment" && (
        <div className="space-y-8">
          <div>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setStep("details");
              }}
              className="text-sm font-medium text-neutral-500 hover:text-black"
            >
              ← Back
            </button>
            <h1 className="mt-4 font-serif text-2xl font-normal leading-tight tracking-tight text-black sm:text-3xl">
              Payment
            </h1>
            <div className="mt-5 flex max-w-md items-start gap-1.5 rounded-2xl border border-black/10 bg-neutral-50 p-4 text-sm leading-snug text-neutral-600">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#5c7a52]" />
              <p>
                Join with confidence, your ${PRICING.assessmentFee} consult fee is redeemable
                off your first month, or it&apos;s fully refundable if you don&apos;t qualify for
                the program.
              </p>
            </div>
          </div>

          {slot && (
            <div className="space-y-1 rounded-2xl border border-black/10 bg-neutral-50 px-4 py-4">
              <p className="text-sm font-medium text-black">
                {formatAppointmentSydney(slot.startTime)}
              </p>
              <p className="text-sm text-neutral-500">
                {[firstName, lastName].filter(Boolean).join(" ")}
                {email ? ` · ${email}` : ""}
              </p>
            </div>
          )}

          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-lg font-medium text-black">Pay now</h2>
            <p className="text-sm font-medium tabular-nums text-black">
              ${PRICING.assessmentFee} AUD
            </p>
          </div>

          {intentLoading && !clientSecret && (
            <p className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparing payment…
            </p>
          )}
          {error && (
            <div className="space-y-2">
              <p className="text-sm text-red-600">{error}</p>
              {!clientSecret && (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setIntentLoading(true);
                    void ensurePaymentIntent(true)
                      .catch((err) => {
                        setError(
                          err instanceof Error ? err.message : "Failed to initialise payment"
                        );
                      })
                      .finally(() => setIntentLoading(false));
                  }}
                  className="rounded-full border border-black px-4 py-2 text-sm font-medium hover:bg-neutral-50"
                >
                  Try payment again
                </button>
              )}
              {clientSecret && paymentIntentId && slot && contactValid.ok && paid && (
                <button
                  type="button"
                  onClick={() => persistComplete(paymentIntentId, contactValid.value, slot)}
                  className="rounded-full border border-black px-4 py-2 text-sm font-medium hover:bg-neutral-50"
                >
                  Finish booking
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {paymentMounted && clientSecret && stripeElementsOptions && (
        <div className="mt-4 space-y-4">
          <Elements
            stripe={stripePromise}
            options={stripeElementsOptions}
          >
            <LpWmPaymentForm
              onSuccess={handlePaymentSuccess}
              onGateFail={handleGateFail}
              amountAud={PRICING.assessmentFee}
              customerEmail={contactValid.ok ? contactValid.value.email : email}
              customerName={`${firstName} ${lastName}`.trim() || undefined}
              paymentGate={paymentGate}
            />
          </Elements>
        </div>
      )}

      {step === "thanks" && (
        <div className="space-y-4 py-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-500">
            <Check className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">You&apos;re booked in</h1>
          <p className="text-sm text-gray-500">
            {slot
              ? `Your phone consult is ${formatAppointmentSydney(slot.startTime)} (Sydney time).`
              : "We've received your assessment."}{" "}
            A welcome email is on its way, and a care partner will be in touch.
          </p>
          <Link
            href={LP_PATH}
            onClick={goBackToHomepage}
            className="text-sm font-medium text-neutral-500 underline-offset-2 hover:text-black hover:underline"
          >
            Back to homepage
          </Link>
        </div>
      )}
    </div>
  );
}
