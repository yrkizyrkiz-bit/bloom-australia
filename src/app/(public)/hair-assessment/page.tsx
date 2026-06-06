"use client";

import { useState, useEffect } from "react";
import { scoreHairLoss, fetchBiomarkerCampaigns, type BiomarkerCampaignData } from "@/lib/biomarkerScoring";
import { BiomarkerSnapshot } from "@/components/quiz/BiomarkerSnapshot";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronDown,
  Shield,
  Truck,
  MessageCircle,
  Clock,
  X,
  Info,
  Sparkles,
  Leaf,
  Stethoscope,
  Package,
} from "lucide-react";

// Types
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: "male" | "female" | "";
  hairStage: string;
  hairLossTimeline: string;
  familyHistory: string;
  medicalConditions: string[];
  pregnancyStatus: string;
  otherConcerns: string[];
  postcode: string;
  howHeard: string;
}

// Hair stages for men (Norwood scale)
const maleHairStages = [
  { id: "not-sure", label: "I'm not sure yet", description: "That's okay — we'll help figure it out" },
  { id: "stage-1", label: "Early signs", description: "Hairline starting to shift slightly" },
  { id: "stage-2", label: "Noticeable recession", description: "Temples becoming more visible" },
  { id: "stage-3", label: "Moderate recession", description: "Clear M-shaped hairline forming" },
  { id: "stage-4", label: "Crown thinning", description: "Top of head showing through" },
  { id: "stage-5", label: "Advanced thinning", description: "Front and crown areas connecting" },
  { id: "stage-6", label: "Extensive loss", description: "Hair mainly on sides and back" },
];

// Hair stages for women (Ludwig scale)
const femaleHairStages = [
  { id: "not-sure", label: "I'm not sure yet", description: "We'll help you identify it" },
  { id: "type-1", label: "Early thinning", description: "Part line slightly wider than before" },
  { id: "type-2", label: "Noticeable thinning", description: "Scalp visible through hair" },
  { id: "type-3", label: "Significant thinning", description: "Widespread visibility on crown" },
];

const timelineOptions = [
  "Just in the last few months",
  "Gradually over the past year",
  "Sudden patches appearing",
  "Rapid loss recently",
  "Slowly over many years",
];

const medicalConditions = [
  "Blood pressure concerns",
  "Dizziness or lightheadedness",
  "Heart rhythm issues",
  "Thyroid condition",
  "PCOS (women only)",
  "Autoimmune condition",
  "None of these apply to me",
];

const otherConcernsOptions = [
  { id: "weight", label: "Weight management" },
  { id: "hormones", label: "Hormone optimisation" },
  { id: "energy", label: "Energy & vitality" },
  { id: "sleep", label: "Sleep quality" },
  { id: "none", label: "Just hair health for now" },
];

const howHeardOptions = [
  "Search engine",
  "Instagram",
  "Facebook",
  "TikTok",
  "YouTube",
  "Word of mouth",
  "My doctor",
  "Podcast",
  "Article or blog",
  "Somewhere else",
];

export default function HairAssessmentPage() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    hairStage: "",
    hairLossTimeline: "",
    familyHistory: "",
    medicalConditions: [],
    pregnancyStatus: "",
    otherConcerns: [],
    postcode: "",
    howHeard: "",
  });
  const [showFAQ, setShowFAQ] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<BiomarkerCampaignData[]>([]);

  // Fetch biomarker campaigns on mount
  useEffect(() => {
    fetchBiomarkerCampaigns('HAIR_LOSS').then(setCampaigns);
  }, []);

  // Total steps (dynamic based on gender)
  const totalSteps = formData.gender === "female" ? 12 : 11;
  const progress = ((step + 1) / totalSteps) * 100;

  const updateFormData = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (field: "medicalConditions" | "otherConcerns", value: string) => {
    setFormData(prev => {
      const current = prev[field];
      if (value === "None of these apply to me" || value === "Just hair health for now") {
        return { ...prev, [field]: current.includes(value) ? [] : [value] };
      }
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(v => v !== value) };
      }
      return { ...prev, [field]: [...current.filter(v => v !== "None of these apply to me" && v !== "Just hair health for now"), value] };
    });
  };

  // Calculate age from DOB
  const getAge = (dob: string): number => {
    if (dob.length < 10) return 0;
    const [day, month, year] = dob.split("/").map(Number);
    if (!day || !month || !year || year < 1900) return 0;
    const birthDate = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = getAge(formData.dateOfBirth);
  const isValidAge = age >= 18;

  const canProceed = () => {
    switch (step) {
      case 0: return true;
      case 1: return formData.firstName.trim() && formData.lastName.trim();
      case 2: return formData.email.includes("@") && formData.email.includes(".");
      case 3: return true;
      case 4: return formData.dateOfBirth.length === 10 && isValidAge;
      case 5: return formData.gender !== "";
      case 6: return formData.hairStage !== "";
      case 7: return formData.hairLossTimeline !== "";
      case 8: return formData.familyHistory !== "";
      case 9: return formData.medicalConditions.length > 0;
      case 10:
        if (formData.gender === "female") return formData.pregnancyStatus !== "";
        return formData.otherConcerns.length > 0;
      case 11:
        if (formData.gender === "female") return formData.otherConcerns.length > 0;
        return formData.postcode.length >= 4;
      case 12: return formData.postcode.length >= 4;
      default: return true;
    }
  };

  const nextStep = () => {
    if (canProceed() && step < totalSteps) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      // STEP 1: Send assessment data to portal — create patient record
      const intakeResponse = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programType: "HAIR_LOSS",
          ...formData,
        }),
      });

      if (!intakeResponse.ok) {
        const err = await intakeResponse.json().catch(() => ({}));
        throw new Error(err.error || "Failed to create patient record. Please try again.");
      }

      const { userId: newUserId } = await intakeResponse.json();
      setUserId(newUserId);

      // STEP 2: Create Stripe PaymentIntent for $49 consultation fee
      const stripeResponse = await fetch("/api/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 4900, // $49.00 AUD in cents
          userId: newUserId,
          program: "hair_loss",
        }),
      });

      if (!stripeResponse.ok) {
        throw new Error("Payment setup failed. Please try again.");
      }

      const { clientSecret } = await stripeResponse.json();

      // STEP 3: Redirect to payment page with client secret
      if (clientSecret) {
        sessionStorage.setItem("paymentClientSecret", clientSecret);
        sessionStorage.setItem("paymentUserId", newUserId);
        sessionStorage.setItem("paymentProgram", "hair_loss");
        window.location.href = `/payment?program=hair_loss`;
      }

      setStep(totalSteps);

    } catch (error: unknown) {
      console.error("Submission error:", error);
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setSubmissionError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      // Step 0: Your journey
      case 0:
        return (
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628] text-center">
              Your path to healthier hair
            </h1>
            <p className="text-center text-[#5c7a52]">Here's what to expect</p>

            <div className="space-y-4 mt-8">
              {[
                {
                  num: 1,
                  title: "Quick health check",
                  description: "A few questions about your health and hair goals — takes under 5 minutes.",
                  icon: Leaf,
                },
                {
                  num: 2,
                  title: "Book your consultation",
                  description: "Secure your spot with one of our practitioners. Full refund if treatment isn't right for you.",
                  icon: Stethoscope,
                },
                {
                  num: 3,
                  title: "Speak with your practitioner",
                  description: "A personalised call to understand your situation and create your treatment plan.",
                  icon: MessageCircle,
                },
                {
                  num: 4,
                  title: "Receive your treatment",
                  description: "Discreet packaging, free express shipping Australia-wide.",
                  icon: Package,
                },
              ].map((item) => (
                <div key={item.num} className="bg-white rounded-2xl p-5 border border-[#e6ebe3] flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#5c7a52]/10 text-[#5c7a52] flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#5c7a52] bg-[#e6ebe3] px-2 py-0.5 rounded-full">Step {item.num}</span>
                    </div>
                    <h3 className="font-semibold text-[#2c3628] mt-1">{item.title}</h3>
                    <p className="text-sm text-[#5c7a52] mt-1">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      // Step 1: Name
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
                First, what should we call you?
              </h1>
              <p className="mt-3 text-[#5c7a52]">
                Your legal name is needed for prescriptions — we keep it private.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-8">
              <div>
                <label className="block text-sm font-medium text-[#2c3628] mb-2">
                  First name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => updateFormData("firstName", e.target.value)}
                  className="w-full px-4 py-4 rounded-xl border border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 outline-none transition-all bg-white"
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2c3628] mb-2">
                  Last name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => updateFormData("lastName", e.target.value)}
                  className="w-full px-4 py-4 rounded-xl border border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 outline-none transition-all bg-white"
                  placeholder="Enter last name"
                />
              </div>
            </div>
          </div>
        );

      // Step 2: Email
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
                Where can we reach you?
              </h1>
              <p className="mt-3 text-[#5c7a52]">
                We'll send your consultation details and treatment updates here.
              </p>
            </div>

            <div className="space-y-4 mt-8">
              <div>
                <label className="block text-sm font-medium text-[#2c3628] mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData("email", e.target.value)}
                  className="w-full px-4 py-4 rounded-xl border border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 outline-none transition-all bg-white"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <p className="text-center text-sm text-[#7e9a72]">
              Returning patient?{" "}
              <Link href="/login" className="text-[#5c7a52] underline font-medium">
                Sign in instead
              </Link>
            </p>
          </div>
        );

      // Step 3: Assessment intro
      case 3:
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#5c7a52] to-[#34412f] rounded-2xl flex items-center justify-center rotate-3">
              <Leaf className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
              Now, a few health questions
            </h1>
            <p className="text-[#5c7a52] max-w-md mx-auto">
              This helps our practitioners recommend the most effective treatment for your specific situation.
            </p>
          </div>
        );

      // Step 4: Date of birth
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
                When were you born?
              </h1>
              <p className="mt-3 text-[#5c7a52]">
                Age affects treatment options — this helps us personalise yours.
              </p>
            </div>

            <div className="mt-8">
              <div className="flex gap-3 justify-center">
                <div className="w-20">
                  <label className="block text-xs text-[#7e9a72] mb-1 text-center">Day</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={formData.dateOfBirth.split("/")[0] || ""}
                    onChange={(e) => {
                      const day = e.target.value.replace(/\D/g, "").slice(0, 2);
                      const parts = formData.dateOfBirth.split("/");
                      const month = parts[1] || "";
                      const year = parts[2] || "";
                      updateFormData("dateOfBirth", `${day}/${month}/${year}`);
                      if (day.length === 2) {
                        (document.getElementById("dob-month") as HTMLInputElement)?.focus();
                      }
                    }}
                    className={`w-full px-3 py-4 rounded-xl border focus:ring-2 outline-none transition-all text-center text-lg bg-white ${
                      formData.dateOfBirth.length === 10 && !isValidAge
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                        : "border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-[#5c7a52]/20"
                    }`}
                    placeholder="DD"
                    maxLength={2}
                  />
                </div>
                <div className="w-20">
                  <label className="block text-xs text-[#7e9a72] mb-1 text-center">Month</label>
                  <input
                    id="dob-month"
                    type="text"
                    inputMode="numeric"
                    value={formData.dateOfBirth.split("/")[1] || ""}
                    onChange={(e) => {
                      const month = e.target.value.replace(/\D/g, "").slice(0, 2);
                      const parts = formData.dateOfBirth.split("/");
                      const day = parts[0] || "";
                      const year = parts[2] || "";
                      updateFormData("dateOfBirth", `${day}/${month}/${year}`);
                      if (month.length === 2) {
                        (document.getElementById("dob-year") as HTMLInputElement)?.focus();
                      }
                    }}
                    className={`w-full px-3 py-4 rounded-xl border focus:ring-2 outline-none transition-all text-center text-lg bg-white ${
                      formData.dateOfBirth.length === 10 && !isValidAge
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                        : "border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-[#5c7a52]/20"
                    }`}
                    placeholder="MM"
                    maxLength={2}
                  />
                </div>
                <div className="w-28">
                  <label className="block text-xs text-[#7e9a72] mb-1 text-center">Year</label>
                  <input
                    id="dob-year"
                    type="text"
                    inputMode="numeric"
                    value={formData.dateOfBirth.split("/")[2] || ""}
                    onChange={(e) => {
                      const year = e.target.value.replace(/\D/g, "").slice(0, 4);
                      const parts = formData.dateOfBirth.split("/");
                      const day = parts[0] || "";
                      const month = parts[1] || "";
                      updateFormData("dateOfBirth", `${day}/${month}/${year}`);
                    }}
                    className={`w-full px-3 py-4 rounded-xl border focus:ring-2 outline-none transition-all text-center text-lg bg-white ${
                      formData.dateOfBirth.length === 10 && !isValidAge
                        ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                        : "border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-[#5c7a52]/20"
                    }`}
                    placeholder="YYYY"
                    maxLength={4}
                  />
                </div>
              </div>
              {formData.dateOfBirth.length === 10 && !isValidAge && (
                <p className="mt-4 text-sm text-red-600 text-center">
                  You must be 18 or older to use this service. Please speak with your GP for advice.
                </p>
              )}
              {formData.dateOfBirth.length === 10 && isValidAge && (
                <p className="mt-4 text-sm text-[#5c7a52] text-center">
                  Great, you're {age} years old.
                </p>
              )}
            </div>
          </div>
        );

      // Step 5: Gender
      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
                What's your biological sex?
              </h1>
              <p className="mt-3 text-[#5c7a52]">
                Hair loss presents differently — this ensures accurate treatment.
              </p>
            </div>

            <div className="space-y-3 mt-8">
              {[
                { value: "male", label: "Male" },
                { value: "female", label: "Female" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    updateFormData("gender", option.value as "male" | "female");
                    setTimeout(nextStep, 300);
                  }}
                  className={`w-full py-4 px-6 rounded-xl border-2 text-center font-medium transition-all ${
                    formData.gender === option.value
                      ? "border-[#5c7a52] bg-[#5c7a52]/10 text-[#2c3628]"
                      : "border-[#e6ebe3] bg-white text-[#2c3628] hover:border-[#cdd8c6]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );

      // Step 6: Hair stage
      case 6:
        const stages = formData.gender === "female" ? femaleHairStages : maleHairStages;
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
                How would you describe your hair right now?
              </h1>
            </div>

            <div className="space-y-3 mt-8 max-h-[55vh] overflow-y-auto pr-2">
              {stages.map((stage) => (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => {
                    updateFormData("hairStage", stage.id);
                    setTimeout(nextStep, 300);
                  }}
                  className={`w-full py-4 px-5 rounded-xl border-2 text-left transition-all ${
                    formData.hairStage === stage.id
                      ? "border-[#5c7a52] bg-[#5c7a52]/10"
                      : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"
                  }`}
                >
                  <span className="font-medium text-[#2c3628]">{stage.label}</span>
                  {stage.description && (
                    <span className="block text-sm text-[#7e9a72] mt-0.5">{stage.description}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      // Step 7: Timeline
      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
                When did you start noticing changes?
              </h1>
            </div>

            <div className="space-y-3 mt-8">
              {timelineOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    updateFormData("hairLossTimeline", option);
                    setTimeout(nextStep, 300);
                  }}
                  className={`w-full py-4 px-6 rounded-xl border-2 text-center transition-all ${
                    formData.hairLossTimeline === option
                      ? "border-[#5c7a52] bg-[#5c7a52]/10 text-[#2c3628]"
                      : "border-[#e6ebe3] bg-white text-[#2c3628] hover:border-[#cdd8c6]"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        );

      // Step 8: Family history
      case 8:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
                Any hair loss in your family?
              </h1>
              <p className="mt-3 text-[#5c7a52]">
                Genetics play a role — but they're not the whole story.
              </p>
            </div>

            <div className="space-y-3 mt-8">
              {[
                { value: "Yes", label: "Yes, on one or both sides" },
                { value: "No", label: "No, not that I know of" },
                { value: "Unsure", label: "I'm not really sure" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    updateFormData("familyHistory", option.value);
                    setTimeout(nextStep, 300);
                  }}
                  className={`w-full py-4 px-6 rounded-xl border-2 text-center transition-all ${
                    formData.familyHistory === option.value
                      ? "border-[#5c7a52] bg-[#5c7a52]/10 text-[#2c3628]"
                      : "border-[#e6ebe3] bg-white text-[#2c3628] hover:border-[#cdd8c6]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );

      // Step 9: Medical conditions
      case 9:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
                Any health conditions we should know about?
              </h1>
              <p className="mt-3 text-[#5c7a52]">
                Select all that apply — this keeps you safe.
              </p>
            </div>

            <div className="space-y-3 mt-8">
              {medicalConditions
                .filter(c => formData.gender === "male" ? c !== "PCOS (women only)" : true)
                .map((condition) => (
                <button
                  key={condition}
                  type="button"
                  onClick={() => toggleArrayField("medicalConditions", condition)}
                  className={`w-full py-4 px-5 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${
                    formData.medicalConditions.includes(condition)
                      ? "border-[#5c7a52] bg-[#5c7a52]/10"
                      : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    formData.medicalConditions.includes(condition)
                      ? "border-[#5c7a52] bg-[#5c7a52]"
                      : "border-[#cdd8c6]"
                  }`}>
                    {formData.medicalConditions.includes(condition) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-[#2c3628]">{condition}</span>
                </button>
              ))}
            </div>
          </div>
        );

      // Step 10: Pregnancy (women) or Other concerns (men)
      case 10:
        if (formData.gender === "female") {
          return (
            <div className="space-y-6">
              <div className="text-center">
                <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
                  Are you currently pregnant or planning to be?
                </h1>
                <p className="mt-3 text-[#5c7a52]">
                  Some treatments aren't suitable during pregnancy.
                </p>
              </div>

              <div className="space-y-3 mt-8">
                {[
                  { value: "No", label: "No, neither" },
                  { value: "Yes", label: "Yes, one or both" },
                  { value: "Maybe", label: "Possibly" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      updateFormData("pregnancyStatus", option.value);
                      setTimeout(nextStep, 300);
                    }}
                    className={`w-full py-4 px-6 rounded-xl border-2 text-center transition-all ${
                      formData.pregnancyStatus === option.value
                        ? "border-[#5c7a52] bg-[#5c7a52]/10 text-[#2c3628]"
                        : "border-[#e6ebe3] bg-white text-[#2c3628] hover:border-[#cdd8c6]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          );
        }
        return renderOtherConcerns();

      // Step 11: Other concerns (women) or Postcode (men)
      case 11:
        if (formData.gender === "female") {
          return renderOtherConcerns();
        }
        return renderPostcode();

      // Step 12: Postcode (women only)
      case 12:
        return renderPostcode();

      default:
        // Final step: Show biomarker snapshot
        const risks = scoreHairLoss(formData as unknown as Record<string, unknown>, campaigns);
        return (
          <BiomarkerSnapshot
            risks={risks}
            primaryProgram="Hair Loss Program"
            primaryPrice="$79/mo"
            firstName={formData.firstName}
            onPrimary={handleSubmit}
            onLabs={() => window.location.href = '/labs'}
          />
        );
    }
  };

  const renderOtherConcerns = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
          Anything else on your health radar?
        </h1>
        <p className="mt-3 text-[#5c7a52]">
          We offer support across multiple areas — let us know what interests you.
        </p>
      </div>

      <div className="space-y-3 mt-8">
        {otherConcernsOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => toggleArrayField("otherConcerns", option.label)}
            className={`w-full py-4 px-5 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${
              formData.otherConcerns.includes(option.label)
                ? "border-[#5c7a52] bg-[#5c7a52]/10"
                : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"
            }`}
          >
            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
              formData.otherConcerns.includes(option.label)
                ? "border-[#5c7a52] bg-[#5c7a52]"
                : "border-[#cdd8c6]"
            }`}>
              {formData.otherConcerns.includes(option.label) && (
                <Check className="w-3 h-3 text-white" />
              )}
            </div>
            <span className="text-[#2c3628]">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderPostcode = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
          Almost there! Your postcode?
        </h1>
        <p className="mt-3 text-[#5c7a52]">
          Just checking we can deliver to your area.
        </p>
      </div>

      <div className="mt-8">
        <input
          type="text"
          value={formData.postcode}
          onChange={(e) => updateFormData("postcode", e.target.value.replace(/\D/g, "").slice(0, 4))}
          className="w-full px-4 py-4 rounded-xl border border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 outline-none transition-all text-center text-lg bg-white"
          placeholder="e.g. 2000"
          maxLength={4}
        />
      </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#5c7a52] to-[#34412f] rounded-2xl flex items-center justify-center">
        <Check className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
        Great news — you're a good candidate
      </h1>
      <p className="text-[#5c7a52] max-w-md mx-auto">
        Book your consultation below. Your practitioner will create a personalised plan, and treatment can arrive within days.
      </p>

      <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3] text-left mt-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#5c7a52] flex items-center justify-center">
            <Check className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-[#2c3628]">Your consultation</span>
        </div>

        <div className="flex items-center gap-4 py-4 border-y border-[#e6ebe3]">
          <div className="w-14 h-14 bg-gradient-to-br from-[#e6ebe3] to-[#cdd8c6] rounded-xl flex items-center justify-center">
            <Leaf className="w-7 h-7 text-[#5c7a52]" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-[#2c3628]">Hair Health Consultation</h4>
            <p className="text-sm text-[#7e9a72]">AHPRA-registered practitioner</p>
          </div>
          <span className="font-semibold text-[#2c3628]">$20</span>
        </div>

        <div className="pt-4 space-y-2.5 text-sm">
          <p className="font-medium text-[#2c3628]">What you'll get:</p>
          {[
            "Tailored treatment recommendation",
            "Express shipping, always free",
            "Ongoing practitioner support",
            "180-day satisfaction guarantee",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2.5 text-[#5c7a52]">
              <Check className="w-4 h-4 text-[#5c7a52] flex-shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-[#e6ebe3] text-xs text-[#7e9a72]">
          If treatment isn't right for you, we'll refund the consultation fee in full.
        </div>
      </div>

      <div className="space-y-4 mt-6">
        <div>
          <label className="block text-sm font-medium text-[#2c3628] mb-2 text-left">
            Mobile number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => updateFormData("phone", e.target.value)}
            className="w-full px-4 py-4 rounded-xl border border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 outline-none transition-all bg-white"
            placeholder="04XX XXX XXX"
          />
          <p className="text-xs text-[#7e9a72] mt-2 text-left">
            Your practitioner will call you on this number.
          </p>
        </div>

        <p className="text-xs text-[#7e9a72] text-left">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="underline">Terms</Link> and{" "}
          <Link href="/privacy" className="underline">Privacy Policy</Link>.
        </p>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !formData.phone}
          className="w-full py-4 bg-[#5c7a52] text-white font-medium rounded-xl hover:bg-[#4a6343] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Booking...
            </>
          ) : (
            <>
              Book consultation — $20
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#e6ebe3] z-50">
        <div
          className="h-full bg-[#5c7a52] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 bg-[#fdfbf7]/95 backdrop-blur-sm z-40 border-b border-[#e6ebe3]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-serif text-[#34412f]">
            Sanative
          </Link>
          <button
            type="button"
            onClick={() => setShowFAQ(true)}
            className="flex items-center gap-1.5 text-sm text-[#5c7a52] hover:text-[#34412f] transition-colors"
          >
            <Info className="w-4 h-4" />
            <span>Help</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-8 pb-32">
        <div className="animate-fadeIn">
          {renderStep()}
        </div>
      </main>

      {/* Bottom navigation */}
      {step < totalSteps && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e6ebe3] p-4">
          <div className="max-w-2xl mx-auto flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-5 py-4 rounded-xl border border-[#cdd8c6] text-[#5c7a52] font-medium hover:bg-[#f4f7f2] transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={nextStep}
              disabled={!canProceed()}
              className="flex-1 py-4 bg-[#5c7a52] text-white font-medium rounded-xl hover:bg-[#4a6343] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {step === 0 ? "Let's begin" : "Continue"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      {showFAQ && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-[#e6ebe3] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-[#5c7a52]" />
                <span className="font-semibold text-[#2c3628]">Common questions</span>
              </div>
              <button
                type="button"
                onClick={() => setShowFAQ(false)}
                className="p-2 hover:bg-[#f4f7f2] rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-[#5c7a52]" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h4 className="font-semibold text-[#2c3628] mb-2">What treatments do you offer?</h4>
                <p className="text-sm text-[#5c7a52]">
                  We offer clinically-proven hair loss treatments tailored to your specific needs. Your practitioner will explain all options during your consultation, including any potential side effects.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-[#2c3628] mb-2">How long until I see results?</h4>
                <p className="text-sm text-[#5c7a52]">
                  Most patients notice reduced shedding within 2-3 months, with visible regrowth appearing around 4-6 months. We offer a 180-day guarantee if you're not satisfied.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-[#2c3628] mb-2">What if I'm not suitable?</h4>
                <p className="text-sm text-[#5c7a52]">
                  If our practitioners determine treatment isn't right for you, or if you simply change your mind after your consultation, we'll refund your consultation fee completely.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-[#2c3628] mb-2">Is my information secure?</h4>
                <p className="text-sm text-[#5c7a52]">
                  Absolutely. All health information is encrypted and stored securely. We never share your data with third parties without your explicit consent.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
