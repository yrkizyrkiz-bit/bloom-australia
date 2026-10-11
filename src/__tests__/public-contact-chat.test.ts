import { describe, expect, it } from "vitest";
import {
  isValidContactEmail,
  publicGeorgeFallbackReply,
  sanitizeContactHistory,
  sanitizeContactMessage,
  visitorAskedForHuman,
} from "@/lib/public/contact-chat";

describe("public contact chat", () => {
  it("accepts a normal email and rejects junk", () => {
    expect(isValidContactEmail("alex@example.com")).toBe(true);
    expect(isValidContactEmail("not-an-email")).toBe(false);
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
    expect(pricing).toMatch(/first 30 days/);
    expect(pricing).toMatch(/\$360/);
    expect(pricing).toMatch(/\$120/);
    expect(publicGeorgeFallbackReply("is weight loss 365 or 120")).toMatch(
      /\$360 every three months/
    );
    expect(publicGeorgeFallbackReply("what does hair health cost")).toMatch(/\$90/);
    expect(publicGeorgeFallbackReply("is organ care extra")).toMatch(/included/);
  });
});
