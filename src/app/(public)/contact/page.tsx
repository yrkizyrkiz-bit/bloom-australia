import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { ContactSupportSection } from "@/components/promo/contact/ContactSupportSection";
import { publicPageMeta } from "@/lib/seo/public-page-meta";


export const metadata = publicPageMeta.contact;

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#f4f7f2]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <p className="mb-12 max-w-2xl text-center text-[#5c7a52] leading-relaxed mx-auto">
            Whether you already have a Sanative membership or you are just looking
            around, we are here to help.
          </p>
          <ContactSupportSection />
        </div>
      </main>
      <Footer />
    </>
  );
}
