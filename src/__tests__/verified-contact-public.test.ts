import { describe, expect, it } from "vitest";
import { publicVerifiedContactIdentity } from "@/lib/auth/verified-contact-public";

const member = {
  id: "user_1",
  email: "jane@example.com",
  firstName: "Jane",
  lastName: "Smith",
  phone: "0416299091",
};

describe("publicVerifiedContactIdentity", () => {
  it("does not return another member's details for a mobile match", () => {
    const result = publicVerifiedContactIdentity({
      type: "phone",
      existingUser: member,
      isEstablished: true,
    });
    expect(result.phoneAlreadyRegistered).toBe(true);
    expect(result.bindUserId).toBeNull();
    expect(result.existingUser).toBeNull();
  });

  it("still returns the email account after that address is verified", () => {
    const result = publicVerifiedContactIdentity({
      type: "email",
      existingUser: member,
      isEstablished: true,
    });
    expect(result.phoneAlreadyRegistered).toBe(false);
    expect(result.bindUserId).toBe("user_1");
    expect(result.existingUser?.email).toBe("jane@example.com");
  });
});
