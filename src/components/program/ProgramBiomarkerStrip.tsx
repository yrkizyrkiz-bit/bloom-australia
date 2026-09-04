"use client";

import Link from "next/link";
import { Beaker, ChevronRight, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Flag = {
  biomarkerId: string;
  name: string;
  status: string;
  value: number;
  unit: string;
  programFocus?: string;
};

export function ProgramBiomarkerStrip({
  planTier,
  flags,
  summary,
}: {
  planTier?: string;
  flags?: Flag[];
  summary?: string | null;
}) {
  if (planTier !== "PRECISION") return null;
  if (!flags?.length && !summary) return null;

  const hasAlert = flags?.some((f) => f.status === "HIGH" || f.status === "LOW");

  return (
    <Card className="overflow-hidden border-[#cdd8c6] bg-gradient-to-br from-[#e6ebe3] to-[#cdd8c6]">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Beaker className="w-5 h-5 text-[#4a6243] shrink-0" />
              <span className="font-semibold text-[#2c3628]">
                Precision biomarkers
              </span>
              {hasAlert && (
                <Badge variant="outline" className="border-amber-400 text-amber-700 text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Review
                </Badge>
              )}
            </div>
            {summary && (
              <p className="mb-2 text-sm text-[#2c3628]">{summary}</p>
            )}
            <ul className="space-y-1 text-xs text-[#5c7a52]">
              {flags?.slice(0, 3).map((f) => (
                <li key={f.biomarkerId}>
                  {f.name}: {f.value} {f.unit}{" "}
                  <span className="capitalize">({f.status.toLowerCase()})</span>
                </li>
              ))}
            </ul>
          </div>
          <Link href="/dashboard/biomarkers">
            <Button size="sm" variant="outline" className="shrink-0 border-[#4a6243] text-[#2c3628]">
              View labs
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
