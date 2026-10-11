import {
  isEstablishedMember,
  type MemberIdentitySignals,
} from "@/lib/auth/member-identity-guard";

/** Public email check. No name, phone, or journey is included. */
export type PublicEmailState = "new" | "unfinished" | "member";

export type PublicEmailCheckBody = {
  state?: string;
  exists?: boolean;
};

/**
 * new: no account.
 * unfinished: potential member, signup or payment not finished.
 * member: password, active subscription, paid journey, or MEMBER status.
 */
export function classifyPublicEmailAccount(
  user: MemberIdentitySignals | null | undefined
): PublicEmailState {
  if (!user) return "new";
  if (isEstablishedMember(user)) return "member";
  return "unfinished";
}

/** What the weight-management email gate should do with a check-email body. */
export function emailGateAction(
  body: PublicEmailCheckBody | null | undefined
): "continue" | "resume" | "member" {
  if (body?.state === "new") return "continue";
  if (body?.state === "unfinished") return "resume";
  if (body?.state === "member") return "member";
  if (body?.exists === true) return "member";
  return "continue";
}
