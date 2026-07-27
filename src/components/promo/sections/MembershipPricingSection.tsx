import Link from "next/link";
import { getSanativeMembershipPricing } from "@/lib/portal/sanative-membership";

const FEATURES = [
  "Analysis of 70+ biomarkers annually",
  "Essential panel with Biological Clock & Organ Care",
  "Insights from AHPRA-registered doctors",
  "All-in-one for your whole body",
  "Tracked in one secure place",
  "Clinicians review every result and flag issues",
  "Personalised health action plan",
  "Organ Care dashboards in your portal",
  "Free first month for other Sanative programs",
];

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden
    >
      <circle cx="9" cy="9" r="7.65" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.6 9.2 7.7 11.3 12.4 6.6"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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

        {/* White box split into two vertical sections */}
        <div className="grid lg:grid-cols-2 rounded-3xl border border-[#e6ebe3] bg-white shadow-2xl overflow-hidden">
          {/* Left section */}
          <div className="flex flex-col justify-between gap-10 p-8 sm:p-10 lg:p-12 lg:border-r border-[#e6ebe3]">
            <div>
              <div className="flex items-center gap-2 text-[#c17a58]">
                <CheckCircleIcon className="flex-shrink-0" />
                <span className="text-sm font-semibold">Doctor-reviewed care</span>
              </div>
              <h3 className="mt-5 font-serif text-3xl sm:text-[2.5rem] text-[#2c3628] leading-tight tracking-tight">
                Sanative Membership
              </h3>
              <p className="mt-2 text-sm text-[#7e9a72]">
                Includes your comprehensive Essential biomarker panel
              </p>
            </div>

            <div>
              <div className="flex items-baseline gap-1">
                <span className="font-serif text-6xl sm:text-7xl tracking-tight text-[#2c3628] tabular-nums leading-none">
                  $1
                </span>
                <span className="text-lg sm:text-xl text-[#2c3628]">/day</span>
              </div>
              <p className="mt-2 text-sm text-[#7e9a72]">
                Charged annually at ${annualPrice}
              </p>

              <Link
                href="/membership/checkout"
                className="mt-8 flex w-full items-center justify-center rounded-full bg-[#c17a58] px-8 py-3.5 text-base font-medium text-white transition-colors hover:bg-[#a96848] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c17a58] focus-visible:ring-offset-2"
              >
                Join Sanative
              </Link>
            </div>
          </div>

          {/* Right section — offers */}
          <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-12 border-t border-[#e6ebe3] lg:border-t-0">
              <ul className="space-y-7">
                {FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-[#2c3628]">
                  <CheckCircleIcon className="mt-0.5 flex-shrink-0 text-[#c17a58]" />
                  <span className="text-[15px] sm:text-base leading-snug">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
