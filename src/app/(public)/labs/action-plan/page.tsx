"use client";

import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { ArrowRight } from "lucide-react";

type Step = {
  number: string;
  title: string;
  body: string;
  reverse: boolean;
  footnote?: string;
  image: { src: string; alt: string };
};

const steps: Step[] = [
  {
    number: "01",
    title: "Discover where your health needs attention",
    body: "Your lab results reveal where to focus, with risk assessment and detailed risk factors.",
    image: {
      src: "/images/membership/RIsk_factors.png",
      alt: "Sanative risk factors — discover where your health needs attention",
    },
    reverse: false,
  },
  {
    number: "02",
    title: "Set your health goals based on your health needs",
    body: "Reduce your risk through lifestyle changes and if eligible, access to treatment.",
    image: {
      src: "/images/membership/health_goals.png",
      alt: "Sanative Health Goals — set biomarker targets and track progress",
    },
    reverse: true,
  },
  {
    number: "03",
    title: "Medical treatment and ongoing care",
    body: "Sanative care team will review your results and goals, with medical treatment available if needed to achieve your health goals.",
    image: {
      src: "/images/membership/sanative-doctor-screens.png",
      alt: "Sanative doctor with personalised care insights and treatment guidance",
    },
    reverse: false,
  },
  {
    number: "04",
    title: "Monitor and track your health progress",
    body: "Track your progress between blood tests over time, measure your improvements, achieve your goals.",
    image: {
      src: "/images/membership/results_app.png",
      alt: "Sanative results app — monitor and track your health progress",
    },
    reverse: true,
  },
  {
    number: "05",
    title: "Sanative goes with you as you progress",
    body: "Improve and monitor your health to reach your goals.",
    image: {
      src: "/images/membership/Kidney_function.png",
      alt: "Sanative kidney function — monitor your health progress",
    },
    reverse: false,
  },
];

function CtaButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/biomarker-intake"
      className={`btn-primary inline-flex items-center justify-center gap-2 ${className}`}
    >
      Get started
      <ArrowRight className="w-4 h-4" />
    </Link>
  );
}

export default function LabsActionPlanPage() {
  return (
    <>
      <Header />
      <main className="overflow-hidden bg-[#fdfbf7]">
        {/* Hero header image — replaces headline/subcopy */}
        <section className="relative">
          <div className="relative w-full overflow-hidden bg-[#1a2218]">
            <Image
              src="/images/membership/Action_planPM.png"
              alt="Action Plan — Sanative health overview on the beach at sunset"
              width={1920}
              height={1080}
              priority
              className="h-auto w-full object-cover object-center -mt-44 sm:-mt-64"
              sizes="100vw"
            />
          </div>
          <div className="bg-[#fdfbf7] py-8 lg:py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-center">
              <CtaButton className="text-base px-8 py-3.5" />
            </div>
          </div>
        </section>

        {/* Numbered steps */}
        {steps.map((step, index) => (
          <section
            key={step.number}
            className={`py-16 lg:py-28 ${index % 2 === 0 ? "bg-[#fdfbf7]" : "bg-[#f4f7f2]"}`}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
                <div className={`max-w-md ${step.reverse ? "lg:order-2 lg:ml-auto" : ""}`}>
                  <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-serif text-[#2c3628] leading-[1.15]">
                    {step.title}
                  </h2>
                  <p className="mt-5 text-lg text-[#5c7a52] leading-relaxed">{step.body}</p>
                  {"footnote" in step && step.footnote && (
                    <p className="mt-3 text-xs text-[#7e9a72] leading-relaxed">{step.footnote}</p>
                  )}
                  <div className="mt-8">
                    <CtaButton />
                  </div>
                </div>
                <div className={`flex justify-center ${step.reverse ? "lg:order-1" : ""}`}>
                  <div className="relative w-full max-w-[340px] sm:max-w-[380px] overflow-hidden rounded-3xl shadow-lg shadow-[#1a2218]/10">
                    <Image
                      src={step.image.src}
                      alt={step.image.alt}
                      width={760}
                      height={1520}
                      className="h-auto w-full object-contain rounded-3xl"
                      sizes="(max-width: 640px) 340px, 380px"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        ))}

        <div className="bg-[#f4f7f2] py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="mb-3 text-[10px] leading-relaxed text-[#7e9a72]">
              * Images for illustrative purposes only
            </p>
            <nav className="text-sm text-[#5c7a52] flex flex-wrap items-center gap-2">
              <Link href="/" className="hover:text-[#2c3628]">
                Home
              </Link>
              <span>/</span>
              <Link href="/labs" className="hover:text-[#2c3628]">
                Labs
              </Link>
              <span>/</span>
              <span className="text-[#2c3628]">Action Plan</span>
            </nav>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
