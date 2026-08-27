import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd(), "src");

function readSource(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

describe("weight-management funnel checkout sequence", () => {
  const assessment = readSource("app/(public)/weight-management/assessment/page.tsx");
  const bookingConfirm = readSource("app/api/bookings/confirm/route.ts");
  const consultBooking = readSource("components/membership/MembershipConsultationBooking.tsx");

  it("renames profile copy and stays in the assessment funnel", () => {
    expect(assessment).toContain("Let&apos;s complete your profile");
    expect(assessment).not.toContain("Let&apos;s confirm your details");
    expect(assessment).toContain("Continue to payment");
    expect(assessment).not.toContain("/membership/checkout?intent=weight_management");
  });

  it("pays first, then books the doctor, then welcomes with portal password", () => {
    expect(assessment).toContain("const renderPaymentScreen");
    expect(assessment).toContain("FunnelMembershipPaymentScreen");
    expect(assessment).toContain("const renderBookDoctorScreen");
    expect(assessment).toContain("WelcomeAndPasswordScreen");
    expect(assessment).toContain('programType="WEIGHT_MANAGEMENT"');
    expect(assessment).toContain("Set password & open portal");
    expect(assessment).toContain("animateToStep(20, \"forward\")");
    expect(assessment).toContain("animateToStep(21, \"forward\")");
    expect(assessment).toContain("animateToStep(22, \"forward\")");
  });

  it("uses Superpower-style membership payment with $365 pricing and rotating cards", () => {
    const payment = readSource("components/checkout/FunnelMembershipPaymentScreen.tsx");
    expect(payment).toContain("Enter your card details");
    expect(payment).toContain("85+ biomarkers");
    expect(payment).toContain("$365");
    expect(payment).toContain("mens-marquee");
    expect(payment).toContain("MembershipPricingCard.module.css");
    expect(payment).toContain("Sanative Membership");
    expect(assessment).not.toContain("requireBookingHold={false}");
  });

  it("does not enqueue public WM members into Pre-Triage Queue at membership payment", () => {
    const membership = readSource("lib/portal/sanative-membership.ts");
    expect(membership).toContain("isClinicalProgramMembershipFunnel");
    expect(membership).toContain("createOnboardingPreTriageTask");
  });

  it("wires booking confirm into care-partner triage", () => {
    expect(bookingConfirm).toContain("createProgramPreTriageTask");
    expect(bookingConfirm).toContain("isWeightManagementMembershipFunnel");
    expect(consultBooking).toContain("/api/bookings/hold");
    expect(consultBooking).toContain("/api/bookings/confirm");
    expect(consultBooking).toContain("WEIGHT_MANAGEMENT");
    const preTriage = readSource("lib/funnel/program-pre-triage.ts");
    expect(preTriage).toContain("clinicalSubscriptionTierForProgram");
    expect(preTriage).toContain("subscriptionTier: clinicalTier");
  });
});
