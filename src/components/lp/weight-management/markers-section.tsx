import Image from "next/image";
import {
  Activity,
  Droplet,
  Flame,
  FlaskConical,
  Heart,
  ThermometerSun,
  TrendingUp,
  Zap,
} from "lucide-react";

import { lpImages } from "@/lib/lp/weight-management";

const markers = [
  { icon: Droplet, title: "Blood sugar & metabolic health", detail: "HbA1c, fasting glucose, insulin markers" },
  { icon: Heart, title: "Cholesterol & heart risk", detail: "Total cholesterol, LDL, HDL, triglycerides" },
  { icon: FlaskConical, title: "Liver function", detail: "ALT, AST, GGT, bilirubin" },
  { icon: Zap, title: "Kidney function", detail: "Creatinine, eGFR, urea" },
  { icon: ThermometerSun, title: "Thyroid function", detail: "TSH, free T4, free T3" },
  { icon: Flame, title: "Inflammation & nutrition", detail: "Where clinically appropriate" },
  { icon: Activity, title: "Health Age score", detail: "Based on your metabolic health profile" },
  { icon: TrendingUp, title: "Progress over time", detail: "Track improvement across all markers" },
];

export function MarkersSection() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xl font-semibold uppercase tracking-widest text-sage-deep sm:text-2xl">
          More than weight loss
        </p>
        <h2 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
          A clearer picture of{" "}
          <em className="font-serif font-medium italic text-sage-deep">your health.</em>
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Other programs focus on how much you want to lose and how quickly. We track your organs
          and health markers and make sure the only thing you lose is weight.
        </p>
      </div>

      <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-8">
        <div className="relative h-full min-h-[22rem] overflow-hidden rounded-[2rem] bg-sage-soft shadow-soft">
          <Image
            src={lpImages.biomarkerTube}
            alt="Blood test tube surrounded by metabolic markers like HbA1c, insulin and triglycerides"
            fill
            className="object-cover object-center"
            sizes="(min-width: 1024px) 40vw, 100vw"
          />
        </div>

        <div className="wm-marker-grid">
          {markers.map(({ icon: Icon, title, detail }) => (
            <div key={title} className="wm-marker-card">
              <span className="wm-marker-card__icon" aria-hidden>
                <Icon />
              </span>
              <h3 className="wm-marker-card__title">{title}</h3>
              <p className="wm-marker-card__description">{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
