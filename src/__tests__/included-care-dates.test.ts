import { describe, expect, it } from "vitest";
import {
  applyProgramCareInvoice,
  canReserveIncludedSlot,
  normalizeIncludedCarePolicy,
  programCareDates,
  programKeyFromPublicIntent,
  renewalAfterPrepaidPeriod,
  resolveApprovalProgramKey,
} from "@/lib/billing/included-care-dates";

const approved = new Date("2026-10-12T00:00:00.000Z");

describe("included care policy", () => {
  it("is on for 30 days unless switched off or the length is zero", () => {
    expect(normalizeIncludedCarePolicy().enabled).toBe(true);
    expect(normalizeIncludedCarePolicy().includedDays).toBe(30);
    expect(normalizeIncludedCarePolicy({ enabled: false }).enabled).toBe(false);
    expect(normalizeIncludedCarePolicy({ includedDays: 0 }).enabled).toBe(false);
    expect(normalizeIncludedCarePolicy({ enabled: false }).chargeLeadDays).toBe(7);
  });
});

describe("included care slot", () => {
  const policy = normalizeIncludedCarePolicy();

  it("reserves only an open slot before the first completed consult", () => {
    expect(
      canReserveIncludedSlot({
        policy,
        slotStatus: "OPEN",
        initialConsultCompleted: false,
      })
    ).toBe(true);
    expect(
      canReserveIncludedSlot({
        policy,
        slotStatus: "OPEN",
        initialConsultCompleted: true,
      })
    ).toBe(false);
    expect(
      canReserveIncludedSlot({
        policy,
        slotStatus: "RESERVED",
        initialConsultCompleted: false,
      })
    ).toBe(false);
    expect(
      canReserveIncludedSlot({
        policy,
        slotStatus: null,
        initialConsultCompleted: false,
      })
    ).toBe(false);
  });

  it("does not reserve when the switch is off", () => {
    expect(
      canReserveIncludedSlot({
        policy: normalizeIncludedCarePolicy({ enabled: false }),
        slotStatus: "OPEN",
        initialConsultCompleted: false,
      })
    ).toBe(false);
  });

  it("leaves biomarkers signup without a program", () => {
    expect(programKeyFromPublicIntent(null)).toBeNull();
    expect(programKeyFromPublicIntent("biomarkers")).toBeNull();
    expect(programKeyFromPublicIntent("hair_loss")).toBe("HAIR_LOSS");
    expect(programKeyFromPublicIntent("mens_health")).toBe("MENS_HEALTH_SEXUAL");
    expect(programKeyFromPublicIntent("womens_health")).toBe("WOMENS_HEALTH_SEXUAL");
  });
});

describe("approval program", () => {
  it("uses the consult program, and the reserved program when the category is missing", () => {
    expect(resolveApprovalProgramKey("HAIR_LOSS", "WEIGHT_MANAGEMENT")).toBe("HAIR_LOSS");
    expect(resolveApprovalProgramKey("SEXUAL_HEALTH", null)).toBe("MENS_HEALTH_SEXUAL");
    expect(resolveApprovalProgramKey("HORMONE_THERAPY", null)).toBe("WOMENS_HEALTH_SEXUAL");
    expect(resolveApprovalProgramKey(null, "HAIR_LOSS")).toBe("HAIR_LOSS");
    expect(resolveApprovalProgramKey(undefined, null)).toBeNull();
  });
});

describe("program care dates", () => {
  it("charges the included program 7 days before day 30, and covers a full quarter from day 30", () => {
    const dates = programCareDates({
      approvedAt: approved,
      policy: normalizeIncludedCarePolicy(),
      usesIncludedSlot: true,
      intervalDays: 90,
    });
    expect(dates.chargeNow).toBe(false);
    expect(dates.chargeAt.toISOString()).toBe("2026-11-04T00:00:00.000Z");
    expect(dates.serviceStart.toISOString()).toBe("2026-11-11T00:00:00.000Z");
    expect(dates.serviceEnd.toISOString()).toBe("2027-02-09T00:00:00.000Z");
    expect(dates.nextRenewalAt.toISOString()).toBe("2027-02-02T00:00:00.000Z");
  });

  it("charges at approval when the switch is off, and still renews a week early", () => {
    const dates = programCareDates({
      approvedAt: approved,
      policy: normalizeIncludedCarePolicy({ enabled: false }),
      usesIncludedSlot: false,
      intervalDays: 90,
    });
    expect(dates.chargeNow).toBe(true);
    expect(dates.serviceStart.toISOString()).toBe(approved.toISOString());
    expect(dates.serviceEnd.toISOString()).toBe("2027-01-10T00:00:00.000Z");
    expect(dates.nextRenewalAt.toISOString()).toBe("2027-01-03T00:00:00.000Z");
  });

  it("sets the next portal charge a week before the prepaid period ends", () => {
    const paid = new Date("2026-09-24T00:00:00.000Z");
    const window = renewalAfterPrepaidPeriod({
      paidAt: paid,
      intervalDays: 90,
      chargeLeadDays: 7,
    });
    expect(window.serviceEnd.toISOString()).toBe("2026-12-23T00:00:00.000Z");
    expect(window.nextChargeAt.toISOString()).toBe("2026-12-16T00:00:00.000Z");
  });
});

describe("renewal invoices", () => {
  it("keeps the first service window and moves the following charge a week before it ends", () => {
    const applied = applyProgramCareInvoice({
      servicePeriodStart: new Date("2026-11-11T00:00:00.000Z"),
      servicePeriodEnd: new Date("2027-02-09T00:00:00.000Z"),
      nextChargeAt: new Date("2026-11-04T00:00:00.000Z"),
      intervalDays: 90,
      chargeLeadDays: 7,
      paidAt: new Date("2026-11-04T01:00:00.000Z"),
    });
    expect(applied.kind).toBe("first_fee");
    expect(applied.servicePeriodEnd.toISOString()).toBe("2027-02-09T00:00:00.000Z");
    expect(applied.nextChargeAt.toISOString()).toBe("2027-02-02T00:00:00.000Z");
  });

  it("starts the next quarter when the renewal is paid", () => {
    const applied = applyProgramCareInvoice({
      servicePeriodStart: new Date("2026-11-11T00:00:00.000Z"),
      servicePeriodEnd: new Date("2027-02-09T00:00:00.000Z"),
      nextChargeAt: new Date("2027-02-02T00:00:00.000Z"),
      intervalDays: 90,
      chargeLeadDays: 7,
      paidAt: new Date("2027-02-02T02:00:00.000Z"),
    });
    expect(applied.kind).toBe("renewal");
    expect(applied.servicePeriodStart.toISOString()).toBe("2027-02-09T00:00:00.000Z");
    expect(applied.servicePeriodEnd.toISOString()).toBe("2027-05-10T00:00:00.000Z");
    expect(applied.nextChargeAt.toISOString()).toBe("2027-05-03T00:00:00.000Z");
  });
});
