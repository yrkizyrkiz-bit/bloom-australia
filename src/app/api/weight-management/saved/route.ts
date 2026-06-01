import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { SavedItemType } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemType = searchParams.get("type");

    const where: Record<string, unknown> = { userId: session.user.id };
    if (itemType) where.itemType = itemType;

    const savedItems = await prisma.savedItem.findMany({
      where,
      include: { recipe: true },
      orderBy: { createdAt: "desc" },
    });

    // Group by type
    const grouped = {
      RECIPE: savedItems.filter(i => i.itemType === "RECIPE"),
      ARTICLE: savedItems.filter(i => i.itemType === "ARTICLE"),
      VIDEO: savedItems.filter(i => i.itemType === "VIDEO"),
    };

    return NextResponse.json({ savedItems, grouped });
  } catch (error) {
    console.error("Error fetching saved items:", error);
    return NextResponse.json({ error: "Failed to fetch saved items" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { itemType, itemId, recipeId } = body;

    if (!itemType || !itemId) {
      return NextResponse.json({ error: "Item type and ID are required" }, { status: 400 });
    }

    // Check if already saved
    const existing = await prisma.savedItem.findUnique({
      where: {
        userId_itemType_itemId: {
          userId: session.user.id,
          itemType: itemType as SavedItemType,
          itemId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ error: "Already saved" }, { status: 400 });
    }

    const saved = await prisma.savedItem.create({
      data: {
        userId: session.user.id,
        itemType,
        itemId,
        recipeId: itemType === "RECIPE" ? recipeId || itemId : null,
      },
    });

    return NextResponse.json(saved, { status: 201 });
  } catch (error) {
    console.error("Error saving item:", error);
    return NextResponse.json({ error: "Failed to save item" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemType = searchParams.get("type");
    const itemId = searchParams.get("itemId");

    if (!itemType || !itemId) {
      return NextResponse.json({ error: "Item type and ID are required" }, { status: 400 });
    }

    await prisma.savedItem.delete({
      where: {
        userId_itemType_itemId: {
          userId: session.user.id,
          itemType: itemType as SavedItemType,
          itemId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing saved item:", error);
    return NextResponse.json({ error: "Failed to remove saved item" }, { status: 500 });
  }
}
