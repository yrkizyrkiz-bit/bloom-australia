import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the program member by email
    const member = await prisma.programMember.findUnique({
      where: { email: session.user.email },
      include: {
        clinic: {
          select: {
            name: true,
            suburb: true,
            state: true,
            leadGpName: true,
          },
        },
        carePartner: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { success: false, message: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        mobile: member.mobile,
        dob: member.dob,
        program: member.program,
        membershipStatus: member.membershipStatus,
        membershipStart: member.membershipStart,
        membershipEnd: member.membershipEnd,
        clinic: member.clinic
          ? {
              name: member.clinic.name,
              location: `${member.clinic.suburb}, ${member.clinic.state}`,
              gpName: member.clinic.leadGpName,
            }
          : null,
        carePartner: member.carePartner
          ? {
              name: `${member.carePartner.firstName} ${member.carePartner.lastName}`,
              email: member.carePartner.email,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Get member error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to get member data" },
      { status: 500 }
    );
  }
}
