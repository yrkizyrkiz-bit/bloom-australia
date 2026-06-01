"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { ArrowRight, X, AlertCircle, Scale, Sparkles, Heart, UserCircle } from "lucide-react";

// GAP-022: No public-facing medicine names (GLP-1, Ozempic, Wegovy, Mounjaro, Semaglutide, Tirzepatide)
// Treatment options are discussed privately with your Sanative doctor

const services = [
  {
    id: "weight-loss",
    title: "Weight Loss",
    description: "Doctor-led weight loss programs with personalised medical support",
    longDescription: "Access clinically supported weight management prescribed by Australian doctors after a comprehensive health assessment. Treatment is only prescribed where clinically appropriate.",
    image: "https://ext.same-assets.com/1389255586/2658080352.jpeg",
    icon: Scale,
    color: "from-[#5c7a52] to-[#3d4f38]",
    features: ["Doctor Consultations", "Care Partner Support", "Progress Tracking", "Regular Check-ins"],
    price: "From $149/month",
    requiresBiomarker: true,
  },
  {
    id: "hair-loss",
    title: "Hair Loss",
    description: "Clinically proven treatments to regrow thicker, fuller hair",
    longDescription: "Personalised hair regrowth solutions prescribed by Australian doctors based on your unique health profile and needs.",
    image: "https://ext.same-assets.com/1389255586/3446480003.jpeg",
    icon: Sparkles,
    color: "from-[#a8bb9e] to-[#7e9a72]",
    features: ["Topical Treatments", "Oral Options", "Hair Supplements", "Progress Photos"],
    price: "From $59/month",
    requiresBiomarker: true,
  },
  {
    id: "womens-health",
    title: "Women's Health",
    description: "Comprehensive care for hormones, menopause, and reproductive health",
    longDescription: "Holistic women's health services including hormone support, menopause care, and reproductive health consultations with experienced doctors.",
    image: "https://ext.same-assets.com/1389255586/754957936.jpeg",
    icon: Heart,
    color: "from-[#c17a58] to-[#a9634a]",
    features: ["Hormone Support", "Menopause Care", "Cycle Health", "Fertility Guidance"],
    price: "From $89/month",
    requiresBiomarker: true,
  },
  {
    id: "mens-health",
    title: "Men's Health",
    description: "Testosterone optimisation, energy, and performance health",
    longDescription: "Evidence-based men's health programs focusing on hormone optimisation, energy levels, and overall vitality guided by your health profile.",
    image: "https://ext.same-assets.com/1389255586/2770872326.jpeg",
    icon: UserCircle,
    color: "from-[#34412f] to-[#2c3628]",
    features: ["Hormone Support", "Energy Optimisation", "Performance Health", "Preventive Care"],
    price: "From $99/month",
    requiresBiomarker: true,
  },
];

export default function ServicesPage() {
  const [showTriageModal, setShowTriageModal] = useState(false);
  const [selectedService, setSelectedService] = useState<typeof services[0] | null>(null);

  const handleStartClick = (service: typeof services[0]) => {
    setSelectedService(service);
    setShowTriageModal(true);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-[#f4f7f2] to-white">
        {/* Hero */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="inline-block px-4 py-2 rounded-full bg-[#e6ebe3] text-[#5c7a52] text-sm font-medium mb-4">
                Our Services
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#2c3628] leading-tight">
                Personalised care,
                <br />
                <span className="text-gradient italic">powered by science</span>
              </h1>
              <p className="mt-6 text-lg text-[#5c7a52]">
                All our treatment programs begin with a comprehensive health assessment to ensure safe, effective, and personalised care.
              </p>
            </div>

            {/* Services Grid */}
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="group bg-white rounded-3xl overflow-hidden shadow-sm border border-[#e6ebe3] hover:shadow-xl transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative h-56 lg:h-64 overflow-hidden">
                    <Image
                      src={service.image}
                      alt={service.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t ${service.color} opacity-60`} />
                    <div className="absolute top-4 left-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <service.icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <h3 className="text-2xl lg:text-3xl font-serif text-white">
                        {service.title}
                      </h3>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 lg:p-8">
                    <p className="text-[#5c7a52] mb-4">
                      {service.longDescription}
                    </p>

                    {/* Features */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {service.features.map((feature) => (
                        <span
                          key={feature}
                          className="px-3 py-1 rounded-full bg-[#e6ebe3] text-[#34412f] text-sm"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    {/* Price & CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-[#e6ebe3]">
                      <span className="text-lg font-medium text-[#34412f]">
                        {service.price}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStartClick(service)}
                        className="btn-primary flex items-center gap-2"
                      >
                        Start
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Info */}
            <div className="mt-16 bg-[#34412f] rounded-3xl p-8 lg:p-12 text-center">
              <h2 className="text-2xl lg:text-3xl font-serif text-white mb-4">
                Why we start with a health assessment
              </h2>
              <p className="text-[#a8bb9e] max-w-2xl mx-auto mb-8">
                Every body is different. Before recommending any treatment, we review your health profile to ensure safety, clinical suitability, and the best possible outcomes for your health journey.
              </p>
              <Link
                href="/biomarker-intake"
                className="btn-white inline-flex items-center gap-2"
              >
                Start your health assessment
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* Triage Modal */}
      {showTriageModal && selectedService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl animate-fade-in">
            <button
              type="button"
              onClick={() => setShowTriageModal(false)}
              className="absolute top-4 right-4 p-2 text-[#5c7a52] hover:bg-[#e6ebe3] rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-[#c17a58]/10 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-[#c17a58]" />
              </div>
              <div>
                <h3 className="text-xl font-serif text-[#2c3628] mb-2">
                  Health Assessment Required
                </h3>
                <p className="text-[#5c7a52] text-sm leading-relaxed">
                  To ensure clinical safety, we require a <strong>health assessment</strong> before recommending any {selectedService.title.toLowerCase()} treatments.
                </p>
              </div>
            </div>

            <div className="bg-[#f4f7f2] rounded-2xl p-5 mb-6">
              <h4 className="font-medium text-[#2c3628] mb-3">Start your journey</h4>
              <p className="text-sm text-[#5c7a52] mb-4">
                Your health assessment will help us:
              </p>
              <ul className="space-y-2 text-sm text-[#5c7a52]">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7e9a72] mt-1.5 flex-shrink-0" />
                  Identify any clinical considerations for treatment
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7e9a72] mt-1.5 flex-shrink-0" />
                  Personalise your care plan
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7e9a72] mt-1.5 flex-shrink-0" />
                  Create a baseline for tracking progress
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7e9a72] mt-1.5 flex-shrink-0" />
                  Ensure the safest and most effective outcomes
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <Link
                href={`/biomarker-intake?service=${selectedService.id}`}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                Start health assessment
                <ArrowRight className="w-5 h-5" />
              </Link>
              <button
                type="button"
                onClick={() => setShowTriageModal(false)}
                className="w-full py-3 text-[#5c7a52] hover:text-[#34412f] transition-colors text-sm"
              >
                I&apos;ll come back later
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
