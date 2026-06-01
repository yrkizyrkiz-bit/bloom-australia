"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle,
  ArrowRight,
  MapPin,
  Home,
  Calendar,
  User,
} from "lucide-react";

export default function DashboardWelcomePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);

  // Mock data
  const memberData = {
    firstName: "Sarah",
    program: "Kidney Health",
    carePartner: {
      name: "Emma Wilson",
      photo: null, // placeholder
    },
  };

  // Mock collection centres
  const collectionCentres = [
    { name: "QML Pathology Greenslopes", address: "123 Logan Rd, Greenslopes QLD 4120", distance: "1.2 km" },
    { name: "Sullivan Nicolaides Coorparoo", address: "45 Cavendish Rd, Coorparoo QLD 4151", distance: "2.8 km" },
    { name: "Laverty Pathology Camp Hill", address: "78 Old Cleveland Rd, Camp Hill QLD 4152", distance: "3.1 km" },
  ];

  const steps = [
    {
      title: `Welcome, ${memberData.firstName}`,
      content: (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
            <div className="flex items-center gap-4 mb-4">
              <span className="px-3 py-1 bg-[#1D9E75]/10 text-[#1D9E75] rounded-full text-sm font-medium">
                {memberData.program}
              </span>
            </div>
            <p className="text-[#5c7a52] mb-6">
              You&apos;re enrolled in our {memberData.program} program. Your
              dedicated care partner will guide you through every step.
            </p>

            <div className="flex items-center gap-4 p-4 bg-[#fdfbf7] rounded-xl">
              <div className="w-14 h-14 bg-[#1D9E75]/10 rounded-full flex items-center justify-center">
                <User className="w-7 h-7 text-[#1D9E75]" />
              </div>
              <div>
                <p className="text-sm text-[#5c7a52]">Your care partner</p>
                <p className="font-semibold text-[#34412f]">
                  {memberData.carePartner.name}
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-[#5c7a52]">
              {memberData.carePartner.name} will be in touch within 24 hours to
              welcome you and answer any questions.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Book your first test",
      content: (
        <div className="space-y-6">
          <p className="text-[#5c7a52]">
            Your first biomarker panel is included. Choose how you&apos;d like
            to complete it:
          </p>

          {/* Collection Centres */}
          <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-[#1D9E75]" />
              <h3 className="font-semibold text-[#34412f]">
                Nearby collection centres
              </h3>
            </div>
            <div className="space-y-3">
              {collectionCentres.map((centre, index) => (
                <button
                  key={index}
                  className="w-full text-left p-4 rounded-xl border border-[#e6ebe3] hover:border-[#1D9E75] hover:bg-[#fdfbf7] transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-[#34412f]">{centre.name}</p>
                      <p className="text-sm text-[#5c7a52]">{centre.address}</p>
                    </div>
                    <span className="text-xs text-[#1D9E75] font-medium">
                      {centre.distance}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Home Kit Option */}
          <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
            <div className="flex items-center gap-2 mb-4">
              <Home className="w-5 h-5 text-[#1D9E75]" />
              <h3 className="font-semibold text-[#34412f]">
                Request a home kit
              </h3>
            </div>
            <p className="text-sm text-[#5c7a52] mb-4">
              Prefer to test at home? We&apos;ll send you a collection kit with
              everything you need.
            </p>
            <button className="px-4 py-2 border border-[#1D9E75] text-[#1D9E75] rounded-lg text-sm hover:bg-[#1D9E75]/5 transition-colors">
              Request home kit
            </button>
          </div>
        </div>
      ),
    },
    {
      title: "You're all set",
      content: (
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-[#1D9E75]/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-[#1D9E75]" />
          </div>

          <div>
            <h3 className="text-xl font-semibold text-[#34412f] mb-2">
              Your program is ready
            </h3>
            <p className="text-[#5c7a52]">
              Your care partner will be in touch soon. In the meantime, explore
              your dashboard to learn more about your health journey.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#e6ebe3]">
            <h4 className="font-medium text-[#34412f] mb-4">
              What happens next:
            </h4>
            <div className="space-y-3 text-left">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#1D9E75]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-[#1D9E75]">1</span>
                </div>
                <p className="text-sm text-[#5c7a52]">
                  Complete your biomarker test at your chosen location
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#1D9E75]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-[#1D9E75]">2</span>
                </div>
                <p className="text-sm text-[#5c7a52]">
                  Results arrive in your dashboard within 3-5 days
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-[#1D9E75]/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-[#1D9E75]">3</span>
                </div>
                <p className="text-sm text-[#5c7a52]">
                  Your care partner reviews results with you
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.push("/dashboard");
    }
  };

  const handleSkip = () => {
    router.push("/dashboard");
  };

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

      <main className="max-w-xl mx-auto px-4 py-12">
        {/* Progress Indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentStep
                  ? "bg-[#1D9E75]"
                  : index < currentStep
                    ? "bg-[#5DCAA5]"
                    : "bg-[#e6ebe3]"
              }`}
            />
          ))}
        </div>

        {/* Step Title */}
        <h1 className="text-2xl md:text-3xl font-serif text-[#34412f] text-center mb-8">
          {steps[currentStep].title}
        </h1>

        {/* Step Content */}
        <div className="mb-8">{steps[currentStep].content}</div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-[#5c7a52] hover:text-[#1D9E75]"
          >
            Skip for now
          </button>
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 bg-[#1D9E75] text-white rounded-full hover:bg-[#178a64] transition-colors group"
          >
            {currentStep === steps.length - 1 ? "Go to dashboard" : "Next"}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </main>
    </div>
  );
}
