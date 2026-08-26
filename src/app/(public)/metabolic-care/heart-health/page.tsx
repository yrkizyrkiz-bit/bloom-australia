"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { HeartHealthCalculator } from "@/components/promo/HeartHealthCalculator";
import {
  BiomarkerHoneycomb,
  HEART_PANEL_HONEYCOMB_IDS,
} from "@/components/promo/BiomarkerHoneycomb";
import { OrganCareMembershipSection } from "@/components/promo/sections/OrganCareMembershipSection";
import {
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Stethoscope,
  Activity,
  Heart,
  Scale,
  Utensils,
  Moon,
  Cigarette,
  Pill,
  Eye,
  Wrench,
  Check,
  RefreshCw,
  ShieldCheck,
  Clock,
  Users,
  LineChart,
  FlaskConical,
  TrendingUp,
  Droplets,
  Zap,
} from "lucide-react";

// FAQ Item Component
function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-rose-100">
      <button
        type="button"
        onClick={onToggle}
        className="w-full py-5 flex items-center justify-between text-left"
      >
        <span className="text-lg font-medium text-gray-900 pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-rose-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-rose-500 flex-shrink-0" />
        )}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[500px] pb-5" : "max-h-0"}`}>
        <p className="text-gray-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export default function HeartHealthPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const epidemicStats = [
    { value: "1.2M", label: "Australians living with heart disease", subtext: "Leading cause of death in Australia", citation: "AIHW, 2023" },
    { value: "~6M", label: "Australians have high cholesterol", subtext: "One in three adults over 18", citation: "Heart Foundation, 2023" },
    { value: "64%", label: "of cardiovascular deaths involve modifiable risk factors", subtext: "Lifestyle and medical factors your doctor can review", citation: "Lancet Global Health, 2019" },
  ];

  const conditions = [
    { icon: Droplets, title: "Dyslipidemia", description: "Abnormal lipid levels in blood", detail: "Increased cardiovascular risk when untreated" },
    { icon: TrendingUp, title: "Hypercholesterolemia", description: "Elevated LDL cholesterol", detail: "Major risk factor for atherosclerosis" },
    { icon: Zap, title: "Hypertriglyceridemia", description: "Elevated triglyceride levels", detail: "Linked to obesity and metabolic dysfunction" },
  ];

  const riskFactors = [
    { icon: Scale, title: "Overweight or obesity", description: "Especially abdominal fat" },
    { icon: Activity, title: "Sedentary lifestyle", description: "Lack of physical activity" },
    { icon: Utensils, title: "Poor diet", description: "High saturated fats" },
    { icon: Cigarette, title: "Smoking", description: "Damages blood vessels" },
    { icon: Moon, title: "Family history", description: "Genetic predisposition" },
    { icon: Heart, title: "Type 2 diabetes", description: "Co-occurs with lipid disorders" },
  ];

  const processSteps = [
    { icon: Eye, title: "Assess", subtitle: "Comprehensive Lipid Panel", description: "Standard lipid profile plus inflammation and metabolic markers." },
    { icon: Wrench, title: "Plan", subtitle: "Personalised Protocol", description: "Evidence-based care plan with dietary, lifestyle, and medication options." },
    { icon: Check, title: "Monitor", subtitle: "Track Progress", description: "Regular biomarker testing to guide treatment adjustments." },
    { icon: RefreshCw, title: "Follow-up", subtitle: "Long-term Management", description: "Ongoing doctor-led review of cardiovascular markers as your situation changes." },
  ];

  const biomarkers = [
    { name: "Measured", markers: ["hs-CRP", "Total cholesterol", "LDL", "HDL", "Triglycerides"], category: "Essential" },
    { name: "Calculated", markers: ["Non-HDL cholesterol", "Cholesterol/HDL ratio"], category: "Same draw" },
    { name: "If risk factors exist", markers: ["Apolipoprotein B", "Lipoprotein (a)"], category: "Doctor-reviewed" },
  ];

  const faqs = [
    { question: "What is dyslipidemia?", answer: "Dyslipidemia refers to abnormal levels of lipids in the blood. According to the Heart Foundation, it's a major risk factor for cardiovascular disease, Australia's leading cause of death." },
    { question: "How does obesity affect cholesterol?", answer: "The AIHW reports two-thirds of Australian adults are overweight or obese. Excess body fat increases LDL cholesterol and triglycerides while lowering HDL. Studies show 5-10% weight loss significantly improves lipid profiles." },
    { question: "Can lifestyle change affect cholesterol?", answer: "The AIHW notes that diet, activity and weight can influence lipid levels, and some people also need medicine, especially those with genetic conditions such as familial hypercholesterolemia. Your Sanative doctor discusses what is clinically appropriate for you. Individual results vary." },
    { question: "What biomarkers do you test?", answer: "The Heart Health Panel on Essential measures high-sensitivity CRP, total cholesterol, LDL, HDL and triglycerides. Non-HDL cholesterol and the cholesterol/HDL ratio are calculated from that same draw. Apolipoprotein B and lipoprotein (a) are not on the routine panel. Your doctor may add them when risk factors exist, such as a strong family history of premature heart disease." },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section className="relative py-12 lg:py-16 bg-gradient-to-br from-rose-50 via-red-50 to-orange-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-rose-100 text-rose-700 rounded-full mb-4">Organ Care</span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-gray-900">
                The Heart Health <span className="text-rose-600 italic">Program</span>
              </h1>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                Evidence-based care for dyslipidemia, high cholesterol, and elevated triglycerides, conditions strongly linked to overweight and obesity.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-stretch">
              {/* Heart Image */}
              <div className="bg-[#f5f0e8] rounded-3xl shadow-xl border border-rose-100/50 overflow-hidden min-h-[580px] flex flex-col">
                <div className="flex-1 flex items-center justify-center p-6 lg:p-8">
                  <Image
                    src="/images/heart-anatomical.webp"
                    alt="Anatomical illustration of the human heart showing arteries and veins"
                    width={500}
                    height={500}
                    className="w-full max-w-[380px] h-auto object-contain drop-shadow-lg"
                    priority
                  />
                </div>
                <div className="p-5 lg:p-6 border-t border-rose-200/50 bg-white/80 backdrop-blur-sm flex-shrink-0">
                  <h2 className="text-lg lg:text-xl font-serif text-gray-900 mb-2">
                    <span className="text-rose-600">Heart risk</span> <span className="italic">can be reviewed before symptoms.</span>
                  </h2>
                  <p className="text-gray-600 text-sm">Research has linked many cardiovascular deaths to factors your doctor can review, lipids, blood pressure, glucose and lifestyle.<sup>1</sup></p>
                </div>
              </div>

              {/* Heart Health Calculator */}
              <div className="bg-white rounded-3xl shadow-xl border border-rose-100 overflow-hidden min-h-[580px] flex flex-col">
                {/* Header */}
                <div className="p-5 lg:p-6 border-b border-rose-100 bg-gradient-to-r from-rose-50 to-orange-50">
                  <p className="text-xs uppercase tracking-widest text-rose-600 font-medium mb-1">
                    Free Risk Assessment
                  </p>
                  <h3 className="text-lg font-serif text-gray-900">
                    Check your heart health in 2 minutes
                  </h3>
                </div>
                {/* Calculator */}
                <div className="flex-1 overflow-hidden">
                  <HeartHealthCalculator />
                </div>
              </div>
            </div>

            {/* Conditions We Treat - Moved below */}
            <div className="mt-10 grid md:grid-cols-3 gap-4">
              {conditions.map((c) => (
                <div key={c.title} className="bg-white rounded-2xl p-5 border border-rose-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0">
                      <c.icon className="w-5 h-5 text-rose-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{c.title}</h4>
                      <p className="text-sm text-gray-600">{c.description}</p>
                      <p className="text-xs text-rose-600 mt-1">{c.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 mt-10">
              <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-rose-500" /><span>AHPRA Doctors</span></div>
              <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-rose-500" /><span>NATA Labs</span></div>
              <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-rose-500" /><span>Evidence-Based</span></div>
            </div>
          </div>
        </section>

        {/* Australian Stats */}
        <section className="py-16 lg:py-20 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-sm uppercase tracking-widest text-rose-400 font-medium mb-3">The Australian Reality</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white">
                Cardiovascular disease. <span className="text-rose-400 italic">Our leading killer.</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {epidemicStats.map((stat) => (
                <div key={stat.label} className="text-center p-8 rounded-3xl bg-white/5 border border-white/10">
                  <p className="text-5xl font-serif text-white mb-3">{stat.value}</p>
                  <p className="text-lg text-white mb-2">{stat.label}</p>
                  <p className="text-sm text-gray-400">{stat.subtext}</p>
                  <p className="text-xs text-rose-400 mt-2 italic">{stat.citation}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Risk Factors */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-rose-100 text-rose-600 rounded-full mb-4">Understanding the connection</span>
                <h2 className="text-3xl sm:text-4xl font-serif text-gray-900 mb-6">
                  The obesity-heart <span className="text-rose-600 italic">connection</span>
                </h2>
                <p className="text-gray-600 mb-6">
                  The Australian Institute of Health and Welfare reports that <strong>two-thirds of Australian adults are overweight or obese</strong>, contributing to the high prevalence of lipid disorders. Studies show even modest weight loss of 5-10% can significantly improve cholesterol and triglyceride levels.
                </p>
                <div className="bg-rose-50 rounded-2xl p-6 border border-rose-100">
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-600" /> Warning signs
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />Often no symptoms</div>
                    <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />Chest pain (angina)</div>
                    <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />Shortness of breath</div>
                    <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" />Fatigue</div>
                  </div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {riskFactors.map((f) => (
                  <div key={f.title} className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-rose-300 transition-all">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center mb-3">
                      <f.icon className="w-5 h-5 text-rose-600" />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{f.title}</h4>
                    <p className="text-sm text-gray-500">{f.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Heart Biomarkers Panel */}
        <section className="py-20 bg-gradient-to-br from-rose-50 to-orange-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-rose-200/50 text-rose-700 rounded-full mb-4">Advanced testing</span>
                <h2 className="text-3xl sm:text-4xl font-serif text-gray-900 mb-6">
                  Beyond standard <span className="text-rose-600 italic">cholesterol tests</span>
                </h2>
                <p className="text-gray-600 mb-4">
                  <strong>Standard lipid panels are the foundation of cardiovascular screening.</strong> We test total cholesterol, LDL, HDL, and triglycerides, the markers most commonly used to guide treatment.
                </p>
                <p className="text-gray-600 mb-6">
                  <strong className="text-rose-600">High-sensitivity CRP</strong> sits on the same Essential request, so your doctor can review low-grade inflammation with the lipid panel. Non-HDL and the cholesterol/HDL ratio are calculated from that draw. ApoB and lipoprotein (a) are added only when risk factors exist.
                </p>
                <div className="bg-white rounded-2xl p-4 text-xs text-gray-600 border border-rose-100">
                  <p className="font-medium mb-2">References:</p>
                  <p className="mb-1"><sup>1</sup> Heart Foundation of Australia, Blood cholesterol guidelines.</p>
                  <p><sup>2</sup> AIHW, Cardiovascular disease in Australia.</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-rose-600 to-red-700 rounded-3xl p-8 text-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif">Heart Health Panel</h3>
                    <p className="text-sm text-white/70">Measured on Essential</p>
                  </div>
                </div>

                <div className="mx-auto w-fit rounded-2xl bg-gradient-to-br from-rose-200 via-rose-400 to-red-600 p-2.5">
                  <BiomarkerHoneycomb
                    includeIds={HEART_PANEL_HONEYCOMB_IDS}
                    highlightAll
                    showCategoryTabs={false}
                    showCalculatedFooter={false}
                    palette="rose"
                    align="center"
                  />
                </div>

                <div className="mt-8 pt-6 border-t border-white/15">
                  <p className="text-sm font-medium text-white mb-1">Measured if risk factors exist</p>
                  <p className="text-xs text-white/70 mb-4">
                    Your doctor may add these when family history or other cardiovascular risk factors warrant them.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {[
                      { short: "ApoB", full: "Apolipoprotein B" },
                      { short: "Lp(a)", full: "Lipoprotein (a)" },
                    ].map((marker) => (
                      <div key={marker.short} className="flex items-center gap-3">
                        <div
                          className="w-12 h-14 flex items-center justify-center text-white text-xs font-medium bg-white/15"
                          style={{
                            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                          }}
                        >
                          {marker.short}
                        </div>
                        <span className="text-sm text-white/90">{marker.full}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link href="/labs#biomarkers" className="mt-8 w-full bg-white text-rose-700 rounded-full py-3 px-6 font-medium flex items-center justify-center gap-2 hover:bg-rose-50 transition-colors">
                  View biomarker panel <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-rose-100 text-rose-600 rounded-full mb-4">Our approach</span>
              <h2 className="text-3xl sm:text-4xl font-serif text-gray-900">
                Assess. Plan. Monitor. <span className="text-rose-600 italic">Optimise.</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {processSteps.map((step, index) => (
                <div key={step.title} className="relative bg-rose-50 rounded-3xl p-6 border border-rose-100 hover:shadow-xl transition-all group">
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-rose-600 text-white text-sm font-bold flex items-center justify-center">{index + 1}</div>
                  <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center mb-5 group-hover:bg-rose-600 transition-colors">
                    <step.icon className="w-7 h-7 text-rose-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-2xl font-serif text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-rose-600 font-medium mb-3">{step.subtitle}</p>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Biomarkers */}
        <section className="py-16 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-serif text-white">We measure. <span className="text-rose-400 italic">We track.</span></h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {biomarkers.map((panel) => (
                <div key={panel.name} className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-white">{panel.name}</h3>
                    <span className="text-xs text-rose-400 bg-white/10 px-2 py-1 rounded-full">{panel.category}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {panel.markers.map((m) => <span key={m} className="text-sm text-gray-300 bg-white/5 px-3 py-1 rounded-full">{m}</span>)}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/labs#biomarkers" className="inline-flex items-center gap-2 text-rose-400 hover:text-white transition-colors">
                View all biomarkers <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        <OrganCareMembershipSection accent="rose" />

        {/* Trust */}
        <section className="py-16 bg-rose-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              {[
                { icon: Stethoscope, title: "AHPRA Registered", desc: "Fully registered doctors" },
                { icon: ShieldCheck, title: "NATA Accredited", desc: "Australian lab testing" },
                { icon: Clock, title: "Ongoing Support", desc: "Regular check-ins" },
                { icon: Users, title: "Measurable Tracking", desc: "Biomarker monitoring" },
              ].map((t) => (
                <div key={t.title} className="text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4">
                    <t.icon className="w-7 h-7 text-rose-600" />
                  </div>
                  <h3 className="font-serif text-gray-900 mb-2">{t.title}</h3>
                  <p className="text-sm text-gray-600">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-rose-100 text-rose-600 rounded-full mb-4">Common questions</span>
              <h2 className="text-3xl font-serif text-gray-900">Frequently asked questions</h2>
            </div>
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
              {faqs.map((faq, index) => (
                <FAQItem key={faq.question} question={faq.question} answer={faq.answer} isOpen={openFAQ === index} onToggle={() => setOpenFAQ(openFAQ === index ? null : index)} />
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-br from-rose-600 to-red-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
              <Heart className="w-4 h-4 text-rose-200" /><span className="text-sm text-white/90">Take the first step</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white mb-6">
              Your heart health is <span className="text-rose-200 italic">measurable</span>
            </h2>
            <p className="text-lg text-rose-100 mb-10 max-w-2xl mx-auto">
              You do not have to wait for symptoms. A doctor-reviewed lipid and metabolic panel can inform the conversation about your cardiovascular risk.
            </p>
            <Link href="/membership/checkout" className="inline-flex items-center justify-center gap-3 text-lg px-12 py-5 bg-white text-rose-700 font-semibold rounded-full hover:bg-rose-50 transition-colors shadow-lg hover:shadow-xl w-full sm:w-auto max-w-md mx-auto">
              Start your membership now <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="py-8 bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs text-gray-500 text-center mb-4">
              <strong className="text-gray-400">Medical Disclaimer:</strong> This information is for educational purposes only. Cardiovascular conditions require proper medical diagnosis. All consultations are by AHPRA-registered practitioners. Results vary and are not guaranteed.
            </p>
            <p className="text-xs text-gray-500 text-center">
              <strong className="text-gray-400">References:</strong> Australian Institute of Health and Welfare (AIHW), Heart Foundation Australia, Cholesterol Treatment Trialists' Collaboration (Lancet 2010), Baigent C et al. (Lancet 2005).
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
