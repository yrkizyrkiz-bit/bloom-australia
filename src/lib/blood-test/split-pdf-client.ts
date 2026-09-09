/**
 * Browser-only: split a pathology PDF into small multi-page PDF chunks.
 * Preserves original scan quality (unlike JPEG rasterization, which washed out pages).
 */

import { PDFDocument } from "pdf-lib";

/** Pages per Claude document request — small enough for Netlify ~60s. */
export const PAGES_PER_PARSE_BATCH = 3;
export const MAX_PDF_PAGES = 30;

export function isPdfFile(file: File): boolean {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

export function chunkPages<T>(items: T[], size = PAGES_PER_PARSE_BATCH): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Split a PDF into sequential chunk files (e.g. pages 1-3, 4-6, …).
 * Each chunk is a real PDF so Claude's document reader gets native scan quality.
 */
export async function splitPdfIntoChunkFiles(
  file: File,
  options?: {
    pagesPerChunk?: number;
    maxPages?: number;
    onProgress?: (page: number, total: number) => void;
  }
): Promise<File[]> {
  const pagesPerChunk = options?.pagesPerChunk ?? PAGES_PER_PARSE_BATCH;
  const maxPages = options?.maxPages ?? MAX_PDF_PAGES;
  const bytes = await file.arrayBuffer();
  const source = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const totalPages = Math.min(source.getPageCount(), maxPages);
  const chunks: File[] = [];
  const baseName = file.name.replace(/\.pdf$/i, "") || "report";

  console.log(
    `[Upload] Splitting PDF "${file.name}" into ${pagesPerChunk}-page chunks (${totalPages} of ${source.getPageCount()} pages)`
  );

  for (let start = 0; start < totalPages; start += pagesPerChunk) {
    const end = Math.min(start + pagesPerChunk, totalPages);
    options?.onProgress?.(end, totalPages);

    const chunkDoc = await PDFDocument.create();
    const pageIndexes = Array.from({ length: end - start }, (_, i) => start + i);
    const copied = await chunkDoc.copyPages(source, pageIndexes);
    for (const page of copied) {
      chunkDoc.addPage(page);
    }

    const chunkBytes = await chunkDoc.save();
    const chunkFile = new File(
      [chunkBytes as BlobPart],
      `${baseName}-p${start + 1}-${end}.pdf`,
      { type: "application/pdf" }
    );
    chunks.push(chunkFile);
    console.log(
      `[Upload] Chunk pages ${start + 1}-${end}: ${Math.round(chunkFile.size / 1024)}KB`
    );
  }

  return chunks;
}
