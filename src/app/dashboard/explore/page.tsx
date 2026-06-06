"use client";

import Link from "next/link";
import {
  Scale,
  FlaskConical,
  TestTubes,
  Sparkles,
  ArrowRight,
  Lock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePortalContext } from "@/hooks/usePortalContext";
import { hasPortalFeature } from "@/components/portal/ProgramFeatureGate";

const explorePrograms = [
  {
    id: "weight",
    title: "Weight Management",
    description: "Your active program — follow your journey and care plan.",
    href: "/dashboard/weight-management",
    icon: Scale,
    primary: true,
  },
  {
    id: "biomarkers",
    title: "Biomarker monitoring",
    description: "Track health markers over time with clinician-guided insights.",
    href: "/dashboard/biomarkers",
    icon: FlaskConical,
    explore: true,
  },
  {
    id: "tests",
    title: "Health test panels",
    description: "Organ-specific blood panels to understand your health in depth.",
    href: "/dashboard/blood-panel",
    icon: TestTubes,
    explore: true,
  },
];

export default function ExplorePage() {
  const { data: portal } = usePortalContext();
  const hasBiomarkers = hasPortalFeature(portal, "biomarkerResults");

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-serif text-[#34412f]">Explore your health</h1>
        <p className="text-[#5c7a52] mt-2">
          Your weight program is your home base. Discover additional monitoring and tests when you&apos;re ready.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {explorePrograms.map((program) => {
          const Icon = program.icon;
          const locked = program.explore && !hasBiomarkers;

          return (
            <Card
              key={program.id}
              className={
                program.primary
                  ? "border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white md:col-span-2"
                  : "border-[#e6ebe3]"
              }
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#1D9E75]/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#1D9E75]" />
                  </div>
                  {program.primary && (
                    <Badge className="bg-emerald-700">Your program</Badge>
                  )}
                  {locked && (
                    <Badge variant="outline" className="gap-1 text-gray-500">
                      <Lock className="w-3 h-3" />
                      Explore
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg font-serif text-[#34412f]">
                  {program.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-[#5c7a52]">{program.description}</p>
                {locked && (
                  <p className="text-xs text-[#7e9a72]">
                    Available as your clinician approves monitoring — ask your care team during your program.
                  </p>
                )}
                <Button
                  asChild
                  variant={program.primary ? "default" : "outline"}
                  className={program.primary ? "bg-[#1D9E75] hover:bg-[#178a64]" : ""}
                >
                  <Link href={program.href}>
                    {program.primary ? "Go to program" : "Learn more"}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-[#e6ebe3] bg-[#fdfbf7]">
        <CardContent className="pt-6 flex items-start gap-4">
          <Sparkles className="w-8 h-8 text-[#1D9E75] shrink-0" />
          <div>
            <p className="font-medium text-[#34412f]">Biomarker-guided care</p>
            <p className="text-sm text-[#5c7a52] mt-1">
              Sanative combines your weight program with optional biomarker monitoring — a difference you&apos;ll see as your journey progresses.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
