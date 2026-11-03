import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { ContactSupportSection } from "@/components/promo/contact/ContactSupportSection";
import { publicPageMeta } from "@/lib/seo/public-page-meta";


export const metadata = publicPageMeta.contact;

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col bg-[#f4f7f2]">
        <div className="mx-auto w-full max-w-4xl flex-1 px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <p className="mb-12 max-w-2xl text-center text-[#5c7a52] leading-relaxed mx-auto">
            Whether you already have a Sanative membership or you are just looking
            around, we are here to help.
          </p>
          <ContactSupportSection />
        </div>
        <p className="mx-auto w-full max-w-4xl px-4 pb-6 text-center text-xs text-[#5c7a52] sm:px-6 lg:px-8">
          Sanative Health | Doctor-Led Health Checks, North Sydney
        </p>
      </main>
      <Footer />
    </>
  );
}
