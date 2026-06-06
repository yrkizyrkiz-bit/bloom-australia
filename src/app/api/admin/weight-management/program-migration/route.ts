import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getMigrationStatus,
  migrateMemberPrograms,
} from "@/lib/program/migrate-program";

function requireAdmin(session: { user?: { role?: string } } | null) {
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return false;
  }
  return true;
}

/** GET — migration status summary */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!requireAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const status = await getMigrationStatus();
    const preview = await migrateMemberPrograms({ dryRun: true, backfillTasks: false });

    return NextResponse.json({
      success: true,
      status,
      preview: {
        wouldCreate: preview.created,
        wouldUpgrade: preview.upgraded,
        wouldSync: preview.synced,
        wouldSkip: preview.skipped,
        sample: preview.items.slice(0, 10),
      },
    });
  } catch (error) {
    console.error("[program-migration GET]", error);
    return NextResponse.json({ error: "Failed to load migration status" }, { status: 500 });
  }
}

/** POST — run migration (preview or execute) */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!requireAdmin(session)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      dryRun = true,
      userId,
      backfillTasks = true,
    } = body as {
      dryRun?: boolean;
      userId?: string;
      backfillTasks?: boolean;
    };

    const result = await migrateMemberPrograms({
      dryRun: Boolean(dryRun),
      userId: userId || undefined,
      backfillTasks: Boolean(backfillTasks),
    });

    if (!dryRun && session?.user?.id && (result.created > 0 || result.upgraded > 0)) {
      const { prisma } = await import("@/lib/prisma");
      await prisma.automationLog.create({
        data: {
          userId: session.user.id,
          automationType: "program_migration_batch",
          triggerEvent: "admin_panel",
          channel: "admin_panel",
          status: "completed",
          metadata: {
            created: result.created,
            upgraded: result.upgraded,
            synced: result.synced,
            skipped: result.skipped,
            tasksExtended: result.tasksExtended,
            errors: result.errors.length,
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      result,
      message: dryRun
        ? "Preview complete — no changes written"
        : `Migration complete: ${result.created} created, ${result.upgraded} upgraded`,
    });
  } catch (error) {
    console.error("[program-migration POST]", error);
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
  }
}
