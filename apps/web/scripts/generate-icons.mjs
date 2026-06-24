import sharp from "sharp";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const BRAND_COLOR = "#111111";
const FOREGROUND = "#ffffff";

function svgFor(size) {
  const fontSize = Math.round(size * 0.52);
  return `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${BRAND_COLOR}"/>
    <text x="50%" y="56%" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="700" fill="${FOREGROUND}" text-anchor="middle" dominant-baseline="middle">P</text>
  </svg>`;
}

const sizes = [192, 512];

for (const size of sizes) {
  const svg = Buffer.from(svgFor(size));
  const outPath = path.join(outDir, `icon-${size}.png`);
  await sharp(svg).png().toFile(outPath);
  console.log(`Generated ${outPath}`);
}
