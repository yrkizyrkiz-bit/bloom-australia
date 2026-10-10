import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Organ Care | Heart, Liver & Kidney | Sanative",
  description:
    "Doctor-reviewed organ care for heart, liver and kidney. Essential panel markers your Sanative doctor reviews in context.",
};

const organs = [
  {
    id: "heart",
    title: "Heart",
    subtitle: "Cardiovascular health",
    description:
      "Doctor-reviewed lipids, inflammation and metabolic markers that inform the conversation about cardiovascular risk.",
    href: "/metabolic-care/heart-health",
    image: "/images/organ-care/heart.webp",
    imageAlt: "Doctor reviewing heart health insights",
    /** Matches /metabolic-care/heart-health rose palette */
    theme: {
      cardHover:
        "hover:border-rose-300 hover:shadow-rose-100/80 hover:bg-gradient-to-b hover:from-rose-50/80 hover:to-white",
      imageWash: "bg-gradient-to-br from-rose-50 via-white to-orange-50/40",
      border: "border-rose-100",
      title: "group-hover:text-rose-700",
      subtitle: "text-rose-600",
      body: "text-rose-900/55 group-hover:text-rose-900/70",
      cta: "text-rose-700 group-hover:text-rose-800",
      bar: "bg-gradient-to-r from-rose-500 to-rose-700",
    },
  },
  {
    id: "liver",
    title: "Liver",
    subtitle: "Fatty liver / MASLD",
    description:
      "Liver enzymes and metabolic markers your doctor can use to review fatty liver risk and what may be contributing.",
    href: "/metabolic-care/fatty-liver",
    image: "/images/organ-care/liver.webp",
    imageAlt: "Clinicians examining liver health markers",
    /** Matches /metabolic-care/fatty-liver sage + terracotta */
    theme: {
      cardHover:
        "hover:border-[#a8bb9e] hover:shadow-[#e6ebe3]/90 hover:bg-gradient-to-b hover:from-[#f4f7f2] hover:to-white",
      imageWash: "bg-gradient-to-br from-[#f4f7f2] via-white to-[#e6ebe3]/50",
      border: "border-[#e6ebe3]",
      title: "group-hover:text-[#34412f]",
      subtitle: "text-[#c17a58]",
      body: "text-[#5c7a52] group-hover:text-[#34412f]/80",
      cta: "text-[#5c7a52] group-hover:text-[#c17a58]",
      bar: "bg-gradient-to-r from-[#c17a58] to-[#5c7a52]",
    },
  },
  {
    id: "kidney",
    title: "Kidney",
    subtitle: "Renal health",
    description:
      "Kidney filtration, electrolytes and urine ACR, early markers your doctor can review before symptoms are obvious.",
    href: "/metabolic-care/kidney-health",
    image: "/images/organ-care/kidney.webp",
    imageAlt: "Doctor reviewing kidney health insights",
    /** Matches /metabolic-care/kidney-health teal palette */
    theme: {
      cardHover:
        "hover:border-teal-300 hover:shadow-teal-100/80 hover:bg-gradient-to-b hover:from-teal-50/80 hover:to-white",
      imageWash: "bg-gradient-to-br from-teal-50 via-white to-cyan-50/50",
      border: "border-teal-100",
      title: "group-hover:text-teal-800",
      subtitle: "text-teal-600",
      body: "text-teal-900/55 group-hover:text-teal-900/70",
      cta: "text-teal-700 group-hover:text-teal-800",
      bar: "bg-gradient-to-r from-teal-500 to-cyan-600",
    },
  },
] as const;

export default function OrganCarePage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#fdfbf7]">
        <section className="relative py-16 lg:py-24 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#34412f] via-[#3d4f38] to-[#2c3628]" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6 text-sm font-medium text-[#a8bb9e]">
                Organ Care
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-white leading-tight mb-6">
                Three organs.{" "}
                <span className="text-[#a8bb9e] italic">One doctor-reviewed picture.</span>
              </h1>
              <p className="text-lg text-[#a8bb9e] leading-relaxed">
                Heart, liver and kidney markers insights decoded. Your doctor reviews them in
                context, not as a diagnosis from a shopping list.
              </p>
            </div>
          </div>
        </section>

        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {organs.map((organ) => (
                <Link
                  key={organ.id}
                  href={organ.href}
                  className={`group flex flex-col rounded-3xl overflow-hidden border bg-white shadow-sm transition-all duration-300 ${organ.theme.border} ${organ.theme.cardHover}`}
                >
                  <div className={`h-1.5 w-full ${organ.theme.bar}`} aria-hidden />
                  <div
                    className={`relative aspect-[16/10] overflow-hidden ${organ.theme.imageWash}`}
                  >
                    <Image
                      src={organ.image}
                      alt={organ.imageAlt}
                      fill
                      sizes="(min-width: 1024px) 30vw, (min-width: 768px) 45vw, 100vw"
                      className="object-contain object-center p-3 sm:p-4 transition-transform duration-500 group-hover:scale-[1.03]"
                      style={{
                        WebkitMaskImage:
                          "linear-gradient(to right, transparent 0%, black 16%, black 84%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
                        maskImage:
                          "linear-gradient(to right, transparent 0%, black 16%, black 84%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)",
                        WebkitMaskComposite: "source-in",
                        maskComposite: "intersect",
                      }}
                    />
                  </div>
                  <div className={`flex flex-1 flex-col p-5 sm:p-6 border-t ${organ.theme.border}`}>
                    <h2
                      className={`text-xl sm:text-2xl font-serif text-[#2c3628] transition-colors ${organ.theme.title}`}
                    >
                      {organ.title}
                    </h2>
                    <p className={`mt-1 text-sm font-medium ${organ.theme.subtitle}`}>
                      {organ.subtitle}
                    </p>
                    <p
                      className={`mt-3 leading-relaxed flex-1 transition-colors ${organ.theme.body}`}
                    >
                      {organ.description}
                    </p>
                    <span
                      className={`mt-5 inline-flex items-center gap-2 font-medium transition-colors ${organ.theme.cta}`}
                    >
                      Learn more
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
