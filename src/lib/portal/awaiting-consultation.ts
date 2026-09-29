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
 * True when the member has at least one pending portal program upsell that still
 * needs a care-arranged consult for *that* program. An open booking for a
 * different program (e.g. Weight Management) must not suppress the banner for
 * a new Hair / Men's / Women's portal add.
 */
export function computeAwaitingConsultationArrangement(input: {
  pendingPortalUpsells: Array<{ notes?: string | null }>;
  openBookings: Array<{ notes?: string | null }>;
}): boolean {
  const upsells = input.pendingPortalUpsells;
  if (upsells.length === 0) return false;

  for (const task of upsells) {
    const programKey =
      parsePortalUpsellProgramKey(task.notes) ??
      // Notes without parseable JSON still contain "portal_upsell" (query filter);
      // treat as awaiting unless somehow already covered — prefer showing the banner.
      null;

    if (!programKey) {
      // Cannot attribute a booking to an unknown program; keep banner on.
      return true;
    }

    const hasMatchingBooking = input.openBookings.some((booking) =>
      bookingMatchesProgram(booking.notes, programKey)
    );
    if (!hasMatchingBooking) return true;
  }

  return false;
}
