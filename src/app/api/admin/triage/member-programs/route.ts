import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PortalPurchaseNote = {
  memberAddedProgram?: boolean;
  source?: string;
  label?: string;
  programKey?: string;
  panelTier?: string;
  addOrganCare?: boolean;
  priceLabel?: string;
  paymentIntentId?: string;
};

function parseNote(notes: string | null): PortalPurchaseNote | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes) as PortalPurchaseNote;
    return parsed.memberAddedProgram ? parsed : null;
  } catch {
    return null;
  }
}

/** GET /api/admin/triage/member-programs — portal upsell purchase queue */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "CARE_PARTNER", "DOCTOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tasks = await prisma.preTriageTask.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const patientIds = [...new Set(tasks.map((t) => t.patientId))];
    const patients = await prisma.user.findMany({
      where: { id: { in: patientIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        assignedCarePartnerId: true,
      },
    });
    const patientMap = new Map(patients.map((p) => [p.id, p]));

    const items = tasks
      .map((task) => {
        const meta = parseNote(task.notes);
        if (!meta) return null;
        return {
          taskId: task.id,
          dueDate: task.dueDate,
          createdAt: task.createdAt,
          patient: patientMap.get(task.patientId) ?? null,
          purchase: meta,
        };
      })
      .filter(Boolean);

    return NextResponse.json({ items });
  } catch (error) {
    console.error("[admin/triage/member-programs]", error);
    return NextResponse.json({ error: "Failed to load queue" }, { status: 500 });
  }
}
