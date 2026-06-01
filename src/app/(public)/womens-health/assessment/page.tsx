"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { scoreWomensHealth, fetchBiomarkerCampaigns, type BiomarkerCampaignData } from "@/lib/biomarkerScoring";
import { BiomarkerSnapshot } from "@/components/quiz/BiomarkerSnapshot";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, ArrowLeft, Check, X, Info, Heart, Stethoscope, MessageCircle, Package, AlertTriangle, Calendar, Clock, CreditCard, Loader2, Shield, Flame, Pill, Baby, Sparkles } from "lucide-react";
import { generateAvailableDates, generateTimeSlots, formatDate } from "@/lib/availability";

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
    <div className="space-y-8 py-12">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-8 relative">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#c17a58] to-[#a86548] animate-pulse" />
          <div className="absolute inset-0 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-12 h-12 text-white animate-bounce" />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628] mb-4">
          Analysing your responses
        </h1>

        <p className="text-[#5c7a52] max-w-md mx-auto mb-8">
          Please wait while we review your {categoryName.toLowerCase()} health profile...
        </p>

        {/* Progress bar */}
        <div className="max-w-sm mx-auto mb-6">
          <div className="h-2 bg-[#f8e1e1] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#c17a58] to-[#a86548] rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-[#7e9a72] mt-2">{progress}% complete</p>
        </div>

        {/* Animated messages */}
        <div className="h-6">
          <p className="text-sm text-[#c17a58] font-medium animate-pulse">
            {messages[currentMessage]}
          </p>
        </div>
      </div>

      {/* Processing indicators */}
      <div className="flex justify-center gap-3 mt-8">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              progress > i * 25 ? 'bg-[#c17a58]' : 'bg-[#f8e1e1]'
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
  selectedDate: Date | null;
  selectedTime: string;
}

const healthCategories = [
  { id: "menopause", label: "Menopause & Perimenopause", description: "Hot flushes, night sweats, mood changes", icon: Flame, color: "#c17a58" },
  { id: "hrt", label: "Hormone Replacement Therapy", description: "Starting, adjusting, or reviewing HRT", icon: Pill, color: "#8b6b8b" },
  { id: "contraception", label: "Contraception", description: "Birth control options and advice", icon: Shield, color: "#5a8b8b" },
  { id: "fertility", label: "Fertility & Hormonal Health", description: "PCOS, cycle issues, preconception", icon: Baby, color: "#c17a58" },
  { id: "general", label: "General Women's Health", description: "Other concerns not listed above", icon: Heart, color: "#c17a58" },
];

const primaryConcernsByCategory: Record<string, string[]> = {
  menopause: ["Hot flushes", "Night sweats", "Sleep disturbances", "Mood changes", "Brain fog", "Vaginal dryness", "Low libido", "Weight gain", "Joint pain", "Fatigue"],
  hrt: ["Starting HRT", "Reviewing current HRT", "Adjusting dosage", "Switching HRT type", "Managing side effects", "HRT safety questions"],
  contraception: ["Starting contraception", "Changing method", "Side effects", "Emergency contraception", "Post-pregnancy", "Long-acting options"],
  fertility: ["Irregular periods", "PCOS symptoms", "Trying to conceive", "Preconception health", "Hormonal imbalance", "Endometriosis"],
  general: ["Hormonal concerns", "Menstrual issues", "Pelvic pain", "Breast health", "Sexual health", "Other"],
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
  const validCategories = ["menopause", "hrt", "contraception", "fertility", "general"];
  const preselectedCategory = categoryFromUrl && validCategories.includes(categoryFromUrl) ? categoryFromUrl : "";

  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    firstName: "", lastName: "", email: "", phone: "", dateOfBirth: "", category: preselectedCategory,
    primaryConcerns: [], symptomDuration: "", currentTreatments: [], medicalConditions: [],
    menstrualStatus: "", familyHistory: [], goals: [], postcode: "", address: "",
    selectedDate: null, selectedTime: "",
  });
  const [showFAQ, setShowFAQ] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPreselectedCategory] = useState(!!preselectedCategory);
  const [userId, setUserId] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<BiomarkerCampaignData[]>([]);

  // Fetch biomarker campaigns on mount
  useEffect(() => {
    fetchBiomarkerCampaigns('WOMENS_HEALTH').then(setCampaigns);
  }, []);



  const availableDates = useMemo(() => generateAvailableDates(14).filter(d => d.available).slice(0, 2), []);
  const timeSlotsForDates = useMemo(() => availableDates.map(d => ({ date: d.date, slots: generateTimeSlots(d.date) })), [availableDates]);

  // Adjust total steps - skip category selection if preselected
  // Steps: 0-12 assessment, 13 processing, 14 booking, 15 confirmation
  const totalSteps = hasPreselectedCategory ? 14 : 15;
  const progress = ((step + 1) / totalSteps) * 100;

  // Get category display info
  const selectedCategoryInfo = healthCategories.find(c => c.id === formData.category);

  const updateFormData = (field: keyof FormData, value: string | string[] | Date | null) => setFormData(prev => ({ ...prev, [field]: value }));

  const toggleArrayField = (field: keyof FormData, value: string) => {
    setFormData(prev => {
      const current = prev[field] as string[];
      const noneValues = ["None of these", "No current treatment"];
      if (noneValues.includes(value)) return { ...prev, [field]: current.includes(value) ? [] : [value] };
      if (current.includes(value)) return { ...prev, [field]: current.filter(v => v !== value) };
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
    if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age--;
    return age;
  };

  const age = getAge(formData.dateOfBirth);
  const isValidAge = age >= 18;

  const canProceed = () => {
    switch (step) {
      case 0: return true;
      case 1: return formData.firstName.trim() && formData.lastName.trim();
      case 2: return formData.email.includes("@") && formData.email.includes(".");
      case 3: return formData.dateOfBirth.length === 10 && isValidAge;
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
      case 14: return formData.phone && formData.postcode.length === 4 && formData.selectedDate && formData.selectedTime;
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

  const handleSubmit = async () => {
    setIsProcessing(true);
    setSubmissionError(null);

    try {
      // STEP 1: Send assessment data to portal — create patient record
      const intakeResponse = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programType: "WOMENS_HEALTH",
          ...formData,
          selectedDate: formData.selectedDate?.toISOString(),
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
          program: "womens_health",
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
        sessionStorage.setItem("paymentProgram", "womens_health");
        window.location.href = `/payment?program=womens_health`;
      }

      setStep(totalSteps);

    } catch (error: unknown) {
      console.error("Submission error:", error);
      const message = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setSubmissionError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderCheckboxOption = (option: string, field: keyof FormData, selected: boolean) => (
    <button key={option} type="button" onClick={() => toggleArrayField(field, option)} className={`w-full py-4 px-5 rounded-xl border-2 text-left flex items-center gap-3 transition-all ${selected ? "border-[#c17a58] bg-[#fef4f0]" : "border-[#f8e1e1] bg-white hover:border-[#e8b4b4]"}`}>
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selected ? "border-[#c17a58] bg-[#c17a58]" : "border-[#e8b4b4]"}`}>
        {selected && <Check className="w-3 h-3 text-white" />}
      </div>
      <span className="text-[#2c3628]">{option}</span>
    </button>
  );

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <div className="space-y-6">
          <div className="text-center">
            {selectedCategoryInfo ? (
              <>
                <div className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6 rotate-3" style={{ background: `linear-gradient(135deg, ${selectedCategoryInfo.color}, ${selectedCategoryInfo.color}dd)` }}>
                  <selectedCategoryInfo.icon className="w-10 h-10 text-white" />
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#fef4f0] border border-[#f8e1e1] mb-4">
                  <span className="text-sm font-medium text-[#c17a58]">{selectedCategoryInfo.label}</span>
                </div>
              </>
            ) : (
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[#c17a58] to-[#a86548] rounded-2xl flex items-center justify-center mb-6 rotate-3">
                <Heart className="w-10 h-10 text-white" />
              </div>
            )}
            <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
              {selectedCategoryInfo ? `Your ${selectedCategoryInfo.label.toLowerCase()} assessment` : "Your women's health journey starts here"}
            </h1>
            <p className="mt-4 text-[#5c7a52] max-w-md mx-auto">A few questions to help our doctors create a personalised care plan.</p>
          </div>
          <div className="space-y-4 mt-8">
            {[{ num: 1, title: "Quick health assessment", desc: "About 5 minutes", icon: Heart }, { num: 2, title: "Doctor consultation", desc: "AHPRA-registered specialist", icon: Stethoscope }, { num: 3, title: "Personalised care plan", desc: "Tailored to your needs", icon: MessageCircle }, { num: 4, title: "Ongoing support", desc: "Regular check-ins", icon: Package }].map(item => (
              <div key={item.num} className="bg-white rounded-2xl p-5 border border-[#f8e1e1] flex gap-4">
                <div className="w-10 h-10 rounded-full bg-[#f8e1e1] text-[#c17a58] flex items-center justify-center"><item.icon className="w-5 h-5" /></div>
                <div><span className="text-xs font-medium text-[#c17a58] bg-[#fef4f0] px-2 py-0.5 rounded-full">Step {item.num}</span><h3 className="font-semibold text-[#2c3628] mt-1">{item.title}</h3><p className="text-sm text-[#5c7a52]">{item.desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      );

      case 1: return (
        <div className="space-y-6">
          <div className="text-center"><h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">Let&apos;s start with your name</h1><p className="mt-3 text-[#5c7a52]">Required for prescriptions — kept confidential.</p></div>
          <div className="grid sm:grid-cols-2 gap-4 mt-8">
            <div><label className="block text-sm font-medium text-[#2c3628] mb-2">First name</label><input type="text" value={formData.firstName} onChange={e => updateFormData("firstName", e.target.value)} className="w-full px-4 py-4 rounded-xl border border-[#f8e1e1] focus:border-[#c17a58] focus:ring-2 focus:ring-[#f8e1e1] outline-none bg-white" placeholder="First name" /></div>
            <div><label className="block text-sm font-medium text-[#2c3628] mb-2">Last name</label><input type="text" value={formData.lastName} onChange={e => updateFormData("lastName", e.target.value)} className="w-full px-4 py-4 rounded-xl border border-[#f8e1e1] focus:border-[#c17a58] focus:ring-2 focus:ring-[#f8e1e1] outline-none bg-white" placeholder="Last name" /></div>
          </div>
        </div>
      );

      case 2: return (
        <div className="space-y-6">
          <div className="text-center"><h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">How can we reach you?</h1><p className="mt-3 text-[#5c7a52]">We&apos;ll send your consultation details here.</p></div>
          <div className="mt-8"><label className="block text-sm font-medium text-[#2c3628] mb-2">Email address</label><input type="email" value={formData.email} onChange={e => updateFormData("email", e.target.value)} className="w-full px-4 py-4 rounded-xl border border-[#f8e1e1] focus:border-[#c17a58] focus:ring-2 focus:ring-[#f8e1e1] outline-none bg-white" placeholder="you@example.com" /></div>
          <p className="text-center text-sm text-[#7e9a72]">Already a patient? <Link href="/login" className="text-[#c17a58] underline">Sign in</Link></p>
        </div>
      );

      case 3: return (
        <div className="space-y-6">
          <div className="text-center"><h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">What is your date of birth?</h1><p className="mt-3 text-[#5c7a52]">Important for personalising your care.</p></div>
          <div className="mt-8 flex gap-3 justify-center">
            <div className="w-20"><label className="block text-xs text-[#7e9a72] mb-1 text-center">Day</label><input type="text" inputMode="numeric" maxLength={2} value={formData.dateOfBirth.split("/")[0] || ""} onChange={e => { const v = e.target.value.replace(/\D/g, "").slice(0, 2); const p = formData.dateOfBirth.split("/"); updateFormData("dateOfBirth", `${v}/${p[1]||""}/${p[2]||""}`); if (v.length === 2) document.getElementById("dob-m")?.focus(); }} className="w-full px-3 py-4 rounded-xl border border-[#f8e1e1] focus:border-[#c17a58] text-center text-lg bg-white outline-none" placeholder="DD" /></div>
            <div className="w-20"><label className="block text-xs text-[#7e9a72] mb-1 text-center">Month</label><input id="dob-m" type="text" inputMode="numeric" maxLength={2} value={formData.dateOfBirth.split("/")[1] || ""} onChange={e => { const v = e.target.value.replace(/\D/g, "").slice(0, 2); const p = formData.dateOfBirth.split("/"); updateFormData("dateOfBirth", `${p[0]||""}/${v}/${p[2]||""}`); if (v.length === 2) document.getElementById("dob-y")?.focus(); }} className="w-full px-3 py-4 rounded-xl border border-[#f8e1e1] focus:border-[#c17a58] text-center text-lg bg-white outline-none" placeholder="MM" /></div>
            <div className="w-28"><label className="block text-xs text-[#7e9a72] mb-1 text-center">Year</label><input id="dob-y" type="text" inputMode="numeric" maxLength={4} value={formData.dateOfBirth.split("/")[2] || ""} onChange={e => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); const p = formData.dateOfBirth.split("/"); updateFormData("dateOfBirth", `${p[0]||""}/${p[1]||""}/${v}`); }} className="w-full px-3 py-4 rounded-xl border border-[#f8e1e1] focus:border-[#c17a58] text-center text-lg bg-white outline-none" placeholder="YYYY" /></div>
          </div>
          {formData.dateOfBirth.length === 10 && !isValidAge && <p className="mt-4 text-sm text-red-600 text-center">You must be 18 or older.</p>}
          {formData.dateOfBirth.length === 10 && isValidAge && <p className="mt-4 text-sm text-[#5c7a52] text-center">Great, you&apos;re {age} years old.</p>}
        </div>
      );

      case 4: return (
        <div className="text-center space-y-6">
          {selectedCategoryInfo ? (
            <div className="w-24 h-24 mx-auto rounded-2xl flex items-center justify-center rotate-3" style={{ background: `linear-gradient(135deg, ${selectedCategoryInfo.color}, ${selectedCategoryInfo.color}dd)` }}>
              <selectedCategoryInfo.icon className="w-12 h-12 text-white" />
            </div>
          ) : (
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-[#c17a58] to-[#a86548] rounded-2xl flex items-center justify-center rotate-3">
              <Stethoscope className="w-12 h-12 text-white" />
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">
            {selectedCategoryInfo ? `Let's learn about your ${selectedCategoryInfo.label.toLowerCase()} concerns` : "Now for your health profile"}
          </h1>
          <p className="text-[#5c7a52] max-w-md mx-auto">These questions help our doctors provide the best care for your specific needs.</p>
          {selectedCategoryInfo && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#f8e1e1]">
              <selectedCategoryInfo.icon className="w-4 h-4" style={{ color: selectedCategoryInfo.color }} />
              <span className="text-sm font-medium text-[#2c3628]">{selectedCategoryInfo.label}</span>
            </div>
          )}
          <div className="bg-[#fef4f0] rounded-xl p-4 max-w-sm mx-auto"><p className="text-sm text-[#5c7a52]"><span className="font-medium text-[#2c3628]">Privacy:</span> All information is confidential.</p></div>
        </div>
      );

      case 5: return (
        <div className="space-y-6">
          <div className="text-center"><h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">What brings you here today?</h1></div>
          <div className="space-y-3 mt-8">
            {healthCategories.map(c => (
              <button key={c.id} type="button" onClick={() => { updateFormData("category", c.id); setTimeout(nextStep, 300); }} className={`w-full py-4 px-5 rounded-xl border-2 text-left transition-all ${formData.category === c.id ? "border-[#c17a58] bg-[#fef4f0]" : "border-[#f8e1e1] bg-white hover:border-[#e8b4b4]"}`}>
                <span className="font-medium text-[#2c3628]">{c.label}</span><span className="block text-sm text-[#7e9a72] mt-0.5">{c.description}</span>
              </button>
            ))}
          </div>
        </div>
      );

      case 6: return (
        <div className="space-y-6">
          <div className="text-center"><h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">What are your main concerns?</h1><p className="mt-3 text-[#5c7a52]">Select all that apply.</p></div>
          <div className="space-y-3 mt-8 max-h-[50vh] overflow-y-auto pr-2">{(primaryConcernsByCategory[formData.category] || primaryConcernsByCategory.general).map(o => renderCheckboxOption(o, "primaryConcerns", formData.primaryConcerns.includes(o)))}</div>
        </div>
      );

      case 7: return (
        <div className="space-y-6">
          <div className="text-center"><h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">How long have you had these concerns?</h1></div>
          <div className="space-y-3 mt-8">{symptomDurationOptions.map(o => (<button key={o} type="button" onClick={() => { updateFormData("symptomDuration", o); setTimeout(nextStep, 300); }} className={`w-full py-4 px-5 rounded-xl border-2 text-center transition-all ${formData.symptomDuration === o ? "border-[#c17a58] bg-[#fef4f0]" : "border-[#f8e1e1] bg-white hover:border-[#e8b4b4]"}`}>{o}</button>))}</div>
        </div>
      );

      case 8: return (
        <div className="space-y-6">
          <div className="text-center"><h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">Current treatments?</h1><p className="mt-3 text-[#5c7a52]">Select all that apply.</p></div>
          <div className="space-y-3 mt-8 max-h-[50vh] overflow-y-auto pr-2">{currentTreatmentOptions.map(o => renderCheckboxOption(o, "currentTreatments", formData.currentTreatments.includes(o)))}</div>
        </div>
      );

      case 9: return (
        <div className="space-y-6">
          <div className="text-center"><h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">Any of these conditions?</h1><p className="mt-3 text-[#5c7a52]">Helps ensure treatment is safe.</p></div>
          {formData.medicalConditions.some(c => ["Blood clotting disorder", "Breast cancer history"].includes(c)) && <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3"><AlertTriangle className="w-5 h-5 text-amber-600" /><p className="text-sm text-amber-800">Some conditions need specialist review.</p></div>}
          <div className="space-y-3 mt-6 max-h-[45vh] overflow-y-auto pr-2">{medicalConditionsOptions.map(o => renderCheckboxOption(o, "medicalConditions", formData.medicalConditions.includes(o)))}</div>
        </div>
      );

      case 10: return (
        <div className="space-y-6">
          <div className="text-center"><h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">Your menstrual status?</h1></div>
          <div className="space-y-3 mt-8">{menstrualStatusOptions.map(o => (<button key={o} type="button" onClick={() => { updateFormData("menstrualStatus", o); setTimeout(nextStep, 300); }} className={`w-full py-4 px-5 rounded-xl border-2 text-center transition-all ${formData.menstrualStatus === o ? "border-[#c17a58] bg-[#fef4f0]" : "border-[#f8e1e1] bg-white hover:border-[#e8b4b4]"}`}>{o}</button>))}</div>
        </div>
      );

      case 11: return (
        <div className="space-y-6">
          <div className="text-center"><h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">Family history?</h1><p className="mt-3 text-[#5c7a52]">Parents, siblings, or grandparents.</p></div>
          <div className="space-y-3 mt-8">{familyHistoryOptions.map(o => renderCheckboxOption(o, "familyHistory", formData.familyHistory.includes(o)))}</div>
        </div>
      );

      case 12: return (
        <div className="space-y-6">
          <div className="text-center"><h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628]">What are your goals?</h1><p className="mt-3 text-[#5c7a52]">Select all that apply.</p></div>
          <div className="space-y-3 mt-8">{goalsOptions.map(o => renderCheckboxOption(o.label, "goals", formData.goals.includes(o.label)))}</div>
        </div>
      );

      case 13: return <ProcessingStep categoryName={selectedCategoryInfo?.label || "women's health"} onComplete={() => setStep(14)} />;

      case 14: return (
        <div className="space-y-8">
          {/* Premium Closing Message */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2c3628] via-[#3d4a38] to-[#2c3628] p-8 sm:p-10">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#c17a58]/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#a8bb9e]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative text-center">
              {/* Success checkmark */}
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#a8bb9e] to-[#7e9a72] flex items-center justify-center shadow-lg">
                <Check className="w-8 h-8 text-white" />
              </div>

              {/* Thank you message */}
              <p className="text-[#a8bb9e] text-sm font-medium tracking-wide uppercase mb-3">
                Assessment Complete
              </p>

              <h1 className="text-3xl sm:text-4xl font-serif text-white mb-4">
                Thank you, {formData.firstName}
              </h1>

              <p className="text-lg text-[#cdd8c6] max-w-md mx-auto leading-relaxed">
                We&apos;ve reviewed your responses and we&apos;re ready to help you with your
                <span className="text-white font-medium"> {selectedCategoryInfo?.label.toLowerCase() || "health"} {formData.category === "contraception" ? "options" : "journey"}</span>.
              </p>
            </div>
          </div>

          {/* What happens next - Premium card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#e6ebe3] shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#f8e1e1] to-[#fce4d8] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#c17a58]" />
              </div>
              <div>
                <h2 className="text-xl font-serif text-[#2c3628]">Your next step</h2>
                <p className="text-sm text-[#7e9a72]">One consultation away from feeling better</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-[#2c3628] leading-relaxed">
                Our experienced doctors specialise in <span className="font-semibold text-[#c17a58]">{selectedCategoryInfo?.label || "women's health"}</span> and are ready to create a personalised treatment plan just for you.
              </p>

              <p className="text-[#5c7a52] leading-relaxed">
                Book a 30-minute consultation for an in-depth review of your health profile and expert recommendations tailored to your needs.
              </p>
            </div>

            {/* Value badges */}
            <div className="flex flex-wrap gap-3 mb-6">
              {["AHPRA-registered doctors", "100% confidential", "Prescriptions if suitable"].map((badge) => (
                <div key={badge} className="flex items-center gap-2 px-3 py-1.5 bg-[#f4f7f2] rounded-full text-xs font-medium text-[#5c7a52]">
                  <Check className="w-3 h-3 text-[#7e9a72]" />
                  {badge}
                </div>
              ))}
            </div>

            {/* Special offer callout */}
            <div className="bg-gradient-to-r from-[#fef4f0] to-[#f8e1e1]/30 rounded-2xl p-5 border border-[#f8e1e1]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <CreditCard className="w-5 h-5 text-[#c17a58]" />
                </div>
                <div>
                  <p className="font-semibold text-[#2c3628] mb-1">
                    Consultation fee credited to treatment
                  </p>
                  <p className="text-sm text-[#5c7a52]">
                    Your $149 consultation fee is fully deductible from any treatment plan you choose to proceed with.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Consultation Details Card */}
          <div className="bg-white rounded-3xl p-6 border border-[#e6ebe3] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#c17a58] flex items-center justify-center">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#2c3628]">Women&apos;s Health Consultation</h3>
                  <p className="text-sm text-[#7e9a72]">30-minute consultation</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-serif text-[#2c3628]">$149</span>
                <p className="text-xs text-[#7e9a72]">one-time</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#e6ebe3]">
              {[
                { label: "Full health review", icon: Heart },
                { label: "Personalised plan", icon: MessageCircle },
                { label: "Prescription if needed", icon: Package },
                { label: "Ongoing support", icon: Shield },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-sm text-[#5c7a52]">
                  <item.icon className="w-4 h-4 text-[#c17a58]" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#f8e1e1]">
            <h3 className="font-semibold text-[#2c3628] mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-[#c17a58]" />Select appointment time</h3>
            <div className="grid grid-cols-2 gap-4">
              {timeSlotsForDates.map((ds, i) => (
                <div key={i} className="space-y-3">
                  <div className="text-center p-3 bg-gradient-to-br from-[#f8e1e1] to-[#fce4d8] rounded-xl">
                    <p className="text-sm font-medium text-[#c17a58]">{ds.date.toLocaleDateString("en-AU", { weekday: "short" })}</p>
                    <p className="text-lg font-serif text-[#2c3628]">{ds.date.toLocaleDateString("en-AU", { day: "numeric", month: "short" })}</p>
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {ds.slots.filter(s => s.available).slice(0, 6).map(s => {
                      const sel = formData.selectedDate?.toDateString() === ds.date.toDateString() && formData.selectedTime === s.time;
                      return <button key={s.time} type="button" onClick={() => { updateFormData("selectedDate", ds.date); updateFormData("selectedTime", s.time); }} className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all ${sel ? "bg-[#c17a58] text-white" : "bg-[#fdf8f6] text-[#2c3628] hover:bg-[#f8e1e1]"}`}>{s.time}</button>;
                    })}
                  </div>
                </div>
              ))}
            </div>
            {formData.selectedDate && formData.selectedTime && <div className="mt-4 p-3 bg-[#fef4f0] rounded-xl flex items-center gap-2"><Clock className="w-4 h-4 text-[#c17a58]" /><span className="text-sm text-[#2c3628]">{formatDate(formData.selectedDate)} at {formData.selectedTime}</span></div>}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#f8e1e1]">
            <h3 className="font-semibold text-[#2c3628] mb-4">Contact & Delivery</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div><label className="block text-sm font-medium text-[#2c3628] mb-2">Mobile</label><input type="tel" value={formData.phone} onChange={e => updateFormData("phone", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-[#f8e1e1] focus:border-[#c17a58] outline-none bg-white" placeholder="04XX XXX XXX" /></div>
              <div><label className="block text-sm font-medium text-[#2c3628] mb-2">Postcode</label><input type="text" maxLength={4} value={formData.postcode} onChange={e => updateFormData("postcode", e.target.value.replace(/\D/g, ""))} className="w-full px-4 py-3 rounded-xl border border-[#f8e1e1] focus:border-[#c17a58] outline-none bg-white" placeholder="2000" /></div>
            </div>
            <div><label className="block text-sm font-medium text-[#2c3628] mb-2">Delivery address</label><input type="text" value={formData.address} onChange={e => updateFormData("address", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-[#f8e1e1] focus:border-[#c17a58] outline-none bg-white" placeholder="Street address" /></div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#f8e1e1]">
            <h3 className="font-semibold text-[#2c3628] mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5 text-[#c17a58]" />Payment</h3>
            <div className="flex justify-between py-3 border-b border-[#f8e1e1]"><span className="text-[#5c7a52]">Consultation fee</span><span className="font-semibold text-[#2c3628]">$149.00</span></div>
            {/* GAP-024: Removed unsupported rebate claim */}
            <div className="flex gap-4 mt-4 text-xs text-[#7e9a72]"><div className="flex items-center gap-1"><Shield className="w-4 h-4" />Secure</div><div className="flex items-center gap-1"><Check className="w-4 h-4" />Check with your insurer</div></div>
            <p className="text-xs text-[#7e9a72] mt-4">By continuing, you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.</p>
            <button type="button" onClick={handleSubmit} disabled={isProcessing || !canProceed()} className="w-full mt-4 py-4 bg-[#c17a58] text-white font-medium rounded-xl hover:bg-[#a86548] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin" />Processing...</> : <>Book & Pay $149<ArrowRight className="w-5 h-5" /></>}
            </button>
          </div>
        </div>
      );

      default:
        // Final step: Show biomarker snapshot
        const risks = scoreWomensHealth(formData as unknown as Record<string, unknown>, campaigns);
        return (
          <BiomarkerSnapshot
            risks={risks}
            primaryProgram="Women's Health Program"
            primaryPrice="$149/mo"
            firstName={formData.firstName}
            onPrimary={handleSubmit}
            onLabs={() => window.location.href = '/labs'}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      <div className="fixed top-0 left-0 right-0 h-1 bg-[#f8e1e1] z-50"><div className="h-full bg-[#c17a58] transition-all duration-500" style={{ width: `${progress}%` }} /></div>
      <header className="sticky top-0 bg-[#fdfbf7]/95 backdrop-blur-sm z-40 border-b border-[#f8e1e1]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-serif text-[#34412f]">Sanative</Link>
          <button type="button" onClick={() => setShowFAQ(true)} className="flex items-center gap-1.5 text-sm text-[#c17a58]"><Info className="w-4 h-4" />Help</button>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8 pb-32">{renderStep()}</main>
      {step < 13 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[#f8e1e1] p-4">
          <div className="max-w-2xl mx-auto flex gap-3">
            {step > 0 && <button type="button" onClick={prevStep} className="px-5 py-4 rounded-xl border border-[#f8e1e1] text-[#c17a58]"><ArrowLeft className="w-5 h-5" /></button>}
            <button type="button" onClick={nextStep} disabled={!canProceed()} className="flex-1 py-4 bg-[#c17a58] text-white font-medium rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">{step === 0 ? "Begin" : step === 4 ? "Continue" : "Next"}<ArrowRight className="w-5 h-5" /></button>
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
