import { describe, expect, it } from "vitest";
import {
  formatGiftCardCode,
  generateGiftCardCode,
  giftCardPaymentRef,
  isGiftCardPaymentRef,
  normalizeGiftCardCode,
} from "@/lib/gift-cards";

const CODE_RE = /^SAN-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{4}$/;

describe("gift card codes", () => {
  it("generates unique SAN-XXXX-XXXX-XXXX codes from crypto, not a static list", () => {
    const codes = new Set(Array.from({ length: 80 }, () => generateGiftCardCode()));
    expect(codes.size).toBe(80);
    for (const code of codes) {
      expect(code).toMatch(CODE_RE);
      expect(code).not.toMatch(/[01IOL]/);
    }
  });

  it("normalizes spacing, dashes, and lowercase", () => {
    expect(normalizeGiftCardCode("san-ab2c-defg-hjk3")).toBe("SANAB2CDEFGHJK3");
    expect(normalizeGiftCardCode("SANAB2CDEFGHJK3")).toBe("SANAB2CDEFGHJK3");
    expect(normalizeGiftCardCode("ab2c defg hjk3")).toBe("SANAB2CDEFGHJK3");
    expect(normalizeGiftCardCode("nope")).toBeNull();
  });

  it("formats a normalized code for display", () => {
    expect(formatGiftCardCode("sanab2cdefghjk3")).toBe("SAN-AB2C-DEFG-HJK3");
  });

  it("builds a gift payment ref for invoices without Stripe", () => {
    expect(giftCardPaymentRef("card123")).toBe("gift_card123");
    expect(isGiftCardPaymentRef("gift_card123")).toBe(true);
    expect(isGiftCardPaymentRef("pi_abc")).toBe(false);
  });
});
