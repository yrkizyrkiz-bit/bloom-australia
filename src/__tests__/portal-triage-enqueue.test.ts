import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findFirstPreTriageTask,
  createPreTriageTask,
  findUniqueUser,
  findFirstUser,
  findFirstBooking,
  createNotification,
} = vi.hoisted(() => ({
  findFirstPreTriageTask: vi.fn(),
  createPreTriageTask: vi.fn(),
  findUniqueUser: vi.fn(),
  findFirstUser: vi.fn(),
  findFirstBooking: vi.fn(),
  createNotification: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    preTriageTask: {
      findFirst: findFirstPreTriageTask,
      create: createPreTriageTask,
    },
    user: {
      findUnique: findUniqueUser,
      findFirst: findFirstUser,
    },
    consultationBooking: {
      findFirst: findFirstBooking,
    },
    notification: {
      create: createNotification,
    },
  },
}));

import { enqueuePortalPurchaseTriage } from "@/lib/portal/triage-enqueue";

describe("enqueuePortalPurchaseTriage", () => {
  beforeEach(() => {
    findFirstPreTriageTask.mockReset();
    createPreTriageTask.mockReset();
    findUniqueUser.mockReset();
    findFirstUser.mockReset();
    findFirstBooking.mockReset();
    createNotification.mockReset();
    createNotification.mockResolvedValue({});
    createPreTriageTask.mockResolvedValue({ id: "task_1" });
    findFirstUser.mockResolvedValue({ id: "cp_1" });
    findUniqueUser.mockResolvedValue({
      firstName: "Tara",
      lastName: "Test",
      assignedCarePartnerId: null,
      journeyStatus: "ACTIVE",
    });
    findFirstBooking.mockResolvedValue(null);
    findFirstPreTriageTask.mockResolvedValue(null);
  });

  it("enqueues clinical portal_upsell even when not in triage", async () => {
    const result = await enqueuePortalPurchaseTriage({
      source: "portal_upsell",
      userId: "user_1",
      paymentIntentId: "pi_wm_1",
      programKey: "WEIGHT_MANAGEMENT",
      priceLabel: "$149/mo",
      label: "Weight Management ($149/mo)",
    });

    expect(result).toEqual({ enqueued: true });
    expect(createPreTriageTask).toHaveBeenCalledTimes(1);
    const notes = JSON.parse(createPreTriageTask.mock.calls[0][0].data.notes);
    expect(notes.programKey).toBe("WEIGHT_MANAGEMENT");
    expect(notes.memberAddedProgram).toBe(true);
    expect(findFirstBooking).not.toHaveBeenCalled();
  });

  it("skips biomarkers when there is no consult in triage", async () => {
    const result = await enqueuePortalPurchaseTriage({
      source: "portal_biomarkers",
      userId: "user_1",
      paymentIntentId: "pi_bio_1",
      panelTier: "essential",
      priceLabel: "$199",
      label: "Essential Biomarkers",
    });

    expect(result).toEqual({ enqueued: false, reason: "no_consult_in_triage" });
    expect(createPreTriageTask).not.toHaveBeenCalled();
  });

  it("is idempotent on paymentIntentId", async () => {
    findFirstPreTriageTask.mockResolvedValue({ id: "existing_task" });

    const result = await enqueuePortalPurchaseTriage({
      source: "portal_upsell",
      userId: "user_1",
      paymentIntentId: "pi_wm_1",
      programKey: "WOMENS_HEALTH_SEXUAL",
      priceLabel: "$99/mo",
      label: "Women's Wellness",
    });

    expect(result).toEqual({ enqueued: false, reason: "already_enqueued" });
    expect(createPreTriageTask).not.toHaveBeenCalled();
  });

  it("enqueues biomarkers when member already has a consult in triage", async () => {
    findUniqueUser
      .mockResolvedValueOnce({ journeyStatus: "PRE_TRIAGE_PENDING" })
      .mockResolvedValueOnce({
        firstName: "Tara",
        lastName: "Test",
        assignedCarePartnerId: "cp_1",
      });
    findFirstBooking.mockResolvedValue({ id: "booking_1" });

    const result = await enqueuePortalPurchaseTriage({
      source: "portal_biomarkers",
      userId: "user_1",
      paymentIntentId: "pi_bio_2",
      panelTier: "essential",
      priceLabel: "$199",
      label: "Essential Biomarkers",
    });

    expect(result).toEqual({ enqueued: true });
    expect(createPreTriageTask).toHaveBeenCalledTimes(1);
  });
});
