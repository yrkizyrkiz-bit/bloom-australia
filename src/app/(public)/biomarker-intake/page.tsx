"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { ArrowRight, ArrowLeft, Check, Beaker, Heart, Zap, Brain, Droplets, Activity, MapPin } from "lucide-react";

const biomarkerCategories = [
  {
    id: "metabolic",
    name: "Metabolic Health",
    icon: Zap,
    markers: ["Fasting Glucose", "HbA1c", "Insulin", "Cholesterol Panel", "Triglycerides"],
    color: "bg-amber-500",
  },
  {
    id: "hormones",
    name: "Hormones",
    icon: Activity,
    markers: ["Thyroid Panel", "Cortisol", "Oestrogen", "Progesterone", "Testosterone"],
    color: "bg-pink-500",
  },
  {
    id: "inflammation",
    name: "Inflammation",
    icon: Heart,
    markers: ["CRP", "ESR", "Ferritin", "Homocysteine"],
    color: "bg-red-500",
  },
  {
    id: "nutrients",
    name: "Nutrients",
    icon: Beaker,
    markers: ["Vitamin D", "Vitamin B12", "Iron Studies", "Folate", "Zinc"],
    color: "bg-emerald-500",
  },
  {
    id: "liver-kidney",
    name: "Liver & Kidney",
    icon: Droplets,
    markers: ["ALT", "AST", "GGT", "Creatinine", "eGFR"],
    color: "bg-sky-500",
  },
  {
    id: "thyroid",
    name: "Thyroid Function",
    icon: Brain,
    markers: ["TSH", "Free T3", "Free T4", "Thyroid Antibodies"],
    color: "bg-purple-500",
  },
];

function BiomarkerIntakeContent() {
  const searchParams = useSearchParams();
  const concern = searchParams.get("concern");
  const service = searchParams.get("service");
  const [step, setStep] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const packages = [
    {
      id: "essential",
      name: "Essential Panel",
      description: "Core biomarkers for general health assessment",
      markers: 40,
      price: 199,
      popular: false,
    },
    {
      id: "advanced",
      name: "Advanced Panel",
      description: "Comprehensive testing including hormones and inflammation",
      markers: 65,
      price: 349,
      popular: true,
    },
    {
      id: "complete",
      name: "Complete Panel",
      description: "Full health audit with all biomarker categories",
      markers: 85,
      price: 499,
      popular: false,
    },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-[#f4f7f2] to-white py-12 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#5c7a52]">Step {step} of 3</span>
              <span className="text-sm text-[#5c7a52]">
                {step === 1 ? "Select Package" : step === 2 ? "Review Biomarkers" : "Book Collection"}
              </span>
            </div>
            <div className="h-2 bg-[#e6ebe3] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#5c7a52] rounded-full transition-all duration-500"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Context Banner */}
          {(concern || service) && (
            <div className="mb-8 p-4 bg-[#e6ebe3] rounded-2xl">
              <p className="text-sm text-[#34412f]">
                <strong>Your focus:</strong>{" "}
                {concern ? concern.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase()) : service?.replace("-", " ").replace(/\b\w/g, l => l.toUpperCase())}
                {" "}- We&apos;ll recommend the right biomarkers for your needs.
              </p>
            </div>
          )}

          {/* Step 1: Select Package */}
          {step === 1 && (
            <div>
              <div className="text-center mb-10">
                <h1 className="text-3xl lg:text-4xl font-serif text-[#2c3628] mb-4">
                  Choose your biomarker panel
                </h1>
                <p className="text-[#5c7a52]">
                  Select the level of testing that&apos;s right for your health goals
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {packages.map((pkg) => (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setSelectedPackage(pkg.id)}
                    className={`relative p-6 rounded-2xl border-2 text-left transition-all ${
                      selectedPackage === pkg.id
                        ? "border-[#5c7a52] bg-[#f4f7f2]"
                        : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#c17a58] text-white text-xs font-medium rounded-full">
                        Most Popular
                      </span>
                    )}
                    <h3 className="text-xl font-serif text-[#2c3628] mb-2">{pkg.name}</h3>
                    <p className="text-sm text-[#5c7a52] mb-4">{pkg.description}</p>
                    <p className="text-sm text-[#7e9a72] mb-4">{pkg.markers} tests & markers*</p>
                    <p className="text-2xl font-serif text-[#34412f]">
                      ${pkg.price}
                      <span className="text-sm font-normal text-[#7e9a72]"> AUD</span>
                    </p>
                    {selectedPackage === pkg.id && (
                      <div className="absolute top-4 right-4 w-6 h-6 bg-[#5c7a52] rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <p className="mt-4 text-xs text-[#7e9a72] text-center">
                *Includes individual biomarkers plus panel tests (e.g., lipid panel, metabolic panel) which measure multiple values.
              </p>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!selectedPackage}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Review Biomarkers */}
          {step === 2 && (
            <div>
              <div className="text-center mb-10">
                <h1 className="text-3xl lg:text-4xl font-serif text-[#2c3628] mb-4">
                  Your biomarker categories
                </h1>
                <p className="text-[#5c7a52]">
                  Here&apos;s what we&apos;ll test based on your selected panel
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {biomarkerCategories.map((category) => (
                  <div
                    key={category.id}
                    className="p-5 bg-white rounded-2xl border border-[#e6ebe3]"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl ${category.color} flex items-center justify-center`}>
                        <category.icon className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="font-medium text-[#2c3628]">{category.name}</h3>
                    </div>
                    <ul className="space-y-1">
                      {category.markers.map((marker) => (
                        <li key={marker} className="text-sm text-[#5c7a52] flex items-center gap-2">
                          <span className="w-1 h-1 rounded-full bg-[#7e9a72]" />
                          {marker}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="mt-10 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="btn-primary flex items-center gap-2"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Book Collection */}
          {step === 3 && (
            <div>
              <div className="text-center mb-10">
                <div className="w-16 h-16 rounded-full bg-[#5c7a52] flex items-center justify-center mx-auto mb-6">
                  <Check className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl lg:text-4xl font-serif text-[#2c3628] mb-4">
                  You&apos;re all set!
                </h1>
                <p className="text-[#5c7a52] max-w-md mx-auto">
                  Book your blood sample collection at a pathology centre near you
                </p>
              </div>

              <div className="max-w-lg mx-auto">
                <div className="p-8 bg-white rounded-2xl border border-[#e6ebe3] text-center shadow-sm">
                  <div className="w-14 h-14 rounded-full bg-[#5c7a52]/10 flex items-center justify-center mx-auto mb-4">
                    <MapPin className="w-7 h-7 text-[#5c7a52]" />
                  </div>
                  <h3 className="text-xl font-serif text-[#2c3628] mb-2">Blood Sample Collection</h3>
                  <p className="text-sm text-[#5c7a52] mb-6">
                    Visit one of our 500+ partner pathology centres across Australia for a quick and easy blood sample collection.
                  </p>
                  <Link href={`/checkout?method=pathology&package=${selectedPackage || 'advanced'}`} className="btn-primary w-full inline-flex items-center justify-center gap-2">
                    Find a centre near you
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <p className="text-xs text-[#7e9a72] mt-4">
                    Results delivered to your app within 5-7 business days
                  </p>
                </div>
              </div>

              <div className="mt-10 flex justify-start">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function BiomarkerIntakePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#5c7a52] border-t-transparent rounded-full" />
      </div>
    }>
      <BiomarkerIntakeContent />
    </Suspense>
  );
}
