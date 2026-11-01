import { assetUrl } from '../assets';
/** Shipped ElevenLabs recordings; audio never controls progression. */
export class GameAudio {
  muted = false;
  private loops = new Map<string, HTMLAudioElement>();
  private active = new Set<HTMLAudioElement>();
  play(name: string, volume = .5, loop = false) {
    if (loop && this.loops.has(name)) return this.loops.get(name)!;
    const audio = new Audio(assetUrl(`assets/audio/${name}.mp3`));
    audio.volume = volume; audio.muted = this.muted; audio.loop = loop;
    this.active.add(audio);
    audio.onended = () => this.active.delete(audio);
    audio.onerror = () => { this.active.delete(audio); this.loops.delete(name); };
    if (loop) this.loops.set(name, audio);
    void audio.play().catch(() => { this.active.delete(audio); this.loops.delete(name); });
    return audio;
  }
  stop(name?: string) {
    if (name) { const a = this.loops.get(name); a?.pause(); if (a) this.active.delete(a); this.loops.delete(name); }
    else { this.active.forEach(a => a.pause()); this.active.clear(); this.loops.clear(); }
  }
  toggle() { this.muted = !this.muted; this.active.forEach(a => a.muted = this.muted); return this.muted; }
}
export const audio = new GameAudio();
