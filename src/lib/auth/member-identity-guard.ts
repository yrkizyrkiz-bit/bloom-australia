import type { Prisma } from "@prisma/client";
import { hasPaidMemberJourney } from "@/lib/funnel/member-enrollment-phase";
import { formatAustralianPhone, formatE164 } from "@/lib/sms";

export type MemberIdentitySignals = {
  passwordHash?: string | null;
  subscriptionStatus?: string | null;
  journeyStatus?: string | null;
  memberStatus?: string | null;
};

/**
 * True when public checkout must not rewrite identity fields.
 * Matches the intake EMAIL_EXISTS protection (password, paid journey, active sub).
 */
export function isEstablishedMember(user: MemberIdentitySignals): boolean {
  if (user.passwordHash) return true;
  if (user.subscriptionStatus === "ACTIVE") return true;
  if (hasPaidMemberJourney(user.journeyStatus)) return true;
  if (user.memberStatus === "MEMBER") return true;
  return false;
}

/** Phone strings that may be stored for the same Australian mobile. */
export function phoneMatchCandidates(phone: string | null | undefined): string[] {
  const raw = (phone || "").trim();
  if (!raw) return [];

  const digits = raw.replace(/\D/g, "");
  const au = formatAustralianPhone(raw);
  const e164 = formatE164(raw);
  const local0 = au.startsWith("61") && au.length >= 11 ? `0${au.slice(2)}` : null;
  const withPlus = au.startsWith("61") ? `+${au}` : null;

  return [
    ...new Set(
      [raw, digits, au, e164, local0, withPlus].filter(
        (value): value is string => Boolean(value && value.length >= 8)
      )
    ),
  ];
}

export type ActivationProfileInput = {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  dateOfBirth?: Date | null;
  address?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
  gender?: "MALE" | "FEMALE" | null;
};

export type ExistingProfileFields = {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  dateOfBirth?: Date | null;
  address?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  suburb?: string | null;
  state?: string | null;
  postcode?: string | null;
  gender?: string | null;
};

function isBlank(value: string | null | undefined): boolean {
  return !value || !String(value).trim();
}

function pickName(
  incoming: string | null | undefined,
  existing: string | null | undefined,
  protectPii: boolean
): string | undefined {
  const next = (incoming || "").trim();
  if (protectPii) {
    if (!isBlank(existing)) return undefined;
    return next || undefined;
  }
  return next || existing || undefined;
}

function pickOptionalString(
  incoming: string | null | undefined,
  existing: string | null | undefined,
  protectPii: boolean
): string | null | undefined {
  if (protectPii) {
    if (!isBlank(existing)) return undefined;
    if (incoming === undefined) return undefined;
    return incoming;
  }
  if (incoming === undefined) return undefined;
  return incoming ?? existing ?? null;
}

function pickOptionalDate(
  incoming: Date | null | undefined,
  existing: Date | null | undefined,
  protectPii: boolean
): Date | null | undefined {
  if (protectPii) {
    if (existing) return undefined;
    if (incoming === undefined) return undefined;
    return incoming;
  }
  if (incoming === undefined) return undefined;
  return incoming ?? existing ?? null;
}

/**
 * Profile fields for public membership activation.
 * Established members: only fill empty fields; never overwrite existing PII.
 * New / prospective users: apply submitted identity as before.
 */
export function buildProtectedActivationProfileUpdate(
  existing: ExistingProfileFields,
  input: ActivationProfileInput,
  protectPii: boolean
): Prisma.UserUpdateInput {
  const data: Prisma.UserUpdateInput = {};

  const firstName = pickName(input.firstName, existing.firstName, protectPii);
  if (firstName !== undefined) data.firstName = firstName;

  const lastName = pickName(input.lastName, existing.lastName, protectPii);
  if (lastName !== undefined) data.lastName = lastName;

  const phone = pickOptionalString(input.phone, existing.phone, protectPii);
  if (phone !== undefined) data.phone = phone;

  const dateOfBirth = pickOptionalDate(input.dateOfBirth, existing.dateOfBirth, protectPii);
  if (dateOfBirth !== undefined) data.dateOfBirth = dateOfBirth;

  const address = pickOptionalString(input.address, existing.address, protectPii);
  if (address !== undefined) data.address = address;

  const addressLine1 = pickOptionalString(input.addressLine1, existing.addressLine1, protectPii);
  if (addressLine1 !== undefined) data.addressLine1 = addressLine1;

  const addressLine2 = pickOptionalString(input.addressLine2, existing.addressLine2, protectPii);
  if (addressLine2 !== undefined) data.addressLine2 = addressLine2;

  const suburb = pickOptionalString(input.suburb, existing.suburb, protectPii);
  if (suburb !== undefined) data.suburb = suburb;

  const state = pickOptionalString(input.state, existing.state, protectPii);
  if (state !== undefined) data.state = state;

  const postcode = pickOptionalString(input.postcode, existing.postcode, protectPii);
  if (postcode !== undefined) data.postcode = postcode;

  if (input.gender === "MALE" || input.gender === "FEMALE") {
    if (!protectPii || isBlank(existing.gender)) {
      data.gender = input.gender;
    }
  }

  return data;
}

export const EXISTING_ACCOUNT_MESSAGE =
  "This contact already belongs to a Sanative account. Continue as that member, or verify with a different email or mobile to sign up someone else.";

export const PHONE_IN_USE_MESSAGE =
  "This mobile number already belongs to another Sanative account. Please use that person's own mobile, or continue with the account linked to this number.";
