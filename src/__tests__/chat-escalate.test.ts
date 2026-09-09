import { describe, expect, test } from "bun:test";
import {
  ESCALATE_MARKER,
  memberRequestedCareTeam,
  shouldGeorgeRespond,
  stripEscalateMarker,
} from "@/lib/chat/escalate-to-care-team";

describe("care team escalation helpers", () => {
  test("strips escalate marker from George replies", () => {
    const { cleanText, shouldEscalate } = stripEscalateMarker(
      `I'll get a care partner in now.\n${ESCALATE_MARKER}`
    );
    expect(shouldEscalate).toBe(true);
    expect(cleanText).toBe("I'll get a care partner in now.");
    expect(cleanText.includes(ESCALATE_MARKER)).toBe(false);
  });

  test("detects member requests for a care partner", () => {
    expect(memberRequestedCareTeam("Can I talk to a care partner please?")).toBe(true);
    expect(memberRequestedCareTeam("I want to speak to a real person")).toBe(true);
    expect(memberRequestedCareTeam("What should I eat for lunch?")).toBe(false);
  });

  test("George keeps responding while waiting for a care partner", () => {
    expect(
      shouldGeorgeRespond({ status: "WAITING", isAiHandled: false, coachId: null })
    ).toBe(true);
    expect(
      shouldGeorgeRespond({ status: "WAITING", isAiHandled: true, coachId: null })
    ).toBe(true);
    expect(
      shouldGeorgeRespond({ status: "ACTIVE", isAiHandled: false, coachId: "coach-1" })
    ).toBe(false);
    expect(
      shouldGeorgeRespond({ status: "AI_HANDLING", isAiHandled: true, coachId: null })
    ).toBe(true);
  });
});
