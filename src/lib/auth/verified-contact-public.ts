export type ExistingVerifiedUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
};

export type PublicExistingUser = {
  isEstablished: boolean;
};

export type PublicVerifiedContactIdentity = {
  existingUser: PublicExistingUser | null;
  phoneAlreadyRegistered: boolean;
  bindUserId: string | null;
};

/**
 * What /api/auth/verify-code may return to the browser.
 * Phone matches must never leak another member's name, email, or id.
 * Email matches must not return name or phone — only whether they are
 * already a member, so checkout can send them to the portal.
 */
export function publicVerifiedContactIdentity(input: {
  type: "email" | "phone";
  existingUser: ExistingVerifiedUser | null;
  isEstablished: boolean;
}): PublicVerifiedContactIdentity {
  if (input.type === "phone") {
    return {
      existingUser: null,
      phoneAlreadyRegistered: Boolean(input.existingUser),
      bindUserId: null,
    };
  }

  if (!input.existingUser) {
    return {
      existingUser: null,
      phoneAlreadyRegistered: false,
      bindUserId: null,
    };
  }

  return {
    existingUser: {
      isEstablished: input.isEstablished,
    },
    phoneAlreadyRegistered: false,
    bindUserId: input.existingUser.id,
  };
}
