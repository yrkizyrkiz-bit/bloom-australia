"use client";

import { useRef, useState } from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { trackMetaCustomEvent } from "@/lib/analytics/meta-pixel";
import { OrganAssessmentResults } from "@/components/promo/OrganAssessmentResults";
import {
  HEART_ASSESSMENT_UI,
  heartDisplayTier,
  heartDriversFromAnswers,
  heartScoreFromAnswers,
} from "@/lib/promo/heart-assessment-results";

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

const HEART_ASSESSMENT_EVENT = {
  content_name: "Heart health risk assessment",
  content_category: "heart_health",
  content_ids: ["heart_health_assessment"],
} as const;

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
  const startedRef = useRef(false);
  const completedRef = useRef(false);

  const steps: Step[] = ["age", "cholesterol", "bp", "smoking", "diabetes", "bmi", "family", "result"];
  const currentIndex = steps.indexOf(step);
  const progress = ((currentIndex) / (steps.length - 1)) * 100;

  const nextStep = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex >= steps.length) return;
    if (step === "age" && !startedRef.current) {
      startedRef.current = true;
      trackMetaCustomEvent("HeartAssessmentStarted", HEART_ASSESSMENT_EVENT);
    }
    if (step === "family" && !completedRef.current) {
      completedRef.current = true;
      trackMetaCustomEvent("HeartAssessmentCompleted", HEART_ASSESSMENT_EVENT);
    }
    setStep(steps[nextIndex]);
  };

  const prevStep = () => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) {
      setStep(steps[prevIndex]);
    }
  };

  if (step === "result") {
    return (
      <OrganAssessmentResults
        copy={HEART_ASSESSMENT_UI}
        tier={heartDisplayTier(heartScoreFromAnswers(answers))}
        drivers={heartDriversFromAnswers(answers)}
      />
    );
  }

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
                { value: "65+", label: "65+", span: true },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setAnswers({ ...answers, age: option.value });
                    setTimeout(nextStep, 200);
                  }}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    option.span ? "col-span-2" : ""
                  } ${
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

      default:
        return null;
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
