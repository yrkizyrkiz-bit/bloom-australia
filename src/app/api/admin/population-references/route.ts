import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireClinicalStaff } from "@/lib/auth/require-clinical-staff";
import { AU_POPULATION_DEFAULTS, type AuPopulationDataset } from "@/lib/au-population";
import { loadPopulationDataset } from "@/lib/au-population/load-dataset";

function isDataset(value: unknown): value is AuPopulationDataset {
  if (!value || typeof value !== "object") return false;
  const v = value as AuPopulationDataset;
  return Array.isArray(v.markers) && Array.isArray(v.sources);
}

export async function GET() {
  const auth = await requireClinicalStaff();
  if (auth.error) return auth.error;
  const loaded = await loadPopulationDataset();
  return NextResponse.json({
    dataset: loaded.dataset,
    defaults: AU_POPULATION_DEFAULTS,
    updatedAt: loaded.updatedAt,
    updatedBy: loaded.updatedBy,
    usingOverride: loaded.usingOverride,
  });
}

export async function PUT(request: Request) {
  const auth = await requireClinicalStaff();
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  if (!isDataset(body?.dataset)) {
    return NextResponse.json({ error: "Invalid dataset" }, { status: 400 });
  }

  const saved = await prisma.populationReferenceOverride.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      data: body.dataset,
      updatedBy: auth.userId,
    },
    update: {
      data: body.dataset,
      updatedBy: auth.userId,
    },
  });

  return NextResponse.json({
    dataset: saved.data,
    updatedAt: saved.updatedAt.toISOString(),
    updatedBy: saved.updatedBy,
    usingOverride: true,
  });
}

export async function DELETE() {
  const auth = await requireClinicalStaff();
  if (auth.error) return auth.error;

  await prisma.populationReferenceOverride.deleteMany({ where: { id: "default" } });
  return NextResponse.json({
    dataset: AU_POPULATION_DEFAULTS,
    updatedAt: null,
    usingOverride: false,
  });
}
