import { getSanativeMembershipPricing } from "@/lib/portal/sanative-membership";
import { MembershipPricingCard } from "@/components/promo/sections/MembershipPricingCard";
import "./hims-gradient-background.css";

export async function MembershipPricingSection() {
  // Price comes from the admin-managed catalog (Products & Pricing).
  const pricing = await getSanativeMembershipPricing().catch(() => null);
  const annualPrice = pricing?.amountAud ?? 365;

  return (
    <section
      id="membership"
      className="hims-light-gradient-section py-20 lg:py-28 overflow-hidden scroll-mt-24"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10 lg:mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#34412f]/20 text-[#34412f] text-sm font-medium mb-6">
            Membership
          </span>
          <h2 className="section-title font-serif text-4xl sm:text-5xl lg:text-6xl leading-tight">
            One membership.{" "}
            <span className="text-[#5c7a52] italic">Full clarity.</span>
          </h2>
          <p className="section-description mt-4 max-w-xl mx-auto text-base sm:text-lg">
            Doctor-led biomarker testing and ongoing insights, less than a coffee a day.
          </p>
        </div>

        <MembershipPricingCard annualPrice={annualPrice} />
      </div>
    </section>
  );
}
