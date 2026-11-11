"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FAQ_ITEMS } from "@/lib/lp/weight-management";

export const faqs = FAQ_ITEMS.map((item) => ({
  q: item.question,
  a: item.answer,
}));

export function FaqSection() {
  return (
    <section className="bg-secondary">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 md:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:py-28">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-sage-deep">FAQs</p>
          <h2 className="mt-3 text-4xl font-semibold leading-tight sm:text-5xl">
            Doctor-led care.{" "}
            <em className="font-serif font-medium italic text-sage-deep">Your questions answered.</em>
          </h2>
        </div>
        <Accordion type="single" collapsible className="rounded-[2rem] bg-card px-6 shadow-soft sm:px-8">
          {faqs.map((f, i) => (
            <AccordionItem key={f.q} value={`faq-${i}`} className="last:border-0">
              <AccordionTrigger className="py-5 text-base font-semibold hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-base leading-relaxed text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
