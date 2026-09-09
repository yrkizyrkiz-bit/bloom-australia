import { cookies } from "next/headers";
import { WEBAUTHN_CHALLENGE_COOKIE } from "@/lib/webauthn/challenges";

export async function setWebAuthnChallengeCookie(id: string) {
  const store = await cookies();
  store.set(WEBAUTHN_CHALLENGE_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 5 * 60,
    secure: process.env.NEXTAUTH_URL?.startsWith("https://") === true,
  });
}

export async function readWebAuthnChallengeCookie() {
  const store = await cookies();
  return store.get(WEBAUTHN_CHALLENGE_COOKIE)?.value || null;
}

export async function clearWebAuthnChallengeCookie() {
  const store = await cookies();
  store.delete(WEBAUTHN_CHALLENGE_COOKIE);
}
