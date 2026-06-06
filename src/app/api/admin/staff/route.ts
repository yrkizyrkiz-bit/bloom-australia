import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET /api/admin/staff - List all staff members
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log("[Staff API] Session:", JSON.stringify(session?.user, null, 2));

    if (!session?.user?.id) {
      console.log("[Staff API] No session - returning 401");
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 });
    }

    // Check for admin role (case-insensitive)
    const userRole = session.user.role?.toUpperCase();
    console.log("[Staff API] User role:", session.user.role, "-> Upper:", userRole);

    if (userRole !== "ADMIN") {
      console.log("[Staff API] Not admin - returning 403");
      return NextResponse.json({
        error: `Unauthorized - Admin only. Your role: ${session.user.role}`
      }, { status: 403 });
    }

    console.log("[Staff API] Admin access granted, fetching staff...");

    // Quick verification query
    const allStaffCount = await prisma.user.count({
      where: {
        role: { in: ["ADMIN", "DOCTOR", "CARE_PARTNER"] }
      }
    });
    console.log("[Staff API] Quick count of staff users:", allStaffCount);

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role"); // Filter by role

    const whereClause: Record<string, unknown> = {
      role: {
        in: ["ADMIN", "DOCTOR", "CARE_PARTNER"],
      },
    };

    if (role && ["ADMIN", "DOCTOR", "CARE_PARTNER"].includes(role)) {
      whereClause.role = role;
    }

    const staff = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        { role: "asc" },
        { firstName: "asc" },
      ],
    });

    // Get additional stats for doctors (consultation counts)
    const doctorIds = staff.filter(s => s.role === "DOCTOR").map(s => s.id);

    const doctorConsultationCounts = await prisma.consultationBooking.groupBy({
      by: ["doctorId"],
      where: {
        doctorId: { in: doctorIds },
      },
      _count: true,
    });

    const consultationCountMap = new Map(
      doctorConsultationCounts.map(d => [d.doctorId, d._count])
    );

    // Get care partner patient counts
    const carePartnerIds = staff.filter(s => s.role === "CARE_PARTNER").map(s => s.id);

    const carePartnerPatientCounts = await prisma.user.groupBy({
      by: ["assignedCarePartnerId"],
      where: {
        assignedCarePartnerId: { in: carePartnerIds },
      },
      _count: true,
    });

    const patientCountMap = new Map(
      carePartnerPatientCounts.map(c => [c.assignedCarePartnerId, c._count])
    );

    // Transform with counts
    const staffWithCounts = staff.map(s => ({
      ...s,
      consultationCount: s.role === "DOCTOR" ? (consultationCountMap.get(s.id) || 0) : undefined,
      assignedPatientCount: s.role === "CARE_PARTNER" ? (patientCountMap.get(s.id) || 0) : undefined,
    }));

    // Get role counts for summary
    const roleCounts = {
      admins: staff.filter(s => s.role === "ADMIN").length,
      doctors: staff.filter(s => s.role === "DOCTOR").length,
      carePartners: staff.filter(s => s.role === "CARE_PARTNER").length,
      total: staff.length,
    };

    console.log("[Staff API] Returning", staff.length, "staff members");
    console.log("[Staff API] Counts:", roleCounts);

    return NextResponse.json({
      staff: staffWithCounts,
      counts: roleCounts,
    });
  } catch (error) {
    console.error("Error fetching staff:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      error: "Failed to fetch staff",
      details: errorMessage
    }, { status: 500 });
  }
}

// POST /api/admin/staff - Create a new staff member
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 });
    }

    const userRole = session.user.role?.toUpperCase();
    if (userRole !== "ADMIN") {
      return NextResponse.json({
        error: `Unauthorized - Admin only. Your role: ${session.user.role}`
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      email,
      firstName,
      lastName,
      phone,
      role,
      password,
      sendWelcomeEmail,
    } = body;

    // Validate required fields
    if (!email || !firstName || !lastName || !role) {
      return NextResponse.json(
        { error: "Email, first name, last name, and role are required" },
        { status: 400 }
      );
    }

    // Validate role
    if (!["ADMIN", "DOCTOR", "CARE_PARTNER"].includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be ADMIN, DOCTOR, or CARE_PARTNER" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Generate password if not provided
    const userPassword = password || generateRandomPassword();
    const passwordHash = await bcrypt.hash(userPassword, 12);

    // Create the staff member
    const newStaff = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        firstName,
        lastName,
        phone: phone || null,
        role,
        passwordHash,
        gender: "OTHER",
        subscriptionStatus: "ACTIVE", // Staff are always active
        journeyStatus: "ACTIVE",
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    // Log the creation
    await prisma.activityLog.create({
      data: {
        userId: newStaff.id,
        action: "STAFF_ACCOUNT_CREATED",
        entity: "user",
        entityId: newStaff.id,
        details: {
          createdBy: session.user.id,
          createdByName: `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim(),
          role,
          sendWelcomeEmail: sendWelcomeEmail || false,
        },
      },
    });

    // TODO: Send welcome email with password if sendWelcomeEmail is true
    // For now, return the password so admin can share it manually

    return NextResponse.json({
      success: true,
      staff: newStaff,
      temporaryPassword: password ? undefined : userPassword, // Only return if auto-generated
      message: `${role} account created successfully`,
    });
  } catch (error) {
    console.error("Error creating staff:", error);
    return NextResponse.json({ error: "Failed to create staff member" }, { status: 500 });
  }
}

// PATCH /api/admin/staff - Update a staff member
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 });
    }

    const userRole = session.user.role?.toUpperCase();
    if (userRole !== "ADMIN") {
      return NextResponse.json({
        error: `Unauthorized - Admin only. Your role: ${session.user.role}`
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      staffId,
      firstName,
      lastName,
      phone,
      role,
      resetPassword,
      newPassword,
      deactivate,
    } = body;

    if (!staffId) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 });
    }

    const staff = await prisma.user.findUnique({
      where: { id: staffId },
    });

    if (!staff || !["ADMIN", "DOCTOR", "CARE_PARTNER"].includes(staff.role)) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    // Prevent deactivating self
    if (deactivate && staffId === session.user.id) {
      return NextResponse.json({ error: "You cannot deactivate your own account" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone || null;
    if (role && ["ADMIN", "DOCTOR", "CARE_PARTNER"].includes(role)) {
      updateData.role = role;
    }

    // Handle password reset
    let generatedPassword: string | undefined;
    if (resetPassword) {
      const passwordToHash = newPassword || generateRandomPassword();
      generatedPassword = passwordToHash;
      updateData.passwordHash = await bcrypt.hash(passwordToHash, 12);
    }

    // Handle deactivation
    if (deactivate !== undefined) {
      updateData.subscriptionStatus = deactivate ? "INACTIVE" : "ACTIVE";
    }

    const updatedStaff = await prisma.user.update({
      where: { id: staffId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        subscriptionStatus: true,
        updatedAt: true,
      },
    });

    // Log the update
    await prisma.activityLog.create({
      data: {
        userId: staffId,
        action: "STAFF_ACCOUNT_UPDATED",
        entity: "user",
        entityId: staffId,
        details: {
          updatedBy: session.user.id,
          updatedByName: `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim(),
          changes: Object.keys(updateData),
          passwordReset: !!resetPassword,
          deactivated: deactivate,
        },
      },
    });

    return NextResponse.json({
      success: true,
      staff: updatedStaff,
      newPassword: generatedPassword, // Only if password was reset
      message: "Staff member updated successfully",
    });
  } catch (error) {
    console.error("Error updating staff:", error);
    return NextResponse.json({ error: "Failed to update staff member" }, { status: 500 });
  }
}

// DELETE /api/admin/staff - Delete a staff member (soft delete by deactivating)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 });
    }

    const userRole = session.user.role?.toUpperCase();
    if (userRole !== "ADMIN") {
      return NextResponse.json({
        error: `Unauthorized - Admin only. Your role: ${session.user.role}`
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const staffId = searchParams.get("staffId");

    if (!staffId) {
      return NextResponse.json({ error: "Staff ID is required" }, { status: 400 });
    }

    // Prevent deleting self
    if (staffId === session.user.id) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    const staff = await prisma.user.findUnique({
      where: { id: staffId },
    });

    if (!staff || !["ADMIN", "DOCTOR", "CARE_PARTNER"].includes(staff.role)) {
      return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
    }

    // Soft delete by deactivating
    await prisma.user.update({
      where: { id: staffId },
      data: {
        subscriptionStatus: "INACTIVE",
        role: "MEMBER", // Demote to member so they can't access admin
      },
    });

    // Log the deletion
    await prisma.activityLog.create({
      data: {
        userId: staffId,
        action: "STAFF_ACCOUNT_DELETED",
        entity: "user",
        entityId: staffId,
        details: {
          deletedBy: session.user.id,
          deletedByName: `${session.user.firstName || ""} ${session.user.lastName || ""}`.trim(),
          previousRole: staff.role,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Staff member deactivated successfully",
    });
  } catch (error) {
    console.error("Error deleting staff:", error);
    return NextResponse.json({ error: "Failed to delete staff member" }, { status: 500 });
  }
}

// Helper function to generate random password
function generateRandomPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
