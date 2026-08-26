import sharp from "sharp";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const PUBLIC = path.join(ROOT, "public");
const SRC = path.join(ROOT, "src");

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (/\.(ts|tsx|css|js|jsx)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const used = new Set();
const re = /\/images\/[A-Za-z0-9_./%-]+\.png/gi;
for (const file of walk(SRC)) {
  const text = fs.readFileSync(file, "utf8");
  for (const match of text.matchAll(re)) {
    used.add(match[0].split("?")[0]);
  }
}

const MAX_EDGE = 1400;
const QUALITY = 80;
const MIN_BYTES = 80_000;

const results = [];

for (const rel of [...used].sort()) {
  const abs = path.join(PUBLIC, rel.replace(/^\//, ""));
  if (!fs.existsSync(abs)) {
    results.push({ rel, status: "missing" });
    continue;
  }
  const stat = fs.statSync(abs);
  if (stat.size < MIN_BYTES) {
    results.push({ rel, status: "skip-small", kb: Math.round(stat.size / 1024) });
    continue;
  }
  if (/\.original\.png$/i.test(rel)) {
    results.push({ rel, status: "skip-original" });
    continue;
  }

  const outRel = rel.replace(/\.png$/i, ".webp");
  const outAbs = path.join(PUBLIC, outRel.replace(/^\//, ""));

  const meta = await sharp(abs, { failOn: "none" }).metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;

  let pipeline = sharp(abs, { failOn: "none" }).rotate();
  if (Math.max(w, h) > MAX_EDGE) {
    pipeline =
      w >= h
        ? pipeline.resize({ width: MAX_EDGE, withoutEnlargement: true })
        : pipeline.resize({ height: MAX_EDGE, withoutEnlargement: true });
  }

  await pipeline.webp({ quality: QUALITY, effort: 5 }).toFile(outAbs);
  const outStat = fs.statSync(outAbs);
  results.push({
    rel,
    out: outRel,
    status: "converted",
    fromMB: +(stat.size / 1048576).toFixed(2),
    toKB: Math.round(outStat.size / 1024),
    dims: `${w}x${h}`,
  });
}

const converted = results.filter((r) => r.status === "converted");
const from = converted.reduce((s, r) => s + r.fromMB, 0);
const to = converted.reduce((s, r) => s + r.toKB / 1024, 0);

console.log(
  JSON.stringify(
    {
      converted: converted.length,
      fromMB: +from.toFixed(1),
      toMB: +to.toFixed(1),
      mapping: converted.map((r) => ({
        from: r.rel,
        to: r.out,
        fromMB: r.fromMB,
        toKB: r.toKB,
      })),
      other: results.filter((r) => r.status !== "converted"),
    },
    null,
    2,
  ),
);

fs.writeFileSync(
  path.join(ROOT, "scripts/webp-conversion-map.json"),
  JSON.stringify(
    converted.map((r) => ({ from: r.rel, to: r.out })),
    null,
    2,
  ),
);
