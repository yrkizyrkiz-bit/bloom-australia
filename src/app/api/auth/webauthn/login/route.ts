import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import prisma from "@/lib/prisma";
import { webauthnRelyingParty } from "@/lib/webauthn/config";
import { consumeWebAuthnChallengeById } from "@/lib/webauthn/challenges";
import { clearWebAuthnChallengeCookie, readWebAuthnChallengeCookie } from "@/lib/webauthn/cookies";
import { signWebAuthnLoginToken } from "@/lib/webauthn/tokens";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const challengeId = await readWebAuthnChallengeCookie();
  const stored = challengeId ? await consumeWebAuthnChallengeById(challengeId, "login") : null;
  await clearWebAuthnChallengeCookie();
  if (!stored) {
    return NextResponse.json({ error: "Face ID challenge expired. Try again." }, { status: 400 });
  }

  const body = await request.json();
  const credentialId = typeof body?.id === "string" ? body.id : "";
  const passkey = await prisma.passkey.findUnique({
    where: { credentialId },
    include: {
      user: {
        select: { id: true, email: true, passkeysEnabled: true },
      },
    },
  });
  if (!passkey || !passkey.user.passkeysEnabled) {
    return NextResponse.json({ error: "Face ID is not set up for this account" }, { status: 400 });
  }

  const { rpID, origin } = webauthnRelyingParty(request.url);
  const verification = await verifyAuthenticationResponse({
    response: body,
    expectedChallenge: stored.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
    credential: {
      id: passkey.credentialId,
      publicKey: new Uint8Array(passkey.publicKey),
      counter: Number(passkey.counter),
      transports: passkey.transports as Array<"usb" | "ble" | "nfc" | "internal" | "hybrid">,
    },
  });

  if (!verification.verified) {
    return NextResponse.json({ error: "Face ID could not be verified" }, { status: 400 });
  }

  await prisma.passkey.update({
    where: { id: passkey.id },
    data: {
      counter: BigInt(verification.authenticationInfo.newCounter),
      lastUsedAt: new Date(),
    },
  });

  return NextResponse.json({
    webauthnToken: signWebAuthnLoginToken(passkey.user.id, passkey.user.email),
  });
}
