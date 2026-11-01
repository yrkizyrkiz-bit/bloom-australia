import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { SANATIVE_LEGAL } from "@/lib/legal/constants";

const { createEmailDraft, sendEmail, enforceDbRateLimits, afterTasks } = vi.hoisted(() => ({
  createEmailDraft: vi.fn(),
  sendEmail: vi.fn(),
  enforceDbRateLimits: vi.fn(),
  afterTasks: [] as Array<() => unknown>,
}));

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    after: (task: () => unknown) => {
      afterTasks.push(task);
    },
  };
});

vi.mock("@/lib/email-draft", () => ({
  createEmailDraft,
}));

vi.mock("@/lib/email", () => ({
  sendEmail,
}));

vi.mock("@/lib/security/rate-limit-http", () => ({
  enforceDbRateLimits,
  getClientIp: () => "127.0.0.1",
  rateLimitExceededResponse: () =>
    new Response(JSON.stringify({ error: "Too many requests. Please try again later." }), {
      status: 429,
    }),
}));

import {
  composeOrganAssessmentVisitorEmail,
  handleOrganAssessmentResultsPost,
} from "@/lib/promo/handle-organ-assessment-results";

function requestWith(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/public/organ-assessment-results", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function flushBackgroundEmail() {
  const pending = afterTasks.splice(0);
  await Promise.all(pending.map((task) => Promise.resolve().then(task)));
}

const validBody = {
  firstName: "Alex",
  email: "alex@example.com",
  consent: true,
  tier: "moderate",
  drivers: ["Belly fat"],
};

describe("organ assessment result emails", () => {
  beforeEach(() => {
    createEmailDraft.mockReset();
    sendEmail.mockReset();
    enforceDbRateLimits.mockReset();
    afterTasks.splice(0);
    enforceDbRateLimits.mockResolvedValue({ allowed: true });
    createEmailDraft.mockResolvedValue({ success: true, method: "imap", mailbox: "[Gmail]/Drafts" });
    sendEmail.mockResolvedValue({ success: true });
  });

  it("composes the visitor-facing liver/heart/kidney email", () => {
    const liver = composeOrganAssessmentVisitorEmail({
      organ: "liver",
      firstName: "Alex",
      email: "alex@example.com",
      tier: "moderate",
      drivers: ["Belly fat"],
    });
    expect(liver.to).toBe("alex@example.com");
    expect(liver.subject).toBe("Alex, your Sanative liver check");
    expect(liver.html).toContain("A few things are worth checking.");
    expect(liver.html).toContain("Belly fat");
    expect(liver.html).toContain("Check My Liver Risk");

    const heart = composeOrganAssessmentVisitorEmail({
      organ: "heart",
      firstName: "Alex",
      email: "alex@example.com",
      tier: "high",
      drivers: [],
    });
    expect(heart.subject).toBe("Alex, your Sanative heart check");
    expect(heart.html).toContain("Check My Heart Risk");

    const kidney = composeOrganAssessmentVisitorEmail({
      organ: "kidney",
      firstName: "Alex",
      email: "alex@example.com",
      tier: "low",
      drivers: [],
    });
    expect(kidney.subject).toBe("Alex, your Sanative kidney check");
    expect(kidney.html).toContain("Check My Kidneys Risk");
  });

  it("records the lead immediately without waiting for the mailbox draft", async () => {
    createEmailDraft.mockImplementation(() => new Promise(() => {}));

    const response = await handleOrganAssessmentResultsPost(requestWith(validBody), "liver");
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
    expect(createEmailDraft).not.toHaveBeenCalled();
    expect(afterTasks).toHaveLength(1);
  });

  it.each(["liver", "heart", "kidney"] as const)(
    "saves a %s draft and does not email the visitor",
    async (organ) => {
      const response = await handleOrganAssessmentResultsPost(requestWith(validBody), organ);
      const payload = await response.json();

      expect(response.status).toBe(200);
      expect(payload).toEqual({ ok: true });
      expect(createEmailDraft).not.toHaveBeenCalled();

      await flushBackgroundEmail();
      expect(createEmailDraft).toHaveBeenCalledOnce();
      expect(createEmailDraft.mock.calls[0][0]).toMatchObject({
        to: "alex@example.com",
        process: "crm",
        subject: `Alex, your Sanative ${organ} check`,
      });
      expect(sendEmail).not.toHaveBeenCalled();
    }
  );

  it("leaves a staff review copy only when the mailbox draft cannot be created", async () => {
    createEmailDraft.mockResolvedValue({ success: false, error: "IMAP login failed" });

    const response = await handleOrganAssessmentResultsPost(requestWith(validBody), "liver");
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
    expect(sendEmail).not.toHaveBeenCalled();

    await flushBackgroundEmail();
    expect(sendEmail).toHaveBeenCalledOnce();
    expect(sendEmail.mock.calls[0][0]).toMatchObject({
      to: SANATIVE_LEGAL.supportEmail,
      replyTo: "alex@example.com",
      process: "crm",
    });
    expect(sendEmail.mock.calls[0][0].subject).toMatch(/DRAFT FOR REVIEW/);
    expect(sendEmail.mock.calls[0][0].body).toContain("not sent to the visitor");
    expect(sendEmail.mock.calls[0][0].to).not.toBe("alex@example.com");
  });

  it("still records the lead when draft and review email both fail later", async () => {
    createEmailDraft.mockResolvedValue({ success: false, error: "IMAP login failed" });
    sendEmail.mockResolvedValue({ success: false, error: "transport down" });

    const response = await handleOrganAssessmentResultsPost(requestWith(validBody), "heart");
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });

    await flushBackgroundEmail();
    expect(createEmailDraft).toHaveBeenCalledOnce();
    expect(sendEmail).toHaveBeenCalledOnce();
  });

  it("still requires name, email, consent and a completed quiz", async () => {
    const missingName = await handleOrganAssessmentResultsPost(
      requestWith({ ...validBody, firstName: "" }),
      "kidney"
    );
    expect(missingName.status).toBe(400);
    expect(createEmailDraft).not.toHaveBeenCalled();
    expect(afterTasks).toHaveLength(0);

    const noConsent = await handleOrganAssessmentResultsPost(
      requestWith({ ...validBody, consent: false }),
      "kidney"
    );
    expect(noConsent.status).toBe(400);

    const incomplete = await handleOrganAssessmentResultsPost(
      requestWith({ ...validBody, tier: null }),
      "kidney"
    );
    expect(incomplete.status).toBe(400);
  });
});
