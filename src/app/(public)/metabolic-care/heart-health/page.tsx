"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { HeartHealthCalculator } from "@/components/promo/HeartHealthCalculator";
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

// Portal Screenshot Slider
function PortalSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    { title: "Heart Health Dashboard", description: "Track cardiovascular biomarkers in real-time", gradient: "from-rose-50 to-red-100" },
    { title: "Lipid Profile Tracking", description: "Monitor cholesterol and triglycerides over time", gradient: "from-amber-50 to-orange-100" },
    { title: "Personalised Insights", description: "AI-powered analysis of your heart health trends", gradient: "from-emerald-50 to-teal-100" },
    { title: "Care Team Support", description: "Direct messaging with your care partners", gradient: "from-blue-50 to-indigo-100" },
  ];

  useEffect(() => {
    const interval = setInterval(() => setCurrentSlide((prev) => (prev + 1) % slides.length), 4000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl">
        <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {slides.map((slide, index) => (
            <div key={index} className={`w-full flex-shrink-0 bg-gradient-to-br ${slide.gradient} p-8 min-h-[320px] flex flex-col justify-center`}>
              <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{slide.title}</p>
                    <p className="text-xs text-gray-500">{slide.description}</p>
                  </div>
                </div>
                <div className="h-24 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg flex items-end justify-around px-4 pb-2">
                  {[40, 65, 55, 80, 70, 90, 75].map((height, i) => (
                    <div key={i} className="w-4 bg-gradient-to-t from-rose-500 to-red-400 rounded-t" style={{ height: `${height}%` }} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 mt-4">
        {slides.map((_, index) => (
          <button key={index} onClick={() => setCurrentSlide(index)} className={`w-2 h-2 rounded-full transition-colors ${currentSlide === index ? "bg-rose-500" : "bg-gray-300"}`} />
        ))}
      </div>
    </div>
  );
}

export default function HeartHealthPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const epidemicStats = [
    { value: "1.2M", label: "Australians living with heart disease", subtext: "Leading cause of death in Australia", citation: "AIHW, 2023" },
    { value: "~6M", label: "Australians have high cholesterol", subtext: "One in three adults over 18", citation: "Heart Foundation, 2023" },
    { value: "64%", label: "of cardiovascular disease is preventable", subtext: "Through lifestyle and medical intervention", citation: "Lancet Global Health, 2019" },
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
    { icon: Eye, title: "Assess", subtitle: "Comprehensive Lipid Panel", description: "Advanced markers including ApoB, Lp(a), and particle size analysis." },
    { icon: Wrench, title: "Plan", subtitle: "Personalised Protocol", description: "Evidence-based care plan with dietary, lifestyle, and medication options." },
    { icon: Check, title: "Monitor", subtitle: "Track Progress", description: "Regular biomarker testing to guide treatment adjustments." },
    { icon: RefreshCw, title: "Optimise", subtitle: "Long-term Management", description: "Ongoing support to maintain optimal cardiovascular markers." },
  ];

  const biomarkers = [
    { name: "Lipid Panel", markers: ["Total Cholesterol", "LDL-C", "HDL-C", "Triglycerides"], category: "Core" },
    { name: "Advanced Lipids", markers: ["ApoB", "Lp(a)", "LDL Particle Size"], category: "Advanced" },
    { name: "Inflammation", markers: ["hs-CRP", "Homocysteine", "Fibrinogen"], category: "Risk" },
  ];

  const faqs = [
    { question: "What is dyslipidemia?", answer: "Dyslipidemia refers to abnormal levels of lipids in the blood. According to the Heart Foundation, it's a major risk factor for cardiovascular disease — Australia's leading cause of death." },
    { question: "How does obesity affect cholesterol?", answer: "The AIHW reports two-thirds of Australian adults are overweight or obese. Excess body fat increases LDL cholesterol and triglycerides while lowering HDL. Studies show 5-10% weight loss significantly improves lipid profiles." },
    { question: "Can high cholesterol be reversed?", answer: "In many cases, yes. Lifestyle modifications can reduce LDL by 10-15% (AIHW). However, some individuals need medication, especially those with genetic conditions like familial hypercholesterolemia." },
    { question: "What biomarkers do you test?", answer: "Our comprehensive panel includes Total Cholesterol, LDL, HDL, Triglycerides, plus advanced markers: ApoB (better CVD predictor than LDL), Lp(a) (genetic risk), hs-CRP (inflammation), and HbA1c (metabolic health)." },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section className="relative py-12 lg:py-16 bg-gradient-to-br from-rose-50 via-red-50 to-orange-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-rose-100 text-rose-700 rounded-full mb-4">Metabolic Care</span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-gray-900">
                The Heart Health <span className="text-rose-600 italic">Program</span>
              </h1>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                Evidence-based care for dyslipidemia, high cholesterol, and elevated triglycerides — conditions strongly linked to overweight and obesity.
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
                    <span className="text-rose-600">Heart disease</span> <span className="italic">is largely preventable.</span>
                  </h2>
                  <p className="text-gray-600 text-sm">Up to 64% of cardiovascular disease could be prevented through lifestyle and medical management.<sup>1</sup></p>
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
                  <strong>Standard lipid panels miss crucial information.</strong> Research shows ApoB is a better predictor of cardiovascular risk than LDL alone, yet most tests don't include it.
                </p>
                <p className="text-gray-600 mb-6">
                  <strong className="text-rose-600">Lp(a) is a genetic risk factor</strong> affecting ~20% of the population but rarely tested. Elevated Lp(a) increases heart attack risk independent of other factors.
                </p>
                <div className="bg-white rounded-2xl p-4 text-xs text-gray-600 border border-rose-100">
                  <p className="font-medium mb-2">References:</p>
                  <p className="mb-1"><sup>1</sup> Sniderman AD, et al. JAMA Cardiol. 2019;4(12):1287-1295.</p>
                  <p><sup>2</sup> Tsimikas S, et al. JACC 2018;72(14):1670-1680.</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-rose-600 to-red-700 rounded-3xl p-8 text-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif">Heart Health Panel</h3>
                    <p className="text-sm text-white/70">Comprehensive cardiac assessment</p>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  {["Complete lipid panel (Total, LDL, HDL, Triglycerides)", "ApoB & Lp(a) — advanced cardiovascular markers", "hs-CRP & homocysteine (inflammation)", "HbA1c & fasting glucose (metabolic)"].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-rose-200 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/labs#biomarkers" className="mt-6 w-full bg-white text-rose-700 rounded-full py-3 px-6 font-medium flex items-center justify-center gap-2 hover:bg-rose-50 transition-colors">
                  View heart biomarkers <ArrowRight className="w-4 h-4" />
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

        {/* Membership Panel with Slider */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-rose-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <PortalSlider />
              <div>
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-rose-100 text-rose-600 rounded-full mb-4">Start today</span>
                <h2 className="text-3xl sm:text-4xl font-serif text-gray-900 mb-6">
                  Your membership <span className="text-rose-600 italic">starts here</span>
                </h2>
                <p className="text-gray-600 mb-6"><strong>Annual 80+ biomarker panel</strong> including comprehensive heart health markers.</p>
                <ul className="space-y-3 mb-8">
                  {["Data dashboard and health tracking", "Upload past labs and connect wearables", "Personalised health protocol", "24/7 care team support", "Member pricing on add-on tests", "Prescription access if appropriate"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-gray-700">
                      <CheckCircle className="w-5 h-5 text-rose-500 flex-shrink-0" /><span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-5xl font-serif text-gray-900">$199</span>
                  <span className="text-gray-500">/year*</span>
                </div>
                <Link href="/membership/checkout" className="block w-full py-4 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl text-center transition-colors">Start your membership now</Link>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-rose-500" />
                    <span>Cancel anytime</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-rose-500" />
                    <span>Results in a week</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-rose-500" />
                    <span>NATA-accredited labs</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3 text-center">Don't wait. Start testing now and take control of your heart health.</p>
              </div>
            </div>
          </div>
        </section>

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
              Don't wait for symptoms. Early detection of lipid disorders can significantly reduce your cardiovascular risk.
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
