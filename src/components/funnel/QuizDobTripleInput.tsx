"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  isQuizDobDayComplete,
  isQuizDobMonthComplete,
  joinQuizDob,
  sanitizeQuizDobDay,
  sanitizeQuizDobMonth,
  sanitizeQuizDobYear,
  splitQuizDob,
  validateQuizDob,
} from "@/lib/funnel/quiz-dob";
import { cn } from "@/lib/utils";

type QuizDobTripleInputProps = {
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  className?: string;
  /** Optional override for each field's class (receives hasError). */
  fieldClassName?: (hasError: boolean) => string;
  showFeedback?: boolean;
};

export function QuizDobTripleInput({
  value,
  onChange,
  autoFocus = false,
  className,
  fieldClassName,
  showFeedback = true,
}: QuizDobTripleInputProps) {
  const uid = useId();
  const monthId = `${uid}-dob-m`;
  const yearId = `${uid}-dob-y`;
  const monthRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  const initial = splitQuizDob(value);
  const [day, setDay] = useState(initial.day);
  const [month, setMonth] = useState(initial.month);
  const [year, setYear] = useState(initial.year);

  useEffect(() => {
    const parts = splitQuizDob(value);
    setDay(parts.day);
    setMonth(parts.month);
    setYear(parts.year);
  }, [value]);

  const emit = (d: string, m: string, y: string) => {
    onChange(joinQuizDob({ day: d, month: m, year: y }));
  };

  const dob = validateQuizDob(joinQuizDob({ day, month, year }));
  const defaultFieldClass = (hasError: boolean) =>
    cn(
      "w-full min-h-[52px] px-2 py-3 rounded-xl border text-center text-xl font-medium outline-none transition-colors bg-white",
      hasError
        ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200"
        : dob.isValid
          ? "border-[#5c7a52] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20"
          : "border-[#e6ebe3] focus:border-[#5c7a52] focus:ring-2 focus:ring-[#5c7a52]/20"
    );

  const fieldClass = fieldClassName ?? defaultFieldClass;

  return (
    <div className={cn("pt-2", className)}>
      <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-2">
        <div>
          <label className="mb-1 block text-center text-[10px] uppercase tracking-wide text-[#7e9a72]">
            Day
          </label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={2}
            value={day}
            placeholder="DD"
            autoFocus={autoFocus}
            aria-invalid={Boolean(dob.errors.day)}
            onChange={(e) => {
              const d = sanitizeQuizDobDay(e.target.value);
              setDay(d);
              emit(d, month, year);
              if (isQuizDobDayComplete(d)) monthRef.current?.focus();
            }}
            className={fieldClass(Boolean(dob.errors.day))}
          />
        </div>
        <div>
          <label className="mb-1 block text-center text-[10px] uppercase tracking-wide text-[#7e9a72]">
            Month
          </label>
          <input
            ref={monthRef}
            id={monthId}
            type="text"
            inputMode="numeric"
            maxLength={2}
            value={month}
            placeholder="MM"
            aria-invalid={Boolean(dob.errors.month)}
            onChange={(e) => {
              const m = sanitizeQuizDobMonth(e.target.value);
              setMonth(m);
              emit(day, m, year);
              if (isQuizDobMonthComplete(m)) yearRef.current?.focus();
            }}
            className={fieldClass(Boolean(dob.errors.month))}
          />
        </div>
        <div>
          <label className="mb-1 block text-center text-[10px] uppercase tracking-wide text-[#7e9a72]">
            Year
          </label>
          <input
            ref={yearRef}
            id={yearId}
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={year}
            placeholder="YYYY"
            aria-invalid={Boolean(dob.errors.year)}
            onChange={(e) => {
              const y = sanitizeQuizDobYear(e.target.value);
              setYear(y);
              emit(day, month, y);
            }}
            className={fieldClass(Boolean(dob.errors.year))}
          />
        </div>
      </div>

      {showFeedback && (
        <div className="mt-2 min-h-5 space-y-1 text-center text-xs leading-5" aria-live="polite">
          {(dob.errors.day || dob.errors.month || dob.errors.year || dob.errors.form) && (
            <>
              {dob.errors.day && <p className="text-red-500">{dob.errors.day}</p>}
              {dob.errors.month && <p className="text-red-500">{dob.errors.month}</p>}
              {dob.errors.year && <p className="text-red-500">{dob.errors.year}</p>}
              {dob.errors.form && <p className="text-red-500">{dob.errors.form}</p>}
            </>
          )}
          {dob.isValid && (
            <p className="text-[#5c7a52]">Age {dob.age}, eligible</p>
          )}
        </div>
      )}
    </div>
  );
}
