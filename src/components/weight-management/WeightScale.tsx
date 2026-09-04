"use client";

import React, { useState } from "react";
import {
  formatWeightInput,
  isWeightInputDraft,
  parseWeightInput,
} from "@/lib/weight-management/weight-input";
import "./WeightScale.css";

export type WeightUnit = "kg";

export type WeightScaleProps = {
  /** Controlled value in kg. Omit to let the component manage its own value. */
  value?: number | null;
  /** Starting value for uncontrolled usage. */
  defaultValue?: number | null;
  /** Fires whenever the user edits the digital readout. Value is always kg. */
  onChange?: (value: number | null, unit: WeightUnit) => void;
  /** Optional save callback. If provided, a Save button is rendered. */
  onSave?: (value: number, unit: WeightUnit) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
  /** Adds a compact heading above the scale. */
  title?: string;
  /** Optional helper copy below the scale. */
  helperText?: string;
  className?: string;
};

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

export default function WeightScale({
  value,
  defaultValue = null,
  onChange,
  onSave,
  min = 30,
  max = 350,
  disabled = false,
  loading = false,
  error = null,
  title = "Log your weight",
  helperText = "Tap the number display and enter your current weight.",
  className = "",
}: WeightScaleProps) {
  const controlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<number | null>(defaultValue);
  const [draft, setDraft] = useState<string | null>(null);
  const unit: WeightUnit = "kg";

  const currentValue = controlled ? value ?? null : internalValue;
  const safeValue = Number.isFinite(currentValue as number) ? currentValue : null;
  const displayValue = draft ?? (loading ? "" : formatWeightInput(safeValue));

  function commit(next: number | null) {
    if (!controlled) setInternalValue(next);
    onChange?.(next, unit);
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (!isWeightInputDraft(raw)) return;
    setDraft(raw);
    commit(parseWeightInput(raw));
  }

  function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
    setDraft(formatWeightInput(safeValue));
    requestAnimationFrame(() => e.currentTarget.select());
  }

  function handleBlur() {
    if (safeValue != null) commit(round1(safeValue));
    setDraft(null);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  }

  const canSave =
    !disabled &&
    !loading &&
    !error &&
    safeValue != null &&
    safeValue >= min &&
    safeValue <= max;

  return (
    <section
      className={`sanative-weight-widget ${className}`}
      aria-label="Weight entry"
    >
      <div className="sanative-weight-widget__header">
        <div>
          <h3>{title}</h3>
          <p>{helperText}</p>
        </div>
      </div>

      <div
        className={[
          "sanative-scale",
          disabled ? "is-disabled" : "",
          loading ? "is-loading" : "",
          error ? "has-error" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <div className="sanative-scale__glass" aria-hidden="true" />
        <div className="sanative-scale__rim" aria-hidden="true" />

        <div className="sanative-scale__electrodes" aria-hidden="true">
          <span className="electrode electrode--left-top" />
          <span className="electrode electrode--left-bottom" />
          <span className="electrode electrode--right-top" />
          <span className="electrode electrode--right-bottom" />
        </div>

        <label className="sanative-display">
          <span className="sr-only">Current weight in {unit}</span>
          {loading ? (
            <span className="sanative-display__loading" aria-live="polite">
              <i />
              <i />
              <i />
            </span>
          ) : error ? (
            <span className="sanative-display__error" role="alert">
              Err
            </span>
          ) : (
            <input
              value={displayValue}
              onChange={handleInput}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              type="text"
              inputMode="decimal"
              enterKeyHint="done"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder="0.0"
              disabled={disabled}
              aria-invalid={Boolean(error)}
            />
          )}
          <span className="sanative-display__unit">{unit}</span>
        </label>

        <div className="sanative-scale__brand" aria-hidden="true">
          <svg viewBox="0 0 36 36" role="img">
            <path d="M30 6C18.3 6.5 10.2 12.2 7.4 20.8c-1.2 3.7-.4 7 1.6 9.2 1.6-6.9 6.8-12.5 15.5-17.1-7.1 5.2-11.4 10.5-13.4 16.2 3.1 1.1 6.8.5 9.7-1.8C28 21.7 28.2 12.6 30 6Z" />
          </svg>
          <span>SANATIVE</span>
        </div>
      </div>

      <div className="sanative-weight-widget__footer">
        {(error || (safeValue != null && (safeValue < min || safeValue > max))) && (
          <div className="sanative-weight-widget__status">
            {error ? (
              <span className="status-error">{error}</span>
            ) : (
              <span className="status-error">
                Enter a value between {min} and {max} {unit}.
              </span>
            )}
          </div>
        )}

        {onSave && (
          <button
            className="sanative-save-button"
            type="button"
            disabled={!canSave}
            onClick={() => safeValue != null && onSave(safeValue, unit)}
          >
            Save weight
          </button>
        )}
      </div>
    </section>
  );
}
