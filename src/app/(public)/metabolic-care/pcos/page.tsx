"use client";

import { useState } from "react";
import Link from "next/link";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
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
  Sparkles,
  Target,
  Gauge,
  CircleDot,
  Leaf,
  Brain,
  Dumbbell,
  Baby,
} from "lucide-react";

// Ovary/PCOS Icon Component
function PCOSIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="8" cy="12" rx="4" ry="5" />
      <ellipse cx="16" cy="12" rx="4" ry="5" />
      <circle cx="7" cy="10" r="1" fill="currentColor" />
      <circle cx="9" cy="13" r="1" fill="currentColor" />
      <circle cx="6" cy="14" r="0.8" fill="currentColor" />
      <circle cx="17" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="13" r="1" fill="currentColor" />
      <circle cx="18" cy="14" r="0.8" fill="currentColor" />
      <path d="M12 7V4M12 20v-3" />
    </svg>
  );
}

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

// PCOS Risk Quiz Component
function PCOSRiskQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);

  const questions = [
    {
      question: "How would you describe your menstrual cycles?",
      options: [
        { label: "Regular (every 21-35 days)", score: 0 },
        { label: "Slightly irregular (sometimes skip a month)", score: 1 },
        { label: "Very irregular (often miss periods)", score: 2 },
        { label: "Absent for 3+ months at a time", score: 3 },
      ],
    },
    {
      question: "Do you experience excess hair growth on face, chest, or back?",
      options: [
        { label: "No excess hair growth", score: 0 },
        { label: "Mild - some noticeable hair", score: 1 },
        { label: "Moderate - regular removal needed", score: 2 },
        { label: "Significant - daily concern", score: 3 },
      ],
    },
    {
      question: "How would you describe your skin?",
      options: [
        { label: "Clear, no issues", score: 0 },
        { label: "Occasional breakouts", score: 1 },
        { label: "Persistent acne, especially on jawline", score: 2 },
        { label: "Severe acne and/or dark patches", score: 3 },
      ],
    },
    {
      question: "Have you experienced unexplained weight gain, especially around your midsection?",
      options: [
        { label: "No weight concerns", score: 0 },
        { label: "Slight weight gain", score: 1 },
        { label: "Significant weight gain, hard to lose", score: 2 },
        { label: "Substantial weight gain despite efforts", score: 3 },
      ],
    },
    {
      question: "Do you experience fatigue or energy crashes?",
      options: [
        { label: "Rarely - good energy levels", score: 0 },
        { label: "Sometimes - occasional tiredness", score: 1 },
        { label: "Often - frequent energy dips", score: 2 },
        { label: "Constantly - chronic fatigue", score: 3 },
      ],
    },
    {
      question: "Do you have a family history of PCOS, diabetes, or insulin resistance?",
      options: [
        { label: "No family history", score: 0 },
        { label: "Distant relatives", score: 1 },
        { label: "Parent or sibling with diabetes", score: 2 },
        { label: "Parent or sibling with PCOS", score: 3 },
      ],
    },
  ];

  const handleAnswer = (optionIndex: number) => {
    setAnswers({ ...answers, [currentStep]: questions[currentStep].options[optionIndex].label });

    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowResult(true);
    }
  };

  const calculateScore = () => {
    let totalScore = 0;
    Object.keys(answers).forEach((key) => {
      const questionIndex = parseInt(key);
      const question = questions[questionIndex];
      const selectedOption = question.options.find(opt => opt.label === answers[questionIndex]);
      if (selectedOption) {
        totalScore += selectedOption.score;
      }
    });
    return totalScore;
  };

  const getRiskLevel = () => {
    const score = calculateScore();
    if (score <= 4) return { level: "Low", color: "text-green-600", bg: "bg-green-50", border: "border-green-200" };
    if (score <= 9) return { level: "Moderate", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200" };
    return { level: "High", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200" };
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResult(false);
  };

  if (showResult) {
    const risk = getRiskLevel();
    const score = calculateScore();

    return (
      <div className="bg-white rounded-2xl p-8 border border-rose-100 shadow-lg">
        <div className="text-center mb-8">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${risk.bg} ${risk.border} border mb-4`}>
            <span className={`text-sm font-semibold ${risk.color}`}>
              {risk.level} Risk Indication
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Your PCOS Risk Assessment</h3>
          <p className="text-gray-600">Score: {score} out of 18</p>
        </div>

        <div className={`p-6 rounded-xl ${risk.bg} ${risk.border} border mb-6`}>
          <p className="text-gray-700 mb-4">
            {score <= 4 && "Based on your responses, you show few common indicators associated with PCOS. However, if you have concerns about your hormonal health, consider discussing them with a healthcare provider."}
            {score > 4 && score <= 9 && "Your responses suggest some indicators that may be associated with PCOS or metabolic dysfunction. Blood testing can provide valuable insights into your hormonal and metabolic health."}
            {score > 9 && "Your responses indicate several factors commonly associated with PCOS. We strongly recommend comprehensive blood testing to assess your hormonal and metabolic markers."}
          </p>
        </div>

        <div className="bg-gradient-to-r from-rose-50 to-purple-50 rounded-xl p-6 mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Recommended Testing for PCOS</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Zap className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Metabolic Health Panel</p>
                <p className="text-sm text-gray-600">HbA1c, Glucose, Insulin, HOMA-IR</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Brain className="w-5 h-5 text-pink-500" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Hormone Balance Panel</p>
                <p className="text-sm text-gray-600">Testosterone, DHEA, Estrogen, Cortisol</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/labs"
            className="flex-1 px-6 py-4 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors text-center flex items-center justify-center gap-2"
          >
            Get Your Biomarkers Tested
            <ArrowRight className="w-5 h-5" />
          </Link>
          <button
            onClick={resetQuiz}
            className="px-6 py-4 border border-gray-200 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            Retake Quiz
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-4 text-center">
          This quiz is for educational purposes only and is not a diagnostic tool. Please consult with a healthcare provider for proper evaluation.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-8 border border-rose-100 shadow-lg">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-500">
            Question {currentStep + 1} of {questions.length}
          </span>
          <div className="flex gap-1">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`w-8 h-1.5 rounded-full transition-colors ${
                  i <= currentStep ? "bg-rose-500" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
        <h3 className="text-xl font-bold text-gray-900">
          {questions[currentStep].question}
        </h3>
      </div>

      <div className="space-y-3">
        {questions[currentStep].options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleAnswer(index)}
            className="w-full p-4 text-left border border-gray-200 rounded-xl hover:border-rose-300 hover:bg-rose-50 transition-all group"
          >
            <span className="text-gray-700 group-hover:text-gray-900">
              {option.label}
            </span>
          </button>
        ))}
      </div>

      {currentStep > 0 && (
        <button
          onClick={() => setCurrentStep(currentStep - 1)}
          className="mt-4 text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to previous question
        </button>
      )}
    </div>
  );
}

export default function PCOSPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const epidemicStats = [
    {
      value: "1 in 10",
      label: "Australian women affected by PCOS",
      subtext: "One of the most common hormonal conditions",
      citation: "Jean Hailes for Women's Health, 2023",
    },
    {
      value: "~70%",
      label: "of PCOS cases involve insulin resistance",
      subtext: "Metabolic dysfunction is at the core",
      citation: "Diabetes Care, 2019;42(7):1341-1348",
    },
    {
      value: "~50%",
      label: "remain undiagnosed for years",
      subtext: "Symptoms often dismissed or overlooked",
      citation: "Hum Reprod Update. 2020;26(1):1-15",
    },
  ];

  const riskFactors = [
    { icon: Scale, title: "Weight gain", description: "Especially around the abdomen" },
    { icon: Activity, title: "Insulin resistance", description: "Difficulty regulating blood sugar" },
    { icon: Baby, title: "Irregular periods", description: "Or absent menstrual cycles" },
    { icon: Droplets, title: "Hormonal imbalance", description: "Elevated androgens (male hormones)" },
    { icon: Moon, title: "Sleep issues", description: "Insomnia or sleep apnea" },
    { icon: Heart, title: "Family history", description: "Diabetes, PCOS, or metabolic syndrome" },
  ];

  const symptoms = [
    "Irregular or absent periods",
    "Weight gain, particularly around the waist",
    "Excess facial or body hair (hirsutism)",
    "Acne and oily skin",
    "Thinning hair on the scalp",
    "Difficulty getting pregnant",
    "Fatigue and low energy",
    "Mood changes and anxiety",
  ];

  const processSteps = [
    {
      icon: Eye,
      title: "Test",
      subtitle: "Comprehensive Assessment",
      description: "We assess PCOS through blood testing — including hormonal markers (testosterone, DHEA, LH, FSH) and metabolic markers (insulin, glucose, HbA1c, HOMA-IR) to understand your unique profile.",
    },
    {
      icon: Wrench,
      title: "Understand",
      subtitle: "Personalised Insights",
      description: "Our doctors review your results and help you understand the interplay between your hormones and metabolism. This forms the foundation for an effective management plan.",
    },
    {
      icon: Check,
      title: "Support",
      subtitle: "Evidence-Based Care",
      description: "Based on your biomarkers, receive guidance on lifestyle modifications, nutrition strategies, and when appropriate, medications that address insulin resistance and hormonal imbalances.",
    },
    {
      icon: RefreshCw,
      title: "Monitor",
      subtitle: "Track Progress",
      description: "Regular retesting helps track how your markers respond to treatment. Objective measurements guide adjustments to optimise your outcomes over time.",
    },
  ];

  const biomarkers = [
    { name: "Fasting Insulin", description: "Key marker for insulin resistance in PCOS" },
    { name: "HOMA-IR", description: "Calculated index of insulin resistance" },
    { name: "HbA1c", description: "Long-term blood sugar control" },
    { name: "Fasting Glucose", description: "Blood sugar after fasting" },
    { name: "Free Testosterone", description: "Often elevated in PCOS" },
    { name: "DHEA-S", description: "Adrenal androgen marker" },
    { name: "LH/FSH Ratio", description: "Hormonal balance indicator" },
    { name: "SHBG", description: "Sex hormone binding globulin" },
  ];

  const nutritionTips = [
    {
      icon: Leaf,
      title: "Focus on Low-GI Foods",
      description: "Choose complex carbohydrates that don't spike blood sugar — whole grains, legumes, and vegetables.",
    },
    {
      icon: Dumbbell,
      title: "Balance with Protein",
      description: "Include lean protein with each meal to help stabilise blood sugar and reduce insulin spikes.",
    },
    {
      icon: Utensils,
      title: "Anti-Inflammatory Diet",
      description: "Reduce processed foods and increase omega-3 rich foods, fruits, and vegetables.",
    },
    {
      icon: Moon,
      title: "Regular Meal Timing",
      description: "Consistent eating patterns help regulate insulin and support metabolic health.",
    },
  ];

  const faqs = [
    {
      question: "What is PCOS and why is it related to metabolic health?",
      answer: "Polycystic ovary syndrome (PCOS) is a hormonal condition affecting up to 1 in 10 women. While it's known for reproductive symptoms, at its core is often insulin resistance — where cells don't respond properly to insulin. This causes the body to produce more insulin, which can stimulate the ovaries to produce excess androgens (male hormones), leading to the characteristic symptoms of PCOS. By addressing insulin resistance through diet, exercise, and when appropriate, medications, many PCOS symptoms can be significantly improved.",
    },
    {
      question: "What biomarkers should I test for PCOS?",
      answer: "A comprehensive PCOS assessment includes both hormonal and metabolic markers. Hormonal markers include testosterone (free and total), DHEA-S, LH, FSH, and SHBG. Metabolic markers include fasting insulin, fasting glucose, HbA1c, and calculated HOMA-IR (insulin resistance index). Additionally, thyroid function (TSH, Free T4) should be checked as thyroid issues can mimic PCOS symptoms. Our PCOS panel includes all these essential markers.",
    },
    {
      question: "Can diet really help manage PCOS?",
      answer: "Yes, research strongly supports dietary interventions for PCOS management. A diet focused on regulating blood sugar and insulin levels — low glycemic index foods, adequate protein, healthy fats, and high fiber — can significantly improve PCOS symptoms. Studies show that even modest weight loss (5-10%) can restore menstrual regularity and improve fertility in many women with PCOS. Key nutrients like inositol, chromium, and omega-3s have also shown benefits.",
    },
    {
      question: "How often should I retest my biomarkers?",
      answer: "For women actively managing PCOS, we typically recommend retesting every 3-6 months to track progress. This allows enough time for lifestyle changes or treatments to show measurable effects in your blood markers. Once your markers have stabilised in healthy ranges, annual testing may be sufficient. Your doctor can advise on the optimal testing frequency based on your individual situation.",
    },
    {
      question: "Is PCOS curable?",
      answer: "While PCOS cannot be 'cured' in the traditional sense, it can be very effectively managed. Many women with PCOS achieve regular cycles, healthy weight, clear skin, and successful pregnancies through appropriate management. The key is addressing the underlying metabolic dysfunction through lifestyle modifications and, when needed, medical treatment. With proper care, most PCOS symptoms can be significantly reduced or resolved.",
    },
    {
      question: "What services does Sanative provide for PCOS?",
      answer: "Sanative provides comprehensive PCOS assessment through blood testing. Our biomarker panels include both hormonal and metabolic markers essential for understanding PCOS. Results are reviewed by AHPRA-registered doctors who can provide personalised insights and guidance. If your results indicate PCOS or metabolic dysfunction, appropriate referrals or treatment recommendations can be coordinated through our telehealth services.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-rose-50/30">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-rose-100/50 via-transparent to-purple-100/30" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100 rounded-full">
                <Droplets className="w-4 h-4 text-rose-600" />
                <span className="text-sm font-medium text-rose-800">Women's Metabolic Health</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                PCOS & <span className="text-rose-600">Metabolic Health</span>
              </h1>

              <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                Polycystic ovary syndrome has deep metabolic roots. Understanding and addressing insulin resistance is key to managing PCOS symptoms and improving quality of life.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="#quiz"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/25"
                >
                  Take the PCOS Risk Quiz
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/labs"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold border-2 border-gray-200 hover:border-rose-300 transition-all"
                >
                  <FlaskConical className="w-5 h-5" />
                  Get Tested Now
                </Link>
              </div>
            </div>

            {/* Hero Image/Illustration */}
            <div className="relative">
              <div className="bg-gradient-to-br from-rose-100 to-purple-100 rounded-3xl p-8 shadow-2xl">
                <div className="grid grid-cols-2 gap-4">
                  {/* Hormone Card */}
                  <div className="bg-white rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-pink-100 rounded-lg">
                        <Brain className="w-5 h-5 text-pink-600" />
                      </div>
                      <span className="font-semibold text-gray-900">Hormones</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Testosterone</span>
                        <span className="text-rose-600 font-medium">High</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">LH/FSH</span>
                        <span className="text-amber-600 font-medium">Elevated</span>
                      </div>
                    </div>
                  </div>

                  {/* Metabolic Card */}
                  <div className="bg-white rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Zap className="w-5 h-5 text-orange-600" />
                      </div>
                      <span className="font-semibold text-gray-900">Metabolic</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Insulin</span>
                        <span className="text-rose-600 font-medium">High</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">HOMA-IR</span>
                        <span className="text-amber-600 font-medium">&gt;2.5</span>
                      </div>
                    </div>
                  </div>

                  {/* Connection Visual */}
                  <div className="col-span-2 bg-white rounded-2xl p-5 shadow-lg">
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-center">
                        <div className="p-3 bg-rose-100 rounded-full inline-block mb-2">
                          <PCOSIcon className="w-8 h-8 text-rose-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">PCOS</p>
                      </div>
                      <div className="flex-1 h-1 bg-gradient-to-r from-rose-200 via-purple-200 to-orange-200 rounded-full relative">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <RefreshCw className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="p-3 bg-orange-100 rounded-full inline-block mb-2">
                          <Activity className="w-8 h-8 text-orange-600" />
                        </div>
                        <p className="text-sm font-medium text-gray-900">Metabolism</p>
                      </div>
                    </div>
                    <p className="text-center text-sm text-gray-500 mt-3">
                      The hormonal-metabolic connection
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              PCOS: A Common Yet Underdiagnosed Condition
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Many women live with PCOS symptoms for years before receiving a proper diagnosis
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {epidemicStats.map((stat, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-rose-50 to-purple-50 rounded-2xl p-8 border border-rose-100"
              >
                <p className="text-5xl font-bold text-rose-600 mb-3">{stat.value}</p>
                <p className="text-lg font-semibold text-gray-900 mb-2">{stat.label}</p>
                <p className="text-sm text-gray-600 mb-3">{stat.subtext}</p>
                <p className="text-xs text-gray-400 italic">{stat.citation}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quiz Section */}
      <section id="quiz" className="py-20 bg-gradient-to-b from-white to-rose-50/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100 rounded-full mb-4">
              <Target className="w-4 h-4 text-rose-600" />
              <span className="text-sm font-medium text-rose-800">Quick Assessment</span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              PCOS Risk Assessment Quiz
            </h2>
            <p className="text-lg text-gray-600">
              Answer a few questions to understand your potential PCOS risk factors
            </p>
          </div>

          <PCOSRiskQuiz />
        </div>
      </section>

      {/* Risk Factors & Symptoms */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Risk Factors */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
                Risk Factors
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {riskFactors.map((factor, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-100"
                  >
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <factor.icon className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{factor.title}</p>
                      <p className="text-sm text-gray-600">{factor.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Symptoms */}
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Stethoscope className="w-6 h-6 text-rose-500" />
                Common Symptoms
              </h3>
              <div className="bg-rose-50 rounded-2xl p-6 border border-rose-100">
                <ul className="space-y-3">
                  {symptoms.map((symptom, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-rose-500" />
                      <span className="text-gray-700">{symptom}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-6 p-4 bg-white rounded-xl">
                  <p className="text-sm text-gray-600">
                    <strong className="text-gray-900">Note:</strong> Not everyone with PCOS experiences all symptoms.
                    Some women have mild symptoms while others have more severe presentations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Metabolic Connection */}
      <section className="py-20 bg-gradient-to-b from-rose-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Understanding the Metabolic Connection
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Insulin resistance is at the heart of most PCOS cases. When cells don't respond properly to insulin,
              the body produces more — triggering a cascade of hormonal imbalances.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-rose-100">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Utensils className="w-8 h-8 text-orange-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Blood Sugar Spikes</h4>
                <p className="text-sm text-gray-600">High-GI foods cause rapid blood sugar increases</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-amber-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Excess Insulin</h4>
                <p className="text-sm text-gray-600">Body produces more insulin to compensate</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Brain className="w-8 h-8 text-rose-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Androgen Production</h4>
                <p className="text-sm text-gray-600">High insulin stimulates excess androgens</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <PCOSIcon className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">PCOS Symptoms</h4>
                <p className="text-sm text-gray-600">Hormonal imbalance causes symptoms</p>
              </div>
            </div>

            <div className="mt-10 p-6 bg-gradient-to-r from-rose-50 to-purple-50 rounded-2xl">
              <p className="text-center text-gray-700">
                <strong className="text-gray-900">The good news:</strong> By addressing insulin resistance through
                diet, exercise, and when appropriate, medication — many PCOS symptoms can be significantly improved or even reversed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Approach */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Approach to PCOS Care
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Evidence-based assessment and support for managing PCOS through understanding your unique biomarker profile
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {processSteps.map((step, index) => (
              <div key={index} className="relative">
                {index < processSteps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-rose-200 -translate-x-1/2 z-0" />
                )}
                <div className="relative bg-white rounded-2xl p-6 border border-rose-100 shadow-sm hover:shadow-lg transition-shadow z-10">
                  <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center mb-4">
                    <step.icon className="w-6 h-6 text-rose-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{step.title}</h3>
                  <p className="text-sm text-rose-600 mb-3">{step.subtitle}</p>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Biomarkers Section */}
      <section className="py-20 bg-gradient-to-b from-white to-rose-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Key Biomarkers for PCOS
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Our comprehensive PCOS panel tests both hormonal and metabolic markers to give you a complete picture of what's happening in your body.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                {biomarkers.map((marker, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 bg-white rounded-xl border border-rose-100"
                  >
                    <CircleDot className="w-5 h-5 text-rose-500 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">{marker.name}</p>
                      <p className="text-sm text-gray-500">{marker.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-rose-100 to-purple-100 rounded-3xl p-8">
              <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-rose-100 rounded-xl">
                    <FlaskConical className="w-8 h-8 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">PCOS Biomarker Panel</h3>
                    <p className="text-gray-500">Hormonal + Metabolic Assessment</p>
                  </div>
                </div>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Metabolic Health Panel included
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Hormone Balance Panel included
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Doctor review of results
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Personalised insights
                  </li>
                </ul>
                <Link
                  href="/labs"
                  className="block w-full px-6 py-4 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors text-center"
                >
                  Order Your PCOS Panel
                </Link>
              </div>

              <p className="text-center text-sm text-gray-600">
                Results reviewed by AHPRA-registered doctors
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Nutrition Tips */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Nutrition Tips for PCOS
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Diet plays a crucial role in managing insulin resistance and PCOS symptoms
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {nutritionTips.map((tip, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100"
              >
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 shadow-sm">
                  <tip.icon className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{tip.title}</h3>
                <p className="text-sm text-gray-600">{tip.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-100">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">Key Supplements for PCOS</h3>
                <p className="text-gray-600 mb-4">
                  Research suggests these nutrients may support insulin sensitivity in PCOS:
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-green-700 border border-green-200">Inositol</span>
                  <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-green-700 border border-green-200">Chromium</span>
                  <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-green-700 border border-green-200">Alpha Lipoic Acid</span>
                  <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-green-700 border border-green-200">Omega-3</span>
                  <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-green-700 border border-green-200">Vitamin D</span>
                </div>
              </div>
              <div className="text-sm text-gray-500 max-w-xs">
                Always consult with a healthcare provider before starting any supplements.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-rose-600 to-purple-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Take Control of Your PCOS Journey
          </h2>
          <p className="text-xl text-rose-100 mb-8 max-w-2xl mx-auto">
            Understanding your biomarkers is the first step. Get tested today and receive personalised insights from our medical team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/labs"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-rose-600 rounded-xl font-semibold hover:bg-rose-50 transition-colors shadow-lg"
            >
              <FlaskConical className="w-5 h-5" />
              Get Your PCOS Panel
            </Link>
            <Link
              href="/womens-health"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-rose-500/20 text-white rounded-xl font-semibold border-2 border-white/30 hover:bg-rose-500/30 transition-colors"
            >
              Explore Women's Health
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600">
              Common questions about PCOS and metabolic health
            </p>
          </div>

          <div className="space-y-1">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === index}
                onToggle={() => setOpenFAQ(openFAQ === index ? null : index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Medical Disclaimer */}
      <section className="py-8 bg-gray-50 border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs text-gray-500 text-center">
            <strong>Medical Disclaimer:</strong> This information is provided for educational purposes only and is not intended as medical advice.
            PCOS is a complex condition that requires proper medical evaluation and management. The quiz on this page is for informational purposes
            only and should not be used for self-diagnosis. Please consult with a qualified healthcare provider for diagnosis and treatment options.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
