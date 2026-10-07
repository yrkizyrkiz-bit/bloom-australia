import { describe, expect, it } from "vitest";
import {
  formatMaskedQuizDob,
  sanitizeQuizDobDay,
  sanitizeQuizDobMonth,
  sanitizeQuizDobYear,
  validateQuizDob,
} from "@/lib/funnel/quiz-dob";

const NOW = new Date(2026, 7, 31);

describe("sanitizeQuizDob fields", () => {
  it("clamps finished day/month/year into valid ranges", () => {
    expect(sanitizeQuizDobDay("99")).toBe("31");
    expect(sanitizeQuizDobDay("00")).toBe("01");
    expect(sanitizeQuizDobDay("3")).toBe("3");
    expect(sanitizeQuizDobMonth("99")).toBe("12");
    expect(sanitizeQuizDobMonth("00")).toBe("01");
    expect(sanitizeQuizDobYear("9999", NOW)).toBe("2026");
    expect(sanitizeQuizDobYear("1800", NOW)).toBe("1900");
    expect(sanitizeQuizDobYear("199", NOW)).toBe("199");
  });

  it("clamps masked single-field DOB input", () => {
    expect(formatMaskedQuizDob("99999999", NOW)).toBe("31/12/2026");
    expect(formatMaskedQuizDob("00001990", NOW)).toBe("01/01/1990");
    expect(formatMaskedQuizDob("15", NOW)).toBe("15");
  });
});

describe("validateQuizDob", () => {
  it("accepts a real adult date", () => {
    const result = validateQuizDob("15/03/1990", NOW);
    expect(result.isValid).toBe(true);
    expect(result.age).toBe(36);
    expect(result.errors).toEqual({});
  });

  it("rejects day, month, and year out of range as soon as the field is complete", () => {
    expect(validateQuizDob("32/", NOW).errors.day).toMatch(/1–31/);
    expect(validateQuizDob("00/", NOW).errors.day).toMatch(/1–31/);
    expect(validateQuizDob("/13/", NOW).errors.month).toMatch(/1–12/);
    expect(validateQuizDob("/00/", NOW).errors.month).toMatch(/1–12/);
    expect(validateQuizDob("//1899", NOW).errors.year).toMatch(/1900/);
    expect(validateQuizDob("//2027", NOW).errors.year).toMatch(/2026/);
  });

  it("rejects calendar-impossible dates such as 31 April and 29 Feb on a non-leap year", () => {
    expect(validateQuizDob("31/04/1990", NOW).errors.day).toMatch(/30 days/);
    expect(validateQuizDob("29/02/2001", NOW).errors.day).toMatch(/28 days/);
    expect(validateQuizDob("29/02/2000", NOW).isValid).toBe(true);
  });

  it("rejects under-18 and future dates", () => {
    expect(validateQuizDob("01/09/2010", NOW).errors.form).toMatch(/18 or older/);
    expect(validateQuizDob("01/09/2026", NOW).isValid).toBe(false);
    expect(validateQuizDob("01/10/2026", NOW).errors.form).toMatch(/future/);
  });

  it("does not flag a field while the user is still typing", () => {
    expect(validateQuizDob("3", NOW).errors).toEqual({});
    expect(validateQuizDob("15/0", NOW).errors).toEqual({});
    expect(validateQuizDob("15/03/199", NOW).errors).toEqual({});
  });
});
