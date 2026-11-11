"use client";

import { BiomarkerHoneycomb } from "@/components/promo/BiomarkerHoneycomb";
import "@/components/promo/sage-atmosphere.css";

export function HoneycombVisual() {
  return (
    <div className="wm-included-honeycomb sage-atmosphere">
      <div className="sage-atmosphere__bg" aria-hidden />
      <div className="sage-atmosphere__glow" aria-hidden />
      <div className="sage-atmosphere__noise" aria-hidden />
      <div className="sage-atmosphere__inner wm-included-honeycomb__inner">
        <p className="wm-included-honeycomb__title">
          85+ biomarkers across
          <br />
          <em>vital health areas</em>
        </p>
        <p className="wm-included-honeycomb__lede">
          Select a category to explore the related biomarkers we track. Hover over any
          marker to learn what it measures.
        </p>
        <div className="wm-included-honeycomb__grid">
          <BiomarkerHoneycomb defaultCategory="heart" showCalculatedFooter={false} />
        </div>
      </div>
    </div>
  );
}
