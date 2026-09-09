import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { webauthnRelyingParty } from "@/lib/webauthn/config";
import { consumeWebAuthnChallengeById } from "@/lib/webauthn/challenges";
import { clearWebAuthnChallengeCookie, readWebAuthnChallengeCookie } from "@/lib/webauthn/cookies";
import { deviceNameFromUserAgent } from "@/lib/webauthn/device";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role === "GP") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passkeysEnabled: true },
  });
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.passkeysEnabled) {
    return NextResponse.json({ error: "Face ID is disabled for this account" }, { status: 403 });
  }

  const challengeId = await readWebAuthnChallengeCookie();
  const stored = challengeId ? await consumeWebAuthnChallengeById(challengeId, "register") : null;
  await clearWebAuthnChallengeCookie();
  if (!stored || stored.userId !== user.id) {
    return NextResponse.json({ error: "Face ID challenge expired. Try again." }, { status: 400 });
  }

  const body = await request.json();
  const { rpID, origin } = webauthnRelyingParty(request.url);
  const verification = await verifyRegistrationResponse({
    response: body,
    expectedChallenge: stored.challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
  });

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "Could not enable Face ID" }, { status: 400 });
  }

  const { credential } = verification.registrationInfo;
  const passkey = await prisma.passkey.create({
    data: {
      userId: user.id,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey),
      counter: BigInt(credential.counter),
      deviceName: deviceNameFromUserAgent(request.headers.get("user-agent") || ""),
      transports: credential.transports ?? [],
    },
    select: { id: true, deviceName: true, createdAt: true, lastUsedAt: true },
  });

  return NextResponse.json({ passkey });
}
