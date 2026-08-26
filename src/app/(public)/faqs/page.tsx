import Link from "next/link";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { LEGAL_LINKS } from "@/lib/legal/constants";

const faqs = [
  {
    q: "What is Sanative?",
    a: "Sanative is a doctor-led metabolic and general health program in Australia. We combine clinical assessment, telehealth consultations, biomarker-guided monitoring where appropriate, and ongoing care coordination.",
  },
  {
    q: "Is Sanative an emergency service?",
    a: "No. If you have a medical emergency, call 000 immediately. Sanative is for scheduled clinical care and program support.",
  },
  {
    q: "Who provides clinical care?",
    a: "Clinical care is provided by AHPRA-registered Australian medical practitioners. Sanative coordinates the program; your doctor makes clinical decisions.",
  },
  {
    q: "What does the program fee cover?",
    a: "Program fees cover clinical assessment, consultations, care coordination, portal access, and monitoring as described in your plan. Some care options may involve separate costs, discussed with your doctor if clinically appropriate.",
  },
  {
    q: "Can I get a refund?",
    a: "If your doctor determines the program is not clinically suitable after your initial consultation, your first-month fee is refunded in accordance with our Refund Policy.",
  },
  {
    q: "How do I cancel?",
    a: "You can cancel anytime through your patient portal or by emailing support. See our Subscription Terms for billing details.",
  },
  {
    q: "Is my information private?",
    a: "Yes. We handle health information in accordance with Australian privacy law. See our Privacy Policy for details.",
  },
  {
    q: "Will I receive SMS or email?",
    a: "Yes, service-related messages about bookings, your program, and billing. Marketing is optional. Reply STOP to opt out of SMS where supported.",
  },
];

export const metadata = {
  title: "FAQs | Sanative",
};

export default function FaqsPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#fdfbf7]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628] mb-4">
            Frequently asked questions
          </h1>
          <p className="text-[#5c7a52] mb-10">
            General information about Sanative programs. Treatment options are discussed privately with
            your doctor if clinically appropriate.
          </p>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="bg-white rounded-2xl border border-[#e6ebe3] p-5"
              >
                <h2 className="font-semibold text-[#2c3628] mb-2">{faq.q}</h2>
                <p className="text-sm text-[#5c7a52] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap gap-4 text-sm">
            <Link href={LEGAL_LINKS.refundPolicy} className="text-[#5c7a52] underline">
              Refund Policy
            </Link>
            <Link href={LEGAL_LINKS.privacy} className="text-[#5c7a52] underline">
              Privacy Policy
            </Link>
            <Link href={LEGAL_LINKS.contact} className="text-[#5c7a52] underline">
              Contact us
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
