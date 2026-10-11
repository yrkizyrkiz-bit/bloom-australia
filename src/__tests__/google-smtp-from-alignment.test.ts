import { describe, expect, it } from "vitest";
import { alignFromWithGoogleSmtpUser } from "@/lib/email-identity";

describe("alignFromWithGoogleSmtpUser", () => {
  it("rewrites a different From address to the authenticated Google mailbox", () => {
    expect(
      alignFromWithGoogleSmtpUser(
        "Sanative Health <noreply@sanative.com.au>",
        "info@sanative.com.au"
      )
    ).toBe("Sanative Health <info@sanative.com.au>");
  });

  it("leaves a From address that already matches the Google mailbox", () => {
    expect(
      alignFromWithGoogleSmtpUser(
        "Sanative Health <info@sanative.com.au>",
        "INFO@sanative.com.au"
      )
    ).toBe("Sanative Health <info@sanative.com.au>");
  });

  it("leaves the header unchanged when no Google mailbox is configured", () => {
    expect(
      alignFromWithGoogleSmtpUser("Sanative Health <info@sanative.com.au>", "")
    ).toBe("Sanative Health <info@sanative.com.au>");
  });
});
