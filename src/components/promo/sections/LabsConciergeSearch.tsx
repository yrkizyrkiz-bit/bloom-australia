"use client";

import { FormEvent, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Sparkles } from "lucide-react";

const PLACEHOLDERS = [
  "Screen me for early type 2 diabetes risk",
  "Check for fatty liver before symptoms show",
  "Can you detect early kidney disease markers?",
  "Am I showing early signs of heart disease?",
  "Screen me for thyroid disorders early",
  "Check for anaemia and iron deficiency",
  "Could I have undiagnosed PCOS markers?",
  "Detect early metabolic syndrome risk",
  "Screen me for chronic inflammation markers",
  "Am I at risk of osteoporosis later?",
  "Check for vitamin D deficiency early",
  "Can labs catch prediabetes before diabetes?",
  "Screen me for high cholesterol and lipids",
  "Detect early hormone imbalances",
  "Check for B12 deficiency linked to fatigue",
  "Am I missing early liver disease signals?",
  "Screen me for insulin resistance risk",
  "Can you flag early gout or uric acid issues?",
  "Check for thyroid-related hair loss causes",
  "Detect nutrient gaps before they escalate",
  "Screen me for cardiovascular risk markers",
  "Am I at early risk of chronic kidney disease?",
];

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

type LabsConciergeSearchProps = {
  /** When false, only the search field is rendered (headline lives in the parent). */
  showIntro?: boolean;
  /** Align the control to the start of its column (default) or the end. */
  align?: "start" | "end";
};

export function LabsConciergeSearch({
  showIntro = true,
  align = "start",
}: LabsConciergeSearchProps) {
  const router = useRouter();
  const ghostRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<number | null>(null);
  const indexRef = useRef(0);

  const prompts = useMemo(() => shuffle(PLACEHOLDERS), []);

  useEffect(() => {
    const ghost = ghostRef.current;
    if (!ghost || prompts.length === 0) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const renderPrompt = (text: string) => {
      ghost.replaceChildren();
      if (reducedMotion) {
        ghost.textContent = text;
        return 0;
      }

      [...text].forEach((char, i) => {
        const span = document.createElement("span");
        span.textContent = char;
        span.style.display = "inline-block";
        span.style.whiteSpace = "pre";
        ghost.appendChild(span);
        span.animate(
          [
            { opacity: 0, transform: "translateY(0.3em)", filter: "blur(3px)" },
            { opacity: 1, transform: "none", filter: "none" },
          ],
          {
            duration: 180,
            delay: i * 11,
            easing: "ease",
            fill: "both",
          }
        );
      });

      return text.length * 11 + 180;
    };

    const tick = () => {
      const text = prompts[indexRef.current % prompts.length];
      const enterMs = renderPrompt(text);
      timerRef.current = window.setTimeout(() => {
        indexRef.current = (indexRef.current + 1) % prompts.length;
        tick();
      }, enterMs + 3500);
    };

    tick();

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [prompts]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    router.push("/biomarker-intake");
  };

  return (
    <div
      className={`relative z-30 w-full max-w-lg ${
        align === "end" ? "mx-auto lg:mx-0 lg:ml-auto" : "mx-0"
      }`}
    >
      {showIntro && (
        <div
          className={`mb-3 ${
            align === "end" ? "text-center lg:text-right" : "text-left"
          }`}
        >
          <p className="font-serif text-[1.65rem] sm:text-3xl text-[#2c3628] leading-[1.15] tracking-tight">
            Catch issues early and{" "}
            <span className="italic text-[#5c7a52]">stay ahead</span>
          </p>
          <p className="mt-1.5 text-sm text-[#5c7a52]/90">
            Ask a question — we&apos;ll point you to the right tests
          </p>
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="flex w-full cursor-pointer items-center gap-2.5 rounded-full border border-[#34412f]/12 bg-white/80 py-2.5 pl-3.5 pr-2 shadow-[0_8px_28px_rgba(52,65,47,0.10)] backdrop-blur-md transition-all duration-200 hover:border-[#34412f]/25 hover:bg-white/95"
        role="search"
        aria-label="Start biomarker intake"
        onClick={() => router.push("/biomarker-intake")}
      >
        <span
          className="flex h-9 w-9 min-w-9 shrink-0 items-center justify-center rounded-full bg-[#c17a58] text-white shadow-sm"
          aria-hidden="true"
        >
          <Sparkles className="h-4 w-4" strokeWidth={2.25} />
        </span>

        <div className="relative min-w-0 flex-1 py-0.5">
          <span
            ref={ghostRef}
            aria-live="polite"
            className="flex min-h-[1.5rem] items-center truncate text-[0.95rem] sm:text-base text-[#5c7a52] [mask-image:linear-gradient(to_right,#000_82%,transparent)]"
          />
        </div>

        <button
          type="submit"
          aria-label="Start biomarker intake"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#34412f] text-white transition-all hover:bg-[#2c3628] active:scale-[0.98]"
          onClick={(e) => e.stopPropagation()}
        >
          <ArrowUp className="size-4" />
        </button>
      </form>
    </div>
  );
}
