"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle,
  Loader2,
  Shield,
  TestTube,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  Stethoscope,
} from "lucide-react";
import {
  JoinPaymentForm,
  PaymentFormLoading,
} from "@/components/promo/JoinPaymentForm";

const PROGRAMS = [
  { value: "kidney-health", label: "Kidney Health" },
  { value: "fatty-liver", label: "Fatty Liver / Metabolic Health" },
  { value: "diabetes-care", label: "Diabetes Care" },
  { value: "heart-health", label: "Heart Health" },
  { value: "weight-management", label: "Weight Management" },
  { value: "womens-health", label: "Women's Health" },
  { value: "general-health", label: "General Health (Biomarker One)" },
];

const HEALTH_CONCERNS = [
  { value: "kidney", label: "Kidney health" },
  { value: "liver", label: "Liver health" },
  { value: "weight", label: "Weight & metabolism" },
  { value: "heart", label: "Heart health" },
  { value: "general", label: "General wellbeing" },
  { value: "other", label: "Other" },
];

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  dob: string;
  program: string;
  hasType2Diabetes: string;
  hasHighBP: string;
  hasOrganIssues: string;
  takingMedications: string;
  primaryConcern: string;
  consent: boolean;
}

interface FormErrors {
  [key: string]: string;
}

interface ClinicData {
  clinicId: string;
  clinicName: string;
  location: string;
  programs: string[];
}

interface ReferralData {
  referralId: string;
  patientFirstName: string;
  program: string;
  clinicName: string;
  clinicLocation: string;
}

function JoinPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const clinicToken = searchParams.get("clinic");
  const referralToken = searchParams.get("ref");

  const [clinicData, setClinicData] = useState<ClinicData | null>(null);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWhatsIncluded, setShowWhatsIncluded] = useState(false);

  // Stripe payment state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [paymentReady, setPaymentReady] = useState(false);
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    dob: "",
    program: "",
    hasType2Diabetes: "",
    hasHighBP: "",
    hasOrganIssues: "",
    takingMedications: "",
    primaryConcern: "",
    consent: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        // Fetch clinic data if clinic token present
        if (clinicToken) {
          const response = await fetch(`/api/clinics/qr/${clinicToken}`);
          const data = await response.json();
          if (data.success) {
            setClinicData(data.data);
          } else {
            setError(data.message);
          }
        }

        // Fetch referral data if referral token present
        if (referralToken) {
          const response = await fetch(
            `/api/referrals/validate/${referralToken}`
          );
          const data = await response.json();
          if (data.success) {
            setReferralData(data.data);
            setFormData((prev) => ({
              ...prev,
              firstName: data.data.patientFirstName || "",
              program: data.data.program || "",
            }));
          } else {
            setError(data.message);
          }
        }
      } catch {
        setError("Failed to load page data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [clinicToken, referralToken]);

  // Create payment intent when form is validated
  const createPaymentIntent = async () => {
    if (!formData.email || !formData.firstName || isCreatingPaymentIntent) {
      return;
    }

    setIsCreatingPaymentIntent(true);

    try {
      const response = await fetch("/api/members/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          program: formData.program,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setClientSecret(data.clientSecret);
        setStripeCustomerId(data.customerId);
        setPaymentReady(true);
      } else {
        setErrors({ payment: data.message || "Failed to initialize payment" });
      }
    } catch {
      setErrors({ payment: "Failed to initialize payment" });
    } finally {
      setIsCreatingPaymentIntent(false);
    }
  };

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validateMobile = (mobile: string) => {
    const cleaned = mobile.replace(/\s/g, "");
    const regex = /^(\+?61|0)?4\d{8}$/;
    return regex.test(cleaned);
  };

  const validateFormBeforePayment = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    if (!formData.mobile.trim()) {
      newErrors.mobile = "Mobile is required";
    } else if (!validateMobile(formData.mobile)) {
      newErrors.mobile = "Please enter a valid Australian mobile";
    }
    if (!formData.dob) {
      newErrors.dob = "Date of birth is required";
    }
    if (!formData.program) {
      newErrors.program = "Please select a program";
    }
    if (!formData.hasType2Diabetes) {
      newErrors.hasType2Diabetes = "Please answer this question";
    }
    if (!formData.hasHighBP) {
      newErrors.hasHighBP = "Please answer this question";
    }
    if (!formData.hasOrganIssues) {
      newErrors.hasOrganIssues = "Please answer this question";
    }
    if (!formData.takingMedications) {
      newErrors.takingMedications = "Please answer this question";
    }
    if (!formData.primaryConcern) {
      newErrors.primaryConcern = "Please select your primary concern";
    }
    if (!formData.consent) {
      newErrors.consent = "You must agree to the terms";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : undefined;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Reset payment intent if email changes
    if (name === "email" && clientSecret) {
      setClientSecret(null);
      setPaymentReady(false);
    }
  };

  const handleProceedToPayment = () => {
    if (validateFormBeforePayment()) {
      createPaymentIntent();
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/members/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          intakeData: {
            hasType2Diabetes: formData.hasType2Diabetes,
            hasHighBP: formData.hasHighBP,
            hasOrganIssues: formData.hasOrganIssues,
            takingMedications: formData.takingMedications,
            primaryConcern: formData.primaryConcern,
          },
          stripePaymentIntentId: paymentIntentId,
          stripeCustomerId,
          clinicToken,
          referralToken,
        }),
      });

      const data = await response.json();

      if (data.success) {
        router.push("/dashboard/welcome");
      } else {
        setErrors({ submit: data.message || "Failed to complete enrollment" });
      }
    } catch {
      setErrors({ submit: "An error occurred. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setErrors({ payment: errorMessage });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1D9E75]" />
      </div>
    );
  }

  const clinicOrReferralName =
    referralData?.clinicName || clinicData?.clinicName;
  const isFromReferral = !!referralData;
  const isFromClinic = !!clinicData && !referralData;

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {/* Header */}
      <header className="border-b border-[#e6ebe3] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="text-3xl font-serif text-[#34412f]">
            sanative
          </Link>
        </div>
      </header>

      <main className="py-8 md:py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Clinic/Referral Banner */}
          {clinicOrReferralName && (
            <div className="bg-[#1D9E75]/10 border border-[#1D9E75]/20 rounded-xl p-4 mb-6 flex items-center gap-3">
              <Stethoscope className="w-5 h-5 text-[#1D9E75]" />
              <span className="text-[#1D9E75] font-medium">
                Referred by {clinicOrReferralName}
              </span>
            </div>
          )}

          {/* Error Banner */}
          {error && !clinicOrReferralName && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
              <p className="text-amber-800 text-sm">{error}</p>
              <p className="text-amber-600 text-sm mt-1">
                You can still sign up directly below.
              </p>
            </div>
          )}

          {/* Value Proposition */}
          <section className="mb-8">
            <h1 className="text-3xl md:text-4xl font-serif text-[#34412f] mb-4">
              {isFromReferral || isFromClinic
                ? "Join your health program"
                : "Join Sanative Health"}
            </h1>
            <p className="text-lg text-[#5c7a52] mb-6">
              Know your health before symptoms appear.
            </p>

            {/* Benefits */}
            <div className="space-y-3 mb-6">
              {[
                { icon: TestTube, text: "80+ biomarkers tested at NATA labs" },
                {
                  icon: Clock,
                  text: "Biological Clock + Organ health scores",
                },
                {
                  icon: Users,
                  text: "Care partner support between GP visits",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 text-[#34412f]"
                >
                  <CheckCircle className="w-5 h-5 text-[#1D9E75]" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            {/* Price */}
            <div className="bg-white rounded-xl p-4 border border-[#e6ebe3] inline-block">
              <span className="text-2xl font-bold text-[#34412f]">
                $199
              </span>
              <span className="text-[#5c7a52]">/year</span>
              <span className="text-sm text-[#5c7a52] ml-2">
                — cancel anytime
              </span>
            </div>
          </section>

          {/* Enrollment Form */}
          <div className="space-y-6">
            {/* Personal Details */}
            <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
              <h2 className="text-lg font-semibold text-[#34412f] mb-4">
                Your details
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#34412f] mb-1">
                      First name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      readOnly={isFromReferral}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        errors.firstName
                          ? "border-red-500"
                          : "border-[#e6ebe3]"
                      } focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 focus:border-[#1D9E75] ${
                        isFromReferral ? "bg-gray-50" : ""
                      }`}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#34412f] mb-1">
                      Last name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        errors.lastName ? "border-red-500" : "border-[#e6ebe3]"
                      } focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 focus:border-[#1D9E75]`}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#34412f] mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.email ? "border-red-500" : "border-[#e6ebe3]"
                    } focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 focus:border-[#1D9E75]`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#34412f] mb-1">
                    Mobile <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    placeholder="04XX XXX XXX"
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.mobile ? "border-red-500" : "border-[#e6ebe3]"
                    } focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 focus:border-[#1D9E75]`}
                  />
                  {errors.mobile && (
                    <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#34412f] mb-1">
                    Date of birth <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.dob ? "border-red-500" : "border-[#e6ebe3]"
                    } focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 focus:border-[#1D9E75]`}
                  />
                  {errors.dob && (
                    <p className="text-red-500 text-sm mt-1">{errors.dob}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#34412f] mb-1">
                    Program <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="program"
                    value={formData.program}
                    onChange={handleInputChange}
                    disabled={isFromReferral && !!referralData?.program}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.program ? "border-red-500" : "border-[#e6ebe3]"
                    } focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 focus:border-[#1D9E75] bg-white ${
                      isFromReferral && referralData?.program
                        ? "bg-gray-50"
                        : ""
                    }`}
                  >
                    <option value="">Select a program</option>
                    {PROGRAMS.map((program) => (
                      <option key={program.value} value={program.value}>
                        {program.label}
                      </option>
                    ))}
                  </select>
                  {errors.program && (
                    <p className="text-red-500 text-sm mt-1">{errors.program}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Health Intake */}
            <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
              <h2 className="text-lg font-semibold text-[#34412f] mb-4">
                Quick health questions
              </h2>

              <div className="space-y-4">
                {/* Type 2 Diabetes */}
                <div>
                  <label className="block text-sm font-medium text-[#34412f] mb-2">
                    Do you have Type 2 diabetes?{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    {["Yes", "No", "Not sure"].map((option) => (
                      <label
                        key={option}
                        className={`flex-1 text-center py-2 px-4 rounded-lg border cursor-pointer transition-all ${
                          formData.hasType2Diabetes === option.toLowerCase()
                            ? "border-[#1D9E75] bg-[#1D9E75]/5 text-[#1D9E75]"
                            : "border-[#e6ebe3] hover:border-[#5DCAA5]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="hasType2Diabetes"
                          value={option.toLowerCase()}
                          checked={
                            formData.hasType2Diabetes === option.toLowerCase()
                          }
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  {errors.hasType2Diabetes && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.hasType2Diabetes}
                    </p>
                  )}
                </div>

                {/* High BP */}
                <div>
                  <label className="block text-sm font-medium text-[#34412f] mb-2">
                    Do you have high blood pressure?{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    {["Yes", "No", "Not sure"].map((option) => (
                      <label
                        key={option}
                        className={`flex-1 text-center py-2 px-4 rounded-lg border cursor-pointer transition-all ${
                          formData.hasHighBP === option.toLowerCase()
                            ? "border-[#1D9E75] bg-[#1D9E75]/5 text-[#1D9E75]"
                            : "border-[#e6ebe3] hover:border-[#5DCAA5]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="hasHighBP"
                          value={option.toLowerCase()}
                          checked={formData.hasHighBP === option.toLowerCase()}
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  {errors.hasHighBP && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.hasHighBP}
                    </p>
                  )}
                </div>

                {/* Organ Issues */}
                <div>
                  <label className="block text-sm font-medium text-[#34412f] mb-2">
                    Have you been told you have kidney, liver, or heart issues?{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    {["Yes", "No"].map((option) => (
                      <label
                        key={option}
                        className={`flex-1 text-center py-2 px-4 rounded-lg border cursor-pointer transition-all ${
                          formData.hasOrganIssues === option.toLowerCase()
                            ? "border-[#1D9E75] bg-[#1D9E75]/5 text-[#1D9E75]"
                            : "border-[#e6ebe3] hover:border-[#5DCAA5]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="hasOrganIssues"
                          value={option.toLowerCase()}
                          checked={
                            formData.hasOrganIssues === option.toLowerCase()
                          }
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  {errors.hasOrganIssues && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.hasOrganIssues}
                    </p>
                  )}
                </div>

                {/* Medications */}
                <div>
                  <label className="block text-sm font-medium text-[#34412f] mb-2">
                    Are you currently taking any regular medications?{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-3">
                    {["Yes", "No"].map((option) => (
                      <label
                        key={option}
                        className={`flex-1 text-center py-2 px-4 rounded-lg border cursor-pointer transition-all ${
                          formData.takingMedications === option.toLowerCase()
                            ? "border-[#1D9E75] bg-[#1D9E75]/5 text-[#1D9E75]"
                            : "border-[#e6ebe3] hover:border-[#5DCAA5]"
                        }`}
                      >
                        <input
                          type="radio"
                          name="takingMedications"
                          value={option.toLowerCase()}
                          checked={
                            formData.takingMedications === option.toLowerCase()
                          }
                          onChange={handleInputChange}
                          className="sr-only"
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                  {errors.takingMedications && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.takingMedications}
                    </p>
                  )}
                </div>

                {/* Primary Concern */}
                <div>
                  <label className="block text-sm font-medium text-[#34412f] mb-2">
                    What is your primary health concern?{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="primaryConcern"
                    value={formData.primaryConcern}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.primaryConcern
                        ? "border-red-500"
                        : "border-[#e6ebe3]"
                    } focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 focus:border-[#1D9E75] bg-white`}
                  >
                    <option value="">Select</option>
                    {HEALTH_CONCERNS.map((concern) => (
                      <option key={concern.value} value={concern.value}>
                        {concern.label}
                      </option>
                    ))}
                  </select>
                  {errors.primaryConcern && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.primaryConcern}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
              <h2 className="text-lg font-semibold text-[#34412f] mb-4">
                Payment
              </h2>

              {/* Order Summary */}
              <div className="bg-[#fdfbf7] rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-[#34412f]">
                    Sanative Health Membership
                  </span>
                  <span className="font-bold text-[#34412f]">$199/year</span>
                </div>
              </div>

              {/* What's Included (Collapsible) */}
              <button
                type="button"
                onClick={() => setShowWhatsIncluded(!showWhatsIncluded)}
                className="flex items-center justify-between w-full py-2 text-[#5c7a52] text-sm"
              >
                <span>What&apos;s included</span>
                {showWhatsIncluded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {showWhatsIncluded && (
                <div className="py-3 border-t border-[#e6ebe3] mt-2">
                  <ul className="space-y-2 text-sm text-[#5c7a52]">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1D9E75]" />
                      Biomarker One (80+ markers)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1D9E75]" />
                      Biological Clock score
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1D9E75]" />
                      Organ health scores
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1D9E75]" />
                      Care partner support
                    </li>
                  </ul>
                </div>
              )}

              {/* Consent */}
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer mb-4 ${
                  errors.consent ? "border-red-500" : "border-[#e6ebe3]"
                }`}
              >
                <input
                  type="checkbox"
                  name="consent"
                  checked={formData.consent}
                  onChange={handleInputChange}
                  className="w-5 h-5 rounded border-[#e6ebe3] text-[#1D9E75] focus:ring-[#1D9E75] mt-0.5"
                />
                <span className="text-sm text-[#5c7a52]">
                  I agree to the{" "}
                  <Link
                    href="/terms"
                    className="text-[#1D9E75] hover:underline"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="text-[#1D9E75] hover:underline"
                  >
                    Privacy Policy
                  </Link>
                </span>
              </label>
              {errors.consent && (
                <p className="text-red-500 text-sm mb-4">{errors.consent}</p>
              )}

              {/* Stripe Payment or Proceed Button */}
              {!paymentReady ? (
                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  disabled={isCreatingPaymentIntent}
                  className="w-full py-4 bg-[#1D9E75] text-white font-semibold rounded-full hover:bg-[#178a64] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreatingPaymentIntent ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Preparing payment...
                    </>
                  ) : (
                    "Proceed to payment"
                  )}
                </button>
              ) : clientSecret ? (
                <JoinPaymentForm
                  clientSecret={clientSecret}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  amount={199}
                  disabled={isSubmitting}
                />
              ) : (
                <PaymentFormLoading />
              )}

              {errors.payment && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl mt-4">
                  <p className="text-red-600 text-sm">{errors.payment}</p>
                </div>
              )}

              {errors.submit && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl mt-4">
                  <p className="text-red-600 text-sm">{errors.submit}</p>
                </div>
              )}

              {/* Trust Row */}
              <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-xs text-[#5c7a52]">
                {[
                  { icon: Stethoscope, text: "AHPRA" },
                  { icon: TestTube, text: "NATA" },
                  { icon: Shield, text: "Privacy Act" },
                  { icon: Shield, text: "Secure payment" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <item.icon className="w-3 h-3 text-[#1D9E75]" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#1D9E75]" />
        </div>
      }
    >
      <JoinPageContent />
    </Suspense>
  );
}
