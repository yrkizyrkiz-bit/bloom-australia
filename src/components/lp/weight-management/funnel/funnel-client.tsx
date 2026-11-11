"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { Check, Loader2 } from "lucide-react";
import type { CheckoutPaymentSuccess } from "@/lib/checkout/payment-success";
import {
  rememberMetaFunnelSource,
  trackMetaEvent,
  trackMetaPurchaseOnce,
} from "@/lib/analytics/meta-pixel";
import { LP_FUNNEL_SOURCE, PRICING } from "@/lib/lp/weight-management";
import {
  formatAppointmentSydney,
  isLpWmClosedWeekday,
  lpWmPaymentGate,
  validateLpWmContact,
  type LpWmContact,
  type LpWmSlot,
} from "@/lib/lp/weight-management-funnel";
import type { LpWmAvailabilitySlot } from "@/lib/lp/availability";
import { LpWmPaymentForm } from "./payment-form";
import { LpWmQuizStep } from "./quiz-step";
import { LpWmSlotPicker } from "./slot-picker";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
const DRAFT_KEY = "lp_wm_funnel_draft";
const TOKEN_KEY = "lp_wm_funnel_token";

type Step = "details" | "payment" | "quiz" | "thanks";

type Draft = LpWmContact & {
  slot: LpWmSlot | null;
  paymentIntentId?: string;
  accessToken?: string;
  paid?: boolean;
  screen?: "details" | "payment";
};

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
  const [step, setStep] = useState<Step>("details");
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
  const [quizSaving, setQuizSaving] = useState(false);
  const [paid, setPaid] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const intentKeyRef = useRef("");
  const paidRef = useRef(false);
  const paymentIntentIdRef = useRef<string | null>(null);
  const intentRequestRef = useRef(0);
  const trackedCheckoutRef = useRef(false);
  const accessTokenRef = useRef<string | null>(null);
  const leadTokenRef = useRef<string | null>(null);
  const attachedPiRef = useRef("");
  const pendingQuizRef = useRef<Record<string, string> | null>(null);

  const contact = useMemo(
    () => ({ firstName, lastName, email, phone }),
    [firstName, lastName, email, phone]
  );
  const contactValid = validateLpWmContact(contact);
  const paymentGate = lpWmPaymentGate({ slot, contact: contactValid });
  const canContinue = paymentGate.ok;

  useEffect(() => {
    const params = new URLSearchParams(currentSearch(initialSearch));
    rememberMetaFunnelSource(params.get("source") || LP_FUNNEL_SOURCE);
  }, [initialSearch]);

  const submitQuizAnswers = useCallback(async (token: string, answers: Record<string, string>) => {
    setQuizSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/lp/weight-management/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: token, answers }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save your answers");
      pendingQuizRef.current = null;
      sessionStorage.removeItem(TOKEN_KEY);
      setStep("thanks");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your answers");
    } finally {
      setQuizSaving(false);
    }
  }, []);

  const persistLead = useCallback(
    async (details: LpWmContact, booked: LpWmSlot) => {
      const res = await fetch("/api/lp/weight-management/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessToken: leadTokenRef.current,
          paymentIntentId: paymentIntentIdRef.current,
          ...details,
          slotId: booked.slotId,
          startTime: booked.startTime,
          endTime: booked.endTime,
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
          accessToken: data.accessToken,
          paid: paidRef.current,
          screen: "payment",
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
          accessToken: leadTokenRef.current ?? undefined,
          paid: true,
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
            search: `?${search}`,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Could not save your booking");
        accessTokenRef.current = data.accessToken;
        sessionStorage.setItem(TOKEN_KEY, data.accessToken);
        sessionStorage.removeItem(DRAFT_KEY);
        if (data.status === "quiz_complete") {
          setStep("thanks");
          return;
        }
        setStep("quiz");
        const pending = pendingQuizRef.current;
        if (pending) await submitQuizAnswers(data.accessToken, pending);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save your booking");
      }
    },
    [search, submitQuizAnswers]
  );

  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (token) {
      accessTokenRef.current = token;
      setStep("quiz");
      setHydrated(true);
      return;
    }

    const draft = readJson<Draft>(DRAFT_KEY);
    const params = new URLSearchParams(currentSearch(initialSearch));
    const redirectedPi = params.get("payment_intent");
    const redirectStatus = params.get("redirect_status");
    const succeededRedirect = Boolean(redirectedPi && redirectStatus === "succeeded");
    if (draft) {
      setFirstName(draft.firstName || "");
      setLastName(draft.lastName || "");
      setEmail(draft.email || "");
      setPhone(draft.phone || "");
      if (draft.slot && !isLpWmClosedWeekday(draft.slot.startTime)) setSlot(draft.slot);
      if (draft.paymentIntentId) {
        paymentIntentIdRef.current = draft.paymentIntentId;
        setPaymentIntentId(draft.paymentIntentId);
      }
      if (draft.accessToken) {
        leadTokenRef.current = draft.accessToken;
        setLeadToken(draft.accessToken);
      }
      if (draft.paid || succeededRedirect) {
        paidRef.current = true;
        setPaid(true);
        setStep("quiz");
      } else if (draft.accessToken && draft.screen === "payment" && draft.slot) {
        setStep("payment");
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
            setStep(data.status === "quiz_complete" ? "thanks" : "quiz");
            const pending = pendingQuizRef.current;
            if (pending && data.status !== "quiz_complete") {
              void submitQuizAnswers(data.accessToken, pending);
            }
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
  }, [initialSearch, search, submitQuizAnswers]);

  useEffect(() => {
    if (!hydrated || (step !== "details" && step !== "payment")) return;
    const draft: Draft = {
      ...contact,
      slot,
      paymentIntentId: paymentIntentId ?? undefined,
      accessToken: leadToken ?? undefined,
      paid: paid || paidRef.current,
      screen: step === "payment" ? "payment" : "details",
    };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [contact, hydrated, leadToken, paid, paymentIntentId, slot, step]);

  useEffect(() => {
    if (!hydrated || paidRef.current || paid) return;
    if (step !== "details" && step !== "payment") return;

    const requestId = ++intentRequestRef.current;
    const hasIntent = Boolean(intentKeyRef.current);
    const timer = window.setTimeout(async () => {
      if (!hasIntent) {
        setIntentLoading(true);
        setError(null);
      }
      try {
        const res = await fetch("/api/lp/weight-management/intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName,
            lastName,
            email,
            phone,
            slotId: slot?.slotId,
            startTime: slot?.startTime,
            endTime: slot?.endTime,
            paymentIntentId: paymentIntentIdRef.current,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (requestId !== intentRequestRef.current) return;
        if (!res.ok) throw new Error(data.error || "Failed to initialise payment");
        intentKeyRef.current = slot?.slotId || "ready";
        if (data.clientSecret) {
          setClientSecret((current) => current ?? data.clientSecret);
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
      } catch (err) {
        if (requestId !== intentRequestRef.current) return;
        if (!intentKeyRef.current) {
          setClientSecret(null);
          setError(err instanceof Error ? err.message : "Failed to initialise payment");
        }
      } finally {
        if (requestId === intentRequestRef.current) setIntentLoading(false);
      }
    }, hasIntent ? 350 : 0);

    return () => window.clearTimeout(timer);
  }, [email, firstName, hydrated, lastName, paid, phone, slot, step]);

  useEffect(() => {
    if (!leadToken || !paymentIntentId || paid || paidRef.current) return;
    if (attachedPiRef.current === paymentIntentId) return;
    if (!contactValid.ok || !slot) return;
    attachedPiRef.current = paymentIntentId;
    void persistLead(contactValid.value, slot).catch(() => {
      attachedPiRef.current = "";
    });
  }, [contactValid, leadToken, paid, paymentIntentId, persistLead, slot]);

  const handleContinueToPayment = async () => {
    if (!paymentGate.ok) {
      setError(paymentGate.error);
      scrollToGap(paymentGate.target);
      return;
    }
    if (!contactValid.ok || !slot) return;
    setLeadSaving(true);
    setError(null);
    try {
      await persistLead(contactValid.value, slot);
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
    setStep("quiz");
    void persistComplete(piId, contactValid.value, slot);
  };

  const handleQuizDone = async (answers: Record<string, string>) => {
    const token = accessTokenRef.current;
    if (!token) {
      pendingQuizRef.current = answers;
      setQuizSaving(true);
      return;
    }
    await submitQuizAnswers(token, answers);
  };

  const inputClass =
    "w-full rounded-xl border border-black/15 px-4 py-3.5 text-base outline-none transition-colors focus:border-black";

  const paymentMounted = Boolean(clientSecret) && !paid && (step === "details" || step === "payment");

  return (
    <div>
      {step === "details" && (
        <div className="space-y-10">
          <div>
            <h1 className="font-serif text-[2.15rem] font-normal leading-[1.15] tracking-tight text-black sm:text-5xl">
              Book your ${PRICING.assessmentFee} doctor assessment
            </h1>
            <p className="mt-4 max-w-md text-[17px] leading-relaxed text-neutral-500">
              Book with confidence, your ${PRICING.assessmentFee} consultation fee is redeemable off your first month, or it&apos;s fully refundable if you don&apos;t qualify for the program.
            </p>
          </div>

          <div id="lp-wm-calendar">
            <LpWmSlotPicker selected={slot} onSelect={setSlot} initialSlots={initialSlots} />
          </div>

          {slot && (
            <div id="lp-wm-details" className="space-y-4">
              <h2 className="font-serif text-3xl font-normal tracking-tight text-black">Your information</h2>
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
                  "Continue to payment"
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
            <h1 className="mt-4 font-serif text-[2.15rem] font-normal leading-[1.15] tracking-tight text-black sm:text-5xl">
              Payment
            </h1>
            <p className="mt-3 max-w-md text-[17px] leading-relaxed text-neutral-500">
              Your details are saved. Pay ${PRICING.assessmentFee} to confirm your consult.
            </p>
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
          {error && paymentIntentId && slot && contactValid.ok && (
            <div className="space-y-2">
              <p className="text-sm text-red-600">{error}</p>
              <button
                type="button"
                onClick={() => persistComplete(paymentIntentId, contactValid.value, slot)}
                className="rounded-full border border-black px-4 py-2 text-sm font-medium hover:bg-neutral-50"
              >
                Finish booking
              </button>
            </div>
          )}
          {error && !(paymentIntentId && slot && contactValid.ok) && (
            <p className="text-sm text-red-600">{error}</p>
          )}
        </div>
      )}

      {paymentMounted && clientSecret && (
        <div
          className={
            step === "payment"
              ? "mt-4 space-y-4"
              : "pointer-events-none fixed left-[-120vw] top-0 w-[min(100vw,36rem)] opacity-0"
          }
          aria-hidden={step !== "payment"}
          inert={step !== "payment" ? true : undefined}
        >
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "stripe",
                variables: {
                  colorPrimary: "#111111",
                  borderRadius: "12px",
                },
              },
            }}
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

      {step === "quiz" && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500">
              <Check className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-medium text-green-800">Payment successful</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">A few questions for your doctor</h1>
            <p className="mt-2 text-sm text-gray-500">
              This helps your clinician prepare for your consult.
            </p>
          </div>
          <LpWmQuizStep saving={quizSaving} error={error} onDone={handleQuizDone} />
          {error && paymentIntentId && slot && contactValid.ok && (
            <button
              type="button"
              onClick={() => persistComplete(paymentIntentId, contactValid.value, slot)}
              className="rounded-full border border-black px-4 py-2 text-sm font-medium hover:bg-neutral-50"
            >
              Try saving again
            </button>
          )}
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
        </div>
      )}
    </div>
  );
}
