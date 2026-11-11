import { describe, expect, it } from "vitest";

import { PLANS, quote } from "@/lib/pricing";

describe("pricing", () => {
  const byId = Object.fromEntries(PLANS.map((p) => [p.id, quote(p, 330)]));

  it("monthly plan has no discount", () => {
    expect(byId.monthly).toMatchObject({ monthly: 330, total: 330, saving: 0, perDay: 10.85 });
  });
  it("3 months = 10% off", () => {
    expect(byId["3m"]).toMatchObject({ monthly: 297, total: 891, saving: 99, perDay: 9.76 });
  });
  it("6 months = 15% off", () => {
    expect(byId["6m"]).toMatchObject({ monthly: 280.5, total: 1683, saving: 297, perDay: 9.22 });
  });
  it("12 months = 25% off", () => {
    expect(byId["12m"]).toMatchObject({ monthly: 247.5, total: 2970, saving: 990, perDay: 8.14 });
  });
});
