import { StoryScene, REPLIES } from '../../StoryScene';
export const id = '_sample';
export const title = 'Base scene smoke test';
export default class Sample extends StoryScene {
  constructor() { super(id); }
  async run() {
    const { lia, wolf } = this.arena();
    await this.mark('sample.1 arena');
    const balloon = this.balloon('Thank you for calling. My name is Lia.', lia.x + 57.5, lia.y);
    await this.hold(1); await this.mark('sample.2 balloon'); balloon.destroy();
    const chat = this.chatPanel(['lia_ph: ez'], '00:03');
    const pick = await this.choose(REPLIES, 230, 420, 'sample.3 choice', 3, chat.clock);
    chat.add(pick ? `you: ${pick}` : '(nothing sent)'); wolf.setFlipX(true);
    await this.waitAdvance(); this.finish({ pick: pick || 'silence', preview: true });
  }
}
