import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ nextauth: string[] }> };

async function handleAuth(req: NextRequest, context: RouteContext) {
  try {
    return await handler(req, context);
  } catch (error) {
    const segments = (await context.params).nextauth ?? [];
    const action = segments[0];
    console.error("[next-auth] Handler error:", action, error);

    // Session polling must always return JSON, plain-text 500s cause CLIENT_FETCH_ERROR.
    if (req.method === "GET" && action === "session") {
      return Response.json({});
    }

    return Response.json(
      { error: "AuthenticationError", message: "Authentication request failed" },
      { status: 500 },
    );
  }
}

export { handleAuth as GET, handleAuth as POST };
