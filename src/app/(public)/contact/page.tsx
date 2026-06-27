import Link from "next/link";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { LEGAL_LINKS, SANATIVE_LEGAL } from "@/lib/legal/constants";
import { Mail, MapPin, Clock } from "lucide-react";

export const metadata = {
  title: "Contact | Sanative",
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#fdfbf7]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628] mb-4">Contact us</h1>
          <p className="text-[#5c7a52] mb-10 leading-relaxed">
            Our care team is here to help with program questions, bookings, billing, and technical
            support.
          </p>

          <div className="space-y-6">
            <div className="flex gap-4 p-5 bg-white rounded-2xl border border-[#e6ebe3]">
              <Mail className="w-5 h-5 text-[#5c7a52] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#2c3628] mb-1">Email</p>
                <a
                  href={`mailto:${SANATIVE_LEGAL.supportEmail}`}
                  className="text-[#5c7a52] underline underline-offset-2"
                >
                  {SANATIVE_LEGAL.supportEmail}
                </a>
                <p className="text-sm text-[#7e9a72] mt-2">
                  For privacy requests, use the same address with subject line &quot;Privacy request&quot;.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-5 bg-white rounded-2xl border border-[#e6ebe3]">
              <MapPin className="w-5 h-5 text-[#5c7a52] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#2c3628] mb-1">Postal address</p>
                <p className="text-[#5c7a52]">{SANATIVE_LEGAL.entityName}</p>
                <p className="text-[#5c7a52]">{SANATIVE_LEGAL.address}</p>
              </div>
            </div>

            <div className="flex gap-4 p-5 bg-white rounded-2xl border border-[#e6ebe3]">
              <Clock className="w-5 h-5 text-[#5c7a52] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-[#2c3628] mb-1">Response times</p>
                <p className="text-sm text-[#5c7a52] leading-relaxed">
                  We aim to respond to enquiries within 1–2 business days. For urgent clinical
                  concerns during an active program, contact your care team through the patient portal.
                  For emergencies, call <strong>000</strong>.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-10 text-sm text-[#7e9a72]">
            Before contacting us, you may find answers in our{" "}
            <Link href={LEGAL_LINKS.faqs} className="underline text-[#5c7a52]">
              FAQs
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
