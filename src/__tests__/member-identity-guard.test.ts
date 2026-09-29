import { describe, expect, it } from "vitest";
import {
  buildProtectedActivationProfileUpdate,
  isEstablishedMember,
  phoneMatchCandidates,
} from "@/lib/auth/member-identity-guard";

describe("isEstablishedMember", () => {
  it("treats password, active sub, paid journey, and MEMBER status as established", () => {
    expect(isEstablishedMember({ passwordHash: "hash" })).toBe(true);
    expect(isEstablishedMember({ subscriptionStatus: "ACTIVE" })).toBe(true);
    expect(isEstablishedMember({ journeyStatus: "ACTIVE" })).toBe(true);
    expect(isEstablishedMember({ memberStatus: "MEMBER" })).toBe(true);
  });

  it("treats prospective leads without password as not established", () => {
    expect(
      isEstablishedMember({
        passwordHash: null,
        subscriptionStatus: "TRIAL",
        journeyStatus: "LEAD",
        memberStatus: "POTENTIAL_MEMBER",
      })
    ).toBe(false);
  });
});

describe("phoneMatchCandidates", () => {
  it("returns common AU mobile variants", () => {
    const candidates = phoneMatchCandidates("0412 345 678");
    expect(candidates).toEqual(
      expect.arrayContaining(["0412 345 678", "0412345678", "61412345678", "+61412345678"])
    );
  });
});

describe("buildProtectedActivationProfileUpdate", () => {
  const existing = {
    firstName: "Maria",
    lastName: "Member",
    phone: "0412345678",
    dateOfBirth: new Date("1990-01-15"),
    addressLine1: "1 Old St",
    addressLine2: null,
    suburb: "Sydney",
    state: "NSW",
    postcode: "2000",
    gender: "FEMALE",
  };

  it("does not overwrite established-member PII with a friend's details", () => {
    const update = buildProtectedActivationProfileUpdate(
      existing,
      {
        firstName: "Friend",
        lastName: "Other",
        phone: "0499999999",
        dateOfBirth: new Date("2000-01-01"),
        addressLine1: "99 New Rd",
        suburb: "Melbourne",
        state: "VIC",
        postcode: "3000",
        gender: "MALE",
      },
      true
    );

    expect(update).toEqual({});
  });

  it("fills only empty fields when protecting PII", () => {
    const update = buildProtectedActivationProfileUpdate(
      { ...existing, addressLine2: null, suburb: null },
      {
        firstName: "Friend",
        addressLine2: "Unit 2",
        suburb: "Melbourne",
      },
      true
    );

    expect(update).toEqual({
      addressLine2: "Unit 2",
      suburb: "Melbourne",
    });
  });

  it("applies full profile when not protecting (new / prospective)", () => {
    const update = buildProtectedActivationProfileUpdate(
      {
        firstName: "Lead",
        lastName: "",
        phone: null,
        dateOfBirth: null,
        addressLine1: null,
        addressLine2: null,
        suburb: null,
        state: null,
        postcode: null,
        gender: null,
      },
      {
        firstName: "New",
        lastName: "Member",
        phone: "0411111111",
        gender: "FEMALE",
      },
      false
    );

    expect(update.firstName).toBe("New");
    expect(update.lastName).toBe("Member");
    expect(update.phone).toBe("0411111111");
    expect(update.gender).toBe("FEMALE");
  });
});
