import { getSanativeMembershipPricing } from "@/lib/portal/sanative-membership";
import { MembershipPricingCard } from "@/components/promo/sections/MembershipPricingCard";

export async function MembershipPricingSection() {
  // Price comes from the admin-managed catalog (Products & Pricing).
  const pricing = await getSanativeMembershipPricing().catch(() => null);
  const annualPrice = pricing?.amountAud ?? 365;

  return (
    <section
      id="membership"
      className="py-20 lg:py-28 bg-gradient-to-br from-[#cdd8c6] to-[#a8bb9e] overflow-hidden scroll-mt-24"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 lg:mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#34412f]/20 text-[#34412f] text-sm font-medium mb-6">
            Membership
          </span>
          <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#2c3628] leading-tight">
            One membership.{" "}
            <span className="text-[#5c7a52] italic">Full clarity.</span>
          </h2>
          <p className="mt-4 text-[#4a6243] max-w-xl mx-auto text-base sm:text-lg">
            Doctor-led biomarker testing and ongoing insights — less than a coffee a day.
          </p>
        </div>

        <MembershipPricingCard annualPrice={annualPrice} />
      </div>
    </section>
  );
}
