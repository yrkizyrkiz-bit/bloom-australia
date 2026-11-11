"use client";

import { useEffect, useState } from "react";
import {
  ExpressCheckoutElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type {
  StripeExpressCheckoutElementClickEvent,
  StripeExpressCheckoutElementConfirmEvent,
  StripeExpressCheckoutElementReadyEvent,
} from "@stripe/stripe-js";
import { Loader2, Lock } from "lucide-react";
import { PaymentRefreshNotice } from "@/components/checkout/PaymentRefreshNotice";
import { PrePaymentConsentCheckbox } from "@/components/legal/PrePaymentConsentCheckbox";
import { stripePaymentMethodBillingDetails } from "@/lib/checkout/stripe-billing-details";
import type { CheckoutPaymentSuccess } from "@/lib/checkout/payment-success";
import {
  CHECKOUT_WALLET_PHONE_MEDIA_QUERY,
  detectCheckoutWalletOs,
  isMobileWalletCheckout,
  stripeExpressCheckoutOptions,
  stripePaymentElementWallets,
} from "@/lib/checkout/stripe-payment-methods";
import {
  ensurePrePaymentConsentRecorded,
  paymentSourcePage,
} from "@/lib/legal/ensure-pre-payment-consent";
import { FUNNEL_PATH, PRICING } from "@/lib/lp/weight-management";
import type { LpWmPaymentGate } from "@/lib/lp/weight-management-funnel";

type Props = {
  amountAud: number;
  customerEmail?: string;
  customerName?: string;
  paymentGate: LpWmPaymentGate;
  onSuccess: (result: CheckoutPaymentSuccess) => void;
  onGateFail?: (target: "time" | "details") => void;
};

function scrollToPaymentGap(target: "time" | "details") {
  const id = target === "time" ? "lp-wm-calendar" : "lp-wm-details";
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function LpWmPaymentForm({
  amountAud,
  customerEmail,
  customerName,
  paymentGate,
  onSuccess,
  onGateFail,
}: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobileCheckout, setIsMobileCheckout] = useState(false);
  const [expressCheckoutAvailable, setExpressCheckoutAvailable] = useState(false);
  const detailsReady = paymentGate.ok;

  useEffect(() => {
    const update = () => setIsMobileCheckout(isMobileWalletCheckout());
    update();
    const media = window.matchMedia(CHECKOUT_WALLET_PHONE_MEDIA_QUERY);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paymentGate.ok) setError(null);
  }, [paymentGate]);

  const walletOs = detectCheckoutWalletOs(
    typeof navigator !== "undefined" ? navigator.userAgent : ""
  );
  const showExpressCheckout = isMobileCheckout;
  const hidePaymentElementWallets = showExpressCheckout && expressCheckoutAvailable;

  const showPaymentGap = (target: "time" | "details") => {
    if (onGateFail) onGateFail(target);
    else scrollToPaymentGap(target);
  };

  const rejectUntilReady = () => {
    if (paymentGate.ok) return false;
    setError(paymentGate.error);
    showPaymentGap(paymentGate.target);
    return true;
  };

  const completeCheckoutPayment = async () => {
    if (!paymentGate.ok) {
      showPaymentGap(paymentGate.target);
      return { error: paymentGate.error };
    }
    if (!stripe || !elements) {
      return { error: "Payment is not ready. Please try again." };
    }

    const consentResult = await ensurePrePaymentConsentRecorded({
      consentChecked,
      sourcePage: paymentSourcePage() || FUNNEL_PATH,
      email: customerEmail,
    });

    if (!consentResult.ok) {
      return { error: consentResult.error };
    }

    const { error: submitError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}${FUNNEL_PATH}${window.location.search}`,
        ...stripePaymentMethodBillingDetails({
          name: customerName,
          email: customerEmail,
        }),
      },
      redirect: "if_required",
    });

    if (submitError) {
      return { error: submitError.message || "Payment failed" };
    }

    if (paymentIntent?.status === "succeeded") {
      onSuccess({
        paymentIntentId: paymentIntent.id,
        consentRecordId: consentResult.consentRecordId,
      });
      return {};
    }

    return { error: "Payment was not completed. Please try again." };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rejectUntilReady()) return;
    if (!stripe || !elements) {
      setError("Payment is not ready. Please try again.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    const result = await completeCheckoutPayment();
    if (result.error) setError(result.error);
    setIsProcessing(false);
  };

  const handleExpressCheckoutClick = (
    event: StripeExpressCheckoutElementClickEvent
  ) => {
    if (!paymentGate.ok) {
      setError(paymentGate.error);
      showPaymentGap(paymentGate.target);
      event.reject();
      return;
    }
    if (!consentChecked) {
      setError("Please agree to the Terms, Privacy Policy, and Telehealth Consent to continue.");
      event.reject();
      return;
    }
    event.resolve();
  };

  const handleExpressCheckoutConfirm = async (
    event: StripeExpressCheckoutElementConfirmEvent
  ) => {
    if (!paymentGate.ok) {
      setError(paymentGate.error);
      showPaymentGap(paymentGate.target);
      event.paymentFailed({ reason: "fail", message: paymentGate.error });
      return;
    }
    if (!stripe || !elements) {
      event.paymentFailed({ reason: "fail" });
      return;
    }

    setIsProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      const message = submitError.message || "Payment failed";
      setError(message);
      event.paymentFailed({ reason: "fail", message });
      setIsProcessing(false);
      return;
    }

    const result = await completeCheckoutPayment();
    if (result.error) {
      setError(result.error);
      event.paymentFailed({ reason: "fail", message: result.error });
    }
    setIsProcessing(false);
  };

  const handleExpressCheckoutReady = (
    event: StripeExpressCheckoutElementReadyEvent
  ) => {
    const methods = event.availablePaymentMethods;
    setExpressCheckoutAvailable(Boolean(methods?.applePay || methods?.googlePay));
  };

  const consentCheckbox = (
    <PrePaymentConsentCheckbox
      checked={consentChecked}
      onCheckedChange={setConsentChecked}
      disabled={isProcessing}
    />
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {showExpressCheckout && (
        <div className="space-y-3">
          {expressCheckoutAvailable && consentCheckbox}
          <ExpressCheckoutElement
            options={stripeExpressCheckoutOptions(walletOs)}
            onReady={handleExpressCheckoutReady}
            onClick={handleExpressCheckoutClick}
            onConfirm={handleExpressCheckoutConfirm}
            onCancel={() => setIsProcessing(false)}
          />
          {expressCheckoutAvailable && (
            <div className="relative py-1 text-center">
              <span className="text-xs font-medium uppercase tracking-[0.14em] text-gray-400">
                Or pay with card
              </span>
            </div>
          )}
        </div>
      )}

      <PaymentElement
        options={{
          layout: "tabs",
          wallets: stripePaymentElementWallets({
            hideWallets: hidePaymentElementWallets,
          }),
          fields: {
            billingDetails: {
              email: "never",
              name: "never",
            },
          },
        }}
      />

      {(!showExpressCheckout || !expressCheckoutAvailable) && consentCheckbox}

      {!paymentGate.ok && (
        <p className="text-sm text-neutral-500">{paymentGate.error}</p>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || isProcessing || !consentChecked || !detailsReady}
        aria-describedby={!paymentGate.ok ? "lp-wm-pay-hint" : undefined}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#4f6038] py-4 text-base font-semibold text-white transition-colors hover:bg-[#3c4a27] disabled:opacity-50"
      >
        {isProcessing ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Pay ${amountAud || PRICING.assessmentFee} AUD
          </>
        )}
      </button>
      {!paymentGate.ok && (
        <p id="lp-wm-pay-hint" className="sr-only">
          {paymentGate.error}
        </p>
      )}
      <PaymentRefreshNotice />
    </form>
  );
}
