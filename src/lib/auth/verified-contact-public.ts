export type ExistingVerifiedUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
};

export type PublicVerifiedContactIdentity = {
  existingUser: (ExistingVerifiedUser & { isEstablished: boolean }) | null;
  phoneAlreadyRegistered: boolean;
  bindUserId: string | null;
};

/**
 * What /api/auth/verify-code may return to the browser.
 * Phone matches must never leak another member's name, email, or id.
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
      id: input.existingUser.id,
      email: input.existingUser.email,
      firstName: input.existingUser.firstName,
      lastName: input.existingUser.lastName,
      phone: input.existingUser.phone,
      isEstablished: input.isEstablished,
    },
    phoneAlreadyRegistered: false,
    bindUserId: input.existingUser.id,
  };
}
