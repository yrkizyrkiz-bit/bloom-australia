import { ShieldCheck } from "lucide-react";
import Image from "next/image";

import { CtaLink } from "./cta-link";
import { HOW_IT_WORKS_STEPS, lpImages, OFFER, PRICING } from "@/lib/lp/weight-management";

export function ValueSection() {
  return (
    <section className="bg-forest-gradient text-forest-foreground">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 lg:py-28">
        <div className="grid items-stretch gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] bg-card p-8 text-card-foreground shadow-glass">
            <p className="text-[clamp(1.25rem,2.8vw,1.75rem)] font-semibold uppercase tracking-[0.12em] text-sage-deep">
              How it works
            </p>
            <h3 className="mt-3 whitespace-nowrap text-[clamp(1.05rem,5.1vw,1.875rem)] font-semibold leading-none tracking-tight">
              4 easy steps to{" "}
              <em className="font-serif font-medium italic text-sage-deep">get started</em>
            </h3>

            <ol className="wm-steps mt-8 space-y-5">
              {HOW_IT_WORKS_STEPS.map((step, i) => (
                <li key={step.title} className="flex items-start gap-3">
                  <span className="wm-steps__marker mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-highlight text-xs font-semibold text-forest">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold">{step.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <CtaLink className="mt-8 w-full" location="pricing">
              Let's get you started
            </CtaLink>
            <div className="mt-5 flex items-start gap-1.5 rounded-2xl border border-border bg-muted p-4 text-sm leading-snug text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-sage-deep" />
              <p>
                Join with confidence, your ${PRICING.assessmentFee} consultation fee is redeemable
                off your first month, or it&apos;s fully refundable if you don&apos;t qualify for
                the program.
              </p>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Offer ends {OFFER.endsLabel}. T&Cs apply.
            </p>
          </div>

          <div className="relative min-h-[28rem] overflow-hidden rounded-[2rem] shadow-glass">
            <Image
              src={lpImages.doctorScreens}
              alt="Australian doctor with Sanative app screens showing messages, progress and consultations"
              fill
              className="object-cover object-center"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
