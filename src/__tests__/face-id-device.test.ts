import { describe, expect, it } from "vitest";
import { isFaceIdDevice } from "@/lib/webauthn/device";

describe("isFaceIdDevice", () => {
  it("accepts iPhone user agents", () => {
    expect(isFaceIdDevice({ userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)" })).toBe(true);
  });

  it("accepts Android user agents", () => {
    expect(isFaceIdDevice({ userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8)" })).toBe(true);
  });

  it("accepts Client Hints mobile flag", () => {
    expect(isFaceIdDevice({ userAgent: "Mozilla/5.0 Macintosh", mobile: true })).toBe(true);
  });

  it("accepts a coarse pointer on a narrow screen", () => {
    expect(isFaceIdDevice({ userAgent: "Mozilla/5.0", coarse: true, narrow: true })).toBe(true);
  });

  it("rejects a desktop browser", () => {
    expect(
      isFaceIdDevice({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        mobile: false,
        coarse: false,
        narrow: false,
      })
    ).toBe(false);
  });
});
