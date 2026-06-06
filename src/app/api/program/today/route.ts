import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getMemberProgramState } from "@/lib/program/member-program-state";
import { SIDE_EFFECT_SYMPTOMS } from "@/lib/program/side-effects";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const state = await getMemberProgramState(session.user.id);

    if (!state) {
      return NextResponse.json({
        success: true,
        hasProgram: false,
        message: "Program starts when your prescription is written.",
      });
    }

    return NextResponse.json({
      success: true,
      hasProgram: true,
      ...state,
      symptomOptions: SIDE_EFFECT_SYMPTOMS,
    });
  } catch (error) {
    console.error("[program/today]", error);
    return NextResponse.json({ error: "Failed to load program" }, { status: 500 });
  }
}
