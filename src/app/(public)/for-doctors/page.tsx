"use client";

import Link from "next/link";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import {
  ArrowRight,
  ArrowDown,
  ArrowUp,
  CalendarCheck,
  TrendingUp,
  ShieldCheck,
  Bell,
  TestTube,
  Clock,
  Heart,
  Users,
  Download,
  CheckCircle,
  Stethoscope,
  QrCode,
  UserPlus,
  BellRing,
} from "lucide-react";

export default function ForDoctorsPage() {
  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      <Header />
      <main>
        {/* Hero Section - Dark Green Background */}
        <section className="bg-[#04342C] py-16 md:py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              {/* Eyebrow */}
              <span className="inline-block text-[#5DCAA5] text-sm font-medium tracking-wider uppercase mb-4">
                For GPs & Specialists
              </span>

              {/* Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white leading-tight mb-6">
                Better patient outcomes.{" "}
                <span className="italic text-[#5DCAA5]">Zero admin</span> for
                your practice.
              </h1>

              {/* Subtext */}
              <p className="text-xl text-white/80 leading-relaxed mb-8 max-w-3xl">
                Refer patients to a supervised preventative care program — your
                care partners handle everything, while you stay in clinical
                control.
              </p>

              {/* Pills */}
              <div className="flex flex-wrap gap-3 mb-10">
                {[
                  "AHPRA Registered",
                  "NATA-accredited labs",
                  "GP supervision model",
                  "$0 cost to practice",
                ].map((pill) => (
                  <span
                    key={pill}
                    className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white/90 text-sm"
                  >
                    {pill}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <Link
                href="/for-doctors/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#5DCAA5] text-[#04342C] font-semibold rounded-full hover:bg-[#4db892] transition-all duration-200 group"
              >
                Register your clinic
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </section>

        {/* Three Stat Cards */}
        <section className="py-16 md:py-24 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {/* Drop-offs */}
              <div className="bg-white rounded-2xl p-8 border border-[#e6ebe3] shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#5DCAA5]/10 rounded-xl flex items-center justify-center">
                    <ArrowDown className="w-6 h-6 text-[#1D9E75]" />
                  </div>
                  <span className="text-lg font-semibold text-[#34412f]">
                    Drop-offs
                  </span>
                </div>
                <p className="text-[#5c7a52] leading-relaxed">
                  Care partners proactively re-engage patients before they go
                  quiet
                </p>
              </div>

              {/* Visits */}
              <div className="bg-white rounded-2xl p-8 border border-[#e6ebe3] shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#5DCAA5]/10 rounded-xl flex items-center justify-center">
                    <ArrowUp className="w-6 h-6 text-[#1D9E75]" />
                  </div>
                  <span className="text-lg font-semibold text-[#34412f]">
                    Visits
                  </span>
                </div>
                <p className="text-[#5c7a52] leading-relaxed">
                  Referred patients on one of our programs are reminded and
                  encouraged to attend their periodic GP consultations
                </p>
              </div>

              {/* Adherence */}
              <div className="bg-white rounded-2xl p-8 border border-[#e6ebe3] shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-[#5DCAA5]/10 rounded-xl flex items-center justify-center">
                    <ArrowUp className="w-6 h-6 text-[#1D9E75]" />
                  </div>
                  <span className="text-lg font-semibold text-[#34412f]">
                    Adherence
                  </span>
                </div>
                <p className="text-[#5c7a52] leading-relaxed">
                  Regular care partner check-ins keep patients on their
                  prescribed care plan
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Hero Benefit Card - Full Width */}
        <section className="py-8 md:py-12 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl p-8 md:p-12 border-l-4 border-[#1D9E75] shadow-sm">
              <h2 className="text-2xl md:text-3xl font-serif text-[#34412f] mb-4">
                We bring patients back to you — consistently
              </h2>
              <p className="text-lg text-[#5c7a52] leading-relaxed mb-6 max-w-4xl">
                Sanative care partners are responsible for ensuring your
                referred patients on one of our programs attend their scheduled
                GP visits. We coordinate reminders, flag missed check-ins, and
                re-engage patients who start to drift — before they become a
                drop-off. You get a more engaged, better-managed patient panel
                without any extra effort from your practice.
              </p>
              <span className="inline-block px-4 py-2 bg-[#1D9E75]/10 text-[#1D9E75] rounded-full text-sm font-medium">
                No chasing. No admin. Just patients who show up.
              </span>
            </div>
          </div>
        </section>

        {/* Follow-up Card - Full Width */}
        <section className="py-8 md:py-12 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl p-8 md:p-12 border-l-4 border-[#1D9E75] shadow-sm">
              <h2 className="text-2xl md:text-3xl font-serif text-[#34412f] mb-4">
                Follow-up consultations booked to fill your available
                appointments
              </h2>
              <p className="text-lg text-[#5c7a52] leading-relaxed mb-6 max-w-4xl">
                Our care partners coordinate follow-up consultations — in-clinic
                or via Telehealth — and book them into your available
                appointment slots. Your schedule stays productive, your patients
                stay engaged, and every follow-up happens at the right clinical
                moment without your team having to chase anyone.
              </p>
              <span className="inline-block px-4 py-2 bg-[#1D9E75]/10 text-[#1D9E75] rounded-full text-sm font-medium">
                In-clinic or Telehealth — whatever suits your practice
              </span>
            </div>
          </div>
        </section>

        {/* Four GP Benefit Cards - 2x2 Grid */}
        <section className="py-16 md:py-24 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
              {/* Card 1 */}
              <div className="bg-white rounded-2xl p-8 border border-[#e6ebe3] shadow-sm">
                <div className="w-14 h-14 bg-[#5DCAA5]/10 rounded-2xl flex items-center justify-center mb-6">
                  <CalendarCheck className="w-7 h-7 text-[#1D9E75]" />
                </div>
                <h3 className="text-xl font-semibold text-[#34412f] mb-3">
                  Periodic visit adherence, handled
                </h3>
                <p className="text-[#5c7a52] leading-relaxed">
                  Care partners schedule and confirm your patients&apos;
                  periodic review appointments, coordinate around test results,
                  and ensure visits happen at the right clinical intervals.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-2xl p-8 border border-[#e6ebe3] shadow-sm">
                <div className="w-14 h-14 bg-[#5DCAA5]/10 rounded-2xl flex items-center justify-center mb-6">
                  <TrendingUp className="w-7 h-7 text-[#1D9E75]" />
                </div>
                <h3 className="text-xl font-semibold text-[#34412f] mb-3">
                  Better outcomes, measurable progress
                </h3>
                <p className="text-[#5c7a52] leading-relaxed">
                  Longitudinal biomarker tracking means you can see whether your
                  patients are improving between visits — the full trend, not
                  just how they present on the day.
                </p>
              </div>

              {/* Card 3 */}
              <div className="bg-white rounded-2xl p-8 border border-[#e6ebe3] shadow-sm">
                <div className="w-14 h-14 bg-[#5DCAA5]/10 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldCheck className="w-7 h-7 text-[#1D9E75]" />
                </div>
                <h3 className="text-xl font-semibold text-[#34412f] mb-3">
                  You stay in clinical control
                </h3>
                <p className="text-[#5c7a52] leading-relaxed">
                  The care partner model operates under your supervision. You
                  set the clinical intent; they manage the coordination. Your
                  authority and MBS billing remain entirely yours.
                </p>
              </div>

              {/* Card 4 */}
              <div className="bg-white rounded-2xl p-8 border border-[#e6ebe3] shadow-sm">
                <div className="w-14 h-14 bg-[#5DCAA5]/10 rounded-2xl flex items-center justify-center mb-6">
                  <Bell className="w-7 h-7 text-[#1D9E75]" />
                </div>
                <h3 className="text-xl font-semibold text-[#34412f] mb-3">
                  Alerts only when it matters
                </h3>
                <p className="text-[#5c7a52] leading-relaxed">
                  You&apos;re notified when a biomarker shifts significantly, a
                  patient misses a milestone, or escalation is warranted. No
                  noise — just the signals that need your attention.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Patient Benefits Section */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="mb-12">
              <span className="text-[#5DCAA5] text-sm font-medium tracking-wider uppercase mb-3 block">
                For your patients
              </span>
              <h2 className="text-3xl md:text-4xl font-serif text-[#34412f] mb-4">
                What your patients get
              </h2>
              <p className="text-lg text-[#5c7a52] max-w-3xl">
                A clinically meaningful program that goes far beyond standard
                testing — giving patients the insight and support to take real
                ownership of their health between consultations.
              </p>
            </div>

            {/* Patient Benefit Cards - 2x2 */}
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
              {/* Biomarker One */}
              <div className="bg-[#fdfbf7] rounded-2xl p-8 border border-[#e6ebe3]">
                <span className="inline-block px-3 py-1 bg-[#1D9E75]/10 text-[#1D9E75] text-xs font-medium rounded-full mb-4">
                  Testing
                </span>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-[#e6ebe3]">
                    <TestTube className="w-6 h-6 text-[#1D9E75]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#34412f]">
                      Biomarker One
                    </h3>
                  </div>
                </div>
                <p className="text-[#5c7a52] leading-relaxed">
                  A comprehensive biomarker panel covering kidney, liver,
                  metabolic, cardiovascular and hormonal health — run at
                  NATA-accredited labs and delivered to their dashboard.
                </p>
              </div>

              {/* Biological Clock */}
              <div className="bg-[#fdfbf7] rounded-2xl p-8 border border-[#e6ebe3]">
                <span className="inline-block px-3 py-1 bg-[#1D9E75]/10 text-[#1D9E75] text-xs font-medium rounded-full mb-4">
                  Longevity
                </span>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-[#e6ebe3]">
                    <Clock className="w-6 h-6 text-[#1D9E75]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#34412f]">
                      Biological Clock
                    </h3>
                  </div>
                </div>
                <p className="text-[#5c7a52] leading-relaxed">
                  A biological age score derived from their biomarker results —
                  showing patients how their body is ageing relative to their
                  chronological age and what&apos;s driving it.
                </p>
              </div>

              {/* Organ Health Score */}
              <div className="bg-[#fdfbf7] rounded-2xl p-8 border border-[#e6ebe3]">
                <span className="inline-block px-3 py-1 bg-[#1D9E75]/10 text-[#1D9E75] text-xs font-medium rounded-full mb-4">
                  Risk intelligence
                </span>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-[#e6ebe3]">
                    <Heart className="w-6 h-6 text-[#1D9E75]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#34412f]">
                      Organ health score
                    </h3>
                  </div>
                </div>
                <p className="text-[#5c7a52] leading-relaxed">
                  A clear health score across key organ systems — kidney, liver,
                  metabolic and more — highlighting risks early, before symptoms
                  appear.
                </p>
              </div>

              {/* Program Support */}
              <div className="bg-[#fdfbf7] rounded-2xl p-8 border border-[#e6ebe3]">
                <span className="inline-block px-3 py-1 bg-[#1D9E75]/10 text-[#1D9E75] text-xs font-medium rounded-full mb-4">
                  Ongoing care
                </span>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-[#e6ebe3]">
                    <Users className="w-6 h-6 text-[#1D9E75]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-[#34412f]">
                      Program support between consultations
                    </h3>
                  </div>
                </div>
                <p className="text-[#5c7a52] leading-relaxed">
                  Access to their care partner between GP visits — for guidance,
                  check-ins, and accountability — so the program continues
                  working even when they&apos;re not in your clinic.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How Referral Works - 4 Steps */}
        <section className="py-16 md:py-24 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-12">
              <span className="text-[#5DCAA5] text-sm font-medium tracking-wider uppercase mb-3 block">
                How it works
              </span>
              <h2 className="text-3xl md:text-4xl font-serif text-[#34412f]">
                From waiting room to enrolled patient in minutes
              </h2>
            </div>

            {/* Steps */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {/* Step 1 */}
              <div className="relative">
                <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3] shadow-sm h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-10 h-10 bg-[#1D9E75] rounded-full flex items-center justify-center text-white font-semibold">
                      1
                    </span>
                    <Stethoscope className="w-6 h-6 text-[#5DCAA5]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#34412f] mb-2">
                    Register your clinic
                  </h3>
                  <p className="text-sm text-[#5c7a52] leading-relaxed">
                    Fill a short form and we set up your clinic account. Takes 2
                    minutes. You receive your unique QR code, a print-ready A5
                    poster, and an A6 desk card by email.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3] shadow-sm h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-10 h-10 bg-[#1D9E75] rounded-full flex items-center justify-center text-white font-semibold">
                      2
                    </span>
                    <QrCode className="w-6 h-6 text-[#5DCAA5]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#34412f] mb-2">
                    Display your QR code
                  </h3>
                  <p className="text-sm text-[#5c7a52] leading-relaxed">
                    Place the poster in your waiting room or hand patients a
                    desk card. That&apos;s it. The QR code does the referring —
                    no GP time required per patient.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative">
                <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3] shadow-sm h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-10 h-10 bg-[#1D9E75] rounded-full flex items-center justify-center text-white font-semibold">
                      3
                    </span>
                    <UserPlus className="w-6 h-6 text-[#5DCAA5]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#34412f] mb-2">
                    Patients self-enrol
                  </h3>
                  <p className="text-sm text-[#5c7a52] leading-relaxed">
                    Patients scan, read about the program, fill their own
                    details, and pay $199. The entire enrolment is self-serve.
                    You are not involved in this step.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative">
                <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3] shadow-sm h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-10 h-10 bg-[#1D9E75] rounded-full flex items-center justify-center text-white font-semibold">
                      4
                    </span>
                    <BellRing className="w-6 h-6 text-[#5DCAA5]" />
                  </div>
                  <h3 className="text-lg font-semibold text-[#34412f] mb-2">
                    You get notified, program begins
                  </h3>
                  <p className="text-sm text-[#5c7a52] leading-relaxed">
                    The moment a patient enrols, you receive a notification. A
                    care partner is assigned, the first lab test is booked, and
                    the program begins — all automatically.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Band - Dark Green */}
        <section className="bg-[#04342C] py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
              {/* Left Column */}
              <div>
                <h3 className="text-2xl md:text-3xl font-serif text-white mb-4">
                  Simple pricing. No cost to your practice.
                </h3>
                <p className="text-white/80 mb-6 leading-relaxed">
                  Sanative is funded entirely by patient membership. There are
                  no referral fees, no practice costs, and no change to how you
                  bill consultations.
                </p>
                <ul className="space-y-3">
                  {[
                    "$0 to refer — no sign-up or platform fees for GPs",
                    "Consultations handled outside the platform, as normal",
                    "MBS billing completely unaffected",
                    "Cancel or pause patient referrals anytime",
                  ].map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-[#5DCAA5] mt-0.5 flex-shrink-0" />
                      <span className="text-white/90">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right Column - Price Box */}
              <div className="flex justify-center md:justify-end">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20 text-center w-full max-w-xs">
                  <span className="text-[#5DCAA5] text-sm font-medium tracking-wider uppercase block mb-4">
                    Patient membership
                  </span>
                  <div className="flex items-baseline justify-center gap-1 mb-2">
                    <span className="text-5xl font-bold text-white">$199</span>
                  </div>
                  <span className="text-white/60 text-sm">per year</span>
                  <div className="mt-6 pt-6 border-t border-white/20">
                    <span className="text-white/80 text-sm">
                      Paid by patient directly
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Pair */}
        <section className="py-16 md:py-20 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/for-doctors/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#1D9E75] text-white font-semibold rounded-full hover:bg-[#178a64] transition-all duration-200 group"
              >
                Register your clinic
                <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#34412f] font-semibold rounded-full border border-[#e6ebe3] hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all duration-200 group"
              >
                <Download className="w-5 h-5" />
                Download GP info pack
              </a>
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <section className="py-12 border-t border-[#e6ebe3] bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
              {[
                { icon: Stethoscope, text: "AHPRA registered doctors" },
                { icon: TestTube, text: "NATA-accredited labs" },
                { icon: ShieldCheck, text: "Australian Privacy Act compliant" },
                { icon: Heart, text: "Australian owned & operated" },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-[#5c7a52]"
                >
                  <item.icon className="w-5 h-5 text-[#1D9E75]" />
                  <span className="text-sm font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
