"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sun,
  Phone,
  Beaker,
  CheckCircle2,
  Clock,
  Package,
  Calendar,
  ListChecks,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProgramKey } from "@/lib/membership/keys";
import { getProgramJourneyConfig } from "@/lib/program-journey/config";
import {
  getConsultationCountdown,
  getTimelineProgress,
} from "@/lib/program-journey/timeline";

export type ProgramJourneyViewModel = {
  journeyStatus: string;
  stageDescription: string;
  stage?: string;
  isApproved?: boolean;
  hasPrescription?: boolean;
  hasTestsTracking?: boolean;
  consultation?: {
    date: string;
    time: string;
    doctorName: string | null;
  };
};

type ProgramJourneyShellProps = {
  programKey: ProgramKey;
  firstName?: string | null;
  greeting: string;
  journey: ProgramJourneyViewModel;
  children?: ReactNode;
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export { getGreeting as getProgramJourneyGreeting };

export function ProgramJourneyShell({
  programKey,
  firstName,
  greeting,
  journey,
  children,
}: ProgramJourneyShellProps) {
  const config = getProgramJourneyConfig(programKey);
  const theme = config.theme;
  const { currentStep, steps } = getTimelineProgress(journey.journeyStatus, {
    includeMonitoringSteps: journey.hasTestsTracking !== false,
  });

  return (
    <div className="space-y-6 pb-8">
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${theme.headerGradient} p-6 text-white`}>
        <div className="absolute top-0 right-0 h-40 w-40 -translate-y-1/2 translate-x-1/3 rounded-full bg-white/5" />
        <div className="absolute bottom-0 left-0 h-32 w-32 translate-y-1/2 -translate-x-1/3 rounded-full bg-white/5" />
        <div className="relative z-10">
          <div className="mb-1 flex items-center gap-2">
            <Sun className={`h-4 w-4 ${theme.accentText}`} />
            <p className={`text-sm ${theme.accentText}`}>{greeting}</p>
          </div>
          {firstName && (
            <h1 className="mb-2 font-serif text-2xl font-semibold md:text-3xl">{firstName}</h1>
          )}
          <p className={`text-sm ${theme.mutedText}`}>{config.programLabel}</p>
          <p className={`mt-1 text-sm ${theme.mutedText}`}>{journey.stageDescription}</p>
        </div>
      </div>

      <Card className={`border ${theme.statusBorder} bg-gradient-to-r ${theme.statusBackground}`}>
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className={`flex h-14 w-14 items-center justify-center rounded-full ${theme.iconBackground}`}>
              {journey.stage === "consultation" ? (
                <Phone className={`h-7 w-7 ${theme.iconColor}`} />
              ) : journey.stage === "pending_tests" ? (
                <Beaker className="h-7 w-7 text-amber-600" />
              ) : journey.isApproved ? (
                <CheckCircle2 className={`h-7 w-7 ${theme.iconColor}`} />
              ) : journey.hasPrescription ? (
                <Package className="h-7 w-7 text-blue-600" />
              ) : (
                <Clock className={`h-7 w-7 ${theme.iconColor}`} />
              )}
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-semibold ${theme.completeText}`}>
                {journey.stageDescription}
              </h3>
              {journey.consultation && journey.stage === "consultation" && (
                <p className={`mt-1 text-sm ${theme.completeText} opacity-80`}>
                  {journey.consultation.doctorName || "Your doctor"} will call you on{" "}
                  <strong>{new Date(journey.consultation.date).toLocaleDateString()}</strong> at{" "}
                  <strong>{journey.consultation.time}</strong>
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {journey.consultation?.date &&
        getConsultationCountdown(journey.consultation.date) && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-amber-200 bg-amber-50/80">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100">
                  <Clock className="h-7 w-7 text-amber-700" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
                    Consultation in
                  </p>
                  <p className="text-2xl font-semibold text-amber-950">
                    {getConsultationCountdown(journey.consultation.date)}
                  </p>
                  <p className="mt-1 text-sm text-amber-800/90">
                    {journey.consultation.doctorName || "Your doctor"} will call you — keep your
                    phone nearby.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

      <Card className="border-dashed transition-colors hover:border-emerald-300">
        <CardContent className="p-4">
          <Link href="/dashboard/settings" className="group flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 transition-transform group-hover:scale-105">
                <CreditCard className="h-5 w-5 text-emerald-700" />
              </div>
              <div>
                <p className="text-sm font-medium">Account & billing</p>
                <p className="text-xs text-muted-foreground">
                  View your plan, payment status & privacy
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={`flex items-center gap-2 text-base ${theme.iconColor}`}>
            <ListChecks className="h-5 w-5" />
            {config.prepTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {config.prepItems.map((item, index) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06 }}
                className="flex items-start gap-2 text-sm"
              >
                <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${theme.iconColor}`} />
                <span>{item}</span>
              </motion.li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className={`flex items-center gap-2 text-lg ${theme.iconColor}`}>
            <Calendar className="h-5 w-5" />
            Your Journey
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => {
              const isComplete = index < currentStep;
              const isCurrent = index === currentStep;
              return (
                <motion.div
                  key={step.key}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="flex items-start gap-4"
                >
                  <div className="flex flex-col items-center">
                    <motion.div
                      animate={isCurrent ? { scale: [1, 1.06, 1] } : {}}
                      transition={{ repeat: isCurrent ? Infinity : 0, duration: 2 }}
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        isComplete
                          ? theme.completeBackground
                          : isCurrent
                            ? `bg-emerald-600 text-white ring-4 ${theme.currentRing}`
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isComplete ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <step.icon className="h-5 w-5" />
                      )}
                    </motion.div>
                    {index < steps.length - 1 && (
                      <div
                        className={`mt-2 h-8 w-0.5 ${isComplete ? "bg-emerald-300" : "bg-gray-200"}`}
                      />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p
                      className={`font-medium ${
                        isComplete || isCurrent ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </p>
                    {(isComplete || isCurrent) && (
                      <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
                    )}
                    {isCurrent && (
                      <Badge className="mt-2 animate-pulse bg-emerald-600">Current step</Badge>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {children}
    </div>
  );
}
