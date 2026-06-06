"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { LiverHealthCalculator } from "@/components/promo/LiverHealthCalculator";
import {
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Beaker,
  Stethoscope,
  Activity,
  Heart,
  Scale,
  Utensils,
  Moon,
  Wine,
  Pill,
  Eye,
  Wrench,
  Check,
  RefreshCw,
  ShieldCheck,
  Clock,
  Users,
  Microscope,
  LineChart,
  FlaskConical,
} from "lucide-react";

// Liver Icon Component
function LiverIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 12c0-4.5 3-7.5 7.5-7.5 3 0 5.5 1.5 7 4 1 1.5 1.5 3 1.5 4.5 0 3-2 5.5-5 6.5-1.5.5-3 .5-4.5 0-2-.5-3.5-2-4.5-4-.5-1-1-2.5-1-3.5z"/>
      <path d="M12 4.5c-1.5 2-2.5 4.5-2.5 7.5s1 5.5 2.5 7.5"/>
      <path d="M8 8c1.5 1 3.5 2 6 2"/>
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
    <div className="border-b border-[#e6ebe3]">
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
          isOpen ? "max-h-96 pb-5" : "max-h-0"
        }`}
      >
        <p className="text-[#5c7a52] leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export default function FattyLiverPage() {
  const [openFAQ, setOpenFAQ] = useState<number | null>(0);

  const epidemicStats = [
    {
      value: "1 in 3",
      label: "Australian adults estimated to have fatty liver",
      subtext: "Global prevalence estimated at 25-30%",
      citation: "Younossi ZM, et al. Hepatology. 2016;64(1):73-84",
    },
    {
      value: "~80%",
      label: "of cases may go undetected",
      subtext: "Standard liver tests may not detect early stages",
      citation: "Lazarus JV, et al. Lancet Gastroenterol Hepatol. 2022;7(7):592-593",
    },
    {
      value: "~5x",
      label: "increase in liver-related mortality",
      subtext: "Observed trend in developed nations since 1970",
      citation: "Estes C, et al. J Hepatol. 2018;69(4):896-904",
    },
  ];

  const riskFactors = [
    { icon: Scale, title: "Overweight or obesity", description: "Especially central/abdominal fat" },
    { icon: Activity, title: "Type 2 diabetes", description: "Or insulin resistance" },
    { icon: Heart, title: "High cholesterol", description: "Elevated triglycerides or LDL" },
    { icon: Utensils, title: "Poor diet", description: "High in processed foods and sugars" },
    { icon: Moon, title: "Sedentary lifestyle", description: "Lack of regular physical activity" },
    { icon: Wine, title: "Alcohol consumption", description: "Even moderate amounts can contribute" },
  ];

  const symptoms = [
    "Fatigue and low energy",
    "Abdominal discomfort (upper right)",
    "Unexplained weight gain",
    "Brain fog and poor concentration",
    "Elevated liver enzymes on blood tests",
    "Difficulty losing weight despite effort",
  ];

  const processSteps = [
    {
      icon: Eye,
      title: "See",
      subtitle: "Comprehensive Assessment",
      description: "We assess liver health through biomarker testing — not just standard liver enzymes, but a broader metabolic picture including markers associated with insulin resistance, inflammation, and lipid profiles.",
    },
    {
      icon: Wrench,
      title: "Support",
      subtitle: "Personalised Care Plan",
      description: "Based on your results, our doctors develop a care plan that may include lifestyle modifications, nutritional guidance, and when clinically appropriate, medications that have been studied for liver fat management.",
    },
    {
      icon: Check,
      title: "Verify",
      subtitle: "Track Your Progress",
      description: "Regular biomarker re-testing helps monitor how your liver markers are responding. Objective measurements help track progress over time.",
    },
    {
      icon: RefreshCw,
      title: "Optimise",
      subtitle: "Ongoing Support",
      description: "As your markers change, we adjust your care plan accordingly. Our goal is to support long-term metabolic health through evidence-based approaches.",
    },
  ];

  const biomarkers = [
    { name: "Liver Enzymes", markers: ["ALT", "AST", "GGT"], category: "Liver Function" },
    { name: "Liver Metabolic Panel", markers: ["Fasting Glucose", "HbA1c", "Insulin"], category: "Blood Sugar" },
    { name: "Lipid Profile", markers: ["Triglycerides", "LDL", "HDL"], category: "Cholesterol" },
    { name: "Inflammation", markers: ["CRP", "Ferritin", "Uric Acid"], category: "Systemic" },
  ];

  // GAP-017: Removed public medication names for TGA compliance
  const outcomes = [
    { metric: "59%", description: "of study participants showed NASH resolution with prescription treatment in clinical trial", citation: "Newsome PN, et al. NEJM 2021;384(12):1113-1124" },
    { metric: "90%", description: "NASH resolution observed in trial participants achieving ≥10% weight loss", citation: "Vilar-Gomez E, et al. Gastroenterology 2015;149(2):367-378" },
    { metric: "45%", description: "of participants showed fibrosis improvement with lifestyle changes in study", citation: "Vilar-Gomez E, et al. Gastroenterology 2015;149(2):367-378" },
    { metric: ">65%", description: "reduction in liver fat observed in prescription medication clinical trials", citation: "Loomba R, et al. Lancet Gastroenterol Hepatol 2023;8(6):511-522" },
  ];

  const treatmentOptions = [
    {
      icon: Utensils,
      title: "Nutritional Guidance",
      description: "A liver-focused eating plan that may support metabolic function. Personalised based on your biomarker results and individual health profile.",
    },
    {
      icon: Activity,
      title: "Exercise Guidance",
      description: "Movement recommendations based on research. Studies suggest certain exercise protocols may support liver health markers.¹",
    },
    {
      icon: Pill,
      title: "Medical Options",
      description: "When clinically appropriate, prescription medications that have been studied for their effects on liver fat in clinical trials. Treatment options are discussed privately with your doctor.²",
    },
    {
      icon: FlaskConical,
      title: "Supplement Considerations",
      description: "Discussion of supplementation options based on your biomarker profile — including vitamin E and omega-3s, which have been studied in clinical research.³",
    },
  ];

  const faqs = [
    {
      question: "What is fatty liver disease (MASLD)?",
      answer: "Metabolic dysfunction-associated steatotic liver disease (MASLD), formerly known as non-alcoholic fatty liver disease (NAFLD), is a condition characterised by excess fat accumulation in liver cells. According to published research, it is estimated to affect approximately 25-30% of the global population (Younossi ZM, et al. Hepatology 2016). If unaddressed, it may progress to inflammation, fibrosis, and in some cases, cirrhosis.",
    },
    {
      question: "How do I know if I have fatty liver?",
      answer: "Fatty liver often presents without obvious symptoms in early stages, which is why it is sometimes described as a 'silent' condition. Blood tests may show elevated liver enzymes (ALT, AST, GGT), though these can sometimes be within normal ranges even with hepatic steatosis. Non-invasive assessment methods include specialised blood marker panels and imaging studies. A medical professional can help determine appropriate testing.",
    },
    {
      question: "Can fatty liver improve?",
      answer: "Research suggests that fatty liver, particularly in early stages, may be responsive to intervention. Studies have shown that lifestyle modifications including weight management, dietary changes, and in some cases medication, have been associated with reductions in liver fat (Vilar-Gomez E, et al. Gastroenterology 2015). Individual responses vary, and outcomes depend on multiple factors.",
    },
    {
      question: "What factors are associated with fatty liver disease?",
      answer: "Research has identified several factors associated with MASLD, including metabolic dysfunction and insulin resistance. Associated risk factors include excess weight (particularly abdominal adiposity), type 2 diabetes, elevated cholesterol, dietary patterns high in processed foods and sugars, and sedentary lifestyle. Genetic factors may also play a role. Notably, lean individuals can also develop fatty liver due to metabolic factors.",
    },
    {
      question: "How is fatty liver different from alcohol-related liver disease?",
      answer: "While both conditions involve hepatic fat accumulation, they have different primary causes. Alcohol-related liver disease is associated with excessive alcohol consumption, while MASLD is primarily associated with metabolic dysfunction. Research suggests that alcohol consumption may exacerbate MASLD. A healthcare professional can help distinguish between these conditions.",
    },
    {
      question: "What approaches are available for fatty liver management?",
      answer: "Management typically includes lifestyle modifications (dietary changes, physical activity, weight management). When clinically appropriate, prescription medications have been studied in clinical trials for their effects on liver fat (Newsome PN, et al. NEJM 2021). Specific treatment options are discussed privately with your doctor based on individual assessment.",
    },
    {
      question: "What does research say about timeframes for improvement?",
      answer: "Clinical studies suggest that improvements in liver enzyme levels may be observed within weeks of intervention, while significant changes in liver fat content have been reported over 3-6 months in research settings (Vilar-Gomez E, et al. Gastroenterology 2015). Individual responses vary based on factors including baseline severity and adherence to recommended approaches.",
    },
    {
      question: "Do I need to see a specialist?",
      answer: "Our AHPRA-registered doctors can provide assessment and guidance for metabolic health concerns including fatty liver. Telehealth consultations are available. If your condition requires additional specialist evaluation (such as from a hepatologist), appropriate referrals can be coordinated.",
    },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#fdfbf7]">
        {/* Hero Section - Liver Left, Assessment Right */}
        <section className="relative py-10 lg:py-14 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#f4f7f2] via-[#e6ebe3] to-[#cdd8c6]" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Main Title */}
            <div className="text-center mb-10">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif text-[#2c3628] leading-[1.05]">
                It&apos;s All{" "}
                <span className="text-[#5c7a52] italic">Connected</span>
              </h1>
            </div>

            {/* Two Column Layout - Perfectly Aligned */}
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-stretch">
              {/* Left - Liver Image Panel */}
              <div className="bg-white rounded-3xl shadow-xl border border-[#e6ebe3] overflow-hidden min-h-[580px] flex flex-col">
                {/* Image Container */}
                <div className="flex-1 flex items-center justify-center p-4 lg:p-6 bg-gradient-to-b from-[#f8faf7] to-[#eef2eb]">
                  <Image
                    src="/images/liver-comparison.webp"
                    alt="Healthy liver compared to fatty liver - showing the visual difference between normal and diseased liver"
                    width={600}
                    height={350}
                    className="w-full max-w-[480px] h-auto object-contain drop-shadow-sm"
                    priority
                  />
                </div>

                {/* Content Below Image */}
                <div className="p-5 lg:p-6 border-t border-[#e6ebe3] bg-white flex-shrink-0">
                  <h2 className="text-lg lg:text-xl font-serif text-[#2c3628] mb-2">
                    <span className="text-[#c17a58]">Struggling to lose weight?</span>{" "}
                    <span className="text-[#5c7a52] italic">Your liver may be a factor.</span>
                  </h2>
                  <p className="text-[#5c7a52] leading-relaxed text-sm">
                    Research suggests fatty liver is associated with a lower resting metabolic rate — meaning your body may burn fewer calories at rest, making weight loss more challenging.<sup>1</sup>
                  </p>
                </div>
              </div>

              {/* Right - Assessment Calculator */}
              <div className="bg-white rounded-3xl shadow-xl border border-[#e6ebe3] overflow-hidden min-h-[580px] flex flex-col">
                {/* Header */}
                <div className="p-5 lg:p-6 border-b border-[#e6ebe3] bg-[#f4f7f2]">
                  <p className="text-xs uppercase tracking-widest text-[#c17a58] font-medium mb-1">
                    Free Risk Assessment
                  </p>
                  <h3 className="text-lg font-serif text-[#2c3628]">
                    Check your liver health in 2 minutes
                  </h3>
                </div>
                {/* Calculator */}
                <div className="flex-1 overflow-hidden">
                  <LiverHealthCalculator />
                </div>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-[#5c7a52] mt-10">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>AHPRA Doctors</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>NATA-Accredited Labs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Evidence-Based</span>
              </div>
            </div>
          </div>
        </section>

        {/* Epidemic Stats Section */}
        <section className="py-16 lg:py-20 bg-[#34412f]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-sm uppercase tracking-widest text-[#a8bb9e] font-medium mb-3">
                The Hidden Epidemic
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white mb-4">
                Metabolic dysfunction.{" "}
                <span className="text-[#a8bb9e] italic">The defining health crisis of our time.</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {epidemicStats.map((stat) => (
                <div
                  key={stat.label}
                  className="text-center p-8 rounded-3xl bg-white/5 border border-white/10"
                >
                  <p className="text-5xl lg:text-6xl font-serif text-white mb-3">{stat.value}</p>
                  <p className="text-lg text-white mb-2">{stat.label}</p>
                  <p className="text-sm text-[#7e9a72]">{stat.subtext}</p>
                  {stat.citation && (
                    <p className="text-xs text-[#a8bb9e] mt-2">
                      {stat.citation}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-[#a8bb9e] max-w-2xl mx-auto">
                Research suggests standard liver function tests may not detect all cases of hepatic steatosis. Early assessment may be beneficial as fatty liver is often asymptomatic in early stages.
              </p>
            </div>
          </div>
        </section>

        {/* What is Fatty Liver Section */}
        <section className="py-20 lg:py-28 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#e6ebe3] text-[#5c7a52] rounded-full mb-4">
                  Understanding the condition
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] mb-6">
                  What is{" "}
                  <span className="text-[#5c7a52] italic">fatty liver disease?</span>
                </h2>
                <p className="text-lg text-[#5c7a52] leading-relaxed mb-6">
                  Fatty liver disease (MASLD) is characterised by excess fat accumulation in liver cells. The liver plays a central role in metabolism, and hepatic steatosis has been associated with changes in metabolic function.<sup>1</sup>
                </p>
                <p className="text-[#5c7a52] leading-relaxed mb-6">
                  If unaddressed, research indicates fatty liver may progress through stages: simple steatosis → steatohepatitis (inflammation) → fibrosis → cirrhosis. Studies suggest that <strong>early-stage fatty liver may respond well to intervention</strong>, with lifestyle modifications showing promising results in clinical research.<sup>2</sup>
                </p>

                {/* Symptoms */}
                <div className="bg-[#f4f7f2] rounded-2xl p-6 border border-[#e6ebe3]">
                  <h3 className="font-medium text-[#2c3628] mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-[#c17a58]" />
                    Warning signs to watch for
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {symptoms.map((symptom) => (
                      <div key={symptom} className="flex items-center gap-2 text-sm text-[#5c7a52]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#c17a58]" />
                        {symptom}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Risk Factors */}
              <div>
                <h3 className="text-xl font-serif text-[#2c3628] mb-6">Risk factors</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {riskFactors.map((factor) => (
                    <div
                      key={factor.title}
                      className="bg-white rounded-2xl p-5 border border-[#e6ebe3] hover:border-[#5c7a52] hover:shadow-lg transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-[#5c7a52]/10 flex items-center justify-center mb-3">
                        <factor.icon className="w-5 h-5 text-[#5c7a52]" />
                      </div>
                      <h4 className="font-medium text-[#2c3628] mb-1">{factor.title}</h4>
                      <p className="text-sm text-[#7e9a72]">{factor.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* The Diagnostic Edge Section */}
        <section className="py-20 lg:py-28 bg-[#f4f7f2]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left Content */}
              <div>
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#5c7a52]/20 text-[#5c7a52] rounded-full mb-4">
                  The diagnostic edge
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] mb-6">
                  Why weight loss{" "}
                  <span className="text-[#5c7a52] italic">isn&apos;t working</span>
                </h2>

                <div className="space-y-4 mb-8">
                  <p className="text-[#5c7a52] leading-relaxed">
                    <strong className="text-[#2c3628]">Struggling to lose weight?</strong> Research shows that people with fatty liver have a significantly lower resting metabolic rate — burning fewer calories even at rest. This metabolic disadvantage may explain why weight loss feels harder than it should.<sup className="text-[#c17a58]">1</sup>
                  </p>
                  <p className="text-[#5c7a52] leading-relaxed">
                    Interestingly, research also indicates that <strong className="text-[#c17a58]">rapid weight loss and restrictive diets may contribute to fatty liver development</strong>.<sup className="text-[#c17a58]">2</sup> When weight is lost too quickly, hepatic fat accumulation may occur.
                  </p>
                  <p className="text-[#5c7a52] leading-relaxed">
                    Malnutrition — even in individuals with elevated body weight — has also been associated with fatty liver in research.<sup className="text-[#c17a58]">2</sup> Standard liver tests may not always detect early-stage hepatic steatosis.
                  </p>
                </div>

                {/* References */}
                <div className="bg-[#e6ebe3] rounded-2xl p-4 text-xs text-[#5c7a52]">
                  <p className="font-medium mb-2">References:</p>
                  <p className="mb-1"><sup>1</sup> Pujia R, et al. "Impact of Hepatic Steatosis on Resting Metabolic Rate and Metabolic Flexibility in Obese Subjects." Hepatol Commun. 2019;3(10):1347-1355. <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC6771160/" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#34412f]">PMC6771160</a></p>
                  <p><sup>2</sup> Better Health Channel, Victorian Government. "Alcohol abuse, rapid weight loss and malnutrition may also lead to fatty liver." <a href="https://www.betterhealth.vic.gov.au/health/conditionsandtreatments/liver-fatty-liver-disease" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#34412f]">betterhealth.vic.gov.au</a></p>
                </div>
              </div>

              {/* Right - Our Liver Metabolic Panel */}
              <div className="bg-gradient-to-br from-[#5c7a52] to-[#4a6243] rounded-3xl p-8 text-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Beaker className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-serif text-white">Our Liver Metabolic Panel</h3>
                    <p className="text-sm text-white/70">Comprehensive liver assessment</p>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#a8bb9e] flex-shrink-0 mt-0.5" />
                    <span>Full liver enzyme panel (ALT, AST, GGT, ALP)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#a8bb9e] flex-shrink-0 mt-0.5" />
                    <span>Insulin resistance markers (fasting insulin, HOMA-IR)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#a8bb9e] flex-shrink-0 mt-0.5" />
                    <span>Complete lipid profile including triglycerides</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#a8bb9e] flex-shrink-0 mt-0.5" />
                    <span>Inflammation markers (CRP, ferritin)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-[#a8bb9e] flex-shrink-0 mt-0.5" />
                    <span>Fibrosis risk assessment</span>
                  </li>
                </ul>
                <div className="pt-4 border-t border-white/20">
                  <p className="text-sm text-white/80">
                    Our panel includes markers that may help identify metabolic dysfunction that standard tests might not capture.
                  </p>
                </div>
                <Link
                  href="/labs"
                  className="mt-6 w-full bg-white text-[#34412f] rounded-full py-3 px-6 font-medium flex items-center justify-center gap-2 hover:bg-[#f4f7f2] transition-colors"
                >
                  View full biomarker list
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20 lg:py-28 bg-[#f4f7f2]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#e6ebe3] text-[#5c7a52] rounded-full mb-4">
                Our approach
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] mb-6">
                See. Fix. Verify.{" "}
                <span className="text-[#5c7a52] italic">Optimise.</span>
              </h2>
              <p className="text-lg text-[#5c7a52] max-w-3xl mx-auto">
                A continuous metabolic care system — connecting diagnosis, intervention, measurement, and optimisation.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {processSteps.map((step, index) => (
                <div
                  key={step.title}
                  className="relative bg-white rounded-3xl p-6 border border-[#e6ebe3] hover:border-[#5c7a52] hover:shadow-xl transition-all group"
                >
                  {/* Step number */}
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#5c7a52] text-white text-sm font-bold flex items-center justify-center">
                    {index + 1}
                  </div>

                  <div className="w-14 h-14 rounded-2xl bg-[#5c7a52]/10 flex items-center justify-center mb-5 group-hover:bg-[#5c7a52] transition-colors">
                    <step.icon className="w-7 h-7 text-[#5c7a52] group-hover:text-white transition-colors" />
                  </div>

                  <h3 className="text-2xl font-serif text-[#2c3628] mb-1">{step.title}</h3>
                  <p className="text-sm text-[#c17a58] font-medium mb-3">{step.subtitle}</p>
                  <p className="text-sm text-[#5c7a52] leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Biomarkers We Test */}
        <section className="py-14 lg:py-20 bg-[#34412f]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-end">
              <div>
                <span className="inline-block px-4 py-1.5 text-sm font-medium bg-white/10 text-[#a8bb9e] rounded-full mb-4">
                  Biomarker-driven care
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white mb-6">
                  We don&apos;t guess.{" "}
                  <span className="text-[#a8bb9e] italic">We measure.</span>
                </h2>
                <p className="text-lg text-[#a8bb9e] leading-relaxed mb-8">
                  Objective measurement. Longitudinal tracking. Data-informed decisions. Our comprehensive panel provides your doctor with information to help inform and adjust your care plan.
                </p>

                <div className="space-y-4">
                  {biomarkers.map((panel) => (
                    <div
                      key={panel.name}
                      className="bg-white/5 rounded-2xl p-5 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-white">{panel.name}</h3>
                        <span className="text-xs text-[#a8bb9e] bg-white/10 px-2 py-1 rounded-full">
                          {panel.category}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {panel.markers.map((marker) => (
                          <span
                            key={marker}
                            className="text-sm text-[#cdd8c6] bg-white/5 px-3 py-1 rounded-full"
                          >
                            {marker}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  href="/labs"
                  className="inline-flex items-center gap-2 mt-8 text-[#a8bb9e] hover:text-white transition-colors"
                >
                  View all biomarkers we test
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Outcomes */}
              <div className="bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                <h3 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-[#a8bb9e]" />
                  Published research findings
                </h3>
                <div className="space-y-5">
                  {outcomes.map((outcome) => (
                    <div key={outcome.description} className="border-b border-white/10 pb-4 last:border-0">
                      <div className="flex items-baseline gap-3 mb-1">
                        <span className="text-3xl font-serif text-white">{outcome.metric}</span>
                      </div>
                      <p className="text-[#a8bb9e] text-sm">{outcome.description}</p>
                      <p className="text-[10px] text-[#7e9a72] mt-1 italic">{outcome.citation}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[10px] text-[#7e9a72] border-t border-white/10 pt-4">
                  Results from peer-reviewed clinical trials. Individual outcomes may vary based on treatment adherence and baseline health status.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Treatment Options */}
        <section className="py-20 lg:py-28 bg-[#fdfbf7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#e6ebe3] text-[#5c7a52] rounded-full mb-4">
                Treatment options
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-[#2c3628] mb-6">
                A multi-modal approach to{" "}
                <span className="text-[#5c7a52] italic">liver health support</span>
              </h2>
              <p className="text-lg text-[#5c7a52] max-w-3xl mx-auto">
                Research suggests fatty liver may benefit from multi-faceted approaches. Our care plans combine evidence-informed strategies tailored to your individual metabolic profile.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {treatmentOptions.map((option) => (
                <div
                  key={option.title}
                  className="bg-white rounded-2xl p-6 border border-[#e6ebe3] hover:border-[#5c7a52] hover:shadow-lg transition-all"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#5c7a52]/10 flex items-center justify-center mb-5">
                    <option.icon className="w-7 h-7 text-[#5c7a52]" />
                  </div>
                  <h3 className="text-lg font-serif text-[#2c3628] mb-2">{option.title}</h3>
                  <p className="text-sm text-[#5c7a52] leading-relaxed">{option.description}</p>
                </div>
              ))}
            </div>

            {/* Treatment References */}
            {/* GAP-017: References updated for TGA compliance - medication names removed */}
            <div className="mt-10 bg-[#f4f7f2] rounded-2xl p-5 text-xs text-[#5c7a52]">
              <p className="font-medium mb-2">References:</p>
              <p className="mb-1"><sup>1</sup> Hashida R, et al. "Aerobic vs. resistance exercise in non-alcoholic fatty liver disease: A systematic review." J Hepatol. 2017;66(1):142-152.</p>
              <p className="mb-1"><sup>2</sup> Newsome PN, et al. "A Placebo-Controlled Trial in Nonalcoholic Steatohepatitis." NEJM. 2021;384(12):1113-1124.</p>
              <p><sup>3</sup> Sanyal AJ, et al. "Treatment Options for Nonalcoholic Steatohepatitis." NEJM. 2010;362(18):1675-1685.</p>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="py-16 bg-[#e6ebe3]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center mx-auto mb-4">
                  <Stethoscope className="w-7 h-7 text-[#5c7a52]" />
                </div>
                <h3 className="font-serif text-[#2c3628] mb-2">AHPRA Registered</h3>
                <p className="text-sm text-[#5c7a52]">All doctors fully registered with AHPRA</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-7 h-7 text-[#5c7a52]" />
                </div>
                <h3 className="font-serif text-[#2c3628] mb-2">NATA Accredited</h3>
                <p className="text-sm text-[#5c7a52]">Lab testing by accredited Australian labs</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-7 h-7 text-[#5c7a52]" />
                </div>
                <h3 className="font-serif text-[#2c3628] mb-2">Ongoing Support</h3>
                <p className="text-sm text-[#5c7a52]">Regular check-ins and treatment adjustments</p>
              </div>
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#5c7a52]/20 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-[#5c7a52]" />
                </div>
                <h3 className="font-serif text-[#2c3628] mb-2">Measurable Tracking</h3>
                <p className="text-sm text-[#5c7a52]">Biomarker monitoring to track your progress</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 lg:py-28 bg-[#fdfbf7]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 text-sm font-medium bg-[#e6ebe3] text-[#5c7a52] rounded-full mb-4">
                Common questions
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
                Frequently asked questions
              </h2>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-sm border border-[#e6ebe3]">
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

        {/* Final CTA Section */}
        <section className="py-20 lg:py-28 bg-gradient-to-br from-[#5c7a52] via-[#4a6243] to-[#34412f]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
              <LiverIcon className="w-4 h-4 text-[#a8bb9e]" />
              <span className="text-sm text-white/90">Take the first step</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white mb-6">
              Your liver health is{" "}
              <span className="text-[#cdd8c6] italic">measurable</span>
            </h2>
            <p className="text-lg text-[#a8bb9e] mb-10 max-w-2xl mx-auto">
              Research suggests early identification may be beneficial for fatty liver management. Our comprehensive liver metabolic assessment includes markers associated with hepatic steatosis.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/metabolic-care/fatty-liver/assessment"
                className="btn-white inline-flex items-center justify-center gap-2 text-lg px-8 py-4"
              >
                Check your liver health
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/labs"
                className="btn-secondary border-white text-white hover:bg-white hover:text-[#34412f] inline-flex items-center justify-center px-8 py-4"
              >
                View biomarker tests
              </Link>
            </div>

            {/* GAP-026: Removed 'No commitment' - payment required */}
            <p className="mt-6 text-sm text-[#7e9a72]">
              Free assessment · Refund if not suitable · Results in 48 hours
            </p>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="py-8 bg-[#2c3628]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-xs text-[#7e9a72] leading-relaxed text-center mb-4">
              <strong className="text-[#a8bb9e]">Medical Disclaimer:</strong> This information is for educational purposes only and does not constitute medical advice, diagnosis, or treatment recommendations. Fatty liver disease requires proper medical diagnosis by a qualified healthcare professional. All consultations and any treatments are provided by AHPRA-registered medical practitioners following individual clinical assessment. Results and outcomes vary between individuals and are not guaranteed. Always consult a qualified healthcare professional for medical concerns.
            </p>
            <p className="text-xs text-[#7e9a72] leading-relaxed text-center">
              <strong className="text-[#a8bb9e]">References:</strong> Statistics and research findings cited on this page are from peer-reviewed publications including: Pujia R, et al. Hepatol Commun. 2019;3(10):1347-1355 (PMC6771160); Younossi ZM, et al. Hepatology. 2016;64(1):73-84; Vilar-Gomez E, et al. Gastroenterology 2015;149(2):367-378; Newsome PN, et al. NEJM 2021;384(12):1113-1124. Individual study results may not be representative of all patients.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
