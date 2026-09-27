import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseHairCheckInPhotos } from "@/lib/hair-health/compare-photos";
import { decodeHairPhotoDataUrl, makeHairPhotoThumb } from "@/lib/hair-health/compare-photos-server";

export const runtime = "nodejs";

function imageResponse(body: Buffer, mime: string, cacheSeconds: number) {
  return new NextResponse(new Uint8Array(body), {
    status: 200,
    headers: {
      "Content-Type": mime,
      "Content-Length": String(body.length),
      "Cache-Control": `private, max-age=${cacheSeconds}`,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const weekKey = request.nextUrl.searchParams.get("weekKey")?.trim() || "";
    const photoId = request.nextUrl.searchParams.get("photoId")?.trim() || "";
    const size = request.nextUrl.searchParams.get("size") === "full" ? "full" : "thumb";

    if (!weekKey || !photoId) {
      return NextResponse.json({ error: "Missing photo" }, { status: 400 });
    }

    const checkIn = await prisma.hairWeeklyCheckIn.findUnique({
      where: {
        userId_weekKey: { userId: session.user.id, weekKey },
      },
      select: { id: true, photos: true },
    });
    if (!checkIn) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const photos = parseHairCheckInPhotos(checkIn.photos);
    const photo = photos.find((item) => item.id === photoId);
    if (!photo) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (size === "thumb" && photo.thumbData) {
      const decoded = decodeHairPhotoDataUrl(photo.thumbData);
      if (decoded) return imageResponse(decoded.buffer, decoded.mime, 60 * 60 * 24);
    }

    const decoded = decodeHairPhotoDataUrl(size === "full" ? photo.imageData : photo.thumbData || photo.imageData);
    if (!decoded) {
      return NextResponse.json({ error: "Photo unreadable" }, { status: 422 });
    }

    if (size === "full") {
      return imageResponse(decoded.buffer, decoded.mime, 60 * 60);
    }

    const thumb = await makeHairPhotoThumb(decoded.buffer);
    const thumbData = `data:image/jpeg;base64,${thumb.toString("base64")}`;
    void prisma.hairWeeklyCheckIn
      .update({
        where: { id: checkIn.id },
        data: {
          photos: photos.map((item) =>
            item.id === photo.id ? { ...item, thumbData } : item
          ),
        },
      })
      .catch((error) => {
        console.error("[hair-loss/compare photo thumb persist]", error);
      });

    return imageResponse(thumb, "image/jpeg", 60 * 60 * 24);
  } catch (error) {
    console.error("[hair-loss/compare photo]", error);
    return NextResponse.json({ error: "Failed to load photo" }, { status: 500 });
  }
}
