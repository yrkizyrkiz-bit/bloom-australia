import { describe, expect, it } from "vitest";
import {
  formatWeightInput,
  isWeightInputDraft,
  parseWeightInput,
} from "@/lib/weight-management/weight-input";

describe("isWeightInputDraft", () => {
  it("allows in-progress typing", () => {
    expect(isWeightInputDraft("")).toBe(true);
    expect(isWeightInputDraft("8")).toBe(true);
    expect(isWeightInputDraft("83")).toBe(true);
    expect(isWeightInputDraft("83.")).toBe(true);
    expect(isWeightInputDraft("83,")).toBe(true);
    expect(isWeightInputDraft("83.7")).toBe(true);
  });

  it("rejects extra digits or a second decimal", () => {
    expect(isWeightInputDraft("83.75")).toBe(false);
    expect(isWeightInputDraft("8.3.1")).toBe(false);
    expect(isWeightInputDraft("abc")).toBe(false);
    expect(isWeightInputDraft("1234")).toBe(false);
  });
});

describe("parseWeightInput / formatWeightInput", () => {
  it("parses drafts without forcing a trailing zero", () => {
    expect(parseWeightInput("83.")).toBe(83);
    expect(parseWeightInput("8")).toBe(8);
    expect(parseWeightInput("")).toBeNull();
    expect(parseWeightInput("83,7")).toBe(83.7);
  });

  it("formats committed values to one decimal", () => {
    expect(formatWeightInput(83)).toBe("83.0");
    expect(formatWeightInput(82.74)).toBe("82.7");
    expect(formatWeightInput(null)).toBe("");
  });
});
