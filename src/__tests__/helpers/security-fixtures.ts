import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const SECURITY_TEST_PASSWORD = "security-test-pass";

export interface SecurityFixtures {
  patientA: { id: string; email: string };
  patientB: { id: string; email: string };
  doctorAssigned: { id: string; email: string };
  doctorOther: { id: string; email: string };
  bookingForPatientA: { id: string; intakeId: string; userId: string; doctorId: string };
}

let cached: SecurityFixtures | null = null;

export async function ensureSecurityFixtures(): Promise<SecurityFixtures> {
  if (cached) return cached;

  const passwordHash = await bcrypt.hash(SECURITY_TEST_PASSWORD, 12);

  const patientA = await prisma.user.upsert({
    where: { email: "security-test-patient-a@sanative.test" },
    update: { passwordHash },
    create: {
      email: "security-test-patient-a@sanative.test",
      passwordHash,
      firstName: "Security",
      lastName: "PatientA",
      role: "MEMBER",
      memberStatus: "MEMBER",
      gender: "FEMALE",
    },
    select: { id: true, email: true },
  });

  const patientB = await prisma.user.upsert({
    where: { email: "security-test-patient-b@sanative.test" },
    update: { passwordHash },
    create: {
      email: "security-test-patient-b@sanative.test",
      passwordHash,
      firstName: "Security",
      lastName: "PatientB",
      role: "MEMBER",
      memberStatus: "MEMBER",
      gender: "MALE",
    },
    select: { id: true, email: true },
  });

  const doctorAssigned = await prisma.user.upsert({
    where: { email: "security-test-doctor-a@sanative.test" },
    update: { passwordHash },
    create: {
      email: "security-test-doctor-a@sanative.test",
      passwordHash,
      firstName: "Security",
      lastName: "DoctorA",
      role: "DOCTOR",
      gender: "FEMALE",
    },
    select: { id: true, email: true },
  });

  const doctorOther = await prisma.user.upsert({
    where: { email: "security-test-doctor-b@sanative.test" },
    update: { passwordHash },
    create: {
      email: "security-test-doctor-b@sanative.test",
      passwordHash,
      firstName: "Security",
      lastName: "DoctorB",
      role: "DOCTOR",
      gender: "MALE",
    },
    select: { id: true, email: true },
  });

  const intakeId = `security-intake-${patientA.id}`;

  const booking = await prisma.consultationBooking.upsert({
    where: { id: `security-booking-${patientA.id}` },
    update: {
      userId: patientA.id,
      doctorId: doctorAssigned.id,
      intakeId,
      status: "BOOKING_CONFIRMED",
    },
    create: {
      id: `security-booking-${patientA.id}`,
      userId: patientA.id,
      doctorId: doctorAssigned.id,
      intakeId,
      scheduledAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "BOOKING_CONFIRMED",
      confirmedAt: new Date(),
    },
    select: { id: true, intakeId: true, userId: true, doctorId: true },
  });

  cached = {
    patientA,
    patientB,
    doctorAssigned,
    doctorOther,
    bookingForPatientA: {
      id: booking.id,
      intakeId: booking.intakeId!,
      userId: booking.userId!,
      doctorId: booking.doctorId!,
    },
  };

  return cached;
}

export async function disconnectSecurityFixtures() {
  await prisma.$disconnect();
}
