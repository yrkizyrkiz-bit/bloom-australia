"use client";

import { usePortalContext } from "@/hooks/usePortalContext";
import {
  AWAITING_CONSULTATION_HERO_COPY,
  isProgramAwaitingConsultation,
} from "@/lib/portal/awaiting-consultation";
import type { ProgramKey } from "@/lib/membership/keys";
import { cn } from "@/lib/utils";

type AwaitingConsultationHeroNoteProps = {
  /** One or more program keys this hero represents. */
  programKeys: ProgramKey | ProgramKey[];
  className?: string;
};

/**
 * Care-partner awaiting-consult copy for a program hero.
 * Only renders when portal context lists that program as still needing a consult arranged.
 */
export function AwaitingConsultationHeroNote({
  programKeys,
  className,
}: AwaitingConsultationHeroNoteProps) {
  const { data: portal } = usePortalContext();
  const keys = Array.isArray(programKeys) ? programKeys : [programKeys];
  const show = keys.some((key) =>
    isProgramAwaitingConsultation(portal?.awaitingConsultationPrograms, key)
  );

  if (!show) return null;

  return (
    <p className={cn("mt-3 text-sm text-white/90 leading-relaxed max-w-2xl", className)}>
      {AWAITING_CONSULTATION_HERO_COPY}
    </p>
  );
}
