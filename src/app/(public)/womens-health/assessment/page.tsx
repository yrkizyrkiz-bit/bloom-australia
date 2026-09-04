"use client";

import { useState, useMemo, useEffect, useCallback, Suspense, useRef } from "react";
import {
  resolveWomensHealthCanonicalKey,
} from "@/lib/funnel/public-consult-programs";
import { resolveRequiredPanelTier } from "@/lib/biomarkers/program-panel-requirements";
import { type BiomarkerSubscriptionTier } from "@/lib/biomarkers/public-subscription-panels";
import { publicTierToBillingTier } from "@/lib/biomarkers/public-checkout-tier-map";
import { getClinicalProgramFunnelConfig } from "@/lib/funnel/clinical-program-funnel";
import {
  digitsOnly,
  isQuizDobDayComplete,
  isQuizDobMonthComplete,
  splitQuizDob,
  validateQuizDob,
} from "@/lib/funnel/quiz-dob";
import {
  ProgramMembershipBackbone,
  type FunnelProfileFields,
} from "@/components/funnel/ProgramMembershipBackbone";
import { FunnelStepProgress } from "@/components/funnel/FunnelStepProgress";
import { WomensHealthInsightsJourney } from "@/components/quiz/WomensHealthInsightsJourney";
import { toast } from "sonner";
import { ExistingAccountPrompt } from "@/components/funnel/ExistingAccountPrompt";
import { ProspectiveMemberResumeVerification } from "@/components/funnel/ProspectiveMemberResumeVerification";
import {
  buildLoginRedirectUrl,
  fetchExistingAccountFirstName,
  submitPublicIntake,
} from "@/lib/funnel/intake-response";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, ArrowLeft, Check, X, Info, Heart, HeartPulse, AlertTriangle, Loader2, Shield, Flame, Pill, Baby, Sparkles } from "lucide-react";


// Processing Step Component with animation
function ProcessingStep({ categoryName, onComplete }: { categoryName: string; onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);

  const messages = [
    "Analysing your health profile...",
    "Reviewing your symptoms...",
    "Matching with treatment options...",
    "Preparing your recommendations...",
  ];

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 60);

    const messageInterval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length);
    }, 800);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [onComplete, messages.length]);

  return (
    <div className="space-y-5 py-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-5 relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#c17a58] to-[#a86548] animate-pulse" />
          <div className="absolute inset-0 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white animate-bounce" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-serif text-[#2c3628] mb-2">
          Analysing your responses
        </h1>

        <p className="text-sm text-[#5c7a52] max-w-md mx-auto mb-5">
          Reviewing your {categoryName.toLowerCase()} health profile...
        </p>

        <div className="max-w-sm mx-auto mb-4">
          <div className="h-2 bg-[#f8e1e1] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#c17a58] to-[#a86548] rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-[#7e9a72] mt-2">{progress}% complete</p>
        </div>

        <div className="h-5">
          <p className="text-sm text-[#c17a58] font-medium animate-pulse">
            {messages[currentMessage]}
          </p>
        </div>
      </div>

      <div className="flex justify-center gap-2.5 mt-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              progress > i * 25 ? "bg-[#c17a58]" : "bg-[#f8e1e1]"
            }`}
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  category: string;
  primaryConcerns: string[];
  symptomDuration: string;
  currentTreatments: string[];
  medicalConditions: string[];
  menstrualStatus: string;
  familyHistory: string[];
  goals: string[];
  postcode: string;
  address: string;
  streetAddress: string;
  addressUnit: string;
  suburb: string;
  state: string;
  consultationDate: string;
  consultationTime: string;
  selectedSlotId: string;
  selectedDate: Date | null;
  selectedTime: string;
  /** Canonical program key, or "" when unsure (doctor classifies). */
  resolvedProgram: string;
  /** Public panel tier resolved at analyse step. */
  panelTier: BiomarkerSubscriptionTier | "";
}

const healthCategories = [
  { id: "menopause", label: "Menopause & Perimenopause", description: "Hot flushes, night sweats, mood changes", icon: Flame, color: "#c17a58" },
  { id: "hrt", label: "Hormone Replacement Therapy", description: "Starting, adjusting, or reviewing HRT", icon: Pill, color: "#8b6b8b" },
  { id: "contraception", label: "Contraception", description: "Birth control options and advice", icon: Shield, color: "#5a8b8b" },
  { id: "fertility", label: "Fertility & Hormonal Health", description: "PCOS, cycle issues, preconception", icon: Baby, color: "#c17a58" },
  { id: "sexual", label: "Sexual Health & Intimacy", description: "Libido, intimacy, comfort and desire", icon: HeartPulse, color: "#a86548" },
  { id: "unsure", label: "Not sure where to start", description: "Fatigue, mood, cycles, weight, or just not feeling yourself", icon: Heart, color: "#c17a58" },
];

const primaryConcernsByCategory: Record<string, string[]> = {
  menopause: ["Hot flushes", "Night sweats", "Sleep disturbances", "Mood changes", "Brain fog", "Vaginal dryness", "Low libido", "Weight gain", "Joint pain", "Fatigue"],
  hrt: ["Starting HRT", "Reviewing current HRT", "Adjusting dosage", "Switching HRT type", "Managing side effects", "HRT safety questions"],
  contraception: ["Starting contraception", "Changing method", "Side effects", "Emergency contraception", "Post-pregnancy", "Long-acting options"],
  fertility: ["Irregular periods", "PCOS symptoms", "Trying to conceive", "Preconception health", "Hormonal imbalance", "Endometriosis"],
  sexual: [
    "Low libido or reduced desire",
    "Discomfort or pain with intimacy",
    "Desire or arousal changes",
    "Menopause-related sexual changes",
    "Vaginal dryness affecting intimacy",
    "Other intimacy concerns",
  ],
  unsure: ["Hormonal concerns", "Menstrual issues", "Pelvic pain", "Breast health", "Fatigue or low energy", "Mood or sleep", "Other"],
};

const symptomDurationOptions = ["Less than 1 month", "1-3 months", "3-6 months", "6-12 months", "More than 1 year", "Several years"];
const currentTreatmentOptions = ["HRT (patches, gel, tablets)", "Oral contraceptive", "Hormonal IUD", "Antidepressants", "Supplements", "Other medication", "No current treatment"];
const medicalConditionsOptions = ["High blood pressure", "Diabetes", "Blood clotting disorder", "Breast cancer history", "Ovarian cancer history", "Heart disease", "Stroke", "Liver disease", "Migraines with aura", "Endometriosis", "Fibroids", "PCOS", "Thyroid condition", "None of these"];
const menstrualStatusOptions = ["Regular periods", "Irregular periods", "Menopause (stopped)", "Perimenopause", "No periods (contraception)", "Post-hysterectomy"];
const familyHistoryOptions = ["Breast cancer", "Ovarian cancer", "Blood clots", "Early heart disease", "Early stroke", "Osteoporosis", "None of these"];
const goalsOptions = [{ id: "symptoms", label: "Relieve symptoms" }, { id: "understand", label: "Understand options" }, { id: "start", label: "Start treatment" }, { id: "review", label: "Review treatment" }, { id: "prevention", label: "Preventive health" }, { id: "fertility", label: "Optimise fertility" }];

function WomensHealthAssessmentContent() {
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get("category");
  const validCategories = ["menopause", "hrt", "contraception", "fertility", "sexual", "unsure"];
  // Legacy ?category=general maps to unsure (undiagnosed path).
  const normalizedUrlCategory =
    categoryFromUrl === "general" ? "unsure" : categoryFromUrl;
  const preselectedCategory =
    normalizedUrlCategory && validCategories.includes(normalizedUrlCategory)
      ? normalizedUrlCategory
      : "";

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    firstName: "", lastName: "", email: "", phone: "", dateOfBirth: "", category: preselectedCategory,
    primaryConcerns: [], symptomDuration: "", currentTreatments: [], medicalConditions: [],
    menstrualStatus: "", familyHistory: [], goals: [], postcode: "", address: "",
    streetAddress: "", addressUnit: "", suburb: "", state: "",
    consultationDate: "", consultationTime: "", selectedSlotId: "",
    selectedDate: null, selectedTime: "",
    resolvedProgram: "",
    panelTier: "",
  });
  const [showFAQ, setShowFAQ] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPreselectedCategory] = useState(!!preselectedCategory);
  const [userId, setUserId] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [showExistingAccountPrompt, setShowExistingAccountPrompt] = useState(false);
  const [showResumeVerification, setShowResumeVerification] = useState(false);
  const [resumeVerificationFirstName, setResumeVerificationFirstName] = useState<string | null>(null);
  const [existingUserFirstName, setExistingUserFirstName] = useState<string | null>(null);
  const [showMembershipBackbone, setShowMembershipBackbone] = useState(false);
  const [advanceMembershipToPay, setAdvanceMembershipToPay] = useState(false);
  const latestProfileRef = useRef<FunnelProfileFields | null>(null);

  const totalSteps = 15;
  const progress = ((step + 1) / totalSteps) * 100;
  const currentPhase = step <= 3 ? 1 : step <= 12 ? 2 : 3;
  const selectedCategoryInfo = healthCategories.find(c => c.id === formData.category);

  const updateFormData = (
    field: keyof FormData,
    value: string | string[] | Date | null
  ) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleAnalyseComplete = useCallback(() => {
    const program = resolveWomensHealthCanonicalKey(formData.category);
    const tier = resolveRequiredPanelTier(program);
    setFormData((prev) => ({
      ...prev,
      resolvedProgram: program ?? "",
      panelTier: tier,
    }));
    setShowMembershipBackbone(true);
    window.scrollTo(0, 0);
  }, [formData.category]);

  const toggleArrayField = (field: keyof FormData, value: string) => {
    setFormData(prev => {
      const current = prev[field] as string[];
      const noneValues = ["None of these", "No current treatment"];
      if (noneValues.includes(value)) return { ...prev, [field]: current.includes(value) ? [] : [value] };
      if (current.includes(value)) return { ...prev, [field]: current.filter(v => v !== value) };
      return { ...prev, [field]: [...current.filter(v => !noneValues.includes(v)), value] };
    });
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [step]);

  const isMenopausePath = formData.category === "menopause" || preselectedCategory === "menopause";

  const questionTitle = (title: string, subtitle?: string) => (
    <div className="text-center mb-8 sm:mb-10">
      <h1 className="text-3xl sm:text-4xl font-semibold text-[#1C1C1C] leading-tight tracking-tight">
        {title}
      </h1>
      {subtitle ? <p className="mt-3 text-base text-[#5c7a52]">{subtitle}</p> : null}
    </div>
  );

  const optionButtonClass = (selected: boolean) =>
    `w-full py-4 sm:py-[1.125rem] px-6 rounded-2xl border text-left transition-all ${
      selected
        ? "border-[#c17a58] bg-[#fef4f0] shadow-sm"
        : "border-[#e5e5e5] bg-white hover:border-[#d4d4d4]"
    }`;

  const renderCheckboxOption = (option: string, field: keyof FormData, selected: boolean) => (
    <button
      key={option}
      type="button"
      onClick={() => toggleArrayField(field, option)}
      className={`${optionButtonClass(selected)} flex items-center gap-3`}
    >
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
          selected ? "border-[#c17a58] bg-[#c17a58]" : "border-[#d4d4d4]"
        }`}
      >
        {selected && <Check className="w-3 h-3 text-white" />}
      </div>
      <span className="text-base sm:text-lg font-semibold text-[#1C1C1C] leading-snug">
        {option}
      </span>
    </button>
  );

  const renderOptionGrid = (
    options: string[],
    field: keyof FormData,
    selectedValues: string[]
  ) => (
    <div className="space-y-3">
      {options.map((o) => renderCheckboxOption(o, field, selectedValues.includes(o)))}
    </div>
  );

  const dob = validateQuizDob(formData.dateOfBirth);
  const dobParts = splitQuizDob(formData.dateOfBirth);

  const canProceed = () => {
    switch (step) {
      case 0: return true;
      case 1: return formData.firstName.trim() && formData.lastName.trim();
      case 2: return formData.email.includes("@") && formData.email.includes(".");
      case 3: return dob.isValid;
      case 4: return true;
      case 5: return formData.category !== "";
      case 6: return formData.primaryConcerns.length > 0;
      case 7: return formData.symptomDuration !== "";
      case 8: return formData.currentTreatments.length > 0;
      case 9: return formData.medicalConditions.length > 0;
      case 10: return formData.menstrualStatus !== "";
      case 11: return formData.familyHistory.length > 0;
      case 12: return formData.goals.length > 0;
      case 13: return true; // Processing/analysis step - auto-proceeds
      case 14: return true;
      default: return true;
    }
  };

  const nextStep = () => {
    if (canProceed() && step < totalSteps) {
      // Skip step 5 (category selection) if category is preselected
      let nextStepNum = step + 1;
      if (hasPreselectedCategory && step === 4) {
        nextStepNum = 6; // Skip to concerns
      }
      setStep(nextStepNum);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      // Skip step 5 when going back if category is preselected
      let prevStepNum = step - 1;
      if (hasPreselectedCategory && step === 6) {
        prevStepNum = 4; // Skip back to health intro
      }
      setStep(prevStepNum);
      window.scrollTo(0, 0);
    }
  };

  const handleUseDifferentEmail = () => {
    setShowExistingAccountPrompt(false);
    setShowResumeVerification(false);
    setExistingUserFirstName(null);
    setResumeVerificationFirstName(null);
    setSubmissionError(null);
    updateFormData("email", "");
    setStep(2);
    window.scrollTo(0, 0);
  };

  const saveWomensIntake = async (options?: {
    resumeVerificationToken?: string;
    profile?: FunnelProfileFields;
  }): Promise<boolean> => {
    setIsProcessing(true);
    setSubmissionError(null);
    setShowExistingAccountPrompt(false);
    try {
      const profile = options?.profile || latestProfileRef.current;
      const streetAddress = profile?.streetAddress || formData.streetAddress || formData.address;
      const result = await submitPublicIntake(
        {
          programType: "WOMENS_HEALTH",
          ...formData,
          ...(profile ?? {}),
          address: streetAddress,
          streetAddress,
          selectedDate: formData.selectedDate?.toISOString(),
          resolvedProgram: formData.resolvedProgram || null,
          panelTier: formData.panelTier || null,
          billingPanelTier: formData.panelTier
            ? publicTierToBillingTier(formData.panelTier)
            : null,
          undiagnosed: !formData.resolvedProgram,
        },
        { resumeVerificationToken: options?.resumeVerificationToken }
      );

      if (result.ok) {
        setUserId(result.userId);
        setShowResumeVerification(false);
        toast.success("Details saved", {
          description: "Continue to complete your Sanative membership.",
        });
        return true;
      }

      if ("resumeVerificationRequired" in result && result.resumeVerificationRequired) {
        setResumeVerificationFirstName(result.firstName ?? null);
        setShowResumeVerification(true);
        return false;
      }

      if ("emailExists" in result && result.emailExists) {
        const firstName = await fetchExistingAccountFirstName(formData.email);
        setExistingUserFirstName(firstName);
        setShowExistingAccountPrompt(true);
        return false;
      }

      setSubmissionError("message" in result ? result.message : "Could not save your details");
      toast.error("Could not save your details", {
        description: "message" in result ? result.message : undefined,
      });
      return false;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setSubmissionError(message);
      toast.error("Could not save your details", { description: message });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const applyProfileToForm = (next: FunnelProfileFields) => {
    latestProfileRef.current = next;
    setFormData((prev) => ({
      ...prev,
      firstName: next.firstName,
      lastName: next.lastName,
      email: next.email,
      phone: next.phone,
      dateOfBirth: next.dateOfBirth,
      streetAddress: next.streetAddress,
      addressUnit: next.addressUnit,
      suburb: next.suburb,
      state: next.state,
      postcode: next.postcode,
      address: next.streetAddress,
    }));
  };

  const renderSingleSelectGrid = (
    options: string[],
    field: "symptomDuration" | "menstrualStatus",
    selectedValue: string
  ) => (
    <div className="space-y-3">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => {
            updateFormData(field, o);
            setTimeout(nextStep, 250);
          }}
          className={optionButtonClass(selectedValue === o)}
        >
          <span className="text-base sm:text-lg font-semibold text-[#1C1C1C] leading-snug">
            {o}
          </span>
        </button>
      ))}
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <WomensHealthInsightsJourney
          firstName={formData.firstName}
          categoryLabel={selectedCategoryInfo?.label}
          isUnsure={!formData.category || formData.category === "unsure"}
          className="py-5 sm:py-6 lg:py-7"
        />
      );

      case 1: return (
        <div>
          {questionTitle("Let's start with your name", "Required for any future prescriptions, kept confidential.")}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#2c3628] mb-1.5">First name</label>
              <input type="text" value={formData.firstName} onChange={e => updateFormData("firstName", e.target.value)} className="w-full px-5 py-4 rounded-2xl border border-[#e5e5e5] focus:border-[#c17a58] focus:ring-2 focus:ring-[#f8e1e1] outline-none bg-white text-base" placeholder="First name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2c3628] mb-1.5">Last name</label>
              <input type="text" value={formData.lastName} onChange={e => updateFormData("lastName", e.target.value)} className="w-full px-5 py-4 rounded-2xl border border-[#e5e5e5] focus:border-[#c17a58] focus:ring-2 focus:ring-[#f8e1e1] outline-none bg-white text-base" placeholder="Last name" />
            </div>
          </div>
        </div>
      );

      case 2: return (
        <div>
          {questionTitle("How can we reach you?", "We'll send your consultation details here.")}
          <div>
            <label className="block text-sm font-medium text-[#2c3628] mb-1.5">Email address</label>
            <input type="email" value={formData.email} onChange={e => updateFormData("email", e.target.value)} className="w-full px-5 py-4 rounded-2xl border border-[#e5e5e5] focus:border-[#c17a58] focus:ring-2 focus:ring-[#f8e1e1] outline-none bg-white text-base" placeholder="you@example.com" />
          </div>
          <p className="text-center text-sm text-[#7e9a72] mt-3">Already a patient? <Link href="/login" className="text-[#c17a58] underline">Sign in</Link></p>
        </div>
      );

      case 3: {
        const dobFieldClass = (hasError: boolean) =>
          `w-full px-3 py-4 rounded-2xl border text-center text-lg bg-white outline-none ${
            hasError
              ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
              : "border-[#e5e5e5] focus:border-[#c17a58]"
          }`;
        return (
        <div>
          {questionTitle("What is your date of birth?", "Important for personalising your care.")}
          <div className="flex gap-3 justify-center">
            <div className="w-20">
              <label className="block text-xs text-[#7e9a72] mb-1 text-center">Day</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={dobParts.day}
                onChange={(e) => {
                  const v = digitsOnly(e.target.value, 2);
                  updateFormData("dateOfBirth", `${v}/${dobParts.month}/${dobParts.year}`);
                  if (isQuizDobDayComplete(v)) document.getElementById("dob-m")?.focus();
                }}
                className={dobFieldClass(Boolean(dob.errors.day))}
                placeholder="DD"
                aria-invalid={Boolean(dob.errors.day)}
              />
            </div>
            <div className="w-20">
              <label className="block text-xs text-[#7e9a72] mb-1 text-center">Month</label>
              <input
                id="dob-m"
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={dobParts.month}
                onChange={(e) => {
                  const v = digitsOnly(e.target.value, 2);
                  updateFormData("dateOfBirth", `${dobParts.day}/${v}/${dobParts.year}`);
                  if (isQuizDobMonthComplete(v)) document.getElementById("dob-y")?.focus();
                }}
                className={dobFieldClass(Boolean(dob.errors.month))}
                placeholder="MM"
                aria-invalid={Boolean(dob.errors.month)}
              />
            </div>
            <div className="w-28">
              <label className="block text-xs text-[#7e9a72] mb-1 text-center">Year</label>
              <input
                id="dob-y"
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={dobParts.year}
                onChange={(e) => {
                  const v = digitsOnly(e.target.value, 4);
                  updateFormData("dateOfBirth", `${dobParts.day}/${dobParts.month}/${v}`);
                }}
                className={dobFieldClass(Boolean(dob.errors.year))}
                placeholder="YYYY"
                aria-invalid={Boolean(dob.errors.year)}
              />
            </div>
          </div>
          {(dob.errors.day || dob.errors.month || dob.errors.year || dob.errors.form) && (
            <div className="mt-3 space-y-1 text-center text-sm text-red-600">
              {dob.errors.day && <p>{dob.errors.day}</p>}
              {dob.errors.month && <p>{dob.errors.month}</p>}
              {dob.errors.year && <p>{dob.errors.year}</p>}
              {dob.errors.form && <p>{dob.errors.form}</p>}
            </div>
          )}
          {dob.isValid && (
            <p className="mt-3 text-sm text-[#5c7a52] text-center">Great, you&apos;re {dob.age} years old.</p>
          )}
        </div>
        );
      }

      case 4: return (
        <div className="text-center space-y-5">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold text-[#1C1C1C] leading-tight tracking-tight">
              {selectedCategoryInfo
                ? `Let's learn about your ${selectedCategoryInfo.label.toLowerCase()} concerns`
                : "Now for your health profile"}
            </h1>
            <p className="mt-3 text-base text-[#5c7a52] max-w-md mx-auto">
              A few clinical questions so your doctor can personalise care.
            </p>
          </div>

          <div className="mx-auto w-full max-w-[280px] sm:max-w-xs">
            {/* eslint-disable-next-line @next/next/no-img-element -- quiz step needs a reliable local public asset */}
            <img
              src="/images/womens-health-doctor.webp"
              alt="AHPRA-registered doctor for women's health care"
              width={819}
              height={1024}
              className="w-full h-auto rounded-3xl shadow-lg border border-[#e8ebe3] bg-[#e8ebe3]"
            />
          </div>

          <div className="bg-[#fef4f0] rounded-xl p-3 max-w-sm mx-auto">
            <p className="text-sm text-[#5c7a52]">
              <span className="font-medium text-[#2c3628]">Privacy:</span> All information is confidential.
            </p>
          </div>
        </div>
      );

      case 5: return (
        <div>
          {questionTitle("What brings you here today?")}
          <div className="space-y-3">
            {healthCategories.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => { updateFormData("category", c.id); setTimeout(nextStep, 250); }}
                className={optionButtonClass(formData.category === c.id)}
              >
                <span className="text-base sm:text-lg font-semibold text-[#1C1C1C]">{c.label}</span>
                <span className="block text-sm text-[#5c7a52] mt-1">{c.description}</span>
              </button>
            ))}
          </div>
        </div>
      );

      case 6: return (
        <div>
          {questionTitle("What are your main concerns?", "Select all that apply.")}
          {renderOptionGrid(
            primaryConcernsByCategory[formData.category] || primaryConcernsByCategory.unsure,
            "primaryConcerns",
            formData.primaryConcerns
          )}
        </div>
      );

      case 7: return (
        <div>
          {questionTitle("How long have you had these concerns?")}
          {renderSingleSelectGrid(symptomDurationOptions, "symptomDuration", formData.symptomDuration)}
        </div>
      );

      case 8: return (
        <div>
          {questionTitle("Current treatments?", "Select all that apply.")}
          {renderOptionGrid(currentTreatmentOptions, "currentTreatments", formData.currentTreatments)}
        </div>
      );

      case 9: return (
        <div>
          {questionTitle("Any of these conditions?", "Helps ensure treatment is safe.")}
          {formData.medicalConditions.some(c => ["Blood clotting disorder", "Breast cancer history"].includes(c)) && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">Some conditions need specialist review.</p>
            </div>
          )}
          {renderOptionGrid(medicalConditionsOptions, "medicalConditions", formData.medicalConditions)}
        </div>
      );

      case 10: return (
        <div>
          {questionTitle(
            isMenopausePath ? "Where are you in your cycle journey?" : "Your menstrual status?"
          )}
          {renderSingleSelectGrid(
            isMenopausePath
              ? ["Perimenopause", "Menopause (stopped)", "Post-hysterectomy", "Irregular periods", "Regular periods", "No periods (contraception)"]
              : menstrualStatusOptions,
            "menstrualStatus",
            formData.menstrualStatus
          )}
        </div>
      );

      case 11: return (
        <div>
          {questionTitle("Family history?", "Parents, siblings, or grandparents.")}
          {renderOptionGrid(familyHistoryOptions, "familyHistory", formData.familyHistory)}
        </div>
      );

      case 12: return (
        <div>
          {questionTitle("What are your goals?", "Select all that apply.")}
          {renderOptionGrid(
            goalsOptions.map((o) => o.label),
            "goals",
            formData.goals
          )}
        </div>
      );

      case 13: return (
        <ProcessingStep
          categoryName={selectedCategoryInfo?.label || "women's health"}
          onComplete={handleAnalyseComplete}
        />
      );

      default:
        return null;
    }
  };

  const accountModals = (
    <>
      <ExistingAccountPrompt
        open={showExistingAccountPrompt}
        firstName={existingUserFirstName}
        loginHref={buildLoginRedirectUrl("/dashboard")}
        onUseDifferentEmail={handleUseDifferentEmail}
        accentClass="bg-[#c17a58]"
        accentHoverClass="hover:bg-[#a86548]"
      />
      <ProspectiveMemberResumeVerification
        open={showResumeVerification}
        email={formData.email}
        firstName={resumeVerificationFirstName}
        onVerified={async (sessionToken) => {
          const saved = await saveWomensIntake({ resumeVerificationToken: sessionToken });
          if (!saved) return;
          setShowMembershipBackbone(true);
          setAdvanceMembershipToPay(true);
        }}
        onUseDifferentEmail={handleUseDifferentEmail}
        accentClass="bg-[#c17a58] hover:bg-[#a86548]"
      />
    </>
  );

  if (showMembershipBackbone) {
    const categoryQuery = formData.category || preselectedCategory;
    return (
      <>
        <ProgramMembershipBackbone
          config={getClinicalProgramFunnelConfig("womens_health", formData.resolvedProgram)}
          userId={userId}
          returnPath={
            categoryQuery
              ? `/womens-health/assessment?category=${encodeURIComponent(categoryQuery)}`
              : "/womens-health/assessment"
          }
          advanceToPay={advanceMembershipToPay}
          profile={{
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone,
            dateOfBirth: formData.dateOfBirth,
            gender: "female",
            streetAddress: formData.streetAddress || formData.address,
            addressUnit: formData.addressUnit,
            suburb: formData.suburb,
            state: formData.state,
            postcode: formData.postcode,
          }}
          onProfileSave={async (next) => {
            applyProfileToForm(next);
            return saveWomensIntake({ profile: next });
          }}
        />
        {accountModals}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#f8e1e1] z-50"><div className="h-full bg-[#c17a58] transition-all duration-500" style={{ width: `${progress}%` }} /></div>
      <header className="sticky top-0 bg-[#fdfbf7]/95 backdrop-blur-sm z-40 border-b border-[#f8e1e1]">
        <div className={`${step === 0 ? "max-w-6xl" : "max-w-2xl"} mx-auto px-4 sm:px-6 ${step > 0 && step < 13 ? "pt-3 pb-0" : "py-3"} flex items-center justify-between`}>
          <Link href="/" className="text-2xl font-serif text-[#34412f]">Sanative</Link>
          <button type="button" onClick={() => setShowFAQ(true)} className="flex items-center gap-1.5 text-sm text-[#c17a58]"><Info className="w-4 h-4" />Help</button>
        </div>
        {step > 0 && step < 13 && (
          <FunnelStepProgress currentPhase={currentPhase} accent="terracotta" />
        )}
      </header>
      <main className={`px-4 mx-auto ${step === 0 ? "max-w-6xl py-4 pb-32" : step === 14 ? "max-w-6xl py-8 pb-32" : "max-w-2xl py-8 pb-32"}`}>{renderStep()}</main>
      {step < 13 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#f8e1e1] p-4">
          <div className={`${step === 0 ? "max-w-6xl" : "max-w-2xl"} mx-auto flex gap-3`}>
            {step > 0 && <button type="button" onClick={prevStep} className="px-5 py-4 rounded-2xl border border-[#e5e5e5] text-[#c17a58]"><ArrowLeft className="w-5 h-5" /></button>}
            <button type="button" onClick={nextStep} disabled={!canProceed()} className="flex-1 py-4 bg-[#c17a58] text-white font-semibold rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2 text-base">{step === 0 ? "Begin" : step === 4 ? "Continue" : "Next"}<ArrowRight className="w-5 h-5" /></button>
          </div>
        </div>
      )}
      {showFAQ && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-[#f8e1e1] flex items-center justify-between">
              <span className="font-semibold text-[#2c3628]">Common questions</span>
              <button type="button" onClick={() => setShowFAQ(false)} className="p-2 hover:bg-[#fef4f0] rounded-full"><X className="w-5 h-5 text-[#c17a58]" /></button>
            </div>
            <div className="p-6 space-y-6">
              {[["Who are your doctors?", "AHPRA-registered Australian practitioners."], ["Is it private?", "Yes, protected by Australian privacy laws."], ["Can I get prescriptions?", "If appropriate, delivered to your door."], ["Reschedule?", "Up to 24 hours before via dashboard."]].map(([q, a]) => <div key={q}><h4 className="font-semibold text-[#2c3628] mb-2">{q}</h4><p className="text-sm text-[#5c7a52]">{a}</p></div>)}
            </div>
          </div>
        </div>
      )}
      {accountModals}
    </div>
  );
}

export default function WomensHealthAssessmentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fdfbf7]" />}>
      <WomensHealthAssessmentContent />
    </Suspense>
  );
}
