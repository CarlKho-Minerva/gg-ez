import Phaser from 'phaser';
import { assetUrl } from './assets';

export const W = 1280, H = 720, PIX = 2.5, ARENA_TOP = 80, ARENA_FLOOR = 570;
export const C = { night: 0x111226, paper: '#f4f2eb', ink: '#141625', pink: '#ff729b', dim: '#8991b9' };
export const REPLIES = ['okay that was clean', 'fuck off'] as const;
export interface Context { autoplay: boolean; pick?: string; seen: string[]; losses?: number; pick_history?: string[] }
export interface Beat { id: string; at: number; text: string[] }
declare global {
  interface Window {
    __beat?: string; __done?: Record<string, unknown>; __error?: string;
    __beats: Beat[]; __firstBeatMs?: number; __startAt: number;
    __captureBeat?: (id: string) => Promise<void>;
    __choice?: { deadline: number; options: readonly string[] };
    __previewGame?: Phaser.Game;
  }
}

export abstract class StoryScene extends Phaser.Scene {
  ctx!: Context;
  protected abort = new AbortController();
  protected ui = document.querySelector<HTMLDivElement>('#ui')!;
  private labels: Phaser.GameObjects.Text[] = [];

  init(ctx: Context) {
    this.ctx = ctx;
    this.abort = new AbortController();
    window.__beat = undefined; window.__done = undefined; window.__error = undefined;
    window.__beats = []; window.__choice = undefined;
    window.__firstBeatMs = undefined;
    this.ui.replaceChildren(); this.labels = [];
  }
  preload() {
    for (const name of ['arena-bg', 'lia-wizard', 'wolf', 'lia-spell', 'wolf-crescent']) {
      if (!this.textures.exists(name)) this.load.image(name, assetUrl(`assets/dain/${name}.png`));
    }
    const onError = (file: { key: string }) => this.fail(new Error(`Asset failed: ${file.key}`));
    this.load.on('loaderror', onError);
    this.load.once('complete', () => this.load.off('loaderror', onError));
  }
  create() {
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.abort.abort(); this.ui.replaceChildren(); window.__choice = undefined;
    });
    if (!window.__error) void this.run().catch(error => {
      if (!this.abort.signal.aborted) this.fail(error);
    });
  }
  abstract run(): Promise<void>;
  protected fail(error: unknown) {
    window.__error = String(error); console.error(error);
    const panel = document.createElement('div'); panel.id = 'error'; panel.textContent = `Preview failed\n${error}`;
    this.ui.replaceChildren(panel);
  }
  protected check() { if (this.abort.signal.aborted) throw new Error('Scene stopped'); }
  async hold(seconds: number) {
    this.check();
    const ms = 1000 * (this.ctx.autoplay ? Math.min(seconds, .25) : seconds);
    await new Promise<void>((resolve, reject) => {
      const onAbort = () => { clearTimeout(timer); reject(new Error('Scene stopped')); };
      const timer = setTimeout(() => { this.abort.signal.removeEventListener('abort', onAbort); resolve(); }, ms);
      this.abort.signal.addEventListener('abort', onAbort, { once: true });
    });
    this.check();
  }
  async mark(id: string) {
    this.check();
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    this.check();
    window.__beat = id;
    const at = performance.now();
    window.__firstBeatMs ??= at - window.__startAt;
    window.__beats.push({ id, at, text: this.labels.filter(t => t.active && t.visible && t.alpha > 0).map(t => t.text) });
    await window.__captureBeat?.(id);
    this.check();
  }
  finish(result: Record<string, unknown>) { this.check(); window.__done = result; window.__choice = undefined; }
  rect(x: number, y: number, w: number, h: number, color: number, alpha = 1) {
    return this.add.rectangle(x, y, w, h, color, alpha).setOrigin(0);
  }
  label(text: string, x: number, y: number, size = 24, color = C.paper, width = 0) {
    const t = this.add.text(x, y, text, { fontFamily: 'Arial, sans-serif', fontSize: `${size}px`, color,
      wordWrap: width ? { width, useAdvancedWrap: true } : undefined });
    this.labels.push(t); return t;
  }
  big(text: string, y = 250, size = 72) { return this.label(text, W / 2, y, size).setAlign('center').setOrigin(.5, 0); }
  pixelSprite(key: string, x: number, y: number, flip = false) {
    return this.add.image(x, y, key).setOrigin(0).setScale(PIX).setFlipX(flip);
  }
  arena() {
    this.rect(0, 0, W, H, C.night);
    this.pixelSprite('arena-bg', 0, ARENA_TOP);
    const lia = this.pixelSprite('lia-wizard', 300, ARENA_FLOOR - 43 * PIX);
    const wolf = this.pixelSprite('wolf', 900, ARENA_FLOOR - 37 * PIX);
    return { lia, wolf };
  }
  balloon(text: string, headX: number, headY: number) {
    const x = Phaser.Math.Clamp(headX - 200, 20, W - 500);
    const label = this.label(text, x + 20, 0, 26, C.ink, 440);
    const height = Math.max(80, label.height + 36), y = Math.max(78, headY - height - 42);
    label.y = y + 18;
    const box = this.rect(x, y, 480, height, 0xf4f2eb);
    const pointer = this.add.graphics().fillStyle(0xf4f2eb).fillTriangle(headX - 12, y + height - 1, headX + 12, y + height - 1, headX, headY - 8);
    this.children.moveBelow(box,label); this.children.moveBelow(pointer,label);
    return { destroy: () => { box.destroy(); pointer.destroy(); label.destroy(); } };
  }
  chatPanel(lines: string[], timer = '') {
    const panel = this.rect(190, 170, 900, 380, 0x0f1020, .96);
    const title = this.label('MATCH CHAT', 210, 188, 20, C.dim);
    const clock = this.label(timer, 992, 188, 20, C.dim);
    const entries: Phaser.GameObjects.Text[] = [];
    const add = (line: string) => entries.push(this.label(line, 214, 236 + entries.length * 44, 28, line.startsWith('lia_ph') ? C.pink : C.paper, 850));
    lines.forEach(add);
    return { panel, title, clock, add, entries };
  }
  protected row(options: readonly string[], x: number, y: number, onPick: (pick: string) => void) {
    const row = document.createElement('div'); row.className = 'button-row'; row.style.left = `${x}px`; row.style.top = `${y}px`;
    for (const option of options) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = option;
      button.addEventListener('click', () => { if (!this.abort.signal.aborted) onPick(option); }); row.append(button);
    }
    this.ui.append(row); return row;
  }
  async waitAdvance() {
    if (this.ctx.autoplay) return this.hold(.2);
    this.check();
    await new Promise<void>((resolve, reject) => {
      const row = this.row(['Continue'], 540, 618, () => done());
      const onKey = (e: KeyboardEvent) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); done(); } };
      const cleanup = () => { row.remove(); window.removeEventListener('keydown', onKey); this.abort.signal.removeEventListener('abort', onAbort); };
      const done = () => { cleanup(); resolve(); };
      const onAbort = () => { cleanup(); reject(new Error('Scene stopped')); };
      window.addEventListener('keydown', onKey); this.abort.signal.addEventListener('abort', onAbort, { once: true });
    });
    this.check();
  }
  async choose(options: readonly string[], x = 230, y = 420, card = '', seconds = 3,
    clock?: Phaser.GameObjects.Text): Promise<string> {
    this.check();
    let picked: string | undefined;
    const row = this.row(options, x, y, p => { if (window.__choice && performance.now() <= window.__choice.deadline) picked ??= p; });
    // The actual choice window starts after the capture handshake, not during screenshot I/O.
    if (card) await this.mark(card);
    const deadline = performance.now() + seconds * 1000;
    window.__choice = { deadline, options };
    try {
      if (this.ctx.autoplay) {
        await this.hold(.3);
        return this.ctx.pick === 'silence' ? '' : options.includes(this.ctx.pick ?? '') ? this.ctx.pick! : options[0];
      }
      while (picked === undefined && performance.now() < deadline) {
        if (clock) clock.setText(`00:${Math.max(0, Math.ceil((deadline - performance.now()) / 1000)).toString().padStart(2, '0')}`);
        await this.hold(.016);
      }
      if (clock) clock.setText('00:00');
      return picked ?? '';
    } finally { row.remove(); window.__choice = undefined; }
  }
  async tween(targets: Phaser.Types.Tweens.TweenBuilderConfig['targets'], props: Record<string, unknown>, seconds: number, ease = 'Sine.easeInOut') {
    this.check();
    await new Promise<void>((resolve, reject) => {
      const onAbort = () => { tween.stop(); reject(new Error('Scene stopped')); };
      const tween = this.tweens.add({ targets, ...props, duration: (this.ctx.autoplay ? Math.min(seconds, .1) : seconds) * 1000, ease,
        onComplete: () => { this.abort.signal.removeEventListener('abort', onAbort); resolve(); } });
      this.abort.signal.addEventListener('abort', onAbort, { once: true });
    });
    this.check();
  }
  clear() { this.children.removeAll(true); this.labels = []; this.ui.replaceChildren(); }
}
