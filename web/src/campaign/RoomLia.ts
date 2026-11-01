import Phaser from 'phaser';

/** Room-local pixels, before the world's y=75 offset or zoom. No asset loading here.
 * Requires the existing preload keys `lia-room` (73x96) and `room` (1280x565).
 * Replace the old lia image, do not draw both. Call destroy before rebuilding room().
 */
export class RoomLia {
  private readonly root: Phaser.GameObjects.Container;
  private readonly torso: Phaser.GameObjects.Container;
  private readonly head: Phaser.GameObjects.Container;
  private readonly arm: Phaser.GameObjects.Container;
  private readonly phone: Phaser.GameObjects.Image;
  private readonly keys: string[] = [];
  private destroyed = false;
  private speaking = false;
  private pose: Pose = 'idle';
  private clock = 0;
  private blend = 1;
  private from: Acting = { ...ACTING.idle };
  private current: Acting = { ...ACTING.idle };
  private static serial = 0;

  constructor(
    private readonly scene: Phaser.Scene,
    worldContainer: Phaser.GameObjects.Container,
    private readonly reduced: boolean,
  ) {
    // This is an opaque room crop, NOT a transparent sprite. In particular its
    // right edge is the monitor and its left edge is the chair. Neither may nod.
    const source = this.source('lia-room', 73, 96);
    const room = this.source('room', 1280, 565);
    const prefix = `room-lia-${++RoomLia.serial}`;
    let root: Phaser.GameObjects.Container | undefined;
    try {
      const backing = this.canvas();
      const ctx = this.context(backing);
      ctx.drawImage(source, 0, 0);
      // Repair the character footprint with EXISTING wallpaper/chair pixels.
      // The patch never moves. Upper donor is the wall immediately left of Lia;
      // lower donor is the unoccupied left side of the original chair. No new art.
      ctx.save();
      this.path(ctx, FOOTPRINT);
      ctx.clip();
      ctx.drawImage(room, 492, 380, 73, 62, 0, 0, 73, 62);
      for (let x = 0; x < 73; x += 8) {
        ctx.drawImage(source, 16, 62, 8, 34, x, 62, 8, 34);
      }
      ctx.restore();
      const backingKey = this.texture(`${prefix}-backing`, backing);
      const bodyKey = this.texture(`${prefix}-body`, this.cut(source, BODY));
      const headKey = this.texture(`${prefix}-head`, this.cut(source, HEAD));
      const armKey = this.texture(`${prefix}-arm`, this.cut(source, ARM));
      // The little phone standing beside the desk is also from the room art.
      const phoneCanvas = document.createElement('canvas');
      phoneCanvas.width = 22; phoneCanvas.height = 39;
      this.context(phoneCanvas).drawImage(room, 734, 470, 22, 39, 0, 0, 22, 39);
      const phoneKey = this.texture(`${prefix}-phone`, phoneCanvas);

      root = scene.add.container(548, 380);
      this.root = root;
      worldContainer.add(root);
      root.add(scene.add.image(0, 0, backingKey).setOrigin(0));
      // Hip, neck and shoulder pivots keep the separate pieces overlapping at
      // their seams. Hair covers the neck; the near arm covers the shoulder.
      this.torso = scene.add.container(40, 88);
      root.add(this.torso);
      this.torso.add(scene.add.image(-40, -88, bodyKey).setOrigin(0));
      this.head = scene.add.container(0, -42);
      this.head.add(scene.add.image(-40, -46, headKey).setOrigin(0));
      this.torso.add(this.head);
      this.arm = scene.add.container(6, -41);
      this.arm.add(scene.add.image(-46, -47, armKey).setOrigin(0));
      this.torso.add(this.arm);
      this.phone = scene.add.image(12, 12, phoneKey).setOrigin(.5, .85)
        .setDisplaySize(6, 11).setAngle(88).setVisible(false);
      this.arm.add(this.phone);
      // A parent room clear must be as safe as an explicit destroy. No tweens,
      // delayed calls or global texture/frame mutations are owned by this rig.
      root.once(Phaser.GameObjects.Events.DESTROY, this.onRootDestroy);
      scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
      scene.events.once(Phaser.Scenes.Events.DESTROY, this.destroy, this);
      if (!reduced) scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
      this.render();
    } catch (error) {
      // Even partial construction must not leave textures or room children.
      scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
      scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
      scene.events.off(Phaser.Scenes.Events.DESTROY, this.destroy, this);
      root?.off(Phaser.GameObjects.Events.DESTROY, this.onRootDestroy);
      root?.destroy();
      this.releaseTextures();
      throw error;
    }
  }

  /** Existing card names are accepted; unknown names settle to idle. */
  setPose(pose: string): void {
    if (this.destroyed) return;
    const name = pose.trim().toLowerCase();
    const next = Object.hasOwn(ALIASES, name) ? ALIASES[name] : 'idle';
    if (this.pose === next) return;
    this.pose = next;
    this.from = { ...this.current };
    this.blend = this.reduced ? 1 : 0;
    this.clock = 0;
    if (this.reduced) this.current = { ...ACTING[next] };
    this.render();
  }

  /** Parent brackets dialogue with true/false. This does not play sound. */
  setSpeaking(speaking: boolean): void {
    if (this.destroyed) return;
    this.speaking = speaking;
    this.render();
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.detach();
    this.root.off(Phaser.GameObjects.Events.DESTROY, this.onRootDestroy);
    this.root.destroy();
    this.releaseTextures();
  }

  private readonly onRootDestroy = (): void => {
    if (this.destroyed) return;
    this.destroyed = true;
    this.detach();
    // Phaser destroys children immediately after this event. Their destroy
    // methods do not access pixels; these private textures have no other users.
    this.releaseTextures();
  };

  private detach(): void {
    this.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.scene.events.off(Phaser.Scenes.Events.DESTROY, this.destroy, this);
  }

  private update(_time: number, delta: number): void {
    if (this.destroyed || !this.root.active || !Number.isFinite(delta)) return;
    // A returning background tab advances at most 100ms, never a giant gesture.
    const dt = Phaser.Math.Clamp(delta, 0, 100) / 1000;
    this.clock = (this.clock + dt) % 120;
    this.blend = Math.min(1, this.blend + dt / .55);
    const t = this.blend * this.blend * (3 - 2 * this.blend);
    const target = ACTING[this.pose];
    for (const key of ACTING_KEYS) {
      this.current[key] = this.from[key] + (target[key] - this.from[key]) * t;
    }
    this.render();
  }

  private render(): void {
    const a = this.current;
    const t = this.clock;
    let nod = 0, sway = 0, tap = 0, lift = this.reduced && this.pose === 'eat' ? .85 : 0;
    if (!this.reduced) {
      // A slow head turn and shoulder shift are deliberately independent. The
      // furniture and hip stay put, and no whole-sprite scale animation is used.
      // Periods divide the 120s clock wrap, so even a long held card has no snap.
      sway = Math.sin(t * Math.PI * 2 / 4) * .6;
      nod = Math.sin(t * Math.PI * 2 / 3) * 1.15;
      if (this.speaking) nod += Math.sin(t * Math.PI * 2 / .8) * 2.1;
      if (this.pose === 'typing') tap = Math.max(0, Math.sin(t * Math.PI * 2 / .4)) * 2.1;
      if (this.pose === 'mouse') tap = Math.max(0, Math.sin(t * Math.PI * 2 / 1.2)) * 1.2;
      if (this.pose === 'laugh') nod += Math.sin(t * Math.PI * 2 / .75) * 3.8;
      if (this.pose === 'eat') {
        // One bite per four seconds: down to the container, then to the mouth.
        lift = (1 - Math.cos(t * Math.PI * 2 / 4)) * .5;
        nod += lift * 3;
      }
      if (this.pose === 'phone') lift = Math.sin(t * Math.PI * 2 / 3) * .035;
    }
    const eat = this.pose === 'eat';
    const settle = this.reduced ? 1 : this.blend;
    this.torso.setPosition(40 + a.x, 88 + a.y).setAngle(a.lean + sway);
    this.head.setPosition(0, -42 + a.headY).setAngle(a.nod + nod);
    this.arm.setPosition(6 + a.armX - (eat ? lift * 9 * settle : 0), -41 + a.armY - tap * settle)
      .setAngle(a.armAngle - (eat ? lift * 66 * settle : lift * 12 * settle));
    this.phone.setVisible(this.pose === 'phone');
  }

  private source(key: string, width: number, height: number): HTMLImageElement | HTMLCanvasElement {
    if (!this.scene.textures.exists(key)) throw new Error(`RoomLia requires preloaded texture '${key}'`);
    const texture = this.scene.textures.get(key);
    const source = texture.getSourceImage();
    if (!(source instanceof HTMLImageElement || source instanceof HTMLCanvasElement)
      || source.width !== width || source.height !== height) {
      throw new Error(`RoomLia '${key}' must be an original ${width}x${height} image`);
    }
    return source;
  }

  private canvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = 73; canvas.height = 96;
    return canvas;
  }

  private context(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('RoomLia could not create a 2D canvas');
    ctx.imageSmoothingEnabled = false;
    return ctx;
  }

  private path(ctx: CanvasRenderingContext2D, points: readonly Point[]): void {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
    ctx.closePath();
  }

  private cut(source: HTMLImageElement | HTMLCanvasElement, points: readonly Point[]): HTMLCanvasElement {
    const canvas = this.canvas();
    const ctx = this.context(canvas);
    this.path(ctx, points);
    ctx.clip();
    ctx.drawImage(source, 0, 0);
    // Clip paths antialias their edges even with smoothing off. Snap alpha to
    // binary coverage so rotating a part never introduces a pale canvas fringe.
    const pixels = ctx.getImageData(0, 0, 73, 96);
    for (let i = 3; i < pixels.data.length; i += 4) pixels.data[i] = pixels.data[i] >= 128 ? 255 : 0;
    ctx.putImageData(pixels, 0, 0);
    return canvas;
  }

  private texture(key: string, canvas: HTMLCanvasElement): string {
    const texture = this.scene.textures.addCanvas(key, canvas);
    if (!texture) throw new Error(`RoomLia could not create texture '${key}'`);
    this.keys.push(key);
    texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
    return key;
  }

  private releaseTextures(): void {
    for (const key of this.keys) {
      if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
    }
    this.keys.length = 0;
  }
}

type Point = readonly [number, number];
type Pose = 'idle' | 'typing' | 'mouse' | 'listen' | 'upright' | 'phone' | 'eat' | 'present' | 'laugh' | 'tired' | 'gesture';
type Acting = { x: number; y: number; lean: number; nod: number; headY: number; armX: number; armY: number; armAngle: number };
const ACTING_KEYS = ['x', 'y', 'lean', 'nod', 'headY', 'armX', 'armY', 'armAngle'] as const;
const acting = (lean = 0, nod = 0, armAngle = 0, x = 0, y = 0, armX = 0, armY = 0, headY = 0): Acting =>
  ({ x, y, lean, nod, headY, armX, armY, armAngle });
const ACTING: Record<Pose, Acting> = {
  idle: acting(),
  typing: acting(4, 4, -9, 1, 0, 3, 2),
  mouse: acting(2, 2, -5, 0, 0, 4, 2),
  listen: acting(-1, -5, 3),
  upright: acting(-2, -3, 0, 0, -1),
  phone: acting(2, 6, -88, 0, 0, -6, 1),
  eat: acting(2, 3, -8),
  present: acting(-2, -3, -48, 0, 0, 2, 1),
  laugh: acting(-4, -9, -20, -1),
  tired: acting(-7, 13, 15, -2, 3, -1, 3, 2),
  gesture: acting(-1, -2, -60, 0, 0, -3),
};
const ALIASES: Readonly<Record<string, Pose>> = Object.freeze({
  idle: 'idle', typing: 'typing', mouse: 'mouse', lean: 'typing', monitor: 'typing',
  listen: 'listen', look: 'listen', face: 'listen', upright: 'upright', straighten: 'upright',
  glance: 'phone', phone: 'phone', hesitate: 'phone',
  bite: 'eat', eating: 'eat', eat: 'eat', leaf: 'eat',
  present: 'present', container: 'present', laugh: 'laugh',
  leanback: 'tired', tired: 'tired', slump: 'tired',
  gesture: 'gesture', cheek: 'gesture',
});
// Coordinates are in the original 73x96 crop. Keep monitor (x>=61) and chair
// rails (left/lower edge) out of every moving part. Masks overlap at joints.
const HEAD: readonly Point[] = [[12,7],[27,7],[33,3],[40,5],[47,10],[49,18],[49,31],
  [46,31],[49,35],[48,40],[46,43],[39,44],[34,51],[31,58],[24,61],[10,59],[7,47],[7,20],[10,13]];
const BODY: readonly Point[] = [[35,41],[45,41],[49,46],[52,54],[51,69],[50,96],[30,96],[30,63],[32,52]];
const ARM: readonly Point[] = [[45,45],[49,45],[53,51],[55,55],[59,58],[60,62],[56,64],[51,62],[47,58],[43,53]];
const FOOTPRINT: readonly Point[] = [[7,5],[27,5],[33,0],[42,3],[49,9],[51,18],[51,42],
  [55,52],[61,58],[61,65],[53,67],[52,96],[28,96],[28,65],[8,62],[5,47],[5,19]];
