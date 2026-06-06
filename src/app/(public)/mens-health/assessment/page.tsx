"use client";

import { useState, Suspense, useEffect } from "react";
import { scoreMensHealth, fetchBiomarkerCampaigns, type BiomarkerCampaignData } from "@/lib/biomarkerScoring";
import { BiomarkerSnapshot } from "@/components/quiz/BiomarkerSnapshot";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Shield,
  MessageCircle,
  X,
  Info,
  Heart,
  Stethoscope,
  Package,
  AlertCircle,
  CreditCard,
  Tag,
  User,
  FileText,
  Wallet,
} from "lucide-react";

// Types
interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  confirmEmail: string;
  phone: string;
  dateOfBirth: string;
  concern: string;
  edDuration: string;
  edSeverity: string;
  erectionDifficulty: string;
  morningErections: string;
  edCauses: string[];
  medicalConditions: string[];
  takingNitrates: string;
  lifestyleFactors: string[];
  previousTreatment: string;
  treatmentGoal: string;
  otherConcerns: string[];
  postcode: string;
  discountCode: string;
  confirmedAccurate: boolean;
  agreedToTerms: boolean;
  // Card payment fields
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  cardName: string;
}

// ED Duration options
const edDurationOptions = [
  { id: "less-3-months", label: "Less than 3 months", description: "Recently started noticing issues" },
  { id: "3-6-months", label: "3 to 6 months", description: "Happening for a few months now" },
  { id: "6-12-months", label: "6 to 12 months", description: "About half a year to a year" },
  { id: "1-2-years", label: "1 to 2 years", description: "Been dealing with this for a while" },
  { id: "more-2-years", label: "More than 2 years", description: "Long-standing concern" },
];

// ED Severity options
const edSeverityOptions = [
  { id: "mild", label: "Mild", description: "Occasional difficulties, mostly manageable" },
  { id: "moderate", label: "Moderate", description: "Frequent difficulties affecting confidence" },
  { id: "severe", label: "Severe", description: "Persistent problems most or all of the time" },
];

// Erection difficulty type
const erectionDifficultyOptions = [
  { id: "getting", label: "Difficulty getting an erection", description: "Hard to achieve initial erection" },
  { id: "maintaining", label: "Difficulty maintaining an erection", description: "Can get erect but it doesn't last" },
  { id: "both", label: "Both getting and maintaining", description: "Issues with both achieving and keeping" },
  { id: "inconsistent", label: "It varies", description: "Sometimes works, sometimes doesn't" },
];

// Morning erections
const morningErectionOptions = [
  { id: "regularly", label: "Yes, regularly", description: "Most mornings or several times a week" },
  { id: "sometimes", label: "Sometimes", description: "Occasionally, but less than before" },
  { id: "rarely", label: "Rarely or never", description: "Very infrequent or not at all" },
  { id: "not-sure", label: "I'm not sure", description: "Haven't really noticed" },
];

// Potential causes
const edCausesOptions = [
  { id: "stress", label: "Stress or anxiety" },
  { id: "relationship", label: "Relationship issues" },
  { id: "performance-anxiety", label: "Performance anxiety" },
  { id: "depression", label: "Depression or low mood" },
  { id: "medical", label: "Medical condition" },
  { id: "medication", label: "Side effect of medication" },
  { id: "lifestyle", label: "Lifestyle factors (sleep, diet, exercise)" },
  { id: "unsure", label: "I'm not sure" },
];

// Medical conditions relevant to ED
const medicalConditionsOptions = [
  { id: "heart-disease", label: "Heart disease or heart condition", warning: true },
  { id: "high-bp", label: "High blood pressure", warning: false },
  { id: "low-bp", label: "Low blood pressure", warning: true },
  { id: "diabetes", label: "Diabetes (Type 1 or 2)", warning: false },
  { id: "high-cholesterol", label: "High cholesterol", warning: false },
  { id: "prostate", label: "Prostate problems or surgery", warning: false },
  { id: "stroke", label: "Previous stroke", warning: true },
  { id: "none", label: "None of these apply to me", warning: false },
];

// Lifestyle factors
const lifestyleFactorsOptions = [
  { id: "smoking", label: "I smoke or vape" },
  { id: "heavy-drinking", label: "I drink alcohol regularly (10+ drinks/week)" },
  { id: "recreational-drugs", label: "I use recreational drugs" },
  { id: "poor-sleep", label: "I don't sleep well" },
  { id: "sedentary", label: "I'm not very physically active" },
  { id: "overweight", label: "I'm overweight" },
  { id: "none", label: "None of these apply" },
];

// Treatment goals
const treatmentGoalOptions = [
  { id: "occasional", label: "For occasional use", description: "When I need it for specific occasions" },
  { id: "regular", label: "For regular intimacy", description: "Want reliable, ongoing confidence" },
  { id: "spontaneous", label: "Maximum spontaneity", description: "Want to be ready anytime" },
  { id: "explore", label: "Want to explore options", description: "Not sure yet, need guidance" },
];

// Previous treatment options
const previousTreatmentOptions = [
  { id: "viagra", label: "Sildenafil (Viagra)" },
  { id: "cialis", label: "Tadalafil (Cialis)" },
  { id: "other-prescription", label: "Other prescription medication" },
  { id: "supplements", label: "Natural supplements or herbal remedies" },
  { id: "none", label: "No, I haven't tried anything yet" },
];

// Other concerns options
const otherConcernsOptions = [
  { id: "hair-loss", label: "Hair Loss" },
  { id: "weight", label: "Weight Management" },
  { id: "premature-ejaculation", label: "Premature Ejaculation" },
  { id: "energy", label: "Energy & Vitality" },
  { id: "none", label: "No, I'm only interested in this treatment" },
];

function AssessmentContent() {
  const searchParams = useSearchParams();
  const concernParam = searchParams.get("concern") || "erectile-dysfunction";

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    confirmEmail: "",
    phone: "",
    dateOfBirth: "",
    concern: concernParam,
    edDuration: "",
    edSeverity: "",
    erectionDifficulty: "",
    morningErections: "",
    edCauses: [],
    medicalConditions: [],
    takingNitrates: "",
    lifestyleFactors: [],
    previousTreatment: "",
    treatmentGoal: "",
    otherConcerns: [],
    postcode: "",
    discountCode: "",
    confirmedAccurate: false,
    agreedToTerms: false,
    // Card payment fields
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
    cardName: "",
  });
  const [showFAQ, setShowFAQ] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showNitrateWarning, setShowNitrateWarning] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<BiomarkerCampaignData[]>([]);

  // Fetch biomarker campaigns on mount
  useEffect(() => {
    fetchBiomarkerCampaigns('MENS_HEALTH').then(setCampaigns);
  }, []);

  // Payment loading states (kept for UI but payment handled by separate page)
  const [isApplePayLoading, setIsApplePayLoading] = useState(false);
  const [isGooglePayLoading, setIsGooglePayLoading] = useState(false);

  // Card validation states (kept for backward compatibility, but card fields should not be used)
  const [cardErrors, setCardErrors] = useState({
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
    cardName: "",
  });
  const [touchedFields, setTouchedFields] = useState({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false,
    cardName: false,
  });

  // Updated total steps: 0-intro, 1-name, 2-email, 3-dob, 4-health-intro, 5-14 health questions, 15-other concerns, 16-phone/postcode, 17-confirm details, 18-payment
  const totalSteps = 19;
  const progress = Math.min(((step + 1) / totalSteps) * 100, 100);

  // Get current phase for progress indicator
  const getPhase = () => {
    if (step <= 3) return 1; // Personal Info
    if (step <= 15) return 2; // Health Assessment
    if (step === 16) return 2; // Contact details (still part of assessment)
    if (step === 17) return 3; // Confirm & Review
    if (step === 18) return 4; // Submit & Pay
    return 4;
  };

  const currentPhase = getPhase();

  // Card formatting and validation functions
  const formatCardNumber = (value: string): string => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    const groups = digits.match(/.{1,4}/g);
    return groups ? groups.join(" ") : digits;
  };

  const formatExpiry = (value: string): string => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 2) {
      return `${digits.slice(0, 2)} / ${digits.slice(2)}`;
    }
    return digits;
  };

  const validateCardNumber = (value: string): string => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "Card number is required";
    if (digits.length < 13) return "Card number is too short";
    if (digits.length > 16) return "Card number is too long";
    // Luhn algorithm check
    let sum = 0;
    let isEven = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    if (sum % 10 !== 0) return "Invalid card number";
    return "";
  };

  const validateExpiry = (value: string): string => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "Expiry date is required";
    if (digits.length < 4) return "Enter a valid expiry date";
    const month = parseInt(digits.slice(0, 2), 10);
    const year = parseInt(digits.slice(2, 4), 10);
    if (month < 1 || month > 12) return "Invalid month";
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      return "Card has expired";
    }
    return "";
  };

  const validateCvc = (value: string): string => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "CVC is required";
    if (digits.length < 3) return "CVC must be 3-4 digits";
    return "";
  };

  const validateCardName = (value: string): string => {
    if (!value.trim()) return "Name on card is required";
    if (value.trim().length < 2) return "Enter a valid name";
    return "";
  };

  const handleCardFieldChange = (field: "cardNumber" | "cardExpiry" | "cardCvc" | "cardName", value: string) => {
    let formattedValue = value;

    if (field === "cardNumber") {
      formattedValue = formatCardNumber(value);
    } else if (field === "cardExpiry") {
      formattedValue = formatExpiry(value);
    } else if (field === "cardCvc") {
      formattedValue = value.replace(/\D/g, "").slice(0, 4);
    }

    updateFormData(field, formattedValue);

    // Validate if field has been touched
    if (touchedFields[field]) {
      let error = "";
      if (field === "cardNumber") error = validateCardNumber(formattedValue);
      else if (field === "cardExpiry") error = validateExpiry(formattedValue);
      else if (field === "cardCvc") error = validateCvc(formattedValue);
      else if (field === "cardName") error = validateCardName(formattedValue);

      setCardErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleCardFieldBlur = (field: "cardNumber" | "cardExpiry" | "cardCvc" | "cardName") => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));

    let error = "";
    if (field === "cardNumber") error = validateCardNumber(formData.cardNumber);
    else if (field === "cardExpiry") error = validateExpiry(formData.cardExpiry);
    else if (field === "cardCvc") error = validateCvc(formData.cardCvc);
    else if (field === "cardName") error = validateCardName(formData.cardName);

    setCardErrors(prev => ({ ...prev, [field]: error }));
  };

  const isCardValid = (): boolean => {
    return (
      !validateCardNumber(formData.cardNumber) &&
      !validateExpiry(formData.cardExpiry) &&
      !validateCvc(formData.cardCvc) &&
      !validateCardName(formData.cardName)
    );
  };

  // Apple Pay handler
  const handleApplePay = async () => {
    setIsApplePayLoading(true);
    // Simulate Apple Pay processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsApplePayLoading(false);
    // In a real implementation, this would trigger the Apple Pay flow
    handleSubmit();
  };

  // Google Pay handler
  const handleGooglePay = async () => {
    setIsGooglePayLoading(true);
    // Simulate Google Pay processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsGooglePayLoading(false);
    // In a real implementation, this would trigger the Google Pay flow
    handleSubmit();
  };

  // Auto-populate card name when reaching payment step
  useEffect(() => {
    if (step === 18 && !formData.cardName && formData.firstName && formData.lastName) {
      setFormData(prev => ({ ...prev, cardName: `${prev.firstName} ${prev.lastName}` }));
    }
  }, [step, formData.cardName, formData.firstName, formData.lastName]);

  const updateFormData = (field: keyof FormData, value: string | string[] | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (field: "edCauses" | "medicalConditions" | "lifestyleFactors" | "otherConcerns", value: string) => {
    setFormData(prev => {
      const current = prev[field];
      const noneValues = ["None of these apply to me", "None of these apply", "I'm not sure", "No, I'm only interested in this treatment"];

      if (noneValues.includes(value)) {
        return { ...prev, [field]: current.includes(value) ? [] : [value] };
      }
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(v => v !== value) };
      }
      return { ...prev, [field]: [...current.filter(v => !noneValues.includes(v)), value] };
    });
  };

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
  const emailsMatch = formData.email === formData.confirmEmail && formData.email.length > 0;

  const applyDiscount = () => {
    const code = formData.discountCode.toUpperCase();
    if (code === "BLOOM20") {
      setDiscountApplied(true);
      setDiscountAmount(20);
    } else if (code === "FIRST10") {
      setDiscountApplied(true);
      setDiscountAmount(10);
    } else {
      setDiscountApplied(false);
      setDiscountAmount(0);
    }
  };

  const finalPrice = Math.max(49 - discountAmount, 0);

  const canProceed = () => {
    switch (step) {
      case 0: return true;
      case 1: return formData.firstName.trim() && formData.lastName.trim();
      case 2: return formData.email.includes("@") && formData.email.includes(".") && emailsMatch;
      case 3: return formData.dateOfBirth.length === 10 && isValidAge;
      case 4: return true;
      case 5: return formData.edDuration !== "";
      case 6: return formData.edSeverity !== "";
      case 7: return formData.erectionDifficulty !== "";
      case 8: return formData.morningErections !== "";
      case 9: return formData.edCauses.length > 0;
      case 10: return formData.medicalConditions.length > 0;
      case 11: return formData.takingNitrates !== "";
      case 12: return formData.lifestyleFactors.length > 0;
      case 13: return formData.previousTreatment !== "";
      case 14: return formData.treatmentGoal !== "";
      case 15: return formData.otherConcerns.length > 0;
      case 16: return formData.phone.length >= 10 && formData.postcode.length >= 4;
      case 17: return formData.confirmedAccurate;
      case 18: return formData.agreedToTerms;
      default: return true;
    }
  };

  const nextStep = () => {
    if (step === 11 && formData.takingNitrates === "yes") {
      setShowNitrateWarning(true);
      return;
    }
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
          programType: "MENS_HEALTH",
          ...formData,
          // Remove card fields from submission (PCI compliance)
          cardNumber: undefined,
          cardExpiry: undefined,
          cardCvc: undefined,
          cardName: undefined,
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
          program: "mens_health",
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
        sessionStorage.setItem("paymentProgram", "mens_health");
        window.location.href = `/payment?program=mens_health`;
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

  // Progress Step Indicator Component
  const ProgressStepIndicator = () => {
    const phases = [
      { id: 1, label: "Your Details", icon: User },
      { id: 2, label: "Health Assessment", icon: FileText },
      { id: 3, label: "Review", icon: Check },
      { id: 4, label: "Submit & Pay", icon: Wallet },
    ];

    return (
      <div className="w-full py-4 px-2">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {phases.map((phase, index) => {
            const isActive = currentPhase === phase.id;
            const isCompleted = currentPhase > phase.id;
            const Icon = phase.icon;

            return (
              <div key={phase.id} className="flex items-center flex-1 last:flex-initial">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? "bg-[#5c7a52] text-white"
                        : isActive
                        ? "bg-[#5c7a52] text-white ring-4 ring-[#5c7a52]/20"
                        : "bg-[#e6ebe3] text-[#7e9a72]"
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium text-center hidden sm:block ${
                      isActive || isCompleted ? "text-[#2c3628]" : "text-[#7e9a72]"
                    }`}
                  >
                    {phase.label}
                  </span>
                </div>
                {index < phases.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${
                      isCompleted ? "bg-[#5c7a52]" : "bg-[#e6ebe3]"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628] text-center">Your path to better performance</h1>
            <p className="text-center text-[#5c7a52]">Here's what to expect — completely confidential</p>
            <div className="space-y-4 mt-8">
              {[
                { num: 1, title: "Quick health check", description: "A few questions about your health and symptoms — takes under 5 minutes.", icon: Heart },
                { num: 2, title: "Doctor review", description: "An AHPRA-registered doctor reviews your assessment within 24 hours.", icon: Stethoscope },
                { num: 3, title: "Treatment plan", description: "If suitable, you'll receive a personalised treatment recommendation.", icon: MessageCircle },
                { num: 4, title: "Discreet delivery", description: "Plain packaging, free express shipping. No one will know what's inside.", icon: Package },
              ].map((item) => (
                <div key={item.num} className="bg-white rounded-2xl p-5 border border-[#e6ebe3] flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#5c7a52]/10 text-[#5c7a52] flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs font-medium text-[#5c7a52] bg-[#e6ebe3] px-2 py-0.5 rounded-full">Step {item.num}</span>
                    <h3 className="font-semibold text-[#2c3628] mt-1">{item.title}</h3>
                    <p className="text-sm text-[#5c7a52] mt-1">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-[#e6ebe3] rounded-2xl p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#5c7a52] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#5c7a52]">100% confidential. Your information is encrypted and protected by Australian privacy laws.</p>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">Let's start with your name</h1>
              <p className="mt-3 text-[#5c7a52]">Your legal name is required for prescriptions. We keep it completely private.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-8">
              <div>
                <label className="block text-sm font-medium text-[#2c3628] mb-2">First name</label>
                <input type="text" value={formData.firstName} onChange={(e) => updateFormData("firstName", e.target.value)} className="w-full px-4 py-4 rounded-xl border border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 outline-none transition-all bg-white" placeholder="Enter first name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2c3628] mb-2">Last name</label>
                <input type="text" value={formData.lastName} onChange={(e) => updateFormData("lastName", e.target.value)} className="w-full px-4 py-4 rounded-xl border border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 outline-none transition-all bg-white" placeholder="Enter last name" />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">Where can we reach you?</h1>
              <p className="mt-3 text-[#5c7a52]">We'll send your assessment results and treatment updates here.</p>
            </div>
            <div className="space-y-4 mt-8">
              <div>
                <label className="block text-sm font-medium text-[#2c3628] mb-2">Email address</label>
                <input type="email" value={formData.email} onChange={(e) => updateFormData("email", e.target.value)} className="w-full px-4 py-4 rounded-xl border border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 outline-none transition-all bg-white" placeholder="you@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2c3628] mb-2">Confirm email address</label>
                <input type="email" value={formData.confirmEmail} onChange={(e) => updateFormData("confirmEmail", e.target.value)} className={`w-full px-4 py-4 rounded-xl border focus:ring-2 outline-none transition-all bg-white ${formData.confirmEmail && !emailsMatch ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-[#5c7a52]/20"}`} placeholder="Confirm your email" />
                {formData.confirmEmail && !emailsMatch && (
                  <p className="text-sm text-red-600 mt-2">Email addresses don't match</p>
                )}
                {emailsMatch && formData.confirmEmail && (
                  <p className="text-sm text-[#5c7a52] mt-2 flex items-center gap-1"><Check className="w-4 h-4" /> Email confirmed</p>
                )}
              </div>
            </div>
            <p className="text-center text-sm text-[#7e9a72]">Returning patient? <Link href="/login" className="text-[#5c7a52] underline font-medium">Sign in instead</Link></p>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">When were you born?</h1>
              <p className="mt-3 text-[#5c7a52]">Age affects treatment options and dosing recommendations.</p>
            </div>
            <div className="mt-8">
              <div className="flex gap-3 justify-center">
                <div className="w-20">
                  <label className="block text-xs text-[#7e9a72] mb-1 text-center">Day</label>
                  <input type="text" inputMode="numeric" value={formData.dateOfBirth.split("/")[0] || ""} onChange={(e) => { const day = e.target.value.replace(/\D/g, "").slice(0, 2); const parts = formData.dateOfBirth.split("/"); updateFormData("dateOfBirth", `${day}/${parts[1] || ""}/${parts[2] || ""}`); if (day.length === 2) (document.getElementById("dob-month") as HTMLInputElement)?.focus(); }} className={`w-full px-3 py-4 rounded-xl border focus:ring-2 outline-none transition-all text-center text-lg bg-white ${formData.dateOfBirth.length === 10 && !isValidAge ? "border-red-400" : "border-[#cdd8c6] focus:border-[#5c7a52]"}`} placeholder="DD" maxLength={2} />
                </div>
                <div className="w-20">
                  <label className="block text-xs text-[#7e9a72] mb-1 text-center">Month</label>
                  <input id="dob-month" type="text" inputMode="numeric" value={formData.dateOfBirth.split("/")[1] || ""} onChange={(e) => { const month = e.target.value.replace(/\D/g, "").slice(0, 2); const parts = formData.dateOfBirth.split("/"); updateFormData("dateOfBirth", `${parts[0] || ""}/${month}/${parts[2] || ""}`); if (month.length === 2) (document.getElementById("dob-year") as HTMLInputElement)?.focus(); }} className={`w-full px-3 py-4 rounded-xl border focus:ring-2 outline-none transition-all text-center text-lg bg-white ${formData.dateOfBirth.length === 10 && !isValidAge ? "border-red-400" : "border-[#cdd8c6] focus:border-[#5c7a52]"}`} placeholder="MM" maxLength={2} />
                </div>
                <div className="w-28">
                  <label className="block text-xs text-[#7e9a72] mb-1 text-center">Year</label>
                  <input id="dob-year" type="text" inputMode="numeric" value={formData.dateOfBirth.split("/")[2] || ""} onChange={(e) => { const year = e.target.value.replace(/\D/g, "").slice(0, 4); const parts = formData.dateOfBirth.split("/"); updateFormData("dateOfBirth", `${parts[0] || ""}/${parts[1] || ""}/${year}`); }} className={`w-full px-3 py-4 rounded-xl border focus:ring-2 outline-none transition-all text-center text-lg bg-white ${formData.dateOfBirth.length === 10 && !isValidAge ? "border-red-400" : "border-[#cdd8c6] focus:border-[#5c7a52]"}`} placeholder="YYYY" maxLength={4} />
                </div>
              </div>
              {formData.dateOfBirth.length === 10 && !isValidAge && <p className="mt-4 text-sm text-red-600 text-center">You must be 18 or older to use this service.</p>}
              {formData.dateOfBirth.length === 10 && isValidAge && <p className="mt-4 text-sm text-[#5c7a52] text-center">Great, you're {age} years old.</p>}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#5c7a52] to-[#34412f] rounded-2xl flex items-center justify-center rotate-3">
              <Heart className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">Now, a few health questions</h1>
            <p className="text-[#5c7a52] max-w-md mx-auto">This helps our doctors recommend the safest and most effective treatment for your specific situation.</p>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">How long have you been experiencing this?</h1>
            </div>
            <div className="space-y-3 mt-8">
              {edDurationOptions.map((option) => (
                <button key={option.id} type="button" onClick={() => { updateFormData("edDuration", option.id); setTimeout(nextStep, 300); }} className={`w-full py-4 px-5 rounded-xl border-2 text-left transition-all ${formData.edDuration === option.id ? "border-[#5c7a52] bg-[#5c7a52]/10" : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"}`}>
                  <span className="font-medium text-[#2c3628]">{option.label}</span>
                  <span className="block text-sm text-[#7e9a72] mt-0.5">{option.description}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">How would you rate the severity?</h1>
              <p className="mt-3 text-[#5c7a52]">This helps us recommend the right treatment strength.</p>
            </div>
            <div className="space-y-3 mt-8">
              {edSeverityOptions.map((option) => (
                <button key={option.id} type="button" onClick={() => { updateFormData("edSeverity", option.id); setTimeout(nextStep, 300); }} className={`w-full py-4 px-5 rounded-xl border-2 text-left transition-all ${formData.edSeverity === option.id ? "border-[#5c7a52] bg-[#5c7a52]/10" : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"}`}>
                  <span className="font-medium text-[#2c3628]">{option.label}</span>
                  <span className="block text-sm text-[#7e9a72] mt-0.5">{option.description}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">What best describes your experience?</h1>
            </div>
            <div className="space-y-3 mt-8">
              {erectionDifficultyOptions.map((option) => (
                <button key={option.id} type="button" onClick={() => { updateFormData("erectionDifficulty", option.id); setTimeout(nextStep, 300); }} className={`w-full py-4 px-5 rounded-xl border-2 text-left transition-all ${formData.erectionDifficulty === option.id ? "border-[#5c7a52] bg-[#5c7a52]/10" : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"}`}>
                  <span className="font-medium text-[#2c3628]">{option.label}</span>
                  <span className="block text-sm text-[#7e9a72] mt-0.5">{option.description}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">Do you wake up with erections?</h1>
              <p className="mt-3 text-[#5c7a52]">Morning erections can help indicate underlying causes.</p>
            </div>
            <div className="space-y-3 mt-8">
              {morningErectionOptions.map((option) => (
                <button key={option.id} type="button" onClick={() => { updateFormData("morningErections", option.id); setTimeout(nextStep, 300); }} className={`w-full py-4 px-5 rounded-xl border-2 text-left transition-all ${formData.morningErections === option.id ? "border-[#5c7a52] bg-[#5c7a52]/10" : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"}`}>
                  <span className="font-medium text-[#2c3628]">{option.label}</span>
                  <span className="block text-sm text-[#7e9a72] mt-0.5">{option.description}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">What do you think might be causing this?</h1>
              <p className="mt-3 text-[#5c7a52]">Select all that might apply.</p>
            </div>
            <div className="space-y-3 mt-8">
              {edCausesOptions.map((option) => (
                <button key={option.id} type="button" onClick={() => toggleArrayField("edCauses", option.label)} className={`w-full py-4 px-5 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${formData.edCauses.includes(option.label) ? "border-[#5c7a52] bg-[#5c7a52]/10" : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"}`}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${formData.edCauses.includes(option.label) ? "border-[#5c7a52] bg-[#5c7a52]" : "border-[#cdd8c6]"}`}>
                    {formData.edCauses.includes(option.label) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-[#2c3628]">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 10:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">Do you have any of these conditions?</h1>
              <p className="mt-3 text-[#5c7a52]">Select all that apply — this is important for your safety.</p>
            </div>
            <div className="space-y-3 mt-8 max-h-[50vh] overflow-y-auto pr-2">
              {medicalConditionsOptions.map((option) => (
                <button key={option.id} type="button" onClick={() => toggleArrayField("medicalConditions", option.label)} className={`w-full py-4 px-5 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${formData.medicalConditions.includes(option.label) ? "border-[#5c7a52] bg-[#5c7a52]/10" : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"}`}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${formData.medicalConditions.includes(option.label) ? "border-[#5c7a52] bg-[#5c7a52]" : "border-[#cdd8c6]"}`}>
                    {formData.medicalConditions.includes(option.label) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-[#2c3628]">{option.label}</span>
                  {option.warning && <AlertCircle className="w-4 h-4 text-amber-500 ml-auto" />}
                </button>
              ))}
            </div>
          </div>
        );

      case 11:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">Do you take nitrate medications?</h1>
              <p className="mt-3 text-[#5c7a52]">This includes GTN spray, Anginine, Isosorbide, or similar heart medications.</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800"><strong>Important:</strong> ED medications cannot be safely taken with nitrates due to risk of dangerous drop in blood pressure.</p>
            </div>
            <div className="space-y-3 mt-8">
              {[{ value: "no", label: "No, I don't take nitrates" }, { value: "yes", label: "Yes, I take nitrate medication" }, { value: "not-sure", label: "I'm not sure" }].map((option) => (
                <button key={option.value} type="button" onClick={() => { updateFormData("takingNitrates", option.value); if (option.value !== "yes") setTimeout(nextStep, 300); }} className={`w-full py-4 px-6 rounded-xl border-2 text-center transition-all ${formData.takingNitrates === option.value ? "border-[#5c7a52] bg-[#5c7a52]/10 text-[#2c3628]" : "border-[#e6ebe3] bg-white text-[#2c3628] hover:border-[#cdd8c6]"}`}>{option.label}</button>
              ))}
            </div>
          </div>
        );

      case 12:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">Any lifestyle factors we should know about?</h1>
              <p className="mt-3 text-[#5c7a52]">Select all that apply — no judgement, just helps us help you.</p>
            </div>
            <div className="space-y-3 mt-8">
              {lifestyleFactorsOptions.map((option) => (
                <button key={option.id} type="button" onClick={() => toggleArrayField("lifestyleFactors", option.label)} className={`w-full py-4 px-5 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${formData.lifestyleFactors.includes(option.label) ? "border-[#5c7a52] bg-[#5c7a52]/10" : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"}`}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${formData.lifestyleFactors.includes(option.label) ? "border-[#5c7a52] bg-[#5c7a52]" : "border-[#cdd8c6]"}`}>
                    {formData.lifestyleFactors.includes(option.label) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-[#2c3628]">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 13:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">Have you tried ED treatment before?</h1>
            </div>
            <div className="space-y-3 mt-8">
              {previousTreatmentOptions.map((option) => (
                <button key={option.id} type="button" onClick={() => { updateFormData("previousTreatment", option.id); setTimeout(nextStep, 300); }} className={`w-full py-4 px-5 rounded-xl border-2 text-left transition-all ${formData.previousTreatment === option.id ? "border-[#5c7a52] bg-[#5c7a52]/10" : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"}`}>
                  <span className="font-medium text-[#2c3628]">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 14:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">What's your goal with treatment?</h1>
              <p className="mt-3 text-[#5c7a52]">This helps us recommend the right approach for you.</p>
            </div>
            <div className="space-y-3 mt-8">
              {treatmentGoalOptions.map((option) => (
                <button key={option.id} type="button" onClick={() => { updateFormData("treatmentGoal", option.id); setTimeout(nextStep, 300); }} className={`w-full py-4 px-5 rounded-xl border-2 text-left transition-all ${formData.treatmentGoal === option.id ? "border-[#5c7a52] bg-[#5c7a52]/10" : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"}`}>
                  <span className="font-medium text-[#2c3628]">{option.label}</span>
                  <span className="block text-sm text-[#7e9a72] mt-0.5">{option.description}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 15:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">While we're here, is there anything else you would like support with?</h1>
              <p className="mt-3 text-[#5c7a52]">This helps us personalise your care and follow up where relevant.</p>
            </div>
            <div className="space-y-3 mt-8">
              {otherConcernsOptions.map((option) => (
                <button key={option.id} type="button" onClick={() => toggleArrayField("otherConcerns", option.label)} className={`w-full py-4 px-5 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${formData.otherConcerns.includes(option.label) ? "border-[#5c7a52] bg-[#5c7a52]/10" : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"}`}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${formData.otherConcerns.includes(option.label) ? "border-[#5c7a52] bg-[#5c7a52]" : "border-[#cdd8c6]"}`}>
                    {formData.otherConcerns.includes(option.label) && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-[#2c3628]">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case 16:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">Contact details</h1>
              <p className="mt-3 text-[#5c7a52]">We'll use these to arrange your consultation and delivery.</p>
            </div>
            <div className="space-y-4 mt-8">
              <div>
                <label className="block text-sm font-medium text-[#2c3628] mb-2">Mobile number</label>
                <input type="tel" value={formData.phone} onChange={(e) => updateFormData("phone", e.target.value.replace(/[^0-9+]/g, ""))} className="w-full px-4 py-4 rounded-xl border border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 outline-none transition-all bg-white" placeholder="04XX XXX XXX" />
                <p className="text-xs text-[#7e9a72] mt-2">We'll SMS you when your doctor has reviewed your assessment to arrange a consultation.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2c3628] mb-2">Postcode</label>
                <input type="text" value={formData.postcode} onChange={(e) => updateFormData("postcode", e.target.value.replace(/\D/g, "").slice(0, 4))} className="w-full px-4 py-4 rounded-xl border border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 outline-none transition-all bg-white" placeholder="e.g. 2000" maxLength={4} />
              </div>
            </div>
          </div>
        );

      case 17:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">Confirm your details</h1>
              <p className="mt-3 text-[#5c7a52]">Please review and confirm your information is accurate.</p>
            </div>

            <div className="bg-white rounded-2xl border border-[#e6ebe3] overflow-hidden mt-8">
              <div className="p-5 border-b border-[#e6ebe3]">
                <h3 className="font-semibold text-[#2c3628]">Personal details</h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#7e9a72] mb-1">First name</label>
                    <p className="text-[#2c3628] font-medium">{formData.firstName}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-[#7e9a72] mb-1">Last name</label>
                    <p className="text-[#2c3628] font-medium">{formData.lastName}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#7e9a72] mb-1">Date of birth</label>
                  <p className="text-[#2c3628] font-medium">{formData.dateOfBirth}</p>
                </div>
                <div>
                  <label className="block text-xs text-[#7e9a72] mb-1">Mobile number</label>
                  <p className="text-[#2c3628] font-medium">{formData.phone}</p>
                </div>
                <div>
                  <label className="block text-xs text-[#7e9a72] mb-1">Email</label>
                  <p className="text-[#2c3628] font-medium">{formData.email}</p>
                </div>
                <div>
                  <label className="block text-xs text-[#7e9a72] mb-1">Postcode</label>
                  <p className="text-[#2c3628] font-medium">{formData.postcode}</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => updateFormData("confirmedAccurate", !formData.confirmedAccurate)}
              className={`w-full py-4 px-5 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${formData.confirmedAccurate ? "border-[#5c7a52] bg-[#5c7a52]/10" : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"}`}
            >
              <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${formData.confirmedAccurate ? "border-[#5c7a52] bg-[#5c7a52]" : "border-[#cdd8c6]"}`}>
                {formData.confirmedAccurate && <Check className="w-4 h-4 text-white" />}
              </div>
              <span className="text-[#2c3628]">I confirm all information provided is true and accurate to the best of my knowledge</span>
            </button>
          </div>
        );

      case 18:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">Complete your booking</h1>
              <p className="mt-3 text-[#5c7a52]">Review your details and complete payment</p>
            </div>

            {/* Patient Summary */}
            <div className="bg-white rounded-2xl border border-[#e6ebe3] overflow-hidden">
              <div className="p-5 border-b border-[#e6ebe3] bg-[#f4f7f2]">
                <h3 className="font-semibold text-[#2c3628] flex items-center gap-2">
                  <User className="w-4 h-4" /> Patient Summary
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#7e9a72] mb-1">Full Name</label>
                    <p className="text-[#2c3628] font-medium">{formData.firstName} {formData.lastName}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-[#7e9a72] mb-1">Date of Birth</label>
                    <p className="text-[#2c3628] font-medium">{formData.dateOfBirth}</p>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#7e9a72] mb-1">Email</label>
                    <p className="text-[#2c3628] font-medium truncate">{formData.email}</p>
                  </div>
                  <div>
                    <label className="block text-xs text-[#7e9a72] mb-1">Mobile</label>
                    <p className="text-[#2c3628] font-medium">{formData.phone}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[#7e9a72] mb-1">Postcode</label>
                  <p className="text-[#2c3628] font-medium">{formData.postcode}</p>
                </div>
              </div>
            </div>

            {/* Consultation summary */}
            <div className="bg-white rounded-2xl border border-[#e6ebe3] overflow-hidden">
              <div className="p-5 border-b border-[#e6ebe3]">
                <h3 className="font-semibold text-[#2c3628]">Order summary</h3>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-4 pb-4 border-b border-[#e6ebe3]">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#e6ebe3] to-[#cdd8c6] rounded-xl flex items-center justify-center">
                    <Heart className="w-7 h-7 text-[#5c7a52]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-[#2c3628]">ED Treatment Consultation</h4>
                    <p className="text-sm text-[#7e9a72]">AHPRA-registered doctor review</p>
                  </div>
                  <div className="text-right">
                    {discountApplied && <p className="text-sm text-[#7e9a72] line-through">$49</p>}
                    <p className="font-semibold text-[#2c3628]">${finalPrice}</p>
                  </div>
                </div>
                <div className="pt-4 space-y-2 text-sm">
                  {["Personalised treatment recommendation", "Prescription if clinically appropriate", "Free express delivery Australia-wide", "Ongoing doctor support"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-[#5c7a52]">
                      <Check className="w-4 h-4 flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Discount code */}
            <div className="bg-white rounded-2xl border border-[#e6ebe3] p-5">
              <h3 className="font-semibold text-[#2c3628] mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Discount code
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.discountCode}
                  onChange={(e) => updateFormData("discountCode", e.target.value.toUpperCase())}
                  className="flex-1 px-4 py-3 rounded-xl border border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 outline-none transition-all bg-white uppercase"
                  placeholder="Enter code"
                />
                <button
                  type="button"
                  onClick={applyDiscount}
                  className="px-6 py-3 rounded-xl border-2 border-[#5c7a52] text-[#5c7a52] font-medium hover:bg-[#5c7a52]/10 transition-colors"
                >
                  Apply
                </button>
              </div>
              {discountApplied && (
                <div className="mt-3 px-4 py-2 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 text-sm">
                  <Check className="w-4 h-4" />
                  Discount applied! You've saved ${discountAmount}
                </div>
              )}
            </div>

            {/* Payment methods */}
            <div className="bg-white rounded-2xl border border-[#e6ebe3] p-5 space-y-4">
              <h3 className="font-semibold text-[#2c3628] flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Payment method
              </h3>

              {/* Apple Pay button */}
              <button
                type="button"
                className={`w-full py-4 bg-black text-white font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-gray-900 transition-colors ${isApplePayLoading ? "opacity-60 cursor-wait" : ""}`}
                onClick={handleApplePay}
                disabled={isApplePayLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                {isApplePayLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Pay with Apple Pay</>
                )}
              </button>

              {/* Google Pay button */}
              <button
                type="button"
                className={`w-full py-4 bg-white border-2 border-[#e6ebe3] text-[#2c3628] font-medium rounded-xl flex items-center justify-center gap-2 hover:border-[#cdd8c6] transition-colors ${isGooglePayLoading ? "opacity-60 cursor-wait" : ""}`}
                onClick={handleGooglePay}
                disabled={isGooglePayLoading}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {isGooglePayLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#5c7a52]/30 border-t-[#5c7a52] rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Pay with Google Pay</>
                )}
              </button>

              <div className="relative flex items-center gap-4 my-4">
                <div className="flex-1 h-px bg-[#e6ebe3]" />
                <span className="text-sm text-[#7e9a72]">or pay with card</span>
                <div className="flex-1 h-px bg-[#e6ebe3]" />
              </div>

              {/* Card payment form - Stripe style */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#2c3628] mb-2">Card number</label>
                  <div className="relative">
                    <input
                      type="text"
                      className={`w-full px-4 py-4 pr-24 rounded-xl border ${cardErrors.cardNumber && touchedFields.cardNumber ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-[#5c7a52]/20"} outline-none transition-all bg-white`}
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChange={e => handleCardFieldChange("cardNumber", e.target.value)}
                      onBlur={() => handleCardFieldBlur("cardNumber")}
                      maxLength={19}
                      inputMode="numeric"
                      autoComplete="cc-number"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <svg className="w-8 h-5" viewBox="0 0 32 20" fill="none">
                        <rect width="32" height="20" rx="2" fill="#1A1F71"/>
                        <path d="M12.5 14.5L14.5 6H17L15 14.5H12.5Z" fill="white"/>
                        <path d="M21.5 6.2C21 6 20.2 5.8 19.2 5.8C16.7 5.8 15 7.1 15 8.9C15 10.3 16.2 11 17.2 11.4C18.2 11.8 18.5 12.1 18.5 12.5C18.5 13.1 17.8 13.4 17.1 13.4C16.1 13.4 15.6 13.2 14.8 12.9L14.5 12.8L14.2 14.7C14.8 15 15.8 15.2 16.9 15.2C19.6 15.2 21.2 13.9 21.2 12C21.2 10.9 20.5 10.1 19 9.5C18.1 9.1 17.5 8.8 17.5 8.4C17.5 8 17.9 7.6 18.8 7.6C19.6 7.6 20.2 7.8 20.6 8L20.9 8.1L21.5 6.2Z" fill="white"/>
                      </svg>
                      <svg className="w-8 h-5" viewBox="0 0 32 20" fill="none">
                        <rect width="32" height="20" rx="2" fill="#EB001B" fillOpacity="0.1"/>
                        <circle cx="12" cy="10" r="6" fill="#EB001B"/>
                        <circle cx="20" cy="10" r="6" fill="#F79E1B"/>
                        <path d="M16 5.5C17.3 6.6 18 8.2 18 10C18 11.8 17.3 13.4 16 14.5C14.7 13.4 14 11.8 14 10C14 8.2 14.7 6.6 16 5.5Z" fill="#FF5F00"/>
                      </svg>
                    </div>
                  </div>
                  {cardErrors.cardNumber && touchedFields.cardNumber && (
                    <p className="text-xs text-red-600 mt-2">{cardErrors.cardNumber}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#2c3628] mb-2">Expiry</label>
                    <input
                      type="text"
                      className={`w-full px-4 py-4 rounded-xl border ${cardErrors.cardExpiry && touchedFields.cardExpiry ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-[#5c7a52]/20"} outline-none transition-all bg-white`}
                      placeholder="MM / YY"
                      value={formData.cardExpiry}
                      onChange={e => handleCardFieldChange("cardExpiry", e.target.value)}
                      onBlur={() => handleCardFieldBlur("cardExpiry")}
                      maxLength={7}
                      inputMode="numeric"
                      autoComplete="cc-exp"
                    />
                    {cardErrors.cardExpiry && touchedFields.cardExpiry && (
                      <p className="text-xs text-red-600 mt-2">{cardErrors.cardExpiry}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#2c3628] mb-2">CVC</label>
                    <input
                      type="text"
                      className={`w-full px-4 py-4 rounded-xl border ${cardErrors.cardCvc && touchedFields.cardCvc ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-[#5c7a52]/20"} outline-none transition-all bg-white`}
                      placeholder="123"
                      value={formData.cardCvc}
                      onChange={e => handleCardFieldChange("cardCvc", e.target.value)}
                      onBlur={() => handleCardFieldBlur("cardCvc")}
                      maxLength={4}
                      inputMode="numeric"
                      autoComplete="cc-csc"
                    />
                    {cardErrors.cardCvc && touchedFields.cardCvc && (
                      <p className="text-xs text-red-600 mt-2">{cardErrors.cardCvc}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#2c3628] mb-2">Name on card</label>
                  <input
                    type="text"
                    className={`w-full px-4 py-4 rounded-xl border ${cardErrors.cardName && touchedFields.cardName ? "border-red-400 focus:border-red-500 focus:ring-red-500/20" : "border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-[#5c7a52]/20"} outline-none transition-all bg-white`}
                    placeholder="Full name as shown on card"
                    value={formData.cardName}
                    onChange={e => handleCardFieldChange("cardName", e.target.value)}
                    onBlur={() => handleCardFieldBlur("cardName")}
                    autoComplete="cc-name"
                  />
                  {cardErrors.cardName && touchedFields.cardName && (
                    <p className="text-xs text-red-600 mt-2">{cardErrors.cardName}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Secure payment badge */}
            <div className="flex items-center justify-center gap-2 text-[#7e9a72] text-sm">
              <Shield className="w-4 h-4" />
              <span>Secured by 256-bit SSL encryption</span>
            </div>

            {/* Terms agreement */}
            <button
              type="button"
              onClick={() => updateFormData("agreedToTerms", !formData.agreedToTerms)}
              className={`w-full py-4 px-5 rounded-xl border-2 text-left flex items-start gap-3 transition-all ${formData.agreedToTerms ? "border-[#5c7a52] bg-[#5c7a52]/10" : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"}`}
            >
              <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${formData.agreedToTerms ? "border-[#5c7a52] bg-[#5c7a52]" : "border-[#cdd8c6]"}`}>
                {formData.agreedToTerms && <Check className="w-4 h-4 text-white" />}
              </div>
              <span className="text-sm text-[#5c7a52]">
                By clicking below you confirm you have read and agree to our{" "}
                <Link href="/terms" className="underline text-[#2c3628]">Terms & Conditions</Link> and{" "}
                <Link href="/privacy" className="underline text-[#2c3628]">Privacy Policy</Link>.
              </span>
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.agreedToTerms}
              className="w-full py-4 bg-[#5c7a52] text-white font-medium rounded-xl hover:bg-[#4a6343] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>Confirm ${finalPrice} payment</>
              )}
            </button>

            <p className="text-center text-xs text-[#7e9a72]">
              You will be refunded if you are not eligible for treatment
            </p>
          </div>
        );

      // Success step
      default:
        // Final step: Show biomarker snapshot
        const risks = scoreMensHealth(formData as unknown as Record<string, unknown>, campaigns);
        return (
          <BiomarkerSnapshot
            risks={risks}
            primaryProgram="Men's Health Program"
            primaryPrice="from $89/mo"
            firstName={formData.firstName}
            onPrimary={handleSubmit}
            onLabs={() => window.location.href = '/labs'}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {/* Progress bar - thin line at top */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#e6ebe3] z-50">
        <div className="h-full bg-[#5c7a52] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 bg-[#fdfbf7]/95 backdrop-blur-sm z-40 border-b border-[#e6ebe3]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/mens-health" className="text-2xl font-serif text-[#34412f]">bloom</Link>
          <button type="button" onClick={() => setShowFAQ(true)} className="flex items-center gap-1.5 text-sm text-[#5c7a52] hover:text-[#34412f] transition-colors">
            <Info className="w-4 h-4" /><span>Help</span>
          </button>
        </div>
        {/* Step Progress Indicator - shown after intro step */}
        {step > 0 && step < totalSteps && <ProgressStepIndicator />}
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-8 pb-32">
        <div className="animate-fadeIn">{renderStep()}</div>
      </main>

      {/* Bottom navigation */}
      {step < totalSteps && step !== 18 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#e6ebe3] p-4">
          <div className="max-w-2xl mx-auto flex gap-3">
            {step > 0 && (
              <button type="button" onClick={prevStep} className="px-5 py-4 rounded-xl border border-[#cdd8c6] text-[#5c7a52] font-medium hover:bg-[#f4f7f2] transition-colors flex items-center gap-2">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <button type="button" onClick={nextStep} disabled={!canProceed()} className="flex-1 py-4 bg-[#5c7a52] text-white font-medium rounded-xl hover:bg-[#4a6343] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {step === 0 ? "Let's begin" : "Continue"}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Nitrate Warning Modal */}
      {showNitrateWarning && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-serif text-[#2c3628]">Unable to proceed</h3>
            </div>
            <p className="text-[#5c7a52] mb-6">ED medications cannot be safely used with nitrate medications due to the risk of a dangerous drop in blood pressure.</p>
            <p className="text-[#5c7a52] mb-6">Please consult with your GP or cardiologist about alternative options.</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setShowNitrateWarning(false); updateFormData("takingNitrates", ""); }} className="flex-1 py-3 border border-[#cdd8c6] text-[#5c7a52] font-medium rounded-xl hover:bg-[#f4f7f2] transition-colors">Go back</button>
              <Link href="/mens-health" className="flex-1 py-3 bg-[#5c7a52] text-white font-medium rounded-xl hover:bg-[#4a6343] transition-colors text-center">Exit</Link>
            </div>
          </div>
        </div>
      )}

      {/* FAQ Modal */}
      {showFAQ && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-[#e6ebe3] flex items-center justify-between">
              <div className="flex items-center gap-2"><Info className="w-5 h-5 text-[#5c7a52]" /><span className="font-semibold text-[#2c3628]">Common questions</span></div>
              <button type="button" onClick={() => setShowFAQ(false)} className="p-2 hover:bg-[#f4f7f2] rounded-full transition-colors"><X className="w-5 h-5 text-[#5c7a52]" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div><h4 className="font-semibold text-[#2c3628] mb-2">What treatments are available?</h4><p className="text-sm text-[#5c7a52]">We offer Sildenafil (similar to Viagra) and Tadalafil (similar to Cialis). Your doctor will recommend the best option.</p></div>
              <div><h4 className="font-semibold text-[#2c3628] mb-2">How quickly does it work?</h4><p className="text-sm text-[#5c7a52]">Most ED medications work within 30-60 minutes. Short-acting lasts 4-6 hours, longer-acting up to 36 hours.</p></div>
              <div><h4 className="font-semibold text-[#2c3628] mb-2">Is everything confidential?</h4><p className="text-sm text-[#5c7a52]">Absolutely. All information is encrypted. Medications are delivered in plain, unmarked packaging.</p></div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}

export default function EDAssessmentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#5c7a52]/30 border-t-[#5c7a52] rounded-full animate-spin" /></div>}>
      <AssessmentContent />
    </Suspense>
  );
}
