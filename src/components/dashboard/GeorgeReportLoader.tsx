"use client";

import { useEffect, useId, useRef, useState } from "react";
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

const MESSAGE_MS = 3000;

const STAGE_COPY: Record<GeorgeReportLoaderStage, string> = {
  collecting: "Gathering your health information",
  analysing: "Analysing your biomarkers",
  synthesising: "Bringing your results together",
  finalising: "Preparing your personalised report",
};

const AUTO_MESSAGES = [
  "Gathering your health information",
  "Analysing your biomarkers",
  "Bringing your results together",
  "Preparing your personalised report",
];

export function preloadGeorgeLoaderFrames(assetBase = "/sanative-report-loader") {
  if (typeof document === "undefined") return;
  const href = `${assetBase}/george-cooking.mp4`;
  if (document.querySelector(`link[rel="preload"][href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "video";
  link.href = href;
  link.type = "video/mp4";
  document.head.appendChild(link);
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [messageIndex, setMessageIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const videoSrc = `${assetBase}/george-cooking.mp4`;
  const posterSrc = `${assetBase}/george-loader-poster.webp`;
  const shouldPlay = active && !complete && !reduceMotion;

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
    if (!shouldPlay) return;
    const id = window.setInterval(() => {
      setMessageIndex((current) => (current + 1) % AUTO_MESSAGES.length);
    }, MESSAGE_MS);
    return () => window.clearInterval(id);
  }, [shouldPlay]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (shouldPlay) {
      video.currentTime = 0;
      void video.play().catch(() => {});
      return;
    }
    video.pause();
  }, [shouldPlay]);

  const currentMessage = complete
    ? "Your report is ready"
    : stage
      ? STAGE_COPY[stage]
      : AUTO_MESSAGES[messageIndex];

  if (!active) return null;

  return (
    <section
      className={`george-loader ${complete ? "is-complete" : ""} ${className}`.trim()}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className="george-loader__glow" aria-hidden="true" />

      <div className="george-loader__art" aria-hidden="true">
        {reduceMotion ? (
          <img
            src={posterSrc}
            className="george-loader__video"
            alt=""
            draggable={false}
          />
        ) : (
          <video
            ref={videoRef}
            className="george-loader__video"
            src={videoSrc}
            poster={posterSrc}
            muted
            loop
            playsInline
            preload="auto"
            autoPlay={shouldPlay}
          />
        )}
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
