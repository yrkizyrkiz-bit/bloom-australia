import { describe, expect, it } from "vitest";
import { isUndeliverableOutboundEmail } from "@/lib/email/outbound-recipient";

describe("isUndeliverableOutboundEmail", () => {
  it("blocks the invalid sanative.com domain that bounces", () => {
    expect(isUndeliverableOutboundEmail("tt@sanative.com")).toBe(true);
    expect(isUndeliverableOutboundEmail("TT@Sanative.COM")).toBe(true);
  });

  it("allows real Sanative and member addresses", () => {
    expect(isUndeliverableOutboundEmail("info@sanative.com.au")).toBe(false);
    expect(isUndeliverableOutboundEmail("member@gmail.com")).toBe(false);
  });

  it("blocks empty or malformed addresses", () => {
    expect(isUndeliverableOutboundEmail("")).toBe(true);
    expect(isUndeliverableOutboundEmail("not-an-email")).toBe(true);
  });
});
