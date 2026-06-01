"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  postcode: string;
  // Physical
  height: string;
  currentWeight: string;
  waistCircumference: string;
  // Risk factors
  liverDiagnosis: string;
  riskFactors: string[];
  metabolicConditions: string[];
  lifestyleFactors: string[];
  // Current health
  currentMedications: string[];
  symptoms: string[];
  previousTests: string[];
  // Goals
  goals: string[];
  howHeard: string;
}

const INITIAL_DATA: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  postcode: "",
  height: "",
  currentWeight: "",
  waistCircumference: "",
  liverDiagnosis: "",
  riskFactors: [],
  metabolicConditions: [],
  lifestyleFactors: [],
  currentMedications: [],
  symptoms: [],
  previousTests: [],
  goals: [],
  howHeard: "",
};

const STEPS = [
  { id: "intro", title: "Welcome" },
  { id: "personal", title: "About You" },
  { id: "physical", title: "Your Body" },
  { id: "diagnosis", title: "Diagnosis" },
  { id: "health", title: "Health History" },
  { id: "symptoms", title: "Symptoms" },
  { id: "goals", title: "Goals" },
  { id: "review", title: "Review" },
];

const LIVER_DIAGNOSES = [
  { id: "nafld", title: "NAFLD (Non-alcoholic fatty liver disease)", desc: "Diagnosed by doctor or scan" },
  { id: "nash", title: "NASH (Non-alcoholic steatohepatitis)", desc: "Fatty liver with inflammation" },
  { id: "elevated_enzymes", title: "Elevated liver enzymes", desc: "Found in blood tests (ALT, AST, GGT)" },
  { id: "suspected", title: "Suspected fatty liver", desc: "Not yet formally diagnosed" },
  { id: "cirrhosis", title: "Cirrhosis or fibrosis", desc: "Liver scarring detected" },
  { id: "none", title: "No diagnosis yet", desc: "Concerned about liver health" },
];

const RISK_FACTORS = [
  "Obesity or overweight",
  "Type 2 diabetes",
  "High cholesterol",
  "High triglycerides",
  "High blood pressure",
  "Family history of liver disease",
  "Family history of diabetes",
  "Sleep apnea",
  "None of these",
];

const METABOLIC_CONDITIONS = [
  "Pre-diabetes",
  "Insulin resistance",
  "Metabolic syndrome",
  "PCOS",
  "Hypothyroidism",
  "Hyperlipidemia",
  "Gout",
  "None of these",
];

const LIFESTYLE_FACTORS = [
  "Sedentary lifestyle",
  "High sugar diet",
  "High processed food intake",
  "Alcohol consumption (any amount)",
  "Irregular eating patterns",
  "Poor sleep quality",
  "High stress",
  "None of these",
];

const MEDICATIONS = [
  "Metformin",
  "Statins (cholesterol medication)",
  "Blood pressure medication",
  "Diabetes medication",
  "Vitamin E supplements",
  "Other liver supplements",
  "None",
];

const SYMPTOMS = [
  "Fatigue",
  "Abdominal discomfort (right side)",
  "Brain fog",
  "Unexplained weight gain",
  "Difficulty losing weight",
  "Dark urine",
  "Yellowing of skin or eyes",
  "Itchy skin",
  "Swelling in legs or abdomen",
  "No symptoms",
];

const PREVIOUS_TESTS = [
  "Ultrasound",
  "FibroScan",
  "CT scan",
  "MRI",
  "Liver biopsy",
  "Blood tests only",
  "None yet",
];

const GOALS = [
  "Reverse fatty liver",
  "Reduce liver inflammation",
  "Improve liver enzyme levels",
  "Lose weight to help liver",
  "Prevent progression to cirrhosis",
  "Understand my condition better",
  "Get a personalised treatment plan",
  "Regular monitoring",
];

export default function FattyLiverAssessmentPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (field: keyof FormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: keyof FormData, item: string) => {
    const current = formData[field] as string[];
    const isSelected = current.includes(item);

    if (item.toLowerCase().includes("none")) {
      updateField(field, isSelected ? [] : [item]);
    } else {
      const filtered = current.filter((i) => !i.toLowerCase().includes("none"));
      updateField(
        field,
        isSelected ? filtered.filter((i) => i !== item) : [...filtered, item]
      );
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const canProceed = (): boolean => {
    switch (STEPS[currentStep].id) {
      case "intro":
        return true;
      case "personal":
        return !!(
          formData.firstName &&
          formData.lastName &&
          formData.email &&
          formData.phone &&
          formData.dateOfBirth &&
          formData.gender
        );
      case "physical":
        return !!(formData.height && formData.currentWeight);
      case "diagnosis":
        return !!formData.liverDiagnosis && formData.riskFactors.length > 0;
      case "health":
        return formData.metabolicConditions.length > 0;
      case "symptoms":
        return formData.symptoms.length > 0;
      case "goals":
        return formData.goals.length > 0;
      case "review":
        return true;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programType: "FATTY_LIVER",
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.userId) {
        localStorage.setItem("intakeUserId", data.userId);
        localStorage.setItem("intakeProgram", "fatty_liver");

        router.push(
          `/payment?userId=${data.userId}&amount=${data.consultationAmount || 4900}&program=fatty_liver`
        );
      } else if (data.existing) {
        setError("An account with this email already exists. Please log in.");
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error("Submission error:", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  // Amber/orange theme for metabolic/liver health
  const themeColors = {
    primary: "#c17a32",
    primaryHover: "#a86628",
    background: "#fdfbf7",
    border: "#f0e6d6",
    accent: "#fef7ed",
    text: "#2c3628",
    textMuted: "#6b7a5f",
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: themeColors.background }}>
      {/* Header */}
      <header
        className="sticky top-0 backdrop-blur-sm z-40"
        style={{
          backgroundColor: `${themeColors.background}f2`,
          borderBottom: `1px solid ${themeColors.border}`
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-serif" style={{ color: "#34412f" }}>
            Sanative
          </Link>
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
            style={{ color: themeColors.primary }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Help</span>
          </button>
        </div>

        {currentStep > 0 && (
          <div className="h-1" style={{ backgroundColor: themeColors.border }}>
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: themeColors.primary }}
            />
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-8 pb-32">
        <div className="animate-fadeIn">
          {/* Step 0: Introduction */}
          {STEPS[currentStep].id === "intro" && (
            <div className="space-y-6">
              <div className="text-center">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  style={{ backgroundColor: themeColors.primary }}
                >
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h1 className="text-3xl sm:text-4xl font-serif" style={{ color: themeColors.text }}>
                  Take control of your liver health
                </h1>
                <p className="mt-4 max-w-md mx-auto" style={{ color: themeColors.textMuted }}>
                  Fatty liver disease is reversible. Let us help you create a personalised plan.
                </p>
              </div>

              <div className="space-y-4 mt-8">
                {[
                  { step: 1, title: "Complete health assessment", desc: "About 5 minutes — covers your history and symptoms." },
                  { step: 2, title: "Doctor review", desc: "An AHPRA-registered doctor reviews your profile." },
                  { step: 3, title: "Personalised plan", desc: "Receive evidence-based treatment recommendations." },
                  { step: 4, title: "Ongoing monitoring", desc: "Track your progress with regular check-ins." },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="bg-white rounded-2xl p-5 flex gap-4"
                    style={{ border: `1px solid ${themeColors.border}` }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: themeColors.accent }}
                    >
                      <span className="font-medium" style={{ color: themeColors.primary }}>{item.step}</span>
                    </div>
                    <div className="flex-1">
                      <span
                        className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: themeColors.accent, color: themeColors.primary }}
                      >
                        Step {item.step}
                      </span>
                      <h3 className="font-semibold mt-1" style={{ color: themeColors.text }}>{item.title}</h3>
                      <p className="text-sm mt-1" style={{ color: themeColors.textMuted }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="rounded-2xl p-4 flex items-start gap-3"
                style={{ backgroundColor: themeColors.accent }}
              >
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: themeColors.primary }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm" style={{ color: themeColors.textMuted }}>
                  <strong style={{ color: themeColors.text }}>Did you know?</strong> Up to 80% of fatty liver cases can be reversed with the right lifestyle changes and medical support.
                </p>
              </div>
            </div>
          )}

          {/* Step 1: Personal Info */}
          {STEPS[currentStep].id === "personal" && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-serif" style={{ color: themeColors.text }}>
                  Let's start with the basics
                </h1>
                <p className="mt-2" style={{ color: themeColors.textMuted }}>
                  This helps us personalise your treatment plan
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                      First name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => updateField("firstName", e.target.value)}
                      className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
                      style={{
                        border: `1px solid ${themeColors.border}`,
                        "--tw-ring-color": themeColors.primary
                      } as React.CSSProperties}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                      Last name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => updateField("lastName", e.target.value)}
                      className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
                      style={{ border: `1px solid ${themeColors.border}` }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                    Email address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
                    style={{ border: `1px solid ${themeColors.border}` }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                    Phone number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
                    style={{ border: `1px solid ${themeColors.border}` }}
                    placeholder="0412 345 678"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                    Date of birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => updateField("dateOfBirth", e.target.value)}
                    className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
                    style={{ border: `1px solid ${themeColors.border}` }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                    Gender
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {["Male", "Female", "Other"].map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => updateField("gender", g.toLowerCase())}
                        className="py-3 px-4 rounded-xl text-center transition-all"
                        style={{
                          backgroundColor: formData.gender === g.toLowerCase() ? themeColors.primary : "white",
                          color: formData.gender === g.toLowerCase() ? "white" : themeColors.text,
                          border: `1px solid ${formData.gender === g.toLowerCase() ? themeColors.primary : themeColors.border}`,
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                    Postcode
                  </label>
                  <input
                    type="text"
                    value={formData.postcode}
                    onChange={(e) => updateField("postcode", e.target.value)}
                    className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
                    style={{ border: `1px solid ${themeColors.border}` }}
                    placeholder="2000"
                    maxLength={4}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Physical */}
          {STEPS[currentStep].id === "physical" && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-serif" style={{ color: themeColors.text }}>
                  About your body
                </h1>
                <p className="mt-2" style={{ color: themeColors.textMuted }}>
                  Body composition is closely linked to liver health
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => updateField("height", e.target.value)}
                    className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
                    style={{ border: `1px solid ${themeColors.border}` }}
                    placeholder="175"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                    Current weight (kg)
                  </label>
                  <input
                    type="number"
                    value={formData.currentWeight}
                    onChange={(e) => updateField("currentWeight", e.target.value)}
                    className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
                    style={{ border: `1px solid ${themeColors.border}` }}
                    placeholder="85"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                    Waist circumference (cm) - optional
                  </label>
                  <input
                    type="number"
                    value={formData.waistCircumference}
                    onChange={(e) => updateField("waistCircumference", e.target.value)}
                    className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2"
                    style={{ border: `1px solid ${themeColors.border}` }}
                    placeholder="90"
                  />
                  <p className="text-xs mt-1" style={{ color: themeColors.textMuted }}>
                    Measure around your belly button. Waist size is a key indicator for fatty liver risk.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Diagnosis */}
          {STEPS[currentStep].id === "diagnosis" && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-serif" style={{ color: themeColors.text }}>
                  Your liver health status
                </h1>
                <p className="mt-2" style={{ color: themeColors.textMuted }}>
                  Tell us about any existing diagnosis
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3" style={{ color: themeColors.text }}>
                    Do you have a liver condition diagnosis?
                  </h3>
                  <div className="space-y-2">
                    {LIVER_DIAGNOSES.map((diagnosis) => (
                      <button
                        key={diagnosis.id}
                        type="button"
                        onClick={() => updateField("liverDiagnosis", diagnosis.id)}
                        className="w-full p-4 rounded-xl text-left transition-all"
                        style={{
                          backgroundColor: formData.liverDiagnosis === diagnosis.id ? themeColors.primary : "white",
                          color: formData.liverDiagnosis === diagnosis.id ? "white" : themeColors.text,
                          border: `1px solid ${formData.liverDiagnosis === diagnosis.id ? themeColors.primary : themeColors.border}`,
                        }}
                      >
                        <h4 className="font-semibold">{diagnosis.title}</h4>
                        <p
                          className="text-sm mt-1"
                          style={{
                            color: formData.liverDiagnosis === diagnosis.id ? "rgba(255,255,255,0.8)" : themeColors.textMuted
                          }}
                        >
                          {diagnosis.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3" style={{ color: themeColors.text }}>
                    Do any of these risk factors apply?
                  </h3>
                  <div className="space-y-2">
                    {RISK_FACTORS.map((factor) => (
                      <button
                        key={factor}
                        type="button"
                        onClick={() => toggleArrayItem("riskFactors", factor)}
                        className="w-full py-3 px-4 rounded-xl text-left transition-all flex items-center justify-between"
                        style={{
                          backgroundColor: formData.riskFactors.includes(factor) ? themeColors.primary : "white",
                          color: formData.riskFactors.includes(factor) ? "white" : themeColors.text,
                          border: `1px solid ${formData.riskFactors.includes(factor) ? themeColors.primary : themeColors.border}`,
                        }}
                      >
                        {factor}
                        {formData.riskFactors.includes(factor) && (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Health History */}
          {STEPS[currentStep].id === "health" && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-serif" style={{ color: themeColors.text }}>
                  Your health history
                </h1>
                <p className="mt-2" style={{ color: themeColors.textMuted }}>
                  Select any conditions that apply
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3" style={{ color: themeColors.text }}>Metabolic conditions</h3>
                  <div className="space-y-2">
                    {METABOLIC_CONDITIONS.map((condition) => (
                      <button
                        key={condition}
                        type="button"
                        onClick={() => toggleArrayItem("metabolicConditions", condition)}
                        className="w-full py-3 px-4 rounded-xl text-left transition-all flex items-center justify-between"
                        style={{
                          backgroundColor: formData.metabolicConditions.includes(condition) ? themeColors.primary : "white",
                          color: formData.metabolicConditions.includes(condition) ? "white" : themeColors.text,
                          border: `1px solid ${formData.metabolicConditions.includes(condition) ? themeColors.primary : themeColors.border}`,
                        }}
                      >
                        {condition}
                        {formData.metabolicConditions.includes(condition) && (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3" style={{ color: themeColors.text }}>Lifestyle factors</h3>
                  <div className="space-y-2">
                    {LIFESTYLE_FACTORS.map((factor) => (
                      <button
                        key={factor}
                        type="button"
                        onClick={() => toggleArrayItem("lifestyleFactors", factor)}
                        className="w-full py-3 px-4 rounded-xl text-left transition-all flex items-center justify-between"
                        style={{
                          backgroundColor: formData.lifestyleFactors.includes(factor) ? themeColors.primary : "white",
                          color: formData.lifestyleFactors.includes(factor) ? "white" : themeColors.text,
                          border: `1px solid ${formData.lifestyleFactors.includes(factor) ? themeColors.primary : themeColors.border}`,
                        }}
                      >
                        {factor}
                        {formData.lifestyleFactors.includes(factor) && (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3" style={{ color: themeColors.text }}>Current medications</h3>
                  <div className="space-y-2">
                    {MEDICATIONS.map((med) => (
                      <button
                        key={med}
                        type="button"
                        onClick={() => toggleArrayItem("currentMedications", med)}
                        className="w-full py-3 px-4 rounded-xl text-left transition-all flex items-center justify-between"
                        style={{
                          backgroundColor: formData.currentMedications.includes(med) ? themeColors.primary : "white",
                          color: formData.currentMedications.includes(med) ? "white" : themeColors.text,
                          border: `1px solid ${formData.currentMedications.includes(med) ? themeColors.primary : themeColors.border}`,
                        }}
                      >
                        {med}
                        {formData.currentMedications.includes(med) && (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Symptoms */}
          {STEPS[currentStep].id === "symptoms" && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-serif" style={{ color: themeColors.text }}>
                  Current symptoms
                </h1>
                <p className="mt-2" style={{ color: themeColors.textMuted }}>
                  Select any symptoms you're experiencing
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3" style={{ color: themeColors.text }}>Symptoms</h3>
                  <div className="space-y-2">
                    {SYMPTOMS.map((symptom) => (
                      <button
                        key={symptom}
                        type="button"
                        onClick={() => toggleArrayItem("symptoms", symptom)}
                        className="w-full py-3 px-4 rounded-xl text-left transition-all flex items-center justify-between"
                        style={{
                          backgroundColor: formData.symptoms.includes(symptom) ? themeColors.primary : "white",
                          color: formData.symptoms.includes(symptom) ? "white" : themeColors.text,
                          border: `1px solid ${formData.symptoms.includes(symptom) ? themeColors.primary : themeColors.border}`,
                        }}
                      >
                        {symptom}
                        {formData.symptoms.includes(symptom) && (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-3" style={{ color: themeColors.text }}>Previous liver tests</h3>
                  <div className="space-y-2">
                    {PREVIOUS_TESTS.map((test) => (
                      <button
                        key={test}
                        type="button"
                        onClick={() => toggleArrayItem("previousTests", test)}
                        className="w-full py-3 px-4 rounded-xl text-left transition-all flex items-center justify-between"
                        style={{
                          backgroundColor: formData.previousTests.includes(test) ? themeColors.primary : "white",
                          color: formData.previousTests.includes(test) ? "white" : themeColors.text,
                          border: `1px solid ${formData.previousTests.includes(test) ? themeColors.primary : themeColors.border}`,
                        }}
                      >
                        {test}
                        {formData.previousTests.includes(test) && (
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Goals */}
          {STEPS[currentStep].id === "goals" && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-serif" style={{ color: themeColors.text }}>
                  What are your goals?
                </h1>
                <p className="mt-2" style={{ color: themeColors.textMuted }}>
                  Select all that apply
                </p>
              </div>

              <div className="space-y-2">
                {GOALS.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => toggleArrayItem("goals", goal)}
                    className="w-full py-3 px-4 rounded-xl text-left transition-all flex items-center justify-between"
                    style={{
                      backgroundColor: formData.goals.includes(goal) ? themeColors.primary : "white",
                      color: formData.goals.includes(goal) ? "white" : themeColors.text,
                      border: `1px solid ${formData.goals.includes(goal) ? themeColors.primary : themeColors.border}`,
                    }}
                  >
                    {goal}
                    {formData.goals.includes(goal) && (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium mb-1" style={{ color: themeColors.text }}>
                  How did you hear about us?
                </label>
                <select
                  value={formData.howHeard}
                  onChange={(e) => updateField("howHeard", e.target.value)}
                  className="w-full rounded-xl px-4 py-3 focus:outline-none focus:ring-2 bg-white"
                  style={{ border: `1px solid ${themeColors.border}` }}
                >
                  <option value="">Select an option</option>
                  <option value="google">Google</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="doctor">Doctor referral</option>
                  <option value="friend">Friend or family</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 7: Review */}
          {STEPS[currentStep].id === "review" && (
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl sm:text-3xl font-serif" style={{ color: themeColors.text }}>
                  Review your information
                </h1>
                <p className="mt-2" style={{ color: themeColors.textMuted }}>
                  Please check everything is correct
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${themeColors.border}` }}>
                  <h3 className="font-medium mb-2" style={{ color: themeColors.text }}>Personal Details</h3>
                  <p className="text-sm" style={{ color: themeColors.textMuted }}>
                    {formData.firstName} {formData.lastName}<br />
                    {formData.email}<br />
                    {formData.phone}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${themeColors.border}` }}>
                  <h3 className="font-medium mb-2" style={{ color: themeColors.text }}>Liver Status</h3>
                  <p className="text-sm" style={{ color: themeColors.textMuted }}>
                    {LIVER_DIAGNOSES.find(d => d.id === formData.liverDiagnosis)?.title || "Not specified"}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${themeColors.border}` }}>
                  <h3 className="font-medium mb-2" style={{ color: themeColors.text }}>Risk Factors</h3>
                  <p className="text-sm" style={{ color: themeColors.textMuted }}>
                    {formData.riskFactors.filter(r => r !== "None of these").join(", ") || "None reported"}
                  </p>
                </div>

                <div className="bg-white rounded-xl p-4" style={{ border: `1px solid ${themeColors.border}` }}>
                  <h3 className="font-medium mb-2" style={{ color: themeColors.text }}>Goals</h3>
                  <p className="text-sm" style={{ color: themeColors.textMuted }}>
                    {formData.goals.join(", ")}
                  </p>
                </div>

                <div className="rounded-xl p-4" style={{ backgroundColor: themeColors.accent }}>
                  <h3 className="font-medium mb-2" style={{ color: themeColors.text }}>Consultation Fee</h3>
                  <p className="text-2xl font-semibold" style={{ color: themeColors.primary }}>$49 AUD</p>
                  <p className="text-sm mt-1" style={{ color: themeColors.textMuted }}>
                    Includes doctor review and personalised liver health plan.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer navigation */}
      <div
        className="fixed bottom-0 left-0 right-0 bg-white p-4"
        style={{ borderTop: `1px solid ${themeColors.border}` }}
      >
        <div className="max-w-2xl mx-auto flex gap-3">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={prevStep}
              className="px-6 py-4 font-medium rounded-xl transition-colors"
              style={{
                border: `1px solid ${themeColors.border}`,
                color: themeColors.primary,
              }}
            >
              Back
            </button>
          )}

          {currentStep < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex-1 py-4 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                backgroundColor: themeColors.primary,
                color: "white",
              }}
            >
              {currentStep === 0 ? "Begin assessment" : "Continue"}
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 py-4 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                backgroundColor: themeColors.primary,
                color: "white",
              }}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  Proceed to payment
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
