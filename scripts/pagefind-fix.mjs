import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pagefindPath = path.resolve(__dirname, '../dist/pagefind/pagefind.js');

if (fs.existsSync(pagefindPath)) {
  let content = fs.readFileSync(pagefindPath, 'utf8');
  content = content.replace(/\?ts=\$\{Date\.now\(\)\}/g, '');
  fs.writeFileSync(pagefindPath, content, 'utf8');
  console.log('Fixed cache-busting query params in pagefind.js');
} else {
  console.log('dist/pagefind/pagefind.js not found, skipping fix.');
}
