import type { HairCheckInPhoto, HairPhotoAngle } from "@/lib/hair-health/weekly-check-in";

export const HAIR_COMPARE_WEEK_LIMIT = 52;
export const HAIR_PHOTO_THUMB_SIZE = 240;
const MAX_IMAGE_CHARS = 900_000;
const MAX_THUMB_CHARS = 80_000;

export type HairTimelinePhoto = {
  id: string;
  angle: HairPhotoAngle | string;
  capturedAt: string;
};

export type HairTimelineWeek = {
  weekKey: string;
  checkedInAt: string;
  photos: HairTimelinePhoto[];
};

export function parseHairCheckInPhotos(input: unknown): HairCheckInPhoto[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((photo) => photo && typeof photo === "object")
    .slice(0, 3)
    .map((photo, index) => {
      const row = photo as Record<string, unknown>;
      const imageData = typeof row.imageData === "string" ? row.imageData : "";
      const thumbData = typeof row.thumbData === "string" ? row.thumbData : undefined;
      return {
        id: typeof row.id === "string" && row.id ? row.id : `photo-${index + 1}`,
        angle: typeof row.angle === "string" && row.angle ? row.angle : "hairline",
        imageData: imageData.slice(0, MAX_IMAGE_CHARS),
        thumbData:
          thumbData && thumbData.startsWith("data:image/")
            ? thumbData.slice(0, MAX_THUMB_CHARS)
            : undefined,
        capturedAt:
          typeof row.capturedAt === "string" ? row.capturedAt : new Date().toISOString(),
      };
    })
    .filter((photo) => photo.imageData.startsWith("data:image/"));
}

export function toHairPhotoTimeline(
  checkIns: Array<{ weekKey: string; checkedInAt: Date | string; photos: unknown }>
): HairTimelineWeek[] {
  return checkIns
    .map((row) => ({
      weekKey: row.weekKey,
      checkedInAt:
        row.checkedInAt instanceof Date ? row.checkedInAt.toISOString() : String(row.checkedInAt),
      photos: parseHairTimelinePhotos(row.photos),
    }))
    .filter((week) => week.photos.length > 0);
}

export function parseHairTimelinePhotos(input: unknown): HairTimelinePhoto[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((photo) => photo && typeof photo === "object")
    .map((photo, index) => {
      const row = photo as Record<string, unknown>;
      return {
        id: typeof row.id === "string" && row.id ? row.id : `photo-${index + 1}`,
        angle: typeof row.angle === "string" && row.angle ? row.angle : "hairline",
        capturedAt:
          typeof row.capturedAt === "string" ? row.capturedAt : new Date().toISOString(),
      };
    });
}

export function hairComparePhotoSrc(
  weekKey: string,
  photoId: string,
  size: "thumb" | "full"
): string {
  const params = new URLSearchParams({
    weekKey,
    photoId,
    size,
  });
  return `/api/hair-loss/compare/photo?${params.toString()}`;
}

export function formatHairWeekLabel(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "Week";
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
