import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-b from-[#f4f7f2] via-[#fdfbf7] to-[#f8f4ec] py-12 lg:py-20 overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-[#cdd8c6] rounded-full blur-3xl opacity-40" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#e5d7bf] rounded-full blur-3xl opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-[#cdd8c6]/20 to-transparent rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif text-[#2c3628] leading-[1.05] tracking-tight">
              The care you&apos;ve{" "}
              <span className="text-gradient italic">always</span>
              <br className="hidden sm:block" />
              deserved
            </h1>
            <p className="mt-6 text-lg lg:text-xl text-[#5c7a52] max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Personalised healthcare designed for Australian women. Access doctor-led assessment, AHPRA-registered doctors, and comprehensive lab testing at centres near you.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/membership/checkout"
                className="btn-primary inline-flex items-center justify-center gap-2 text-base lg:text-lg px-8 py-4"
              >
                Start your journey
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/#how-it-works"
                className="btn-secondary inline-flex items-center justify-center text-base lg:text-lg px-8 py-4"
              >
                How it works
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="mt-10 flex flex-wrap justify-center lg:justify-start items-center gap-4 lg:gap-6 text-sm text-[#5c7a52]">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#7e9a72]" />
                <span>NATA-Accredited Lab Testing</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#7e9a72]" />
                <span>AHPRA Doctors</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#7e9a72]" />
                <span>Pharmacy dispensing when prescribed</span>
              </div>
            </div>
          </div>

          {/* Right - Image Grid */}
          <div className="relative hidden lg:block">
            <div className="grid grid-cols-2 gap-4">
              {/* Main large image */}
              <div className="col-span-2 relative h-64 rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="/images/remote/unsplash/photo-1573496359142-b8d87734a5a2.webp"
                  alt="Confident woman"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#34412f]/40 to-transparent" />
              </div>

              {/* Two smaller images */}
              <div className="relative h-48 rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/remote/unsplash/photo-1594824476967-48c8b964273f.webp"
                  alt="Woman wellness"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="relative h-48 rounded-2xl overflow-hidden shadow-xl">
                <Image
                  src="/images/remote/unsplash/photo-1571844307880-751c6d86f3f3.webp"
                  alt="Self care"
                  fill
                  className="object-cover"
                />
              </div>
            </div>

            {/* Floating care card */}
            <div className="absolute -left-8 top-1/2 -translate-y-1/2 bg-white rounded-2xl p-5 shadow-xl border border-[#e6ebe3] max-w-[200px]">
              <p className="text-sm text-[#5c7a52] leading-relaxed">Doctor-led assessment with care options discussed privately if clinically appropriate.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
