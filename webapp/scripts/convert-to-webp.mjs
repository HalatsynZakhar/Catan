import sharp from 'sharp';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function convertDir(dir) {
  if (!existsSync(dir)) return;
  const files = readdirSync(dir).filter(f => f.toLowerCase().endsWith('.png'));
  if (files.length === 0) return;

  let totalIn = 0;
  let totalOut = 0;

  console.log(`\nConverting ${files.length} PNG(s) in ${dir} ...\n`);
  for (const file of files) {
    const inPath = join(dir, file);
    const outPath = join(dir, file.replace(/\.png$/i, '.webp'));
    const inSize = statSync(inPath).size;
    const { size: outSize } = await sharp(inPath).webp({ quality: 85 }).toFile(outPath);
    totalIn += inSize;
    totalOut += outSize;
    const pct = Math.round((1 - outSize / inSize) * 100);
    console.log(
      `  ${file.padEnd(30)} ${(inSize / 1048576).toFixed(1)} MB → ${(outSize / 1048576).toFixed(2)} MB  (-${pct}%)`,
    );
  }

  const saved = totalIn - totalOut;
  console.log(
    `\n  Total: ${(totalIn / 1048576).toFixed(1)} MB → ${(totalOut / 1048576).toFixed(1)} MB` +
    `  saved ${(saved / 1048576).toFixed(1)} MB (${Math.round((saved / totalIn) * 100)}%)`,
  );
}

const publicImages = join(__dirname, '..', 'public', 'images');
const distImages   = join(__dirname, '..', 'dist',   'images');

await convertDir(publicImages);
await convertDir(distImages);

console.log('\nDone. You can now rebuild with: npm run build\n');
