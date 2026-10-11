import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("public check-email response", () => {
  it("returns only state and does not send account details", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/api/auth/check-email/route.ts"),
      "utf8"
    );

    expect(source).toContain("return NextResponse.json({ state })");
    expect(source).toContain("classifyPublicEmailAccount");
    expect(source).not.toContain("firstName");
    expect(source).not.toContain("hasActiveProgram");
    expect(source).not.toContain("phone");
    expect(source).not.toContain("subscriptionTier");
    expect(source).not.toMatch(/NextResponse\.json\(\{[^}]*journeyStatus/);
    expect(source).not.toContain("next-auth");
    expect(source).not.toContain("signIn");
  });
});
