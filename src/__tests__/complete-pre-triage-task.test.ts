import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findUniquePreTriageTask,
  updatePreTriageTask,
  findManyPreTriageTask,
  updateManyPreTriageTask,
  updateUser,
  findUniqueConsultationBooking,
} = vi.hoisted(() => ({
  findUniquePreTriageTask: vi.fn(),
  updatePreTriageTask: vi.fn(),
  findManyPreTriageTask: vi.fn(),
  updateManyPreTriageTask: vi.fn(),
  updateUser: vi.fn(),
  findUniqueConsultationBooking: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    preTriageTask: {
      findUnique: findUniquePreTriageTask,
      update: updatePreTriageTask,
      findMany: findManyPreTriageTask,
      updateMany: updateManyPreTriageTask,
    },
    user: { update: updateUser },
    consultationBooking: { findUnique: findUniqueConsultationBooking },
  },
}));

describe("completePreTriageHandoff", () => {
  beforeEach(() => {
    findUniquePreTriageTask.mockReset();
    updatePreTriageTask.mockReset();
    findManyPreTriageTask.mockReset();
    updateManyPreTriageTask.mockReset();
    updateUser.mockReset();
    findUniqueConsultationBooking.mockReset();
  });

  it("completes the task and sibling tasks on the same booking", async () => {
    findUniquePreTriageTask.mockResolvedValue({
      id: "task-hair",
      patientId: "luna",
      bookingId: "booking-1",
      status: "PENDING",
    });
    updatePreTriageTask.mockResolvedValue({});
    findManyPreTriageTask.mockResolvedValue([{ id: "task-wh" }]);
    updateManyPreTriageTask.mockResolvedValue({ count: 1 });
    updateUser.mockResolvedValue({});

    const { completePreTriageHandoff } = await import(
      "@/lib/admin/complete-pre-triage-task"
    );
    const result = await completePreTriageHandoff({
      taskId: "task-hair",
      bookingId: "booking-1",
    });

    expect(result.completedTaskIds).toEqual(["task-hair", "task-wh"]);
    expect(updateUser).toHaveBeenCalledWith({
      where: { id: "luna" },
      data: { journeyStatus: "AWAITING_DOCTOR_DECISION" },
    });
  });

  it("bookingHasAssignedDoctor is true when doctorId is set", async () => {
    findUniqueConsultationBooking.mockResolvedValue({
      doctorId: "doc-1",
      doctorName: "Dr. Philip Seeley",
    });
    const { bookingHasAssignedDoctor } = await import(
      "@/lib/admin/complete-pre-triage-task"
    );
    await expect(bookingHasAssignedDoctor("booking-1")).resolves.toBe(true);
  });

  it("bookingHasAssignedDoctor is false without a doctor", async () => {
    findUniqueConsultationBooking.mockResolvedValue({
      doctorId: null,
      doctorName: null,
    });
    const { bookingHasAssignedDoctor } = await import(
      "@/lib/admin/complete-pre-triage-task"
    );
    await expect(bookingHasAssignedDoctor("booking-1")).resolves.toBe(false);
  });
});
