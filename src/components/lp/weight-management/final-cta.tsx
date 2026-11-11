"use client";

import { HeartHandshake, Lock, Sparkles, Stethoscope } from "lucide-react";
import Image from "next/image";

import { useLpGender } from "./gender-context";
import { lpImages } from "@/lib/lp/weight-management";

const pillars = [
  { icon: Lock, title: "Secure & confidential", body: "Your health data is encrypted and protected" },
  { icon: Stethoscope, title: "Australian clinicians", body: "AHPRA-registered doctors based in Australia" },
  { icon: HeartHandshake, title: "Ongoing support", body: "Continuous care throughout your journey" },
  { icon: Sparkles, title: "Personalised care", body: "Plans tailored to your unique biology" },
];

export function FinalCta() {
  const { gender } = useLpGender();
  const isMale = gender === "men";

  return (
    <section className="mx-auto max-w-7xl px-5 pb-10 pt-10 md:px-8 lg:pb-14 lg:pt-14">
      <h2 className="mb-6 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl lg:mb-8">
        We&apos;re behind you
        <br />
        <span className="hidden lg:inline invisible select-none" aria-hidden>
          We&apos;re{" "}
        </span>
        <em className="font-serif font-medium italic text-sage-deep">all the way.</em>
      </h2>
      <div className="relative overflow-hidden rounded-[2.5rem] text-forest-foreground shadow-soft">
        <Image
          key={isMale ? lpImages.ctaHeroMale : lpImages.ctaHero}
          src={isMale ? lpImages.ctaHeroMale : lpImages.ctaHero}
          alt={
            isMale
              ? "Sanative member walking outdoors, we're behind you all the way"
              : "Sanative member walking outdoors"
          }
          className="absolute inset-0 h-full w-full object-cover"
          width={isMale ? 1672 : 1024}
          height={isMale ? 941 : 576}
        />
        <div className="absolute inset-0 bg-fade" />
        <div className="absolute inset-0 bg-forest/40" />

        <div className="relative flex min-h-[34rem] flex-col px-6 pb-6 pt-6 sm:min-h-0 sm:px-12 sm:py-16 lg:px-12 lg:py-24">
          <div className="mt-auto grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {pillars.map(({ icon: Icon, title, body }, index) => (
              <div
                key={title}
                className={`glass-panel rounded-2xl p-4 sm:p-5${index >= 2 ? " hidden lg:block" : ""}`}
              >
                <Icon className="h-5 w-5 text-highlight" />
                <p className="mt-3 font-semibold">{title}</p>
                <p className="mt-1 text-sm text-forest-foreground/80">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
