import Phaser from 'phaser';

/** Small, bounded effects made from geometry; no extra textures or render passes. */
export class Effects {
  readonly reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  private live = new Set<Phaser.GameObjects.Graphics>();
  constructor(private scene: Phaser.Scene) {}
  burst(x: number, y: number, color = 0x9effed, power = 1) {
    if(this.live.size >= 16) return;
    const g=this.scene.add.graphics().setPosition(x,y).setDepth(8);
    this.live.add(g);g.lineStyle(3,color,.95);
    for(let i=0;i<8;i++){const a=i*Math.PI/4;const inner=8*power,outer=(i%2?23:38)*power;
      g.lineBetween(Math.cos(a)*inner,Math.sin(a)*inner,Math.cos(a)*outer,Math.sin(a)*outer);}
    g.fillStyle(0xffffff,.9).fillRect(-4,-4,8,8);
    this.scene.tweens.add({targets:g,scaleX:this.reduced?1:1.75,scaleY:this.reduced?1:1.75,alpha:0,duration:220,
      onComplete:()=>{this.live.delete(g);g.destroy();}});
  }
  ring(x:number,y:number,color=0x9effed,size=22) {
    if(this.live.size>=16)return;
    const g=this.scene.add.graphics().lineStyle(3,color,.8).strokeCircle(0,0,size).setPosition(x,y).setDepth(7);
    this.live.add(g);this.scene.tweens.add({targets:g,scaleX:2,scaleY:2,alpha:0,duration:300,
      onComplete:()=>{this.live.delete(g);g.destroy();}});
  }
  impact(strength=.003) { if(!this.reduced)this.scene.cameras.main.shake(85,strength); }
  clear() {this.live.forEach(g=>g.destroy());this.live.clear();}
}
