import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding GP Referral System...\n");

  // 1. Create Care Partners
  console.log("Creating care partners...");
  const carePartner1 = await prisma.carePartner.upsert({
    where: { email: "emma.wilson@sanative.com.au" },
    update: {},
    create: {
      firstName: "Emma",
      lastName: "Wilson",
      email: "emma.wilson@sanative.com.au",
      programs: ["kidney-health", "fatty-liver", "heart-health"],
      maxPatients: 50,
      active: true,
    },
  });

  const carePartner2 = await prisma.carePartner.upsert({
    where: { email: "james.chen@sanative.com.au" },
    update: {},
    create: {
      firstName: "James",
      lastName: "Chen",
      email: "james.chen@sanative.com.au",
      programs: ["weight-management", "diabetes-care", "metabolic-health"],
      maxPatients: 50,
      active: true,
    },
  });

  const carePartner3 = await prisma.carePartner.upsert({
    where: { email: "sarah.thompson@sanative.com.au" },
    update: {},
    create: {
      firstName: "Sarah",
      lastName: "Thompson",
      email: "sarah.thompson@sanative.com.au",
      programs: ["womens-health", "general-health"],
      maxPatients: 40,
      active: true,
    },
  });

  console.log(`  ✓ Created ${3} care partners`);

  // 2. Create Test Clinics
  console.log("\nCreating test clinics...");
  const clinic1 = await prisma.clinic.upsert({
    where: { leadGpEmail: "dr.johnson@greenfieldmedical.com.au" },
    update: {},
    create: {
      name: "Greenfield Medical Centre",
      address: "123 Health Street",
      suburb: "Greenslopes",
      state: "QLD",
      postcode: "4120",
      leadGpName: "Dr. Sarah Johnson",
      leadGpEmail: "dr.johnson@greenfieldmedical.com.au",
      leadGpMobile: "0412345678",
      qrToken: "GRN12345AB",
      programs: ["kidney-health", "fatty-liver", "heart-health", "weight-management"],
      status: "ACTIVE",
    },
  });

  const clinic2 = await prisma.clinic.upsert({
    where: { leadGpEmail: "dr.smith@cityhealth.com.au" },
    update: {},
    create: {
      name: "City Health Clinic",
      address: "456 Wellness Avenue",
      suburb: "Brisbane City",
      state: "QLD",
      postcode: "4000",
      leadGpName: "Dr. Michael Smith",
      leadGpEmail: "dr.smith@cityhealth.com.au",
      leadGpMobile: "0423456789",
      qrToken: "CTY67890CD",
      programs: ["kidney-health", "diabetes-care", "womens-health"],
      status: "ACTIVE",
    },
  });

  console.log(`  ✓ Created ${2} test clinics`);

  // 3. Create QR Scan Events for stats
  console.log("\nCreating QR scan events...");
  const scanDates = [
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
    new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  ];

  for (const date of scanDates) {
    await prisma.qrScanEvent.create({
      data: {
        clinicId: clinic1.id,
        scannedAt: date,
        converted: Math.random() > 0.7, // 30% conversion rate
      },
    });
  }

  // Additional scans for clinic 2
  for (let i = 0; i < 5; i++) {
    await prisma.qrScanEvent.create({
      data: {
        clinicId: clinic2.id,
        scannedAt: new Date(Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000),
        converted: Math.random() > 0.6,
      },
    });
  }

  console.log(`  ✓ Created QR scan events`);

  // 4. Create Test Members
  console.log("\nCreating test members...");
  const membershipEnd = new Date();
  membershipEnd.setFullYear(membershipEnd.getFullYear() + 1);

  const member1 = await prisma.programMember.upsert({
    where: { email: "sarah.mitchell@example.com" },
    update: {},
    create: {
      firstName: "Sarah",
      lastName: "Mitchell",
      email: "sarah.mitchell@example.com",
      mobile: "0412345111",
      dob: new Date("1985-06-15"),
      program: "kidney-health",
      clinicId: clinic1.id,
      carePartnerId: carePartner1.id,
      membershipStatus: "ACTIVE",
      membershipEnd,
      intakeData: {
        hasType2Diabetes: "no",
        hasHighBP: "yes",
        hasOrganIssues: "no",
        takingMedications: "yes",
        primaryConcern: "kidney",
      },
    },
  });

  const member2 = await prisma.programMember.upsert({
    where: { email: "james.taylor@example.com" },
    update: {},
    create: {
      firstName: "James",
      lastName: "Taylor",
      email: "james.taylor@example.com",
      mobile: "0412345222",
      dob: new Date("1978-03-22"),
      program: "fatty-liver",
      clinicId: clinic1.id,
      carePartnerId: carePartner1.id,
      membershipStatus: "ACTIVE",
      membershipEnd,
      intakeData: {
        hasType2Diabetes: "yes",
        hasHighBP: "yes",
        hasOrganIssues: "no",
        takingMedications: "yes",
        primaryConcern: "liver",
      },
    },
  });

  const member3 = await prisma.programMember.upsert({
    where: { email: "emma.lee@example.com" },
    update: {},
    create: {
      firstName: "Emma",
      lastName: "Lee",
      email: "emma.lee@example.com",
      mobile: "0412345333",
      dob: new Date("1990-11-08"),
      program: "weight-management",
      clinicId: clinic1.id,
      carePartnerId: carePartner2.id,
      membershipStatus: "ACTIVE",
      membershipEnd,
      intakeData: {
        hasType2Diabetes: "not sure",
        hasHighBP: "no",
        hasOrganIssues: "no",
        takingMedications: "no",
        primaryConcern: "weight",
      },
    },
  });

  console.log(`  ✓ Created ${3} test members`);

  // 5. Create Biomarker Results
  console.log("\nCreating biomarker results...");
  const biomarkerData = [
    { name: "eGFR", category: "Kidney", value: 72, unit: "mL/min/1.73m²", status: "BORDERLINE", referenceLow: 90, referenceHigh: 120 },
    { name: "Creatinine", category: "Kidney", value: 98, unit: "μmol/L", status: "NORMAL", referenceLow: 60, referenceHigh: 110 },
    { name: "BUN", category: "Kidney", value: 5.8, unit: "mmol/L", status: "NORMAL", referenceLow: 2.5, referenceHigh: 7.1 },
    { name: "Potassium", category: "Electrolytes", value: 4.2, unit: "mmol/L", status: "NORMAL", referenceLow: 3.5, referenceHigh: 5.0 },
    { name: "Albumin (urine)", category: "Kidney", value: 35, unit: "mg/L", status: "BORDERLINE", referenceLow: 0, referenceHigh: 30 },
  ];

  for (const marker of biomarkerData) {
    await prisma.programBiomarkerResult.create({
      data: {
        memberId: member1.id,
        biomarkerName: marker.name,
        category: marker.category,
        value: marker.value,
        unit: marker.unit,
        status: marker.status as "NORMAL" | "BORDERLINE" | "ELEVATED" | "LOW",
        referenceLow: marker.referenceLow,
        referenceHigh: marker.referenceHigh,
        testedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        labName: "QML Pathology",
      },
    });
  }

  // Liver biomarkers for member 2
  const liverBiomarkers = [
    { name: "ALT", category: "Liver", value: 52, unit: "U/L", status: "ELEVATED", referenceLow: 0, referenceHigh: 45 },
    { name: "AST", category: "Liver", value: 38, unit: "U/L", status: "NORMAL", referenceLow: 0, referenceHigh: 40 },
    { name: "GGT", category: "Liver", value: 65, unit: "U/L", status: "ELEVATED", referenceLow: 0, referenceHigh: 50 },
    { name: "Bilirubin", category: "Liver", value: 12, unit: "μmol/L", status: "NORMAL", referenceLow: 0, referenceHigh: 20 },
  ];

  for (const marker of liverBiomarkers) {
    await prisma.programBiomarkerResult.create({
      data: {
        memberId: member2.id,
        biomarkerName: marker.name,
        category: marker.category,
        value: marker.value,
        unit: marker.unit,
        status: marker.status as "NORMAL" | "BORDERLINE" | "ELEVATED" | "LOW",
        referenceLow: marker.referenceLow,
        referenceHigh: marker.referenceHigh,
        testedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        labName: "Sullivan Nicolaides",
      },
    });
  }

  console.log(`  ✓ Created biomarker results`);

  // 6. Create Check-ins
  console.log("\nCreating check-ins...");
  await prisma.programCheckIn.createMany({
    data: [
      {
        memberId: member1.id,
        carePartnerId: carePartner1.id,
        type: "WELCOME",
        notes: "Welcome call completed. Patient orientation done, first test scheduled.",
        completedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      },
      {
        memberId: member1.id,
        carePartnerId: carePartner1.id,
        type: "SCHEDULED",
        notes: "Results review. eGFR slightly below optimal, monitoring recommended.",
        completedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        memberId: member2.id,
        carePartnerId: carePartner1.id,
        type: "WELCOME",
        notes: "Initial consultation complete. Liver health program explained.",
        completedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
      {
        memberId: member2.id,
        carePartnerId: carePartner1.id,
        type: "SCHEDULED",
        notes: "ALT elevated. Discussed lifestyle modifications.",
        gpVisitCoordinated: true,
        gpVisitDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    ],
  });

  console.log(`  ✓ Created check-ins`);

  // 7. Create GP Notifications
  console.log("\nCreating GP notifications...");
  await prisma.gpNotification.createMany({
    data: [
      {
        clinicId: clinic1.id,
        type: "ENROLMENT",
        message: "Sarah Mitchell has enrolled via your QR code — Kidney Health",
        patientName: "Sarah Mitchell",
        patientId: member1.id,
        read: true,
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      },
      {
        clinicId: clinic1.id,
        type: "ENROLMENT",
        message: "James Taylor has enrolled via your QR code — Fatty Liver",
        patientName: "James Taylor",
        patientId: member2.id,
        read: true,
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      },
      {
        clinicId: clinic1.id,
        type: "BIOMARKER_ALERT",
        message: "James Taylor has an elevated ALT result (52 U/L)",
        patientName: "James Taylor",
        patientId: member2.id,
        read: false,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        clinicId: clinic1.id,
        type: "GP_VISIT_REMINDER",
        message: "Consultation with James Taylor scheduled for " + new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        patientName: "James Taylor",
        patientId: member2.id,
        read: false,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        clinicId: clinic1.id,
        type: "ENROLMENT",
        message: "Emma Lee has enrolled via your QR code — Weight Management",
        patientName: "Emma Lee",
        patientId: member3.id,
        read: false,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
    ],
  });

  console.log(`  ✓ Created GP notifications`);

  // 8. Create Messages (one at a time to handle the relation correctly)
  console.log("\nCreating member messages...");

  // For MemberMessage, senderId references CarePartner for care partner messages
  // For patient messages, we store the member id but it won't have a FK relation
  await prisma.memberMessage.create({
    data: {
      memberId: member1.id,
      senderType: "CARE_PARTNER",
      senderId: carePartner1.id,
      body: "Hi Sarah! Welcome to the Kidney Health program. I'm Emma, your care partner. I'll be here to support you throughout your journey. Feel free to message me anytime if you have questions.",
      read: true,
      createdAt: new Date(Date.now() - 24 * 24 * 60 * 60 * 1000),
    },
  });

  // Note: Patient/System messages not seeded due to FK constraint on senderId -> CarePartner

  await prisma.memberMessage.create({
    data: {
      memberId: member1.id,
      senderType: "CARE_PARTNER",
      senderId: carePartner1.id,
      body: "Great question! Once you complete your blood test, results typically come back within 3-5 business days. I'll notify you as soon as they're ready and we can schedule a call to go through them together.",
      read: true,
      createdAt: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.memberMessage.create({
    data: {
      memberId: member1.id,
      senderType: "CARE_PARTNER",
      senderId: carePartner1.id,
      body: "Your results are in! I've had a look and overall things look good. There are a couple of markers I'd like to discuss with you. When would be a good time for a quick call?",
      read: false,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`  ✓ Created member messages`);

  console.log("\n✅ GP Referral System seeding complete!\n");
  console.log("Test Credentials:");
  console.log("  Clinic 1: dr.johnson@greenfieldmedical.com.au (Greenfield Medical Centre)");
  console.log("  Clinic 2: dr.smith@cityhealth.com.au (City Health Clinic)");
  console.log("  QR Token 1: GRN12345AB → /join?clinic=GRN12345AB");
  console.log("  QR Token 2: CTY67890CD → /join?clinic=CTY67890CD");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
