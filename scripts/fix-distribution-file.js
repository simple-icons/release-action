/**
 * Fix ncc's distribution file
 * https://github.com/vercel/ncc/issues/791#issuecomment-1468673115
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const filePath = join(__dirname, '..', 'lib/index.js');
const fileContent = await readFile(filePath, { encoding: 'utf-8' });

const pattern = /eval\("require"\)\("([-a-z_/]+)"\)/g;
const fileResult = fileContent.replace(
  pattern,
  '__WEBPACK_EXTERNAL_createRequire(import.meta.url)("$1");',
);
await writeFile(filePath, fileResult);
