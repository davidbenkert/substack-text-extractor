import { mkdir, cp, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { build } from 'esbuild';

const root = resolve('.');
const outdir = resolve(root, 'dist');

const bundle = async (entryPoints, outfile, format = 'iife') => {
  await build({
    entryPoints: [resolve(root, entryPoints)],
    outfile: resolve(outdir, outfile),
    bundle: true,
    format,
    target: 'chrome114',
    platform: 'browser',
    sourcemap: false,
    legalComments: 'none'
  });
};

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

await Promise.all([
  bundle('src/popup/main.ts', 'popup.js'),
  bundle('src/extract/runExtraction.ts', 'extract.js')
]);

const copies = [
  ['manifest.json', 'manifest.json'],
  ['src/popup/index.html', 'popup.html'],
  ['src/popup/styles.css', 'styles.css'],
  ['icons', 'icons']
];

await Promise.all(
  copies.map(async ([from, to]) => {
    const destination = resolve(outdir, to);
    await mkdir(dirname(destination), { recursive: true });
    await cp(resolve(root, from), destination, { recursive: true });
  })
);