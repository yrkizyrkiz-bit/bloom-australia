import { NextResponse } from "next/server";

export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === "production";
}

/** Block dev-only / diagnostic routes in production (returns 404). */
export function blockDevOnlyRouteInProduction() {
  if (isProductionEnvironment()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return null;
}
