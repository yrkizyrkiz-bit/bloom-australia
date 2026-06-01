"use client";

import { useState } from "react";
import { ArrowRight, ArrowLeft, Droplets, AlertTriangle, CheckCircle, Activity, Gauge } from "lucide-react";
import Link from "next/link";

type Step = "age" | "diabetes" | "bp" | "weight" | "family" | "symptoms" | "medications" | "result";

interface Answers {
  age: string;
  diabetes: string;
  bp: string;
  weight: string;
  family: string;
  symptoms: string[];
  medications: string;
}

export function KidneyHealthCalculator() {
  const [step, setStep] = useState<Step>("age");
  const [answers, setAnswers] = useState<Answers>({
    age: "",
    diabetes: "",
    bp: "",
    weight: "",
    family: "",
    symptoms: [],
    medications: "",
  });

  const calculateRisk = (): { level: "low" | "moderate" | "elevated" | "high"; stage: string; message: string } => {
    let score = 0;

    // Age scoring (CKD risk increases significantly with age)
    const ageMap: Record<string, number> = { "under35": 0, "35-44": 1, "45-54": 2, "55-64": 3, "65+": 4 };
    score += ageMap[answers.age] || 0;

    // Diabetes (leading cause of CKD)
    if (answers.diabetes === "type2") score += 4;
    else if (answers.diabetes === "type1") score += 3;
    else if (answers.diabetes === "prediabetes") score += 2;

    // Blood pressure (second leading cause)
    if (answers.bp === "high-uncontrolled") score += 4;
    else if (answers.bp === "high-controlled") score += 2;
    else if (answers.bp === "borderline") score += 1;

    // Weight
    if (answers.weight === "obese") score += 3;
    else if (answers.weight === "overweight") score += 2;

    // Family history
    if (answers.family === "kidney-disease") score += 3;
    else if (answers.family === "diabetes-bp") score += 2;

    // Symptoms (each adds risk)
    score += answers.symptoms.length;

    // Medications
    if (answers.medications === "frequent") score += 2;
    else if (answers.medications === "occasional") score += 1;

    if (score >= 14) {
      return {
        level: "high",
        stage: "Elevated Risk",
        message: "Your responses suggest multiple significant CKD risk factors. We strongly recommend a comprehensive kidney function assessment including eGFR, creatinine, and uACR."
      };
    } else if (score >= 10) {
      return {
        level: "elevated",
        stage: "Moderate-High Risk",
        message: "You have several risk factors for kidney disease. Early detection through biomarker testing can help preserve kidney function."
      };
    } else if (score >= 5) {
      return {
        level: "moderate",
        stage: "Moderate Risk",
        message: "You have some risk factors that warrant monitoring. Regular kidney function tests can help track your health over time."
      };
    } else {
      return {
        level: "low",
        stage: "Lower Risk",
        message: "Your current risk profile appears favorable. Maintaining healthy habits and periodic check-ups is still recommended."
      };
    }
  };

  const steps: Step[] = ["age", "diabetes", "bp", "weight", "family", "symptoms", "medications", "result"];
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
      case "diabetes": return answers.diabetes !== "";
      case "bp": return answers.bp !== "";
      case "weight": return answers.weight !== "";
      case "family": return answers.family !== "";
      case "symptoms": return true; // Symptoms are optional
      case "medications": return answers.medications !== "";
      default: return true;
    }
  };

  const toggleSymptom = (symptom: string) => {
    setAnswers(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom]
    }));
  };

  const renderStep = () => {
    switch (step) {
      case "age":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">What is your age?</h3>
            <p className="text-sm text-gray-500">CKD risk increases significantly after age 60</p>
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
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-gray-200 hover:border-teal-300"
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
            <p className="text-sm text-gray-500">Diabetes is the leading cause of CKD in Australia</p>
            <div className="space-y-3">
              {[
                { value: "no", label: "No diabetes" },
                { value: "prediabetes", label: "Prediabetes / insulin resistance" },
                { value: "type2", label: "Type 2 diabetes" },
                { value: "type1", label: "Type 1 diabetes" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setAnswers({ ...answers, diabetes: option.value });
                    setTimeout(nextStep, 200);
                  }}
                  className={`w-full p-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                    answers.diabetes === option.value
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-gray-200 hover:border-teal-300"
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
            <p className="text-sm text-gray-500">High BP is the second leading cause of kidney disease</p>
            <div className="space-y-3">
              {[
                { value: "normal", label: "No, my blood pressure is normal" },
                { value: "borderline", label: "Borderline (130-139/80-89)" },
                { value: "high-controlled", label: "High BP, well controlled with medication" },
                { value: "high-uncontrolled", label: "High BP, not well controlled" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setAnswers({ ...answers, bp: option.value });
                    setTimeout(nextStep, 200);
                  }}
                  className={`w-full p-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                    answers.bp === option.value
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-gray-200 hover:border-teal-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );

      case "weight":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">What best describes your weight?</h3>
            <p className="text-sm text-gray-500">Obesity increases risk of fatty kidney disease</p>
            <div className="space-y-3">
              {[
                { value: "healthy", label: "Healthy weight (BMI 18.5-24.9)" },
                { value: "overweight", label: "Overweight (BMI 25-29.9)" },
                { value: "obese", label: "Obese (BMI 30+)" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setAnswers({ ...answers, weight: option.value });
                    setTimeout(nextStep, 200);
                  }}
                  className={`w-full p-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                    answers.weight === option.value
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-gray-200 hover:border-teal-300"
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
            <h3 className="text-lg font-medium text-gray-900">Family history?</h3>
            <p className="text-sm text-gray-500">Kidney disease can run in families</p>
            <div className="space-y-3">
              {[
                { value: "none", label: "No relevant family history" },
                { value: "diabetes-bp", label: "Family history of diabetes or high BP" },
                { value: "kidney-disease", label: "Family history of kidney disease" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setAnswers({ ...answers, family: option.value });
                    setTimeout(nextStep, 200);
                  }}
                  className={`w-full p-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                    answers.family === option.value
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-gray-200 hover:border-teal-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );

      case "symptoms":
        const symptomOptions = [
          { value: "fatigue", label: "Persistent fatigue" },
          { value: "swelling", label: "Swelling in feet/ankles" },
          { value: "urination", label: "Changes in urination" },
          { value: "foamy", label: "Foamy or bubbly urine" },
          { value: "appetite", label: "Poor appetite or nausea" },
          { value: "none", label: "None of these" },
        ];
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Do you experience any of these?</h3>
            <p className="text-sm text-gray-500">Select all that apply (CKD is often silent)</p>
            <div className="space-y-2">
              {symptomOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    if (option.value === "none") {
                      setAnswers({ ...answers, symptoms: [] });
                    } else {
                      toggleSymptom(option.value);
                    }
                  }}
                  className={`w-full p-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                    option.value === "none"
                      ? answers.symptoms.length === 0
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-gray-200 hover:border-teal-300"
                      : answers.symptoms.includes(option.value)
                        ? "border-teal-500 bg-teal-50 text-teal-700"
                        : "border-gray-200 hover:border-teal-300"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded border flex items-center justify-center ${
                      (option.value === "none" && answers.symptoms.length === 0) || answers.symptoms.includes(option.value)
                        ? "bg-teal-500 border-teal-500"
                        : "border-gray-300"
                    }`}>
                      {((option.value === "none" && answers.symptoms.length === 0) || answers.symptoms.includes(option.value)) && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </span>
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        );

      case "medications":
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Do you use NSAIDs regularly?</h3>
            <p className="text-sm text-gray-500">Ibuprofen, naproxen, and similar pain relievers</p>
            <div className="space-y-3">
              {[
                { value: "rarely", label: "Rarely or never" },
                { value: "occasional", label: "Occasionally (a few times per month)" },
                { value: "frequent", label: "Frequently (weekly or more)" },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setAnswers({ ...answers, medications: option.value });
                    setTimeout(nextStep, 200);
                  }}
                  className={`w-full p-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
                    answers.medications === option.value
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-gray-200 hover:border-teal-300"
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
          high: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: Gauge },
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
                  <p className="text-sm text-gray-500">Your estimated CKD risk</p>
                  <p className={`text-lg font-semibold ${colors.text}`}>{risk.stage}</p>
                </div>
              </div>
              <p className="text-sm text-gray-600">{risk.message}</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
              <p className="font-medium text-gray-900 mb-2">Recommended kidney tests:</p>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                  <span>eGFR and Creatinine (kidney filtration)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                  <span>uACR (protein in urine - kidney damage)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                  <span>HbA1c and fasting glucose (metabolic risk)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                  <span>Electrolytes (Na, K, Phosphorus)</span>
                </li>
              </ul>
            </div>

            <Link
              href="/membership/checkout"
              className="block w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-center transition-colors"
            >
              Get your kidney health assessment
              <ArrowRight className="w-4 h-4 inline ml-2" />
            </Link>

            <button
              onClick={() => {
                setStep("age");
                setAnswers({ age: "", diabetes: "", bp: "", weight: "", family: "", symptoms: [], medications: "" });
              }}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              Start over
            </button>

            <p className="text-xs text-gray-400 text-center">
              This assessment is for informational purposes only and does not constitute medical advice. Reference: National Kidney Foundation.
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
              className="h-full bg-teal-500 transition-all duration-300"
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
      {step !== "result" && step !== "symptoms" && (
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
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {currentIndex === steps.length - 2 ? "See Results" : "Continue"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Symptoms step has custom navigation */}
      {step === "symptoms" && (
        <div className="px-5 pb-4 pt-2 border-t border-gray-100">
          <div className="flex gap-3">
            <button
              onClick={prevStep}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextStep}
              className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
