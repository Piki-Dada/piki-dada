import sharp from "sharp";
import { mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");
const appDir = path.join(__dirname, "..", "src", "app");
const brandDir = path.join(publicDir, "brand");
mkdirSync(path.join(publicDir, "icons"), { recursive: true });

const GOLD = "#F4C12C";
const ICON_SOURCE = path.join(brandDir, "pikidada_logo2.png"); // gold circle, full icon
const HORIZONTAL_LOGO = path.join(brandDir, "pikidada_logo4.png"); // icon + wordmark, transparent

// App icons / favicons (PWA manifest + Next.js file-based metadata)
const iconTargets = [
  { out: path.join(publicDir, "icons", "icon-192.png"), size: 192 },
  { out: path.join(publicDir, "icons", "icon-512.png"), size: 512 },
  { out: path.join(appDir, "icon.png"), size: 512 },
  { out: path.join(appDir, "apple-icon.png"), size: 180 },
];

// Flatten onto solid gold first -- the source has transparent corners outside the circle,
// and the PWA "maskable" icon spec explicitly discourages transparency (platforms that
// don't auto-mask the icon would otherwise show see-through corners).
for (const { out, size } of iconTargets) {
  await sharp(ICON_SOURCE)
    .resize(size, size)
    .flatten({ background: GOLD })
    .png()
    .toFile(out);
  console.log(`Generated ${out} (${size}x${size})`);
}

// Open Graph share image: horizontal logo centered on a gold canvas
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const logoMeta = await sharp(HORIZONTAL_LOGO).metadata();
const logoTargetWidth = Math.round(OG_WIDTH * 0.7);
const logoTargetHeight = Math.round((logoTargetWidth / logoMeta.width) * logoMeta.height);
const resizedLogo = await sharp(HORIZONTAL_LOGO)
  .resize(logoTargetWidth, logoTargetHeight)
  .toBuffer();

// White background -- logo4's "dada" wordmark is a gold fill with thin outline, so it
// only reads correctly against a light background (it disappears on the brand gold itself).
const ogPath = path.join(publicDir, "brand", "og-image.png");
const goldBar = await sharp({ create: { width: OG_WIDTH, height: 16, channels: 4, background: GOLD } })
  .png()
  .toBuffer();
await sharp({
  create: { width: OG_WIDTH, height: OG_HEIGHT, channels: 4, background: "#ffffff" },
})
  .composite([
    {
      input: resizedLogo,
      left: Math.round((OG_WIDTH - logoTargetWidth) / 2),
      top: Math.round((OG_HEIGHT - logoTargetHeight) / 2),
    },
    { input: goldBar, left: 0, top: OG_HEIGHT - 16 },
  ])
  .png()
  .toFile(ogPath);
console.log(`Generated ${ogPath} (${OG_WIDTH}x${OG_HEIGHT})`);
