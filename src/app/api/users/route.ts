import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { generateRandomPassword } from "@/lib/password";

// GET /api/users - List all users (admin, care partner, doctor)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const allowedRoles = ["ADMIN", "CARE_PARTNER", "DOCTOR"];
    if (!session || !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const memberStatus = searchParams.get("memberStatus") || "";

    const where = {
      ...(search && {
        OR: [
          { email: { contains: search, mode: "insensitive" as const } },
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(role && { role: role as "MEMBER" | "ADMIN" | "SUPER_ADMIN" }),
      ...(memberStatus && {
        memberStatus: memberStatus as "POTENTIAL_MEMBER" | "MEMBER" | "CANCELLED",
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          memberStatus: true,
          subscriptionStatus: true,
          subscriptionTier: true,
          journeyStatus: true,
          gender: true,
          createdAt: true,
          dateOfBirth: true,
          _count: {
            select: {
              biomarkerResults: true,
              healthGoals: true,
              labReports: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Allow registration without auth, but admin creation requires admin
    const body = await request.json();
    const { email, password, firstName, lastName, dateOfBirth, gender, role, subscriptionTier } = body;

    // Staff/admins can create members manually without setting a password
    // (the account gets a random password and the member sets their own later
    // via the reset/welcome flow). Public self-registration still requires one.
    const isStaffCreating =
      !!session && ["ADMIN", "CARE_PARTNER", "DOCTOR"].includes(session.user.role);

    // Validate required fields
    if (!email || !firstName || !lastName || (!password && !isStaffCreating)) {
      return NextResponse.json(
        { error: "Email, password, first name, and last name are required" },
        { status: 400 }
      );
    }

    // Check if creating admin user
    if (role === "ADMIN" || role === "SUPER_ADMIN") {
      if (!session || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized to create admin user" }, { status: 401 });
      }
    }

    // Normalize email to lowercase
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists (case-insensitive)
    const existingUser = await prisma.user.findFirst({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } }
    });
    if (existingUser) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // Hash password (auto-generate one for staff-created accounts)
    const passwordHash = await bcrypt.hash(password || generateRandomPassword(), 12);

    // Staff-created (manual) members get full portal visibility for now: create
    // them in a fully-activated/approved state so every program section unlocks.
    // Self-registrations stay on the normal TRIAL/pre-program path.
    const memberRole = role || "MEMBER";
    const activationData =
      isStaffCreating && memberRole === "MEMBER"
        ? {
            subscriptionStatus: "ACTIVE" as const,
            memberStatus: "MEMBER" as const,
            journeyStatus: "ACTIVE" as const,
            approvalStatus: "APPROVED" as const,
            subscriptionTier: subscriptionTier || undefined,
          }
        : {
            subscriptionStatus: "TRIAL" as const,
            subscriptionTier: subscriptionTier || undefined,
          };

    // Create user with lowercase email
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName,
        lastName,
        // Parse date as UTC to avoid timezone issues
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth + "T00:00:00Z") : null,
        gender: gender || "OTHER",
        role: memberRole,
        ...activationData,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: "USER_CREATED",
        entity: "user",
        entityId: user.id,
        details: { email: user.email },
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
