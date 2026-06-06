import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

// GAP-022: No public medication names (GLP-1, Ozempic, Semaglutide, Tirzepatide)
// Treatment options are discussed privately with your Sanative doctor

export function WeightLossSection() {
  return (
    <section className="py-20 lg:py-32 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#e8ede5] via-[#dce4d6] to-[#cdd8c6]" />

      {/* Decorative Circles */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-white/10 rounded-full blur-2xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-[#2c3628] leading-tight">
            Your weight loss
            <br />
            <span className="text-[#5c7a52] italic">journey starts here</span>
          </h2>
          <p className="mt-6 text-lg lg:text-xl text-[#34412f] max-w-2xl mx-auto">
            Doctor-led weight management programs with personalised treatment plans prescribed by AHPRA-registered doctors.
          </p>
        </div>

        {/* Visual Element - Abstract shapes instead of medication references */}
        <div className="flex justify-center mb-12">
          <div className="relative">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 lg:w-28 lg:h-28 bg-white rounded-full shadow-2xl flex items-center justify-center animate-float" style={{ animationDelay: '0s' }}>
                <span className="text-[#7e9a72] font-serif text-2xl lg:text-3xl">care</span>
              </div>
              <div className="w-24 h-24 lg:w-32 lg:h-32 bg-white rounded-full shadow-2xl flex items-center justify-center animate-float" style={{ animationDelay: '0.5s' }}>
                <span className="text-[#5c7a52] font-serif text-3xl lg:text-4xl">you</span>
              </div>
              <div className="w-16 h-16 lg:w-24 lg:h-24 bg-white rounded-full shadow-2xl flex items-center justify-center animate-float" style={{ animationDelay: '1s' }}>
                <span className="text-[#a8bb9e] font-serif text-xl lg:text-2xl">+</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mb-12">
          <p className="text-lg lg:text-xl text-[#2c3628] max-w-xl mx-auto font-medium">
            Clinically supported programs designed to help you achieve
            <span className="text-[#5c7a52] font-bold"> sustainable weight loss</span>{" "}
            with ongoing doctor support.*
          </p>
        </div>

        {/* Benefits */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-12">
          {[
            "AHPRA-registered doctors",
            "Personalised treatment plans",
            "Ongoing clinical support",
            "Discreet home delivery",
          ].map((benefit) => (
            <div
              key={benefit}
              className="flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-2xl px-5 py-4"
            >
              <div className="w-6 h-6 rounded-full bg-[#34412f] flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-white" />
              </div>
              <span className="text-[#2c3628] font-medium">{benefit}</span>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/weight-management"
            className="btn-white inline-flex items-center gap-2 text-lg px-10 py-4"
          >
            Get started
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-6 text-sm text-[#34412f]">
            *Results vary. Treatment is only prescribed where clinically appropriate.
          </p>
        </div>
      </div>
    </section>
  );
}
