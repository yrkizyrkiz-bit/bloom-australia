"use client";

import { useState, Suspense, useEffect, useMemo } from "react";
import type { QuizStep } from "@/lib/programs/quizzes/sexual-health-quiz-shared";
import {
  getSexualHealthPublicQuizSteps,
  getSexualHealthPublicStepBounds,
  isSexualHealthConcern,
  isSexualHealthQuizStepComplete,
  normalizeSexualHealthConcern,
} from "@/lib/funnel/mens-sexual-health-public-flow";
import { scoreMensHealth, fetchBiomarkerCampaigns, type BiomarkerCampaignData } from "@/lib/biomarkerScoring";
import { BiomarkerSnapshot } from "@/components/quiz/BiomarkerSnapshot";
import {
  UnifiedCheckoutScreen,
  type UnifiedSlot,
} from "@/components/checkout/UnifiedCheckoutScreen";
import { resolveAustralianTimezone } from "@/lib/australia-timezone";
import {
  MENS_CHECKOUT_PRICING,
  resolveMensHealthCanonicalKey,
} from "@/lib/funnel/public-consult-programs";
import {
  getBiomarkerSubscriptionPlan,
  type BiomarkerSubscriptionTier,
} from "@/lib/biomarkers/public-subscription-panels";
import { resolveRequiredPanelTier } from "@/lib/biomarkers/program-panel-requirements";
import { publicTierToBillingTier } from "@/lib/biomarkers/public-checkout-tier-map";
import type { ProgramKey } from "@/lib/membership/keys";
import { toast } from "sonner";
import { ExistingAccountPrompt } from "@/components/funnel/ExistingAccountPrompt";
import {
  buildLoginRedirectUrl,
  fetchExistingAccountFirstName,
  submitPublicIntake,
} from "@/lib/funnel/intake-response";
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
  Sparkles,
  Loader2,
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
  consultationDate: string;
  consultationTime: string;
  selectedSlotId: string;
  discountCode: string;
  confirmedAccurate: boolean;
  agreedToTerms: boolean;
  // Card payment fields
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  cardName: string;
  /** Canonical program resolved at analyse step. */
  resolvedProgram: ProgramKey | "";
  /** Public panel tier resolved at analyse step. */
  panelTier: BiomarkerSubscriptionTier | "";
}

function MensAnalyseStep({
  concernLabel,
  onComplete,
}: {
  concernLabel: string;
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const messages = [
    "Analysing your health profile...",
    "Matching biomarkers to your answers...",
    "Selecting the right panel for care...",
    "Preparing your recommendations...",
  ];

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(onComplete, 400);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 700);
    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [onComplete, messages.length]);

  return (
    <div className="space-y-8 py-12 text-center">
      <div className="w-24 h-24 mx-auto mb-6 relative">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#5c7a52] to-[#34412f] animate-pulse" />
        <div className="absolute inset-0 rounded-2xl flex items-center justify-center">
          <Sparkles className="w-12 h-12 text-white animate-bounce" />
        </div>
      </div>
      <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">Analysing your responses</h1>
      <p className="text-[#5c7a52] max-w-md mx-auto">
        Reviewing your {concernLabel} assessment to confirm the biomarker panel your care plan needs.
      </p>
      <div className="max-w-sm mx-auto">
        <div className="h-2 bg-[#e6ebe3] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#5c7a52] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-[#7e9a72] mt-2">{progress}% complete</p>
      </div>
      <p className="text-sm text-[#5c7a52] font-medium animate-pulse flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        {messages[currentMessage]}
      </p>
    </div>
  );
}

// Energy & Vitality duration options
const edDurationOptions = [
  { id: "less-3-months", label: "Less than 3 months", description: "A recent change in energy, drive, or recovery" },
  { id: "3-6-months", label: "3 to 6 months", description: "Noticeable for a few months now" },
  { id: "6-12-months", label: "6 to 12 months", description: "Ongoing for most of the year" },
  { id: "1-2-years", label: "1 to 2 years", description: "A longer-term shift in how you feel" },
  { id: "more-2-years", label: "More than 2 years", description: "Long-standing energy or vitality concerns" },
];

// Energy & Vitality severity options
const edSeverityOptions = [
  { id: "mild", label: "Mild", description: "Some tiredness or lower motivation, but mostly manageable" },
  { id: "moderate", label: "Moderate", description: "Regular fatigue, low drive, or slower recovery" },
  { id: "severe", label: "Severe", description: "Persistent symptoms affecting work, training, mood, or daily life" },
];

// Main vitality concern
const erectionDifficultyOptions = [
  { id: "fatigue", label: "Low energy or fatigue", description: "Feeling tired, flat, or run down more often" },
  { id: "motivation", label: "Low motivation or drive", description: "Harder to feel switched on or productive" },
  { id: "recovery", label: "Poor recovery or reduced strength", description: "Training, work, or stress takes longer to recover from" },
  { id: "libido", label: "Lower libido or confidence", description: "Reduced interest, confidence, or vitality" },
  { id: "mixed", label: "A mix of these", description: "Several areas of energy and wellbeing are affected" },
];

// Daily energy pattern
const morningErectionOptions = [
  { id: "morning-low", label: "Low from the moment I wake up", description: "Mornings feel heavy or slow" },
  { id: "afternoon-crash", label: "Afternoon crash", description: "Energy drops later in the day" },
  { id: "variable", label: "It varies day to day", description: "Some good days, some very flat days" },
  { id: "sleep-dependent", label: "Mostly linked to sleep", description: "Energy tracks closely with sleep quality" },
  { id: "not-sure", label: "I'm not sure", description: "No clear pattern yet" },
];

// Potential contributors
const edCausesOptions = [
  { id: "stress", label: "Stress or anxiety" },
  { id: "burnout", label: "Burnout or high workload" },
  { id: "poor-sleep", label: "Poor sleep or waking unrefreshed" },
  { id: "depression", label: "Depression or low mood" },
  { id: "hormones", label: "Hormones or low testosterone" },
  { id: "nutrition", label: "Nutrition or vitamin deficiency" },
  { id: "metabolic", label: "Weight, blood sugar, or metabolic health" },
  { id: "medication", label: "Side effect of medication" },
  { id: "unsure", label: "I'm not sure" },
];

// Medical conditions relevant to energy and vitality
const medicalConditionsOptions = [
  { id: "heart-disease", label: "Heart disease or heart condition", warning: true },
  { id: "high-bp", label: "High blood pressure", warning: false },
  { id: "diabetes", label: "Diabetes (Type 1 or 2)", warning: false },
  { id: "high-cholesterol", label: "High cholesterol", warning: false },
  { id: "thyroid", label: "Thyroid condition", warning: false },
  { id: "sleep-apnoea", label: "Sleep apnoea or heavy snoring", warning: false },
  { id: "anaemia", label: "Low iron, anaemia, or B12 deficiency", warning: false },
  { id: "testosterone", label: "Previously low testosterone", warning: false },
  { id: "mental-health", label: "Anxiety, depression, or chronic stress", warning: false },
  { id: "stroke", label: "Previous stroke or major cardiovascular event", warning: true },
  { id: "none", label: "None of these apply to me", warning: false },
];

// Lifestyle factors
const lifestyleFactorsOptions = [
  { id: "smoking", label: "I smoke or vape" },
  { id: "heavy-drinking", label: "I drink alcohol regularly (10+ drinks/week)" },
  { id: "poor-sleep", label: "I don't sleep well" },
  { id: "sedentary", label: "I'm not very physically active" },
  { id: "overtraining", label: "I train hard but don't recover well" },
  { id: "overweight", label: "I'm overweight" },
  { id: "high-stress", label: "I'm under ongoing stress" },
  { id: "irregular-meals", label: "My meals or nutrition are inconsistent" },
  { id: "none", label: "None of these apply" },
];

// Vitality goals
const treatmentGoalOptions = [
  { id: "energy", label: "Improve daily energy", description: "Feel more consistent and less drained" },
  { id: "focus", label: "Improve focus and mental clarity", description: "Reduce brain fog and feel sharper" },
  { id: "strength", label: "Improve strength and recovery", description: "Support training, muscle, and physical resilience" },
  { id: "libido", label: "Improve libido and confidence", description: "Feel more like yourself again" },
  { id: "root-cause", label: "Find the root cause", description: "Use biomarkers to understand what's driving symptoms" },
];

// Previous support options
const previousTreatmentOptions = [
  { id: "blood-tests", label: "Blood tests or hormone testing" },
  { id: "supplements", label: "Vitamins, minerals, or supplements" },
  { id: "sleep-support", label: "Sleep support or sleep apnoea review" },
  { id: "fitness-nutrition", label: "Exercise, nutrition, or weight-loss plan" },
  { id: "prescription", label: "Prescription medication or hormone treatment" },
  { id: "none", label: "No, I haven't tried anything yet" },
];

// Other concerns options
const otherConcernsOptions = [
  { id: "hair-loss", label: "Hair Loss" },
  { id: "weight", label: "Weight Management" },
  { id: "sexual-health", label: "Sexual Health" },
  { id: "energy", label: "Energy & Vitality" },
  { id: "none", label: "No, I'm only interested in this pathway" },
];

function AssessmentContent() {
  const searchParams = useSearchParams();
  const concernParam = searchParams.get("concern") || "energy-vitality";
  const isSexualFlow = isSexualHealthConcern(concernParam);

  const [step, setStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    confirmEmail: "",
    phone: "",
    dateOfBirth: "",
    concern: normalizeSexualHealthConcern(concernParam),
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
    consultationDate: "",
    consultationTime: "",
    selectedSlotId: "",
    discountCode: "",
    confirmedAccurate: false,
    agreedToTerms: false,
    // Card payment fields
    cardNumber: "",
    cardExpiry: "",
    cardCvc: "",
    cardName: "",
    resolvedProgram: "",
    panelTier: "",
  });
  const [showFAQ, setShowFAQ] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discountApplied, setDiscountApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [showExistingAccountPrompt, setShowExistingAccountPrompt] = useState(false);
  const [existingUserFirstName, setExistingUserFirstName] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<BiomarkerCampaignData[]>([]);
  const [bookingHoldId, setBookingHoldId] = useState<string | null>(null);
  const [holdExpiry, setHoldExpiry] = useState<Date | null>(null);
  const [holdCountdown, setHoldCountdown] = useState(0);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [slotsRefreshKey, setSlotsRefreshKey] = useState(0);
  const [creatingHold, setCreatingHold] = useState(false);
  const [selectingSlotId, setSelectingSlotId] = useState<string | null>(null);
  const [offerCountdown, setOfferCountdown] = useState(300);
  const [portalMagicLink, setPortalMagicLink] = useState<string | null>(null);

  const sexualQuizSteps = useMemo(
    () => getSexualHealthPublicQuizSteps(quizAnswers),
    [quizAnswers]
  );
  const sexualBounds = useMemo(
    () => getSexualHealthPublicStepBounds(sexualQuizSteps.length),
    [sexualQuizSteps.length]
  );

  // Fetch biomarker campaigns for vitality flow only (no pre-checkout upsell for sexual health)
  useEffect(() => {
    if (!isSexualFlow) {
      fetchBiomarkerCampaigns("MENS_HEALTH").then(setCampaigns);
    }
  }, [isSexualFlow]);

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

  // Vitality: consent(17) → analyse(18) → snapshot(19) → checkout(20) → thankYou(21)
  // Sexual: consent → analyse → checkout → thankYou (via sexualBounds)
  const analyseStep = isSexualFlow ? sexualBounds.analyse : 18;
  const snapshotStep = isSexualFlow ? -1 : 19;
  const checkoutStep = isSexualFlow ? sexualBounds.checkout : 20;
  const thankYouStep = isSexualFlow ? sexualBounds.thankYou : 21;
  const totalSteps = thankYouStep;
  const progress = Math.min(((step + 1) / totalSteps) * 100, 100);
  const patientTimezone = resolveAustralianTimezone(null, formData.postcode);

  const resolvedPanelTier = formData.panelTier || "advanced";
  const resolvedPanelPlan = getBiomarkerSubscriptionPlan(resolvedPanelTier);
  const mensCheckoutValueProps = useMemo(
    () => [
      `${resolvedPanelPlan.name} panel included (${resolvedPanelPlan.markerCount}+ markers)`,
      isSexualFlow
        ? "Doctor-led sexual health assessment"
        : "Doctor-led men's health assessment",
      isSexualFlow
        ? "AHPRA-registered Australian doctors"
        : "Treatment if clinically prescribed",
      "Care team support in your portal",
    ],
    [isSexualFlow, resolvedPanelPlan]
  );

  useEffect(() => {
    if (!holdExpiry) return;
    const timer = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((holdExpiry.getTime() - Date.now()) / 1000)
      );
      setHoldCountdown(remaining);
      if (remaining === 0) {
        setBookingHoldId(null);
        updateFormData("consultationDate", "");
        updateFormData("consultationTime", "");
        updateFormData("selectedSlotId", "");
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [holdExpiry]);

  useEffect(() => {
    if (offerCountdown > 0 && step >= checkoutStep) {
      const timer = setInterval(() => {
        setOfferCountdown((c) => Math.max(0, c - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [checkoutStep, offerCountdown, step]);

  // Get current phase for progress indicator
  const getPhase = () => {
    if (isSexualFlow) {
      if (step <= 3) return 1;
      if (step < sexualBounds.contact) return 2;
      if (step <= sexualBounds.consent) return 3;
      return 4;
    }
    if (step <= 3) return 1; // Personal Info
    if (step <= 15) return 2; // Health Assessment
    if (step === 16) return 2; // Contact details (still part of assessment)
    if (step === 17 || step === analyseStep) return 3;
    if (step === snapshotStep || step === checkoutStep) return 4;
    if (step === thankYouStep) return 4;
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

  const updateFormData = (field: keyof FormData, value: string | string[] | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (field: "edCauses" | "medicalConditions" | "lifestyleFactors" | "otherConcerns", value: string) => {
    setFormData(prev => {
      const current = prev[field];
      const noneValues = ["None of these apply to me", "None of these apply", "I'm not sure", "No, I'm only interested in this pathway"];

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
    if (code === "FIRST10") {
      setDiscountApplied(true);
      setDiscountAmount(10);
    } else {
      setDiscountApplied(false);
      setDiscountAmount(0);
    }
  };

  const finalPrice = Math.max(49 - discountAmount, 0);

  const canProceed = () => {
    if (isSexualFlow) {
      switch (step) {
        case 0:
          return true;
        case 1:
          return Boolean(formData.firstName.trim() && formData.lastName.trim());
        case 2:
          return formData.email.includes("@") && formData.email.includes(".") && emailsMatch;
        case 3:
          return formData.dateOfBirth.length === 10 && isValidAge;
        case 4:
          return true;
        default:
          if (step >= sexualBounds.quizStart && step < sexualBounds.contact) {
            return isSexualHealthQuizStepComplete(step, quizAnswers);
          }
          if (step === sexualBounds.contact) {
            return formData.phone.length >= 10 && formData.postcode.length >= 4;
          }
          if (step === sexualBounds.consent) {
            return formData.confirmedAccurate;
          }
          if (step === sexualBounds.analyse) {
            return true;
          }
          return true;
      }
    }

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
      case analyseStep:
      case snapshotStep:
      case checkoutStep:
      case thankYouStep:
        return true;
      default: return true;
    }
  };

  const nextStep = () => {
    if (!canProceed()) return;

    if (isSexualFlow && step === sexualBounds.consent) {
      setStep(sexualBounds.analyse);
      window.scrollTo(0, 0);
      return;
    }

    if (step < totalSteps) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  const selectSexualQuizAnswer = (question: QuizStep, optionId: string) => {
    if (question.id === "treatmentFocus") {
      setQuizAnswers({ treatmentFocus: optionId });
      setTimeout(() => {
        setStep(getSexualHealthPublicStepBounds(1).quizStart + 1);
        window.scrollTo(0, 0);
      }, 300);
      return;
    }

    setQuizAnswers((prev) => {
      const updated = { ...prev, [question.id]: optionId };
      setTimeout(() => {
        const steps = getSexualHealthPublicQuizSteps(updated);
        const bounds = getSexualHealthPublicStepBounds(steps.length);
        const currentIndex = step - bounds.quizStart;
        const nextIndex = currentIndex + 1;
        if (nextIndex < steps.length) {
          setStep(bounds.quizStart + nextIndex);
        } else {
          setStep(bounds.contact);
        }
        window.scrollTo(0, 0);
      }, 300);
      return updated;
    });
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleUseDifferentEmail = () => {
    setShowExistingAccountPrompt(false);
    setExistingUserFirstName(null);
    setSubmissionError(null);
    updateFormData("email", "");
    updateFormData("confirmEmail", "");
    setStep(2);
    window.scrollTo(0, 0);
  };

  const saveMensIntake = async (
    overrides?: {
      resolvedProgram?: ProgramKey;
      panelTier?: BiomarkerSubscriptionTier;
    }
  ): Promise<boolean> => {
    setIsSubmitting(true);
    setSubmissionError(null);
    setShowExistingAccountPrompt(false);
    try {
      const resolvedProgram =
        overrides?.resolvedProgram ||
        formData.resolvedProgram ||
        resolveMensHealthCanonicalKey(formData.concern);
      const panelTier =
        overrides?.panelTier ||
        formData.panelTier ||
        resolveRequiredPanelTier(resolvedProgram);

      const result = await submitPublicIntake({
        programType: "MENS_HEALTH",
        ...formData,
        ...quizAnswers,
        concern: normalizeSexualHealthConcern(formData.concern),
        resolvedProgram,
        panelTier,
        billingPanelTier: publicTierToBillingTier(panelTier),
        cardNumber: undefined,
        cardExpiry: undefined,
        cardCvc: undefined,
        cardName: undefined,
      });

      if (result.ok) {
        setUserId(result.userId);
        toast.success("Details saved", {
          description: "Now choose your consultation time.",
        });
        return true;
      }

      if (result.emailExists) {
        const firstName = await fetchExistingAccountFirstName(formData.email);
        setExistingUserFirstName(firstName);
        setShowExistingAccountPrompt(true);
        return false;
      }

      setSubmissionError(result.message);
      toast.error("Could not save your details", { description: result.message });
      return false;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setSubmissionError(message);
      toast.error("Could not save your details", { description: message });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnalyseComplete = async () => {
    const program = resolveMensHealthCanonicalKey(formData.concern);
    const panelTier = resolveRequiredPanelTier(program);
    setFormData((prev) => ({
      ...prev,
      resolvedProgram: program,
      panelTier,
    }));

    if (isSexualFlow) {
      const saved = await saveMensIntake({ resolvedProgram: program, panelTier });
      if (saved) {
        setStep(sexualBounds.checkout);
        window.scrollTo(0, 0);
      }
      return;
    }

    setStep(snapshotStep);
    window.scrollTo(0, 0);
  };

  const formatSlotDate = (isoString: string) =>
    new Date(isoString).toLocaleDateString("en-AU", {
      timeZone: patientTimezone,
      weekday: "short",
      day: "numeric",
      month: "short",
    });

  const formatSlotTime = (isoString: string) =>
    new Date(isoString).toLocaleTimeString("en-AU", {
      timeZone: patientTimezone,
      hour: "numeric",
      minute: "2-digit",
    });

  const handleSlotSelection = async (slot: UnifiedSlot) => {
    if (slot.availabilityStatus === "BOOKED" || creatingHold) return;
    if (formData.selectedSlotId === slot.slotId) return;

    const previousHoldId = bookingHoldId;
    const previousSlotId = formData.selectedSlotId;
    setCreatingHold(true);
    setSelectingSlotId(slot.slotId);
    setSlotsError(null);

    try {
      updateFormData("selectedSlotId", slot.slotId);
      updateFormData("consultationDate", formatSlotDate(slot.startTime));
      updateFormData("consultationTime", formatSlotTime(slot.startTime));

      const response = await fetch("/api/bookings/hold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId || undefined,
          slotId: slot.slotId,
          programType: "MENS_HEALTH",
          patientPhone: formData.phone || undefined,
          riskFlags: ["MENS_HEALTH_PROGRAM"],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to reserve this time");
      }

      setBookingHoldId(data.bookingHoldId);
      setHoldExpiry(new Date(data.holdExpiryTime));
      setSlotsRefreshKey((k) => k + 1);

      if (previousHoldId && previousHoldId !== data.bookingHoldId) {
        fetch(`/api/bookings/hold?holdId=${previousHoldId}`, {
          method: "DELETE",
        }).catch(() => {});
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reserve this time";
      setSlotsError(message);
      updateFormData("selectedSlotId", previousSlotId);
      if (!previousSlotId) {
        updateFormData("consultationDate", "");
        updateFormData("consultationTime", "");
      }
      setBookingHoldId(previousHoldId);
      toast.error("Could not reserve this slot", { description: message });
    } finally {
      setCreatingHold(false);
      setSelectingSlotId(null);
    }
  };

  const handleCheckoutPaymentSuccess = async (result: {
    paymentIntentId?: string;
    consentRecordId: string;
  }) => {
    if (!bookingHoldId) {
      setStep(thankYouStep);
      return;
    }

    try {
      const response = await fetch("/api/bookings/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingHoldId,
          paymentIntentId: result.paymentIntentId || "pi_mens_manual_confirmation",
          consentRecordId: result.consentRecordId,
          userId,
          clientOrigin:
            typeof window !== "undefined" ? window.location.origin : undefined,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        if (data.magicLink) setPortalMagicLink(data.magicLink);
        toast.success("Booking confirmed", {
          description: `Your consultation is scheduled for ${formData.consultationDate} at ${formData.consultationTime}`,
        });
      } else {
        toast.success("Payment successful", {
          description: data.error || "Your consultation will be confirmed shortly.",
        });
      }
    } catch (error) {
      console.error("[Mens Assessment] Booking confirmation error:", error);
      toast.success("Payment successful", {
        description: "Your consultation will be confirmed shortly.",
      });
    } finally {
      setBookingHoldId(null);
      setHoldExpiry(null);
      setStep(thankYouStep);
      window.scrollTo(0, 0);
    }
  };

  const handleCheckoutPaymentError = (error: string) => {
    toast.error("Payment failed", { description: error });
  };

  const handleSnapshotContinue = async () => {
    const saved = await saveMensIntake();
    if (saved) {
      setStep(checkoutStep);
      window.scrollTo(0, 0);
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

  const renderSexualHealthQuizQuestion = (question: QuizStep) => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">{question.prompt}</h1>
        {question.subtitle && (
          <p className="mt-3 text-[#5c7a52]">{question.subtitle}</p>
        )}
      </div>
      <div className="space-y-3 mt-8">
        {question.options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => selectSexualQuizAnswer(question, option.id)}
            className={`w-full py-4 px-5 rounded-xl border-2 text-left transition-all ${
              quizAnswers[question.id] === option.id
                ? "border-[#5c7a52] bg-[#5c7a52]/10"
                : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"
            }`}
          >
            <span className="font-medium text-[#2c3628]">{option.label}</span>
            {option.description && (
              <span className="block text-sm text-[#7e9a72] mt-0.5">{option.description}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderSexualFlowStep = () => {
    if (step >= sexualBounds.quizStart && step < sexualBounds.contact) {
      const question = sexualQuizSteps[step - sexualBounds.quizStart];
      if (question) return renderSexualHealthQuizQuestion(question);
    }

    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628] text-center">
              Your path to doctor-led sexual health care
            </h1>
            <p className="text-center text-[#5c7a52]">
              Complete a confidential assessment, then book your doctor consultation — the same clinical pathway as in your Sanative portal.
            </p>
            <div className="space-y-4 mt-8">
              {[
                {
                  num: 1,
                  title: "Clinical assessment",
                  description: "Answer the same confidential questions our doctors use to understand your sexual health concerns.",
                  icon: Heart,
                },
                {
                  num: 2,
                  title: "Doctor consultation",
                  description: "Book a telehealth appointment with an AHPRA-registered Australian doctor.",
                  icon: Stethoscope,
                },
                {
                  num: 3,
                  title: "Personalised care planning",
                  description: "Your doctor reviews your history and discusses what is clinically appropriate for you in private.",
                  icon: MessageCircle,
                },
                {
                  num: 4,
                  title: "Ongoing support",
                  description: "Care team messaging and follow-up in your portal if a program is suitable.",
                  icon: Shield,
                },
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

      case 4:
        return (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#5c7a52] to-[#34412f] rounded-2xl flex items-center justify-center rotate-3">
              <Heart className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">Now, a few health questions</h1>
            <p className="text-[#5c7a52] max-w-md mx-auto">
              These match the in-portal sexual health assessment so your doctor receives consistent clinical information.
            </p>
          </div>
        );

      case sexualBounds.contact:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">Contact details</h1>
              <p className="mt-3 text-[#5c7a52]">We&apos;ll use these to arrange your consultation and follow-up.</p>
            </div>
            <div className="space-y-4 mt-8">
              <div>
                <label className="block text-sm font-medium text-[#2c3628] mb-2">Mobile number</label>
                <input type="tel" value={formData.phone} onChange={(e) => updateFormData("phone", e.target.value.replace(/[^0-9+]/g, ""))} className="w-full px-4 py-4 rounded-xl border border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 outline-none transition-all bg-white" placeholder="04XX XXX XXX" />
                <p className="text-xs text-[#7e9a72] mt-2">We&apos;ll SMS you when your doctor has reviewed your assessment.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#2c3628] mb-2">Postcode</label>
                <input type="text" value={formData.postcode} onChange={(e) => updateFormData("postcode", e.target.value.replace(/\D/g, "").slice(0, 4))} className="w-full px-4 py-4 rounded-xl border border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 outline-none transition-all bg-white" placeholder="e.g. 2000" maxLength={4} />
              </div>
            </div>
          </div>
        );

      case sexualBounds.consent:
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

      case sexualBounds.analyse:
        return (
          <MensAnalyseStep
            concernLabel="sexual health"
            onComplete={() => {
              void handleAnalyseComplete();
            }}
          />
        );

      case sexualBounds.checkout:
        return (
          <UnifiedCheckoutScreen
            formData={{
              consultationDate: formData.consultationDate,
              consultationTime: formData.consultationTime,
              selectedSlotId: formData.selectedSlotId,
              email: formData.email,
              firstName: formData.firstName,
              lastName: formData.lastName,
            }}
            userId={userId}
            bookingHoldId={bookingHoldId}
            holdCountdown={holdCountdown}
            offerCountdown={offerCountdown}
            slotsError={slotsError}
            slotsRefreshKey={slotsRefreshKey}
            creatingHold={creatingHold}
            selectingSlotId={selectingSlotId}
            onSlotSelect={handleSlotSelection}
            onSlotsError={setSlotsError}
            onPaymentSuccess={handleCheckoutPaymentSuccess}
            onPaymentError={handleCheckoutPaymentError}
            patientTimezone={patientTimezone}
            pricing={MENS_CHECKOUT_PRICING}
            valueProps={mensCheckoutValueProps}
            programType="mens_health"
          />
        );

      case sexualBounds.thankYou:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#5c7a52] to-[#34412f] rounded-2xl flex items-center justify-center">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">You&apos;re booked in</h1>
            <p className="text-[#5c7a52] max-w-md mx-auto">
              Your assessment is with our care team for triage. A doctor will review your suitability and discuss what is clinically appropriate for you.
            </p>
            <div className="bg-white rounded-2xl border border-[#e6ebe3] p-5 text-left space-y-3">
              <p className="font-semibold text-[#2c3628]">What happens next</p>
              {[
                "Care team triage for men's sexual health",
                "Doctor consultation at your selected time",
                "Program access in your portal if clinically appropriate",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-[#5c7a52]">
                  <Check className="w-4 h-4" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            {portalMagicLink && (
              <a href={portalMagicLink} className="btn-primary inline-flex items-center justify-center gap-2">
                Go to portal
                <ArrowRight className="w-5 h-5" />
              </a>
            )}
          </div>
        );

      default:
        break;
    }

    // Shared PII steps (1–3)
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">Let&apos;s start with your name</h1>
              <p className="mt-3 text-[#5c7a52]">Your legal name helps our clinical team safely review your assessment. We keep it completely private.</p>
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
              <p className="mt-3 text-[#5c7a52]">We&apos;ll send your assessment results and care team updates here.</p>
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
                  <p className="text-sm text-red-600 mt-2">Email addresses don&apos;t match</p>
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
              <p className="mt-3 text-[#5c7a52]">Age helps us interpret symptoms and medical history accurately.</p>
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
              {formData.dateOfBirth.length === 10 && isValidAge && <p className="mt-4 text-sm text-[#5c7a52] text-center">Great, you&apos;re {age} years old.</p>}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderStep = () => {
    if (isSexualFlow) {
      return renderSexualFlowStep();
    }

    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628] text-center">Your path to better energy and vitality</h1>
            <p className="text-center text-[#5c7a52]">Here's what to expect — personalised, practical, and confidential</p>
            <div className="space-y-4 mt-8">
              {[
                { num: 1, title: "Quick health check", description: "A few questions about energy, sleep, stress, hormones, and metabolic health.", icon: Heart },
                { num: 2, title: "Biomarker-led review", description: "We identify which markers may explain fatigue, low drive, or poor recovery.", icon: Stethoscope },
                { num: 3, title: "Doctor-guided plan", description: "If suitable, you'll receive a personalised plan for energy, vitality, and wellbeing.", icon: MessageCircle },
                { num: 4, title: "Ongoing support", description: "Your care plan can include labs, lifestyle support, and doctor follow-up where appropriate.", icon: Package },
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
              <p className="mt-3 text-[#5c7a52]">Your legal name helps our clinical team safely review your assessment. We keep it completely private.</p>
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
              <p className="mt-3 text-[#5c7a52]">We&apos;ll send your assessment results and care team updates here.</p>
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
              <p className="mt-3 text-[#5c7a52]">Age helps us interpret symptoms, risk factors, and biomarker patterns accurately.</p>
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
            <p className="text-[#5c7a52] max-w-md mx-auto">This helps our doctors understand what may be driving low energy, poor recovery, or reduced vitality.</p>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">How long have you noticed changes in your energy or vitality?</h1>
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
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">How much is this affecting you?</h1>
              <p className="mt-3 text-[#5c7a52]">This helps us understand the impact on your daily life and wellbeing.</p>
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
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">What best describes what you're experiencing?</h1>
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
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">When is your energy usually lowest?</h1>
              <p className="mt-3 text-[#5c7a52]">Energy patterns can point toward sleep, stress, metabolic, or hormone-related drivers.</p>
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
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">What do you think might be contributing?</h1>
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
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">Are you taking regular medications?</h1>
              <p className="mt-3 text-[#5c7a52]">Some medications can affect energy, sleep, hormones, mood, or metabolic health.</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800"><strong>Important:</strong> Please include heart, blood pressure, mood, sleep, hormone, and pain medications during your doctor review.</p>
            </div>
            <div className="space-y-3 mt-8">
              {[{ value: "no", label: "No regular medications" }, { value: "yes", label: "Yes, I take regular medication" }, { value: "not-sure", label: "I'm not sure" }].map((option) => (
                <button key={option.value} type="button" onClick={() => { updateFormData("takingNitrates", option.value); setTimeout(nextStep, 300); }} className={`w-full py-4 px-6 rounded-xl border-2 text-center transition-all ${formData.takingNitrates === option.value ? "border-[#5c7a52] bg-[#5c7a52]/10 text-[#2c3628]" : "border-[#e6ebe3] bg-white text-[#2c3628] hover:border-[#cdd8c6]"}`}>{option.label}</button>
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
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">Have you tried anything for energy or vitality before?</h1>
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
              <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">What's your main goal?</h1>
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
              <p className="mt-3 text-[#5c7a52]">We'll use these to arrange your consultation and follow-up.</p>
            </div>
            <div className="space-y-4 mt-8">
              <div>
                <label className="block text-sm font-medium text-[#2c3628] mb-2">Mobile number</label>
                <input type="tel" value={formData.phone} onChange={(e) => updateFormData("phone", e.target.value.replace(/[^0-9+]/g, ""))} className="w-full px-4 py-4 rounded-xl border border-[#cdd8c6] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20 outline-none transition-all bg-white" placeholder="04XX XXX XXX" />
                <p className="text-xs text-[#7e9a72] mt-2">We'll SMS you when your doctor has reviewed your assessment.</p>
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
          <MensAnalyseStep
            concernLabel="energy and vitality"
            onComplete={() => {
              void handleAnalyseComplete();
            }}
          />
        );

      case 19: {
        const risks = scoreMensHealth(formData as unknown as Record<string, unknown>, campaigns);
        return (
          <BiomarkerSnapshot
            risks={risks}
            primaryProgram="Men's Health Program"
            primaryPrice="$49 first month"
            firstName={formData.firstName}
            offerMode="advancedPanel"
            marketingHeadline="Biomarker analysis defines the biological starting point for your treatment plan"
            marketingSubcopy={`Get your ${resolvedPanelPlan.name}, book your doctor consultation, and unlock a precise action plan based on your results.`}
            advancedPanel={{
              name: resolvedPanelPlan.name,
              priceAud: resolvedPanelPlan.priceAud,
              billingLabel: resolvedPanelPlan.billingLabel,
              markerCount: resolvedPanelPlan.markerCount,
              tagline: resolvedPanelPlan.tagline,
              highlights: resolvedPanelPlan.highlights,
              onSelect: () => {
                window.location.href = `/biomarkers/checkout?package=${resolvedPanelTier}&source=mens_health&skipQuiz=1`;
              },
            }}
            onPrimary={handleSnapshotContinue}
            onLabs={() => {
              window.location.href = `/biomarkers/checkout?package=${resolvedPanelTier}&source=mens_health&skipQuiz=1`;
            }}
          />
        );
      }

      case 20:
        return (
          <UnifiedCheckoutScreen
            formData={{
              consultationDate: formData.consultationDate,
              consultationTime: formData.consultationTime,
              selectedSlotId: formData.selectedSlotId,
              email: formData.email,
              firstName: formData.firstName,
              lastName: formData.lastName,
            }}
            userId={userId}
            bookingHoldId={bookingHoldId}
            holdCountdown={holdCountdown}
            offerCountdown={offerCountdown}
            slotsError={slotsError}
            slotsRefreshKey={slotsRefreshKey}
            creatingHold={creatingHold}
            selectingSlotId={selectingSlotId}
            onSlotSelect={handleSlotSelection}
            onSlotsError={setSlotsError}
            onPaymentSuccess={handleCheckoutPaymentSuccess}
            onPaymentError={handleCheckoutPaymentError}
            patientTimezone={patientTimezone}
            pricing={MENS_CHECKOUT_PRICING}
            valueProps={mensCheckoutValueProps}
            programType="mens_health"
          />
        );

      case 21:
        return (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#5c7a52] to-[#34412f] rounded-2xl flex items-center justify-center">
              <Check className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
              You&apos;re booked in
            </h1>
            <p className="text-[#5c7a52] max-w-md mx-auto">
              Your assessment is with our care team for triage. A doctor will review your suitability and discuss what is clinically appropriate for you.
            </p>
            <div className="bg-white rounded-2xl border border-[#e6ebe3] p-5 text-left space-y-3">
              <p className="font-semibold text-[#2c3628]">What happens next</p>
              {[
                "Care team triage for men's health",
                "Doctor consultation at your selected time",
                "Program access in your portal if clinically appropriate",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm text-[#5c7a52]">
                  <Check className="w-4 h-4" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            {portalMagicLink && (
              <a
                href={portalMagicLink}
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                Go to portal
                <ArrowRight className="w-5 h-5" />
              </a>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const isCheckoutLayout = step === checkoutStep;

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {/* Progress bar - thin line at top */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#e6ebe3] z-50">
        <div className="h-full bg-[#5c7a52] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 bg-[#fdfbf7]/95 backdrop-blur-sm z-40 border-b border-[#e6ebe3]">
        <div className={`${isCheckoutLayout ? "max-w-6xl xl:max-w-7xl" : "max-w-2xl"} mx-auto px-4 sm:px-6 py-4 flex items-center justify-between`}>
          <Link href="/mens-health" className="text-2xl font-serif text-[#34412f]">Sanative</Link>
          <button type="button" onClick={() => setShowFAQ(true)} className="flex items-center gap-1.5 text-sm text-[#5c7a52] hover:text-[#34412f] transition-colors">
            <Info className="w-4 h-4" /><span>Help</span>
          </button>
        </div>
        {/* Step Progress Indicator - shown after intro step */}
        {step > 0 && step < thankYouStep && <ProgressStepIndicator />}
      </header>

      {/* Main content */}
      <main className={`${isCheckoutLayout ? "max-w-6xl xl:max-w-7xl px-4 sm:px-6" : "max-w-2xl px-4"} mx-auto py-8 pb-32`}>
        <div className="animate-fadeIn">{renderStep()}</div>
      </main>

      {/* Bottom navigation */}
      {step < totalSteps &&
        step !== analyseStep &&
        step !== snapshotStep &&
        step !== checkoutStep &&
        step !== thankYouStep && (
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

      {/* FAQ Modal */}
      {showFAQ && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-[#e6ebe3] flex items-center justify-between">
              <div className="flex items-center gap-2"><Info className="w-5 h-5 text-[#5c7a52]" /><span className="font-semibold text-[#2c3628]">Common questions</span></div>
              <button type="button" onClick={() => setShowFAQ(false)} className="p-2 hover:bg-[#f4f7f2] rounded-full transition-colors"><X className="w-5 h-5 text-[#5c7a52]" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div><h4 className="font-semibold text-[#2c3628] mb-2">What does this assessment look for?</h4><p className="text-sm text-[#5c7a52]">We look for patterns linked to hormones, thyroid function, metabolic health, sleep, stress, iron, vitamin levels, and cardiovascular risk.</p></div>
              <div><h4 className="font-semibold text-[#2c3628] mb-2">Will I need blood tests?</h4><p className="text-sm text-[#5c7a52]">Your doctor may recommend biomarkers if they can help identify the root cause of fatigue, low drive, or poor recovery.</p></div>
              <div><h4 className="font-semibold text-[#2c3628] mb-2">Is everything confidential?</h4><p className="text-sm text-[#5c7a52]">Absolutely. Your assessment and health information are encrypted and handled under Australian privacy standards.</p></div>
            </div>
          </div>
        </div>
      )}

      <ExistingAccountPrompt
        open={showExistingAccountPrompt}
        firstName={existingUserFirstName}
        loginHref={buildLoginRedirectUrl("/dashboard")}
        onUseDifferentEmail={handleUseDifferentEmail}
      />

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  );
}

export default function MensHealthAssessmentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center"><div className="w-8 h-8 border-2 border-[#5c7a52]/30 border-t-[#5c7a52] rounded-full animate-spin" /></div>}>
      <AssessmentContent />
    </Suspense>
  );
}
