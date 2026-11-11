import { Suspense, type ReactNode } from "react";
import Link from "next/link";

import { LpWmFunnelClient } from "@/components/lp/weight-management/funnel/funnel-client";
import { getLpWmAvailability } from "@/lib/lp/availability";
import { PRICING } from "@/lib/lp/weight-management";
import { buildPageMetadata } from "@/lib/seo/site";

export const revalidate = 30;

export const metadata = buildPageMetadata({
  title: `Book a $${PRICING.assessmentFee} weight management assessment | Sanative`,
  description:
    "Book a phone consult with a Sanative doctor, pay $49, and tell us a little about your goals. No account is created at this step.",
  path: "/lp/weight-management/start",
  index: false,
});

function searchFromParams(params: Record<string, string | string[] | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) search.append(key, item);
    } else if (value) {
      search.set(key, value);
    }
  }
  return search.toString();
}

function FunnelShell({ children }: { children: ReactNode }) {
  return (
    <div className="lp-funnel-page min-h-screen bg-white">
      <link rel="preconnect" href="https://js.stripe.com" />
      <link rel="preconnect" href="https://api.stripe.com" />
      <header className="bg-[#04342C]">
        <div className="mx-auto flex h-[72px] max-w-5xl items-center justify-center px-6">
          <Link
            href="/lp/weight-management"
            className="font-serif text-[28px] leading-none tracking-tight text-white"
            aria-label="Sanative"
          >
            sanative
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-5 py-10 md:py-14">{children}</main>
    </div>
  );
}

async function FunnelWithTimes({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [slots, params] = await Promise.all([getLpWmAvailability(), searchParams]);
  return <LpWmFunnelClient initialSlots={slots} initialSearch={searchFromParams(params)} />;
}

export default function WeightManagementLpFunnelPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <FunnelShell>
      <Suspense fallback={<LpWmFunnelClient initialSlots={[]} />}>
        <FunnelWithTimes searchParams={searchParams} />
      </Suspense>
    </FunnelShell>
  );
}
