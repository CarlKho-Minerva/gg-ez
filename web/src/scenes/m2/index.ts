import { StoryScene, ARENA_FLOOR, PIX, W, H, C, REPLIES } from '../../StoryScene';
import cards from './story.json';
export const id = 'm2';
export const title = 'Second match, knowing doesn’t help';
const card = (id: string) => {
  const value = cards.find(c => c.id === id);
  if (!value) throw new Error(`Missing storyboard card ${id}`);
  return value;
};
export const INNER_LINES = {
  badge: card('M2.2').narration!,
  phone: card('M2.2').alts![1].replace('Phone seen: ', ''),
  food: card('M2.2').alts![2].replace('Food seen: ', '')
};
export default class M2 extends StoryScene {
  constructor() { super(id); }
  async run() {
    const { lia, wolf } = this.arena();
    this.rect(0, 0, W, 80, 0x0c0d1c); this.rect(0, 640, W, 80, 0x0c0d1c);
    this.label('LIA / WIZARD', 40, 18, 20); this.rect(40, 52, 360, 6, 0xffffff);
    this.label('YOU / WOLF', 1070, 18, 20).setOrigin(.5, 0);
    const hp = this.rect(880, 52, 360, 6, 0xffffff);
    await this.tween(lia, { y: lia.y - 3 * PIX, yoyo: true }, .15);
    await this.mark('M2.1'); await this.hold(.8);

    const seen = (['badge', 'phone', 'food'] as const).find(k => this.ctx.seen.includes(k)) ?? 'badge';
    const inner = INNER_LINES[seen];
    const strip = this.rect(0, ARENA_FLOOR + 22, W, 46, 0x0a0a1c, .86).setAlpha(0);
    const voice = this.label(`"${inner}"`, 60, ARENA_FLOOR + 30, 24, C.paper, W - 120).setAlpha(0);
    await this.tween([strip, voice], { alpha: 1 }, .3);
    await this.mark('M2.2'); await this.hold(1.6);
    await this.tween([strip, voice], { alpha: 0 }, .3); strip.destroy(); voice.destroy();

    const cast = async (x: number) => {
      const spell = this.pixelSprite('lia-spell', 330, ARENA_FLOOR - 73 * PIX).setDepth(0);
      this.children.moveBelow(spell, wolf); spell.setAlpha(0);
      await this.tween(spell, { x, alpha: 1 }, .3, 'Quad.easeOut'); return spell;
    };
    const flinch = async (push: number) => {
      wolf.setTint(0xff8c8c); await this.tween(wolf, { x: wolf.x + push }, .2, 'Quad.easeOut'); wolf.clearTint();
    };
    const spell = await cast(390); await flinch(40); hp.setPosition(1020, 52).setSize(220, 6);
    const popBox = this.rect(770, 92, 480, 58, 0x0f1020, .92);
    const pop = this.label(card('M2.3').chat!, 784, 106, 22, C.pink);
    await this.mark('M2.3'); await this.hold(1.5); popBox.destroy(); pop.destroy(); spell.destroy();

    const spell2 = await cast(540); await flinch(0); hp.setPosition(1160, 52).setSize(80, 6);
    await this.hold(.4);
    const guard = this.rect(wolf.x - 30, wolf.y + 10, 14, 78, 0xb9bcc8);
    const delay = this.big(card('M2.4').overlay!, 92, 30);
    await this.mark('M2.4'); await this.tween(delay, { alpha: 0 }, .5);
    guard.destroy(); delay.destroy(); spell2.destroy();

    const startX = wolf.x + 40, startY = wolf.y + 46;
    const streak = this.add.graphics().lineStyle(3, 0xffffff, .8);
    streak.lineBetween(startX, startY, 1170, 216); this.children.moveBelow(streak, wolf);
    await this.tween(wolf, { x: 1130, y: 170, angle: 20 }, .5, 'Quad.easeOut');
    await this.hold(.3);
    const defeat = this.big(card('M2.5').overlay!, 180).setAlpha(0);
    await this.tween(defeat, { y: 250, alpha: 1 }, .25, 'Back.easeOut');
    await this.mark('M2.5'); await this.waitAdvance();

    defeat.setFontSize(44); await this.tween(defeat, { y: 100 }, .3);
    const chat = this.chatPanel([card('M2.6').chat!], '00:03');
    const chatObjects = [chat.panel, chat.title, chat.clock, ...chat.entries];
    chatObjects.forEach(o => o.y += H - 170);
    await this.tween(chatObjects, { y: '-=550' }, .4, 'Cubic.easeOut');
    const pick = await this.choose(REPLIES, 230, 420, 'M2.6', 3, chat.clock);
    if (pick) {
      const branch = pick === REPLIES[0] ? 'M2.7A' : 'M2.7B';
      const lines = card(branch).chat!.split('\n');
      chat.add(lines[0]); await this.hold(.8); chat.add(lines[1]);
      await this.mark(branch); await this.waitAdvance();
    } else {
      card('M2.7C').chat!.split('\n').forEach(chat.add);
      const row = this.row(['(reply box closed)'], 230, 420, () => {});
      row.querySelector('button')!.disabled = true;
      await this.mark('M2.7C'); await this.hold(1); row.remove();
    }
    // Capture the actual composited Phaser frame; HTML reply controls have already been removed.
    const canvas = this.game.canvas;
    const keys = ['m2-fold-left', 'm2-fold-right'];
    for (let i = 0; i < 2; i++) {
      const half = document.createElement('canvas'); half.width = W / 2; half.height = H;
      const context = half.getContext('2d');
      if (!context) throw new Error('Cannot capture fold frame');
      context.drawImage(canvas, i * W / 2, 0, W / 2, H, 0, 0, W / 2, H);
      if (this.textures.exists(keys[i])) this.textures.remove(keys[i]);
      this.textures.addCanvas(keys[i], half);
    }
    this.clear(); this.rect(0, 0, W, H, C.night);
    const left = this.add.image(W / 2, 0, keys[0]).setOrigin(1, 0);
    const right = this.add.image(W / 2, 0, keys[1]).setOrigin(0, 0);
    const crease = this.rect(W / 2 - 1, 0, 2, H, 0xffffff).setAlpha(0);
    this.big(card('M2.8').overlay!, 100, 30).setStroke('#111226', 10);
    try {
      await this.tween([left, right], { scaleX: .35 }, .55);
      crease.setAlpha(1); await this.mark('M2.8');
      await this.tween([left, right], { scaleX: 0 }, .35);
      crease.setPosition(W / 2 - 3, 0).setSize(6, H); await this.hold(.4);
    } finally {
      left.destroy(); right.destroy();
      keys.forEach(key => { if (this.textures.exists(key)) this.textures.remove(key); });
    }
    this.finish({ pick: pick || 'silence', seen: this.ctx.seen, inner, preview: true });
    // Missing arena music/guard/tick cues intentionally remain silent in this development preview.
  }
}
