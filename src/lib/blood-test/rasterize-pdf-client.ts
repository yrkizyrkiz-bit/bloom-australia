/**
 * Browser-only: turn pathology PDFs into high-contrast page images for Claude vision.
 * Scanned PDFs are processed page-by-page (all pages) and uploaded in small batches
 * so Netlify stays under its ~60s function limit.
 */

import { getDocument, GlobalWorkerOptions, OPS } from "pdfjs-dist";
import type { PDFPageProxy } from "pdfjs-dist";

/** Safety cap — real reports are usually well under this. */
export const MAX_PDF_PAGES = 24;
/** Pages per Claude vision request (Netlify time budget). */
export const PAGES_PER_PARSE_BATCH = 3;
const TARGET_PAGE_WIDTH = 1700;
const JPEG_QUALITY = 0.92;

let workerConfigured = false;

function ensureWorker() {
  if (workerConfigured || typeof window === "undefined") return;
  GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  workerConfigured = true;
}

function canvasToJpegFile(
  canvas: HTMLCanvasElement,
  fileName: string,
  pageNumber: number
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error(`Failed to encode PDF page ${pageNumber}`));
          return;
        }
        resolve(
          new File([blob], `${fileName.replace(/\.pdf$/i, "")}-p${pageNumber}.jpg`, {
            type: "image/jpeg",
          })
        );
      },
      "image/jpeg",
      JPEG_QUALITY
    );
  });
}

/** Stretch contrast so faint pathology scans become readable to Claude. */
function enhanceContrast(context: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  let min = 255;
  let max = 0;

  for (let i = 0; i < data.length; i += 16) {
    const y = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (y < min) min = y;
    if (y > max) max = y;
  }

  // Already high-contrast — leave alone.
  if (max - min > 140) return;

  const range = Math.max(1, max - min);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = ((data[i] - min) / range) * 255;
    data[i + 1] = ((data[i + 1] - min) / range) * 255;
    data[i + 2] = ((data[i + 2] - min) / range) * 255;
  }
  context.putImageData(image, 0, 0);
}

/**
 * Prefer the largest embedded page image (true scan quality) when present.
 * Falls back to null so the caller can canvas-render.
 */
async function tryExtractEmbeddedPageImage(
  page: PDFPageProxy
): Promise<{ width: number; height: number; canvas: HTMLCanvasElement } | null> {
  try {
    const ops = await page.getOperatorList();
    let bestName: string | null = null;
    let bestArea = 0;

    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];
      if (
        fn !== OPS.paintImageXObject &&
        fn !== OPS.paintInlineImageXObject &&
        fn !== OPS.paintImageXObjectRepeat
      ) {
        continue;
      }
      const name = ops.argsArray[i]?.[0];
      if (typeof name !== "string") continue;

      const img = await new Promise<any>((resolve) => {
        // objs.get is sync if already loaded; otherwise callback form varies by pdfjs version
        try {
          const existing = (page.objs as any).get(name);
          if (existing) {
            resolve(existing);
            return;
          }
        } catch {
          // not ready
        }
        (page.objs as any).get(name, resolve);
      });

      if (!img?.width || !img?.height || !img?.data) continue;
      const area = img.width * img.height;
      if (area > bestArea) {
        bestArea = area;
        bestName = name;
      }
    }

    if (!bestName || bestArea < 400 * 400) return null;

    const img = await new Promise<any>((resolve) => {
      try {
        const existing = (page.objs as any).get(bestName);
        if (existing) {
          resolve(existing);
          return;
        }
      } catch {
        // continue
      }
      (page.objs as any).get(bestName, resolve);
    });

    if (!img?.data || !img.width || !img.height) return null;

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const imageData = ctx.createImageData(img.width, img.height);
    // pdf.js image data is often RGBA already (kind === 2) or RGB/gray
    const src = img.data as Uint8ClampedArray | Uint8Array;
    if (src.length === img.width * img.height * 4) {
      imageData.data.set(src);
    } else if (src.length === img.width * img.height * 3) {
      for (let i = 0, j = 0; i < src.length; i += 3, j += 4) {
        imageData.data[j] = src[i];
        imageData.data[j + 1] = src[i + 1];
        imageData.data[j + 2] = src[i + 2];
        imageData.data[j + 3] = 255;
      }
    } else if (src.length === img.width * img.height) {
      for (let i = 0, j = 0; i < src.length; i++, j += 4) {
        const v = src[i];
        imageData.data[j] = v;
        imageData.data[j + 1] = v;
        imageData.data[j + 2] = v;
        imageData.data[j + 3] = 255;
      }
    } else {
      return null;
    }

    ctx.putImageData(imageData, 0, 0);
    enhanceContrast(ctx, canvas);
    return { width: img.width, height: img.height, canvas };
  } catch (error) {
    console.warn("[Upload] Embedded image extract failed, will canvas-render:", error);
    return null;
  }
}

async function renderPageToJpeg(
  page: PDFPageProxy,
  pageNumber: number,
  fileName: string
): Promise<File> {
  const embedded = await tryExtractEmbeddedPageImage(page);
  if (embedded) {
    // Downscale huge scans so payloads stay reasonable, keep readability.
    const scale = Math.min(1, TARGET_PAGE_WIDTH / embedded.width);
    if (scale < 0.999) {
      const scaled = document.createElement("canvas");
      scaled.width = Math.floor(embedded.width * scale);
      scaled.height = Math.floor(embedded.height * scale);
      const ctx = scaled.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, scaled.width, scaled.height);
        ctx.drawImage(embedded.canvas, 0, 0, scaled.width, scaled.height);
        return canvasToJpegFile(scaled, fileName, pageNumber);
      }
    }
    return canvasToJpegFile(embedded.canvas, fileName, pageNumber);
  }

  const baseViewport = page.getViewport({ scale: 1 });
  const scale = Math.min(2.8, Math.max(1.6, TARGET_PAGE_WIDTH / baseViewport.width));
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    throw new Error("Canvas not available for PDF rasterization");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  await page.render({
    canvasContext: context,
    viewport,
    canvas,
    background: "#FFFFFF",
    intent: "print",
  }).promise;

  enhanceContrast(context, canvas);
  return canvasToJpegFile(canvas, fileName, pageNumber);
}

export async function rasterizePdfToJpegFiles(
  file: File,
  options?: {
    maxPages?: number;
    onProgress?: (page: number, total: number) => void;
  }
): Promise<File[]> {
  ensureWorker();

  const maxPages = options?.maxPages ?? MAX_PDF_PAGES;
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await getDocument({ data }).promise;
  const pageCount = Math.min(pdf.numPages, maxPages);
  const images: File[] = [];

  console.log(
    `[Upload] Rasterizing all ${pageCount} page(s) from "${file.name}" (pdf has ${pdf.numPages})`
  );

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
    options?.onProgress?.(pageNumber, pageCount);
    const page = await pdf.getPage(pageNumber);
    const imageFile = await renderPageToJpeg(page, pageNumber, file.name);
    images.push(imageFile);
  }

  console.log(
    `[Upload] Rasterized PDF "${file.name}" → ${images.length} JPEG page(s); sizes: ${images
      .map((f) => `${Math.round(f.size / 1024)}KB`)
      .join(", ")}`
  );

  return images;
}

export function chunkPages<T>(items: T[], size = PAGES_PER_PARSE_BATCH): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export function isPdfFile(file: File): boolean {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}
