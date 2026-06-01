"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, Heart, AlertTriangle, CheckCircle, Activity } from "lucide-react";
import Link from "next/link";

type Step = "age" | "cholesterol" | "bp" | "smoking" | "diabetes" | "bmi" | "family" | "result";

interface Answers {
  age: string;
  cholesterol: string;
  bp: string;
  smoking: string;
  diabetes: string;
  bmi: string;
  family: string;
}

export function HeartHealthCalculator() {
  const [step, setStep] = useState<Step>("age");
  const [answers, setAnswers] = useState<Answers>({
    age: "",
    cholesterol: "",
    bp: "",
    smoking: "",
    diabetes: "",
    bmi: "",
    family: "",
  });

  const calculateRisk = (): { level: "low" | "moderate" | "elevated" | "high"; score: number; message: string } => {
    let score = 0;

    // Age scoring
    const age = parseInt(answers.age) || 0;
    if (age >= 65) score += 3;
    else if (age >= 55) score += 2;
    else if (age >= 45) score += 1;

    // Cholesterol
    if (answers.cholesterol === "high") score += 3;
    else if (answers.cholesterol === "borderline") score += 2;
    else if (answers.cholesterol === "unknown") score += 1;

    // Blood pressure
    if (answers.bp === "high") score += 3;
    else if (answers.bp === "borderline") score += 2;
    else if (answers.bp === "unknown") score += 1;

    // Smoking
    if (answers.smoking === "current") score += 3;
    else if (answers.smoking === "former") score += 1;

    // Diabetes
    if (answers.diabetes === "yes") score += 3;
    else if (answers.diabetes === "prediabetes") score += 2;

    // BMI
    if (answers.bmi === "obese") score += 3;
    else if (answers.bmi === "overweight") score += 2;

    // Family history
    if (answers.family === "yes-early") score += 3;
    else if (answers.family === "yes") score += 2;

    if (score >= 12) {
      return { level: "high", score, message: "Your responses suggest elevated cardiovascular risk factors. We recommend a comprehensive heart health assessment." };
    } else if (score >= 8) {
      return { level: "elevated", score, message: "You have several cardiovascular risk factors that warrant attention. Early intervention can make a significant difference." };
    } else if (score >= 4) {
      return { level: "moderate", score, message: "You have some risk factors to monitor. Regular testing can help track your heart health over time." };
    } else {
      return { level: "low", score, message: "Your current risk profile appears favorable. Maintaining healthy habits and regular check-ups is still recommended." };
    }
  };

  const steps: Step[] = ["age", "cholesterol", "bp", "smoking", "diabetes", "bmi", "family", "result"];
  const currentIndex = steps.indexOf(step);
  const progress = ((currentIndex) / (steps.length - 1)) * 100;

  const nextStep = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      setStep(steps[nextIndex]);
    }
  };

  const prevStep = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  const canProceed = () => {
    switch (step) {
      case "age": return answers.age !== "";
      case "cholesterol": return answers.cholesterol !== "";
      case "bp": return answers.bp !== "";
      case "smoking": return answers.smoking !== "";
      case "diabetes": return answers.diabetes !== "";
      case "bmi": return answers.bmi !== "";
      case "family": return answers.family !== "";
      default: return true;
    }
  };

  const renderStep = () => {
    switch (step) {
      case "age":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">What is your age?</h3>
            <p className="text-sm text-gray-500">Cardiovascular risk increases with age</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "under35", label: "Under 35" },
                { value: "35-44", label: "35-44" },
                { value: "45-54", label: "45-54" },
                { value: "55-64", label: "55-64" },
                { value: "65+", label: "65+" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setAnswers({ ...answers, age: option.value });
                    setTimeout(nextStep, 200);
                  }}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    answers.age === option.value
                      ? "border-rose-500 bg-rose-50 text-rose-700"
                      : "border-gray-200 hover:border-rose-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );

      case "cholesterol":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Do you have high cholesterol?</h3>
            <p className="text-sm text-gray-500">Total cholesterol above 5.5 mmol/L or LDL above 3.5 mmol/L</p>
            <div className="space-y-3">
              {[
                { value: "normal", label: "No, my cholesterol is normal" },
                { value: "borderline", label: "Borderline high" },
                { value: "high", label: "Yes, diagnosed high cholesterol" },
                { value: "unknown", label: "I don't know" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setAnswers({ ...answers, cholesterol: option.value });
                    setTimeout(nextStep, 200);
                  }}
                  className={`w-full p-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                    answers.cholesterol === option.value
                      ? "border-rose-500 bg-rose-50 text-rose-700"
                      : "border-gray-200 hover:border-rose-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );

      case "bp":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Do you have high blood pressure?</h3>
            <p className="text-sm text-gray-500">Blood pressure above 140/90 mmHg</p>
            <div className="space-y-3">
              {[
                { value: "normal", label: "No, my blood pressure is normal" },
                { value: "borderline", label: "Borderline (130-139/80-89)" },
                { value: "high", label: "Yes, diagnosed high blood pressure" },
                { value: "unknown", label: "I don't know" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setAnswers({ ...answers, bp: option.value });
                    setTimeout(nextStep, 200);
                  }}
                  className={`w-full p-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                    answers.bp === option.value
                      ? "border-rose-500 bg-rose-50 text-rose-700"
                      : "border-gray-200 hover:border-rose-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );

      case "smoking":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Do you smoke?</h3>
            <p className="text-sm text-gray-500">Smoking significantly increases cardiovascular risk</p>
            <div className="space-y-3">
              {[
                { value: "never", label: "Never smoked" },
                { value: "former", label: "Former smoker (quit 1+ years ago)" },
                { value: "recent", label: "Recently quit (less than 1 year)" },
                { value: "current", label: "Current smoker" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setAnswers({ ...answers, smoking: option.value });
                    setTimeout(nextStep, 200);
                  }}
                  className={`w-full p-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                    answers.smoking === option.value
                      ? "border-rose-500 bg-rose-50 text-rose-700"
                      : "border-gray-200 hover:border-rose-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );

      case "diabetes":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Do you have diabetes?</h3>
            <p className="text-sm text-gray-500">Type 2 diabetes significantly increases heart disease risk</p>
            <div className="space-y-3">
              {[
                { value: "no", label: "No diabetes" },
                { value: "prediabetes", label: "Prediabetes / insulin resistance" },
                { value: "yes", label: "Yes, Type 2 diabetes" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setAnswers({ ...answers, diabetes: option.value });
                    setTimeout(nextStep, 200);
                  }}
                  className={`w-full p-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                    answers.diabetes === option.value
                      ? "border-rose-500 bg-rose-50 text-rose-700"
                      : "border-gray-200 hover:border-rose-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );

      case "bmi":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">What best describes your weight?</h3>
            <p className="text-sm text-gray-500">Excess weight increases cardiovascular strain</p>
            <div className="space-y-3">
              {[
                { value: "healthy", label: "Healthy weight (BMI 18.5-24.9)" },
                { value: "overweight", label: "Overweight (BMI 25-29.9)" },
                { value: "obese", label: "Obese (BMI 30+)" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setAnswers({ ...answers, bmi: option.value });
                    setTimeout(nextStep, 200);
                  }}
                  className={`w-full p-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                    answers.bmi === option.value
                      ? "border-rose-500 bg-rose-50 text-rose-700"
                      : "border-gray-200 hover:border-rose-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );

      case "family":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Family history of heart disease?</h3>
            <p className="text-sm text-gray-500">First-degree relatives (parents, siblings)</p>
            <div className="space-y-3">
              {[
                { value: "no", label: "No family history" },
                { value: "yes", label: "Yes, family history of heart disease" },
                { value: "yes-early", label: "Yes, heart disease before age 55 (male) or 65 (female)" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setAnswers({ ...answers, family: option.value });
                    setTimeout(nextStep, 200);
                  }}
                  className={`w-full p-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                    answers.family === option.value
                      ? "border-rose-500 bg-rose-50 text-rose-700"
                      : "border-gray-200 hover:border-rose-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );

      case "result":
        const risk = calculateRisk();
        const riskColors = {
          low: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", icon: CheckCircle },
          moderate: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", icon: Activity },
          elevated: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", icon: AlertTriangle },
          high: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", icon: Heart },
        };
        const colors = riskColors[risk.level];
        const RiskIcon = colors.icon;

        return (
          <div className="space-y-4">
            <div className={`${colors.bg} ${colors.border} border rounded-2xl p-5`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center`}>
                  <RiskIcon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Your estimated risk level</p>
                  <p className={`text-lg font-semibold capitalize ${colors.text}`}>{risk.level} Risk</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">{risk.message}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
              <p className="font-medium text-gray-900 mb-2">Recommended next steps:</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <span>Get a comprehensive lipid panel including ApoB and Lp(a)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <span>Check inflammation markers (hs-CRP)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <span>Consult with a doctor about your results</span>
                </li>
              </ul>
            </div>

            <Link
              href="/membership/checkout"
              className="block w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-center transition-colors"
            >
              Get your heart health assessment
              <ArrowRight className="w-4 h-4 inline ml-2" />
            </Link>

            <button
              onClick={() => {
                setStep("age");
                setAnswers({ age: "", cholesterol: "", bp: "", smoking: "", diabetes: "", bmi: "", family: "" });
              }}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Start over
            </button>

            <p className="text-xs text-gray-400 text-center">
              This assessment is for informational purposes only and does not constitute medical advice.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Progress bar */}
      {step !== "result" && (
        <div className="px-5 pt-4">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Question {currentIndex + 1} of {steps.length - 1}
          </p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {renderStep()}
      </div>

      {/* Navigation */}
      {step !== "result" && (
        <div className="px-5 pb-4 pt-2 border-t border-gray-100">
          <div className="flex gap-3">
            {currentIndex > 0 && (
              <button
                onClick={prevStep}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {currentIndex === steps.length - 2 ? "See Results" : "Continue"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
