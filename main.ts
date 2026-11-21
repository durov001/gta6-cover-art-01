// Velvet Heat Cover Studio — make.fun entrypoint (Node 22, stdlib only).
// Copies app/ and screenshots/ into the output directory and writes
// dossier.json with the kit's buildDossier. Runs twice in the grader;
// both runs must write identical bytes.

import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};

// Copy a directory tree in sorted order so the output layout is stable
// across runs. Returns the number of files copied.
function copyTree(src: string, dest: string): number {
  mkdirSync(dest, { recursive: true });
  let copied = 0;
  for (const name of readdirSync(src).sort()) {
    const from = join(src, name);
    const to = join(dest, name);
    if (statSync(from).isDirectory()) {
      copied += copyTree(from, to);
    } else {
      copyFileSync(from, to);
      copied += 1;
    }
  }
  return copied;
}

function main(): void {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  // Fail fast with a readable message instead of a cryptic dossier error.
  if (!existsSync(join(here, 'app', 'index.html'))) {
    throw new Error('main.ts: app/index.html is missing');
  }
  const shotNames = readdirSync(join(here, 'screenshots')).filter((n) => !n.startsWith('.'));
  if (shotNames.length < 3 || shotNames.length > 4) {
    throw new Error(`main.ts: expected 3-4 screenshots, found ${shotNames.length}`);
  }

  const appFiles = copyTree(join(here, 'app'), join(outDir, 'app'));
  const shotFiles = copyTree(join(here, 'screenshots'), join(outDir, 'screenshots'));

  const dossier = buildDossier(outDir, caps);
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  console.log(`velvet-heat: ${appFiles} app files, ${shotFiles} screenshots, dossier ${dossier.length} bytes`);
}

try {
  main();
} catch (err) {
  console.error(`velvet-heat: build failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
}
