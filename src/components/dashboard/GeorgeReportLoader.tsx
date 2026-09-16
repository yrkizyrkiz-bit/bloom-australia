"use client";

import { useEffect, useId, useMemo, useState } from "react";
import "./george-report-loader.css";

export type GeorgeReportLoaderStage =
  | "collecting"
  | "analysing"
  | "synthesising"
  | "finalising";

type GeorgeReportLoaderProps = {
  active?: boolean;
  stage?: GeorgeReportLoaderStage;
  complete?: boolean;
  assetBase?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  timingNote?: string;
  className?: string;
};

const FRAME_COUNT = 4;
const LOOP_MS = 12000;

const STAGE_COPY: Record<GeorgeReportLoaderStage, { label: string; frame: number }> = {
  collecting: { label: "Gathering your health information", frame: 0 },
  analysing: { label: "Analysing your biomarkers", frame: 1 },
  synthesising: { label: "Bringing your results together", frame: 2 },
  finalising: { label: "Preparing your personalised report", frame: 3 },
};

const AUTO_MESSAGES = [
  "Gathering your health information",
  "Analysing your biomarkers",
  "Bringing your results together",
  "Preparing your personalised report",
];

export function preloadGeorgeLoaderFrames(assetBase = "/sanative-report-loader") {
  if (typeof document === "undefined") return;
  for (let index = 1; index <= FRAME_COUNT; index += 1) {
    const href = `${assetBase}/george-frame-${index}.webp`;
    if (document.querySelector(`link[rel="preload"][href="${href}"]`)) continue;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = href;
    document.head.appendChild(link);
  }
}

export function GeorgeReportLoader({
  active = true,
  stage,
  complete = false,
  assetBase = "/sanative-report-loader",
  eyebrow = "Doctor-Assisted AI-Powered Report",
  title = "George is cooking your insights…",
  description = "A blended, doctor-led model using AI technology that brings together your biomarkers, health history, previous results and questionnaire answers to prepare your personalised health report.",
  timingNote = "This usually takes 1–2 minutes",
  className = "",
}: GeorgeReportLoaderProps) {
  const titleId = useId();
  const descriptionId = useId();
  const [messageIndex, setMessageIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const controlledStage = stage ? STAGE_COPY[stage] : null;
  const autoCycle = active && !complete && !controlledStage && !reduceMotion;

  useEffect(() => {
    preloadGeorgeLoaderFrames(assetBase);
  }, [assetBase]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!autoCycle) return;
    const id = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % AUTO_MESSAGES.length);
    }, LOOP_MS / FRAME_COUNT);
    return () => window.clearInterval(id);
  }, [autoCycle]);

  const visibleFrame = complete ? 3 : controlledStage ? controlledStage.frame : 0;

  const currentMessage = complete
    ? "Your report is ready"
    : controlledStage
      ? controlledStage.label
      : AUTO_MESSAGES[messageIndex];

  const frames = useMemo(
    () =>
      Array.from(
        { length: FRAME_COUNT },
        (_, index) => `${assetBase}/george-frame-${index + 1}.webp`
      ),
    [assetBase]
  );

  if (!active) return null;

  return (
    <section
      className={`george-loader ${complete ? "is-complete" : ""} ${className}`.trim()}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className="george-loader__glow" aria-hidden="true" />

      <div
        className={`george-loader__art ${autoCycle ? "is-auto" : ""}`.trim()}
        aria-hidden="true"
      >
        <div className="george-loader__art-motion">
          {frames.map((src, index) => (
            <img
              key={src}
              src={src}
              className={`george-loader__frame ${!autoCycle && index === visibleFrame ? "is-visible" : ""}`}
              alt=""
              draggable={false}
              decoding="async"
              fetchPriority={index < 2 ? "high" : "low"}
            />
          ))}
          {autoCycle && (
            <div className="george-loader__fx">
              <span className="george-loader__steam" />
              <span className="george-loader__spark" />
              <span className="george-loader__spark" />
              <span className="george-loader__spark" />
            </div>
          )}
        </div>
      </div>

      <div className="george-loader__content">
        <p className="george-loader__eyebrow">{eyebrow}</p>

        <h2 id={titleId} className="george-loader__title">
          {complete ? "Your report is ready" : title}
        </h2>

        <p id={descriptionId} className="george-loader__description">
          {complete
            ? "We’ve finished bringing your health information together."
            : description}
        </p>

        <div className="george-loader__status" role="status" aria-live="polite">
          <span className="george-loader__status-dot" aria-hidden="true" />
          <span key={currentMessage} className="george-loader__status-text">
            {currentMessage}
          </span>
        </div>

        {!complete && (
          <>
            <div className="george-loader__progress" aria-label="Report preparation in progress">
              <span className="george-loader__progress-bar" />
            </div>
            <p className="george-loader__timing">{timingNote}</p>
          </>
        )}

        <p className="george-loader__privacy">
          Keep this screen open while your report is being prepared.
        </p>
      </div>
    </section>
  );
}
