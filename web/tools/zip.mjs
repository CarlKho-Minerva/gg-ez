import { spawnSync } from 'node:child_process';
import { statSync } from 'node:fs';
import { resolve } from 'node:path';
const archive = resolve('gg-ez-web-ts.zip');
// -FS removes obsolete archive entries on repeat builds; all source paths are relative to dist.
const zipped = spawnSync('zip', ['-qrFS', archive, '.'], { cwd: resolve('dist'), stdio: 'inherit' });
if (zipped.status !== 0) process.exit(zipped.status ?? 1);
const listing = spawnSync('unzip', ['-Z1', archive], { encoding: 'utf8' });
if (listing.status !== 0 || !listing.stdout.split('\n').includes('index.html') || listing.stdout.includes('dist/')) {
  throw new Error('Archive must contain index.html at its root, not a dist folder');
}
console.log(JSON.stringify({ archive, bytes: statSync(archive).size, rootIndex: true }));
