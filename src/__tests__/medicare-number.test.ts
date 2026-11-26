import { describe, expect, it } from "vitest";
import { extractMedicareFromIntake } from "@/lib/pathology/pathology-program-panels";
import {
  isValidMedicareNumber,
  parseMedicareIntake,
  parseMedicareNumber,
  serializeMedicareIntake,
} from "@/lib/medicare-number";

/** Checksum-valid card 2123456700. */
const VALID_CARD = "2123456700";
const VALID_INTAKE = "2123456700||12/2030";

describe("parseMedicareNumber", () => {
  it("accepts spaces, no spaces, and a packed quiz value", () => {
    expect(parseMedicareNumber("2123 45670 0")?.cardNumber).toBe(VALID_CARD);
    expect(parseMedicareNumber("2123456700")?.cardNumber).toBe(VALID_CARD);
    expect(parseMedicareNumber(VALID_INTAKE)).toMatchObject({
      cardNumber: VALID_CARD,
      expiryMonth: "12",
      expiryYear: "2030",
    });
  });

  it("treats the last digit as the issue number, not the check digit", () => {
    expect(parseMedicareNumber("2563 19855 6")?.cardNumber).toBe("2563198556");
  });

  it("rejects invalid checksums and the wrong length", () => {
    expect(parseMedicareNumber("1234 56789 1")).toBeNull();
    expect(parseMedicareNumber("212345670")).toBeNull();
    expect(parseMedicareNumber("")).toBeNull();
  });
});

describe("parseMedicareIntake", () => {
  it("requires a valid unexpired date", () => {
    expect(parseMedicareIntake(VALID_INTAKE)?.cardNumber).toBe(VALID_CARD);
    expect(isValidMedicareNumber(VALID_INTAKE)).toBe(true);
    expect(isValidMedicareNumber("2123456700")).toBe(false);
    expect(isValidMedicareNumber("2123456700||")).toBe(false);
    expect(isValidMedicareNumber("2123456700||01/2020")).toBe(false);
  });

  it("round-trips the card number and valid-to date", () => {
    expect(
      serializeMedicareIntake({
        group4: "2123",
        group5: "45670",
        group1: "0",
        irn: "",
        expiryMonth: "12",
        expiryYear: "2030",
      })
    ).toBe(VALID_INTAKE);
  });
});

describe("extractMedicareFromIntake", () => {
  it("reads the card number from a packed quiz answer", () => {
    expect(extractMedicareFromIntake({ medicareNumber: VALID_INTAKE })).toEqual({
      medicareNumber: VALID_CARD,
      medicareIrn: undefined,
    });
  });
});
