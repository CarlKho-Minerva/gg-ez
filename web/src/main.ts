import Phaser from 'phaser';
import './style.css';
import { StoryScene, W, H, C, type Context } from './StoryScene';
window.__startAt = performance.now(); window.__beats = [];
interface SceneModule { id: string; title: string; default: new () => StoryScene }
const modules = import.meta.glob<SceneModule>('./scenes/*/index.ts', { eager: true });
const registry = Object.values(modules).sort((a, b) => a.id.localeCompare(b.id));
const ids = new Set<string>();
for (const scene of registry) {
  if (ids.has(scene.id)) throw new Error(`Duplicate scene id: ${scene.id}`);
  ids.add(scene.id);
}
const params = new URLSearchParams(location.search);
const ctx: Context = { autoplay: params.get('autoplay') === '1', pick: params.get('pick') ?? undefined,
  seen: (params.get('seen') ?? '').split(',').map(s => s.trim()).filter(Boolean) };
let initialRoute = true;
class Menu extends Phaser.Scene {
  constructor() { super('menu'); }
  create() {
    this.add.rectangle(0, 0, W, H, C.night).setOrigin(0);
    this.add.text(120, 110, 'GG EZ', { fontSize: '72px', color: C.paper });
    this.add.text(120, 210, 'WEB-NATIVE DEVELOPMENT PREVIEW\nChoose a registered storyboard scene. This is not the full game.',
      { fontSize: '24px', color: C.dim, lineSpacing: 12 });
    const ui = document.querySelector('#ui')!; ui.replaceChildren();
    const requested = initialRoute ? params.get('scene') : null;
    initialRoute = false;
    if (requested && ids.has(requested)) { this.scene.start(requested, ctx); return; }
    if (requested) this.add.text(120, 305, `Unknown scene: ${requested}`, { fontSize: '22px', color: C.pink });
    registry.forEach((entry, i) => {
      const row = document.createElement('div'); row.className = 'button-row'; row.style.left = '120px'; row.style.top = `${370 + i * 90}px`;
      const button = document.createElement('button'); button.textContent = `${entry.id} · ${entry.title}`;
      button.onclick = () => { window.__startAt = performance.now(); this.scene.start(entry.id, ctx); };
      row.append(button); ui.append(row);
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => ui.replaceChildren());
    window.__beat = 'menu';
  }
}
// A single CSS transform scales both the fixed-size canvas and accessible HTML controls.
function resize() {
  const scale = Math.min(innerWidth / W, innerHeight / H);
  const frame = document.querySelector<HTMLDivElement>('#frame')!;
  frame.style.transform = `scale(${scale})`;
  frame.style.left = `${(innerWidth - W * scale) / 2}px`; frame.style.top = `${(innerHeight - H * scale) / 2}px`;
}
window.addEventListener('resize', resize); resize();
window.__previewGame = new Phaser.Game({ type: Phaser.CANVAS, parent: 'game', width: W, height: H,
  pixelArt: true, roundPixels: true, backgroundColor: '#111226',
  audio: { noAudio: true }, scene: [Menu, ...registry.map(m => m.default)] });
