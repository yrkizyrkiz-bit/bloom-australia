import { CtaLink } from "./cta-link";
import { PRICING } from "@/lib/lp/weight-management";

export function StickyCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 p-3 backdrop-blur-md md:hidden">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight">
            Start with only ${PRICING.assessmentFee}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            redeemable or refundable*
          </p>
        </div>
        <CtaLink size="default" className="h-11 px-5" location="sticky-mobile">
          Get started
        </CtaLink>
      </div>
    </div>
  );
}
