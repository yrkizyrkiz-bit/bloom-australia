"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Pill, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUPPLEMENTS_CARD } from "@/lib/programs/catalog";

/** Placeholder categories — wire to Shopify / Snipcart / Medusa when ready. */
const COMING_SOON_CATEGORIES = [
  { name: "Vitamins & minerals", items: ["Vitamin D3", "B12", "Iron", "Magnesium"] },
  { name: "Program support", items: ["Hair growth", "Metabolic health", "Hormone balance"] },
  { name: "Daily essentials", items: ["Omega-3", "Probiotics", "Multivitamin"] },
];

export default function SupplementsPage() {
  const theme = SUPPLEMENTS_CARD.theme;
  const Icon = SUPPLEMENTS_CARD.icon;

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1 text-sm text-[#5c7a52] hover:text-[#34412f]"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </Link>

      <div
        className={`relative mb-10 overflow-hidden rounded-3xl bg-gradient-to-br ${theme.gradient} p-8 sm:p-10`}
      >
        {theme.badge && (
          <span
            className={`mb-4 inline-block rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${theme.badge.className}`}
          >
            {theme.badge.label}
          </span>
        )}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl text-[#2c3628] sm:text-4xl">
              Supplements &{" "}
              <span className="text-[#c17a58]">{SUPPLEMENTS_CARD.titleAccent}</span>
            </h1>
            <p className="mt-2 max-w-xl text-[#5c7a52]">{SUPPLEMENTS_CARD.tagline}</p>
          </div>
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${theme.iconCircle}`}>
            <Icon className={`h-7 w-7 ${theme.iconColor}`} />
          </div>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border border-[#e6ebe3] bg-[#f4f7f2] p-6">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#1D9E75]" />
          <div>
            <p className="font-medium text-[#34412f]">Member shop launching soon</p>
            <p className="mt-1 text-sm text-[#5c7a52]">
              We&apos;re preparing a curated supplement store matched to your programs and biomarkers.
              Checkout will integrate with a standard ecommerce platform — no custom build required.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        {COMING_SOON_CATEGORIES.map((category) => (
          <div
            key={category.name}
            className="rounded-2xl border border-[#e6ebe3] bg-white p-5 shadow-sm"
          >
            <h2 className="font-serif text-lg text-[#2c3628]">{category.name}</h2>
            <ul className="mt-3 space-y-2">
              {category.items.map((item) => (
                <li key={item} className="flex items-center justify-between text-sm text-[#5c7a52]">
                  <span>{item}</span>
                  <span className="rounded-full bg-[#e6ebe3] px-2 py-0.5 text-xs text-[#7e9a72]">
                    Soon
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <p className="mb-4 text-sm text-[#5c7a52]">
          Need something now? Your care team can recommend supplements during your program.
        </p>
        <Button asChild variant="outline" className="rounded-full border-[#e6ebe3]">
          <Link href="/dashboard/weight-management/support">
            Contact care team
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
