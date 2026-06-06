"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { KidneyHealthCalculator } from "@/components/promo/KidneyHealthCalculator";
import { CKDStageChart } from "@/components/promo/CKDStageChart";
import {
  ArrowRight,
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
  Droplets,
  Zap,
  FlaskConical,
  TrendingUp,
  Beaker,
  FileWarning,
  Sparkles,
  BarChart3,
  Target,
  Gauge,
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
    <div className="border-b border-teal-100">
      <button
        type="button"
        onClick={onToggle}
        className="w-full py-5 flex items-center justify-between text-left"
      >
        <span className="text-lg font-medium text-gray-900 pr-4">{question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-teal-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-teal-500 flex-shrink-0" />
        )}
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[500px] pb-5" : "max-h-0"}`}>
        <p className="text-gray-600 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

// eGFR Gauge Component
function EGFRGauge() {
  return (
    <div className="bg-white rounded-2xl p-6 border border-teal-100 shadow-sm">
      <h4 className="text-sm font-medium text-gray-900 mb-4 text-center">eGFR Stages of Kidney Disease</h4>
      <div className="relative h-8 rounded-full overflow-hidden mb-3">
        <div className="absolute inset-0 flex">
          <div className="w-[12.5%] bg-red-500" title="Stage 5: <15" />
          <div className="w-[12.5%] bg-orange-500" title="Stage 4: 15-29" />
          <div className="w-[25%] bg-amber-400" title="Stage 3: 30-59" />
          <div className="w-[25%] bg-lime-400" title="Stage 2: 60-89" />
          <div className="w-[25%] bg-green-500" title="Stage 1: 90+" />
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>0</span>
        <span>15</span>
        <span>30</span>
        <span>60</span>
        <span>90</span>
        <span>120+</span>
      </div>
      <div className="flex justify-between text-xs text-gray-600 mt-2">
        <span>Kidney Failure</span>
        <span>Early-Stage CKD</span>
        <span>Normal</span>
      </div>
    </div>
  );
}

// Portal Screenshot Slider
function PortalSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    { title: "Kidney Health Dashboard", description: "Track renal biomarkers in real-time", gradient: "from-teal-50 to-cyan-100" },
    { title: "eGFR Tracking", description: "Monitor kidney function over time", gradient: "from-emerald-50 to-green-100" },
    { title: "Personalised Insights", description: "AI-powered analysis of your kidney health trends", gradient: "from-sky-50 to-blue-100" },
    { title: "Care Team Support", description: "Direct messaging with your care partners", gradient: "from-violet-50 to-purple-100" },
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
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                    <Droplets className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{slide.title}</p>
                    <p className="text-xs text-gray-500">{slide.description}</p>
                  </div>
                </div>
                <div className="h-24 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg flex items-end justify-around px-4 pb-2">
                  {[40, 65, 55, 80, 70, 90, 75].map((height, i) => (
                    <div key={i} className="w-4 bg-gradient-to-t from-teal-500 to-cyan-400 rounded-t" style={{ height: `${height}%` }} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 mt-4">
        {slides.map((_, index) => (
          <button key={index} onClick={() => setCurrentSlide(index)} className={`w-2 h-2 rounded-full transition-colors ${currentSlide === index ? "bg-teal-500" : "bg-gray-300"}`} />
        ))}
      </div>
    </div>
  );
}

export default function KidneyHealthPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const epidemicStats = [
    { value: "1.7M", label: "Australians have chronic kidney disease", subtext: "Many don't know they have it", citation: "Kidney Health Australia, 2023" },
    { value: "90%", label: "of kidney function can be lost before symptoms", subtext: "Often called the 'silent disease'", citation: "National Kidney Foundation" },
    { value: "30%", label: "of CKD cases are preventable", subtext: "Through early detection and intervention", citation: "AIHW, 2023" },
  ];

  const conditions = [
    { icon: Droplets, title: "Chronic Kidney Disease", description: "When your kidneys slowly lose their filtering power over time", detail: "Catching it early makes a huge difference" },
    { icon: TrendingUp, title: "Fatty Kidney Disease", description: "Excess fat building up in your kidneys", detail: "Often goes hand-in-hand with weight and metabolic issues" },
    { icon: Zap, title: "Diabetic Kidney Disease", description: "Kidney damage caused by diabetes", detail: "The #1 cause of kidney problems in Australia" },
  ];

  const ckdBiomarkers = [
    {
      name: "Serum Creatinine",
      description: "Waste product from muscle breakdown",
      normal: "Men: 60-110 µmol/L, Women: 45-90 µmol/L",
      significance: "High levels indicate kidneys may have trouble filtering blood"
    },
    {
      name: "eGFR (Estimated Glomerular Filtration Rate)",
      description: "Best estimate of kidney filtering ability",
      normal: "≥90 mL/min/1.73m²",
      significance: "Higher number is better. <60 indicates CKD"
    },
    {
      name: "BUN (Blood Urea Nitrogen)",
      description: "Waste from protein breakdown",
      normal: "2.5-7.1 mmol/L",
      significance: "Combined with creatinine to assess kidney function"
    },
    {
      name: "uACR (Urine Albumin-Creatinine Ratio)",
      description: "Protein in urine test",
      normal: "<30 mg/g",
      significance: "Lower is better. ≥30 may indicate kidney damage"
    },
  ];

  const fattyKidneyBiomarkers = [
    {
      category: "What your blood tells us",
      icon: BarChart3,
      color: "amber",
      markers: [
        { name: "Triglycerides & LDL Cholesterol", description: "When these fats are high in your blood, they're often high in your organs too — including your kidneys" },
        { name: "Fasting Insulin & HbA1c", description: "These show how well your body handles sugar. High levels push fat into places it shouldn't be, like your kidneys" },
        { name: "Adipokines (Leptin/Adiponectin)", description: "These are hormones from your fat cells. An imbalance tells us fat is causing inflammation in your organs" },
      ]
    },
    {
      category: "The liver-kidney connection",
      icon: Target,
      color: "orange",
      markers: [
        { name: "FIB-4 Index", description: "A score that measures liver scarring — and surprisingly, it also predicts kidney problems" },
        { name: "NAFLD Fibrosis Score", description: "Another liver health score. When it's elevated, your kidney risk goes up too" },
        { name: "ALT/AST Ratio", description: "Liver enzymes that help us see the bigger picture of your metabolic health" },
      ]
    }
  ];

  const riskFactors = [
    { icon: Scale, title: "Carrying extra weight", description: "Especially around the middle" },
    { icon: Activity, title: "Type 2 diabetes", description: "The biggest risk factor for kidney disease" },
    { icon: Heart, title: "High blood pressure", description: "Puts extra strain on kidney blood vessels" },
    { icon: Cigarette, title: "Smoking", description: "Slows blood flow to your kidneys" },
    { icon: Moon, title: "Family history", description: "Kidney problems can run in families" },
    { icon: Pill, title: "Regular painkillers", description: "Ibuprofen & similar meds can be hard on kidneys" },
  ];

  const processSteps = [
    { icon: Eye, title: "Test", subtitle: "Get the full picture", description: "We run a complete kidney panel — not just the basics, but the markers that catch problems early." },
    { icon: Wrench, title: "Plan", subtitle: "Your personal roadmap", description: "Based on your results, we create a plan that works for your life — diet, lifestyle, and medical support if needed." },
    { icon: Check, title: "Track", subtitle: "See your progress", description: "Regular testing shows what's working. You'll see your numbers improve over time." },
    { icon: RefreshCw, title: "Protect", subtitle: "Stay on track", description: "Ongoing support to keep your kidneys healthy for the long haul." },
  ];

  const biomarkers = [
    { name: "Kidney Function", markers: ["Creatinine", "eGFR", "BUN", "Cystatin C"], category: "Core" },
    { name: "Protein/Albumin", markers: ["uACR", "Serum Albumin", "Total Protein"], category: "Damage" },
    { name: "Metabolic Panel", markers: ["HbA1c", "Fasting Glucose", "Insulin", "HOMA-IR"], category: "Risk" },
    { name: "Electrolytes", markers: ["Sodium", "Potassium", "Phosphorus", "Calcium"], category: "Balance" },
  ];

  const faqs = [
    {
      question: "What exactly is chronic kidney disease?",
      answer: "Think of your kidneys as filters for your blood. With chronic kidney disease (CKD), these filters slowly become less effective over time. The tricky part? You usually won't feel anything different in the early stages — that's why testing is so important. Doctors classify CKD into 5 stages based on your eGFR score, from mild (Stage 1-2) to severe (Stage 5, which is kidney failure)."
    },
    {
      question: "I've heard of fatty liver, but fatty kidneys?",
      answer: "Yes, it's a real thing! Just like fat can build up in your liver, it can accumulate in your kidneys too. There's no single test that shows 'fatty kidneys,' but we can see the warning signs through blood markers like triglycerides, insulin levels, and HbA1c. Here's the interesting part: fatty kidney and fatty liver almost always happen together — they're both caused by the same metabolic issues, often related to weight."
    },
    {
      question: "How can I find out if my kidneys are okay?",
      answer: "A simple blood test can tell you a lot. The key numbers to look at are your creatinine (a waste product your kidneys filter out), eGFR (how well your kidneys are filtering), and uACR (checks for protein in your urine — a sign of kidney damage). The National Kidney Foundation recommends regular testing because you can lose up to 90% of your kidney function before you feel any symptoms at all."
    },
    {
      question: "Can kidney damage be reversed?",
      answer: "Good news: in many cases, yes — especially if you catch it early. Studies show that controlling your blood pressure, managing blood sugar, and losing weight can slow down or even stop CKD from getting worse. For fatty kidney disease, addressing the underlying metabolic issues (like insulin resistance) can make a real difference. That's exactly what our program is designed to help you do."
    },
    {
      question: "What tests do you include in the kidney panel?",
      answer: "We go beyond the basics. Our panel includes standard kidney markers (creatinine, eGFR, BUN, uACR) plus tests that predict problems before they happen — like metabolic markers (HbA1c, insulin), electrolytes (sodium, potassium, phosphorus, calcium), and inflammation markers (hs-CRP). It's the kind of thorough testing that gives you the full picture."
    },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-white">
        {/* Hero */}
        <section className="relative py-12 lg:py-16 bg-gradient-to-br from-teal-50 via-cyan-50 to-emerald-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-teal-100 text-teal-700 rounded-full mb-4">Metabolic Care</span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-gray-900">
                The Kidney Health <span className="text-teal-600 italic">Program</span>
              </h1>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                Your kidneys work hard every day to keep you healthy. We help you understand how they're doing — and catch problems early, when they're easiest to fix.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-stretch">
              {/* Kidney Image */}
              <div className="bg-gradient-to-br from-[#f0f7f5] to-[#e8f4f1] rounded-3xl shadow-xl border border-teal-100/50 overflow-hidden min-h-[580px] flex flex-col">
                <div className="flex-1 flex items-center justify-center p-6 lg:p-8">
                  <Image
                    src="/images/kidney-health.jpg"
                    alt="Anatomical illustration of healthy kidneys"
                    width={500}
                    height={500}
                    className="w-full max-w-[420px] h-auto object-contain drop-shadow-lg rounded-2xl"
                    priority
                  />
                </div>
                <div className="p-5 lg:p-6 border-t border-teal-200/50 bg-white/80 backdrop-blur-sm flex-shrink-0">
                  <h2 className="text-lg lg:text-xl font-serif text-gray-900 mb-2">
                    <span className="text-teal-600">Did you know?</span> <span className="italic">Your kidneys filter 200 litres of blood every single day.</span>
                  </h2>
                  <p className="text-gray-600 text-sm">Here's the tricky part: you can lose up to 90% of kidney function before you feel any symptoms. That's why testing matters.<sup>1</sup></p>
                </div>
              </div>

              {/* Kidney Health Calculator */}
              <div className="bg-white rounded-3xl shadow-xl border border-teal-100 overflow-hidden min-h-[580px] flex flex-col">
                {/* Header */}
                <div className="p-5 lg:p-6 border-b border-teal-100 bg-gradient-to-r from-teal-50 to-cyan-50">
                  <p className="text-xs uppercase tracking-widest text-teal-600 font-medium mb-1">
                    Free Risk Assessment
                  </p>
                  <h3 className="text-lg font-serif text-gray-900">
                    Check your kidney health risk in 2 minutes
                  </h3>
                </div>
                {/* Calculator */}
                <div className="flex-1 overflow-hidden">
                  <KidneyHealthCalculator />
                </div>
              </div>
            </div>

            {/* Conditions We Treat */}
            <div className="mt-10 grid md:grid-cols-3 gap-4">
              {conditions.map((c) => (
                <div key={c.title} className="bg-white rounded-2xl p-5 border border-teal-100 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <c.icon className="w-5 h-5 text-teal-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{c.title}</h4>
                      <p className="text-sm text-gray-600">{c.description}</p>
                      <p className="text-xs text-teal-600 mt-1">{c.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600 mt-10">
              <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-teal-500" /><span>AHPRA Doctors</span></div>
              <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-teal-500" /><span>NATA Labs</span></div>
              <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-teal-500" /><span>Evidence-Based</span></div>
            </div>
          </div>
        </section>

        {/* Australian Stats */}
        <section className="py-16 lg:py-20 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-sm uppercase tracking-widest text-teal-400 font-medium mb-3">The Australian Reality</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white">
                CKD. <span className="text-teal-400 italic">The silent epidemic.</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {epidemicStats.map((stat) => (
                <div key={stat.label} className="text-center p-8 rounded-3xl bg-white/5 border border-white/10">
                  <p className="text-5xl font-serif text-white mb-3">{stat.value}</p>
                  <p className="text-lg text-white mb-2">{stat.label}</p>
                  <p className="text-sm text-gray-400">{stat.subtext}</p>
                  <p className="text-xs text-teal-400 mt-2 italic">{stat.citation}</p>
                </div>
              ))}
            </div>

            {/* CTA after stats */}
            <div className="mt-12 text-center">
              <p className="text-white/70 mb-4">Don't be part of the statistic. Find out where you stand.</p>
              <Link href="/membership/checkout" className="inline-flex items-center gap-2 px-8 py-4 bg-teal-500 hover:bg-teal-400 text-white font-semibold rounded-full transition-colors">
                Check my kidney health <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* CKD Stage Chart Section */}
        <section className="py-20 bg-gradient-to-br from-teal-50 to-cyan-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <div>
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-teal-100 text-teal-700 rounded-full mb-4">Your key number</span>
                <h2 className="text-3xl sm:text-4xl font-serif text-gray-900 mb-6">
                  What's your <span className="text-teal-600 italic">eGFR score?</span>
                </h2>
                <p className="text-gray-600 mb-6">
                  Your <strong>eGFR</strong> (estimated glomerular filtration rate) is like a report card for your kidneys.
                  It tells you how well they're filtering waste from your blood. <strong>Higher is better</strong> — and knowing your number is the first step to protecting your kidney health.
                </p>
                <div className="bg-white rounded-2xl p-6 border border-teal-100 mb-6">
                  <h3 className="font-medium text-gray-900 mb-4">What the numbers mean:</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm"><strong>90 or above:</strong> Your kidneys are working well</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="text-sm"><strong>60-89:</strong> Mild decrease — worth keeping an eye on</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-orange-500" />
                      <span className="text-sm"><strong>30-59:</strong> Moderate kidney disease — time to take action</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="text-sm"><strong>Below 30:</strong> Severe — you need specialist care</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 italic">
                  Reference: National Kidney Foundation - Understanding Your Lab Values
                </p>

                {/* CTA after eGFR explanation */}
                <div className="mt-8 p-6 bg-teal-600 rounded-2xl text-white">
                  <p className="font-medium mb-3">Want to know your eGFR score?</p>
                  <p className="text-sm text-teal-100 mb-4">Our kidney panel includes eGFR plus 15+ other markers that give you the complete picture.</p>
                  <Link href="/membership/checkout" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-teal-700 font-semibold rounded-full hover:bg-teal-50 transition-colors text-sm">
                    Get my kidney panel report <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              <CKDStageChart />
            </div>
          </div>
        </section>

        {/* Fatty Kidney Disease Section */}
        <section className="py-20 bg-gradient-to-br from-amber-50 to-orange-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-amber-100 text-amber-700 rounded-full mb-4">The weight connection</span>
              <h2 className="text-3xl sm:text-4xl font-serif text-gray-900 mb-4">
                What is <span className="text-amber-600 italic">Fatty Kidney Disease?</span>
              </h2>
              <p className="text-gray-600 max-w-3xl mx-auto">
                You've probably heard of fatty liver — but did you know fat can build up in your kidneys too?
                There's no single test that says "you have fatty kidneys," but we can look at a combination of blood markers that paint a clear picture.
                If you're carrying extra weight and these markers are elevated, there's a strong chance fat is affecting your kidneys.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {fattyKidneyBiomarkers.map((section) => (
                <div key={section.category} className="bg-white rounded-3xl p-6 lg:p-8 border border-amber-200 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className={`w-12 h-12 rounded-2xl bg-${section.color}-100 flex items-center justify-center`}>
                      <section.icon className={`w-6 h-6 text-${section.color}-600`} />
                    </div>
                    <h3 className="text-xl font-serif text-gray-900">{section.category}</h3>
                  </div>
                  <div className="space-y-4">
                    {section.markers.map((marker) => (
                      <div key={marker.name} className="bg-amber-50/50 rounded-xl p-4 border border-amber-100">
                        <h4 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          {marker.name}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1 ml-3.5">{marker.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Connection to Fatty Liver */}
            <div className="mt-10 bg-gradient-to-r from-orange-600 to-amber-600 rounded-3xl p-8 text-white">
              <div className="flex flex-col lg:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
                    <FileWarning className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="flex-1 text-center lg:text-left">
                  <h3 className="text-xl font-serif mb-2">If you have fatty liver, your kidneys might be affected too</h3>
                  <p className="text-amber-100 text-sm">
                    Here's something important: fatty kidneys and fatty liver (MASLD) almost always go together.
                    They share the same underlying cause — metabolic dysfunction. That's why liver health scores like the <strong>FIB-4 Index</strong> can actually help predict kidney problems.
                    If your liver is showing signs of fat buildup, it's a good idea to check on your kidneys too.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Link href="/metabolic-care/fatty-liver" className="inline-flex items-center gap-2 bg-white text-amber-700 px-6 py-3 rounded-full font-medium hover:bg-amber-50 transition-colors">
                    Learn about fatty liver <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Risk Factors */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-teal-100 text-teal-600 rounded-full mb-4">What puts your kidneys at risk?</span>
                <h2 className="text-3xl sm:text-4xl font-serif text-gray-900 mb-6">
                  Your metabolism and your <span className="text-teal-600 italic">kidneys are connected</span>
                </h2>
                <p className="text-gray-600 mb-6">
                  Here's what we know: <strong>diabetes and high blood pressure are the two leading causes of kidney disease</strong>.<sup>2</sup>{" "}
                  And both of these are closely tied to weight and metabolic health. The good news? By looking after your metabolism, you're also protecting your kidneys.
                </p>
                <div className="bg-teal-50 rounded-2xl p-6 border border-teal-100">
                  <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-teal-600" /> Signs to watch for
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">Most people with early kidney disease feel completely fine — that's why it's called the "silent disease." But later on, you might notice:</p>
                  <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-teal-500" />Swollen feet or ankles</div>
                    <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-teal-500" />Feeling tired all the time</div>
                    <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-teal-500" />Peeing more or less than usual</div>
                    <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-teal-500" />Foamy or bubbly urine</div>
                    <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-teal-500" />Feeling short of breath</div>
                    <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-teal-500" />Lost your appetite</div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {riskFactors.map((f) => (
                    <div key={f.title} className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-teal-300 transition-all">
                      <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center mb-3">
                        <f.icon className="w-5 h-5 text-teal-600" />
                      </div>
                      <h4 className="font-medium text-gray-900 mb-1">{f.title}</h4>
                      <p className="text-sm text-gray-500">{f.description}</p>
                    </div>
                  ))}
                </div>

                {/* CTA after risk factors */}
                <div className="bg-gradient-to-r from-teal-600 to-cyan-600 rounded-2xl p-6 text-white text-center">
                  <p className="text-lg font-medium mb-2">Tick any of these boxes?</p>
                  <p className="text-sm text-teal-100 mb-4">Get tested and get your biomarkers report to see what's happening with your kidneys.</p>
                  <Link href="/membership/checkout" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-teal-700 font-semibold rounded-full hover:bg-teal-50 transition-colors">
                    See what my kidneys are doing <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Kidney Biomarkers Panel */}
        <section className="py-20 bg-gradient-to-br from-teal-50 to-cyan-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-teal-200/50 text-teal-700 rounded-full mb-4">More than basic tests</span>
                <h2 className="text-3xl sm:text-4xl font-serif text-gray-900 mb-6">
                  We test what <span className="text-teal-600 italic">others miss</span>
                </h2>
                <p className="text-gray-600 mb-4">
                  A standard kidney test might check your creatinine and call it a day. But that's not enough to catch problems early.
                  We look at the full picture — including markers that show metabolic stress on your kidneys <em>before</em> damage happens.
                </p>
                <p className="text-gray-600 mb-6">
                  For example, <strong className="text-teal-600">Cystatin C</strong> is a newer kidney marker that's often more accurate than creatinine —
                  especially for people with different muscle mass or certain health conditions. It's one of many markers we include that most basic tests leave out.
                </p>
                <div className="bg-white rounded-2xl p-4 text-xs text-gray-600 border border-teal-100">
                  <p className="font-medium mb-2">References:</p>
                  <p className="mb-1"><sup>1</sup> National Kidney Foundation. Understanding Your Lab Values.</p>
                  <p className="mb-1"><sup>2</sup> Kidney Health Australia. CKD Management Guidelines 2023.</p>
                  <p><sup>3</sup> AIHW. Chronic Kidney Disease in Australia 2023.</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-teal-600 to-cyan-700 rounded-3xl p-8 text-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Droplets className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif">What we test</h3>
                    <p className="text-sm text-white/70">Our comprehensive kidney panel includes:</p>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  {[
                    "Kidney function tests (Creatinine, eGFR, BUN, Cystatin C)",
                    "Kidney damage markers (uACR, Serum Albumin)",
                    "Metabolic health (HbA1c, Insulin, HOMA-IR)",
                    "Electrolytes (Sodium, Potassium, Phosphorus, Calcium)",
                    "Inflammation (hs-CRP)"
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-teal-200 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link href="#membership" className="mt-6 w-full bg-white text-teal-700 rounded-full py-3 px-6 font-medium flex items-center justify-center gap-2 hover:bg-teal-50 transition-colors">
                  Join our membership and get your biomarkers report <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-teal-100 text-teal-600 rounded-full mb-4">How it works</span>
              <h2 className="text-3xl sm:text-4xl font-serif text-gray-900">
                Four steps to <span className="text-teal-600 italic">healthier kidneys</span>
              </h2>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {processSteps.map((step, index) => (
                <div key={step.title} className="relative bg-teal-50 rounded-3xl p-6 border border-teal-100 hover:shadow-xl transition-all group">
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-teal-600 text-white text-sm font-bold flex items-center justify-center">{index + 1}</div>
                  <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center mb-5 group-hover:bg-teal-600 transition-colors">
                    <step.icon className="w-7 h-7 text-teal-600 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="text-2xl font-serif text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-teal-600 font-medium mb-3">{step.subtitle}</p>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              ))}
            </div>

            {/* CTA after process steps */}
            <div className="mt-12 text-center">
              <Link href="/membership/checkout" className="inline-flex items-center gap-2 px-8 py-4 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-full transition-colors text-lg">
                Check my kidney health <ArrowRight className="w-5 h-5" />
              </Link>
              <p className="text-sm text-gray-500 mt-3">Takes 2 minutes to get started</p>
            </div>
          </div>
        </section>

        {/* Biomarkers */}
        <section className="py-16 bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-serif text-white">The tests that <span className="text-teal-400 italic">tell the whole story</span></h2>
            </div>
            <div className="grid md:grid-cols-4 gap-6">
              {biomarkers.map((panel) => (
                <div key={panel.name} className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-white">{panel.name}</h3>
                    <span className="text-xs text-teal-400 bg-white/10 px-2 py-1 rounded-full">{panel.category}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {panel.markers.map((m) => <span key={m} className="text-sm text-gray-300 bg-white/5 px-3 py-1 rounded-full">{m}</span>)}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link href="/labs?category=kidney#biomarkers" className="inline-flex items-center gap-2 text-teal-400 hover:text-white transition-colors">
                View all kidney biomarkers <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Membership Panel with Slider */}
        <section id="membership" className="py-20 bg-gradient-to-br from-gray-50 to-teal-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <PortalSlider />
              <div>
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-teal-100 text-teal-600 rounded-full mb-4">Ready to get started?</span>
                <h2 className="text-3xl sm:text-4xl font-serif text-gray-900 mb-6">
                  Everything you need, <span className="text-teal-600 italic">one membership</span>
                </h2>
                <p className="text-gray-600 mb-6">Get your <strong>full 80+ biomarker panel</strong> — including all the kidney health markers we talked about — plus ongoing support from our care team.</p>
                <ul className="space-y-3 mb-8">
                  {["See all your results in one easy dashboard", "Upload past labs or connect your devices", "Get a personalised health plan", "Message our care team anytime", "Member pricing on extra tests", "Prescriptions if you need them"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-gray-700">
                      <CheckCircle className="w-5 h-5 text-teal-500 flex-shrink-0" /><span>{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-baseline gap-2 mb-6">
                  <span className="text-5xl font-serif text-gray-900">$199</span>
                  <span className="text-gray-500">/year</span>
                </div>
                <Link href="/membership/checkout" className="block w-full py-4 bg-gray-900 hover:bg-black text-white font-semibold rounded-xl text-center transition-colors">Start your membership now</Link>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-teal-500" />
                    <span>Cancel anytime</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-teal-500" />
                    <span>Results in a week</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-teal-500" />
                    <span>NATA-accredited labs</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3 text-center">The sooner you test, the more you can do to protect your kidneys.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Trust */}
        <section className="py-16 bg-teal-100">
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
                    <t.icon className="w-7 h-7 text-teal-600" />
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
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-teal-100 text-teal-600 rounded-full mb-4">Common questions</span>
              <h2 className="text-3xl font-serif text-gray-900">Frequently asked questions</h2>
            </div>
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-200">
              {faqs.map((faq, index) => (
                <FAQItem key={faq.question} question={faq.question} answer={faq.answer} isOpen={openFAQ === index} onToggle={() => setOpenFAQ(openFAQ === index ? null : index)} />
              ))}
            </div>

            {/* CTA after FAQs */}
            <div className="mt-10 text-center">
              <p className="text-gray-600 mb-4">Still have questions? Our care team is here to help.</p>
              <Link href="/membership/checkout" className="inline-flex items-center gap-2 px-8 py-4 bg-gray-900 hover:bg-black text-white font-semibold rounded-full transition-colors">
                Get my kidney panel report <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-br from-teal-600 to-cyan-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
              <Droplets className="w-4 h-4 text-teal-200" /><span className="text-sm text-white/90">Your kidneys are worth protecting</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white mb-6">
              Know your numbers. <span className="text-teal-200 italic">Take control.</span>
            </h2>
            <p className="text-lg text-teal-100 mb-10 max-w-2xl mx-auto">
              You can't feel kidney problems early on — but a blood test can catch them. The earlier you know, the more you can do about it.
              Don't wait until symptoms appear.
            </p>
            <Link href="/membership/checkout" className="inline-flex items-center justify-center gap-3 text-lg px-12 py-5 bg-white text-teal-700 font-semibold rounded-full hover:bg-teal-50 transition-colors shadow-lg hover:shadow-xl w-full sm:w-auto max-w-md mx-auto">
              Start your membership now <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="py-8 bg-gray-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs text-gray-500 text-center mb-4">
              <strong className="text-gray-400">Medical Disclaimer:</strong> This information is for educational purposes only. Kidney conditions require proper medical diagnosis. All consultations are by AHPRA-registered practitioners. Results vary and are not guaranteed.
            </p>
            <p className="text-xs text-gray-500 text-center">
              <strong className="text-gray-400">References:</strong> <sup>1</sup>National Kidney Foundation. Understanding Your Lab Values. <sup>2</sup>CDC. Chronic Kidney Disease Basics (2024): "Diabetes and hypertension are the leading causes of CKD in adults." <sup>3</sup>Kidney Health Australia. CKD Management Guidelines 2023. <sup>4</sup>AIHW. Chronic Kidney Disease in Australia 2023.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
