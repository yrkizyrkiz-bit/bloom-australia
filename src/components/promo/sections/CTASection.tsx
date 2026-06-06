import Link from "next/link";
import { ArrowRight, Shield, Clock, Truck, MessageCircle } from "lucide-react";

export function CTASection() {
  const features = [
    {
      icon: Shield,
      title: "AHPRA Doctors",
      description: "All treatments are approved by Australia's Therapeutic Goods Administration",
    },
    {
      icon: Clock,
      title: "Quick Consultations",
      description: "Get a response from our doctors within 24 hours",
    },
    {
      icon: Truck,
      title: "Discreet Delivery",
      description: "Plain packaging delivered Australia-wide",
    },
    {
      icon: MessageCircle,
      title: "Ongoing Support",
      description: "Message your care team anytime with questions",
    },
  ];

  return (
    <section className="py-20 lg:py-28 bg-[#fdfbf7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main CTA Card */}
        <div className="relative bg-gradient-to-br from-[#4a6243] via-[#3d4f38] to-[#34412f] rounded-[2.5rem] overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#5c7a52]/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#c17a58]/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

          <div className="relative px-8 py-16 lg:px-16 lg:py-20">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-white leading-tight">
                Total care.
                <br />
                <span className="text-[#cdd8c6] italic">Totally different.</span>
              </h2>

              <p className="mt-6 text-lg lg:text-xl text-[#a8bb9e] max-w-2xl mx-auto">
                Join thousands of Australians who&apos;ve transformed their health with personalised, doctor-led care from home.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/get-started"
                  className="btn-white inline-flex items-center justify-center gap-2 text-lg px-10 py-4"
                >
                  Start your journey
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/quiz"
                  className="btn-secondary border-white text-white hover:bg-white hover:text-[#34412f] inline-flex items-center justify-center text-lg px-10 py-4"
                >
                  Take our health quiz
                </Link>
              </div>

              {/* GAP-026: Removed 'No commitment' - payment required before consult */}
              <p className="mt-6 text-sm text-[#7e9a72]">
                Free health assessment. Refund if not clinically suitable.
              </p>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center text-center p-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#e6ebe3] flex items-center justify-center mb-4">
                <feature.icon className="w-7 h-7 text-[#5c7a52]" />
              </div>
              <h3 className="text-lg font-medium text-[#2c3628] mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-[#5c7a52] leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Download App CTA */}
        <div className="mt-16 bg-[#e6ebe3] rounded-3xl p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <h3 className="text-2xl lg:text-3xl font-serif text-[#2c3628]">
                Download the sanative app
              </h3>
              <p className="mt-2 text-[#5c7a52]">
                Manage your health on the go. Available for iOS and Android.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                className="px-6 py-3 bg-[#34412f] text-white rounded-xl hover:bg-[#2c3628] transition-colors flex items-center gap-3"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div className="text-left">
                  <p className="text-xs opacity-80">Download on the</p>
                  <p className="font-medium">App Store</p>
                </div>
              </button>
              <button
                type="button"
                className="px-6 py-3 bg-[#34412f] text-white rounded-xl hover:bg-[#2c3628] transition-colors flex items-center gap-3"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3 20.5v-17c0-.59.34-1.11.84-1.35L13.69 12l-9.85 9.85c-.5-.25-.84-.76-.84-1.35zm13.81-5.38L6.05 21.34l8.49-8.49 2.27 2.27zm3.35-4.31c.34.27.59.69.59 1.19s-.22.9-.57 1.18l-2.29 1.32-2.5-2.5 2.5-2.5 2.27 1.31zM6.05 2.66l10.76 6.22-2.27 2.27L6.05 2.66z"/>
                </svg>
                <div className="text-left">
                  <p className="text-xs opacity-80">Get it on</p>
                  <p className="font-medium">Google Play</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
