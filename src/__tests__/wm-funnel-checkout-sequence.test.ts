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
    expect(payment).toContain("MEMBERSHIP_PITCH");
    expect(payment).toContain("$365");
    expect(payment).toContain("order-summary-marquee");
    expect(payment).toContain("MembershipPricingCard.module.css");
    const marquee = readSource("lib/membership/order-summary-marquee.ts");
    expect(marquee).toContain("mens-marquee");
    expect(marquee).toContain("organ-slider/kidney.webp");
    expect(marquee).toContain("organ-slider/liver.webp");
    expect(marquee).toContain("organ-slider/heart.webp");
    expect(payment).toContain("Order Summary");
    expect(payment).toContain("membership-benefits");
    expect(payment).toContain("Sanative Membership");
    const benefits = readSource("lib/membership/membership-benefits.ts");
    expect(benefits).toContain("Monitor your health and stay ahead for $1/day");
    expect(benefits).toContain("Biomarker insights, 85+ markers");
    expect(payment).toContain('type: "accordion"');
    expect(payment).toContain('radios: "never"');
    expect(payment).not.toContain("radios: false");
    expect(payment).not.toContain('layout: "tabs"');
    expect(assessment).not.toContain("requireBookingHold={false}");
  });

  it("keeps the payment step phone-width until the desktop split", () => {
    const payment = readSource("components/checkout/FunnelMembershipPaymentScreen.tsx");
    const backbone = readSource("components/funnel/ProgramMembershipBackbone.tsx");
    expect(assessment).toContain("max-w-lg lg:max-w-6xl");
    expect(backbone).toContain("max-w-lg lg:max-w-6xl");
    expect(payment).toContain("grid-cols-1 lg:grid-cols-2");
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
