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
    const plate = this.add.graphics().fillStyle(0x819da0).fillEllipse(711,454,39,12);
    plate.fillStyle(0xd7d0ac).fillEllipse(709,451,26,8).fillStyle(0x6c7d48).fillRect(719,448,7,4);
    this.world.add(plate);
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
    this.add.ellipse(x,y,174,75,0xd0c5a5).setStrokeStyle(5,0x617777);
    for(let i=0;i<21;i++) this.rect(x-60+(i*23%122),y-18+(i*13%32),9,3,0xeae2c7);
    this.add.ellipse(x+25,y,40,15,0x617b3d).setAngle(-25);
    this.rect(x+75,y-40,7,89,0xa8b3b6).setAngle(30);
  }
  private async matchmaking() {
    this.stage(); this.arena(); this.rect(0,0,W,H,0x101222,.74);
    this.big('GG EZ',120,102); this.big('ONE MORE GAME.',245,23);
    this.big('A fighting game about losing to a stranger, then inconveniently\ndiscovering she’s a person.',320,25);
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
  /** Real input, projectile collision, guard and jump. Story flags never affect final combat. */
  private async fight(mode: 'opening'|'rematch'|'third'|'second'|'final') {
    this.roomTransform=undefined;this.stage(); audio.stop(); if (!this.ctx.autoplay) audio.play('arcade',.22,true);
    const {lia,wolf} = this.arena(); lia.setPosition(265,442); wolf.setPosition(905,457);
    const finalRound = mode === 'final'; const prefix = finalRound ? 'F' : mode === 'opening' ? '2' : mode === 'rematch' ? 'L2' : mode === 'third' ? 'L3' : 'M2';
    this.rect(0,0,W,80,0x0b0d19); this.label('lia_ph',40,16,23,C.pink); this.label('YOU',1235,16,23).setOrigin(1,0);
    this.rect(40,53,430,9,0x343247); this.rect(810,53,430,9,0x343247);
    const enemyTrail=this.rect(40,53,430,9,0xffdca1),playerTrail=this.rect(810,53,430,9,0xece5d5);
    const enemyBar=this.rect(40,53,430,9,0xff729b), playerBar=this.rect(810,53,430,9,0x83d4c8);
    const net = this.label(finalRound ? 'CONNECTION STABLE' : 'CONNECTING…',640,19,16,finalRound?'#83d4c8':C.dim).setOrigin(.5,0);
    const prompt=this.label('A/D or ←/→ move   W/↑ jump   J strike   K crescent   L block',640,665,21,C.paper).setOrigin(.5,0);
    const hint=this.label(mode==='opening'?'Land a hit. J up close, K from a distance.':finalRound?'The connection holds. So do your inputs.':'',640,101,22,C.paper).setOrigin(.5,0);
    if(mode==='second') { const object=['badge','phone','food'].find(k=>this.seen.has(k)) ?? 'badge'; hint.setText(object==='badge'?"Isn't her break almost over?":object==='phone'?"She still hasn't answered her mom.":"She's probably laughing with her mouth full of rice again."); }
    const guard=this.rect(wolf.x-12,wolf.y,10,90,0xa9fff0).setVisible(false);
    const keys=new Set<string>(); const queued: {at:number,key:string}[]=[];
    let health=100,enemyHealth=100,elapsed=0,vy=0,cooldown=0,enemyTimer=2.2,firstHit=false,lag=0,lagTriggered=false,blockAt=-100,hitFlash=0,hitStop=0,wasAirborne=false,finished=false;
    const telegraph=this.add.graphics().setDepth(4);
    const trails=this.add.graphics().setDepth(3);
    let hits=0,blocks=0,jumps=0; const bolts: {sprite:Phaser.GameObjects.Image;vx:number;owner:'lia'|'you'}[]=[];
    const shots: {x:number;y:number;angle:number}[]=[];
    const fire=(owner:'lia'|'you')=>{
      const from=owner==='lia'?lia:wolf, target=owner==='lia'?wolf:lia;
      const direction=target.x>=from.x?1:-1;
      const b=this.add.image(from.x+40+direction*54,from.y+37,owner==='lia'?'lia-spell':'wolf-crescent').setOrigin(.5).setDisplaySize(owner==='lia'?160:90,owner==='lia'?49:70).setFlipX(owner==='lia'?direction<0:direction>0);
      bolts.push({sprite:b,vx:direction*(owner==='lia'?540:690),owner});this.fx.ring(b.x,b.y,owner==='lia'?0x58e1ff:0xf7ffd8,14); audio.play(owner==='lia'?'blast':'swing',.32);
    };
    const hitEnemy=(damage:number)=>{firstHit=true;hits++; enemyHealth=finalRound?Math.max(0,enemyHealth-damage):Math.max(18,enemyHealth-damage); lia.setTintFill(0xfff3bc); this.time.delayedCall(110,()=>lia.active&&lia.clearTint());this.fx.burst(lia.x+45,lia.y+45,0xfff1bd);hitStop=.045; audio.play('hit',.4);this.fx.impact(); hint.setText('');};
    const action=(key:string)=>{
      if(key==='KeyW'||key==='ArrowUp') { if(wolf.y>=456) {vy=-610;jumps++;} }
      if((key==='KeyJ'||key==='KeyK')&&cooldown<=0) {
        cooldown=key==='KeyJ'?.28:.6;
        if(key==='KeyJ') { audio.play('swing',.3); const slash=this.add.image(wolf.x-25,wolf.y+40,'wolf-crescent').setScale(2.6); this.tweens.add({targets:slash,alpha:0,x:slash.x-70,duration:180,onComplete:()=>slash.destroy()}); if(Math.abs(wolf.x-lia.x)<170&&wolf.y>390) hitEnemy(13); }
        else fire('you');
      }
    };
    const down=(e:KeyboardEvent)=>{if(['ArrowLeft','ArrowRight','ArrowUp','Space'].includes(e.code))e.preventDefault();if(e.code==='KeyL'&&!keys.has(e.code))blockAt=elapsed;keys.add(e.code);if(!e.repeat){ if(lag>0)queued.push({at:elapsed+.4,key:e.code});else action(e.code); }};
    const up=(e:KeyboardEvent)=>keys.delete(e.code); const blur=()=>keys.clear();
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
    const controls=document.createElement('div');controls.className='combat-controls';
    for(const [text,key] of [['←','ArrowLeft'],['→','ArrowRight'],['Jump','KeyW'],['Strike','KeyJ'],['Cast','KeyK'],['Block','KeyL']]){
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
        // At this cap the fastest bolt moves 69px, below its 110px hit window.
        const d=Math.max(0,Math.min(dt/1000,.1));if(hitStop>0){hitStop-=d;return;}elapsed+=d;cooldown-=d;hitFlash-=d;
        // Autoplay is a test-only route and uses the same state/result path.
        if(this.ctx.autoplay&&elapsed>.65){firstHit=true;hits=2;health=finalRound&&new URLSearchParams(location.search).get('outcome')==='win'?80:0;enemyHealth=health?0:60;end();return;}
        if(firstHit&&mode==='opening'&&elapsed>4&&!lagTriggered){lag=.5;lagTriggered=true;net.setText('NETWORK DELAY');}
        const frozen=mode==='opening'&&lag>0; if(lag>0)lag-=d;
        const delayedBlock=!finalRound&&(mode==='second'||mode==='third');
        const blocking=keys.has('KeyL')&&(!delayedBlock||elapsed-blockAt>=.4);guard.setVisible(blocking);guard.setPosition(wolf.x-10,wolf.y+8);
        if(!frozen){const dir=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);wolf.x=Phaser.Math.Clamp(wolf.x+dir*(blocking?130:330)*d,80,1180);wolf.setFlipX(dir>0);}
        vy+=1450*d;wolf.y=Math.min(457,wolf.y+vy*d);if(wolf.y===457){vy=0;if(wasAirborne){this.fx.burst(wolf.x+40,553,0x848da6,.45);wasAirborne=false;}}else wasAirborne=true;
        const moving=keys.has('KeyA')||keys.has('KeyD')||keys.has('ArrowLeft')||keys.has('ArrowRight');
        if(!this.fx.reduced){wolf.setScale(2.5+(moving?Math.sin(elapsed*21)*.045:Math.sin(elapsed*3)*.018),2.5-(moving?Math.sin(elapsed*21)*.035:Math.sin(elapsed*3)*.018));lia.setScale(2.5+Math.sin(elapsed*2.5)*.018,2.5-Math.sin(elapsed*2.5)*.025);}
        while(queued.length&&queued[0].at<=elapsed)action(queued.shift()!.key);
        telegraph.clear();
        if(mode!=='opening'||firstHit||elapsed>20){enemyTimer-=d;if(enemyTimer<=.65&&enemyTimer>0){lia.setTint(0xc7ffff);telegraph.lineStyle(2,0x6de9ff,1-enemyTimer).strokeCircle(lia.x+80,485,10+enemyTimer*24);} if(enemyTimer<=0){fire('lia');lia.clearTint();enemyTimer=finalRound?1.45:1.1;}}
        // Lia has footwork in every round. She plants her feet while a spell charges.
        const oldLiaX=lia.x;
        if(enemyTimer>.65){const targetX=265+Math.sin(elapsed*.85)*100;lia.x+=Phaser.Math.Clamp(targetX-lia.x,-85*d,85*d);}
        lia.setFlipX(wolf.x<lia.x);
        if(!this.fx.reduced){lia.y=442+(Math.abs(lia.x-oldLiaX)>.1?Math.sin(elapsed*12)*2:Math.sin(elapsed*2)*.8);lia.angle=enemyTimer<=.65?-2:Math.sin(elapsed*2)*.8;}
        trails.clear();for(let i=bolts.length-1;i>=0;i--){const b=bolts[i];b.sprite.x+=b.vx*d;
          trails.lineStyle(3,b.owner==='lia'?0x68e8ff:0xe0ffe9,.3).lineBetween(b.sprite.x,b.sprite.y,b.sprite.x-Math.sign(b.vx)*75,b.sprite.y);b.sprite.setAngle(b.owner==='you'?Math.sin(elapsed*14)*9:0);
          const target=b.owner==='lia'?wolf:lia;
          if(Math.abs(b.sprite.x-(target.x+40))<55&&Math.abs(b.sprite.y-(target.y+40))<58){
            if(b.owner==='lia') {if(blocking){blocks++;audio.play('whiff',.2);this.fx.burst(wolf.x-8,wolf.y+45,0x9dffec,.7);this.fx.ring(wolf.x-8,wolf.y+45);guard.setFillStyle(0xffffff);this.time.delayedCall(150,()=>guard.active&&guard.setFillStyle(0xa9fff0));}else{health-=finalRound?18:24;wolf.x=Math.min(1190,wolf.x+25);wolf.setTintFill(0xffb9b9);hitFlash=.15;hitStop=.065;this.fx.burst(wolf.x+40,wolf.y+40,0xff978d,1.2);audio.play('hit',.4);this.fx.impact(.004);if(mode==='second')hint.setText('lia_ph: bro just block 😭');}}else hitEnemy(12);
            b.sprite.destroy();bolts.splice(i,1);
          }else if(b.sprite.x<-100||b.sprite.x>1400){b.sprite.destroy();bolts.splice(i,1);}
        }
        if(hitFlash<=0)wolf.clearTint();
        if(!finalRound&&((firstHit&&elapsed>19)||elapsed>35))health-=d*26;
        // A stalled opening still gives the player time to learn; projectiles never fire before their first hit.
        if(mode==='opening'&&!firstHit&&elapsed>14)hint.setText('Hold K to cast, or tap Cast below. You are the wolf on the right.');
        if(!frozen){if(keys.has('KeyK')&&cooldown<=0)action('KeyK');if(keys.has('KeyJ')&&cooldown<=0)action('KeyJ');}
        enemyBar.width=Math.max(0,enemyHealth)*4.3;playerBar.width=Math.max(0,health)*4.3;
        enemyTrail.width=Phaser.Math.Linear(enemyTrail.width,enemyBar.width,Math.min(1,d*4));playerTrail.width=Phaser.Math.Linear(playerTrail.width,playerBar.width,Math.min(1,d*4));
        if(mode==='third'){shots.push({x:wolf.x,y:wolf.y,angle:wolf.angle});if(shots.length>150)shots.shift();}
        net.setText(finalRound?'CONNECTION STABLE':firstHit&&mode==='opening'?'NETWORK DELAY':mode==='rematch'?'REMATCH':mode==='second'||mode==='third'?'NETWORK DELAY':'CONNECTION UNSTABLE');
        if(health<=0||enemyHealth<=0||(finalRound&&elapsed>=35)){this.outcome=health>0&&(enemyHealth<=0||health>enemyHealth)?'win':'loss';end();}
      };this.events.on('update',tick);
    });
    if(this.ctx.autoplay)this.outcome=finalRound&&new URLSearchParams(location.search).get('outcome')==='win'?'win':'loss';
    if(!finalRound)this.outcome='loss';
    bolts.forEach(b=>b.sprite.destroy());guard.destroy();telegraph.destroy();trails.destroy();hint.destroy();prompt.destroy();
    const loser=this.outcome==='win'?lia:wolf;audio.play('ko',.45);
    for(let i=0;i<18;i++)shots.push({x:loser.x+(i+1)*13,y:loser.y-(i+1)*16,angle:i*2});
    await this.tween(loser,this.fx.reduced?{alpha:.25}:{x:this.outcome==='win'?-100:1310,y:100,angle:this.outcome==='win'?-30:30},.55,'Quad.easeOut');
    if(mode==='third')this.lastKnockout=shots;
    const result=this.big(this.outcome==='win'?'VICTORY':'DEFEAT',205,78).setScale(this.fx.reduced?1:1.06).setAlpha(0);
    await this.tween(result,{scaleX:1,scaleY:1,alpha:1},.25,'Sine.easeOut');
    (window as Window & {__combat?: unknown}).__combat={mode,outcome:this.outcome,hits,blocks,jumps,elapsed};
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
    this.add.image(773,377,'arena-bg').setDisplaySize(414,262);this.rect(753,532,35,33,0x5e6476);this.rect(699,560,140,9,0x727589);
    const wolf=this.pixelSprite('wolf',320,440).setScale(3.2);this.rect(510,550,150,9,0x8a8e96);
    if(cracked){const g=this.add.graphics().lineStyle(1,0xc4edf2,.65);
      for(const line of [[790,374,733,337,712,287],[790,374,844,351,910,281],[790,374,835,414,923,471],[790,374,739,410,698,497]]){
        g.beginPath();g.moveTo(line[0],line[1]);g.lineTo(line[2],line[3]);g.lineTo(line[4],line[5]);g.strokePath();
      }
    }
    return wolf;
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
    this.playerDesk();const controller=this.rect(410,493,72,23,0x969aaa).setStrokeStyle(3,0x242732);
    await this.beat('T.1',.4);await this.tween(controller,this.fx.reduced?{alpha:0}:{x:790,y:370,angle:12},.45);audio.play('smash',.35);
    audio.stop('arcade');const body=this.playerDesk(true);await this.beat('T.2',.8);
    this.label('CONNECTION LOST\nlia_ph is still there.',650,310,21,'#d4ffff',300);await this.beat('T.3',1.2);
    audio.play('crt',.12);
    await this.tween(body,this.fx.reduced?{alpha:.65}:{x:390,y:430,alpha:.65},.7);await this.mark('T.4');
    await this.tween(body,{alpha:0},.55);await this.mark('T.5');
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
    this.label('Art · Dain Kim     Story & design · Carl Kho\nSound effects · ElevenLabs',640,480,18,C.dim).setOrigin(.5,0).setAlign('center');
    await this.mark('E.9');this.finish({completed:true,outcome:this.outcome,replies:this.replies,seen:[...this.seen],chapters:13});
    if(!this.ctx.autoplay){try{localStorage.removeItem('gg-ez-save-v1');}catch{/* storage unavailable */}}
    this.row(['Play again'],520,590,()=>{audio.stop();location.href=location.pathname;});
  }
}
