import { assetUrl } from '../assets';
/** Shipped ElevenLabs recordings; audio never controls progression. */
export class GameAudio {
  muted = false;
  private loops = new Map<string, HTMLAudioElement>();
  private active = new Set<HTMLAudioElement>();
  private pools = new Map<string, HTMLAudioElement[]>();
  private volumes = new WeakMap<HTMLAudioElement,number>();
  private ducked = false;
  play(name: string, volume = .5, loop = false) {
    if (loop && this.loops.has(name)) return this.loops.get(name)!;
    const pool=this.pools.get(name) ?? [];
    let audio=pool.find(a=>a.paused||a.ended);
    if(!audio){audio=pool.length<4?new Audio(assetUrl(`assets/audio/${name}.mp3`)):pool[0];if(!pool.includes(audio))pool.push(audio);}
    this.pools.set(name,pool);audio.pause();audio.currentTime=0;
    this.volumes.set(audio,volume);audio.volume = volume*(loop&&this.ducked?.3:1); audio.muted = this.muted; audio.loop = loop;
    this.active.add(audio);
    audio.onended = () => this.active.delete(audio);
    audio.onerror = () => { this.active.delete(audio); this.loops.delete(name); };
    if (loop) this.loops.set(name, audio);
    void audio.play().catch(() => { this.active.delete(audio); this.loops.delete(name); });
    return audio;
  }
  stopClip(clip?:HTMLAudioElement) { if(clip){clip.pause();this.active.delete(clip);} }
  duck(value:boolean) {this.ducked=value;this.loops.forEach(a=>a.volume=(this.volumes.get(a)??.2)*(value?.3:1));}
  stop(name?: string) {
    if (name) { const a = this.loops.get(name); a?.pause(); if (a) this.active.delete(a); this.loops.delete(name); }
    else { this.active.forEach(a => a.pause()); this.active.clear(); this.loops.clear(); }
  }
  toggle() { this.muted = !this.muted; this.active.forEach(a => a.muted = this.muted); return this.muted; }
}
export const audio = new GameAudio();
