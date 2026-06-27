import { describe, it, expect } from "vitest";
import { PRE_PAYMENT_CONSENT_CHECKBOX_LABEL } from "@/lib/legal/pre-payment-consent";

describe("pre-payment consent", () => {
  it("exports required checkbox label for audit records", () => {
    expect(PRE_PAYMENT_CONSENT_CHECKBOX_LABEL).toContain("Terms");
    expect(PRE_PAYMENT_CONSENT_CHECKBOX_LABEL).toContain("Privacy Policy");
    expect(PRE_PAYMENT_CONSENT_CHECKBOX_LABEL).toContain("Telehealth Consent");
    expect(PRE_PAYMENT_CONSENT_CHECKBOX_LABEL).toContain(
      "Australian doctor after clinical assessment"
    );
  });

  it("exports validatePrePaymentConsent helper", async () => {
    const { validatePrePaymentConsent } = await import("@/lib/legal/consent-record");
    expect(typeof validatePrePaymentConsent).toBe("function");
  });
});
