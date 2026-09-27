/** Renders public/icons/icon.svg to PNG app icons with the preinstalled Chromium. Run once after changing the SVG. */
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const svg = readFileSync('public/icons/icon.svg', 'utf8');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
for (const size of [192, 512, 1024]) {
  const dir = size === 1024 ? 'resources' : 'public/icons'; // 1024: iOS app icon
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<style>*{margin:0}svg{width:${size}px;height:${size}px;display:block}</style>${svg}`,
  );
  await page.screenshot({ path: `${dir}/icon-${size}.png`, omitBackground: true });
}
await browser.close();
