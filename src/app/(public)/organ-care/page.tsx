import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { ArrowRight, Heart, Droplets } from "lucide-react";

export const metadata: Metadata = {
  title: "Organ Care | Heart, Liver & Kidney | Sanative",
  description:
    "Doctor-reviewed organ care for heart, liver and kidney. Essential panel markers your Sanative doctor reviews in context.",
};

function LiverIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 12c0-4.5 3-7.5 7.5-7.5 3 0 5.5 1.5 7 4 1 1.5 1.5 3 1.5 4.5 0 3-2 5.5-5 6.5-1.5.5-3 .5-4.5 0-2-.5-3.5-2-4.5-4-.5-1-1-2.5-1-3.5z"/>
      <path d="M12 4.5c-1.5 2-2.5 4.5-2.5 7.5s1 5.5 2.5 7.5"/>
      <path d="M8 8c1.5 1 3.5 2 6 2"/>
    </svg>
  );
}

const organs = [
  {
    id: "heart",
    title: "Heart",
    subtitle: "Cardiovascular health",
    description:
      "Doctor-reviewed lipids, inflammation and metabolic markers that inform the conversation about cardiovascular risk.",
    href: "/metabolic-care/heart-health",
    icon: Heart,
    color: "from-rose-500 to-rose-700",
  },
  {
    id: "liver",
    title: "Liver",
    subtitle: "Fatty liver / MASLD",
    description:
      "Liver enzymes and metabolic markers your doctor can use to review fatty liver risk and what may be contributing.",
    href: "/metabolic-care/fatty-liver",
    icon: LiverIcon,
    color: "from-[#c17a58] to-[#a9634a]",
  },
  {
    id: "kidney",
    title: "Kidney",
    subtitle: "Renal health",
    description:
      "Kidney filtration, electrolytes and urine ACR, early markers your doctor can review before symptoms are obvious.",
    href: "/metabolic-care/kidney-health",
    icon: Droplets,
    color: "from-teal-500 to-teal-700",
  },
];

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
                Heart, liver and kidney markers sit on your Essential panel. Your doctor reviews them in context, not as a diagnosis from a shopping list.
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-6">
              {organs.map((organ) => (
                <Link
                  key={organ.id}
                  href={organ.href}
                  className="group relative rounded-3xl overflow-hidden border border-[#e6ebe3] bg-white hover:border-[#5c7a52] hover:shadow-xl transition-all"
                >
                  <div className={`p-6 bg-gradient-to-r ${organ.color}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                        <organ.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-serif text-white">{organ.title}</h2>
                        <p className="text-sm text-white/70">{organ.subtitle}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-[#5c7a52] leading-relaxed mb-6">{organ.description}</p>
                    <span className="inline-flex items-center gap-2 text-[#5c7a52] font-medium group-hover:text-[#34412f]">
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
