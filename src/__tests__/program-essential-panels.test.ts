import { describe, expect, it } from "vitest";
import {
  clampProgramForGender,
  programVisibleForGender,
  visibleProgramEssentialPanels,
} from "@/lib/program-essential-panels";

describe("program essential panels by gender", () => {
  it("hides Women's Health for male members", () => {
    const slugs = visibleProgramEssentialPanels("male").map((panel) => panel.slug);
    expect(slugs).toEqual(["WEIGHT_MANAGEMENT", "HAIR_LOSS", "MENS_HEALTH"]);
    expect(programVisibleForGender("WOMENS_HEALTH", "male")).toBe(false);
    expect(clampProgramForGender("WOMENS_HEALTH", "male")).toBe("WEIGHT_MANAGEMENT");
  });

  it("hides Men's Health for female members", () => {
    const slugs = visibleProgramEssentialPanels("female").map((panel) => panel.slug);
    expect(slugs).toEqual(["WEIGHT_MANAGEMENT", "HAIR_LOSS", "WOMENS_HEALTH"]);
    expect(programVisibleForGender("MENS_HEALTH", "female")).toBe(false);
    expect(clampProgramForGender("MENS_HEALTH", "female")).toBe("WEIGHT_MANAGEMENT");
  });

  it("keeps Weight and Hair for both sexes", () => {
    expect(programVisibleForGender("WEIGHT_MANAGEMENT", "male")).toBe(true);
    expect(programVisibleForGender("HAIR_LOSS", "female")).toBe(true);
    expect(clampProgramForGender("HAIR_LOSS", "male")).toBe("HAIR_LOSS");
  });
});
