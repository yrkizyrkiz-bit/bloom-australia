import { resolvePublicConsultProgramFromBookingNotes } from "@/lib/funnel/public-consult-programs";
import { normalizeProgramKey, type ProgramKey } from "@/lib/membership/keys";

type PublicConsultSlug =
  | "weight_management"
  | "hair_loss"
  | "mens_health"
  | "womens_health";

/** Map entitlement/program keys onto booking-note program families. */
export function programKeyToConsultSlug(
  programKey: ProgramKey | null | undefined
): PublicConsultSlug | null {
  if (!programKey) return null;
  switch (programKey) {
    case "WEIGHT_MANAGEMENT":
      return "weight_management";
    case "HAIR_LOSS":
      return "hair_loss";
    case "MENS_HEALTH_SEXUAL":
    case "MENS_HEALTH_VITALITY":
      return "mens_health";
    case "WOMENS_HEALTH_SEXUAL":
    case "WOMENS_HEALTH_VITALITY":
      return "womens_health";
    default:
      return null;
  }
}

export function parsePortalUpsellProgramKey(notes?: string | null): ProgramKey | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes) as { source?: string; programKey?: string };
    if (parsed.source !== "portal_upsell") return null;
    return normalizeProgramKey(parsed.programKey);
  } catch {
    return null;
  }
}

export function bookingMatchesProgram(
  bookingNotes: string | null | undefined,
  programKey: ProgramKey
): boolean {
  const slug = programKeyToConsultSlug(programKey);
  if (!slug) return false;
  const resolved = resolvePublicConsultProgramFromBookingNotes(bookingNotes);
  return resolved?.slug === slug;
}

/**
 * Program keys from pending portal upsells that still need a care-arranged consult.
 * An open booking for another program does not clear a different upsell.
 */
export function listAwaitingConsultationPrograms(input: {
  pendingPortalUpsells: Array<{ notes?: string | null }>;
  openBookings: Array<{ notes?: string | null }>;
}): ProgramKey[] {
  const awaiting: ProgramKey[] = [];
  const seen = new Set<ProgramKey>();

  for (const task of input.pendingPortalUpsells) {
    const programKey = parsePortalUpsellProgramKey(task.notes);
    if (!programKey || seen.has(programKey)) continue;

    const hasMatchingBooking = input.openBookings.some((booking) =>
      bookingMatchesProgram(booking.notes, programKey)
    );
    if (hasMatchingBooking) continue;

    seen.add(programKey);
    awaiting.push(programKey);
  }

  return awaiting;
}

/** @deprecated Prefer listAwaitingConsultationPrograms for program-scoped UI. */
export function computeAwaitingConsultationArrangement(input: {
  pendingPortalUpsells: Array<{ notes?: string | null }>;
  openBookings: Array<{ notes?: string | null }>;
}): boolean {
  return listAwaitingConsultationPrograms(input).length > 0;
}

export function isProgramAwaitingConsultation(
  programs: ProgramKey[] | null | undefined,
  programKey: ProgramKey
): boolean {
  return Boolean(programs?.includes(programKey));
}

export const AWAITING_CONSULTATION_HERO_COPY =
  "A Sanative care partner will review your intake questions and contact you to arrange a doctor consultation to discuss your treatment options.";
