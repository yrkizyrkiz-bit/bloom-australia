import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EMAIL_TEMPLATES } from "@/lib/email";

// GET - Fetch all email templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const slug = searchParams.get("slug");

    // If specific slug requested
    if (slug) {
      const template = await prisma.emailTemplate.findUnique({
        where: { slug },
      });
      return NextResponse.json({ template });
    }

    // Fetch all templates
    const templates = await prisma.emailTemplate.findMany({
      where: {
        isActive: true,
        ...(category && { category: category as any }),
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching email templates:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}

// POST - Create or seed email templates
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    // Seed default templates
    if (action === "seed") {
      const seededTemplates = [];

      for (const [key, template] of Object.entries(EMAIL_TEMPLATES)) {
        const existing = await prisma.emailTemplate.findUnique({
          where: { slug: template.slug },
        });

        if (!existing) {
          const created = await prisma.emailTemplate.create({
            data: {
              name: template.name,
              slug: template.slug,
              category: template.category as any,
              subject: template.subject,
              body: template.body,
              variables: template.variables,
              description: `Default ${template.name.toLowerCase()} template`,
              createdBy: session.user.id,
            },
          });
          seededTemplates.push(created);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Seeded ${seededTemplates.length} templates`,
        templates: seededTemplates,
      });
    }

    // Create custom template
    const { name, slug, category, subject, body: templateBody, variables, description } = body;

    if (!name || !slug || !category || !subject || !templateBody) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if slug already exists
    const existing = await prisma.emailTemplate.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json({ error: "Template with this slug already exists" }, { status: 400 });
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        slug,
        category,
        subject,
        body: templateBody,
        variables: variables || [],
        description,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error creating email template:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}

// PATCH - Update email template
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: "Template ID required" }, { status: 400 });
    }

    const template = await prisma.emailTemplate.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("Error updating email template:", error);
    return NextResponse.json({ error: "Failed to update template" }, { status: 500 });
  }
}

// DELETE - Delete email template
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Template ID required" }, { status: 400 });
    }

    await prisma.emailTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting email template:", error);
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 });
  }
}
