"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Scale,
  Activity,
  Heart,
  Wine,
  Utensils,
  Moon,
} from "lucide-react";

interface Question {
  id: string;
  question: string;
  description?: string;
  icon: React.ElementType;
  options: {
    label: string;
    value: number;
    description?: string;
  }[];
}

const questions: Question[] = [
  {
    id: "waist",
    question: "Do you carry excess weight around your midsection?",
    description: "Central/abdominal obesity is strongly linked to fatty liver",
    icon: Scale,
    options: [
      { label: "No, my waist is proportional", value: 0 },
      { label: "Slightly — some belly fat", value: 2 },
      { label: "Yes — significant belly fat", value: 4 },
      { label: "Yes — most of my weight is around my middle", value: 6 },
    ],
  },
  {
    id: "diabetes",
    question: "Do you have diabetes or pre-diabetes?",
    description: "Or have you been told you have insulin resistance?",
    icon: Activity,
    options: [
      { label: "No", value: 0 },
      { label: "Pre-diabetes or insulin resistance", value: 3 },
      { label: "Type 2 diabetes (well controlled)", value: 4 },
      { label: "Type 2 diabetes (not well controlled)", value: 6 },
    ],
  },
  {
    id: "cholesterol",
    question: "Do you have high cholesterol or triglycerides?",
    description: "Abnormal lipid levels are common with fatty liver",
    icon: Heart,
    options: [
      { label: "No, my levels are normal", value: 0 },
      { label: "Borderline or mildly elevated", value: 2 },
      { label: "Yes, taking medication for it", value: 3 },
      { label: "Yes, significantly elevated", value: 4 },
    ],
  },
  {
    id: "alcohol",
    question: "How much alcohol do you typically consume?",
    description: "Per week on average",
    icon: Wine,
    options: [
      { label: "None or rarely", value: 0 },
      { label: "1-7 drinks per week", value: 1 },
      { label: "8-14 drinks per week", value: 3 },
      { label: "More than 14 drinks per week", value: 5 },
    ],
  },
  {
    id: "diet",
    question: "How would you describe your typical diet?",
    description: "Consider your average eating habits",
    icon: Utensils,
    options: [
      { label: "Mostly whole foods, minimal processed food", value: 0 },
      { label: "Mixed — some healthy, some processed", value: 2 },
      { label: "Often processed foods, sugary drinks, fast food", value: 4 },
      { label: "Very high in processed foods and sugar", value: 5 },
    ],
  },
  {
    id: "activity",
    question: "How physically active are you?",
    description: "Including exercise and daily movement",
    icon: Activity,
    options: [
      { label: "Very active (5+ hours/week exercise)", value: 0 },
      { label: "Moderately active (2-4 hours/week)", value: 1 },
      { label: "Lightly active (1-2 hours/week)", value: 3 },
      { label: "Sedentary (little to no regular exercise)", value: 5 },
    ],
  },
  {
    id: "fatigue",
    question: "Do you experience unexplained fatigue?",
    description: "Feeling tired despite adequate sleep",
    icon: Moon,
    options: [
      { label: "Rarely or never", value: 0 },
      { label: "Sometimes", value: 1 },
      { label: "Often", value: 2 },
      { label: "Almost always", value: 3 },
    ],
  },
];

function calculateBMI(weightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

function getBMIScore(bmi: number): number {
  if (bmi < 25) return 0;
  if (bmi < 30) return 2;
  if (bmi < 35) return 4;
  return 6;
}

function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy weight";
  if (bmi < 30) return "Overweight";
  if (bmi < 35) return "Obese";
  return "Severely obese";
}

function getRiskLevel(score: number): {
  level: "low" | "moderate" | "elevated" | "high";
  title: string;
  description: string;
  color: string;
  bgColor: string;
  icon: React.ElementType;
} {
  if (score <= 8) {
    return {
      level: "low",
      title: "Low Risk",
      description: "Your responses suggest a lower risk of fatty liver disease. However, metabolic health can change over time. Consider a baseline biomarker test to confirm and establish your metabolic baseline.",
      color: "text-[#5c7a52]",
      bgColor: "bg-[#5c7a52]",
      icon: CheckCircle,
    };
  } else if (score <= 16) {
    return {
      level: "moderate",
      title: "Moderate Risk",
      description: "Your responses indicate some risk factors for fatty liver disease. Early detection is key — fatty liver is often reversible when caught early. We recommend biomarker testing to assess your liver health.",
      color: "text-[#c17a58]",
      bgColor: "bg-[#c17a58]",
      icon: AlertTriangle,
    };
  } else if (score <= 24) {
    return {
      level: "elevated",
      title: "Elevated Risk",
      description: "Your responses suggest elevated risk for fatty liver disease. Multiple risk factors are present. We strongly recommend comprehensive metabolic testing to understand your liver health and create a treatment plan.",
      color: "text-[#c17a58]",
      bgColor: "bg-[#c17a58]",
      icon: AlertTriangle,
    };
  } else {
    return {
      level: "high",
      title: "High Risk",
      description: "Your responses indicate significant risk factors for fatty liver disease. This doesn't mean you have it, but testing is important. The good news: fatty liver is often reversible with proper treatment. We recommend comprehensive assessment.",
      color: "text-red-600",
      bgColor: "bg-red-600",
      icon: AlertCircle,
    };
  }
}

export function LiverHealthCalculator() {
  const [currentQuestion, setCurrentQuestion] = useState(-1); // -1 for BMI input screen
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [weight, setWeight] = useState<string>("");
  const [height, setHeight] = useState<string>("");

  const totalQuestions = questions.length + 1; // +1 for BMI question
  const progress = ((currentQuestion + 2) / totalQuestions) * 100;
  const question = currentQuestion >= 0 ? questions[currentQuestion] : null;

  const bmi = weight && height ? calculateBMI(Number(weight), Number(height)) : null;
  const bmiScore = bmi ? getBMIScore(bmi) : 0;

  const handleBMISubmit = () => {
    if (weight && height && bmi) {
      setAnswers({ ...answers, bmi: bmiScore });
      setCurrentQuestion(0);
    }
  };

  const handleAnswer = (value: number) => {
    if (!question) return;
    const newAnswers = { ...answers, [question.id]: value };
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    } else if (currentQuestion === 0) {
      setCurrentQuestion(-1);
    }
  };

  const handleReset = () => {
    setCurrentQuestion(-1);
    setAnswers({});
    setShowResults(false);
    setWeight("");
    setHeight("");
  };

  const totalScore = Object.values(answers).reduce((sum, val) => sum + val, 0);
  const maxScore = questions.reduce(
    (sum, q) => sum + Math.max(...q.options.map((o) => o.value)),
    0
  ) + 6; // +6 for max BMI score
  const riskLevel = getRiskLevel(totalScore);

  if (showResults) {
    return (
      <div className="h-full flex flex-col">
        {/* Results Header */}
        <div className={`${riskLevel.bgColor} p-4 text-white text-center flex-shrink-0`}>
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <riskLevel.icon className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-serif">{riskLevel.title}</h3>
              <p className="text-white/80 text-xs">Score: {totalScore} / {maxScore}</p>
            </div>
          </div>
        </div>

        {/* Scrollable Results Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-[#5c7a52] leading-relaxed mb-6 text-sm">
            {riskLevel.description}
          </p>

          {/* Risk Factors Summary */}
          <div className="bg-[#f4f7f2] rounded-2xl p-4 mb-6">
            <h4 className="font-medium text-[#2c3628] mb-3 text-sm">Your Risk Factors</h4>
            <div className="space-y-2">
              {/* BMI Result */}
              {bmi && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#5c7a52] truncate pr-2">BMI?</span>
                  <span className={`font-medium flex-shrink-0 ${bmiScore >= 3 ? "text-[#c17a58]" : "text-[#5c7a52]"}`}>
                    {bmi.toFixed(1)} ({getBMICategory(bmi)})
                  </span>
                </div>
              )}
              {questions.map((q) => {
                const answer = answers[q.id];
                const selectedOption = q.options.find((o) => o.value === answer);
                const isHighRisk = answer >= 3;

                return (
                  <div key={q.id} className="flex items-center justify-between text-xs">
                    <span className="text-[#5c7a52] truncate pr-2">{q.question.split("?")[0]}?</span>
                    <span className={`font-medium flex-shrink-0 ${isHighRisk ? "text-[#c17a58]" : "text-[#5c7a52]"}`}>
                      {selectedOption?.label.split(" (")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          <div className="mb-6">
            <h4 className="font-medium text-[#2c3628] mb-3 text-sm">Recommended Next Steps</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#5c7a52] mt-0.5 flex-shrink-0" />
                <span className="text-[#5c7a52] text-sm">Get comprehensive liver metabolic biomarker testing</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#5c7a52] mt-0.5 flex-shrink-0" />
                <span className="text-[#5c7a52] text-sm">Consult with a doctor who specialises in metabolic health</span>
              </div>
              {riskLevel.level !== "low" && (
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-[#5c7a52] mt-0.5 flex-shrink-0" />
                  <span className="text-[#5c7a52] text-sm">Consider lifestyle modifications while awaiting results</span>
                </div>
              )}
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-2">
            <Link
              href="/biomarker-intake?service=metabolic-panel"
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-3"
            >
              Get liver metabolic biomarker testing
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={handleReset}
              className="w-full py-2 text-[#5c7a52] hover:text-[#34412f] transition-colors text-xs"
            >
              Take assessment again
            </button>
          </div>

          {/* Disclaimer */}
          <p className="mt-4 text-[10px] text-[#7e9a72] text-center">
            This assessment is for educational purposes only and does not constitute medical diagnosis. Please consult a healthcare professional for proper evaluation.
          </p>
        </div>
      </div>
    );
  }

  // BMI Input Screen (first question)
  if (currentQuestion === -1) {
    return (
      <div className="h-full flex flex-col">
        {/* Progress Bar */}
        <div className="p-4 flex-shrink-0 border-b border-[#e6ebe3]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#5c7a52]">
              Question 1 of {totalQuestions}
            </span>
            <span className="text-xs text-[#7e9a72]">
              {Math.round((1 / totalQuestions) * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-[#e6ebe3] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#5c7a52] rounded-full transition-all duration-500"
              style={{ width: `${(1 / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* BMI Input Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#5c7a52]/10 flex items-center justify-center flex-shrink-0">
              <Scale className="w-5 h-5 text-[#5c7a52]" />
            </div>
            <div>
              <h3 className="text-lg font-serif text-[#2c3628]">Enter your weight and height</h3>
              <p className="text-xs text-[#7e9a72]">We'll calculate your BMI automatically</p>
            </div>
          </div>

          {/* Weight Input */}
          <div className="space-y-4 mb-6">
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-[#2c3628] mb-2">
                Weight (kg)
              </label>
              <input
                type="number"
                id="weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="e.g. 75"
                className="w-full p-3 rounded-xl border border-[#e6ebe3] focus:border-[#5c7a52] focus:outline-none focus:ring-2 focus:ring-[#5c7a52]/20 transition-all text-[#2c3628]"
              />
            </div>

            <div>
              <label htmlFor="height" className="block text-sm font-medium text-[#2c3628] mb-2">
                Height (cm)
              </label>
              <input
                type="number"
                id="height"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="e.g. 175"
                className="w-full p-3 rounded-xl border border-[#e6ebe3] focus:border-[#5c7a52] focus:outline-none focus:ring-2 focus:ring-[#5c7a52]/20 transition-all text-[#2c3628]"
              />
            </div>
          </div>

          {/* BMI Result Display with Visual Indicator */}
          {bmi && (
            <div className="bg-[#f4f7f2] rounded-xl p-4 mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[#5c7a52]">Your BMI</span>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-serif transition-all duration-500 ${bmiScore >= 4 ? "text-red-500" : bmiScore >= 2 ? "text-[#c17a58]" : "text-[#5c7a52]"}`}>
                    {bmi.toFixed(1)}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full transition-all duration-300 ${
                    bmi < 18.5 ? "bg-blue-100 text-blue-700" :
                    bmi < 25 ? "bg-green-100 text-green-700" :
                    bmi < 30 ? "bg-yellow-100 text-yellow-700" :
                    bmi < 35 ? "bg-orange-100 text-orange-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {getBMICategory(bmi)}
                  </span>
                </div>
              </div>

              {/* BMI Visual Scale Bar */}
              <div className="relative mt-2">
                {/* Scale labels */}
                <div className="flex justify-between text-[10px] text-[#7e9a72] mb-1">
                  <span>15</span>
                  <span>18.5</span>
                  <span>25</span>
                  <span>30</span>
                  <span>35</span>
                  <span>40+</span>
                </div>

                {/* Gradient bar */}
                <div className="h-3 rounded-full overflow-hidden relative bg-gradient-to-r from-blue-400 via-green-400 via-30% via-yellow-400 via-50% via-orange-400 via-70% to-red-500">
                  {/* Position indicator */}
                  <div
                    className="absolute top-0 h-full w-1 bg-white shadow-lg rounded-full transition-all duration-500 ease-out"
                    style={{
                      left: `${Math.min(Math.max(((bmi - 15) / 25) * 100, 0), 100)}%`,
                      transform: 'translateX(-50%)'
                    }}
                  />
                </div>

                {/* Category labels below */}
                <div className="flex text-[9px] mt-1 text-[#7e9a72]">
                  <span className="w-[14%] text-center">Under</span>
                  <span className="w-[26%] text-center">Healthy</span>
                  <span className="w-[20%] text-center">Over</span>
                  <span className="w-[20%] text-center">Obese</span>
                  <span className="w-[20%] text-center">Severe</span>
                </div>
              </div>

              {/* Risk message */}
              <p className={`text-xs mt-3 pt-3 border-t border-[#e6ebe3] transition-all duration-300 ${bmiScore >= 4 ? "text-red-600" : bmiScore >= 2 ? "text-[#c17a58]" : "text-[#5c7a52]"}`}>
                {bmi < 18.5 && "Being underweight can also affect liver health. Let's assess other factors."}
                {bmi >= 18.5 && bmi < 25 && "Great! A healthy BMI reduces fatty liver risk. Let's check other factors."}
                {bmi >= 25 && bmi < 30 && "Being overweight increases fatty liver risk. Early detection is key."}
                {bmi >= 30 && bmi < 35 && "Obesity significantly increases fatty liver risk. Testing is recommended."}
                {bmi >= 35 && "Severe obesity is strongly linked to fatty liver disease. Assessment is important."}
              </p>
            </div>
          )}

          {/* Continue Button */}
          <button
            type="button"
            onClick={handleBMISubmit}
            disabled={!weight || !height}
            className={`w-full p-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              weight && height
                ? "bg-[#5c7a52] text-white hover:bg-[#4a6243]"
                : "bg-[#e6ebe3] text-[#7e9a72] cursor-not-allowed"
            }`}
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Progress Bar */}
      <div className="p-4 flex-shrink-0 border-b border-[#e6ebe3]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-[#5c7a52]">
            Question {currentQuestion + 2} of {totalQuestions}
          </span>
          <span className="text-xs text-[#7e9a72]">
            {Math.round(progress)}%
          </span>
        </div>
        <div className="h-1.5 bg-[#e6ebe3] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#5c7a52] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Scrollable Question Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {question && (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#5c7a52]/10 flex items-center justify-center flex-shrink-0">
                <question.icon className="w-5 h-5 text-[#5c7a52]" />
              </div>
              <div>
                <h3 className="text-lg font-serif text-[#2c3628]">{question.question}</h3>
                {question.description && (
                  <p className="text-xs text-[#7e9a72]">{question.description}</p>
                )}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-2 mb-6">
              {question.options.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => handleAnswer(option.value)}
                  className={`w-full p-3 rounded-xl border text-left transition-all hover:border-[#5c7a52] hover:bg-[#f4f7f2] ${
                    answers[question.id] === option.value
                      ? "border-[#5c7a52] bg-[#f4f7f2]"
                      : "border-[#e6ebe3]"
                  }`}
                >
                  <span className="text-[#2c3628] text-sm">{option.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Navigation */}
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 text-[#5c7a52] hover:text-[#34412f] transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous question
        </button>
      </div>
    </div>
  );
}
