"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { FUNNEL_PATH, buildFunnelUrl, LP_FUNNEL_SOURCE } from "@/lib/lp/weight-management";
import { cn } from "@/lib/utils";

const DEFAULT_HREF = `${FUNNEL_PATH}?source=${LP_FUNNEL_SOURCE}`;

type CtaLinkProps = {
  children: ReactNode;
  variant?: "cta" | "cta-light";
  size?: "default" | "xl";
  className?: string;
  location: string;
  arrow?: boolean;
};

export function CtaLink({
  children,
  variant = "cta",
  size = "xl",
  className,
  location,
  arrow = true,
}: CtaLinkProps) {
  const [href, setHref] = useState(DEFAULT_HREF);

  useEffect(() => {
    setHref(buildFunnelUrl(window.location.search));
  }, []);

  return (
    <Link
      href={href}
      prefetch
      data-cta-location={location}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        size === "xl" ? "h-14 px-8 text-base" : "h-10 px-5 text-sm",
        variant === "cta"
          ? "rounded-full bg-primary text-primary-foreground shadow-soft hover:-translate-y-0.5 hover:bg-primary/90"
          : "rounded-full bg-card text-foreground shadow-glass hover:-translate-y-0.5 hover:bg-cream",
        className,
      )}
    >
      {children}
      {arrow && <ArrowRight />}
    </Link>
  );
}
