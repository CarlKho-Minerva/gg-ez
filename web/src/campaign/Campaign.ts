import Phaser from 'phaser';
import { StoryScene, C, W, H, REPLIES } from '../StoryScene';
import early from './early.json';
import act3 from './act3.json';
import final from './final.json';
import { audio } from './Audio';
import { assetUrl } from '../assets';
import { Effects } from './Effects';
import { exploreRoom, type Discovery } from './Exploration';
import { RoomLia } from './RoomLia';

type Card = { id: string; title: string; view: string; pose?: string; mode?: string; speech?: string; customer?: string; monitor?: string; chat?: string; overlay?: string; action?: string; duration?: string };
type Save = { chapter: number; seen: string[]; replies: string[]; version: number; outcome?: 'win'|'loss' };
const GLOSS: Record<string,string> = {
  'R.2': 'Wow.', 'R.5': 'Oops. Wrong window.', 'C1.10': 'There. Customer empathy.',
  'C1.11': 'Seriously. What else do they want?', 'P.5': 'It has vegetables. Technically.',
  'K.5': 'At least in the game, I know I’m good at something.', 'N.5': 'One more.', 'E.6': 'Okay. I can do this.'
};
/** Set to a URL that accepts a JSON POST to collect survey answers; empty keeps them on the device. */
const SURVEY_ENDPOINT = '';
export function readSave(): Save | null {
  try { const s = JSON.parse(localStorage.getItem('gg-ez-save-v1') ?? 'null');
    return s?.version === 1 && Number.isInteger(s.chapter) && s.chapter >= 0 && s.chapter < 13 &&
      Array.isArray(s.seen) && s.seen.every((x: unknown) => ['badge','phone','food'].includes(String(x))) &&
      Array.isArray(s.replies) && s.replies.every((x: unknown) => [...REPLIES, 'silence'].includes(String(x))) ? s : null;
  } catch { return null; }
}

export default class Campaign extends StoryScene {
  private chapter = 0;
  private seen = new Set<string>();
  private replies: string[] = [];
  private outcome: 'win' | 'loss' = 'loss';
  private world?: Phaser.GameObjects.Container;
  private ghost?: Phaser.GameObjects.Image;
  private roomLia?: RoomLia;
  private head = { x: 570, y: 490 };
  private cleanup: (() => void)[] = [];
  private roomClock = '2:07 AM';
  private status = 'ON BREAK';
  private lastKnockout: {x: number;y: number;angle: number}[] = [];
  private lastArenaFrame?: HTMLCanvasElement;
  private fx!: Effects;
  private roomTransform?: {x:number;y:number;scale:number};
  constructor() { super('campaign'); }
  preload() {
    super.preload();
    this.load.image('room', assetUrl('assets/dain/room-retrofitted.png'));
    this.load.image('lia-room', assetUrl('assets/dain/lia-room-character.png'));
    this.load.image('food-close', assetUrl('assets/dain/food-close.png'));
    this.load.image('food-desk', assetUrl('assets/dain/food-desk.png'));
  }
  async run() {
    this.fx=new Effects(this);
    const p = new URLSearchParams(location.search);
    const saved = p.get('resume') === '1' ? readSave() : null;
    this.chapter = saved?.chapter ?? Math.max(0, Math.min(12, Number(p.get('chapter')) || 0));
    this.seen = new Set(saved?.seen ?? this.ctx.seen); this.replies = saved?.replies ?? [];
    this.outcome = saved?.outcome === 'win' ? 'win' : 'loss';
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => { this.resetStage(); audio.stop(); });
    const scenes = [() => this.matchmaking(), () => this.firstMatch(), () => this.rematch(),
      () => this.connection(), () => this.firstVisit(), () => this.secondMatch(), () => this.roomCards(act3.v2),
      () => this.roomCards(act3.c1), () => this.mama(), () => this.mika(), () => this.night(),
      () => this.finalFight(), () => this.ending()];
    for (; this.chapter < scenes.length; this.chapter++) {
      this.check(); this.save();
      await this.mark(`chapter.${this.chapter + 1}`); await scenes[this.chapter]();
    }
  }
  private save() {
    if (this.ctx.autoplay) return;
    try { localStorage.setItem('gg-ez-save-v1', JSON.stringify({ version: 1, chapter: this.chapter, seen: [...this.seen], replies: this.replies, outcome:this.outcome })); } catch { /* Storage may be disabled in an itch iframe. */ }
  }
  private resetStage() { this.stopVoice(); this.roomLia?.destroy();this.roomLia=undefined;this.fx?.clear(); this.cleanup.splice(0).forEach(f => f()); this.tweens.killAll(); this.cameras.main?.resetFX(); super.clear(); this.world = undefined; this.ghost = undefined; }
  private stage() { this.resetStage(); this.rect(0, 0, W, H, C.night); }
  private hud(text: string) { this.label(text, 34, 25, 19, C.dim); }
  private async beat(id: string, seconds = .7, advance = false) { await this.mark(id); await this.hold(seconds); if (advance) await this.waitAdvance(); }
  private async say(text: string, id: string, speaker = 'lia', gloss = '') {
    const bubble = this.balloon(text, speaker === 'lia' ? this.head.x : 990, speaker === 'lia' ? this.head.y : 280);
    const small = gloss ? this.label(gloss, 640, 582, 21, C.paper, 1060).setOrigin(.5, 0).setAlign('center') : null;
    const speakerLabel = speaker === 'caller' ? this.label('CALLER · THROUGH THE HEADSET', 720, 84, 17, C.dim) : null;
    // All dialogue remains readable until the player advances. Optional voice files are mapped below.
    this.voice(id, speaker);this.roomLia?.setSpeaking(speaker==='lia');
    try{await this.beat(id, .35, true);}finally{bubble.destroy();small?.destroy();speakerLabel?.destroy();this.roomLia?.setSpeaking(false);this.stopVoice();}
  }
  private currentVoice?: HTMLAudioElement;
  private onVoiceEnd=()=>audio.duck(false);
  private voice(id: string, speaker: string) {
    const files = (window as Window & { __voices?: Record<string,string> }).__voices;
    const file = files?.[`${id}:${speaker}`];
    if (file && !this.ctx.autoplay) {audio.duck(true);this.currentVoice = audio.play(file, .75);this.currentVoice.addEventListener('ended',this.onVoiceEnd,{once:true});}
  }
  private stopVoice() {this.currentVoice?.removeEventListener('ended',this.onVoiceEnd);audio.stopClip(this.currentVoice);this.currentVoice = undefined;audio.duck(false); }
  private room(zoom = 1, ghost = true) {
    // Close-ups stay in the room, rather than jumping to a two-times crop.
    zoom = Math.min(zoom, 1.3);
    this.stage(); audio.stop('queue'); audio.stop('arcade');audio.stop('type');if (!this.ctx.autoplay){audio.play('room', .24, true);audio.play('street',.055,true);}
    this.world = this.add.container(0, 75);
    const bg = this.add.image(0, 0, 'room').setOrigin(0).setDisplaySize(1280, 565); this.world.add(bg);
    const monitor = this.add.rectangle(640, 416, 58, 36, 0x66cfc9, .9); this.world.add(monitor);
    const screen = this.add.text(620, 408, this.status === 'ON BREAK' ? (this.seen.size>=2?'QUEUE':'GG EZ') : 'WORK', {fontFamily:'monospace',fontSize:'11px',color:'#183d51'}); this.world.add(screen);
    // Dinner is an actual object on the desk, not a floating UI button.
    const plate = this.add.image(711,452,'food-desk').setScale(1.15); this.world.add(plate);
    // Art-aligned head, shoulder and arm movement; the desk and chair stay still.
    this.roomLia=new RoomLia(this,this.world,this.fx.reduced);
    this.roomLia.setPose(this.status==='ON BREAK'?'mouse':'typing');
    const fan = this.add.graphics().lineStyle(2, 0x91aaa6, .55);
    fan.strokeCircle(1158, 454, 21); fan.lineBetween(1158, 475, 1158, 515); this.world.add(fan);
    const blades = this.add.graphics().lineStyle(3, 0x91aaa6, .45).setPosition(1158,454);
    blades.lineBetween(-17,0,17,0); blades.lineBetween(0,-17,0,17); this.world.add(blades);
    if(!this.fx.reduced)this.tweens.add({targets:blades, angle:360, duration:900, repeat:-1});
    if (ghost) { this.ghost = this.add.image(820, 415, 'wolf').setScale(2).setAlpha(.5).setTint(0xa5f9e4); this.world.add(this.ghost);
      if(!this.fx.reduced)this.tweens.add({targets:this.ghost,y:405,duration:1500,yoyo:true,repeat:-1,ease:'Sine.easeInOut'}); }
    const wx = zoom === 1 ? 0 : 585-580*zoom, wy = zoom === 1 ? 75 : 490-450*zoom;
    const previous=this.roomTransform;this.roomTransform={x:wx,y:wy,scale:zoom};
    this.world.setScale(zoom).setPosition(wx,wy);
    if(previous&&previous.scale!==zoom&&!this.ctx.autoplay&&!this.fx.reduced){this.world.setScale(previous.scale).setPosition(previous.x,previous.y);this.tweens.add({targets:this.world,x:wx,y:wy,scaleX:zoom,scaleY:zoom,duration:680,ease:'Sine.easeInOut'});}
    this.head = {x: wx + 589*zoom, y: wy + 414*zoom};
    this.rect(0, 0, W, 66, 0x0c0d18, .96); this.hud(`${this.roomClock}  /  LAPU-LAPU CITY`);
    this.label(this.status, 1140, 25, 18, C.dim).setOrigin(1,0);
    return { lia:this.roomLia, monitor };
  }
  private phone(header: string, lines: string[], outgoing = false) {
    this.rect(765, 98, 438, 478, 0x090d18).setStrokeStyle(3,0x819799);
    this.label(header, 790, 121, 25, C.paper, 385); this.rect(790, 164, 386, 2, 0x354a58);
    let y = 187;
    for (const line of lines) {
      const t = this.label(line, outgoing ? 824 : 806, y + 11, 23, C.paper, 335);
      const b = this.rect(outgoing ? 810 : 790, y, 375, t.height + 23, outgoing ? 0x284f53 : 0x25293d);
      this.children.moveBelow(b,t); y += t.height + 40;
    }
  }
  private document(title: string, text: string) {
    this.rect(740,110,480,440,0xe8e7dc).setStrokeStyle(3,0x7c918b);
    this.label(title,768,138,22,'#36483f',420);
    this.rect(768,180,416,2,0xadb3a5); this.label(text,768,211,27,'#283831',414);
  }
  private food(x = 935, y = 410) {
    this.add.image(x,y,'food-close').setScale(4);
  }
  private async matchmaking() {
    this.stage(); this.arena(); this.rect(0,0,W,H,0x101222,.74);
    this.big('GG EZ',120,102); this.big('ONE MORE GAME.',245,23);
    this.big('You lose by a hair. She types ez.\nYou get three seconds and two replies.',320,25);
    await this.beat('1.01',.2,true);
    this.stage(); this.big('CONNECTING',225,44); audio.play('queue',.3); await this.beat('1.06',1);
    this.big('OPPONENT FOUND: lia_ph',320,30); audio.play('chat'); await this.beat('1.07',.8);
    this.big('PHILIPPINES  ·  CONNECTION UNSTABLE',382,22); await this.beat('1.09',1.2,true);
  }
  private async firstMatch() {
    await this.fight('opening'); await this.matchChat('2.07',false); this.replies.push(this.ctx.pick ?? 'silence');
  }
  private async rematch() {
    await this.fight('rematch'); this.label('lia_ph: same button again? 😭',760,135,25,C.pink,475);
    await this.beat('L2.5',1,true);
  }
  /** Real input: strings, a finisher, guard, parry, dash, and an opponent who moves. Story flags never affect final combat. */
  private async fight(mode: 'opening'|'rematch'|'third'|'second'|'final') {
    this.roomTransform=undefined;this.stage(); audio.stop(); if (!this.ctx.autoplay) audio.play('arcade',.22,true);
    const {lia,wolf} = this.arena(); lia.setPosition(265,442); wolf.setPosition(905,457);
    const finalRound = mode === 'final'; const prefix = finalRound ? 'F' : mode === 'opening' ? '2' : mode === 'rematch' ? 'L2' : mode === 'third' ? 'L3' : 'M2';
    // Her skill rises each round. Only the last round is fair: no floor on her health, no drain, no delayed guard.
    const skill = mode==='opening'?.3:mode==='rematch'?.55:mode==='third'?.75:mode==='second'?.7:.8, rigged=!finalRound;
    this.rect(0,0,W,80,0x0b0d19); this.label('lia_ph',40,16,23,C.pink); this.label('YOU',1170,16,23).setOrigin(1,0);
    this.rect(40,53,430,9,0x343247); this.rect(810,53,430,9,0x343247);
    const enemyTrail=this.rect(40,53,430,9,0xffdca1),playerTrail=this.rect(810,53,430,9,0xece5d5);
    const enemyBar=this.rect(40,53,430,9,0xff729b), playerBar=this.rect(810,53,430,9,0x83d4c8);
    const net = this.label(finalRound ? 'CONNECTION STABLE' : 'CONNECTING…',640,19,16,finalRound?'#83d4c8':C.dim).setOrigin(.5,0);
    const prompt=this.label('A/D move   W jump   S dash   J strike, J J J string   K crescent, J J K finisher   L block, L on the hit parries',640,665,19,C.paper).setOrigin(.5,0);
    const hint=this.label(mode==='opening'?'Land a hit. J up close, K from a distance.':finalRound?'The connection holds. So do your inputs.':'',640,101,22,C.paper).setOrigin(.5,0);
    if(mode==='second') { const object=['badge','phone','food'].find(k=>this.seen.has(k)) ?? 'badge'; hint.setText(object==='badge'?"Isn't her break almost over?":object==='phone'?"She still hasn't answered her mom.":"She's probably laughing with her mouth full of rice again."); }
    const guard=this.rect(wolf.x-12,wolf.y,10,90,0xa9fff0).setVisible(false);
    const combo=this.label('',640,140,36,'#fff1bd').setOrigin(.5,0).setAlpha(0);
    const callout=this.label('',640,196,26,'#9effed').setOrigin(.5,0).setAlpha(0);
    const pop=(target:Phaser.GameObjects.Text,text:string,color:string)=>{target.setText(text).setColor(color).setAlpha(1).setScale(1.25);this.tweens.killTweensOf(target);this.tweens.add({targets:target,scaleX:1,scaleY:1,duration:120});this.tweens.add({targets:target,alpha:0,duration:500,delay:520});};
    const keys=new Set<string>(); const queued: {at:number,key:string}[]=[];
    const enemyMax=finalRound?150:100;
    let health=100,enemyHealth=enemyMax,elapsed=0,vy=0,cooldown=0,firstHit=false,lag=0,lagTriggered=false,blockAt=-100,hitFlash=0,hitStop=0,wasAirborne=false,finished=false;
    let chain=0,chainUntil=0,dash=0,dashCool=0,dashDir=-1,stun=0,facing=-1,koAt=0,blocking=false;
    type LiaState='idle'|'approach'|'retreat'|'cast'|'barrage'|'melee'|'blink'|'stagger';
    let liaState:LiaState='idle',liaTimer=1,liaVy=0,barrageLeft=0;
    const telegraph=this.add.graphics().setDepth(4);
    const trails=this.add.graphics().setDepth(3);
    let hits=0,blocks=0,jumps=0,parries=0; const bolts: {sprite:Phaser.GameObjects.Image;vx:number;owner:'lia'|'you';power:number;breaker:boolean;dodged:boolean}[]=[];
    const shots: {x:number;y:number;angle:number}[]=[];
    const liaReady=()=>mode!=='opening'||firstHit||elapsed>20;
    const delayedBlock=rigged&&(mode==='second'||mode==='third');
    const fire=(owner:'lia'|'you',power=1,breaker=false)=>{
      const from=owner==='lia'?lia:wolf, target=owner==='lia'?wolf:lia;
      const direction=target.x>=from.x?1:-1;
      const b=this.add.image(from.x+40+direction*54,from.y+37,owner==='lia'?'lia-spell':'wolf-crescent').setOrigin(.5).setDisplaySize((owner==='lia'?160:90)*power,(owner==='lia'?49:70)*power).setFlipX(owner==='lia'?direction<0:direction>0);
      if(breaker)b.setTint(0xd58cff);
      bolts.push({sprite:b,vx:direction*(owner==='lia'?520+skill*170:690),owner,power,breaker,dodged:false});this.fx.ring(b.x,b.y,breaker?0xd58cff:owner==='lia'?0x58e1ff:0xf7ffd8,14*power); audio.play(owner==='lia'?'blast':'swing',.32);
    };
    const staggerLia=(seconds:number,push:number)=>{liaState='stagger';liaTimer=seconds;lia.clearTint();lia.setTintFill(0xfff3bc);this.time.delayedCall(110,()=>lia.active&&lia.clearTint());lia.x=Phaser.Math.Clamp(lia.x+push,40,1160);telegraph.clear();};
    const hitEnemy=(damage:number,launch=false)=>{firstHit=true;hits++; enemyHealth=rigged?Math.max(18,enemyHealth-damage):Math.max(0,enemyHealth-damage); lia.setTintFill(0xfff3bc); this.time.delayedCall(110,()=>lia.active&&lia.clearTint());this.fx.burst(lia.x+45,lia.y+45,0xfff1bd,launch?1.5:1);hitStop=launch?.06:.03; audio.play('hit',launch?.5:.4);this.fx.impact(launch?.006:.003); hint.setText('');
      if(launch){staggerLia(.7,(lia.x<wolf.x?-1:1)*110);liaVy=-260;}
      if(chain>1)pop(combo,`${chain} HIT`,chain===3?'#ffd166':'#fff1bd');
      if(mode==='opening'&&hits===1)hint.setText('J J J is a string. J J then K finishes it. L blocks, S dashes through her.');};
    const hurtPlayer=(damage:number,fromX:number,kind:'spell'|'staff'|'breaker')=>{
      if(dash>0)return;
      const faced=(fromX<wolf.x+40)===(facing<0);
      if(blocking&&faced&&!delayedBlock&&elapsed-blockAt<=.16){parries++;blocks++;audio.play('whiff',.45);this.fx.burst(wolf.x+40+facing*42,wolf.y+45,0xffffff,1.3);this.fx.ring(wolf.x+40+facing*42,wolf.y+45,0xffffff,30);pop(callout,'PARRY','#ffffff');staggerLia(.9,(lia.x<wolf.x?-1:1)*70);hitStop=.05;this.fx.impact(.004);return;}
      if(blocking&&faced&&kind!=='breaker'){blocks++;health-=rigged?4:5;audio.play('whiff',.2);this.fx.burst(wolf.x+40+facing*42,wolf.y+45,0x9dffec,.7);this.fx.ring(wolf.x+40+facing*42,wolf.y+45);guard.setFillStyle(0xffffff);this.time.delayedCall(150,()=>guard.active&&guard.setFillStyle(0xa9fff0));wolf.x=Phaser.Math.Clamp(wolf.x-facing*18,80,1180);return;}
      if(blocking&&faced){pop(callout,'GUARD BROKEN','#ff9bd0');stun=.45;}
      health-=damage;wolf.x=Phaser.Math.Clamp(wolf.x+(fromX<wolf.x?1:-1)*30,80,1180);wolf.setTintFill(0xffb9b9);hitFlash=.15;hitStop=.05;this.fx.burst(wolf.x+40,wolf.y+40,0xff978d,1.2);audio.play('hit',.4);this.fx.impact(.005);chain=0;
      if(mode==='second')hint.setText('lia_ph: bro just block 😭');
    };
    const action=(key:string)=>{
      if(stun>0)return;
      if(key==='KeyW'||key==='ArrowUp') { if(wolf.y>=456) {vy=-610;jumps++;} }
      if((key==='KeyS'||key==='ArrowDown')&&dashCool<=0&&dash<=0){dash=.18;dashCool=.75;dashDir=facing;audio.play('swing',.18);this.fx.burst(wolf.x+40,wolf.y+60,0x848da6,.5);}
      if(key==='KeyJ'&&cooldown<=0){
        chain=elapsed<=chainUntil&&chain<3?chain+1:1;chainUntil=elapsed+.5;cooldown=chain===3?.5:.22;
        wolf.x=Phaser.Math.Clamp(wolf.x+facing*24,80,1180);audio.play('swing',.3);
        const slash=this.add.image(wolf.x+40+facing*55,wolf.y+40,'wolf-crescent').setScale(chain===3?3.6:2.6).setFlipX(facing>0).setDepth(5);
        this.tweens.add({targets:slash,alpha:0,x:slash.x+facing*70,duration:180,onComplete:()=>slash.destroy()});
        if(Math.abs((wolf.x+40)-(lia.x+40))<150&&Math.abs(wolf.y-lia.y)<70) hitEnemy(chain===3?15:chain===2?9:8,chain===3); else audio.play('whiff',.12);
      }
      if(key==='KeyK'&&cooldown<=0){const finisher=chain>=2&&elapsed<=chainUntil;cooldown=.6;fire('you',finisher?1.7:1);if(finisher){pop(callout,'FINISHER','#ffd166');chain=0;}}
    };
    const down=(e:KeyboardEvent)=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code))e.preventDefault();if(e.code==='KeyL'&&!keys.has(e.code))blockAt=elapsed;keys.add(e.code);if(!e.repeat){ if(lag>0)queued.push({at:elapsed+.4,key:e.code});else action(e.code); }};
    const up=(e:KeyboardEvent)=>keys.delete(e.code); const blur=()=>keys.clear();
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
    const controls=document.createElement('div');controls.className='combat-controls';
    for(const [text,key] of [['←','ArrowLeft'],['→','ArrowRight'],['Jump','KeyW'],['Dash','KeyS'],['Strike','KeyJ'],['Cast','KeyK'],['Block','KeyL']]){
      const b=document.createElement('button');b.textContent=text;b.setAttribute('aria-label',`Combat ${text}`);
      b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(key==='KeyL')blockAt=elapsed;keys.add(key);if(lag>0)queued.push({at:elapsed+.4,key});else action(key);};
      b.onpointerup=b.onpointercancel=()=>{keys.delete(key);}; controls.append(b);
    }this.ui.append(controls);
    const unbindInput=()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);controls.remove();};
    this.cleanup.push(unbindInput);
    await this.mark(`${prefix}.1`);
    await new Promise<void>((resolve,reject)=>{
      const end=(aborted=false)=>{if(finished)return;finished=true;this.events.off('update',tick);unbindInput();this.abort.signal.removeEventListener('abort',abort);if(aborted)reject(new Error('Scene stopped'));else resolve();};
      const abort=()=>end(true);this.abort.signal.addEventListener('abort',abort,{once:true});
      const tick=(_time:number,dt:number)=>{
        // Preserve real-time speed down to 10fps; still bound long resume gaps.
        const d=Math.max(0,Math.min(dt/1000,.1));if(hitStop>0){hitStop-=d;return;}
        if(koAt){this.outcome=health>0&&(enemyHealth<=0||health/100>enemyHealth/enemyMax)?'win':'loss';end();return;}
        elapsed+=d;cooldown-=d;hitFlash-=d;dashCool-=d;stun-=d;
        // Autoplay is a test-only route and uses the same state/result path.
        if(this.ctx.autoplay&&elapsed>.65){firstHit=true;hits=2;health=finalRound&&new URLSearchParams(location.search).get('outcome')==='win'?80:0;enemyHealth=health?0:60;this.outcome=health>0?'win':'loss';end();return;}
        if(firstHit&&mode==='opening'&&elapsed>4&&!lagTriggered){lag=.5;lagTriggered=true;net.setText('NETWORK DELAY');}
        if(mode==='third'&&hits>=2&&!lagTriggered){lag=.45;lagTriggered=true;pop(callout,'INPUT: ATTACK …','#8991b9');}
        const frozen=(mode==='opening'||mode==='third')&&lag>0; if(lag>0)lag-=d;
        blocking=keys.has('KeyL')&&stun<=0&&(!delayedBlock||elapsed-blockAt>=.4);
        const dir=stun>0?0:(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
        if(dash>0){dash-=d;wolf.x=Phaser.Math.Clamp(wolf.x+dashDir*1150*d,80,1180);wolf.setAlpha(.72);
          if(!this.fx.reduced&&Math.random()<.5){const g=this.add.image(wolf.x,wolf.y,'wolf').setOrigin(0).setScale(2.5).setFlipX(wolf.flipX).setAlpha(.35).setTint(0xa5f9e4);this.tweens.add({targets:g,alpha:0,duration:200,onComplete:()=>g.destroy()});}}
        else{wolf.setAlpha(1);if(!frozen&&dir)wolf.x=Phaser.Math.Clamp(wolf.x+dir*(blocking?130:330)*d,80,1180);}
        facing=dir!==0?dir:(lia.x>wolf.x?1:-1);wolf.setFlipX(facing>0);
        guard.setVisible(blocking).setPosition(facing>0?wolf.x+82:wolf.x-10,wolf.y+8);
        vy+=1450*d;wolf.y=Math.min(457,wolf.y+vy*d);if(wolf.y===457){vy=0;if(wasAirborne){this.fx.burst(wolf.x+40,553,0x848da6,.45);wasAirborne=false;}}else wasAirborne=true;
        const moving=dir!==0;
        if(!this.fx.reduced){wolf.setScale(2.5+(moving?Math.sin(elapsed*21)*.045:Math.sin(elapsed*3)*.018),2.5-(moving?Math.sin(elapsed*21)*.035:Math.sin(elapsed*3)*.018));}
        while(queued.length&&queued[0].at<=elapsed)action(queued.shift()!.key);
        // Lia: a small state machine. She closes, backs off, blinks behind you, swings up close and casts from range.
        telegraph.clear();liaTimer-=d;
        const gap=Math.abs((wolf.x+40)-(lia.x+40)), side=wolf.x>=lia.x?1:-1;
        const oldLiaX=lia.x;
        if(liaState==='stagger'){lia.setTint(0xffb9b9);if(liaTimer<=0){liaState='idle';liaTimer=.1;lia.clearTint();}}
        else if(!liaReady()){lia.clearTint();if(liaTimer<=0){liaState=gap>330?'approach':'retreat';liaTimer=.6+Math.random()*.5;}
          if(liaState==='approach'&&gap>300)lia.x=Phaser.Math.Clamp(lia.x+side*110*d,40,1160); if(liaState==='retreat'&&gap<260)lia.x=Phaser.Math.Clamp(lia.x-side*110*d,40,1160);}
        else{
          if(liaState==='idle'&&liaTimer<=0){const r=Math.random();
            if(gap>430)liaState=r<.2*skill?'blink':r<.45+skill*.2?'approach':r>.72&&skill>.6?'barrage':'cast';
            else if(gap>200)liaState=r<.45?'approach':r<.78?'cast':'retreat';
            else liaState=r<.4+skill*.35?'melee':r<.8?'retreat':skill>.5?'blink':'cast';
            liaTimer=liaState==='approach'?.4+Math.random()*.4:liaState==='retreat'?.32:liaState==='cast'?.55:liaState==='barrage'?.2:liaState==='melee'?.42:.28;
            if(liaState==='barrage')barrageLeft=3; if(liaState==='retreat'&&lia.y>=442)liaVy=-380; if(liaState==='melee'||liaState==='cast')lia.setTint(0xc7ffff);
          }
          if(liaState==='approach'){if(gap>125)lia.x=Phaser.Math.Clamp(lia.x+side*(150+skill*140)*d,40,1160);if(liaTimer<=0||gap<=125){liaState='idle';liaTimer=.1+(1-skill)*.3;}}
          else if(liaState==='retreat'){lia.x=Phaser.Math.Clamp(lia.x-side*230*d,40,1160);if(liaTimer<=0){liaState='idle';liaTimer=.12+(1-skill)*.3;}}
          else if(liaState==='cast'){telegraph.lineStyle(2,0x6de9ff,Math.max(.2,1-liaTimer)).strokeCircle(lia.x+40+side*40,485,10+Math.max(0,liaTimer)*24);if(liaTimer<=0){fire('lia');lia.clearTint();liaState='idle';liaTimer=.35+(1-skill)*.9;}}
          else if(liaState==='barrage'){telegraph.lineStyle(2,0xd58cff,.8).strokeCircle(lia.x+40+side*40,485,14);if(liaTimer<=0){barrageLeft--;fire('lia',barrageLeft===0?1.25:.9,barrageLeft===0&&(finalRound||skill>.7));liaTimer=.22;if(barrageLeft<=0){lia.clearTint();liaState='idle';liaTimer=.6+(1-skill)*.6;}}}
          else if(liaState==='melee'){lia.angle=-6;telegraph.lineStyle(2,0xc7ffff,.9).strokeCircle(lia.x+40+side*60,480,8+Math.max(0,liaTimer)*30);
            if(liaTimer<=0){lia.angle=0;lia.clearTint();const arc=this.add.image(lia.x+40+side*62,lia.y+34,'lia-spell').setDisplaySize(110,40).setFlipX(side<0).setAngle(side*-18).setDepth(5);this.tweens.add({targets:arc,alpha:0,angle:side*22,duration:160,onComplete:()=>arc.destroy()});audio.play('swing',.28);
              if(gap<175&&wolf.y>385)hurtPlayer(Math.round(13+skill*7),lia.x+40,'staff');else audio.play('whiff',.1);
              liaState='idle';liaTimer=.25+(1-skill)*.5;}}
          else if(liaState==='blink'){lia.setAlpha(Math.max(.15,liaTimer/.28));if(liaTimer<=0){this.fx.ring(lia.x+40,lia.y+40,0x58e1ff,26);lia.x=Phaser.Math.Clamp(wolf.x+side*150,40,1160);lia.setAlpha(1);this.fx.ring(lia.x+40,lia.y+40,0x58e1ff,26);audio.play('blast',.15);liaState='melee';liaTimer=.36;lia.setTint(0xc7ffff);}}
        }
        // She hops over a crescent she reads early enough.
        for(const b of bolts){if(b.owner==='you'&&!b.dodged&&lia.y>=442&&Math.sign(lia.x+40-b.sprite.x)===Math.sign(b.vx)&&Math.abs(b.sprite.x-(lia.x+40))<230){b.dodged=true;if(Math.random()<skill*.9)liaVy=-560;}}
        liaVy+=1450*d;lia.y=Math.min(442,lia.y+liaVy*d);if(lia.y>=442)liaVy=0;
        lia.setFlipX(wolf.x<lia.x);
        if(!this.fx.reduced){const stride=Math.abs(lia.x-oldLiaX)>.1;lia.setScale(2.5+(stride?Math.sin(elapsed*19)*.04:Math.sin(elapsed*2.5)*.018),2.5-(stride?Math.sin(elapsed*19)*.03:Math.sin(elapsed*2.5)*.025));if(liaState!=='melee')lia.angle=liaState==='cast'?-2:Math.sin(elapsed*2)*.8;}
        trails.clear();for(let i=bolts.length-1;i>=0;i--){const b=bolts[i];b.sprite.x+=b.vx*d;
          trails.lineStyle(3,b.breaker?0xd58cff:b.owner==='lia'?0x68e8ff:0xe0ffe9,.3).lineBetween(b.sprite.x,b.sprite.y,b.sprite.x-Math.sign(b.vx)*75,b.sprite.y);b.sprite.setAngle(b.owner==='you'?Math.sin(elapsed*14)*9:0);
          const target=b.owner==='lia'?wolf:lia;
          if(Math.abs(b.sprite.x-(target.x+40))<55*Math.max(1,b.power*.8)&&Math.abs(b.sprite.y-(target.y+40))<58){
            if(b.owner==='lia'){if(dash>0)continue;hurtPlayer(Math.round((rigged?22:17)*b.power),b.sprite.x,b.breaker?'breaker':'spell');}else hitEnemy(Math.round((finalRound?10:12)*b.power));
            b.sprite.destroy();bolts.splice(i,1);
          }else if(b.sprite.x<-100||b.sprite.x>1400){b.sprite.destroy();bolts.splice(i,1);}
        }
        if(hitFlash<=0)wolf.clearTint();
        // Rigged rounds end by a hair whatever you do; the drain is the lag she never has to feel.
        if(rigged&&((firstHit&&elapsed>19)||elapsed>30))health-=d*26;
        if(mode==='opening'&&!firstHit&&elapsed>14)hint.setText('Hold K to cast, or tap Cast below. You are the wolf on the right.');
        if(!frozen&&stun<=0){if(keys.has('KeyK')&&cooldown<=0)action('KeyK');if(keys.has('KeyJ')&&cooldown<=0)action('KeyJ');}
        enemyBar.width=Math.max(0,enemyHealth)/enemyMax*430;playerBar.width=Math.max(0,health)*4.3;
        enemyTrail.width=Phaser.Math.Linear(enemyTrail.width,enemyBar.width,Math.min(1,d*4));playerTrail.width=Phaser.Math.Linear(playerTrail.width,playerBar.width,Math.min(1,d*4));
        if(mode==='third'){shots.push({x:wolf.x,y:wolf.y,angle:wolf.angle});if(shots.length>150)shots.shift();}
        net.setText(finalRound?'CONNECTION STABLE':firstHit&&mode==='opening'?'NETWORK DELAY':mode==='rematch'?'REMATCH':mode==='second'||mode==='third'?'NETWORK DELAY':'CONNECTION UNSTABLE');
        // The last hit lands and the game goes quiet for a third of a second.
        if(health<=0||enemyHealth<=0||(finalRound&&elapsed>=40)){koAt=elapsed||.001;hitStop=.24;telegraph.clear();if(!this.fx.reduced)this.cameras.main.flash(90,255,255,255);}
      };this.events.on('update',tick);
    });
    if(this.ctx.autoplay)this.outcome=finalRound&&new URLSearchParams(location.search).get('outcome')==='win'?'win':'loss';
    if(!finalRound)this.outcome='loss';
    bolts.forEach(b=>b.sprite.destroy());guard.destroy();telegraph.destroy();trails.destroy();hint.destroy();prompt.destroy();combo.destroy();callout.destroy();
    lia.setAlpha(1).clearTint();lia.angle=0;wolf.setAlpha(1).clearTint();
    const loser=this.outcome==='win'?lia:wolf;audio.play('ko',.45);
    for(let i=0;i<18;i++)shots.push({x:loser.x+(i+1)*13,y:loser.y-(i+1)*16,angle:i*2});
    await this.tween(loser,this.fx.reduced?{alpha:.25}:{x:this.outcome==='win'?-100:1310,y:100,angle:this.outcome==='win'?-30:30},.55,'Quad.easeOut');
    if(mode==='third')this.lastKnockout=shots;
    const result=this.big(this.outcome==='win'?'VICTORY':'DEFEAT',205,78).setScale(this.fx.reduced?1:1.06).setAlpha(0);
    await this.tween(result,{scaleX:1,scaleY:1,alpha:1},.25,'Sine.easeOut');
    (window as Window & {__combat?: unknown}).__combat={mode,outcome:this.outcome,hits,blocks,jumps,parries,elapsed};
    await this.beat(finalRound?'F.5':`${prefix}.5`,.6,true);
    this.lastArenaFrame=document.createElement('canvas');this.lastArenaFrame.width=W;this.lastArenaFrame.height=H;
    this.lastArenaFrame.getContext('2d')!.drawImage(this.game.canvas,0,0);
  }
  private async matchChat(id:string,finalChat:boolean) {
    this.stage();
    if(this.lastArenaFrame){if(this.textures.exists('result-frame'))this.textures.remove('result-frame');this.textures.addCanvas('result-frame',this.lastArenaFrame);this.add.image(0,0,'result-frame').setOrigin(0);}else this.arena();
    this.rect(0,0,W,H,0x080b16,.76);
    const history=['lia_ph: ez'];const chat=this.chatPanel(history,'00:03');audio.play('chat',.35);
    if(finalChat&&this.outcome==='win'){await this.hold(.8);chat.add('lia_ph: for you apparently 💀');audio.play('chat',.35);}
    if(finalChat){await this.beat(this.outcome==='win'?'F.6A':'F.6B',.8);await this.beat('F.7',2);}
    const pick=await this.choose(REPLIES,230,420,id,3,chat.clock);this.ctx.pick=pick||'silence';
    if(pick){chat.add(`you: ${pick}`);audio.play('chat',.2);await this.hold(.8);
      chat.add(finalChat?(pick===REPLIES[0]?'lia_ph: gg':'lia_ph closed the chat'):id==='M2.6'?(pick===REPLIES[0]?"lia_ph: wait weren't you here earlier":'lia_ph: HAHAHA still mad'):(pick===REPLIES[0]?'lia_ph: i know 😭':'lia_ph: HAHAHA'));
    }else if(finalChat||id==='2.07')chat.add('lia_ph requested a rematch');
    const branch=pick===REPLIES[0]?'A':pick===REPLIES[1]?'B':'C';
    await this.beat(finalChat?`E.2${branch}`:id==='M2.6'?`M2.7${branch}`:`2.08${branch}`,1,true);
  }
  private playerDesk(cracked=false) {
    this.roomTransform=undefined;this.stage();this.rect(100,565,1060,28,0x565167);this.rect(180,593,24,127,0x393548);this.rect(1030,593,24,127,0x393548);
    this.rect(553,240,440,290,0x292e3f).setStrokeStyle(8,0x727589);
    const screen=this.add.image(773,377,'arena-bg').setDisplaySize(414,262);this.rect(753,532,35,33,0x5e6476);this.rect(699,560,140,9,0x727589);
    const wolf=this.pixelSprite('wolf',320,440).setScale(3.2);this.rect(510,550,150,9,0x8a8e96);
    if(cracked){const g=this.add.graphics().lineStyle(1,0xc4edf2,.65);
      for(const line of [[790,374,733,337,712,287],[790,374,844,351,910,281],[790,374,835,414,923,471],[790,374,739,410,698,497]]){
        g.beginPath();g.moveTo(line[0],line[1]);g.lineTo(line[2],line[3]);g.lineTo(line[4],line[5]);g.strokePath();
      }
    }
    return {wolf,screen};
  }
  /** A game pad drawn from shapes, so it can tremble, spin and bounce. */
  private controller(x:number,y:number) {
    const c=this.add.container(x,y);const g=this.add.graphics();
    g.fillStyle(0x2b2d3a).fillRoundedRect(-44,-16,88,32,10).fillRoundedRect(-44,-2,24,40,9).fillRoundedRect(20,-2,24,40,9);
    g.lineStyle(2,0x5c6078).strokeRoundedRect(-44,-16,88,32,10);
    g.fillStyle(0x8e93a6).fillRect(-31,-9,6,18).fillRect(-37,-3,18,6);
    g.fillStyle(0x65f8d1).fillCircle(24,-6,3.5);g.fillStyle(0xffd166).fillCircle(36,-6,3.5);g.fillStyle(0xff729b).fillCircle(30,0,3.5);g.fillStyle(0x8ab4ff).fillCircle(30,-12,3.5);
    g.fillStyle(0x15161f).fillCircle(-12,8,6).fillCircle(12,8,6);g.fillStyle(0x3b3e52).fillCircle(-12,8,3).fillCircle(12,8,3);
    c.add(g);return c;
  }
  /** A single bounded dissolve, no squash, camera spin, or white flash. */
  private async dissolve(draw:()=>void, seconds=.65) {
    this.check();
    if(this.ctx.autoplay||this.fx.reduced){draw();await this.hold(.12);return;}
    const key='scene-dissolve';
    const snapshot=document.createElement('canvas');snapshot.width=W;snapshot.height=H;
    snapshot.getContext('2d')!.drawImage(this.game.canvas,0,0);
    draw();
    if(this.textures.exists(key))this.textures.remove(key);
    this.textures.addCanvas(key,snapshot);
    const cover=this.add.image(0,0,key).setOrigin(0).setDepth(100);
    try{await this.tween(cover,{alpha:0},seconds);}finally{cover.destroy();if(this.textures.exists(key))this.textures.remove(key);}
  }
  private async connection() {
    await this.fight('third');this.label('lia_ph: skill issue 💀',760,130,27,C.pink);await this.beat('L3.5',1.2,true);
    const {wolf:body,screen}=this.playerDesk();
    this.label('lia_ph: skill issue 💀',582,268,12,'#ffb0c8');
    const pad=this.controller(410,503);
    await this.mark('T.1');
    // The grip tightens: the pad trembles harder, then a short wind-up.
    if(this.fx.reduced||this.ctx.autoplay)await this.hold(.4);else{for(let i=0;i<8;i++){pad.setAngle((i%2?1:-1)*(1+i*1.2)).setPosition(410+(i%2?2:-2),503);await this.hold(.07);}}
    await this.tween(pad,this.fx.reduced?{alpha:1}:{x:320,y:468,angle:-38},.16,'Quad.easeOut');
    // The throw: spin, afterimages, impact.
    if(!this.fx.reduced){const trail=this.time.addEvent({delay:38,repeat:7,callback:()=>{const g=this.controller(pad.x,pad.y).setAngle(pad.angle).setAlpha(.3);this.tweens.add({targets:g,alpha:0,duration:240,onComplete:()=>g.destroy()});}});this.cleanup.push(()=>trail.remove());
      await this.tween(pad,{x:782,y:368,angle:505},.3,'Quad.easeIn');trail.remove();}
    audio.play('smash',.55);
    if(!this.fx.reduced){this.cameras.main.flash(70,230,255,255);this.cameras.main.shake(280,.013);}
    // The crack grows out of the point of impact while the picture inside the monitor jitters.
    const crack=this.add.graphics().setDepth(6);
    const lines=[[790,374,733,337,712,287],[790,374,844,351,910,281],[790,374,835,414,923,471],[790,374,739,410,698,497],[790,374,768,318,758,262],[790,374,842,392,906,418]];
    const steps=this.fx.reduced||this.ctx.autoplay?1:5;
    for(let step=1;step<=steps;step++){const t=step/steps;crack.clear().lineStyle(t<.6?1:2,0xc4edf2,.5+t*.3);
      for(const l of lines){const a=Math.min(1,t*2),b=Math.max(0,t-.5)*2;crack.beginPath();crack.moveTo(l[0],l[1]);crack.lineTo(l[0]+(l[2]-l[0])*a,l[1]+(l[3]-l[1])*a);if(b>0)crack.lineTo(l[2]+(l[4]-l[2])*b,l[3]+(l[5]-l[3])*b);crack.strokePath();}
      screen.setTint(step%2?0xffffff:0x9ad7ff).setPosition(773+(step%2?3:-3),377);await this.hold(.05);}
    screen.clearTint().setPosition(773,377).setAlpha(.55);
    // The pad falls to the desk and settles.
    await this.tween(pad,this.fx.reduced?{alpha:0}:{x:690,y:549,angle:560},.36,'Bounce.easeOut');
    audio.stop('arcade');await this.beat('T.2',.8);
    this.label('CONNECTION LOST\nlia_ph is still there.',650,310,21,'#d4ffff',300);await this.beat('T.3',1.2);
    await this.pullThroughTheScreen(body);
    await this.dissolve(()=>this.room());await this.beat('T.9',1.2);
  }
  private async scriptLine(id:string) {
    const c=[...early.loss3,...early.objects].find(x=>x.id===id);
    if(!c || !('speech' in c) || !c.speech) throw new Error('Missing scripted line '+id);
    this.roomLia?.setPose(('pose' in c&&typeof c.pose==='string')?c.pose:'mouse');
    await this.say(c.speech,id,'lia',GLOSS[id]);
  }
  private async firstVisit() {
    this.status='ON BREAK';this.roomClock='2:07 AM';this.room();await this.beat('R.1',2);
    this.room(1.25);const replay=this.add.container(602,390);replay.add(this.add.image(0,0,'arena-bg').setDisplaySize(132,74));
    const smallWolf=this.add.image(40,18,'wolf').setScale(.6);replay.add(smallWolf);replay.add(this.add.image(-40,15,'lia-wizard').setScale(.6));
    this.label('REPLAY  ▶',547,337,12,'#d2f4ee');const bar=this.rect(539,433,125,3,0x7fc2b6);
    this.tweens.add({targets:bar,scaleX:.1,duration:1800,yoyo:true,repeat:-1});
    if(this.lastKnockout.length){let i=0;const track=this.lastKnockout.slice(-18);const timer=this.time.addEvent({delay:80,loop:true,callback:()=>{const f=track[(i++)%track.length];smallWolf.setPosition((f.x-780)*.1,(f.y-400)*.1).setAngle(f.angle);}});this.cleanup.push(()=>timer.remove());}
    await this.scriptLine('R.2');await this.scriptLine('R.3');
    this.room();await this.hold(.8);await this.scriptLine('R.4');
    this.room(1.25);this.document('DESKTOP CAPTURE','Wrong window.');await this.scriptLine('R.5');
    await this.explore();
    this.status='BREAK ENDS IN 00:30';this.room(1.25);audio.play('phone',.25);await this.scriptLine('N2');
    await this.returnToGame('N3');
  }
  private async inspectObject(object:string) {
    const cached=this.seen.has(object);this.room(1.25);
    if(object==='badge'){this.document('EMPLOYEE ID','LIA\nCUSTOMER SUPPORT\n\nNIGHT SHIFT\n10:00 PM — 6:00 AM');await this.beat('A3',.3,true);}
    if(object==='phone'){if(!cached)audio.play('phone',.3);this.phone('🔒  Mama ❤️',['Nak, nakapadala na ka?','Bisan Friday na lang. Amping.']);this.label('Have you sent it? / Friday is fine. Take care.',780,598,18,C.dim,420);await this.beat(cached?'B2.cached':'B2',.4,true);if(!cached){await this.beat('B3',.5);}}
    if(object==='food'){this.roomLia?.setPose('eat');this.food();if(cached){await this.beat('C5.cached',.3,true);}else{await this.scriptLine('C2');await this.scriptLine('C3');await this.scriptLine('C4');}}
    this.seen.add(object);this.save();
  }
  private async explore() {
    if(this.ctx.autoplay){for(const o of new URLSearchParams(location.search).get('objects')?.split(',')??['badge','phone','food'])await this.inspectObject(o);return;}
    const position={x:850,y:385};let blocked:Discovery|undefined;
    while(true){
      this.room();
      this.label('Drift close to notice things.  WASD / arrows, or touch the room to move.',640,648,19,C.paper).setOrigin(.5,0);
      this.ghost!.setPosition(position.x,position.y);
      // Start marking before installing the input owner; both are awaited so failures cannot leak listeners.
      await this.mark('explore');
      const picked=await exploreRoom(this,this.ghost!,this.world!,this.abort.signal,this.seen,position,blocked);
      if(picked==='continue')return;
      blocked=picked;await this.inspectObject(picked);
    }
  }
  private async returnToGame(id:string) {
    this.room(1.25);if(this.ghost){this.tweens.killTweensOf(this.ghost);await this.tween(this.ghost,this.fx.reduced?{alpha:0}:{x:640,y:415,alpha:0},.85);}await this.beat(id,.3);
  }
  private async secondMatch() {await this.fight('second');await this.matchChat('M2.6',false);this.replies.push(this.ctx.pick??'silence');
    this.roomClock='2:31 AM';this.status='AVAILABLE';audio.play('crt',.1);await this.dissolve(()=>this.room());}
  private async roomCards(cards:Card[]) {
    for(const c of cards){this.status=c.monitor?.includes('AFTER-CALL')?'AFTER-CALL WORK':c.mode==='work'?'AVAILABLE':this.status;
      const zoom=['room','fall'].includes(c.view)?1:['eyes','hands'].includes(c.view)?2.25:c.view==='close'?1.55:1.25;this.room(zoom);this.roomLia?.setPose(c.pose??'idle');
      if(c.pose==='typing'&&!this.ctx.autoplay)audio.play('type',.085,true);
      if(c.view==='fall'&&this.ghost){this.ghost.setPosition(640,365);await this.tween(this.ghost,{x:820,y:415},1.4);}
      if(c.monitor&&['qa','doc'].includes(c.view)){const [h,...rest]=c.monitor.split('\n');this.document(h,rest.join('\n'));}
      else if(c.monitor)this.label(c.monitor,790,130,22,'#a5d1c8',410);
      if(c.customer)await this.say(c.customer,c.id,'caller');
      if(c.id==='C1.5')await this.hold(.5);
      if(c.speech)await this.say(c.speech,c.id,'lia',GLOSS[c.id]);
      else await this.beat(c.id,c.id==='C1.8'?3:c.id==='C1.13'?2:1);
      if(c.id==='C1.8')audio.stop('type');
    }
  }
  private async mama() {
    for(const c of final.scenes.p9 as Card[]){this.room(c.view==='room'?1:1.25);this.roomLia?.setPose(c.pose??'phone');
      if(c.id==='P.2')this.phone('Mama ❤️',['Nak, nakapadala na ka?','Bisan Friday na lang. Amping.']);
      if(c.id==='P.3'){this.phone('Mama ❤️',['Ma, Friday pa akong sweldo. Padala ko after.']);audio.play('chat',.2);await this.hold(.6);this.phone('Mama ❤️',['Ma, Friday pa akong sweldo. Padala ko after.','Nikaon na pud ko hehe'],true);this.label('Payday is Friday. I’ll send after. / I’ve eaten too hehe.',770,592,18,C.dim,440);}
      if(c.id==='P.4'||c.id==='P.5'){this.food();const g=this.add.graphics().lineStyle(3,0xefffff);g.strokeRect(805,320,260,175);if(c.id==='P.4')audio.play('chat',.2);}
      if(c.id==='P.6'){this.phone('Mama ❤️',['Sent ✓'],true);this.food(960,350);}
      if(c.id==='P.7'){this.phone('Mama ❤️',['Ayaw pasagdi imong kaugalingon, nak.']);this.label('Take care of yourself, child.',782,590,20,C.dim);}
      if(c.id==='P.8'){this.document('FRIDAY','RENT · KURYENTE · GROCERY\n\nTRANSPO (onsite days)\n\nPADALA SA BALAY: Friday');}
      if(c.id==='P.9'){this.roomLia?.setPose('tired');await this.hold(.5);}
      if(c.speech)await this.say(c.speech,c.id,'lia',GLOSS[c.id]);else await this.beat(c.id,c.id==='P.9'?3:.5,['P.2','P.3','P.6','P.7','P.8'].includes(c.id));
    }
  }
  private async mika() {
    const exchanges:Record<string,string[]>={
      'K.1':['MIKA: buhi pa ka?','LIA: unfortunately'],
      'K.2':['MIKA: movie later? you bailed last time','LIA: after shift promise','MIKA: that’s what you said last time'],
      'K.4':['LIA: okay fine i was farming wins 😭','MIKA: farming enemies more like','LIA: character development','MIKA: yours or theirs?']};
    for(const c of final.scenes.k10 as Card[]){this.room(1.25);this.roomLia?.setPose(c.pose??'phone');
      if(exchanges[c.id]){const lines:string[]=[];for(const line of exchanges[c.id]){lines.push(line);this.phone('Mika',lines);audio.play('chat',.18);await this.hold(.7);}}
      if(c.id==='K.3'){this.phone('Mika',[]);const t=this.label('i was ▌',800,493,25,C.paper);await this.hold(1);for(let n=5;n>=0;n--){t.setText('i was'.slice(0,n)+'▌');await this.hold(.07);}await this.hold(.4);}
      if(c.speech)await this.say(c.speech,c.id,'lia',GLOSS[c.id]);else await this.beat(c.id,.5,!!exchanges[c.id]);
    }
  }
  private async night() {
    for(const c of final.scenes.t11 as Card[]){const times:Record<string,string>={'N.1':'2:48 AM','N.2':'3:19 AM','N.3':'3:52 AM','N.4':'4:17 AM'};this.roomClock=times[c.id]??this.roomClock;
      this.status=['N.4','N.5','N.6'].includes(c.id)?'ON BREAK':'ON CALL';this.room(c.id==='N.5'?1.25:1);this.roomLia?.setPose(c.pose??'tired');
      if(c.id==='N.2'){this.label('…cold.',535,375,20,C.paper);}
      if(c.id==='N.3'){this.roomLia?.setPose('tired');await this.hold(.6);}
      if(c.id==='N.4')audio.play('phone',.2);
      if(c.id==='N.6'){await this.returnToGame(c.id);continue;}
      if(c.speech)await this.say(c.speech,c.id,'lia',GLOSS[c.id]);else await this.beat(c.id,1.8);
    }
  }
  /** The crack opens into a draft: feet lift, the body stretches toward the hole, compresses into it, and is gone. */
  private async pullThroughTheScreen(body:Phaser.GameObjects.Image) {
    const hole={x:790,y:374};
    body.setOrigin(.5).setPosition(body.x+51,body.y+59);
    if(this.ctx.autoplay||this.fx.reduced){await this.tween(body,{x:hole.x,y:hole.y,alpha:0},.4);await this.mark('T.4');await this.mark('T.5');return;}
    audio.play('crt',.16,true);audio.play('whiff',.25);
    const glow=this.add.graphics().setDepth(5), streaks=this.add.graphics().setDepth(7);
    const scraps=[0,1,2,3,4,5,6].map(i=>this.rect(230+i*118+(i%2)*40,560-(i%3)*12,10+(i%3)*4,4,0xd8d9e3).setDepth(6));
    let t=0;
    const tick=(_:number,dt:number)=>{t+=Math.min(dt,100)/1000;
      const pulse=.4+Math.sin(t*9)*.18;
      glow.clear().fillStyle(0xbdf6ff,pulse*.45).fillCircle(hole.x,hole.y,30+Math.sin(t*9)*7).fillStyle(0xffffff,pulse).fillCircle(hole.x,hole.y,9);
      streaks.clear().lineStyle(2,0xc9f4ff,.5);
      for(let i=0;i<16;i++){const a=Math.PI*.55+(i/16)*Math.PI*.95;const r=320-((t*560+i*67)%320);const x=hole.x+Math.cos(a)*r*1.7,y=hole.y+Math.sin(a)*r*.6;streaks.lineBetween(x,y,x+(hole.x-x)*.2,y+(hole.y-y)*.2);}
      scraps.forEach((s,i)=>{const k=Math.min(1,Math.max(0,(t-.3)/(1.2+i*.11)));s.setPosition(Phaser.Math.Linear(230+i*118+(i%2)*40,hole.x,k*k),Phaser.Math.Linear(560-(i%3)*12,hole.y,k*k)).setAngle(k*720+i*40).setScale(1-k*.92);});
    };this.events.on('update',tick);
    try{
      await this.tween(body,{y:body.y-28,angle:-12},.5,'Sine.easeOut');
      this.cameras.main.shake(1100,.0022);
      await this.tween(body,{x:hole.x-170,y:hole.y-30,scaleX:5.4,scaleY:2,angle:-30},.8,'Quad.easeIn');
      await this.mark('T.4');
      await this.tween(body,{x:hole.x-10,y:hole.y-6,scaleX:.3,scaleY:.8,alpha:.2},.3,'Quad.easeIn');
      this.cameras.main.flash(140,225,255,255);audio.play('smash',.16);
      body.setAlpha(0);scraps.forEach(s=>s.setVisible(false));
      await this.mark('T.5');await this.hold(.4);
    }finally{this.events.off('update',tick);glow.destroy();streaks.destroy();scraps.forEach(s=>s.destroy());audio.stop('crt');}
  }
  /** Three questions after the credits. Answers stay on the device and travel with the finish record; a configured endpoint receives them too. */
  private survey(): Promise<void> {
    if(this.ctx.autoplay)return Promise.resolve();
    return new Promise(resolve=>{
      const panel=document.createElement('div');panel.className='survey';
      const answers:Record<string,string>={};
      const ask=(id:string,question:string,options:string[])=>{
        const q=document.createElement('div');q.className='survey-q';const h=document.createElement('p');h.textContent=question;q.append(h);
        const row=document.createElement('div');row.className='survey-row';
        for(const o of options){const b=document.createElement('button');b.type='button';b.textContent=o;b.onclick=()=>{answers[id]=o;Array.from(row.children).forEach(c=>c.classList.toggle('picked',c===b));};row.append(b);}
        q.append(row);panel.append(q);
      };
      const title=document.createElement('p');title.className='survey-title';title.textContent='Three questions before you go.';panel.append(title);
      ask('felt','In the three seconds after "ez", what did you feel?',['nothing much','annoyed','angry','something else']);
      ask('worse','If the box had been free text, would you have typed something worse?',['yes','maybe','no']);
      const note=document.createElement('textarea');note.className='survey-note';note.placeholder='One line for Lia, or for us (optional)';note.maxLength=280;panel.append(note);
      const actions=document.createElement('div');actions.className='survey-row';
      const send=document.createElement('button');send.type='button';send.textContent='Send';
      const skip=document.createElement('button');skip.type='button';skip.textContent='Skip';
      const status=document.createElement('p');status.className='survey-status';
      const finish=(submitted:boolean)=>{
        const record={submitted,at:new Date().toISOString(),outcome:this.outcome,replies:this.replies,seen:[...this.seen],...answers,note:note.value.trim()};
        if(window.__done)(window.__done as Record<string,unknown>).survey=record;
        if(submitted){try{localStorage.setItem('gg-ez-survey',JSON.stringify(record));}catch{/* storage unavailable */}
          if(SURVEY_ENDPOINT){void fetch(SURVEY_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(record),keepalive:true}).catch(()=>{});}
          const body=encodeURIComponent(`GG EZ survey\n\nfelt: ${answers.felt??''}\nworse: ${answers.worse??''}\nnote: ${note.value.trim()}\noutcome: ${this.outcome}\nreplies: ${this.replies.join(', ')}`);
          status.innerHTML='';const a=document.createElement('a');a.href=`mailto:kho@uni.minerva.edu?subject=${encodeURIComponent('GG EZ survey')}&body=${body}`;a.textContent='Thank you. Saved on this device; tap here to also email it to the team.';status.append(a);
          send.disabled=true;skip.textContent='Done';
        }else{panel.remove();resolve();}
      };
      send.onclick=()=>{if(!answers.felt||!answers.worse){status.textContent='Pick an answer for the two questions first.';return;}finish(true);};
      skip.onclick=()=>{if(skip.textContent==='Done'){panel.remove();resolve();}else finish(false);};
      actions.append(send,skip);panel.append(actions,status);this.ui.append(panel);
    });
  }
  private async finalFight() {await this.fight('final');}
  private async ending() {
    await this.matchChat('E.1',true);this.replies.push(this.ctx.pick??'silence');
    this.roomClock='4:25 AM';this.status='ON BREAK';this.room(1,false);await this.beat('E.3',3);
    this.status='BREAK ENDS IN 00:15';this.room(1.25,false);audio.play('phone',.2);await this.beat('E.4',1.3);
    this.phone('Mama ❤️',['Sent ✓✓'],true);this.food(960,350);await this.beat('E.5',1.5);
    this.status='AVAILABLE';this.room(1.25,false);await this.say('Okay. Kaya pa.','E.6','lia',GLOSS['E.6']);
    this.room(1,false);await this.say('Thank you for calling. My name is Lia. How may I help you?','E.7');
    const fade=this.rect(0,0,W,H,0x000000,0);await this.tween(fade,{alpha:1},1);
    this.playerDesk(true);this.label('lia_ph',820,462,14,'#aef0e0');await this.beat('E.8',3);
    this.stage();audio.stop();this.big('GG EZ',185,108);this.big('A game by Carl Kho & Dain Kim',325,27);this.big('END OF MATCH',410,20);
    this.label('Art · Dain Kim     Story & design · Carl Kho\nSound and voices · ElevenLabs',640,480,18,C.dim).setOrigin(.5,0).setAlign('center');
    await this.mark('E.9');this.finish({completed:true,outcome:this.outcome,replies:this.replies,seen:[...this.seen],chapters:13});
    if(!this.ctx.autoplay){try{localStorage.removeItem('gg-ez-save-v1');}catch{/* storage unavailable */}}
    await this.survey();
    this.row(['Play again'],520,590,()=>{audio.stop();location.href=location.pathname;});
  }
}
