import type { ReactNode } from "react";

import { LpGenderProvider } from "@/components/lp/weight-management/gender-context";
import { buildPageMetadata } from "@/lib/seo/site";

import "./lp.css";

export const metadata = buildPageMetadata({
  title: "A new medical weight loss program | Sanative",
  description:
    "$49 clinical assessment with a Sanative doctor. Join a weight loss program before 31 December 2026 and get an 85+ biomarker insight health check included, valued at $365.",
  path: "/lp/weight-management",
});

export default function WeightManagementLpLayout({ children }: { children: ReactNode }) {
  return (
    <LpGenderProvider>
      <div className="wm-lp min-h-screen">{children}</div>
    </LpGenderProvider>
  );
}
