import Link from "next/link";
import {
  MEMBERSHIP_BENEFITS,
  MEMBERSHIP_PITCH,
} from "@/lib/membership/membership-benefits";
import marqueeStyles from "./MembershipPricingCard.module.css";

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

type MembershipMarqueeImage = {
  src: string;
  alt: string;
  fit?: "cover" | "contain";
};

type MembershipPricingCardProps = {
  annualPrice?: number;
  checkoutHref?: string;
  className?: string;
  /** Optional looping image strip in the left column, above $1/day. */
  imageMarquee?: readonly MembershipMarqueeImage[];
};

function ImageMarquee({ items }: { items: readonly MembershipMarqueeImage[] }) {
  const loop = [...items, ...items];
  return (
    <div className={`${marqueeStyles.viewport} ${marqueeStyles.viewportBlend} max-w-full`} aria-hidden>
      <div className={`${marqueeStyles.track} ${marqueeStyles.trackCompact}`}>
        {loop.map((item, index) => {
          const isContain = item.fit === "contain";
          return (
            // eslint-disable-next-line @next/next/no-img-element -- CSS marquee needs plain imgs
            <img
              key={`${item.src}-${index}`}
              src={item.src}
              alt=""
              width={720}
              height={405}
              decoding="async"
              loading={index < 3 ? "eager" : "lazy"}
              className={`h-24 w-40 sm:h-28 sm:w-48 shrink-0 rounded-xl bg-white ${
                isContain ? "object-contain p-0.5" : "object-cover"
              }`}
              draggable={false}
            />
          );
        })}
      </div>
    </div>
  );
}

/** Split membership offer card, matches the homepage MembershipPricingSection. */
export function MembershipPricingCard({
  annualPrice = 365,
  checkoutHref = "/membership/checkout",
  className = "",
  imageMarquee,
}: MembershipPricingCardProps) {
  return (
    <div
      className={`grid min-w-0 w-full lg:grid-cols-2 rounded-3xl border border-[#e6ebe3] bg-white shadow-2xl overflow-hidden ${className}`}
    >
      <div className="flex min-w-0 flex-col gap-5 sm:gap-6 p-5 sm:p-8 lg:p-9 lg:border-r border-[#e6ebe3]">
        <div>
          <div className="flex items-center gap-2 text-[#c17a58]">
            <CheckCircleIcon className="flex-shrink-0" />
            <span className="text-sm font-semibold">Doctor-reviewed care</span>
          </div>
          <h3 className="mt-3 font-serif text-2xl sm:text-3xl lg:text-[2.25rem] text-[#2c3628] leading-tight tracking-tight">
            Sanative Membership
          </h3>
          <p className="mt-1.5 text-sm sm:text-base font-semibold text-[#2c3628] leading-snug">
            {MEMBERSHIP_PITCH}
          </p>
        </div>

        <div>
          {imageMarquee && imageMarquee.length > 0 ? (
            <div className="mb-4 sm:mb-5">
              <ImageMarquee items={imageMarquee} />
            </div>
          ) : null}
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-5xl sm:text-6xl tracking-tight text-[#2c3628] tabular-nums leading-none">
              $1
            </span>
            <span className="text-base sm:text-lg text-[#2c3628]">/day</span>
          </div>
          <p className="mt-1.5 text-sm text-[#7e9a72]">
            ${annualPrice}/year
          </p>
          <p className="mt-1.5 text-sm font-medium text-[#2c3628]">
            Join with confidence · 100% refundable*
          </p>

          <Link
            href={checkoutHref}
            className="mt-5 flex w-full items-center justify-center rounded-full bg-[#c17a58] px-8 py-3 text-base font-medium text-white transition-colors hover:bg-[#a96848] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c17a58] focus-visible:ring-offset-2"
          >
            Join Sanative
          </Link>
        </div>
      </div>

      <div className="flex min-w-0 flex-col justify-center p-5 sm:p-8 lg:p-9 border-t border-[#e6ebe3] lg:border-t-0">
        <ul className="space-y-5 sm:space-y-6 lg:space-y-7">
          {MEMBERSHIP_BENEFITS.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-[#2c3628]">
              <CheckCircleIcon className="mt-0.5 flex-shrink-0 text-[#5c7a52] w-5 h-5" />
              <span className="text-base sm:text-lg leading-snug">{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
