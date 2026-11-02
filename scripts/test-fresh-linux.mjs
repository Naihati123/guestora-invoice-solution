// Fresh Linux install of the release ZIP, then the whole smoke suite against
// it, in Docker (docs/PRE_RELEASE_CHECKS.md, section 4). The step used to name
// a scratch script that was never kept in the repo; this is that script.
//
// Run: npm run test:fresh-linux   (needs Docker, and a ZIP from `npm run release:zip`)
//
// In Microsoft's Playwright image (Ubuntu, Node.js, Firefox): the ZIP is
// unpacked as a user would, the Linux launcher's own start script starts the
// app with its shipped packages (no npm install), and tests/smoke.mjs runs
// against it. The user's books and the Windows copy are never touched.

import { execFileSync, spawnSync } from 'child_process';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(ROOT, 'release-build');
const zips = readdirSync(out).filter((f) => /^Free-GST-Billing.*\.zip$/.test(f))
  .map((f) => join(out, f)).sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
if (!zips.length) { console.error('No release ZIP in release-build/. Run npm run release:zip first.'); process.exit(1); }
const version = (name) => JSON.parse(readFileSync(join(ROOT, 'node_modules', name, 'package.json'), 'utf8')).version;
const pw = version('playwright');
const pdfLib = version('pdf-lib');
try { execFileSync('docker', ['version'], { stdio: 'ignore' }); } catch {
  console.error('Docker is not running. Start Docker Desktop and run this again.'); process.exit(1);
}

const inner = [
  'set -e',
  'apt-get update -qq >/dev/null && apt-get install -y -qq unzip >/dev/null',
  'mkdir -p /app && cd /app && unzip -q /in/app.zip && cd /app/Free-GST-Billing',
  'chmod +x "Free GST Billing - LINUX.sh" _system/*.sh',
  'mkdir -p _system/data && echo 47431 > _system/data/port.txt',
  'echo "  Node $(node -v), starting the app with its own start script..."',
  'FREEGSTBILL_TEST=1 sh _system/open-app.sh',
  'PORT=$(cat _system/data/port.txt)',
  'mkdir -p /work && cd /work && cp -r /repo-tests ./tests && npm init -y >/dev/null',
  `npm i --silent --no-audit --no-fund playwright@${pw} pdf-lib@${pdfLib} >/dev/null`,
  'APP_URL=http://127.0.0.1:$PORT node tests/smoke.mjs',
].join('\n');

console.log(`\n  Fresh Linux install of ${zips[0].split(/[\\/]/).pop()} + smoke suite (Playwright ${pw} image)\n`);
const r = spawnSync('docker', [
  'run', '--rm',
  '-v', `${zips[0]}:/in/app.zip:ro`,
  '-v', `${join(ROOT, 'tests')}:/repo-tests:ro`,
  `mcr.microsoft.com/playwright:v${pw}-jammy`,
  'bash', '-c', inner,
], { stdio: 'inherit' });
process.exit(r.status ?? 1);
