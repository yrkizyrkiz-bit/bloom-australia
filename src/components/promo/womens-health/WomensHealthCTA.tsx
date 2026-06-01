import Link from "next/link";
import { ArrowRight, Phone, Calendar } from "lucide-react";

export function WomensHealthCTA() {
  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      {/* Background with feminine gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#c17a58] via-[#a86548] to-[#8b5040]" />

      {/* Decorative shapes */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#f8e1e1]/10 rounded-full blur-3xl" />

      {/* Pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Content */}
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white leading-tight">
          Ready to take control of your{" "}
          <span className="italic">health?</span>
        </h2>
        <p className="mt-6 text-lg lg:text-xl text-white/80 max-w-2xl mx-auto">
          Book a 30-minute consultation with one of our experienced women's health doctors. Get personalised care from the comfort of your home.
        </p>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/womens-health/assessment"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white hover:bg-[#fdf8f6] text-[#c17a58] rounded-full font-medium transition-all shadow-xl"
          >
            <Calendar className="w-5 h-5" />
            Book Your Consultation
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="tel:1300000000"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-all border border-white/20"
          >
            <Phone className="w-5 h-5" />
            Call 1300 000 000
          </a>
        </div>

        {/* Trust badges */}
        <div className="mt-12 flex flex-wrap justify-center gap-8 text-white/70 text-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            AHPRA registered doctors
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            100% confidential
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Prescriptions delivered
          </div>
        </div>
      </div>
    </section>
  );
}
