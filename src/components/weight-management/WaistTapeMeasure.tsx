"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import "./WaistTapeMeasure.css";

export type WaistUnit = "cm" | "in";

export type WaistTapeMeasureProps = {
  value?: number | null;
  defaultValue?: number | null;
  onChange?: (value: number | null, unit: WaistUnit) => void;
  onSave?: (value: number, unit: WaistUnit) => void | Promise<void>;
  unit?: WaistUnit;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  title?: string;
  helperText?: string;
  badge?: string | null;
  buttonLabel?: string;
  successText?: string;
  soundEnabled?: boolean;
  clickVolume?: number;
  className?: string;
};

const PIXELS_PER_STEP = 18;

let sharedTapeAudioContext: AudioContext | null = null;
let sharedClickBuffer: AudioBuffer | null = null;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundToStep(value: number, step: number) {
  const rounded = Math.round(value / step) * step;
  return Number(rounded.toFixed(1));
}

export default function WaistTapeMeasure({
  value,
  defaultValue = null,
  onChange,
  onSave,
  unit = "cm",
  min = unit === "cm" ? 50 : 20,
  max = unit === "cm" ? 200 : 80,
  step = unit === "cm" ? 0.5 : 0.25,
  disabled = false,
  loading = false,
  error = null,
  title = "Waist measurement",
  helperText = "Drag or slide the tape to log your waist measurement.",
  badge = null,
  buttonLabel = "Save waist",
  successText = "Measurement added",
  soundEnabled = true,
  clickVolume = 0.22,
  className = "",
}: WaistTapeMeasureProps) {
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<number | null>(defaultValue);
  const [viewportWidth, setViewportWidth] = useState(320);
  const [confirmed, setConfirmed] = useState(false);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ pointerId: number; x: number; value: number } | null>(null);
  const lastCommittedRef = useRef<number | null>(null);
  const soundEnabledRef = useRef(soundEnabled);
  const clickVolumeRef = useRef(clickVolume);

  soundEnabledRef.current = soundEnabled;
  clickVolumeRef.current = clickVolume;

  const currentValue = controlled ? value ?? null : internalValue;
  const startValue = currentValue ?? defaultValue ?? Math.round(((min + max) / 2) * 10) / 10;
  const safeValue = currentValue == null ? null : clamp(roundToStep(currentValue, step), min, max);
  const positionValue = safeValue ?? clamp(roundToStep(startValue, step), min, max);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setViewportWidth(entry.contentRect.width);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const ticks = useMemo(() => {
    const count = Math.round((max - min) / step) + 1;
    return Array.from({ length: count }, (_, index) => {
      const raw = Number((min + index * step).toFixed(2));
      const isWhole = Math.abs(raw - Math.round(raw)) < 0.001;
      return {
        value: raw,
        label: isWhole ? String(Math.round(raw)) : "",
        kind: isWhole ? "major" : "minor",
        left: index * PIXELS_PER_STEP,
      };
    });
  }, [min, max, step]);

  const currentIndex = Math.round((positionValue - min) / step);
  const trackWidth = Math.max(1, (ticks.length - 1) * PIXELS_PER_STEP);
  const trackTranslate = viewportWidth / 2 - currentIndex * PIXELS_PER_STEP;

  function getAudioContext() {
    if (typeof window === "undefined" || !soundEnabledRef.current) return null;
    const AudioCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return null;
    if (!sharedTapeAudioContext || sharedTapeAudioContext.state === "closed") {
      sharedTapeAudioContext = new AudioCtor();
      sharedClickBuffer = null;
    }
    return sharedTapeAudioContext;
  }

  function buildClickBuffer(ctx: AudioContext) {
    const duration = 0.05;
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const t = i / length;
      const env = Math.exp(-t * 20);
      const tone = Math.sin((i / ctx.sampleRate) * 2 * Math.PI * 1550);
      const noise = Math.random() * 2 - 1;
      data[i] = (tone * 0.7 + noise * 0.22) * env;
    }
    return buffer;
  }

  function fireClick(ctx: AudioContext) {
    if (!sharedClickBuffer) {
      sharedClickBuffer = buildClickBuffer(ctx);
    }
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = sharedClickBuffer;
    gain.gain.value = Math.min(1, Math.max(0.18, clickVolumeRef.current));
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(ctx.currentTime);
  }

  function unlockAudio() {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      void ctx.resume();
    }
    try {
      const silent = ctx.createBuffer(1, 1, ctx.sampleRate);
      const source = ctx.createBufferSource();
      const gain = ctx.createGain();
      gain.gain.value = 0.0001;
      source.buffer = silent;
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(ctx.currentTime);
    } catch {
      /* unlock best-effort */
    }
  }

  function playTick() {
    if (!soundEnabledRef.current) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    const play = () => {
      try {
        fireClick(ctx);
      } catch {
        /* ignore autoplay races */
      }
    };

    if (ctx.state === "suspended") {
      void ctx.resume().then(play);
      return;
    }
    play();
  }

  function commit(next: number | null) {
    const previous = lastCommittedRef.current ?? safeValue;
    if (!controlled) setInternalValue(next);
    setConfirmed(false);
    onChange?.(next, unit);
    lastCommittedRef.current = next;
    if (next != null && next !== previous) {
      playTick();
    }
  }

  function valueFromDrag(startX: number, clientX: number, anchorValue: number) {
    const delta = startX - clientX;
    const stepsMoved = Math.round(delta / PIXELS_PER_STEP);
    return clamp(roundToStep(anchorValue + stepsMoved * step, step), min, max);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled || loading) return;
    unlockAudio();
    const anchor = positionValue;
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, value: anchor };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId || disabled || loading) return;
    const next = valueFromDrag(drag.x, event.clientX, drag.value);
    if (next !== (lastCommittedRef.current ?? safeValue)) commit(next);
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function nudge(direction: -1 | 1) {
    if (disabled || loading) return;
    unlockAudio();
    const base = positionValue;
    const next = clamp(roundToStep(base + direction * step, step), min, max);
    if (next !== (lastCommittedRef.current ?? safeValue)) commit(next);
  }

  async function saveMeasurement() {
    if (disabled || loading || error || safeValue == null) return;
    unlockAudio();
    setConfirmed(true);
    await onSave?.(safeValue, unit);
  }

  const displayValue = safeValue == null ? "— — —" : safeValue.toFixed(1);

  return (
    <section className={`sanative-waist ${className}`.trim()} aria-label="Waist measurement">
      <div className="sanative-waist__header">
        <div>
          <div className="sanative-waist__title-row">
            <h3>{title}</h3>
            {badge ? <span className="sanative-waist__badge">{badge}</span> : null}
          </div>
          <p>{helperText}</p>
        </div>
      </div>

      <div className="sanative-waist__card">
        <div className="sanative-waist__card-shine" aria-hidden="true" />

        <div className="sanative-waist__display" aria-live="polite">
          <span className="value">{loading ? "…" : error ? "Err" : displayValue}</span>
          <span className="unit">{unit}</span>
        </div>

        <div className="sanative-waist__ruler-wrap">
          <div
            className={[
              "sanative-waist__viewport",
              disabled ? "is-disabled" : "",
              loading ? "is-loading" : "",
              error ? "has-error" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            ref={viewportRef}
            role="slider"
            tabIndex={disabled ? -1 : 0}
            aria-label="Waist measurement"
            aria-valuemin={min}
            aria-valuemax={max}
            aria-valuenow={safeValue ?? undefined}
            aria-valuetext={`${displayValue} ${unit}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onLostPointerCapture={handlePointerUp}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft") {
                event.preventDefault();
                nudge(-1);
              }
              if (event.key === "ArrowRight") {
                event.preventDefault();
                nudge(1);
              }
            }}
          >
            <div className="sanative-waist__center-marker" aria-hidden="true">
              <span className="pin" />
              <span className="line" />
            </div>

            <div
              className="sanative-waist__track"
              style={{ width: `${trackWidth}px`, transform: `translateX(${trackTranslate}px)` }}
              aria-hidden="true"
            >
              {ticks.map((tick) => (
                <span
                  key={tick.value}
                  className={`tick tick--${tick.kind}`}
                  style={{ left: `${tick.left}px` }}
                >
                  {tick.label ? <small>{tick.label}</small> : null}
                </span>
              ))}
            </div>
          </div>

          <div className="sanative-waist__nudges">
            <button
              type="button"
              className="sanative-waist__nudge sanative-waist__nudge--left"
              onPointerDown={unlockAudio}
              onClick={() => nudge(-1)}
              disabled={disabled || loading}
              aria-label={`Decrease waist by ${step} ${unit}`}
            >
              −
            </button>
            <button
              type="button"
              className="sanative-waist__nudge sanative-waist__nudge--right"
              onPointerDown={unlockAudio}
              onClick={() => nudge(1)}
              disabled={disabled || loading}
              aria-label={`Increase waist by ${step} ${unit}`}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div className="sanative-waist__footer">
        {(error || confirmed) && (
          <div className="sanative-waist__status" aria-live="polite">
            {error ? (
              <span className="error">{error}</span>
            ) : (
              <span className="success">✓ {successText}</span>
            )}
          </div>
        )}

        <button
          type="button"
          className="sanative-waist__save"
          disabled={disabled || loading || Boolean(error) || safeValue == null}
          onClick={saveMeasurement}
        >
          {buttonLabel}
        </button>
      </div>
    </section>
  );
}
