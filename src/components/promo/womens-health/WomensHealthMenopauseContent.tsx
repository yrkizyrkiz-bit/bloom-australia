import Link from "next/link";
import { WomensHealthSymptomsMarquee } from "@/components/promo/womens-health/WomensHealthSymptomsMarquee";
import { OrganCareMembershipSection } from "@/components/promo/sections/OrganCareMembershipSection";
import {
  Activity,
  ArrowRight,
  Beaker,
  Lock,
  MessageSquare,
  Phone,
  Shield,
  Stethoscope,
  Users,
} from "lucide-react";

const trustBadges = [
  { icon: Stethoscope, label: "AHPRA-registered doctors" },
  { icon: Lock, label: "Confidential care" },
  { icon: Beaker, label: "NATA-accredited labs" },
  { icon: Activity, label: "Biomarker-informed" },
  { icon: Users, label: "Care team support" },
];

const processSteps = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Health assessment",
    description:
      "Become a member and complete a confidential questionnaire about your symptoms, cycle history, medical background, and goals — tailored for perimenopause and menopause.",
  },
  {
    number: "02",
    icon: Beaker,
    title: "Biomarkers where appropriate",
    description:
      "Your doctor may recommend blood tests — for example hormones, thyroid, metabolic and bone-health markers — to inform a safe, personalised plan.",
  },
  {
    number: "03",
    icon: Phone,
    title: "Telehealth consultation",
    description:
      "An AHPRA-registered Australian doctor reviews your assessment and results, then discusses what is clinically appropriate for you in a private 30-minute consult.",
  },
];

const benefits = [
  {
    icon: Stethoscope,
    title: "AHPRA-registered doctors",
    description:
      "Every consultation is with an Australian-registered doctor who assesses your full health profile before any clinical decisions.",
  },
  {
    icon: Beaker,
    title: "Biomarker-informed care",
    description:
      "Hormone and metabolic testing helps your doctor understand your biology — not guesswork based on symptoms alone.",
  },
  {
    icon: Lock,
    title: "Confidential & discreet",
    description:
      "Your health information is protected under Australian privacy law. Telehealth from home, on your schedule.",
  },
  {
    icon: MessageSquare,
    title: "Ongoing support",
    description:
      "Message your care team between appointments. Symptom tracking and follow-up are part of your program.",
  },
];

export function WomensHealthMenopauseContent() {
  return (
    <>
        <div className="bg-[#fdf8f6] border-b border-[#f8e1e1]/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
              {trustBadges.map((badge, index) => {
                const Icon = badge.icon;
                return (
                  <div key={badge.label} className="flex items-center gap-6">
                    {index > 0 ? (
                      <div className="hidden sm:block w-px h-5 bg-[#e8b4b4]/70" aria-hidden />
                    ) : null}
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#c17a58]" aria-hidden />
                      <span className="text-sm text-[#5a3a3a]">{badge.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Overview */}
        <section id="overview" className="pt-10 pb-16 lg:pt-14 lg:pb-20 scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              <div className="min-w-0">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] leading-[1.1] mb-6">
                  Your health journey,{" "}
                  <span className="text-[#c17a58] italic">supported</span>{" "}
                  at every stage
                </h2>
                <p className="text-lg text-[#5c7a52] leading-relaxed mb-6">
                  Menopause marks the end of menstrual periods, usually between ages 45 and 55 in
                  Australia. For many women, perimenopause — the years leading up to it — brings the
                  most disruptive symptoms as oestrogen and progesterone levels change.
                </p>
                <p className="text-[#5c7a52] leading-relaxed">
                  Despite how common this is, menopause is still under-discussed. Sanative exists to
                  demystify the transition and connect you with doctors who take your symptoms
                  seriously and review your health holistically.
                </p>
              </div>

              <div className="min-w-0 flex flex-col">
                <div className="bg-gradient-to-br from-[#fef4f0] to-[#f8e1e1]/50 rounded-3xl p-8 lg:p-10 border border-[#f8e1e1]">
                  <h3 className="text-xl font-serif text-[#2c3628] mb-4">When to seek support</h3>
                  <ul className="space-y-3">
                    {[
                      "Hot flushes or night sweats affecting sleep or daily life",
                      "Mood changes, anxiety, or brain fog that feel new or persistent",
                      "Irregular periods or heavy bleeding in perimenopause",
                      "Vaginal dryness, discomfort, or urinary symptoms",
                      "You want a doctor to review whether MHT or other options suit you",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-3 text-[#5c7a52]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#c17a58] mt-2 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6">
                  <Link
                    href="/membership/checkout"
                    className="inline-flex w-full items-center justify-center gap-2 px-6 py-3.5 bg-[#c17a58] hover:bg-[#a86548] text-white rounded-full font-medium transition-all"
                  >
                    Join Sanative and start your assessment
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <WomensHealthSymptomsMarquee />

        {/* Perimenopause */}
        <section id="perimenopause" className="py-20 lg:py-28 scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 bg-gradient-to-br from-[#e8d5e8]/30 to-[#fef4f0] rounded-3xl p-8 lg:p-10 border border-[#e8d5e8]/40">
                <h3 className="text-2xl font-serif text-[#2c3628] mb-4">How menopause is diagnosed</h3>
                <p className="text-[#5c7a52] leading-relaxed mb-4">
                  In women over 45, diagnosis is usually based on your symptoms and menstrual pattern —
                  blood tests are not always required. Under 45, or with unusual symptoms, your doctor
                  may order tests to confirm ovarian function and exclude other conditions.
                </p>
                <p className="text-[#5c7a52] leading-relaxed text-sm">
                  Sanative doctors follow Australian clinical guidance. Individual assessment always
                  comes first.
                </p>
              </div>
              <div className="order-1 lg:order-2">
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#e8d5e8]/40 text-[#6b4a6b] rounded-full mb-4">
                  Perimenopause
                </span>
                <h2 className="text-3xl sm:text-4xl font-serif text-[#2c3628] mb-6">
                  It often starts{" "}
                  <span className="text-[#c17a58] italic">before periods stop</span>
                </h2>
                <p className="text-lg text-[#5c7a52] leading-relaxed mb-4">
                  Perimenopause can last several years. Hormone levels rise and fall unpredictably —
                  which is why symptoms can come and go and why a one-off blood test may not tell the
                  full story.
                </p>
                <p className="text-[#5c7a52] leading-relaxed">
                  Early signs often include irregular periods, hot flushes, sleep disruption, and mood
                  changes. Starting a conversation with a doctor during perimenopause can help you
                  plan ahead rather than react in crisis.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Care at Sanative */}
        <section id="care" className="py-20 lg:py-28 bg-[#fdf8f6] scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#f8e1e1]/60 text-[#8b5a5a] rounded-full mb-4">
                Treatment & care
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-[#2c3628] mb-4">
                Treat the cause, not just the signs
              </h2>
              <p className="text-lg text-[#5c7a52] max-w-3xl mx-auto">
                Declining oestrogen drives many menopause symptoms. Your doctor may discuss lifestyle
                changes, non-hormonal options, or medical and clinical therapy — based on your
                symptoms, age, and medical history. Nothing is one-size-fits-all.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                {
                  title: "Lifestyle & self-care",
                  body: "Sleep hygiene, exercise, stress management, and dietary support — practical foundations your doctor can help personalise.",
                },
                {
                  title: "Non-hormonal options",
                  body: "Some women benefit from non-hormonal medicines or topical treatments for specific symptoms. Your doctor explains what may suit you.",
                },
                {
                  title: "Medical and clinical therapy",
                  body: "Where clinically appropriate, your doctor may discuss medical or clinical therapy in a private consult. What is suitable — if anything — depends on your symptoms, history, and clinical assessment.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-white rounded-2xl p-6 border border-[#f8e1e1] text-center"
                >
                  <h3 className="text-lg font-serif text-[#2c3628] mb-3">{card.title}</h3>
                  <p className="text-sm text-[#5c7a52] leading-relaxed">{card.body}</p>
                </div>
              ))}
            </div>

            <p className="mt-10 text-center text-sm text-[#7e9a72] max-w-2xl mx-auto">
              Sanative does not advertise prescription products on this website. Suitable care options,
              if any, are discussed privately with your doctor. PBS and private prescription costs vary.
            </p>
          </div>
        </section>

        {/* Trust bar */}
        <section className="py-6 bg-[#3d2c2c]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-8 lg:gap-14 text-white">
              {[
                { icon: Shield, label: "AHPRA-registered doctors" },
                { icon: Lock, label: "Confidential telehealth" },
                { icon: Beaker, label: "Biomarker-informed" },
                { icon: Users, label: "Care team support" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-[#f8e1e1]" />
                  <span className="text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Process */}
        <section id="process" className="py-20 lg:py-28 bg-[#fef4f0] scroll-mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] mb-4">
                How Sanative{" "}
                <span className="text-[#c17a58] italic">works</span>
              </h2>
              <p className="text-lg text-[#5c7a52] max-w-2xl mx-auto">
                A clear clinical pathway — from assessment to doctor review and ongoing support.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {processSteps.map((step, index) => (
                <div key={step.number} className="relative">
                  {index < processSteps.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-[#e8b4b4]/50" />
                  )}
                  <div className="bg-white rounded-3xl p-8 border border-[#f8e1e1] relative z-10 shadow-sm">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full bg-[#c17a58] flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{step.number}</span>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-[#f8e1e1]/60 flex items-center justify-center">
                        <step.icon className="w-6 h-6 text-[#c17a58]" />
                      </div>
                    </div>
                    <h3 className="text-xl font-serif text-[#2c3628] mb-3">{step.title}</h3>
                    <p className="text-[#5c7a52] leading-relaxed text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href="/womens-health/assessment?category=menopause"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#c17a58] hover:bg-[#a86548] text-white rounded-full font-medium transition-all"
              >
                Start your assessment
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
                Why women choose{" "}
                <span className="text-[#c17a58] italic">Sanative</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="bg-white rounded-2xl p-6 border border-[#f8e1e1] hover:shadow-lg transition-shadow"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#f8e1e1]/50 flex items-center justify-center mb-4">
                    <benefit.icon className="w-7 h-7 text-[#c17a58]" />
                  </div>
                  <h3 className="text-lg font-serif text-[#2c3628] mb-2">{benefit.title}</h3>
                  <p className="text-sm text-[#5c7a52] leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <OrganCareMembershipSection
          accent="blush"
          heading={
            <>
              Become a member and{" "}
              <span className="text-[#c17a58] italic">start your assessment</span>
            </>
          }
        />
    </>
  );
}
