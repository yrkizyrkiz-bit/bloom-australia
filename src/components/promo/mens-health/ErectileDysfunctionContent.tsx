"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { PublicComplianceBlock } from "@/components/legal/PublicComplianceBlock";
import { LEGAL_LINKS } from "@/lib/legal/constants";
import {
  ArrowRight,
  Activity,
  Beaker,
  Brain,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Heart,
  Lock,
  MessageSquare,
  Phone,
  Shield,
  Stethoscope,
  HeartPulse,
} from "lucide-react";

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-[#e6ebe3] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full py-5 flex items-center justify-between text-left"
      >
        <span className="text-lg font-medium text-[#2c3628] pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-[#5c7a52] flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#5c7a52] flex-shrink-0" />
        )}
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-[500px] pb-5" : "max-h-0"
        }`}
      >
        <div className="text-[#5c7a52] leading-relaxed">{answer}</div>
      </div>
    </div>
  );
}

const processSteps = [
  {
    number: "01",
    icon: MessageSquare,
    title: "Confidential assessment",
    description:
      "Complete an online questionnaire covering symptoms, medical history, medications, lifestyle, and goals, designed for sexual wellbeing concerns.",
  },
  {
    number: "02",
    icon: Beaker,
    title: "Biomarkers where appropriate",
    description:
      "Your doctor may recommend blood tests (for example hormones, metabolic, thyroid, and cardiovascular markers) to understand contributing factors.",
  },
  {
    number: "03",
    icon: Phone,
    title: "Doctor consultation",
    description:
      "An AHPRA-registered Australian doctor reviews your assessment and discusses whether a personalised care plan is clinically appropriate for you via telehealth.",
  },
];

const physicalCauses = [
  "Heart disease and blood vessel disease",
  "High blood pressure or high cholesterol",
  "Type 2 diabetes",
  "Low testosterone or other hormone changes",
  "Chronic kidney disease",
  "Sleep disorders such as sleep apnoea",
  "Nerve damage or neurological conditions",
  "Injury or surgery involving the pelvis, prostate, or genitals",
  "Peyronie’s disease (curvature from scar tissue)",
];

const medicationCauses = [
  "Some antidepressants (including certain SSRIs)",
  "Certain blood pressure medicines",
  "Some sleep medicines or tranquilisers",
  "Antiandrogens used in prostate cancer care",
  "Some appetite suppressants or ulcer medicines",
  "Opioid pain medicines",
];

const psychologicalCauses = [
  "Anxiety, including performance anxiety",
  "Depression or low mood",
  "Stress and burnout",
  "Low self-esteem or guilt about sex",
  "Relationship difficulties",
];

const riskFactors = [
  "Increasing age",
  "Smoking",
  "Excessive alcohol use",
  "Recreational drug use",
  "Physical inactivity",
  "Overweight or obesity",
  "Diabetes or vascular disease",
  "Pelvic surgery or neurological conditions",
  "Medicines associated with erection difficulties",
];

const preventionTips = [
  "Eat a balanced, nutrient-rich diet",
  "Stay physically active and maintain a healthy weight",
  "Limit alcohol and avoid recreational drugs",
  "Quit smoking if you smoke",
  "Manage stress in healthy ways",
  "Prioritise sleep and recovery",
];

const faqs = [
  {
    question: "What is the main cause of erectile dysfunction?",
    answer:
      "There isn’t a single cause. Physical factors such as heart disease or diabetes, medicines, and psychological factors such as anxiety or depression often play a role, and they frequently overlap. A doctor can help identify what is most relevant for you.",
  },
  {
    question: "Can erectile dysfunction go away on its own?",
    answer:
      "Occasional difficulties can settle without medical care, especially if they relate to stress, fatigue, or alcohol. If symptoms are persistent, worsening, or causing distress, it’s worth speaking with a doctor to look for underlying causes.",
  },
  {
    question: "Can lifestyle changes help?",
    answer:
      "Yes. Regular exercise, a healthy diet, quitting smoking, moderating alcohol, managing stress, and improving sleep can support blood flow, mental health, and overall wellbeing, which may also support erectile function.",
  },
  {
    question: "When should I see a doctor?",
    answer:
      "If you frequently have trouble getting or keeping an erection firm enough for satisfying sex, or if it is affecting your confidence or relationships, talk with a doctor. Occasional issues are common; ongoing patterns deserve clinical review.",
  },
  {
    question: "Can I get help via telehealth in Australia?",
    answer:
      "Yes. Sanative offers confidential telehealth assessment with AHPRA-registered doctors across Australia. Your doctor may also recommend pathology at a collection centre near you where clinically appropriate.",
  },
  {
    question: "Will I be prescribed something after assessment?",
    answer:
      "Not automatically. Suitable care options, if any, are discussed privately with your doctor if clinically appropriate for your health profile. Options are never advertised on this website.",
  },
];

export function ErectileDysfunctionContent({
  variant = "page",
}: {
  variant?: "page" | "embed";
}) {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);
  const isEmbed = variant === "embed";

  return (
    <>
        {isEmbed && (
        <section
          id="sexual-health"
          className="relative py-20 lg:py-28 overflow-hidden scroll-mt-24"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#f4f7f2] via-[#fdfbf7] to-[#e6ebe3]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-[#e6ebe3] rounded-full px-4 py-2 mb-6">
                  <Shield className="w-4 h-4 text-[#5c7a52]" />
                  <span className="text-sm text-[#5c7a52]">Confidential · AHPRA-registered doctors</span>
                </div>

                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#2c3628] leading-tight mb-6">
                  Better{" "}
                  <span className="text-[#5c7a52] italic">Erection</span>
                </h2>

                <p className="text-lg text-[#5c7a52] leading-relaxed mb-8">
                  Erectile dysfunction (ED) means trouble getting or keeping an erection firm enough
                  for satisfying sexual activity. It is common, often manageable, and can also be an
                  early signal to check your heart and metabolic health. Sanative offers confidential,
                  doctor-led assessment via telehealth across Australia.
                </p>

                <div className="space-y-3 mb-8">
                  {[
                    "Clinical assessment before any care plan",
                    "Care options discussed privately if clinically appropriate",
                    "Biomarker-informed review where useful",
                    "Telehealth with Australian-registered doctors",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 text-[#2c3628]">
                      <CheckCircle className="w-5 h-5 text-[#5c7a52] flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/mens-health/assessment?concern=erectile-dysfunction"
                    className="btn-primary inline-flex items-center justify-center gap-2 text-lg px-8 py-4"
                  >
                    Start assessment
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/mens-health/erectile-dysfunction#overview"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-[#cdd8c6] text-[#2c3628] hover:bg-[#e6ebe3]/60 transition-colors font-medium text-lg"
                  >
                    Learn more
                  </Link>
                </div>
              </div>

              <div className="relative mx-auto w-full max-w-sm lg:max-w-lg">
                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-xl">
                  <Image
                    src="/images/mens-health/ed-portrait.webp"
                    alt="Man outdoors, confidential men's sexual health assessment"
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 1024px) 24rem, 32rem"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#34412f]/30 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </section>
        )}

        {!isEmbed && (
          <>
        {/* Overview */}
        <section id="overview" className="py-20 lg:py-28 scroll-mt-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              <div>
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#e6ebe3] text-[#5c7a52] rounded-full mb-4">
                  Overview
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] mb-6">
                  What is{" "}
                  <span className="text-[#5c7a52] italic">erectile dysfunction?</span>
                </h1>
                <p className="text-lg text-[#5c7a52] leading-relaxed mb-6">
                  ED is a medical condition characterised by difficulty getting or maintaining an
                  erection firm enough for satisfying sex. Symptoms can be mild, moderate, or severe,
                  and temporary or ongoing.
                </p>
                <p className="text-[#5c7a52] leading-relaxed mb-6">
                  Beyond sexual wellbeing and relationships, ED can be an early warning sign of
                  conditions such as diabetes and heart disease. Think of it as your body prompting a
                  proper medical conversation, not something you need to ignore or feel embarrassed about.
                </p>
                <p className="text-[#5c7a52] leading-relaxed">
                  Occasional difficulty is common and often situational. Persistent or worsening
                  patterns are worth assessing with a doctor rather than waiting and hoping they
                  resolve on their own.
                </p>
              </div>

              <div className="bg-[#f4f7f2] rounded-3xl p-8 lg:p-10">
                <h3 className="text-xl font-serif text-[#2c3628] mb-4">Severity can look like</h3>
                <ul className="space-y-3">
                  {[
                    "No erections at all",
                    "Erections that aren’t firm enough for penetration",
                    "Erections that don’t last as long as you’d like",
                    "Firm erections sometimes, but not consistently",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[#5c7a52]">
                      <CheckCircle className="w-5 h-5 text-[#5c7a52] flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-sm text-[#7e9a72] leading-relaxed">
                  People enter Sanative with different health profiles and goals. Your doctor reviews
                  what is clinically appropriate for you individually.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Symptoms */}
        <section id="symptoms" className="py-20 lg:py-28 bg-[#f4f7f2] scroll-mt-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14 max-w-3xl mx-auto">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#5c7a52]/15 text-[#5c7a52] rounded-full mb-4">
                Symptoms
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-[#2c3628] mb-4">
                Signs to{" "}
                <span className="text-[#5c7a52] italic">look for</span>
              </h2>
              <p className="text-lg text-[#5c7a52]">
                The most common symptoms relate to erection quality and consistency. Related changes
                in mood, confidence, or desire can also appear.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
              <div className="bg-white rounded-3xl p-8 border border-[#e6ebe3]">
                <div className="w-12 h-12 rounded-2xl bg-[#5c7a52]/10 flex items-center justify-center mb-5">
                  <HeartPulse className="w-6 h-6 text-[#5c7a52]" />
                </div>
                <h3 className="text-xl font-serif text-[#2c3628] mb-4">Common symptoms</h3>
                <ul className="space-y-3">
                  {[
                    "Trouble getting an erection",
                    "Trouble keeping an erection",
                    "Erections that aren’t as firm as you’d like",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[#5c7a52]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5c7a52] mt-2 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-3xl p-8 border border-[#e6ebe3]">
                <div className="w-12 h-12 rounded-2xl bg-[#5c7a52]/10 flex items-center justify-center mb-5">
                  <Brain className="w-6 h-6 text-[#5c7a52]" />
                </div>
                <h3 className="text-xl font-serif text-[#2c3628] mb-4">Related experiences</h3>
                <ul className="space-y-3">
                  {[
                    "Decreased sexual desire",
                    "Loss of confidence",
                    "Mood changes or anxiety",
                    "Strain in relationships",
                    "Ejaculation difficulties (depending on cause)",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[#5c7a52]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5c7a52] mt-2 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Causes */}
        <section id="causes" className="py-20 lg:py-28 scroll-mt-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mb-14">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#e6ebe3] text-[#5c7a52] rounded-full mb-4">
                Causes
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-[#2c3628] mb-4">
                Why erections{" "}
                <span className="text-[#5c7a52] italic">stop working as usual</span>
              </h2>
              <p className="text-lg text-[#5c7a52] leading-relaxed">
                Erections involve your cardiovascular, nervous, and hormone systems working together.
                Physical health issues, medicines, lifestyle factors, and psychological stress can all
                interfere (often in combination).
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
              <div className="bg-[#f4f7f2] rounded-3xl p-7 lg:p-8">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-5">
                  <Heart className="w-6 h-6 text-[#5c7a52]" />
                </div>
                <h3 className="text-xl font-serif text-[#2c3628] mb-3">Physical factors</h3>
                <p className="text-sm text-[#7e9a72] mb-5">
                  Conditions affecting blood flow, nerves, hormones, or pelvic structures.
                </p>
                <ul className="space-y-2.5">
                  {physicalCauses.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-[#5c7a52]">
                      <CheckCircle className="w-4 h-4 text-[#5c7a52] flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#f4f7f2] rounded-3xl p-7 lg:p-8">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-5">
                  <Beaker className="w-6 h-6 text-[#5c7a52]" />
                </div>
                <h3 className="text-xl font-serif text-[#2c3628] mb-3">Medicines</h3>
                <p className="text-sm text-[#7e9a72] mb-5">
                  Some medicines used for other conditions can contribute as a side effect. Do not
                  stop a prescribed medicine without speaking to a doctor or pharmacist.
                </p>
                <ul className="space-y-2.5">
                  {medicationCauses.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-[#5c7a52]">
                      <CheckCircle className="w-4 h-4 text-[#5c7a52] flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#f4f7f2] rounded-3xl p-7 lg:p-8">
                <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-5">
                  <Brain className="w-6 h-6 text-[#5c7a52]" />
                </div>
                <h3 className="text-xl font-serif text-[#2c3628] mb-3">Psychological factors</h3>
                <p className="text-sm text-[#7e9a72] mb-5">
                  Stress and mental health commonly affect erectile function, and ED can also
                  increase anxiety, creating a cycle.
                </p>
                <ul className="space-y-2.5">
                  {psychologicalCauses.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-[#5c7a52]">
                      <CheckCircle className="w-4 h-4 text-[#5c7a52] flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Risk factors */}
        <section id="risk-factors" className="py-20 lg:py-28 bg-[#34412f] scroll-mt-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-white/10 text-[#a8bb9e] rounded-full mb-4">
                  Risk factors
                </span>
                <h2 className="text-3xl sm:text-4xl font-serif text-white mb-6">
                  Who is more{" "}
                  <span className="text-[#a8bb9e] italic">likely to be affected?</span>
                </h2>
                <p className="text-lg text-[#a8bb9e] leading-relaxed mb-6">
                  ED can happen at any adult age, but it becomes more common with age. Large studies
                  have found rates rising substantially from midlife into later decades, especially
                  when other health risks are present.
                </p>
                <p className="text-[#a8bb9e] leading-relaxed">
                  Changing habits can support overall health. Many men benefit from structured support
                  from a doctor, and where relevant a dietitian, trainer, or counsellor.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                {riskFactors.map((item) => (
                  <div
                    key={item}
                    className="bg-white/10 border border-white/10 rounded-2xl px-4 py-3 text-[#cdd8c6] text-sm"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Diagnosis / assessment */}
        <section id="diagnosis" className="py-20 lg:py-28 scroll-mt-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14 max-w-3xl mx-auto">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#e6ebe3] text-[#5c7a52] rounded-full mb-4">
                Assessment
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-[#2c3628] mb-4">
                How doctors{" "}
                <span className="text-[#5c7a52] italic">assess ED</span>
              </h2>
              <p className="text-lg text-[#5c7a52]">
                Assessment usually starts with conversation, and often includes biomarker testing to
                uncover contributing factors such as hormones, metabolism, and cardiovascular risk.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {[
                {
                  title: "Medical history",
                  description: "Symptoms, medicines, surgeries, and other health conditions.",
                },
                {
                  title: "Lifestyle review",
                  description: "Sleep, stress, alcohol, smoking, activity, and relationships.",
                },
                {
                  title: "Questionnaires",
                  description: "Validated tools such as the IIEF may help quantify symptoms and impact.",
                },
                {
                  title: "Biomarker testing",
                  description:
                    "Targeted blood panels where clinically appropriate, to measure, not guess.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className={`rounded-2xl p-6 border ${
                    item.title === "Biomarker testing"
                      ? "bg-[#34412f] border-[#34412f] text-white"
                      : "bg-white border-[#e6ebe3]"
                  }`}
                >
                  <h3
                    className={`text-lg font-serif mb-2 ${
                      item.title === "Biomarker testing" ? "text-white" : "text-[#2c3628]"
                    }`}
                  >
                    {item.title}
                  </h3>
                  <p
                    className={`text-sm leading-relaxed ${
                      item.title === "Biomarker testing" ? "text-[#a8bb9e]" : "text-[#5c7a52]"
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
              <div className="bg-[#f4f7f2] rounded-3xl p-8 lg:p-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#5c7a52]/15 flex items-center justify-center">
                    <Beaker className="w-6 h-6 text-[#5c7a52]" />
                  </div>
                  <h3 className="text-xl font-serif text-[#2c3628]">
                    Biomarkers your doctor may review
                  </h3>
                </div>
                <p className="text-[#5c7a52] mb-6 leading-relaxed">
                  Blood tests can help identify treatable contributors to ED and broader health risks.
                  Your doctor decides which markers are relevant for you, panels are not one-size-fits-all.
                </p>
                <div className="grid sm:grid-cols-2 gap-3 mb-8">
                  {[
                    "Testosterone & hormone panel",
                    "Blood sugar / HbA1c",
                    "Lipids & cholesterol",
                    "Thyroid function",
                    "Liver & kidney markers",
                    "Vitamin D, B12 & iron studies",
                    "Inflammation markers",
                    "PSA where clinically indicated",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2.5 text-sm text-[#5c7a52]">
                      <CheckCircle className="w-4 h-4 text-[#5c7a52] flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/mens-health/assessment?concern=erectile-dysfunction"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Start assessment
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="bg-white rounded-3xl p-8 lg:p-10 border border-[#e6ebe3]">
                <h3 className="text-xl font-serif text-[#2c3628] mb-4">
                  Other investigations if needed
                </h3>
                <p className="text-[#5c7a52] mb-6 leading-relaxed">
                  Many men are assessed from history plus biomarkers. Where more information is needed,
                  your doctor may also recommend:
                </p>
                <div className="space-y-4 mb-8">
                  {[
                    "Review of cardiovascular and metabolic risk",
                    "Referral for further clinical review if an underlying condition needs work-up",
                    "Additional investigations in selected cases (for example imaging)",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 text-[#5c7a52]">
                      <CheckCircle className="w-5 h-5 text-[#5c7a52] flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-[#7e9a72] leading-relaxed">
                  At Sanative, biomarker testing is arranged through NATA-accredited pathology partners
                  when your doctor considers it clinically appropriate, then reviewed in your
                  telehealth consult.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Care at Sanative, NOT a medication catalogue */}
        <section id="care" className="py-20 lg:py-28 bg-[#f4f7f2] scroll-mt-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-14 max-w-3xl mx-auto">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#5c7a52]/15 text-[#5c7a52] rounded-full mb-4">
                Care at Sanative
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-[#2c3628] mb-4">
                Doctor-led help,{" "}
                <span className="text-[#5c7a52] italic">built around you</span>
              </h2>
              <p className="text-lg text-[#5c7a52]">
                Your pathway depends on the cause. Suitable care options, if any, are discussed
                privately in consultation if clinically appropriate, they are not advertised here.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {processSteps.map((step, index) => (
                <div key={step.number} className="relative">
                  {index < processSteps.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-[#cdd8c6]" />
                  )}
                  <div className="bg-white rounded-3xl p-8 border border-[#e6ebe3] relative z-10 h-full">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full bg-[#34412f] flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{step.number}</span>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-[#5c7a52]/10 flex items-center justify-center">
                        <step.icon className="w-6 h-6 text-[#5c7a52]" />
                      </div>
                    </div>
                    <h3 className="text-xl font-serif text-[#2c3628] mb-3">{step.title}</h3>
                    <p className="text-[#5c7a52] leading-relaxed">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6 lg:gap-8 mb-12">
              <div className="bg-white rounded-3xl p-8 border border-[#e6ebe3]">
                <h3 className="text-xl font-serif text-[#2c3628] mb-4">What your doctor may consider</h3>
                <ul className="space-y-3">
                  {[
                    "Identifying and managing contributing health conditions",
                    "Lifestyle changes that support blood flow and recovery",
                    "Psychological support such as counselling or sex therapy where helpful",
                    "Reviewing medicines that may be contributing",
                    "Personalised clinical options discussed privately if appropriate",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-[#5c7a52]">
                      <CheckCircle className="w-5 h-5 text-[#5c7a52] flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#34412f] rounded-3xl p-8 text-white">
                <div className="flex items-center gap-3 mb-4">
                  <Lock className="w-6 h-6 text-[#a8bb9e]" />
                  <h3 className="text-xl font-serif">Why telehealth can help</h3>
                </div>
                <p className="text-[#a8bb9e] leading-relaxed mb-6">
                  Many men prefer a private conversation from home. Sanative connects you with
                  Australian-registered doctors for confidential assessment, without needing to walk
                  into a clinic for the first conversation.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "AHPRA-registered doctors",
                    "Australian privacy protections",
                    "Care team messaging in your portal",
                    "Refund if not clinically suitable",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[#cdd8c6] text-sm">
                      <CheckCircle className="w-4 h-4 text-[#a8bb9e] flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/mens-health/assessment?concern=erectile-dysfunction"
                  className="btn-white inline-flex items-center gap-2"
                >
                  Start assessment
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>

            <PublicComplianceBlock title="Individual clinical decisions" className="!py-0" />
          </div>
        </section>

        {/* Prevention */}
        <section id="prevention" className="py-20 lg:py-28 scroll-mt-32">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#e6ebe3] text-[#5c7a52] rounded-full mb-4">
                  Prevention
                </span>
                <h2 className="text-3xl sm:text-4xl font-serif text-[#2c3628] mb-6">
                  Habits that support{" "}
                  <span className="text-[#5c7a52] italic">sexual health</span>
                </h2>
                <p className="text-lg text-[#5c7a52] leading-relaxed mb-6">
                  You can’t control every risk factor, but lifestyle changes can reduce risk and support
                  erectile function at any age. Start with one or two habits and build from there.
                </p>
                <p className="text-[#5c7a52] leading-relaxed mb-8">
                  <strong className="text-[#2c3628]">When to seek help:</strong> occasional difficulty
                  is often situational. If it happens often, is getting worse, or causes distress, book
                  a clinical assessment.
                </p>
                <Link
                  href="/mens-health/assessment?concern=erectile-dysfunction"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Book a confidential assessment
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {preventionTips.map((tip) => (
                  <div
                    key={tip}
                    className="flex items-start gap-3 bg-[#f4f7f2] rounded-2xl p-5 border border-[#e6ebe3]"
                  >
                    <Activity className="w-5 h-5 text-[#5c7a52] flex-shrink-0 mt-0.5" />
                    <span className="text-[#2c3628] text-sm leading-relaxed">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom line */}
        <section className="py-16 bg-[#e6ebe3]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-serif text-[#2c3628] mb-4">Bottom line</h2>
            <p className="text-[#5c7a52] leading-relaxed mb-4">
              ED is a common sexual health concern that can affect men at many ages. For many, a
              combination of medical review, lifestyle support, and psychological care where needed
              makes a meaningful difference.
            </p>
            <p className="text-[#5c7a52] leading-relaxed">
              The best first step is talking with a healthcare professional. Sanative offers
              confidential telehealth assessment with AHPRA-registered doctors across Australia,
              so you can start the conversation without leaving home.
            </p>
          </div>
        </section>

        {/* Trust row */}
        <section className="py-16 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: Stethoscope,
                  title: "AHPRA registered",
                  description: "Australian doctors review every assessment",
                },
                {
                  icon: Lock,
                  title: "Confidential",
                  description: "Protected under Australian privacy law",
                },
                {
                  icon: Beaker,
                  title: "Biomarker-informed",
                  description: "Testing recommended where clinically useful",
                },
                {
                  icon: MessageSquare,
                  title: "Ongoing support",
                  description: "Care team messaging in your portal",
                },
              ].map((item) => (
                <div key={item.title} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-[#5c7a52]/15 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-7 h-7 text-[#5c7a52]" />
                  </div>
                  <h3 className="text-lg font-serif text-[#2c3628] mb-1">{item.title}</h3>
                  <p className="text-sm text-[#5c7a52]">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-20 lg:py-28 bg-[#f4f7f2] scroll-mt-32">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#e6ebe3] text-[#5c7a52] rounded-full mb-4">
                Common questions
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
                Frequently asked questions
              </h2>
            </div>

            <div className="bg-white rounded-3xl border border-[#e6ebe3] px-6 lg:px-8">
              {faqs.map((faq, index) => (
                <FAQItem
                  key={faq.question}
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openFAQ === index}
                  onToggle={() => setOpenFAQ(openFAQ === index ? null : index)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 lg:py-28 bg-[#34412f]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white mb-6">
              Ready for a confidential conversation?
            </h2>
            <p className="text-lg text-[#a8bb9e] mb-10 max-w-2xl mx-auto">
              Become a member and book your doctor consultation, get a health check-up followed by a doctor's recommendations of what is clinically appropriate for you.
            </p>
            <Link
              href="/mens-health/assessment?concern=erectile-dysfunction"
              className="btn-white inline-flex items-center justify-center gap-2 text-lg px-8 py-4"
            >
              Start assessment
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-6 text-sm text-[#7e9a72]">
              Refund if not suitable · Australian doctors · Confidential care
            </p>
          </div>
        </section>

        {/* Medical disclaimer */}
        <section className="py-8 bg-[#2c3628]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs text-[#7e9a72] leading-relaxed text-center">
              <strong className="text-[#a8bb9e]">Medical Disclaimer:</strong> This information is for
              educational purposes only and does not constitute medical advice, diagnosis, or care
              recommendations. Erectile dysfunction and related sexual health concerns require
              individual clinical assessment by a qualified healthcare professional. All Sanative
              consultations are provided by AHPRA-registered medical practitioners. Suitable care
              options, if any, are discussed privately where clinically appropriate. Results vary
              between individuals and are not guaranteed. Never disregard professional medical advice
              or delay seeking it because of something you have read on this website. If you have
              chest pain, sudden vision changes, or other urgent symptoms, seek emergency care. See our{" "}
              <Link
                href={LEGAL_LINKS.medicalDisclaimer}
                className="underline text-[#a8bb9e] hover:text-white"
              >
                Medical Disclaimer
              </Link>{" "}
              for full details.
            </p>
          </div>
        </section>
          </>
        )}
    </>
  );
}
