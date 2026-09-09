import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import prisma from "@/lib/prisma";
import { webauthnRelyingParty } from "@/lib/webauthn/config";
import { storeWebAuthnChallenge } from "@/lib/webauthn/challenges";
import { setWebAuthnChallengeCookie } from "@/lib/webauthn/cookies";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";

  let allowCredentials: Array<{ id: string; transports?: string[] }> | undefined;
  let userId: string | null = null;
  if (email) {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: {
        id: true,
        passkeysEnabled: true,
        passkeys: { select: { credentialId: true, transports: true } },
      },
    });
    if (!user || !user.passkeysEnabled || user.passkeys.length === 0) {
      return NextResponse.json({ error: "Face ID is not set up for this account" }, { status: 400 });
    }
    userId = user.id;
    allowCredentials = user.passkeys.map((passkey) => ({
      id: passkey.credentialId,
      transports: passkey.transports,
    }));
  }

  const { rpID } = webauthnRelyingParty(request.url);
  const options = await generateAuthenticationOptions({
    rpID,
    allowCredentials,
    userVerification: "required",
  });

  const row = await storeWebAuthnChallenge({
    type: "login",
    challenge: options.challenge,
    userId,
    email: email || null,
  });
  await setWebAuthnChallengeCookie(row.id);

  return NextResponse.json(options);
}
