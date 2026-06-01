import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

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

    const where = {
      ...(search && {
        OR: [
          { email: { contains: search, mode: "insensitive" as const } },
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(role && { role: role as "MEMBER" | "ADMIN" | "SUPER_ADMIN" }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          subscriptionStatus: true,
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
    const { email, password, firstName, lastName, dateOfBirth, gender, role } = body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
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

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

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
        role: role || "MEMBER",
        subscriptionStatus: "TRIAL",
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
