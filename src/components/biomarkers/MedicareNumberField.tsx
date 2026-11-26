"use client";

import { useRef, type KeyboardEvent, type RefObject } from "react";
import {
  MEDICARE_NUMBER_ERROR,
  isValidMedicareNumber,
  partsFromMedicareIntake,
  serializeMedicareIntake,
  type MedicareIntakeParts,
} from "@/lib/medicare-number";

type FieldKey = keyof MedicareIntakeParts;

type Props = {
  value: string;
  onChange: (value: string) => void;
  showError?: boolean;
  disabled?: boolean;
};

const FIELD_ORDER: FieldKey[] = [
  "group4",
  "group5",
  "group1",
  "expiryMonth",
  "expiryYear",
];

const MAX_LENGTH: Record<FieldKey, number> = {
  group4: 4,
  group5: 5,
  group1: 1,
  irn: 1,
  expiryMonth: 2,
  expiryYear: 4,
};

const BOX =
  "h-12 rounded-xl border-2 bg-white px-1 text-center text-base font-medium tabular-nums tracking-widest outline-none transition-colors disabled:opacity-50";

export function MedicareNumberField({ value, onChange, showError, disabled }: Props) {
  const parts = partsFromMedicareIntake(value);
  const invalid = Boolean(showError && !isValidMedicareNumber(value));
  const border = invalid
    ? "border-red-400 focus:border-red-500"
    : "border-gray-200 focus:border-gray-900";

  const group4Ref = useRef<HTMLInputElement>(null);
  const group5Ref = useRef<HTMLInputElement>(null);
  const group1Ref = useRef<HTMLInputElement>(null);
  const expiryMonthRef = useRef<HTMLInputElement>(null);
  const expiryYearRef = useRef<HTMLInputElement>(null);

  const refs: Record<Exclude<FieldKey, "irn">, RefObject<HTMLInputElement | null>> = {
    group4: group4Ref,
    group5: group5Ref,
    group1: group1Ref,
    expiryMonth: expiryMonthRef,
    expiryYear: expiryYearRef,
  };

  const emit = (next: MedicareIntakeParts) => {
    onChange(serializeMedicareIntake({ ...next, irn: "" }));
  };

  const handleChange = (key: Exclude<FieldKey, "irn">, raw: string) => {
    const max = MAX_LENGTH[key];
    const digits = raw.replace(/\D/g, "").slice(0, max);
    emit({ ...parts, irn: "", [key]: digits });
    if (digits.length >= max) {
      const following = FIELD_ORDER[FIELD_ORDER.indexOf(key) + 1];
      if (following && following !== "irn") refs[following].current?.focus();
    }
  };

  const handleKeyDown = (
    key: Exclude<FieldKey, "irn">,
    event: KeyboardEvent<HTMLInputElement>
  ) => {
    if (event.key !== "Backspace" || parts[key]) return;
    const previous = FIELD_ORDER[FIELD_ORDER.indexOf(key) - 1];
    if (!previous || previous === "irn") return;
    event.preventDefault();
    emit({ ...parts, irn: "", [previous]: parts[previous].slice(0, -1) });
    refs[previous].current?.focus();
  };

  const input = (
    key: Exclude<FieldKey, "irn">,
    widthClass: string,
    placeholder: string,
    label?: string
  ) => (
    <input
      id={`medicare-${key}`}
      ref={refs[key]}
      type="text"
      inputMode="numeric"
      autoComplete="off"
      aria-label={label}
      placeholder={placeholder}
      maxLength={MAX_LENGTH[key]}
      value={parts[key]}
      disabled={disabled}
      aria-invalid={invalid}
      onChange={(event) => handleChange(key, event.target.value)}
      onKeyDown={(event) => handleKeyDown(key, event)}
      className={`${BOX} ${border} ${widthClass}`}
    />
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor="medicare-group4" className="mb-1 block text-xs font-medium text-gray-500">
            1234
          </label>
          {input("group4", "w-[4.75rem]", "1234", "Medicare number first 4 digits")}
        </div>
        <div>
          <label htmlFor="medicare-group5" className="mb-1 block text-xs font-medium text-gray-500">
            56789
          </label>
          <div className="flex gap-1.5">
            {input("group5", "w-[5.75rem]", "56789", "Medicare number next 5 digits")}
            {input("group1", "w-10", "1", "Medicare number last digit")}
          </div>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500">Valid to</p>
          <div className="flex items-center gap-1.5">
            {input("expiryMonth", "w-12", "MM", "Expiry month")}
            <span className="text-gray-400">/</span>
            {input("expiryYear", "w-[5.5rem]", "YYYY", "Expiry year")}
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-500">
        Copy the number and the valid-to date from your card.
      </p>
      {invalid ? <p className="text-sm text-red-600">{MEDICARE_NUMBER_ERROR}</p> : null}
    </div>
  );
}
