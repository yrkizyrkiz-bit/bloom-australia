import Link from "next/link";
import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";

export const metadata = {
  title: "Pricing | Sanative",
};

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#fdfbf7]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 text-center">
          <h1 className="text-3xl sm:text-4xl font-serif text-[#2c3628] mb-4">Program pricing</h1>
          <p className="text-[#5c7a52] mb-8 leading-relaxed">
            Sanative Weight Management starts from $249 for your first month. Program fees cover
            clinical assessment, care coordination, and portal access — not medicine bundles.
          </p>
          <Link
            href="/weight-management#pricing"
            className="inline-flex items-center justify-center px-8 py-4 bg-[#5c7a52] text-white font-semibold rounded-full hover:bg-[#4a6343] transition-colors"
          >
            View Weight Management plans
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
