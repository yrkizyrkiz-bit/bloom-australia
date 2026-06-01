import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

// GET /api/users/[id]
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Allow user to view their own profile, or admin/care partner/doctor to view any profile
    const allowedRoles = ["ADMIN", "CARE_PARTNER", "DOCTOR"];
    if (id !== session.user.id && !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, firstName: true, lastName: true, dateOfBirth: true,
        gender: true, phone: true,
        // Residential address
        address: true, addressLine1: true, addressLine2: true, suburb: true, state: true, postcode: true, country: true,
        // Mailing address
        mailingAddressSameAsResidential: true, mailingAddress: true, mailingAddressLine1: true, mailingAddressLine2: true,
        mailingSuburb: true, mailingState: true, mailingPostcode: true, mailingCountry: true,
        // Journey & Triage
        journeyStatus: true, approvalStatus: true, triageScore: true, assignedCarePartnerId: true,
        // Other
        role: true, subscriptionStatus: true, subscriptionTier: true, image: true, createdAt: true, updatedAt: true,
        _count: { select: { biomarkerResults: true, healthGoals: true, labReports: true, appointments: true } },
      },
    });

    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/users/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    // Allow user to edit their own profile, or admin/care partner/doctor to edit customer profiles
    const allowedRoles = ["ADMIN", "CARE_PARTNER", "DOCTOR"];
    if (id !== session.user.id && !allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName, lastName, dateOfBirth, gender, phone, image, password, role, subscriptionStatus, subscriptionTier,
      // Residential address
      address, addressLine1, addressLine2, suburb, state, postcode, country,
      // Mailing address
      mailingAddressSameAsResidential, mailingAddress, mailingAddressLine1, mailingAddressLine2,
      mailingSuburb, mailingState, mailingPostcode, mailingCountry,
    } = body;

    // Only admins can change role/subscription (care partners and doctors cannot)
    const canChangeRoleOrSubscription = session.user.role === "ADMIN";
    if (!canChangeRoleOrSubscription && (role || subscriptionStatus || subscriptionTier)) {
      return NextResponse.json({ error: "Only admins can change role or subscription" }, { status: 401 });
    }

    const updateData: Record<string, unknown> = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    // Parse date as UTC to avoid timezone issues
    if (dateOfBirth !== undefined) {
      updateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth + "T00:00:00Z") : null;
    }
    if (gender !== undefined) updateData.gender = gender.toUpperCase();
    if (phone !== undefined) updateData.phone = phone;
    if (image !== undefined) updateData.image = image;
    if (password) updateData.passwordHash = await bcrypt.hash(password, 12);

    // Residential address
    if (address !== undefined) updateData.address = address;
    if (addressLine1 !== undefined) updateData.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) updateData.addressLine2 = addressLine2;
    if (suburb !== undefined) updateData.suburb = suburb;
    if (state !== undefined) updateData.state = state;
    if (postcode !== undefined) updateData.postcode = postcode;
    if (country !== undefined) updateData.country = country;

    // Mailing address
    if (mailingAddressSameAsResidential !== undefined) updateData.mailingAddressSameAsResidential = mailingAddressSameAsResidential;
    if (mailingAddress !== undefined) updateData.mailingAddress = mailingAddress;
    if (mailingAddressLine1 !== undefined) updateData.mailingAddressLine1 = mailingAddressLine1;
    if (mailingAddressLine2 !== undefined) updateData.mailingAddressLine2 = mailingAddressLine2;
    if (mailingSuburb !== undefined) updateData.mailingSuburb = mailingSuburb;
    if (mailingState !== undefined) updateData.mailingState = mailingState;
    if (mailingPostcode !== undefined) updateData.mailingPostcode = mailingPostcode;
    if (mailingCountry !== undefined) updateData.mailingCountry = mailingCountry;

    if (canChangeRoleOrSubscription) {
      if (role !== undefined) updateData.role = role.toUpperCase();
      if (subscriptionStatus !== undefined) updateData.subscriptionStatus = subscriptionStatus.toUpperCase();
      if (subscriptionTier !== undefined) updateData.subscriptionTier = subscriptionTier;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, email: true, firstName: true, lastName: true, dateOfBirth: true, gender: true, phone: true,
        // Residential address
        address: true, addressLine1: true, addressLine2: true, suburb: true, state: true, postcode: true, country: true,
        // Mailing address
        mailingAddressSameAsResidential: true, mailingAddress: true, mailingAddressLine1: true, mailingAddressLine2: true,
        mailingSuburb: true, mailingState: true, mailingPostcode: true, mailingCountry: true,
        // Other
        role: true, subscriptionStatus: true, subscriptionTier: true, image: true, updatedAt: true
      },
    });

    await prisma.activityLog.create({
      data: { userId: session.user.id, action: "USER_UPDATED", entity: "user", entityId: id, details: { updatedFields: Object.keys(updateData) } },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/users/[id] - Admin only
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (id === session.user.id) return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (user.role === "SUPER_ADMIN") return NextResponse.json({ error: "Cannot delete super admin" }, { status: 403 });

    await prisma.user.delete({ where: { id } });

    await prisma.activityLog.create({
      data: { userId: session.user.id, action: "USER_DELETED", entity: "user", details: { deletedUserId: id, deletedUserEmail: user.email } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
