import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve('dist');
const out = resolve('preview');
await mkdir(out, { recursive: true });
const missing = [];
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg' };
// Deliberately serves ONLY /sub/: an absolute /assets request fails, proving relative Vite base.
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith('/sub/')) { res.writeHead(404).end(); missing.push(url.pathname); return; }
    const file = resolve(root, decodeURIComponent(url.pathname.slice(5)) || 'index.html');
    if (!file.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    res.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
    res.end(await readFile(file));
  } catch { missing.push(req.url); res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}/sub/index.html`;
let browser;
try {
  browser = await chromium.launch({ executablePath: process.env.PREVIEW_BROWSER ?? '/Applications/Dia.app/Contents/MacOS/Dia', headless: true,
    args: ['--no-first-run', '--no-default-browser-check', '--mute-audio'] });
} catch (error) {
  await new Promise(resolve => server.close(resolve));
  throw error;
}
// Playwright creates an isolated temporary context. No Carl profile, cookies, or logged-in tabs are opened.
const results = [];
const errors = [];
const expected = ['M2.1', 'M2.2', 'M2.3', 'M2.4', 'M2.5', 'M2.6'];
async function run(name, query, action, branch, inner) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  page.on('pageerror', e => errors.push(`${name}: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`${name}: ${m.text()}`); });
  const dir = resolve(out, name); await mkdir(dir, { recursive: true });
  let shot = 0;
  await page.exposeFunction('captureBeat', async id => {
    await page.screenshot({ path: resolve(dir, `${String(++shot).padStart(2, '0')}-${id.replace(/[^a-zA-Z0-9.]/g, '-')}.png`) });
  });
  await page.addInitScript(() => { window.__captureBeat = id => window.captureBeat(id); });
  await page.goto(`${base}${query}`, { waitUntil: 'load' });
  await action?.(page);
  await page.waitForFunction(() => window.__done || window.__error, { timeout: 30000 });
  const result = await page.evaluate(() => ({ done: window.__done, error: window.__error, beats: window.__beats,
    firstBeatMs: window.__firstBeatMs, navigationToFirstBeatMs: window.__beats[0]?.at }));
  assert.equal(result.error, undefined, name);
  if (branch) {
    assert.deepEqual(result.beats.map(b => b.id), [...expected, branch, 'M2.8'], name);
    const pick = branch === 'M2.7A' ? 'okay that was clean' : branch === 'M2.7B' ? 'fuck off' : 'silence';
    assert.equal(result.done.pick, pick, name);
    assert.equal(result.done.inner, inner, name);
    assert(result.beats.find(b => b.id === 'M2.2').text.includes(`"${inner}"`));
    const replyText = result.beats.find(b => b.id === branch).text;
    if (branch === 'M2.7A') assert(replyText.includes("lia_ph: wait weren't you here earlier"));
    if (branch === 'M2.7B') assert(replyText.includes('lia_ph: HAHAHA still mad'));
    if (branch === 'M2.7C') { assert(replyText.includes('(nothing sent)')); assert(!replyText.some(t => t.startsWith('you:'))); }
  }
  await page.screenshot({ path: resolve(dir, 'done.png') });
  results.push({ name, ...result }); await page.close();
}
const badge = "Isn't her break almost over?";
const phone = "She still hasn't answered her mom.";
const food = "She's probably laughing with her mouth full of rice again.";
const beat = (page, id) => page.waitForFunction(id => window.__beat === id, id, { timeout: 30000 });
const interactive = pick => async page => {
  await beat(page, 'M2.5');
  // Result must wait for input; a real button advances, not autoplay.
  await page.waitForTimeout(200); assert.equal(await page.evaluate(() => window.__beat), 'M2.5');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await beat(page, 'M2.6');
  await page.waitForFunction(() => !!window.__choice);
  const start = await page.evaluate(() => performance.now());
  if (pick !== 'silence') await page.getByRole('button', { name: pick, exact: true }).click();
  const branch = pick === 'silence' ? 'M2.7C' : pick === 'fuck off' ? 'M2.7B' : 'M2.7A';
  await beat(page, branch);
  if (pick === 'silence') {
    const elapsed = await page.evaluate(() => performance.now()) - start;
    assert(elapsed >= 2950 && elapsed < 6000, `actual three-second timeout: ${elapsed}`);
    assert.equal(await page.getByRole('button', { name: '(reply box closed)', exact: true }).isDisabled(), true);
    results.push({ name: 'timeout-measurement', elapsedMs: elapsed });
  } else {
    assert.equal(await page.getByRole('button', { name: pick, exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
  }
};
try {
  const menu = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  menu.on('pageerror', e => errors.push(`menu: ${e.message}`));
  // Also prove the ordinary directory URL, including the empty-path index mapping.
  await menu.goto(base.replace('index.html', '')); await menu.waitForFunction(() => window.__beat === 'menu');
  assert.equal(await menu.getByRole('button').count(), 2);
  await menu.screenshot({ path: resolve(out, 'menu.png') });
  await menu.getByRole('button', { name: /^_sample/ }).click();
  await beat(menu, 'sample.3 choice'); await menu.waitForFunction(() => !!window.__choice);
  await menu.getByRole('button', { name: 'okay that was clean', exact: true }).click();
  await menu.getByRole('button', { name: 'Continue', exact: true }).click();
  await menu.waitForFunction(() => window.__done);
  assert.equal(await menu.evaluate(() => window.__done.pick), 'okay that was clean');
  await menu.goto(`${base}?scene=does-not-exist`); await menu.waitForFunction(() => window.__beat === 'menu');
  assert.equal(await menu.getByRole('button').count(), 2); await menu.close();
  await run('sample-auto', '?scene=_sample&autoplay=1', null);
  await run('auto-A-badge', '?scene=m2&autoplay=1&pick=okay%20that%20was%20clean&seen=badge', null, 'M2.7A', badge);
  await run('auto-B-phone', '?scene=m2&autoplay=1&pick=fuck%20off&seen=phone', null, 'M2.7B', phone);
  await run('auto-C-food', '?scene=m2&autoplay=1&pick=silence&seen=food', null, 'M2.7C', food);
  await run('auto-fallback', '?scene=m2&autoplay=1&pick=invalid&seen=unknown', null, 'M2.7A', badge);
  await run('auto-priority', '?scene=m2&autoplay=1&seen=food,phone,badge', null, 'M2.7A', badge);
  await run('interactive-A', '?scene=m2&seen=badge', interactive('okay that was clean'), 'M2.7A', badge);
  await run('interactive-B', '?scene=m2&seen=phone', interactive('fuck off'), 'M2.7B', phone);
  await run('interactive-timeout', '?scene=m2&seen=food', interactive('silence'), 'M2.7C', food);
  // Small-screen CSS scaling: the same real buttons remain clickable.
  const small = await browser.newPage({ viewport: { width: 640, height: 360 } });
  small.on('pageerror', e => errors.push(`small: ${e.message}`));
  await small.goto(`${base}?scene=_sample`); await beat(small, 'sample.3 choice'); await small.waitForFunction(() => !!window.__choice);
  await small.getByRole('button', { name: 'fuck off', exact: true }).click();
  await small.getByRole('button', { name: 'Continue', exact: true }).click(); await small.waitForFunction(() => window.__done);
  assert.equal(await small.evaluate(() => window.__done.pick), 'fuck off'); await small.close();
  // Scene shutdown cancels waits/tweens and removes the reply controls before another scene starts.
  const stopped = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  stopped.on('pageerror', e => errors.push(`shutdown: ${e.message}`));
  await stopped.goto(`${base}?scene=m2`); await beat(stopped, 'M2.5');
  await stopped.evaluate(() => {
    window.__previewGame.scene.stop('m2');
    window.__previewGame.scene.start('menu');
  });
  await stopped.waitForFunction(() => window.__beat === 'menu');
  await stopped.waitForTimeout(300);
  assert.equal(await stopped.evaluate(() => window.__done), undefined);
  assert.equal(await stopped.getByRole('button', { name: 'Continue', exact: true }).count(), 0);
  assert.equal(await stopped.getByRole('button').count(), 2);
  await stopped.getByRole('button', { name: /^_sample/ }).click(); await beat(stopped, 'sample.3 choice');
  await stopped.waitForFunction(() => !!window.__choice);
  await stopped.getByRole('button', { name: 'fuck off', exact: true }).click();
  await stopped.getByRole('button', { name: 'Continue', exact: true }).click();
  await stopped.waitForFunction(() => window.__done);
  assert.equal(await stopped.evaluate(() => window.__done.pick), 'fuck off'); await stopped.close();
  // Missing assets must produce a visible failure, never a false __done.
  const failed = await browser.newPage();
  await failed.route('**/assets/dain/arena-bg.png', route => route.fulfill({ status: 404, body: 'intentional test failure' }));
  await failed.goto(`${base}?scene=m2`); await failed.waitForFunction(() => !!window.__error);
  assert.match(await failed.evaluate(() => window.__error), /Asset failed: arena-bg/);
  assert.equal(await failed.evaluate(() => window.__done), undefined);
  assert.match(await failed.locator('#error').innerText(), /Preview failed/);
  await failed.close();
  assert.deepEqual(errors, [], 'browser errors');
  assert.deepEqual(missing.filter(p => p !== '/favicon.ico'), [], 'relative subpath asset requests');
  const zip = await stat(resolve('gg-ez-web-ts.zip')).catch(() => null);
  const report = { passed: true, browser: 'Dia isolated headless context', base, zipBytes: zip?.size, errors, missing, results };
  await writeFile(resolve(out, 'results.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ passed: true, runs: results.length, zipBytes: report.zipBytes,
    firstBeatMs: results.filter(r => r.firstBeatMs).map(r => ({ name: r.name, ms: r.firstBeatMs, navigationMs: r.navigationToFirstBeatMs })), out }, null, 2));
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)); }
