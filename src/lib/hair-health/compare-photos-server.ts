import { HAIR_PHOTO_THUMB_SIZE } from "@/lib/hair-health/compare-photos";

export function decodeHairPhotoDataUrl(
  dataUrl: string
): { mime: string; buffer: Buffer } | null {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(dataUrl.trim());
  if (!match) return null;
  try {
    const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");
    if (buffer.length < 32) return null;
    return { mime: match[1], buffer };
  } catch {
    return null;
  }
}

export async function makeHairPhotoThumb(buffer: Buffer): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  return sharp(buffer)
    .rotate()
    .resize(HAIR_PHOTO_THUMB_SIZE, HAIR_PHOTO_THUMB_SIZE, {
      fit: "cover",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 58, mozjpeg: true })
    .toBuffer();
}
