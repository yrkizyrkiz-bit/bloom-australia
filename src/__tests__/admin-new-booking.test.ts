import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

describe("admin New Booking", () => {
  const bookingsPage = readFileSync(
    join(process.cwd(), "src/app/admin/bookings/page.tsx"),
    "utf8"
  );
  const bookingsApi = readFileSync(
    join(process.cwd(), "src/app/api/admin/bookings/route.ts"),
    "utf8"
  );
  const manage = readFileSync(join(process.cwd(), "src/lib/booking-manage.ts"), "utf8");

  it("opens a create dialog from the New Booking button", () => {
    expect(bookingsPage).toContain("NewBookingDialog");
    expect(bookingsPage).toContain('onClick={() => setShowNewBooking(true)}');
  });

  it("creates a confirmed consultation booking behind a staff guard", () => {
    expect(bookingsApi).toContain("requireClinicalStaff");
    expect(bookingsApi).toContain("createStaffConsultationBooking");
    expect(manage).toContain("status: \"BOOKING_CONFIRMED\"");
    expect(manage).toMatch(/export async function createStaffConsultationBooking/);
  });
});
