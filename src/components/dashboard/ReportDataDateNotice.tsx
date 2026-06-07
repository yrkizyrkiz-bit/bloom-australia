"use client";

import { Calendar, AlertTriangle } from "lucide-react";

interface ReportDataDateNoticeProps {
  dataDate?: string | null;
  resultsStale?: boolean;
  className?: string;
}

/**
 * Informs the member that the report reflects their most recent blood test and,
 * when those results are more than 6 months old, recommends booking a new test.
 * Reports are not regenerated while the underlying biomarker data is unchanged.
 */
export function ReportDataDateNotice({ dataDate, resultsStale, className }: ReportDataDateNoticeProps) {
  if (!dataDate) return null;

  const formattedDate = new Date(dataDate).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (resultsStale) {
    return (
      <div
        className={`flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 ${className ?? ""}`}
      >
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="text-sm">
          <p className="font-medium text-amber-800">
            This is based on your last biomarker results dated {formattedDate}.
          </p>
          <p className="mt-1 text-amber-700">
            These results are now more than 6 months old. We recommend contacting your doctor
            for a new blood test so we can generate an updated report.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 ${className ?? ""}`}
    >
      <Calendar className="h-4 w-4 shrink-0 text-slate-400" />
      <span>
        This is based on your last biomarker results dated{" "}
        <span className="font-medium text-slate-700">{formattedDate}</span>. A new blood test is
        required for an updated report.
      </span>
    </div>
  );
}
