"use client";

import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Loader2, MapPin, X } from "lucide-react";
import type { AddressSuggestion, ParsedAustralianAddress } from "@/lib/address/types";

const AU_STATES = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"] as const;

const fieldClass =
  "w-full border-2 border-gray-200 focus:border-gray-900 rounded-xl px-4 py-3 text-base outline-none transition-colors bg-white";

export type AustralianAddressValue = {
  addressLine1: string;
  addressLine2: string;
  suburb: string;
  state: string;
  postcode: string;
};

type AustralianAddressLookupProps = {
  value: AustralianAddressValue;
  onChange: (next: AustralianAddressValue) => void;
  disabled?: boolean;
};

function newSessionToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `addr-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function AustralianAddressLookup({
  value,
  onChange,
  disabled = false,
}: AustralianAddressLookupProps) {
  const listId = useId();
  const [query, setQuery] = useState(value.addressLine1);
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [source, setSource] = useState<"google" | "photon" | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const sessionTokenRef = useRef(newSessionToken());
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const skipSearchRef = useRef(false);

  useEffect(() => {
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }
    if (value.addressLine1 !== query && !open) {
      setQuery(value.addressLine1);
    }
  }, [value.addressLine1, query, open]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const search = useCallback(async (term: string) => {
    abortRef.current?.abort();
    if (term.trim().length < 3) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setLookupError(null);

    try {
      const params = new URLSearchParams({
        q: term.trim(),
        sessionToken: sessionTokenRef.current,
      });
      const res = await fetch(`/api/address/suggest?${params}`, {
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Address lookup failed");
      }
      const next = (data.suggestions ?? []) as AddressSuggestion[];
      setSuggestions(next);
      setSource(data.source ?? null);
      setActiveIndex(next.length > 0 ? 0 : -1);
      setOpen(next.length > 0);
    } catch (error) {
      if ((error as Error).name === "AbortError") return;
      setSuggestions([]);
      setOpen(false);
      setLookupError("Could not look up addresses. Enter yours below.");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  const applyParsed = useCallback(
    (parsed: ParsedAustralianAddress) => {
      skipSearchRef.current = true;
      setQuery(parsed.addressLine1);
      setSuggestions([]);
      setOpen(false);
      onChange({
        addressLine1: parsed.addressLine1,
        addressLine2: parsed.addressLine2 || value.addressLine2,
        suburb: parsed.suburb,
        state: parsed.state,
        postcode: parsed.postcode,
      });
      sessionTokenRef.current = newSessionToken();
    },
    [onChange, value.addressLine2]
  );

  const selectSuggestion = useCallback(
    async (suggestion: AddressSuggestion) => {
      if (suggestion.parsed) {
        applyParsed(suggestion.parsed);
        return;
      }

      setResolving(true);
      setLookupError(null);
      try {
        const params = new URLSearchParams({
          id: suggestion.id,
          provider: suggestion.provider,
          sessionToken: sessionTokenRef.current,
        });
        const res = await fetch(`/api/address/details?${params}`);
        const data = await res.json();
        if (!res.ok || !data.address) {
          throw new Error(data.error || "Could not load that address");
        }
        applyParsed(data.address as ParsedAustralianAddress);
      } catch {
        setLookupError("Could not fill that address. Enter it manually.");
      } finally {
        setResolving(false);
      }
    },
    [applyParsed]
  );

  const handleStreetChange = (next: string) => {
    setQuery(next);
    onChange({ ...value, addressLine1: next });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void search(next);
    }, 280);
  };

  const handleStreetKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      void selectSuggestion(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  };

  const filled = Boolean(value.suburb && value.state && value.postcode);

  return (
    <div ref={rootRef} className="space-y-3">
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor={`${listId}-street`}>
          Street address
        </label>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            id={`${listId}-street`}
            type="text"
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined}
            disabled={disabled || resolving}
            placeholder="Start typing your Australian address"
            value={query}
            onChange={(e) => handleStreetChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setOpen(true);
            }}
            onKeyDown={handleStreetKeyDown}
            className={`${fieldClass} pl-10 pr-11`}
          />
          <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {(loading || resolving) && (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            )}
            {query && !disabled && !loading && !resolving && (
              <button
                type="button"
                aria-label="Clear address"
                className="rounded-full p-0.5 text-gray-400 hover:text-gray-700"
                onClick={() => {
                  setQuery("");
                  setSuggestions([]);
                  setOpen(false);
                  onChange({
                    addressLine1: "",
                    addressLine2: value.addressLine2,
                    suburb: "",
                    state: "",
                    postcode: "",
                  });
                }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <p className="mt-1.5 text-xs text-gray-500">
          Pick a match to fill suburb, state and postcode.
        </p>

        {open && suggestions.length > 0 && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
          >
            {suggestions.map((suggestion, index) => (
              <li key={suggestion.id} role="presentation">
                <button
                  type="button"
                  id={`${listId}-opt-${index}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`flex w-full items-start gap-3 px-3 py-2.5 text-left ${
                    index === activeIndex ? "bg-gray-50" : "hover:bg-gray-50"
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => void selectSuggestion(suggestion)}
                >
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  <span>
                    <span className="block text-sm font-medium text-gray-900">
                      {suggestion.primary}
                    </span>
                    {suggestion.secondary ? (
                      <span className="block text-xs text-gray-500">{suggestion.secondary}</span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
            {source === "google" ? (
              <li className="border-t border-gray-100 px-3 py-1.5 text-[10px] uppercase tracking-wide text-gray-400">
                Powered by Google
              </li>
            ) : null}
          </ul>
        )}
      </div>

      {lookupError ? <p className="text-xs text-amber-700">{lookupError}</p> : null}

      <div>
        <input
          type="text"
          autoComplete="address-line2"
          disabled={disabled}
          value={value.addressLine2}
          onChange={(e) => onChange({ ...value, addressLine2: e.target.value })}
          className={fieldClass}
          placeholder="Unit / Apt (optional)"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Suburb</label>
          <input
            type="text"
            autoComplete="address-level2"
            disabled={disabled}
            value={value.suburb}
            onChange={(e) => onChange({ ...value, suburb: e.target.value })}
            className={fieldClass}
            placeholder={filled ? undefined : "Filled from lookup"}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">State</label>
          <select
            autoComplete="address-level1"
            disabled={disabled}
            value={value.state}
            onChange={(e) => onChange({ ...value, state: e.target.value })}
            className={`${fieldClass} bg-white`}
          >
            <option value="">Select</option>
            {AU_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Postcode</label>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="postal-code"
          disabled={disabled}
          placeholder="2000"
          value={value.postcode}
          onChange={(e) =>
            onChange({ ...value, postcode: e.target.value.replace(/\D/g, "").slice(0, 4) })
          }
          className={fieldClass}
          maxLength={4}
        />
      </div>
    </div>
  );
}
