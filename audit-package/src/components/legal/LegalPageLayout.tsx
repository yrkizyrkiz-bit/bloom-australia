import Link from "next/link";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { LEGAL_LINKS, SANATIVE_LEGAL } from "@/lib/legal/constants";

const relatedLinks = [
  { href: LEGAL_LINKS.privacy, label: "Privacy Policy" },
  { href: LEGAL_LINKS.terms, label: "Terms & Conditions" },
  { href: LEGAL_LINKS.medicalDisclaimer, label: "Medical Disclaimer" },
  { href: LEGAL_LINKS.telehealthConsent, label: "Telehealth Consent" },
  { href: LEGAL_LINKS.refundPolicy, label: "Refund Policy" },
  { href: LEGAL_LINKS.subscriptionTerms, label: "Subscription Terms" },
  { href: LEGAL_LINKS.contact, label: "Contact" },
  { href: LEGAL_LINKS.faqs, label: "FAQs" },
];

export function LegalPageLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#fdfbf7]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <p className="text-sm text-[#7e9a72] mb-2">{SANATIVE_LEGAL.entityName}</p>
          <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628] mb-2">{title}</h1>
          <p className="text-sm text-[#7e9a72] mb-8">
            Effective date: {SANATIVE_LEGAL.effectiveDate} · Last updated: {SANATIVE_LEGAL.effectiveDate}
          </p>

          <div className="prose-legal space-y-6 text-[#34412f] text-sm leading-relaxed">
            {children}
          </div>

          <div className="mt-12 pt-8 border-t border-[#e6ebe3]">
            <p className="text-xs font-semibold text-[#7e9a72] uppercase tracking-wide mb-3">
              Related policies
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {relatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[#5c7a52] hover:text-[#34412f] underline underline-offset-2"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <p className="mt-8 text-xs text-[#7e9a72]">
            Questions?{" "}
            <a href={`mailto:${SANATIVE_LEGAL.supportEmail}`} className="underline">
              {SANATIVE_LEGAL.supportEmail}
            </a>
            {" · "}
            {SANATIVE_LEGAL.address}
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-[#2c3628] mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function LegalP({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

export function LegalUl({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-5 space-y-2">{children}</ul>;
}

export function LegalOl({ children }: { children: React.ReactNode }) {
  return <ol className="list-decimal pl-5 space-y-2">{children}</ol>;
}

export function LegalH3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-[#2c3628] mt-4 mb-2">{children}</h3>;
}
