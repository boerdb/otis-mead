#!/usr/bin/env node
/**
 * Opstartschermen voor de PWA op iPhone en iPad (apple-touch-startup-image).
 * Verloop zoals het app-icoon (src/app/icon.svg) met de ademcurve precies in het midden.
 * In de app neemt src/components/SplashOverlay.tsx dit beeld over (zelfde logo, zelfde plek).
 *
 *   npm run splash:generate     # schrijft public/splash/*.jpg en src/lib/pwa/splash-screens.json
 *
 * De beelden staan in git, zodat de server ze niet hoeft te maken.
 */
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "splash");
mkdirSync(outDir, { recursive: true });

/** Logo-vlak in CSS-pixels; moet gelijk zijn aan LOGO_SIZE in SplashOverlay.tsx. */
const LOGO_CSS = 168;
/** Midden van de tekening in het 512-raster van icon.svg (curven lopen van x 96–416, y 168–404). */
const CENTER = { x: 256, y: 286 };

/** [CSS-breedte, CSS-hoogte, pixelratio, naam] in staande stand. */
const DEVICES = [
  [440, 956, 3, "iPhone 16/17 Pro Max"],
  [420, 912, 3, "iPhone Air"],
  [402, 874, 3, "iPhone 16/17 Pro"],
  [430, 932, 3, "iPhone 14 Pro Max – 16 Plus"],
  [393, 852, 3, "iPhone 14 Pro – 16"],
  [428, 926, 3, "iPhone 12–14 Pro Max / Plus"],
  [390, 844, 3, "iPhone 12–14"],
  [375, 812, 3, "iPhone X – 13 mini"],
  [414, 896, 3, "iPhone XS Max / 11 Pro Max"],
  [414, 896, 2, "iPhone XR / 11"],
  [375, 667, 2, "iPhone SE / 8"],
  [1032, 1376, 2, "iPad Pro 13\""],
  [1024, 1366, 2, "iPad Pro 12.9\""],
  [834, 1210, 2, "iPad Pro 11\" (M4)"],
  [834, 1194, 2, "iPad Pro 11\""],
  [820, 1180, 2, "iPad Air"],
  [810, 1080, 2, "iPad 10.2\""],
  [744, 1133, 2, "iPad mini"],
];

/** Ademcurven uit src/app/icon.svg, zonder de blauwe tegel. */
const GLYPH = `
  <path d="M96 352 H408" stroke="#ffffff" stroke-opacity="0.28" stroke-width="10" stroke-linecap="round"/>
  <path d="M96 352 H142 C156 352 160 176 196 168 H292 C312 168 318 214 330 262 C342 314 356 352 386 352 H416"
    fill="none" stroke="#ffffff" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M96 404 H160 C174 404 178 300 206 300 C246 300 270 404 300 404 H416"
    fill="none" stroke="#5eead4" stroke-width="16" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"/>
  <circle cx="244" cy="168" r="26" fill="#fbbf24" stroke="#ffffff" stroke-width="10"/>`;

function splashSvg(w, h, dpr) {
  const scale = (LOGO_CSS * dpr) / 512;
  const tx = w / 2 - CENTER.x * scale;
  const ty = h / 2 - CENTER.y * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="#38bdf8"/>
      <stop offset="1" stop-color="#0c3a5e"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.6">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="${8 * dpr}" stdDeviation="${12 * dpr}" flood-color="#04192b" flood-opacity="0.35"/>
    </filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  <g transform="translate(${tx} ${ty}) scale(${scale})" filter="url(#shadow)">${GLYPH}</g>
</svg>`;
}

const screens = [];
for (const [cw, ch, dpr, name] of DEVICES) {
  const w = cw * dpr;
  const h = ch * dpr;
  const file = `splash-${w}x${h}.jpg`;
  await sharp(Buffer.from(splashSvg(w, h, dpr)))
    // JPEG: een zacht verloop is als PNG 5–10× groter. iOS accepteert JPEG als opstartbeeld.
    .jpeg({ quality: 88, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(path.join(outDir, file));
  screens.push({
    url: `/splash/${file}`,
    media: `(device-width: ${cw}px) and (device-height: ${ch}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)`,
    name,
  });
  console.log("splash", name, `${w}x${h}`);
}

writeFileSync(path.join(root, "src", "lib", "pwa", "splash-screens.json"), `${JSON.stringify(screens, null, 2)}\n`);
console.log(`${screens.length} opstartschermen → public/splash/`);
