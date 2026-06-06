"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";

const AUSTRALIAN_STATES = [
  { value: "ACT", label: "Australian Capital Territory" },
  { value: "NSW", label: "New South Wales" },
  { value: "NT", label: "Northern Territory" },
  { value: "QLD", label: "Queensland" },
  { value: "SA", label: "South Australia" },
  { value: "TAS", label: "Tasmania" },
  { value: "VIC", label: "Victoria" },
  { value: "WA", label: "Western Australia" },
];

const PROGRAMS = [
  { id: "kidney-health", label: "Kidney Health" },
  { id: "fatty-liver", label: "Fatty Liver" },
  { id: "diabetes-care", label: "Diabetes Care" },
  { id: "heart-health", label: "Heart Health" },
  { id: "weight-management", label: "Weight Management" },
  { id: "womens-health", label: "Women's Health" },
  { id: "all-programs", label: "All programs" },
];

const REFERRAL_SOURCES = [
  { value: "medical-journal", label: "Medical journal / publication" },
  { value: "colleague-referral", label: "Colleague referral" },
  { value: "conference-event", label: "Conference or event" },
  { value: "direct-mail", label: "Direct mail" },
  { value: "online-search", label: "Online search" },
  { value: "other", label: "Other" },
];

interface FormData {
  clinicName: string;
  streetAddress: string;
  suburb: string;
  state: string;
  postcode: string;
  leadGpName: string;
  leadGpEmail: string;
  leadGpMobile: string;
  abn: string;
  programs: string[];
  referralSource: string;
  consent: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export default function ClinicRegistrationPage() {
  const [formData, setFormData] = useState<FormData>({
    clinicName: "",
    streetAddress: "",
    suburb: "",
    state: "",
    postcode: "",
    leadGpName: "",
    leadGpEmail: "",
    leadGpMobile: "",
    abn: "",
    programs: [],
    referralSource: "",
    consent: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const validateMobile = (mobile: string) => {
    // Australian mobile format: 04XX XXX XXX or +614XX XXX XXX
    const cleaned = mobile.replace(/\s/g, "");
    const regex = /^(\+?61|0)?4\d{8}$/;
    return regex.test(cleaned);
  };

  const validatePostcode = (postcode: string) => {
    const regex = /^\d{4}$/;
    return regex.test(postcode);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.clinicName.trim()) {
      newErrors.clinicName = "Practice / clinic name is required";
    }
    if (!formData.streetAddress.trim()) {
      newErrors.streetAddress = "Street address is required";
    }
    if (!formData.suburb.trim()) {
      newErrors.suburb = "Suburb is required";
    }
    if (!formData.state) {
      newErrors.state = "State is required";
    }
    if (!formData.postcode.trim()) {
      newErrors.postcode = "Postcode is required";
    } else if (!validatePostcode(formData.postcode)) {
      newErrors.postcode = "Please enter a valid 4-digit postcode";
    }
    if (!formData.leadGpName.trim()) {
      newErrors.leadGpName = "Lead GP full name is required";
    }
    if (!formData.leadGpEmail.trim()) {
      newErrors.leadGpEmail = "Lead GP email is required";
    } else if (!validateEmail(formData.leadGpEmail)) {
      newErrors.leadGpEmail = "Please enter a valid email address";
    }
    if (!formData.leadGpMobile.trim()) {
      newErrors.leadGpMobile = "Lead GP mobile is required";
    } else if (!validateMobile(formData.leadGpMobile)) {
      newErrors.leadGpMobile = "Please enter a valid Australian mobile number";
    }
    if (!formData.consent) {
      newErrors.consent = "You must agree to the terms to continue";
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

    // Clear error when field is modified
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleProgramChange = (programId: string) => {
    setFormData((prev) => {
      const programs = prev.programs.includes(programId)
        ? prev.programs.filter((p) => p !== programId)
        : [...prev.programs, programId];
      return { ...prev, programs };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/clinics/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        const data = await response.json();
        setErrors({ submit: data.message || "Registration failed" });
      }
    } catch {
      setErrors({ submit: "An error occurred. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col">
        {/* Header */}
        <header className="border-b border-[#e6ebe3] bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="text-3xl font-serif text-[#34412f]">
              sanative
            </Link>
          </div>
        </header>

        {/* Success Message */}
        <div className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-lg text-center">
            <div className="w-20 h-20 bg-[#1D9E75]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-[#1D9E75]" />
            </div>
            <h1 className="text-3xl font-serif text-[#34412f] mb-4">
              Your clinic has been registered
            </h1>
            <p className="text-lg text-[#5c7a52] mb-8">
              Your QR code and waiting room materials will be emailed to{" "}
              <span className="font-medium text-[#34412f]">
                {formData.leadGpEmail}
              </span>{" "}
              within 1 business day.
            </p>
            <p className="text-[#5c7a52] mb-8">
              You can also log in to your clinic portal at any time at{" "}
              <Link
                href="/gp/login"
                className="text-[#1D9E75] hover:underline font-medium"
              >
                sanative.com.au/gp/login
              </Link>
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[#1D9E75] hover:text-[#178a64] font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {/* Header */}
      <header className="border-b border-[#e6ebe3] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-3xl font-serif text-[#34412f]">
            sanative
          </Link>
          <Link
            href="/for-doctors"
            className="text-sm text-[#5c7a52] hover:text-[#1D9E75] flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to For Doctors
          </Link>
        </div>
      </header>

      {/* Form */}
      <main className="py-12 md:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl md:text-4xl font-serif text-[#34412f] mb-2">
            Register your clinic
          </h1>
          <p className="text-[#5c7a52] mb-8">
            Complete the form below and we&apos;ll set up your clinic account
            within 1 business day.
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Clinic Details */}
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#e6ebe3]">
              <h2 className="text-lg font-semibold text-[#34412f] mb-6">
                Clinic details
              </h2>

              <div className="space-y-4">
                {/* Clinic Name */}
                <div>
                  <label
                    htmlFor="clinicName"
                    className="block text-sm font-medium text-[#34412f] mb-1"
                  >
                    Practice / clinic name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="clinicName"
                    name="clinicName"
                    value={formData.clinicName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.clinicName
                        ? "border-red-500"
                        : "border-[#e6ebe3]"
                    } focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 focus:border-[#1D9E75]`}
                  />
                  {errors.clinicName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.clinicName}
                    </p>
                  )}
                </div>

                {/* Street Address */}
                <div>
                  <label
                    htmlFor="streetAddress"
                    className="block text-sm font-medium text-[#34412f] mb-1"
                  >
                    Street address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="streetAddress"
                    name="streetAddress"
                    value={formData.streetAddress}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.streetAddress
                        ? "border-red-500"
                        : "border-[#e6ebe3]"
                    } focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 focus:border-[#1D9E75]`}
                  />
                  {errors.streetAddress && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.streetAddress}
                    </p>
                  )}
                </div>

                {/* Suburb, State, Postcode */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label
                      htmlFor="suburb"
                      className="block text-sm font-medium text-[#34412f] mb-1"
                    >
                      Suburb <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="suburb"
                      name="suburb"
                      value={formData.suburb}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        errors.suburb ? "border-red-500" : "border-[#e6ebe3]"
                      } focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 focus:border-[#1D9E75]`}
                    />
                    {errors.suburb && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.suburb}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="state"
                      className="block text-sm font-medium text-[#34412f] mb-1"
                    >
                      State <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        errors.state ? "border-red-500" : "border-[#e6ebe3]"
                      } focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 focus:border-[#1D9E75] bg-white`}
                    >
                      <option value="">Select</option>
                      {AUSTRALIAN_STATES.map((state) => (
                        <option key={state.value} value={state.value}>
                          {state.value}
                        </option>
                      ))}
                    </select>
                    {errors.state && (
                      <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="postcode"
                      className="block text-sm font-medium text-[#34412f] mb-1"
                    >
                      Postcode <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="postcode"
                      name="postcode"
                      value={formData.postcode}
                      onChange={handleInputChange}
                      maxLength={4}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        errors.postcode ? "border-red-500" : "border-[#e6ebe3]"
                      } focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 focus:border-[#1D9E75]`}
                    />
                    {errors.postcode && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.postcode}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Lead GP Details */}
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#e6ebe3]">
              <h2 className="text-lg font-semibold text-[#34412f] mb-6">
                Lead GP details
              </h2>

              <div className="space-y-4">
                {/* Lead GP Name */}
                <div>
                  <label
                    htmlFor="leadGpName"
                    className="block text-sm font-medium text-[#34412f] mb-1"
                  >
                    Full name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="leadGpName"
                    name="leadGpName"
                    value={formData.leadGpName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.leadGpName ? "border-red-500" : "border-[#e6ebe3]"
                    } focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 focus:border-[#1D9E75]`}
                  />
                  {errors.leadGpName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.leadGpName}
                    </p>
                  )}
                </div>

                {/* Lead GP Email */}
                <div>
                  <label
                    htmlFor="leadGpEmail"
                    className="block text-sm font-medium text-[#34412f] mb-1"
                  >
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="leadGpEmail"
                    name="leadGpEmail"
                    value={formData.leadGpEmail}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.leadGpEmail ? "border-red-500" : "border-[#e6ebe3]"
                    } focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 focus:border-[#1D9E75]`}
                  />
                  {errors.leadGpEmail && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.leadGpEmail}
                    </p>
                  )}
                </div>

                {/* Lead GP Mobile */}
                <div>
                  <label
                    htmlFor="leadGpMobile"
                    className="block text-sm font-medium text-[#34412f] mb-1"
                  >
                    Mobile <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="leadGpMobile"
                    name="leadGpMobile"
                    value={formData.leadGpMobile}
                    onChange={handleInputChange}
                    placeholder="04XX XXX XXX"
                    className={`w-full px-4 py-3 rounded-xl border ${
                      errors.leadGpMobile
                        ? "border-red-500"
                        : "border-[#e6ebe3]"
                    } focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 focus:border-[#1D9E75]`}
                  />
                  {errors.leadGpMobile && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.leadGpMobile}
                    </p>
                  )}
                </div>

                {/* ABN */}
                <div>
                  <label
                    htmlFor="abn"
                    className="block text-sm font-medium text-[#34412f] mb-1"
                  >
                    ABN <span className="text-[#5c7a52]">(optional)</span>
                  </label>
                  <input
                    type="text"
                    id="abn"
                    name="abn"
                    value={formData.abn}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-[#e6ebe3] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 focus:border-[#1D9E75]"
                  />
                </div>
              </div>
            </div>

            {/* Programs of Interest */}
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#e6ebe3]">
              <h2 className="text-lg font-semibold text-[#34412f] mb-2">
                Programs of interest
              </h2>
              <p className="text-sm text-[#5c7a52] mb-6">
                Select all programs you&apos;d like to refer patients to
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PROGRAMS.map((program) => (
                  <label
                    key={program.id}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      formData.programs.includes(program.id)
                        ? "border-[#1D9E75] bg-[#1D9E75]/5"
                        : "border-[#e6ebe3] hover:border-[#5DCAA5]"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.programs.includes(program.id)}
                      onChange={() => handleProgramChange(program.id)}
                      className="w-5 h-5 rounded border-[#e6ebe3] text-[#1D9E75] focus:ring-[#1D9E75]"
                    />
                    <span className="text-[#34412f]">{program.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Referral Source */}
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-[#e6ebe3]">
              <h2 className="text-lg font-semibold text-[#34412f] mb-6">
                How did you hear about us?
              </h2>

              <select
                id="referralSource"
                name="referralSource"
                value={formData.referralSource}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl border border-[#e6ebe3] focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/20 focus:border-[#1D9E75] bg-white"
              >
                <option value="">Select an option</option>
                {REFERRAL_SOURCES.map((source) => (
                  <option key={source.value} value={source.value}>
                    {source.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Consent & Submit */}
            <div className="space-y-6">
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer ${
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
                  I confirm I am a registered healthcare practitioner and agree
                  to the{" "}
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
                  .
                </span>
              </label>
              {errors.consent && (
                <p className="text-red-500 text-sm -mt-4">{errors.consent}</p>
              )}

              {errors.submit && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm">{errors.submit}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-[#1D9E75] text-white font-semibold rounded-full hover:bg-[#178a64] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Registering...
                  </>
                ) : (
                  "Register my clinic"
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
