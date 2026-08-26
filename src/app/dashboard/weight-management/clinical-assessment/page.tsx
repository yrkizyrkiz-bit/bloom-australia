"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Loader2, Stethoscope } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  areClinicalAnswersComplete,
  emptyWeightManagementClinicalAnswers,
  getWeightManagementClinicalQuestions,
  toggleClinicalExclusiveOption,
  type WeightManagementClinicalAnswers,
} from "@/lib/programs/quizzes/weight-management-clinical-quiz";

export default function WeightManagementClinicalAssessmentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<WeightManagementClinicalAnswers>(
    emptyWeightManagementClinicalAnswers()
  );

  const gender =
    user?.gender === "male" || user?.gender === "female" ? user.gender : "";
  const questions = useMemo(
    () => getWeightManagementClinicalQuestions(gender),
    [gender]
  );
  const question = questions[index];
  const selected = question ? answers[question.id] : [];
  const isLast = index >= questions.length - 1;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/weight-management/clinical-assessment")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.status === "complete") {
          router.replace("/dashboard/weight-management");
          return;
        }
      })
      .catch(() => {
        toast.error("Could not load your clinical assessment");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  const toggle = (value: string) => {
    if (!question) return;
    setAnswers((prev) => ({
      ...prev,
      [question.id]: toggleClinicalExclusiveOption(prev[question.id], value, question.noneValue),
    }));
  };

  const goNext = async () => {
    if (!question || selected.length === 0) return;
    if (!isLast) {
      setIndex((current) => current + 1);
      window.scrollTo(0, 0);
      return;
    }
    if (!areClinicalAnswersComplete(answers)) {
      toast.error("Please answer every question");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/weight-management/clinical-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", ...answers }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save");
      toast.success("Clinical assessment saved for your doctor");
      router.push("/dashboard/weight-management");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const completeLater = async () => {
    setSaving(true);
    try {
      await fetch("/api/weight-management/clinical-assessment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "defer" }),
      });
      router.push("/dashboard/weight-management");
    } catch {
      router.push("/dashboard/weight-management");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !question) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5c7a52]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/dashboard/weight-management"
          className="inline-flex items-center gap-1 text-sm text-[#5c7a52] hover:text-[#34412f]"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>
        <button
          type="button"
          onClick={() => void completeLater()}
          disabled={saving}
          className="text-sm text-[#7e9a72] hover:text-[#34412f]"
        >
          Complete later
        </button>
      </div>

      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5c7a52]/10">
          <Stethoscope className="h-5 w-5 text-[#5c7a52]" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5c7a52]">
            Clinical assessment
          </p>
          <h1 className="mt-1 font-serif text-2xl text-[#2c3628]">{question.prompt}</h1>
          <p className="mt-1 text-sm text-[#5c7a52]">{question.subtitle}</p>
        </div>
      </div>

      <div className="mb-4 flex gap-1">
        {questions.map((item, i) => (
          <div
            key={item.id}
            className={`h-1.5 flex-1 rounded-full ${i <= index ? "bg-[#5c7a52]" : "bg-[#e6ebe3]"}`}
          />
        ))}
      </div>
      <p className="mb-4 text-xs text-[#7e9a72]">
        Question {index + 1} of {questions.length} · Select all that apply
      </p>

      <div className="space-y-2.5">
        {question.options.map((option) => {
          const isSelected = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${
                isSelected
                  ? "border-[#5c7a52] bg-[#5c7a52]/10"
                  : "border-[#e6ebe3] bg-white hover:border-[#cdd8c6]"
              }`}
            >
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 ${
                  isSelected ? "border-[#5c7a52] bg-[#5c7a52]" : "border-[#cdd8c6]"
                }`}
              >
                {isSelected ? <Check className="h-3.5 w-3.5 text-white" /> : null}
              </div>
              <span className="text-sm text-[#2c3628]">{option}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex gap-3">
        {index > 0 && (
          <button
            type="button"
            onClick={() => setIndex((current) => current - 1)}
            className="rounded-xl border border-[#cdd8c6] px-4 py-3.5 text-[#5c7a52]"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => void goNext()}
          disabled={selected.length === 0 || saving}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#5c7a52] py-3.5 font-medium text-white hover:bg-[#4a6343] disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isLast ? (
            <>
              Save for my doctor
              <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
