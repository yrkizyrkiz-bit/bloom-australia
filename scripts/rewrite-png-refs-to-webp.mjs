import fs from "fs";
import path from "path";

const map = JSON.parse(fs.readFileSync("scripts/webp-conversion-map.json", "utf8"));
const pairs = map
  .map((m) => [m.from, m.to])
  .sort((a, b) => b[0].length - a[0].length);

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", "audit-package"].includes(entry.name)) continue;
      walk(full, files);
    } else if (/\.(ts|tsx|css|js|jsx)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

let filesChanged = 0;
let replacements = 0;
for (const file of walk("src")) {
  let text = fs.readFileSync(file, "utf8");
  let next = text;
  for (const [from, to] of pairs) {
    if (!next.includes(from)) continue;
    const count = next.split(from).length - 1;
    next = next.split(from).join(to);
    replacements += count;
  }
  if (next !== text) {
    fs.writeFileSync(file, next);
    filesChanged += 1;
    console.log("updated", file);
  }
}

console.log(JSON.stringify({ filesChanged, replacements }));
