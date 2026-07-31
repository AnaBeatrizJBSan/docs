import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const sourceImage = path.join(rootDir, 'src', 'assets', 'logo_docs.png');
const publicDir = path.join(rootDir, 'public');

const sizes = [
  { name: 'pwa-64x64.png', size: 64 },
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'maskable-icon-512x512.png', size: 512 },
  { name: 'apple-touch-icon-180x180.png', size: 180 },
];

async function generate() {
  console.log('Generating PWA icons from:', sourceImage);
  for (const { name, size } of sizes) {
    const outputPath = path.join(publicDir, name);
    await sharp(sourceImage)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFile(outputPath);
    console.log(`Generated ${name} (${size}x${size})`);
  }
  console.log('Done generating PWA icons!');
}

generate().catch((err) => {
  console.error('Failed to generate PWA icons:', err);
  process.exit(1);
});
