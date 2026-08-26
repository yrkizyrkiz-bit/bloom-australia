"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { scoreHairLoss, fetchBiomarkerCampaigns, type BiomarkerCampaignData } from "@/lib/biomarkerScoring";
import { BiomarkerSnapshot } from "@/components/quiz/BiomarkerSnapshot";
import {
  navigateToProgramBiomarkersCheckout,
  type ProgramBiomarkersCheckoutHandoff,
} from "@/lib/funnel/program-biomarkers-checkout-handoff";
import {
  getBiomarkerSubscriptionPlan,
  type BiomarkerSubscriptionTier,
} from "@/lib/biomarkers/public-subscription-panels";
import { resolveRequiredPanelTier } from "@/lib/biomarkers/program-panel-requirements";
import { publicTierToBillingTier } from "@/lib/biomarkers/public-checkout-tier-map";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  Check,
  ChevronDown,
  Shield,
  MessageCircle,
  Clock,
  X,
  Info,
  Sparkles,
  Leaf,
  Stethoscope,
  Package,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { ExistingAccountPrompt } from "@/components/funnel/ExistingAccountPrompt";
import { ProspectiveMemberResumeVerification } from "@/components/funnel/ProspectiveMemberResumeVerification";
import {
  buildLoginRedirectUrl,
  fetchExistingAccountFirstName,
  submitPublicIntake,
} from "@/lib/funnel/intake-response";

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
  streetAddress: string;
  addressUnit: string;
  suburb: string;
  state: string;
  consultationDate: string;
  consultationTime: string;
  selectedSlotId: string;
  howHeard: string;
  /** Public panel tier resolved at analyse step. */
  panelTier: BiomarkerSubscriptionTier | "";
}

function HairAnalyseStep({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const messages = [
    "Analysing your hair health profile...",
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
        Reviewing your hair assessment to confirm the biomarker panel your care plan needs.
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

type GenderFilter = "all" | "male" | "female";

type GenderedOption = {
  label: string;
  gender?: GenderFilter;
};

// Hair stages for men (Norwood scale)
const maleHairStages = [
  { id: "not-sure", label: "I'm not sure yet", description: "That's okay, we'll help figure it out" },
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

const medicalConditions: GenderedOption[] = [
  { label: "Blood pressure concerns" },
  { label: "Dizziness or lightheadedness" },
  { label: "Heart rhythm issues" },
  { label: "Thyroid condition" },
  { label: "PCOS", gender: "female" },
  { label: "Heavy or irregular periods", gender: "female" },
  { label: "Menopause or perimenopause symptoms", gender: "female" },
  { label: "Prostate concerns or PSA monitoring", gender: "male" },
  { label: "Taking testosterone or anabolic steroids", gender: "male" },
  { label: "Autoimmune condition" },
  { label: "None of these apply to me" },
];

const otherConcernsOptions = [
  { id: "weight", label: "Weight management", gender: "all" },
  { id: "hormones", label: "Hormone optimisation", gender: "all" },
  { id: "womens-hormones", label: "Periods, PCOS or menopause support", gender: "female" },
  { id: "mens-health", label: "Men's sexual health", gender: "male" },
  { id: "sleep", label: "Sleep quality", gender: "all" },
  { id: "none", label: "Just hair health for now", gender: "all" },
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
    streetAddress: "",
    addressUnit: "",
    suburb: "",
    state: "",
    consultationDate: "",
    consultationTime: "",
    selectedSlotId: "",
    howHeard: "",
    panelTier: "",
  });
  const [showFAQ, setShowFAQ] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [showExistingAccountPrompt, setShowExistingAccountPrompt] = useState(false);
  const [showResumeVerification, setShowResumeVerification] = useState(false);
  const [resumeVerificationFirstName, setResumeVerificationFirstName] = useState<string | null>(null);
  const [existingUserFirstName, setExistingUserFirstName] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<BiomarkerCampaignData[]>([]);

  // Fetch biomarker campaigns on mount
  useEffect(() => {
    fetchBiomarkerCampaigns('HAIR_LOSS').then(setCampaigns);
  }, []);

  // After postcode: analyse → BiomarkerSnapshot → biomarkers checkout (Architecture A)
  const postcodeStep = formData.gender === "female" ? 12 : 11;
  const analyseStep = postcodeStep + 1;
  const snapshotStep = postcodeStep + 2;
  const totalSteps = snapshotStep + 1;
  const progress = ((step + 1) / totalSteps) * 100;

  const resolvedPanelTier = formData.panelTier || "advanced";
  const resolvedPanelPlan = getBiomarkerSubscriptionPlan(resolvedPanelTier);

  const handleContinueToBiomarkersCheckout = async (options?: {
    resumeVerificationToken?: string;
  }) => {
    const saved = await saveHairIntake(options);
    if (!saved) return;

    const panelTier = resolvedPanelTier;
    const handoff: ProgramBiomarkersCheckoutHandoff = {
      source: "hair_loss",
      skipQuiz: true,
      panelTier,
      programLabel: "Hair Loss",
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      dateOfBirth: formData.dateOfBirth,
      postcode: formData.postcode,
      gender: formData.gender || undefined,
      quizAnswers: {
        ...formData,
        panelTier,
        billingPanelTier: publicTierToBillingTier(panelTier),
        canonicalProgramKey: "HAIR_LOSS",
      },
    };
    navigateToProgramBiomarkersCheckout(handoff);
  };

  const handleAnalyseComplete = useCallback(() => {
    const panelTier = resolveRequiredPanelTier("HAIR_LOSS");
    setFormData((prev) => ({ ...prev, panelTier }));
    setStep(snapshotStep);
    window.scrollTo(0, 0);
  }, [snapshotStep]);
  const filteredMedicalConditions = useMemo(
    () =>
      medicalConditions.filter(
        (option) => !option.gender || option.gender === "all" || option.gender === formData.gender
      ),
    [formData.gender]
  );
  const filteredOtherConcernsOptions = useMemo(
    () =>
      otherConcernsOptions.filter(
        (option) => option.gender === "all" || option.gender === formData.gender
      ),
    [formData.gender]
  );

  useEffect(() => {
    if (!formData.gender) return;

    const validMedicalLabels = new Set(filteredMedicalConditions.map((option) => option.label));
    const validConcernLabels = new Set(filteredOtherConcernsOptions.map((option) => option.label));

    setFormData((prev) => ({
      ...prev,
      medicalConditions: prev.medicalConditions.filter((condition) =>
        validMedicalLabels.has(condition)
      ),
      otherConcerns: prev.otherConcerns.filter((concern) =>
        validConcernLabels.has(concern)
      ),
      pregnancyStatus: prev.gender === "female" ? prev.pregnancyStatus : "",
    }));
  }, [filteredMedicalConditions, filteredOtherConcernsOptions, formData.gender]);

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

  const nextStep = async () => {
    if (canProceed() && step < totalSteps - 1) {
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

  const saveHairIntake = async (options?: {
    resumeVerificationToken?: string;
  }): Promise<boolean> => {
    setIsSubmitting(true);
    setSubmissionError(null);
    setShowExistingAccountPrompt(false);
    try {
      const panelTier = formData.panelTier || resolveRequiredPanelTier("HAIR_LOSS");
      const result = await submitPublicIntake(
        {
          programType: "HAIR_LOSS",
          ...formData,
          panelTier,
          billingPanelTier: publicTierToBillingTier(panelTier),
          selectedPlan: "advanced_panel",
          completedAt: new Date().toISOString(),
        },
        { resumeVerificationToken: options?.resumeVerificationToken }
      );

      if (result.ok) {
        setUserId(result.userId);
        setShowResumeVerification(false);
        toast.success("Assessment saved", {
          description: "Continue to secure checkout and book your doctor consultation.",
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
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    if (step === analyseStep) {
      return <HairAnalyseStep onComplete={handleAnalyseComplete} />;
    }

    if (step === snapshotStep) {
      const risks = scoreHairLoss(
        formData as unknown as Record<string, unknown>,
        campaigns
      ).map((risk) => ({
        ...risk,
        crossSell: undefined,
        crossSellPath: undefined,
        crossSellPrice: undefined,
      }));
      const panelPlan = resolvedPanelPlan;
      const panelPackage = resolvedPanelTier;

      return (
        <BiomarkerSnapshot
          risks={risks}
          primaryProgram="Hair Loss Program"
          primaryPrice="$49 first month"
          firstName={formData.firstName}
          offerMode="advancedPanel"
          marketingHeadline="Biomarker analysis defines the biological starting point for your treatment plan"
          marketingSubcopy={`Get your ${panelPlan.name}, book your doctor consultation, and unlock a precise action plan based on your results.`}
          advancedPanel={{
            name: panelPlan.name,
            priceAud: panelPlan.priceAud,
            billingLabel: panelPlan.billingLabel,
            markerCount: panelPlan.markerCount,
            tagline: panelPlan.tagline,
            highlights: panelPlan.highlights,
            onSelect: () => {
              void handleContinueToBiomarkersCheckout();
            },
          }}
          onPrimary={() => {
            void handleContinueToBiomarkersCheckout();
          }}
          onLabs={() => {
            void handleContinueToBiomarkersCheckout();
          }}
        />
      );
    }

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
                  description: "A few questions about your health and hair goals, takes under 5 minutes.",
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
                  title: "Care plan if appropriate",
                  description: "Where clinically appropriate, items may be dispensed by an Australian-registered pharmacy.",
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
                Your legal name is needed for prescriptions. We keep it private.
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
                Age affects treatment options, this helps us personalise yours.
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
                Hair loss presents differently, this ensures accurate treatment.
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
                Genetics play a role, but they're not the whole story.
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
                Select all that apply. This keeps you safe.
              </p>
            </div>

            <div className="space-y-3 mt-8">
              {filteredMedicalConditions.map((condition) => (
                <button
                  key={condition.label}
                  type="button"
                  onClick={() => toggleArrayField("medicalConditions", condition.label)}
                  className={`w-full py-4 px-5 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${
                    formData.medicalConditions.includes(condition.label)
                      ? "border-[#5c7a52] bg-[#5c7a52]/10"
                      : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"
                  }`}
                >
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    formData.medicalConditions.includes(condition.label)
                      ? "border-[#5c7a52] bg-[#5c7a52]"
                      : "border-[#cdd8c6]"
                  }`}>
                    {formData.medicalConditions.includes(condition.label) && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  <span className="text-[#2c3628]">{condition.label}</span>
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
        return null;
    }
  };

  const renderOtherConcerns = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
          Anything else on your health radar?
        </h1>
        <p className="mt-3 text-[#5c7a52]">
          We offer support across multiple areas, let us know what interests you.
        </p>
      </div>

      <div className="space-y-3 mt-8">
        {filteredOtherConcernsOptions.map((option) => (
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

  const isCheckoutLayout = false;

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
        <div className={`${isCheckoutLayout ? "max-w-6xl xl:max-w-7xl" : "max-w-2xl"} mx-auto px-4 sm:px-6 py-4 flex items-center justify-between`}>
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
      <main className={`${isCheckoutLayout ? "max-w-6xl xl:max-w-7xl px-4 sm:px-6" : "max-w-2xl px-4"} mx-auto py-8 pb-32`}>
        <div className="animate-fadeIn">
          {renderStep()}
        </div>
      </main>

      {/* Bottom navigation */}
      {step < totalSteps - 1 &&
        step !== analyseStep &&
        step !== snapshotStep && (
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
              {isSubmitting
                ? "Saving..."
                : step === 0
                  ? "Let's begin"
                  : "Continue"}
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
                  Your doctor will discuss care options privately during consultation if clinically appropriate, including potential benefits and risks.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-[#2c3628] mb-2">How long until I see results?</h4>
                <p className="text-sm text-[#5c7a52]">
                  Hair changes vary between individuals. Your doctor will discuss realistic expectations during follow-up consultations.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-[#2c3628] mb-2">What if I'm not suitable?</h4>
                <p className="text-sm text-[#5c7a52]">
                  If your Sanative doctor determines after assessment that care is not clinically appropriate for you, your first-month payment will be refunded in accordance with our Refund Policy.
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

      <ExistingAccountPrompt
        open={showExistingAccountPrompt}
        firstName={existingUserFirstName}
        loginHref={buildLoginRedirectUrl("/dashboard/mens-health/hair-loss")}
        onUseDifferentEmail={handleUseDifferentEmail}
      />

      <ProspectiveMemberResumeVerification
        open={showResumeVerification}
        email={formData.email}
        firstName={resumeVerificationFirstName}
        onVerified={async (sessionToken) => {
          await handleContinueToBiomarkersCheckout({ resumeVerificationToken: sessionToken });
        }}
        onUseDifferentEmail={handleUseDifferentEmail}
      />

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
