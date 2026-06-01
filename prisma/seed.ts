import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { biomarkerDefinitions } from "../src/data/biomarkers";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...\n");

  // Hash passwords
  const memberPassword = await bcrypt.hash("demo123", 12);
  const adminPassword = await bcrypt.hash("admin123", 12);
  const carePartnerPassword = await bcrypt.hash("test123", 12);

  // ==================== CREATE USERS ====================
  console.log("Creating users...");

  // Admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@sanative.com.au" },
    update: {},
    create: {
      email: "admin@sanative.com.au",
      passwordHash: adminPassword,
      firstName: "Admin",
      lastName: "User",
      dateOfBirth: new Date("1990-01-01"),
      gender: "MALE",
      role: "ADMIN",
      subscriptionStatus: "ACTIVE",
      phone: "+61 400 000 000",
    },
  });
  console.log(`✓ Admin: ${admin.email}`);

  // Care Partner user
  const carePartner = await prisma.user.upsert({
    where: { email: "carepartner@sanative.com.au" },
    update: {},
    create: {
      email: "carepartner@sanative.com.au",
      passwordHash: carePartnerPassword, // test123
      firstName: "Care",
      lastName: "Partner",
      dateOfBirth: new Date("1988-05-15"),
      gender: "FEMALE",
      role: "CARE_PARTNER",
      subscriptionStatus: "ACTIVE",
      phone: "+61 400 000 001",
    },
  });
  console.log(`✓ Care Partner: ${carePartner.email}`);

  // Doctor user
  const doctor = await prisma.user.upsert({
    where: { email: "doctor@sanative.com.au" },
    update: {},
    create: {
      email: "doctor@sanative.com.au",
      passwordHash: adminPassword, // admin123
      firstName: "Dr Sarah",
      lastName: "Mitchell",
      dateOfBirth: new Date("1980-02-20"),
      gender: "FEMALE",
      role: "DOCTOR",
      subscriptionStatus: "ACTIVE",
      phone: "+61 400 000 002",
    },
  });
  console.log(`✓ Doctor: ${doctor.email}`);

  // Demo member (main test user)
  const demoMember = await prisma.user.upsert({
    where: { email: "demo@sanative.com.au" },
    update: {},
    create: {
      email: "demo@sanative.com.au",
      passwordHash: memberPassword,
      firstName: "Sarah",
      lastName: "Johnson",
      dateOfBirth: new Date("1985-03-15"),
      gender: "FEMALE",
      role: "MEMBER",
      subscriptionStatus: "ACTIVE",
      subscriptionTier: "premium",
      phone: "+61 412 345 678",
      address: "123 Health Street, Sydney NSW 2000",
    },
  });
  console.log(`✓ Demo member: ${demoMember.email}`);

  // Create additional test members
  const testMembersData = [
    { email: "michael.chen@example.com", firstName: "Michael", lastName: "Chen", dateOfBirth: new Date("1978-07-22"), gender: "MALE" as const, subscriptionStatus: "ACTIVE" as const, subscriptionTier: "enterprise", phone: "+61 423 456 789" },
    { email: "emma.wilson@example.com", firstName: "Emma", lastName: "Wilson", dateOfBirth: new Date("1992-11-08"), gender: "FEMALE" as const, subscriptionStatus: "ACTIVE" as const, subscriptionTier: "basic", phone: "+61 434 567 890" },
    { email: "james.taylor@example.com", firstName: "James", lastName: "Taylor", dateOfBirth: new Date("1988-04-30"), gender: "MALE" as const, subscriptionStatus: "TRIAL" as const, subscriptionTier: "free", phone: "+61 445 678 901" },
    { email: "olivia.brown@example.com", firstName: "Olivia", lastName: "Brown", dateOfBirth: new Date("1995-09-12"), gender: "FEMALE" as const, subscriptionStatus: "ACTIVE" as const, subscriptionTier: "premium", phone: "+61 456 789 012" },
    { email: "david.martinez@example.com", firstName: "David", lastName: "Martinez", dateOfBirth: new Date("1982-01-25"), gender: "MALE" as const, subscriptionStatus: "INACTIVE" as const, subscriptionTier: "basic", phone: "+61 467 890 123" },
    { email: "sophia.nguyen@example.com", firstName: "Sophia", lastName: "Nguyen", dateOfBirth: new Date("1990-06-18"), gender: "FEMALE" as const, subscriptionStatus: "ACTIVE" as const, subscriptionTier: "premium", phone: "+61 478 901 234" },
    { email: "william.jones@example.com", firstName: "William", lastName: "Jones", dateOfBirth: new Date("1975-12-03"), gender: "MALE" as const, subscriptionStatus: "CANCELLED" as const, subscriptionTier: "basic", phone: "+61 489 012 345" },
    { email: "isabella.garcia@example.com", firstName: "Isabella", lastName: "Garcia", dateOfBirth: new Date("1998-08-21"), gender: "FEMALE" as const, subscriptionStatus: "ACTIVE" as const, subscriptionTier: "basic", phone: "+61 490 123 456" },
    { email: "alexander.kim@example.com", firstName: "Alexander", lastName: "Kim", dateOfBirth: new Date("1987-05-14"), gender: "MALE" as const, subscriptionStatus: "EXPIRED" as const, subscriptionTier: "premium", phone: "+61 401 234 567" },
    { email: "mia.patel@example.com", firstName: "Mia", lastName: "Patel", dateOfBirth: new Date("1993-02-28"), gender: "FEMALE" as const, subscriptionStatus: "ACTIVE" as const, subscriptionTier: "enterprise", phone: "+61 402 345 678" },
  ];

  const createdMembers = [];
  for (const member of testMembersData) {
    const user = await prisma.user.upsert({
      where: { email: member.email },
      update: {},
      create: { ...member, passwordHash: memberPassword, role: "MEMBER" },
    });
    createdMembers.push(user);
    console.log(`✓ Member: ${user.email}`);
  }

  const allMembers = [demoMember, ...createdMembers];
  console.log(`\n✓ Created ${allMembers.length} members total\n`);

  // ==================== CREATE BIOMARKER DEFINITIONS ====================
  console.log("Creating biomarker definitions...");
  for (const biomarker of biomarkerDefinitions) {
    await prisma.biomarkerDefinition.upsert({
      where: { biomarkerId: biomarker.id },
      update: {},
      create: {
        biomarkerId: biomarker.id,
        name: biomarker.name,
        shortName: biomarker.shortName,
        category: biomarker.category.toUpperCase() as any,
        description: biomarker.description,
        whyItMatters: biomarker.whyItMatters,
        unit: biomarker.ranges.male.unit,
        maleRanges: { low: biomarker.ranges.male.low, optimal_low: biomarker.ranges.male.optimal_low, optimal_high: biomarker.ranges.male.optimal_high, high: biomarker.ranges.male.high },
        femaleRanges: { low: biomarker.ranges.female.low, optimal_low: biomarker.ranges.female.optimal_low, optimal_high: biomarker.ranges.female.optimal_high, high: biomarker.ranges.female.high },
        improvementTips: biomarker.improvementTips,
        relatedBiomarkerIds: biomarker.relatedBiomarkers || [],
      },
    });
  }
  console.log(`✓ Created ${biomarkerDefinitions.length} biomarker definitions\n`);

  // ==================== CREATE BIOMARKER RESULTS ====================
  console.log("Creating biomarker results...");
  const testBiomarkers = ["total_cholesterol", "ldl_cholesterol", "hdl_cholesterol", "triglycerides", "glucose", "hba1c", "tsh", "vitamin_d", "vitamin_b12", "iron", "ferritin", "crp", "alt", "ast", "creatinine", "egfr", "hemoglobin", "cortisol"];
  const statuses = ["OPTIMAL", "OPTIMAL", "OPTIMAL", "NORMAL", "NORMAL", "OUT_OF_RANGE"];

  let resultCount = 0;
  for (const member of allMembers) {
    // Create results for each member
    const resultsToCreate = testBiomarkers.map(biomarkerId => ({
      userId: member.id,
      biomarkerId,
      value: Math.round((50 + Math.random() * 100) * 10) / 10,
      status: statuses[Math.floor(Math.random() * statuses.length)] as any,
      testedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
      uploadedAt: new Date(),
      uploadedBy: admin.id,
    }));

    await prisma.biomarkerResult.createMany({ data: resultsToCreate, skipDuplicates: true });
    resultCount += resultsToCreate.length;
  }
  console.log(`✓ Created ${resultCount} biomarker results\n`);

  // ==================== CREATE HEALTH SCORES ====================
  console.log("Creating health scores...");
  for (const member of allMembers) {
    const birthYear = member.dateOfBirth ? new Date(member.dateOfBirth).getFullYear() : 1990;
    const chronologicalAge = new Date().getFullYear() - birthYear;
    await prisma.healthScore.upsert({
      where: { id: `score_${member.id}` },
      update: {},
      create: {
        userId: member.id,
        overall: 60 + Math.floor(Math.random() * 35),
        biologicalAge: chronologicalAge + Math.floor(Math.random() * 10) - 5,
        chronologicalAge,
        categoryScores: [
          { category: "HEART", score: 70 + Math.floor(Math.random() * 25), optimal: 2, normal: 1, outOfRange: 1 },
          { category: "METABOLIC", score: 75 + Math.floor(Math.random() * 20), optimal: 2, normal: 1, outOfRange: 0 },
          { category: "THYROID", score: 80 + Math.floor(Math.random() * 15), optimal: 2, normal: 1, outOfRange: 0 },
          { category: "VITAMINS", score: 60 + Math.floor(Math.random() * 30), optimal: 1, normal: 1, outOfRange: 1 },
          { category: "MINERALS", score: 65 + Math.floor(Math.random() * 25), optimal: 2, normal: 1, outOfRange: 1 },
          { category: "LIVER", score: 85 + Math.floor(Math.random() * 10), optimal: 2, normal: 1, outOfRange: 0 },
          { category: "KIDNEY", score: 90 + Math.floor(Math.random() * 8), optimal: 3, normal: 0, outOfRange: 0 },
          { category: "BLOOD", score: 82 + Math.floor(Math.random() * 12), optimal: 3, normal: 1, outOfRange: 0 },
          { category: "HORMONES", score: 70 + Math.floor(Math.random() * 20), optimal: 1, normal: 1, outOfRange: 1 },
        ],
      },
    });
  }
  console.log(`✓ Created ${allMembers.length} health scores\n`);

  // ==================== CREATE HEALTH GOALS ====================
  console.log("Creating health goals...");
  const goalBiomarkers = ["vitamin_d", "triglycerides", "hdl_cholesterol", "ferritin"];
  let goalCount = 0;
  for (const member of allMembers.slice(0, 6)) {
    for (const biomarkerId of goalBiomarkers.slice(0, 2)) {
      await prisma.healthGoal.create({
        data: {
          userId: member.id,
          biomarkerId,
          targetValue: 50 + Math.random() * 20,
          currentValue: 30 + Math.random() * 15,
          startValue: 20 + Math.random() * 10,
          startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          status: Math.random() > 0.7 ? "ACHIEVED" : "IN_PROGRESS",
          notes: `Working on improving levels`,
        },
      });
      goalCount++;
    }
  }
  console.log(`✓ Created ${goalCount} health goals\n`);

  // ==================== CREATE REMINDERS ====================
  console.log("Creating reminders...");
  const reminderData = [
    { type: "TEST", title: "Schedule blood test" },
    { type: "SUPPLEMENT", title: "Take Vitamin D" },
    { type: "APPOINTMENT", title: "Doctor's appointment" },
  ];
  let reminderCount = 0;
  for (const member of allMembers.slice(0, 5)) {
    for (const r of reminderData) {
      await prisma.reminder.create({
        data: {
          userId: member.id,
          type: r.type as any,
          title: r.title,
          dueDate: new Date(Date.now() + Math.random() * 30 * 24 * 60 * 60 * 1000),
          frequency: r.type === "SUPPLEMENT" ? "DAILY" : "ONCE",
          isActive: true,
        },
      });
      reminderCount++;
    }
  }
  console.log(`✓ Created ${reminderCount} reminders\n`);

  // ==================== CREATE NOTIFICATIONS ====================
  console.log("Creating notifications...");
  const notifData = [
    { type: "INFO", title: "Welcome!", message: "Your health dashboard is ready.", category: "SYSTEM" },
    { type: "SUCCESS", title: "Results uploaded", message: "Your latest blood test results are available.", category: "BIOMARKER" },
    { type: "WARNING", title: "Low Vitamin D", message: "Consider supplementation.", category: "BIOMARKER" },
  ];
  let notifCount = 0;
  for (const member of allMembers) {
    for (const n of notifData) {
      await prisma.notification.create({
        data: {
          userId: member.id,
          type: n.type as any,
          title: n.title,
          message: n.message,
          category: n.category as any,
          isRead: Math.random() > 0.5,
        },
      });
      notifCount++;
    }
  }
  console.log(`✓ Created ${notifCount} notifications\n`);

  // ==================== CREATE ACTIVITY LOGS ====================
  console.log("Creating activity logs...");
  const actions = ["USER_LOGIN", "BIOMARKER_UPLOADED", "GOAL_CREATED", "REMINDER_COMPLETED"];
  let activityCount = 0;
  for (const member of allMembers) {
    for (const action of actions.slice(0, 3)) {
      await prisma.activityLog.create({
        data: {
          userId: member.id,
          action,
          entity: action.split("_")[0].toLowerCase(),
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        },
      });
      activityCount++;
    }
  }
  console.log(`✓ Created ${activityCount} activity logs\n`);

  // ==================== CREATE GEORGE (SECOND DEMO USER) ====================
  console.log("Creating George (second demo user)...");
  const george = await prisma.user.upsert({
    where: { email: "george@sanative.com.au" },
    update: {},
    create: {
      email: "george@sanative.com.au",
      passwordHash: memberPassword,
      firstName: "George",
      lastName: "Mitchell",
      dateOfBirth: new Date("1980-08-20"),
      gender: "MALE",
      role: "MEMBER",
      subscriptionStatus: "ACTIVE",
      subscriptionTier: "premium",
      phone: "+61 421 987 654",
      address: "456 Wellness Avenue, Melbourne VIC 3000",
    },
  });
  console.log(`✓ George: ${george.email}`);

  // ==================== WEIGHT MANAGEMENT SEED DATA ====================
  console.log("\nSeeding Weight Management data...");

  // Helper function to generate dates going back from today
  const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // ---------- SARAH'S WEIGHT MANAGEMENT DATA ----------
  console.log("Creating Sarah's weight management data...");

  // Sarah's Weight Preferences
  await prisma.weightManagementPreferences.upsert({
    where: { userId: demoMember.id },
    update: {},
    create: {
      userId: demoMember.id,
      weightUnit: "KG",
      dietaryRequirements: ["low-carb", "gluten-free"],
      allergies: ["nuts"],
      dailyCalorieGoal: 1600,
      dailyWaterGoal: 2.5,
      trackingReminders: true,
      reminderTime: "08:00",
      hasCompletedOnboarding: true,
    },
  });

  // Sarah's Weight Goal (losing weight - started 3 months ago)
  await prisma.weightGoal.upsert({
    where: { id: `goal_sarah_1` },
    update: {},
    create: {
      id: `goal_sarah_1`,
      userId: demoMember.id,
      startWeight: 78.5,
      targetWeight: 68.0,
      currentWeight: 72.3,
      startDate: daysAgo(90),
      targetDate: daysAgo(-60), // 60 days in the future
      status: "IN_PROGRESS",
      weeklyTargetLoss: 0.5,
      milestones: JSON.stringify([
        { weight: 76, reached: true, reachedAt: daysAgo(60).toISOString() },
        { weight: 74, reached: true, reachedAt: daysAgo(30).toISOString() },
        { weight: 72, reached: true, reachedAt: daysAgo(7).toISOString() },
        { weight: 70, reached: false },
        { weight: 68, reached: false },
      ]),
      notes: "Focusing on sustainable weight loss with low-carb diet",
    },
  });

  // Sarah's Weight Logs (90 days of data - steady decline with natural fluctuations)
  const sarahWeightData = [];
  let sarahWeight = 78.5;
  for (let i = 90; i >= 0; i -= 2) { // Every 2 days
    // Natural fluctuation + overall downward trend
    const fluctuation = (Math.random() - 0.5) * 0.8;
    const trend = -0.07; // Average loss per entry
    sarahWeight = Math.max(71.5, Math.min(79, sarahWeight + trend + fluctuation));

    sarahWeightData.push({
      userId: demoMember.id,
      weight: Math.round(sarahWeight * 10) / 10,
      waistCircumference: 82 - (90 - i) * 0.05 + (Math.random() - 0.5) * 2,
      measuredAt: daysAgo(i),
      source: "MANUAL" as const,
      notes: i === 0 ? "Feeling great today!" : i === 30 ? "Hit a plateau this week" : null,
    });
  }
  await prisma.weightLog.createMany({ data: sarahWeightData, skipDuplicates: true });
  console.log(`  ✓ ${sarahWeightData.length} weight logs for Sarah`);

  // Sarah's Meal Logs (last 14 days)
  const sarahMeals = [
    { type: "BREAKFAST", name: "Greek Yogurt with Berries", calories: 280, protein: 18, carbs: 25, fat: 12 },
    { type: "BREAKFAST", name: "Avocado Toast with Eggs", calories: 420, protein: 22, carbs: 30, fat: 28 },
    { type: "BREAKFAST", name: "Protein Smoothie", calories: 320, protein: 28, carbs: 35, fat: 8 },
    { type: "LUNCH", name: "Grilled Chicken Salad", calories: 450, protein: 38, carbs: 15, fat: 26 },
    { type: "LUNCH", name: "Quinoa Buddha Bowl", calories: 520, protein: 22, carbs: 58, fat: 22 },
    { type: "LUNCH", name: "Tuna Wrap", calories: 380, protein: 32, carbs: 28, fat: 16 },
    { type: "DINNER", name: "Grilled Salmon with Vegetables", calories: 480, protein: 42, carbs: 18, fat: 28 },
    { type: "DINNER", name: "Chicken Stir Fry", calories: 420, protein: 35, carbs: 32, fat: 18 },
    { type: "DINNER", name: "Lean Beef with Sweet Potato", calories: 550, protein: 45, carbs: 40, fat: 22 },
    { type: "AFTERNOON_SNACK", name: "Apple with Almond Butter", calories: 180, protein: 5, carbs: 22, fat: 10 },
    { type: "AFTERNOON_SNACK", name: "Protein Bar", calories: 200, protein: 20, carbs: 18, fat: 8 },
    { type: "AFTERNOON_SNACK", name: "Cottage Cheese", calories: 120, protein: 14, carbs: 5, fat: 5 },
  ];

  const sarahMealLogs = [];
  for (let day = 14; day >= 0; day--) {
    // 3-4 meals per day
    const mealsToday = Math.random() > 0.3 ? 4 : 3;
    const usedTypes: string[] = [];

    for (let m = 0; m < mealsToday; m++) {
      const availableMeals = sarahMeals.filter(meal => !usedTypes.includes(meal.type));
      if (availableMeals.length === 0) break;

      const meal = availableMeals[Math.floor(Math.random() * availableMeals.length)];
      usedTypes.push(meal.type);

      const mealTime = new Date(daysAgo(day));
      if (meal.type === "BREAKFAST") mealTime.setHours(8, Math.floor(Math.random() * 30));
      else if (meal.type === "LUNCH") mealTime.setHours(12, Math.floor(Math.random() * 60));
      else if (meal.type === "DINNER") mealTime.setHours(18, Math.floor(Math.random() * 90));
      else mealTime.setHours(15, Math.floor(Math.random() * 60));

      sarahMealLogs.push({
        userId: demoMember.id,
        mealType: meal.type as any,
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        fiber: Math.floor(Math.random() * 8) + 2,
        portionSize: "1 serving",
        loggedAt: mealTime,
      });
    }
  }
  for (const mealLog of sarahMealLogs) {
    await prisma.mealLog.create({ data: mealLog });
  }
  console.log(`  ✓ ${sarahMealLogs.length} meal logs for Sarah`);

  // Sarah's Exercise Logs (last 30 days)
  const exerciseTypes = [
    { name: "Morning Yoga", type: "YOGA", duration: 30, calories: 120, intensity: "LIGHT" },
    { name: "HIIT Workout", type: "HIIT", duration: 25, calories: 280, intensity: "VIGOROUS" },
    { name: "Walking", type: "WALKING", duration: 45, calories: 180, intensity: "LIGHT" },
    { name: "Strength Training", type: "STRENGTH_TRAINING", duration: 45, calories: 220, intensity: "MODERATE" },
    { name: "Swimming", type: "SWIMMING", duration: 40, calories: 320, intensity: "MODERATE" },
    { name: "Cycling", type: "CYCLING", duration: 50, calories: 350, intensity: "MODERATE" },
    { name: "Pilates", type: "PILATES", duration: 45, calories: 180, intensity: "LIGHT" },
  ];

  const sarahExerciseLogs = [];
  for (let day = 30; day >= 0; day--) {
    // 4-5 exercise days per week
    if (Math.random() > 0.35) {
      const exercise = exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)];
      const exerciseTime = new Date(daysAgo(day));
      exerciseTime.setHours(Math.random() > 0.5 ? 7 : 17, Math.floor(Math.random() * 30));

      sarahExerciseLogs.push({
        userId: demoMember.id,
        activityType: exercise.type as any,
        name: exercise.name,
        durationMinutes: exercise.duration + Math.floor((Math.random() - 0.5) * 10),
        caloriesBurned: exercise.calories + Math.floor((Math.random() - 0.5) * 40),
        intensity: exercise.intensity as any,
        loggedAt: exerciseTime,
        notes: Math.random() > 0.8 ? "Felt great!" : null,
      });
    }
  }
  for (const exerciseLog of sarahExerciseLogs) {
    await prisma.exerciseLog.create({ data: exerciseLog });
  }
  console.log(`  ✓ ${sarahExerciseLogs.length} exercise logs for Sarah`);

  // Sarah's Weekly Check-ins (last 8 weeks)
  const sarahCheckIns = [];
  for (let week = 8; week >= 1; week--) {
    sarahCheckIns.push({
      userId: demoMember.id,
      weekNumber: 13 - week, // Week numbers counting up
      overallFeeling: Math.floor(Math.random() * 2) + 4, // 4-5
      energyLevel: Math.floor(Math.random() * 2) + 3, // 3-4
      sleepQuality: Math.floor(Math.random() * 2) + 3, // 3-4
      stressLevel: Math.floor(Math.random() * 2) + 2, // 2-3
      challenges: week === 4 ? "Hit a plateau, feeling discouraged" : week === 2 ? "Busy week at work" : null,
      notes: week === 1 ? "Reached my 72kg milestone!" : week === 3 ? "Completed all workouts" : "Stayed consistent with meals",
      checkedInAt: daysAgo(week * 7),
    });
  }
  for (const checkIn of sarahCheckIns) {
    await prisma.weeklyCheckIn.create({ data: checkIn });
  }
  console.log(`  ✓ ${sarahCheckIns.length} weekly check-ins for Sarah`);

  // ---------- GEORGE'S WEIGHT MANAGEMENT DATA ----------
  console.log("Creating George's weight management data...");

  // George's Weight Preferences
  await prisma.weightManagementPreferences.upsert({
    where: { userId: george.id },
    update: {},
    create: {
      userId: george.id,
      weightUnit: "KG",
      dietaryRequirements: ["high-protein"],
      allergies: [],
      dailyCalorieGoal: 2200,
      dailyWaterGoal: 3.0,
      trackingReminders: true,
      reminderTime: "07:00",
      hasCompletedOnboarding: true,
    },
  });

  // George's Weight Goal (losing weight - started 2 months ago)
  await prisma.weightGoal.upsert({
    where: { id: `goal_george_1` },
    update: {},
    create: {
      id: `goal_george_1`,
      userId: george.id,
      startWeight: 95.0,
      targetWeight: 82.0,
      currentWeight: 89.2,
      startDate: daysAgo(60),
      targetDate: daysAgo(-90), // 90 days in the future
      status: "IN_PROGRESS",
      weeklyTargetLoss: 0.7,
      milestones: JSON.stringify([
        { weight: 93, reached: true, reachedAt: daysAgo(40).toISOString() },
        { weight: 90, reached: true, reachedAt: daysAgo(14).toISOString() },
        { weight: 87, reached: false },
        { weight: 85, reached: false },
        { weight: 82, reached: false },
      ]),
      notes: "Building muscle while losing fat. High protein diet.",
    },
  });

  // George's Weight Logs (60 days of data)
  const georgeWeightData = [];
  let georgeWeight = 95.0;
  for (let i = 60; i >= 0; i -= 2) {
    const fluctuation = (Math.random() - 0.5) * 1.0;
    const trend = -0.10;
    georgeWeight = Math.max(88, Math.min(96, georgeWeight + trend + fluctuation));

    georgeWeightData.push({
      userId: george.id,
      weight: Math.round(georgeWeight * 10) / 10,
      waistCircumference: 98 - (60 - i) * 0.08 + (Math.random() - 0.5) * 2,
      measuredAt: daysAgo(i),
      source: "MANUAL" as const,
      notes: i === 0 ? "New low!" : null,
    });
  }
  await prisma.weightLog.createMany({ data: georgeWeightData, skipDuplicates: true });
  console.log(`  ✓ ${georgeWeightData.length} weight logs for George`);

  // George's Meal Logs (last 14 days)
  const georgeMeals = [
    { type: "BREAKFAST", name: "Eggs and Bacon", calories: 450, protein: 32, carbs: 5, fat: 35 },
    { type: "BREAKFAST", name: "Protein Oatmeal", calories: 380, protein: 28, carbs: 45, fat: 10 },
    { type: "BREAKFAST", name: "Scrambled Eggs with Toast", calories: 420, protein: 26, carbs: 30, fat: 24 },
    { type: "LUNCH", name: "Chicken Breast with Rice", calories: 580, protein: 48, carbs: 50, fat: 14 },
    { type: "LUNCH", name: "Beef Burrito Bowl", calories: 650, protein: 42, carbs: 55, fat: 28 },
    { type: "LUNCH", name: "Turkey Sandwich", calories: 480, protein: 35, carbs: 40, fat: 20 },
    { type: "DINNER", name: "Steak with Vegetables", calories: 620, protein: 52, carbs: 20, fat: 38 },
    { type: "DINNER", name: "Grilled Chicken Thighs", calories: 520, protein: 45, carbs: 15, fat: 32 },
    { type: "DINNER", name: "Pork Chops with Salad", calories: 480, protein: 40, carbs: 12, fat: 30 },
    { type: "AFTERNOON_SNACK", name: "Protein Shake", calories: 250, protein: 30, carbs: 15, fat: 6 },
    { type: "AFTERNOON_SNACK", name: "Greek Yogurt", calories: 150, protein: 18, carbs: 8, fat: 5 },
    { type: "AFTERNOON_SNACK", name: "Beef Jerky", calories: 180, protein: 24, carbs: 6, fat: 6 },
  ];

  const georgeMealLogs = [];
  for (let day = 14; day >= 0; day--) {
    const mealsToday = 4; // George eats 4 meals a day
    const usedTypes: string[] = [];

    for (let m = 0; m < mealsToday; m++) {
      const availableMeals = georgeMeals.filter(meal => !usedTypes.includes(meal.type));
      if (availableMeals.length === 0) break;

      const meal = availableMeals[Math.floor(Math.random() * availableMeals.length)];
      usedTypes.push(meal.type);

      const mealTime = new Date(daysAgo(day));
      if (meal.type === "BREAKFAST") mealTime.setHours(6, 30);
      else if (meal.type === "LUNCH") mealTime.setHours(12, Math.floor(Math.random() * 30));
      else if (meal.type === "DINNER") mealTime.setHours(19, Math.floor(Math.random() * 30));
      else mealTime.setHours(16, Math.floor(Math.random() * 60));

      georgeMealLogs.push({
        userId: george.id,
        mealType: meal.type as any,
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        fiber: Math.floor(Math.random() * 6) + 2,
        portionSize: "1 serving",
        loggedAt: mealTime,
      });
    }
  }
  for (const mealLog of georgeMealLogs) {
    await prisma.mealLog.create({ data: mealLog });
  }
  console.log(`  ✓ ${georgeMealLogs.length} meal logs for George`);

  // George's Exercise Logs (last 30 days - more strength focused)
  const georgeExercises = [
    { name: "Weight Lifting - Upper Body", type: "STRENGTH_TRAINING", duration: 60, calories: 280, intensity: "VIGOROUS" },
    { name: "Weight Lifting - Lower Body", type: "STRENGTH_TRAINING", duration: 55, calories: 300, intensity: "VIGOROUS" },
    { name: "Running", type: "RUNNING", duration: 30, calories: 350, intensity: "VIGOROUS" },
    { name: "CrossFit WOD", type: "HIIT", duration: 45, calories: 400, intensity: "VIGOROUS" },
    { name: "Boxing", type: "SPORTS", duration: 40, calories: 380, intensity: "VIGOROUS" },
    { name: "Rowing Machine", type: "OTHER", duration: 25, calories: 250, intensity: "MODERATE" },
  ];

  const georgeExerciseLogs = [];
  for (let day = 30; day >= 0; day--) {
    // 5-6 exercise days per week for George
    if (Math.random() > 0.2) {
      const exercise = georgeExercises[Math.floor(Math.random() * georgeExercises.length)];
      const exerciseTime = new Date(daysAgo(day));
      exerciseTime.setHours(6, Math.floor(Math.random() * 30)); // Early morning workouts

      georgeExerciseLogs.push({
        userId: george.id,
        activityType: exercise.type as any,
        name: exercise.name,
        durationMinutes: exercise.duration + Math.floor((Math.random() - 0.5) * 15),
        caloriesBurned: exercise.calories + Math.floor((Math.random() - 0.5) * 60),
        intensity: exercise.intensity as any,
        loggedAt: exerciseTime,
        notes: Math.random() > 0.85 ? "Personal best!" : null,
      });
    }
  }
  for (const exerciseLog of georgeExerciseLogs) {
    await prisma.exerciseLog.create({ data: exerciseLog });
  }
  console.log(`  ✓ ${georgeExerciseLogs.length} exercise logs for George`);

  // George's Weekly Check-ins (last 6 weeks)
  const georgeCheckIns = [];
  for (let week = 6; week >= 1; week--) {
    georgeCheckIns.push({
      userId: george.id,
      weekNumber: 7 - week,
      overallFeeling: Math.floor(Math.random() * 2) + 4,
      energyLevel: Math.floor(Math.random() * 2) + 4, // Higher energy
      sleepQuality: Math.floor(Math.random() * 2) + 3,
      stressLevel: Math.floor(Math.random() * 2) + 2,
      challenges: week === 3 ? "Sore from heavy lifting session" : null,
      notes: week === 1 ? "Dropped below 90kg!" : week === 2 ? "Increased bench press by 5kg" : "Consistent with workouts",
      checkedInAt: daysAgo(week * 7),
    });
  }
  for (const checkIn of georgeCheckIns) {
    await prisma.weeklyCheckIn.create({ data: checkIn });
  }
  console.log(`  ✓ ${georgeCheckIns.length} weekly check-ins for George`);

  console.log("\n✓ Weight Management data seeded successfully!\n");

  // ==================== SUMMARY ====================
  console.log("========================================");
  console.log("🎉 Database seed completed!");
  console.log("========================================\n");
  console.log("Demo Credentials:");
  console.log("  Sarah (Member): demo@sanative.com.au / demo123");
  console.log("  George (Member): george@sanative.com.au / demo123");
  console.log("  Admin:  admin@sanative.com.au / admin123");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
