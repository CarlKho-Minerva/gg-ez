import Phaser from 'phaser';
import './style.css';
import { StoryScene, W, H, C, type Context } from './StoryScene';
import Campaign, { readSave } from './campaign/Campaign';
import { audio } from './campaign/Audio';
import { assetUrl } from './assets';
window.__startAt = performance.now(); window.__beats = [];
interface SceneModule { id: string; title: string; default: new () => StoryScene }
const modules = import.meta.glob<SceneModule>('./scenes/*/index.ts', { eager: true });
const registry = Object.values(modules).sort((a, b) => a.id.localeCompare(b.id));
const params = new URLSearchParams(location.search);
const ctx: Context = { autoplay: params.get('autoplay') === '1', pick: params.get('pick') ?? undefined,
  seen: (params.get('seen') ?? '').split(',').map(s => s.trim()).filter(Boolean) };
if(ctx.autoplay)audio.muted=true;
void fetch(assetUrl('assets/audio/voices.json')).then(r=>r.ok?r.json():{}).then(v=>{
  (window as Window & {__voices?:Record<string,string>}).__voices=v;
}).catch(error=>{console.warn('Voice map unavailable; dialogue remains readable.',error);});
class Menu extends Phaser.Scene {
  constructor() { super('menu'); }
  preload(){this.load.image('title-bg',assetUrl('assets/dain/arena-bg.png'));}
  create() {
    const ui = document.querySelector('#ui')!; ui.replaceChildren();
    const requested=params.get('scene');
    if(requested==='campaign'||params.has('resume')){this.scene.start('campaign',ctx);return;}
    if(requested&&registry.some(x=>x.id===requested)){this.scene.start(requested,ctx);return;}
    this.add.image(640,360,'title-bg').setDisplaySize(1280,560).setAlpha(.3);
    this.add.rectangle(0,0,W,H,0x0b0c19,.45).setOrigin(0);
    this.add.text(108,115,'GG EZ',{fontFamily:'monospace',fontSize:'120px',fontStyle:'bold',color:C.paper});
    this.add.text(115,268,'A fighting game about losing to a stranger,\nthen inconveniently discovering she’s a person.',
      {fontFamily:'Arial',fontSize:'27px',color:C.paper,lineSpacing:9});
    this.add.text(115,510,'A/D or arrows · move     W · jump     J/K · attack     L · block\nSpace / Enter · continue     Drift into objects · observe',
      {fontSize:'21px',color:C.dim,lineSpacing:12});
    this.add.text(115,635,'CARL KHO & DAIN KIM',{fontSize:'17px',color:C.dim});
    const row=document.createElement('div');row.className='button-row';row.style.left='115px';row.style.top='395px';
    const play=document.createElement('button');play.textContent='Start game';play.onclick=()=>{audio.play('chat',.25);this.scene.start('campaign',ctx);};row.append(play);
    if(readSave()){const resume=document.createElement('button');resume.textContent='Continue';resume.onclick=()=>{location.href=`${location.pathname}?resume=1`;};row.append(resume);}
    ui.append(row);window.__beat='menu';
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=>ui.replaceChildren());
  }
}
function resize() {
  // Mobile innerWidth can include the unscaled 1280px canvas overflow. Fit the
  // visible viewport instead, so the game and touch targets stay on the phone.
  const width=window.visualViewport?.width??document.documentElement.clientWidth;
  const height=window.visualViewport?.height??document.documentElement.clientHeight;
  const scale = Math.min(width / W, height / H);
  const frame = document.querySelector<HTMLDivElement>('#frame')!;
  frame.style.transform = `scale(${scale})`;
  frame.style.left = `${(width - W * scale) / 2}px`; frame.style.top = `${(height - H * scale) / 2}px`;
}
window.addEventListener('resize', resize);window.visualViewport?.addEventListener('resize',resize);resize();
const mute=document.createElement('button');mute.id='audio-toggle';mute.textContent='Sound on';mute.setAttribute('aria-label','Toggle sound');
mute.onclick=()=>{mute.textContent=audio.toggle()?'Sound off':'Sound on';};document.body.append(mute);
window.__previewGame = new Phaser.Game({ type: Phaser.CANVAS, parent: 'game', width: W, height: H,
  pixelArt: true, roundPixels: true, backgroundColor: '#111226',
  audio: { noAudio: true }, scene: [Menu, Campaign, ...registry.map(m => m.default)] });
