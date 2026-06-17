/**
 * Centered splash logo for Android 12+ splash API (same scale approach as adaptive icon).
 * Android shows a centered image + background color, not a full-bleed splash.
 *
 * Run: node scripts/generate-android-splash-icon.mjs
 */
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const source = join(root, 'assets/images/logo.png');
const output = join(root, 'assets/images/android-splash-icon.png');

const CANVAS = 1024;
const LOGO_SCALE = 0.96;
const BACKGROUND = { r: 255, g: 255, b: 255, alpha: 1 };

const logoSize = Math.round(CANVAS * LOGO_SCALE);
const inset = Math.round((CANVAS - logoSize) / 2);

const resized = await sharp(source)
  .resize(logoSize, logoSize, {
    fit: 'inside',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

const meta = await sharp(resized).metadata();
const padTop = inset + Math.round((logoSize - (meta.height ?? logoSize)) / 2);
const padLeft = inset + Math.round((logoSize - (meta.width ?? logoSize)) / 2);
const padBottom = CANVAS - (meta.height ?? logoSize) - padTop;
const padRight = CANVAS - (meta.width ?? logoSize) - padLeft;

await sharp(resized)
  .extend({
    top: padTop,
    bottom: padBottom,
    left: padLeft,
    right: padRight,
    background: BACKGROUND,
  })
  .png()
  .toFile(output);

console.log(`Wrote ${output} (logo at ${LOGO_SCALE * 100}% on white)`);
