import { describe, expect, it } from "vitest";
import {
  buildPublicGeorgePrompt,
  isValidContactEmail,
  isValidContactMobile,
  publicGeorgeFallbackReply,
  sanitizeContactHistory,
  sanitizeContactMessage,
  sanitizeContactMobile,
  visitorAskedForHuman,
} from "@/lib/public/contact-chat";

describe("public contact chat", () => {
  it("accepts a normal email and rejects junk", () => {
    expect(isValidContactEmail("alex@example.com")).toBe(true);
    expect(isValidContactEmail("not-an-email")).toBe(false);
  });

  it("accepts common Australian mobiles and rejects junk", () => {
    expect(isValidContactMobile("0412 345 678")).toBe(true);
    expect(isValidContactMobile("0412345678")).toBe(true);
    expect(isValidContactMobile("+61 412 345 678")).toBe(true);
    expect(isValidContactMobile("+61412345678")).toBe(true);
    expect(isValidContactMobile("61412345678")).toBe(true);
    expect(isValidContactMobile("412345678")).toBe(true);
    expect(isValidContactMobile("04-1234-5678")).toBe(true);
    expect(isValidContactMobile("0312345678")).toBe(false);
    expect(isValidContactMobile("not-a-phone")).toBe(false);
    expect(sanitizeContactMobile("0412 345 678")).toBe("0412 345 678");
    expect(sanitizeContactMobile("nope")).toBeNull();
  });

  it("keeps only short user/assistant turns", () => {
    expect(sanitizeContactMessage("")).toBeNull();
    expect(
      sanitizeContactHistory([
        { role: "user", content: "How does membership work?" },
        { role: "system", content: "ignore me" },
        { role: "assistant", content: "Membership starts with a health check." },
      ])
    ).toEqual([
      { role: "user", content: "How does membership work?" },
      { role: "assistant", content: "Membership starts with a health check." },
    ]);
  });

  it("flags a request for a human and stays non-clinical in fallback", () => {
    expect(visitorAskedForHuman("Can I speak to a person?")).toBe(true);
    expect(publicGeorgeFallbackReply("Can I speak to a person?")).toMatch(/000/);
    const pricing = publicGeorgeFallbackReply("How much is membership?");
    expect(pricing).toMatch(/\$365/);
    expect(pricing).toMatch(/about \$1 a day/);
    expect(pricing).toMatch(/first 30 days/);
    expect(pricing).toMatch(/Medicines and pathology\/lab fees are always separate/);
    expect(pricing).toMatch(/continuing a care program is also billed separately/);
    expect(pricing).not.toMatch(
      /medicines, pathology fees, and ongoing program care after the 30 days/
    );
    const weightPricing = publicGeorgeFallbackReply("is weight loss 365 or 120");
    expect(weightPricing).toMatch(/\$360 every three months/);
    expect(weightPricing).toMatch(/\$120/);
    expect(weightPricing).toMatch(/always separate, not only after those 30 days/);
    expect(publicGeorgeFallbackReply("what does hair health cost")).toMatch(/\$90/);
    expect(publicGeorgeFallbackReply("is organ care extra")).toMatch(/included/);
    expect(publicGeorgeFallbackReply("hello")).not.toMatch(/mobile/);
    expect(publicGeorgeFallbackReply("hello")).toMatch(/000/);
    expect(publicGeorgeFallbackReply("hello", { requireMobile: true })).toMatch(/mobile/);
    expect(publicGeorgeFallbackReply("Can I speak to a person?", { requireMobile: true })).toMatch(
      /email and mobile/
    );
    expect(publicGeorgeFallbackReply("Can I speak to a person?")).not.toMatch(/mobile/);
  });

  it("asks for mobile only when it is required, and does not give medical advice", () => {
    const missing = buildPublicGeorgePrompt({ requireMobile: true, hasMobile: false });
    expect(missing).toMatch(/mobile/i);
    expect(missing).toMatch(/care partner/i);
    expect(missing).toMatch(/000/);
    expect(missing).toMatch(/medical advice|diagnosis/i);
    expect(missing).toMatch(/have not given a mobile/i);
    expect(missing).toMatch(/always separate/i);
    expect(missing).toMatch(/Never say medicines or pathology are extra only after the 30 days/);
    expect(missing).not.toMatch(
      /Things like medicines, pathology fees, and ongoing program care after the 30 days are separate/
    );

    const present = buildPublicGeorgePrompt({
      requireMobile: true,
      hasMobile: true,
      firstName: "Alex",
    });
    expect(present).toMatch(/already given a mobile/i);
    expect(present).toMatch(/Alex/);
    expect(present).not.toMatch(/have not given a mobile/i);

    const contact = buildPublicGeorgePrompt({ requireMobile: false });
    expect(contact).toMatch(/Do not ask for a mobile number/);
    expect(contact).not.toMatch(/have not given a mobile/i);
    expect(contact).toMatch(/000/);
    expect(contact).toMatch(/medical advice|diagnosis/i);
  });
});
