import { describe, expect, it } from "vitest";
import sharp from "sharp";
import {
  hairComparePhotoSrc,
  parseHairCheckInPhotos,
  parseHairTimelinePhotos,
  toHairPhotoTimeline,
} from "@/lib/hair-health/compare-photos";
import { decodeHairPhotoDataUrl, makeHairPhotoThumb } from "@/lib/hair-health/compare-photos-server";

describe("hair compare photos", () => {
  it("keeps only valid image data and optional thumbs", () => {
    const photos = parseHairCheckInPhotos([
      {
        id: "hairline-1",
        angle: "hairline",
        imageData: "data:image/jpeg;base64,abc",
        thumbData: "data:image/jpeg;base64,thumb",
        capturedAt: "2026-09-01T00:00:00.000Z",
      },
      { id: "bad", angle: "crown", imageData: "https://example.com/x.jpg" },
      null,
    ]);
    expect(photos).toHaveLength(1);
    expect(photos[0]?.id).toBe("hairline-1");
    expect(photos[0]?.thumbData).toMatch(/^data:image\/jpeg;base64,/);
  });

  it("builds a timeline without image bytes", () => {
    const weeks = toHairPhotoTimeline([
      {
        weekKey: "2026-W38",
        checkedInAt: new Date("2026-09-14T00:00:00.000Z"),
        photos: [
          {
            id: "crown-1",
            angle: "crown",
            capturedAt: "2026-09-14T00:00:00.000Z",
            imageData: "data:image/jpeg;base64,should-not-copy",
          },
        ],
      },
      { weekKey: "2026-W37", checkedInAt: "2026-09-07T00:00:00.000Z", photos: [] },
    ]);
    expect(weeks).toHaveLength(1);
    expect(weeks[0]?.photos[0]).toEqual({
      id: "crown-1",
      angle: "crown",
      capturedAt: "2026-09-14T00:00:00.000Z",
    });
    expect(JSON.stringify(weeks)).not.toContain("imageData");
  });

  it("parses metadata-only photo rows from sql", () => {
    const photos = parseHairTimelinePhotos([
      { id: "side-1", angle: "side", capturedAt: "2026-09-14T00:00:00.000Z" },
    ]);
    expect(photos[0]?.angle).toBe("side");
  });

  it("decodes a data URL and builds a small thumb", async () => {
    const source = await sharp({
      create: { width: 320, height: 240, channels: 3, background: { r: 80, g: 40, b: 20 } },
    })
      .jpeg()
      .toBuffer();
    const decoded = decodeHairPhotoDataUrl(`data:image/jpeg;base64,${source.toString("base64")}`);
    expect(decoded?.mime).toBe("image/jpeg");
    expect(decoded && decoded.buffer.length).toBeGreaterThan(32);

    const thumb = await makeHairPhotoThumb(decoded!.buffer);
    const info = await sharp(thumb).metadata();
    expect(info.width).toBeLessThanOrEqual(240);
    expect(info.height).toBeLessThanOrEqual(240);
    expect(thumb.length).toBeLessThan(source.length);
  });

  it("builds a same-origin photo URL", () => {
    expect(hairComparePhotoSrc("2026-W38", "hairline-1", "thumb")).toBe(
      "/api/hair-loss/compare/photo?weekKey=2026-W38&photoId=hairline-1&size=thumb"
    );
  });
});
