"use client";

import { useState, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { ArrowRight, ArrowLeft, Beaker, Heart, Zap, Brain, Droplets, Activity, Clock } from "lucide-react";
import { BiomarkerSubscriptionPlanCards } from "@/components/promo/BiomarkerSubscriptionPlanCards";
import { PanelBiomarkerPreview } from "@/components/biomarkers/PanelBiomarkerPreview";
import {
  getBiomarkerSubscriptionPlan,
  getTierCategoryPreview,
  type BiomarkerSubscriptionTier,
} from "@/lib/biomarkers/public-subscription-panels";
import {
  countBiomarkersByCategory,
  getTierBiomarkersForDisplay,
} from "@/lib/biomarkers/panel-biomarker-display";
import type { BloodPanelCategoryKey } from "@/data/bloodPanelConfig";

const categoryIcons: Record<string, { icon: typeof Zap; color: string }> = {
  metabolic: { icon: Zap, color: "bg-amber-500" },
  hormones: { icon: Activity, color: "bg-pink-500" },
  inflammation: { icon: Heart, color: "bg-red-500" },
  nutrients: { icon: Beaker, color: "bg-emerald-500" },
  "liver-kidney": { icon: Droplets, color: "bg-sky-500" },
  thyroid: { icon: Brain, color: "bg-purple-500" },
  "biological-clock": { icon: Clock, color: "bg-indigo-500" },
};

/** Map intake category ids to blood panel category keys for counts. */
const INTAKE_TO_PANEL_CATEGORIES: Record<string, BloodPanelCategoryKey[]> = {
  metabolic: ["metabolism"],
  heart: ["heart"],
  hormones: ["hormones"],
  inflammation: ["inflammation"],
  nutrients: ["nutrients"],
  "liver-kidney": ["liver", "kidney"],
  thyroid: ["thyroid"],
  "biological-clock": ["blood", "inflammation", "metabolism"],
};

function BiomarkerIntakeContent() {
  const searchParams = useSearchParams();
  const concern = searchParams.get("concern");
  const service = searchParams.get("service");
  const packageFromUrl = searchParams.get("package");
  const [step, setStep] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState<BiomarkerSubscriptionTier | null>(() => {
    if (packageFromUrl === "essential" || packageFromUrl === "advanced" || packageFromUrl === "complete") {
      return packageFromUrl;
    }
    return null;
  });

  const selectedPlan = selectedPackage ? getBiomarkerSubscriptionPlan(selectedPackage) : null;
  const tierBiomarkers = useMemo(
    () => (selectedPackage ? getTierBiomarkersForDisplay(selectedPackage) : []),
    [selectedPackage]
  );
  const categoryCounts = useMemo(
    () => countBiomarkersByCategory(tierBiomarkers),
    [tierBiomarkers]
  );

  const tierCategories = selectedPackage
    ? getTierCategoryPreview(selectedPackage)
        .filter((category) => categoryIcons[category.id])
        .map((category) => {
          const panelKeys = INTAKE_TO_PANEL_CATEGORIES[category.id] ?? [];
          const markerCount = panelKeys.reduce(
            (sum, key) => sum + (categoryCounts[key] ?? 0),
            0
          );
          return {
            ...category,
            ...categoryIcons[category.id]!,
            markerCount,
          };
        })
    : [];

  const containerWidth = step === 2 ? "max-w-6xl" : "max-w-4xl";

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-[#f4f7f2] to-white py-12 lg:py-20">
        <div className={`${containerWidth} mx-auto px-4 sm:px-6 lg:px-8 transition-all`}>
          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-[#5c7a52]">Step {step} of 2</span>
              <span className="text-sm text-[#5c7a52]">
                {step === 1 ? "Select Package" : "Review Biomarkers"}
              </span>
            </div>
            <div className="h-2 bg-[#e6ebe3] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#5c7a52] rounded-full transition-all duration-500"
                style={{ width: `${(step / 2) * 100}%` }}
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

              <BiomarkerSubscriptionPlanCards
                variant="select"
                selectedId={selectedPackage}
                onSelect={setSelectedPackage}
              />

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
          {step === 2 && selectedPackage && selectedPlan && (
            <div>
              <div className="text-center mb-10">
                <h1 className="text-3xl lg:text-4xl font-serif text-[#2c3628] mb-4">
                  Your biomarker categories
                </h1>
                <p className="text-[#5c7a52] max-w-2xl mx-auto">
                  Here&apos;s what we&apos;ll test based on your {selectedPlan.name} panel
                </p>
              </div>

              {/* Category overview — above panel detail */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
                {tierCategories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <div
                      key={category.id}
                      className="p-4 sm:p-5 bg-white rounded-2xl border border-[#e6ebe3] hover:border-[#cdd8c6] transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${category.color} flex items-center justify-center flex-shrink-0`}>
                          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <h3 className="font-medium text-[#2c3628] text-sm sm:text-base leading-tight">
                          {category.name}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-[#7e9a72]">
                        {category.markerCount > 0
                          ? `${category.markerCount} marker${category.markerCount === 1 ? "" : "s"}`
                          : "Included via panel"}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="font-serif text-xl text-[#2c3628] sm:text-2xl">
                  Here&apos;s what we test for
                </h2>
                <Link
                  href={`/biomarkers/checkout?package=${selectedPackage}`}
                  className="btn-primary flex w-full items-center justify-center gap-2 sm:w-auto"
                >
                  Continue to checkout
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Visual biomarker grid — scroll inside panel so CTA stays reachable */}
              <div className="max-h-[min(52vh,560px)] overflow-y-auto overscroll-contain rounded-3xl">
                <PanelBiomarkerPreview
                  tier={selectedPackage}
                  planName={selectedPlan.name}
                  planTagline={selectedPlan.tagline}
                  markerCount={selectedPlan.markerCount}
                />
              </div>

              <div className="mt-10 flex flex-col-reverse sm:flex-row sm:justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </button>
                <Link
                  href={`/biomarkers/checkout?package=${selectedPackage}`}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  Continue to checkout
                  <ArrowRight className="w-5 h-5" />
                </Link>
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
