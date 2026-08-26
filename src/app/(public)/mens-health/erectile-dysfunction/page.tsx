"use client";

import { Header } from "@/components/promo/Header";
import { Footer } from "@/components/promo/Footer";
import { ErectileDysfunctionContent } from "@/components/promo/mens-health/ErectileDysfunctionContent";

export default function ErectileDysfunctionPage() {
  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      <Header />
      <main>
        <ErectileDysfunctionContent />
      </main>
      <Footer />
    </div>
  );
}
