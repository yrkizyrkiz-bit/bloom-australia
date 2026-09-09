"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  type HolisticHealthReport,
  type HolisticMarkerItem,
  type HolisticPriorityBand,
} from "@/lib/holistic-health-report-types";
import { patientFacingMarkerName } from "@/lib/holistic-patient-language";
import {
  answerReportAskQuestion,
  buildReportAskItems,
  type ReportAskItem,
} from "@/lib/holistic-report-ask";
import { cn } from "@/lib/utils";
import "@/components/promo/sage-atmosphere.css";
import {
  Sparkles,
  AlertTriangle,
  Brain,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Eye,
  Stethoscope,
  Activity,
  Heart,
  Bean,
  Droplets,
  ChevronLeft,
  ChevronRight,
  GitBranch,
  ClipboardList,
  MessageCircle,
  ArrowUp,
  Plus,
  Check,
  type LucideIcon,
} from "lucide-react";

type ReportSection = "priorities" | "organs" | "patterns" | "actions" | "ask";

const SECTION_CARDS: Array<{
  id: ReportSection;
  label: string;
  icon: LucideIcon;
  /** Graded sage greens — deepest → lightest */
  tone: string;
  iconBg: string;
}> = [
  {
    id: "priorities",
    label: "Priorities",
    icon: AlertTriangle,
    tone: "#2f3f28",
    iconBg: "rgba(204, 234, 131, 0.22)",
  },
  {
    id: "organs",
    label: "Organs",
    icon: Heart,
    tone: "#3a4c2c",
    iconBg: "rgba(204, 234, 131, 0.2)",
  },
  {
    id: "patterns",
    label: "Patterns",
    icon: GitBranch,
    tone: "#455734",
    iconBg: "rgba(234, 246, 200, 0.22)",
  },
  {
    id: "actions",
    label: "Actions",
    icon: ClipboardList,
    tone: "#516640",
    iconBg: "rgba(234, 246, 200, 0.25)",
  },
  {
    id: "ask",
    label: "Ask",
    icon: MessageCircle,
    tone: "#5c7a52",
    iconBg: "rgba(245, 244, 235, 0.28)",
  },
];

export function riskBadgeClass(risk: string) {
  switch (risk) {
    case "high":
      return "bg-red-700/90 text-white border-0";
    case "elevated":
      return "bg-orange-600/90 text-white border-0";
    case "moderate":
      return "bg-[#c9a227] text-[#173c32] border-0";
    default:
      return "bg-[#ccea83] text-[#173c32] border-0";
  }
}

function bandMeta(band: HolisticPriorityBand) {
  switch (band) {
    case "immediate":
      return {
        label: "Immediate",
        shell: "border-red-500/25 bg-white/80",
        badge: "bg-red-600 text-white",
        icon: <AlertTriangle className="h-4 w-4 text-red-600" />,
        iconWrap: "bg-red-500/10",
      };
    case "needs_attention":
      return {
        label: "Needs attention",
        shell: "border-orange-500/25 bg-white/80",
        badge: "bg-orange-600 text-white",
        icon: <Eye className="h-4 w-4 text-orange-600" />,
        iconWrap: "bg-orange-500/10",
      };
    case "look_out":
      return {
        label: "Look out",
        shell: "border-amber-500/25 bg-white/85",
        badge: "bg-amber-500 text-white",
        icon: <Activity className="h-4 w-4 text-amber-600" />,
        iconWrap: "bg-amber-500/10",
      };
    default:
      return {
        label: "Looking good",
        shell: "border-[#9fc48f]/40 bg-white/90",
        badge: "bg-[#3a4c2c] text-[#eaf6c8]",
        icon: <CheckCircle2 className="h-4 w-4 text-[#3a4c2c]" />,
        iconWrap: "bg-[#ccea83]/35",
      };
  }
}

function TrendIcon({ trend }: { trend?: string }) {
  if (trend === "improving") return <TrendingUp className="h-3.5 w-3.5 text-green-700" />;
  if (trend === "worsening" || trend === "declining") {
    return <TrendingDown className="h-3.5 w-3.5 text-red-600" />;
  }
  if (trend === "stable") return <Minus className="h-3.5 w-3.5 text-[#5c7a52]/70" />;
  return null;
}

function organVisual(id: string) {
  if (id === "liver") {
    return { icon: <Bean className="h-4 w-4" />, color: "#65a30d" };
  }
  if (id === "heart") {
    return { icon: <Heart className="h-4 w-4" />, color: "#ef4444" };
  }
  if (id === "kidney") {
    return { icon: <Droplets className="h-4 w-4" />, color: "#0891b2" };
  }
  if (id === "thyroid") {
    return { icon: <Activity className="h-4 w-4" />, color: "#2563eb" };
  }
  if (id === "hormones") {
    return { icon: <Sparkles className="h-4 w-4" />, color: "#a855f7" };
  }
  return { icon: <Activity className="h-4 w-4" />, color: "#5c7a52" };
}

function MarkerList({ items, band }: { items: HolisticMarkerItem[]; band: HolisticPriorityBand }) {
  const meta = bandMeta(band);
  if (!items.length) {
    return (
      <p className="rounded-2xl border border-[#bcd3bd]/60 bg-white/55 px-4 py-6 text-center text-sm text-[#3a4c2c]/70">
        Nothing in “{meta.label}” from your latest panel.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={`${band}-${item.biomarkerId}`}
          className={cn(
            "rounded-2xl border p-3.5 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md",
            meta.shell
          )}
        >
          <div className="flex items-start gap-2.5">
            <div
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                meta.iconWrap
              )}
            >
              {meta.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-sm font-medium text-[#173c32]">
                  {patientFacingMarkerName(item.biomarkerId, item.name)}
                </p>
                <Badge className={cn("text-[10px] px-1.5 py-0", meta.badge)}>{meta.label}</Badge>
                <TrendIcon trend={item.trend} />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#3a4c2c]/80">{item.plainEnglish}</p>
              <p className="mt-1.5 text-[11px] font-medium text-[#5c7a52]">
                {item.value} {item.unit}
                {item.previousValue != null ? ` · was ${item.previousValue}` : ""}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatReportDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function SoftPanel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#bcd3bd]/50 bg-white/75 p-4 shadow-sm backdrop-blur-sm sm:p-5",
        className
      )}
    >
      {children}
    </div>
  );
}

function formatAskAnswerText(item: ReportAskItem): string {
  const parts = [item.intro];
  for (const bullet of item.bullets.slice(0, 1)) {
    parts.push(`• ${bullet.title} — ${bullet.body}`);
  }
  if (item.insight) parts.push(item.insight);
  if (item.closing && item.closing.length < 100) parts.push(item.closing);
  return parts.join("\n\n");
}

function ReportAskPanel({
  report,
  userId,
}: {
  report: HolisticHealthReport;
  userId: string;
}) {
  const catalog = useMemo(() => buildReportAskItems(report), [report]);
  const [active, setActive] = useState<ReportAskItem | null>(null);
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [displayedAnswer, setDisplayedAnswer] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  const ask = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || pendingQuestion) return;
    setActive(null);
    setDisplayedAnswer("");
    setIsTyping(false);
    setPendingQuestion(trimmed);
    setDraft("");
    try {
      const res = await fetch("/api/holistic-health-report/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, question: trimmed, report }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Could not get an answer"
        );
      }
      const answer = data.answer as ReportAskItem | undefined;
      if (!answer?.intro || !Array.isArray(answer.bullets)) {
        throw new Error("Incomplete answer from George");
      }
      setActive({
        id: answer.id || `ask-${Date.now()}`,
        question: answer.question || trimmed,
        intro: answer.intro,
        bullets: answer.bullets.slice(0, 1),
        insight: answer.insight,
        closing: answer.closing,
      });
    } catch {
      const fallback = answerReportAskQuestion(report, trimmed, catalog);
      setActive(fallback);
    } finally {
      setPendingQuestion(null);
    }
  };

  useEffect(() => {
    if (!active) {
      setDisplayedAnswer("");
      setIsTyping(false);
      return;
    }

    const answer = formatAskAnswerText(active);
    setDisplayedAnswer("");
    setIsTyping(true);
    let currentIndex = 0;

    const typingInterval = window.setInterval(() => {
      if (currentIndex < answer.length) {
        // Chunk a few chars for smoother long clinical answers
        const step = answer.length > 600 ? 3 : answer.length > 300 ? 2 : 1;
        currentIndex = Math.min(answer.length, currentIndex + step);
        setDisplayedAnswer(answer.slice(0, currentIndex));
      } else {
        setIsTyping(false);
        window.clearInterval(typingInterval);
      }
    }, 12);

    return () => window.clearInterval(typingInterval);
  }, [active]);

  useEffect(() => {
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [pendingQuestion, displayedAnswer, active]);

  const busy = Boolean(pendingQuestion);
  const inThread = Boolean(pendingQuestion || active);
  const shownQuestion = active?.question || pendingQuestion;

  return (
    <div className="relative flex min-h-[420px] flex-col overflow-hidden rounded-2xl bg-[#fdfbf7]">
      {/* Soft white graded wash — Hers / iPhone chat feel */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: `
            radial-gradient(90% 70% at 50% 0%, rgb(255 255 255 / 95%) 0%, transparent 55%),
            radial-gradient(70% 50% at 80% 100%, rgb(245 244 235 / 90%) 0%, transparent 60%),
            linear-gradient(180deg, #ffffff 0%, #fdfbf7 48%, #f5f1ea 100%)
          `,
        }}
      />

      <div className="relative flex min-h-[420px] flex-1 flex-col">
        <div ref={threadRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
          {!inThread ? (
            <>
              <h3 className="max-w-md font-serif text-2xl leading-snug text-[#2c3628] sm:text-3xl">
                Connect the dots across your health.
              </h3>
              <p className="max-w-lg text-sm text-[#7e9a72]">
                Ask George about markers from this report — answers use your actual results.
              </p>
              <div className="flex flex-col items-end gap-2.5 pt-6">
                {catalog.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void ask(item.question)}
                    disabled={busy}
                    className="max-w-[92%] rounded-2xl rounded-tr-md bg-[#ebe4da] px-4 py-3 text-left text-sm leading-relaxed text-[#2c3628] shadow-sm transition hover:bg-[#e3dbcf] disabled:opacity-60 sm:max-w-[80%]"
                  >
                    {item.question}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-end">
                <div className="max-w-[88%] rounded-2xl rounded-tr-md bg-[#5c7a52] px-4 py-3 text-sm leading-relaxed text-white shadow-sm">
                  <p>{shownQuestion}</p>
                  <div className="mt-1.5 flex items-center justify-end gap-1">
                    <Check className="h-3.5 w-3.5 text-white/60" aria-hidden />
                    <Check className="h-3.5 w-3.5 -ml-2 text-white/60" aria-hidden />
                    <span className="ml-1 text-[10px] text-white/60">Now</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5c7a52]">
                  <span className="text-xs font-bold text-white">G</span>
                </div>
                <div className="max-w-[88%] rounded-2xl rounded-tl-md border border-[#e6ebe3] bg-white px-4 py-3.5 shadow-sm">
                  {pendingQuestion && !active ? (
                    <div className="flex items-center gap-1.5 py-1" aria-label="George is typing">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-[#5c7a52] [animation-delay:0ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-[#5c7a52] [animation-delay:120ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-[#5c7a52] [animation-delay:240ms]" />
                    </div>
                  ) : (
                    <p className="whitespace-pre-line text-sm leading-relaxed text-[#2c3628]">
                      {displayedAnswer}
                      {isTyping && (
                        <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[#5c7a52]" />
                      )}
                    </p>
                  )}
                </div>
              </div>

              {active && !isTyping && (
                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActive(null);
                      setDisplayedAnswer("");
                      setPendingQuestion(null);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e6ebe3] bg-white text-[#5c7a52] shadow-sm transition hover:bg-[#f3efe8]"
                    aria-label="Collapse answer"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <form
          className="relative border-t border-[#e6ebe3] bg-[#fdfbf7]/95 px-4 py-3 sm:px-5"
          onSubmit={(e) => {
            e.preventDefault();
            void ask(draft);
          }}
        >
          <div className="flex items-center gap-2 rounded-full border border-[#e6ebe3] bg-white px-3 py-1.5 shadow-sm">
            <Plus className="h-4 w-4 shrink-0 text-[#a8bb9e]" aria-hidden />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask..."
              disabled={busy || isTyping}
              className="min-w-0 flex-1 bg-transparent text-sm text-[#2c3628] outline-none placeholder:text-[#a8bb9e] disabled:opacity-60"
              aria-label="Ask George about your report"
            />
            <button
              type="submit"
              disabled={busy || isTyping || !draft.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5c7a52] text-white transition enabled:hover:bg-[#4a6243] disabled:opacity-40"
              aria-label="Send question"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export type HolisticReportDateNav = {
  label: string;
  canGoOlder: boolean;
  canGoNewer: boolean;
  onOlder: () => void;
  onNewer: () => void;
  positionLabel?: string;
};

export function HolisticHealthReportEmpty({
  biomarkerCount,
  canGenerate,
  waitingForClaude,
  generateError,
  onGenerate,
}: {
  biomarkerCount: number;
  canGenerate: boolean;
  waitingForClaude: boolean;
  generateError: string | null;
  onGenerate: () => void;
}) {
  return (
    <div className="sage-atmosphere overflow-hidden rounded-3xl">
      <div className="sage-atmosphere__bg" aria-hidden />
      <div className="sage-atmosphere__glow" aria-hidden />
      <div className="sage-atmosphere__noise" aria-hidden />
      <div className="sage-atmosphere__inner px-6 py-12 text-center sm:px-10">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#3a4c2c]/15">
          <Brain className="h-8 w-8 text-[#3a4c2c]" />
        </div>
        <h3 className="font-serif text-2xl text-[#173c32]">Your Holistic Health Report</h3>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[#3a4c2c]/85">
          We analyse liver, heart, kidney, metabolic, thyroid and hormone markers together,
          compare with previous results, and explain what looks good, what to watch, and what
          needs attention — including how your Sanative programs may support future results.
        </p>
        {biomarkerCount === 0 ? (
          <p className="mt-4 text-sm text-orange-800">
            Add blood-test results before generating a report.
          </p>
        ) : (
          <Button
            onClick={onGenerate}
            disabled={waitingForClaude || !canGenerate}
            size="lg"
            className="mt-6 gap-2 rounded-full bg-[#3a4c2c] text-[#eaf6c8] hover:bg-[#2f3f28]"
          >
            {waitingForClaude ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Claude is writing your report...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Generate Holistic Report
              </>
            )}
          </Button>
        )}
        {waitingForClaude && (
          <p className="mx-auto mt-3 max-w-md text-sm text-[#3a4c2c]/75">
            Full Claude analysis usually takes 1–2 minutes. Keep this open — we&apos;ll refresh
            automatically.
          </p>
        )}
        {generateError && <p className="mt-3 text-sm text-red-700">{generateError}</p>}
        <p className="mx-auto mt-4 max-w-md text-xs text-[#5c7a52]">
          Report is a draft pending Sanative health practitioner review.
        </p>
      </div>
    </div>
  );
}

export function HolisticHealthReportView({
  report,
  userId,
  userName,
  dataDate,
  canGenerate,
  waitingForClaude,
  onGenerate,
  dateNav,
}: {
  report: HolisticHealthReport;
  userId: string;
  userName: string;
  dataDate?: string | null;
  canGenerate?: boolean;
  waitingForClaude?: boolean;
  onGenerate?: () => void;
  dateNav?: HolisticReportDateNav | null;
}) {
  const [section, setSection] = useState<ReportSection>("priorities");
  const panelLabel = formatReportDate(dataDate) || formatReportDate(report.analysisTimestamp);

  return (
    <div className="sage-atmosphere overflow-hidden rounded-3xl">
      <div className="sage-atmosphere__bg" aria-hidden />
      <div className="sage-atmosphere__glow" aria-hidden />
      <div className="sage-atmosphere__noise" aria-hidden />

      <div className="sage-atmosphere__inner space-y-5 p-4 sm:p-6">
        {dateNav && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#bcd3bd]/55 bg-white/55 px-2 py-2 backdrop-blur-sm">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-[#173c32] hover:bg-[#ccea83]/35"
              disabled={!dateNav.canGoOlder}
              onClick={dateNav.onOlder}
              aria-label="Older report"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0 text-center">
              <p className="truncate text-sm font-medium text-[#173c32]">{dateNav.label}</p>
              {dateNav.positionLabel && (
                <p className="text-xs text-[#5c7a52]">{dateNav.positionLabel}</p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-[#173c32] hover:bg-[#ccea83]/35"
              disabled={!dateNav.canGoNewer}
              onClick={dateNav.onNewer}
              aria-label="Newer report"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Summary hero */}
        <SoftPanel className="relative overflow-hidden border-[#ccea83]/40 bg-gradient-to-br from-white/90 via-[#eaf6c8]/50 to-white/70">
          <div
            className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#ccea83]/35 blur-2xl"
            aria-hidden
          />
          {canGenerate && onGenerate && (
            <div className="absolute right-3 top-3 z-10">
              <Button
                variant="outline"
                size="sm"
                onClick={onGenerate}
                disabled={waitingForClaude}
                className="rounded-full border-[#3a4c2c]/25 bg-white/70 text-[#173c32] hover:bg-[#ccea83]/40"
              >
                {waitingForClaude ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : report.aiProvider === "claude" ? (
                  "Refresh"
                ) : (
                  "Generate full Claude report"
                )}
              </Button>
            </div>
          )}
          <div className="relative mx-auto max-w-3xl text-center">
            <div className="mb-2 flex flex-wrap items-center justify-center gap-2">
              <h3 className="font-serif text-xl text-[#173c32]">{report.reportTitle}</h3>
              <Badge className={riskBadgeClass(report.overallRisk)}>
                {report.overallRisk} risk
              </Badge>
            </div>
            <p className="text-sm leading-relaxed text-[#3a4c2c]/90">{report.executiveSummary}</p>
            <p className="mt-2 text-xs text-[#5c7a52]">
              For {userName}
              {panelLabel ? ` · Panel ${panelLabel}` : ""}
            </p>
          </div>
        </SoftPanel>

        {/* Section shortcuts — organ-tile style, graded greens */}
        <div className="grid grid-cols-5 gap-2">
          {SECTION_CARDS.map((card) => {
            const Icon = card.icon;
            const active = section === card.id;
            return (
              <button
                key={card.id}
                type="button"
                onClick={() => setSection(card.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 rounded-xl border p-2.5 text-center transition-all",
                  active
                    ? "border-transparent text-white shadow-md"
                    : "border-[#bcd3bd]/60 bg-white/60 text-[#173c32] hover:border-[#9fc48f] hover:bg-white/85 hover:shadow-sm"
                )}
                style={
                  active
                    ? {
                        backgroundColor: card.tone,
                        boxShadow: `0 8px 20px ${card.tone}33, 0 0 0 1px rgba(204,234,131,0.2)`,
                      }
                    : undefined
                }
              >
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg",
                    active ? "text-[#eaf6c8]" : "text-[#3a4c2c]"
                  )}
                  style={{ backgroundColor: active ? card.iconBg : "rgba(188, 211, 189, 0.45)" }}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span
                  className={cn(
                    "text-center text-[11px] leading-tight",
                    active ? "font-medium text-[#eaf6c8]" : "text-[#3a4c2c]/80"
                  )}
                >
                  {card.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Section body */}
        <SoftPanel
          className={cn(
            "min-h-[220px]",
            section === "ask" && "overflow-hidden border-[#e6ebe3]/80 bg-transparent p-0 shadow-none"
          )}
        >
          {section === "priorities" && (
            <div className="space-y-6">
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-[#173c32]">
                  <AlertTriangle className="h-4 w-4 text-red-600" /> Immediate attention
                </h4>
                <MarkerList items={report.priorityBands.immediate} band="immediate" />
              </div>
              {report.priorityBands.needsAttention.length > 0 && (
                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-[#173c32]">
                    <Eye className="h-4 w-4 text-orange-600" /> Needs attention
                  </h4>
                  <MarkerList items={report.priorityBands.needsAttention} band="needs_attention" />
                </div>
              )}
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-[#173c32]">
                  <Activity className="h-4 w-4 text-amber-600" /> Look out for
                </h4>
                <MarkerList items={report.priorityBands.lookOut} band="look_out" />
              </div>
              <div>
                <h4 className="mb-2 flex items-center gap-2 text-sm font-medium text-[#173c32]">
                  <CheckCircle2 className="h-4 w-4 text-[#3a4c2c]" /> Looking good
                </h4>
                <MarkerList items={report.priorityBands.good} band="good" />
              </div>
            </div>
          )}

          {section === "organs" && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {report.organSystems.map((organ) => {
                const visual = organVisual(organ.id);
                return (
                  <div
                    key={organ.id}
                    className="rounded-2xl border border-[#bcd3bd]/55 bg-gradient-to-b from-white/95 to-[#eaf6c8]/35 p-3.5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-lg"
                          style={{
                            backgroundColor: `${visual.color}18`,
                            color: visual.color,
                          }}
                        >
                          {visual.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#173c32]">{organ.label}</p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className="border-[#bcd3bd] bg-white/70 text-[10px] text-[#3a4c2c]"
                            >
                              {organ.status.replace("_", " ")}
                            </Badge>
                            <TrendIcon trend={organ.trend} />
                          </div>
                        </div>
                      </div>
                      <span className="font-serif text-xl text-[#3a4c2c]">{organ.score}</span>
                    </div>
                    <p className="mt-2.5 text-xs leading-relaxed text-[#3a4c2c]/85">{organ.summary}</p>
                    {organ.highlights.length > 0 && (
                      <ul className="mt-2 space-y-1 border-t border-[#bcd3bd]/40 pt-2 text-[11px] text-[#5c7a52]">
                        {organ.highlights.slice(0, 3).map((line) => (
                          <li key={line} className="flex gap-1.5">
                            <span className="text-[#9fc48f]">•</span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {section === "patterns" &&
            (report.crossSystemPatterns.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#5c7a52]">
                No strong cross-system patterns flagged from this panel.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {report.crossSystemPatterns.map((pattern) => (
                  <div
                    key={pattern.title}
                    className="rounded-2xl border border-[#bcd3bd]/55 bg-white/85 p-3.5 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-[#173c32]">{pattern.title}</p>
                      <Badge
                        variant="outline"
                        className="border-[#bcd3bd] text-[10px] text-[#3a4c2c]"
                      >
                        {pattern.severity}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-xs leading-relaxed text-[#3a4c2c]/85">
                      {pattern.explanation}
                    </p>
                    <p className="mt-2 text-[11px] text-[#5c7a52]">
                      Systems: {pattern.involvedSystems.join(", ")}
                    </p>
                    <p className="mt-1 text-xs text-[#173c32]">{pattern.monitoringAdvice}</p>
                  </div>
                ))}
              </div>
            ))}

          {section === "actions" && (
            <div className="space-y-4">
              {report.urgentActions.length > 0 && (
                <div className="rounded-2xl border border-red-500/25 bg-red-50/80 p-3.5">
                  <p className="text-sm font-medium text-red-700">Urgent educational actions</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-red-900/80">
                    {report.urgentActions.map((action) => (
                      <li key={action}>{action}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                {report.recommendations.map((rec) => (
                  <div
                    key={`${rec.category}-${rec.action}`}
                    className="rounded-2xl border border-[#bcd3bd]/55 bg-white/85 p-3.5 shadow-sm"
                  >
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className="border-[#bcd3bd] text-[10px] text-[#3a4c2c]"
                      >
                        {rec.priority}
                      </Badge>
                      <Badge className="bg-[#ccea83]/50 text-[10px] text-[#173c32] hover:bg-[#ccea83]/50">
                        {rec.category}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-[#173c32]">{rec.action}</p>
                    <p className="mt-1 text-xs leading-relaxed text-[#3a4c2c]/80">{rec.rationale}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-[#bcd3bd]/55 bg-gradient-to-br from-white/90 to-[#eaf6c8]/40 p-3.5">
                <p className="flex items-center gap-2 text-sm font-medium text-[#173c32]">
                  <Stethoscope className="h-4 w-4 text-[#5c7a52]" /> Ask your care team
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[#3a4c2c]/85">
                  {report.questionsForCareTeam.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-[#173c32]">
                  <span className="font-medium">Retesting: </span>
                  {report.retestingGuidance}
                </p>
              </div>

              <div className="rounded-2xl border border-[#3a4c2c]/15 bg-[#3a4c2c]/08 p-3.5">
                <p className="text-sm font-medium text-[#173c32]">Care team handoff</p>
                <p className="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-[#3a4c2c]/85">
                  {report.careTeamHandoffSummary}
                </p>
              </div>
            </div>
          )}

          {section === "ask" && (
            <ReportAskPanel
              key={report.analysisTimestamp}
              report={report}
              userId={userId}
            />
          )}
        </SoftPanel>

        <p className="px-1 pb-1 text-[11px] leading-relaxed text-[#5c7a52]/90">
          Report is a draft pending Sanative health practitioner review.
        </p>
      </div>
    </div>
  );
}
