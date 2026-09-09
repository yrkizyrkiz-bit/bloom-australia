import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { webauthnRelyingParty } from "@/lib/webauthn/config";
import { storeWebAuthnChallenge } from "@/lib/webauthn/challenges";
import { setWebAuthnChallengeCookie } from "@/lib/webauthn/cookies";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role === "GP") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      passkeysEnabled: true,
      passkeys: { select: { credentialId: true, transports: true } },
    },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.passkeysEnabled) {
    return NextResponse.json({ error: "Face ID is disabled for this account" }, { status: 403 });
  }

  const { rpID, rpName } = webauthnRelyingParty(request.url);
  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: user.email,
    userDisplayName: `${user.firstName} ${user.lastName}`.trim(),
    userID: Uint8Array.from(new TextEncoder().encode(user.id)),
    attestationType: "none",
    excludeCredentials: user.passkeys.map((passkey) => ({
      id: passkey.credentialId,
      transports: passkey.transports,
    })),
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "preferred",
      userVerification: "required",
    },
    preferredAuthenticatorType: "localDevice",
  });

  const row = await storeWebAuthnChallenge({
    type: "register",
    challenge: options.challenge,
    userId: user.id,
    email: user.email,
  });
  await setWebAuthnChallengeCookie(row.id);

  return NextResponse.json(options);
}
