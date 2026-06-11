"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BiomarkerCard } from "@/components/dashboard/BiomarkerCard";
import {
  bloodPanelConfig,
  bloodPanelCategoryInfo,
  getBiomarkerStatus,
  type BloodPanelCategoryKey,
  type BloodPanelBiomarker,
  type Gender,
} from "@/data/bloodPanelConfig";
import type { BiomarkerDefinition, BiomarkerResult } from "@/types";
import {
  getEssentialMarkerIds,
  getProgramEssentialPanel,
  PROGRAM_ESSENTIAL_PANELS,
  type ProgramEssentialSlug,
} from "@/lib/program-essential-panels";
import { Info, User } from "lucide-react";

type BiomarkerRow = {
  category: BloodPanelCategoryKey;
  categoryName: string;
  biomarker: BloodPanelBiomarker;
  result: BiomarkerResult | null;
  biomarkerDef: BiomarkerDefinition | undefined;
};

interface GrayscaleCardProps {
  biomarker: BloodPanelBiomarker;
  gender?: Gender;
}

function GrayscaleBiomarkerCard({ biomarker, gender }: GrayscaleCardProps) {
  return (
    <Card className="p-4 opacity-60 grayscale border-border">
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-medium text-gray-500">{biomarker.shortName}</h4>
        <Badge variant="outline" className="text-xs text-gray-400 border-gray-300">
          Not Tested
        </Badge>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-serif font-bold text-gray-400">—</span>
        <span className="text-sm text-gray-400">{biomarker.unit}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">{biomarker.name}</p>
    </Card>
  );
}

interface BiomarkerProgramEssentialViewProps {
  program: ProgramEssentialSlug;
  onProgramChange: (program: ProgramEssentialSlug) => void;
  rows: BiomarkerRow[];
  gender: Gender;
  onBiomarkerClick: (
    biomarkerDef: BiomarkerDefinition | undefined,
    result: BiomarkerResult | null,
    panelBiomarker?: BloodPanelBiomarker
  ) => void;
}

export function BiomarkerProgramEssentialView({
  program,
  onProgramChange,
  rows,
  gender,
  onBiomarkerClick,
}: BiomarkerProgramEssentialViewProps) {
  const panelMeta = getProgramEssentialPanel(program);
  const essentialIds = useMemo(
    () => new Set(getEssentialMarkerIds(program, gender)),
    [program, gender]
  );

  const programRows = useMemo(
    () => rows.filter((row) => essentialIds.has(row.biomarker.id)),
    [rows, essentialIds]
  );

  const grouped = useMemo(() => {
    const groups: Partial<Record<BloodPanelCategoryKey, BiomarkerRow[]>> = {};
    const categoryOrder = Object.keys(bloodPanelConfig) as BloodPanelCategoryKey[];

    for (const row of programRows) {
      if (!groups[row.category]) groups[row.category] = [];
      groups[row.category]!.push(row);
    }

    return categoryOrder
      .filter((key) => groups[key]?.length)
      .map((key) => ({ category: key, items: groups[key]! }));
  }, [programRows]);

  const counts = useMemo(() => {
    let tested = 0;
    let optimal = 0;
    let attention = 0;

    for (const row of programRows) {
      if (!row.result) continue;
      tested++;
      const status = getBiomarkerStatus(row.result.value, row.biomarker, gender);
      if (status.status === "Optimal") optimal++;
      else if (!["Normal", "Not Tested"].includes(status.status)) attention++;
    }

    return {
      total: programRows.length,
      tested,
      pending: programRows.length - tested,
      optimal,
      attention,
    };
  }, [programRows, gender]);

  return (
    <div className="space-y-6">
      {/* Program tabs */}
      <Tabs
        value={program}
        onValueChange={(v) => onProgramChange(v as ProgramEssentialSlug)}
      >
        <div className="overflow-x-auto pb-1">
          <TabsList className="w-max h-auto flex-wrap gap-1 bg-muted/50 p-1">
            {PROGRAM_ESSENTIAL_PANELS.map((p) => (
              <TabsTrigger
                key={p.slug}
                value={p.slug}
                className="text-xs sm:text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                {p.shortLabel}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      {/* Program header */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4 px-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-medium text-foreground">
                {panelMeta.label} — Essential panel
              </h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                {panelMeta.description}
              </p>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Info className="w-3 h-3 shrink-0" />
                Markers your care team may order when clinically appropriate. Medicare eligibility
                depends on indication and MBS criteria.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              <Badge variant="secondary">{counts.total} markers</Badge>
              <Badge className="bg-green-600/90">{counts.tested} tested</Badge>
              {counts.pending > 0 && (
                <Badge variant="outline">{counts.pending} pending</Badge>
              )}
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
            <User className="w-3 h-3" />
            <span>
              {gender === "male" ? "Male" : "Female"} reference ranges
              {program === "HAIR_LOSS" ? " · panel tailored to sex" : ""}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Coverage bar */}
      <p className="text-xs text-muted-foreground">
        Program panel coverage: {counts.tested} of {counts.total} essential markers tested
        {counts.total > 0
          ? ` (${Math.round((counts.tested / counts.total) * 100)}%)`
          : ""}
        {counts.optimal > 0 && ` · ${counts.optimal} optimal`}
        {counts.attention > 0 && ` · ${counts.attention} need attention`}
      </p>

      {/* Grouped markers */}
      <div className="space-y-8">
        {grouped.map(({ category, items }) => {
          const config = bloodPanelConfig[category];
          const Icon = config.icon;
          const testedInGroup = items.filter((i) => i.result !== null).length;

          return (
            <section key={category}>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${config.color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: config.color }} />
                </div>
                <div>
                  <h3 className="text-base font-medium text-foreground">
                    {bloodPanelCategoryInfo[category].name}
                  </h3>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  {testedInGroup}/{items.length}
                </Badge>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map(({ biomarker, result, biomarkerDef }) =>
                  result && biomarkerDef ? (
                    <BiomarkerCard
                      key={biomarker.id}
                      biomarker={biomarkerDef}
                      result={result}
                      gender={gender}
                      panelBiomarker={biomarker}
                      onClick={() => onBiomarkerClick(biomarkerDef, result, biomarker)}
                    />
                  ) : (
                    <GrayscaleBiomarkerCard
                      key={biomarker.id}
                      biomarker={biomarker}
                      gender={gender}
                    />
                  )
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
