import { beforeEach, describe, expect, it, vi } from "vitest";

const { findFirstUser } = vi.hoisted(() => ({
  findFirstUser: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findFirst: findFirstUser },
  },
}));

import {
  assertPhoneAvailableForAccount,
  findEstablishedPhoneOwner,
} from "@/lib/auth/assert-phone-available";
import { PHONE_IN_USE_MESSAGE } from "@/lib/auth/member-identity-guard";

describe("findEstablishedPhoneOwner", () => {
  beforeEach(() => {
    findFirstUser.mockReset();
  });

  it("returns null for empty phone", async () => {
    await expect(findEstablishedPhoneOwner(null, null)).resolves.toBeNull();
    expect(findFirstUser).not.toHaveBeenCalled();
  });

  it("returns the other established owner when present", async () => {
    findFirstUser.mockResolvedValue({
      id: "maria",
      email: "maria@example.com",
      firstName: "Maria",
      lastName: "Test",
      passwordHash: "hash",
      subscriptionStatus: "ACTIVE",
      journeyStatus: "ACTIVE",
      memberStatus: "MEMBER",
    });

    await expect(findEstablishedPhoneOwner("0412345678", "albus")).resolves.toEqual({
      id: "maria",
      email: "maria@example.com",
      firstName: "Maria",
      lastName: "Test",
    });
  });
});

describe("assertPhoneAvailableForAccount", () => {
  beforeEach(() => {
    findFirstUser.mockReset();
  });

  it("allows empty phone", async () => {
    await expect(assertPhoneAvailableForAccount(null, null)).resolves.toBeUndefined();
    expect(findFirstUser).not.toHaveBeenCalled();
  });

  it("allows phone when no other established owner exists", async () => {
    findFirstUser.mockResolvedValue(null);
    await expect(
      assertPhoneAvailableForAccount("0412345678", "user_new")
    ).resolves.toBeUndefined();
  });

  it("rejects phone owned by another established member", async () => {
    findFirstUser.mockResolvedValue({
      id: "maria",
      email: "maria@example.com",
      firstName: "Maria",
      lastName: "Test",
      passwordHash: "hash",
      subscriptionStatus: "ACTIVE",
      journeyStatus: "ACTIVE",
      memberStatus: "MEMBER",
    });

    await expect(
      assertPhoneAvailableForAccount("0412345678", "friend_user")
    ).rejects.toThrow(PHONE_IN_USE_MESSAGE);
  });

  it("allows the same account to keep its own phone", async () => {
    findFirstUser.mockResolvedValue(null);
    await assertPhoneAvailableForAccount("0412345678", "maria");
    expect(findFirstUser).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { not: "maria" },
        }),
      })
    );
  });
});
