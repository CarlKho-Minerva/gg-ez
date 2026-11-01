import Phaser from 'phaser';

export type Discovery = 'badge' | 'phone' | 'food' | 'continue';
export const OBJECTS: {id: Discovery; x: number; y: number; rx: number; ry: number; label: string}[] = [
  {id:'phone', x:181, y:450, rx:38, ry:32, label:'Mama'},
  {id:'badge', x:390, y:474, rx:35, ry:39, label:'Night shift'},
  {id:'food', x:711, y:454, rx:35, ry:29, label:'Dinner, still here'},
  {id:'continue', x:642, y:416, rx:38, ry:36, label:'Back to the match'},
];
export type FloatPosition = {x:number; y:number};

/** One input owner for the room. Touch sets a destination, never activates an object. */
export function exploreRoom(scene: Phaser.Scene, ghost: Phaser.GameObjects.Image,
  world: Phaser.GameObjects.Container, signal: AbortSignal, seen: Set<string>,
  position: FloatPosition, blocked?: Discovery): Promise<Discovery> {
  return new Promise((resolve, reject) => {
    const keys = new Set<string>();
    let destination: FloatPosition | undefined;
    let disposed = false;
    let age = 0;
    ghost.setPosition(position.x, position.y);
    scene.tweens.killTweensOf(ghost);
    const glow = scene.add.graphics(); world.add(glow);
    const caption = scene.add.text(0, 0, '', {fontFamily:'Arial, sans-serif', fontSize:'16px', color:'#c3d6d1'}).setOrigin(.5,1);
    world.add(caption);
    const codes = ['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight'];
    const down = (e:KeyboardEvent) => {if(codes.includes(e.code)){e.preventDefault(); keys.add(e.code);destination=undefined;}};
    const up = (e:KeyboardEvent) => keys.delete(e.code);
    const blur = () => {keys.clear(); destination=undefined;};
    const point = (pointer:Phaser.Input.Pointer) => {
      // DOM-to-game scaling is handled by Phaser; use the actual room transform.
      const local = world.getWorldTransformMatrix().applyInverse(pointer.x, pointer.y);
      destination = {x:Phaser.Math.Clamp(local.x,95,1180), y:Phaser.Math.Clamp(local.y,300,503)};
    };
    const drag = (pointer:Phaser.Input.Pointer) => {if(pointer.isDown) point(pointer);};
    const inside = (o:typeof OBJECTS[number]) => ((position.x-o.x)/o.rx)**2+((position.y-o.y)/o.ry)**2 <= 1;
    const clean = () => {
      if(disposed)return;disposed=true;
      window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',blur);
      scene.input.off('pointerdown',point);scene.input.off('pointermove',drag);
      scene.events.off('update',tick);signal.removeEventListener('abort',abort);
      glow.destroy();caption.destroy();
    };
    const abort = () => {clean();reject(new Error('Scene stopped'));};
    const tick = (_time:number,dt:number) => {
      // A busy frame must not halve walking speed. Bound resume jumps to 22.5px.
      const d = Math.max(0,Math.min(dt/1000,.1)); age+=d;
      let dx=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
      let dy=Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'));
      if(destination){dx=destination.x-position.x;dy=destination.y-position.y;}
      const distance = Math.hypot(dx,dy);
      if(distance){const step=destination?Math.min(distance,225*d):225*d;position.x+=dx/distance*step;position.y+=dy/distance*step;}
      if(destination && distance<2)destination=undefined;
      position.x=Phaser.Math.Clamp(position.x,95,1180);position.y=Phaser.Math.Clamp(position.y,300,503);
      ghost.setPosition(position.x,position.y);if(dx)ghost.setFlipX(dx>0);
      // Re-entering the room cannot re-open the item under the player's feet.
      if(blocked && !inside(OBJECTS.find(o=>o.id===blocked)!))blocked=undefined;
      glow.clear();caption.setText('');
      for(const o of OBJECTS){
        const unlocked=o.id!=='continue'||seen.size>=2;
        const near=Math.hypot(position.x-o.x,position.y-o.y)<105;
        if(near){
          glow.lineStyle(1,unlocked?0xa4e4d4:0x71868c,.35).strokeEllipse(o.x,o.y+12,o.rx*1.25,9);
          caption.setPosition(o.x,o.y-36).setText(o.id==='continue'&&!unlocked?'The room has more to tell.':o.label);
        }
        if(unlocked && age>.25 && o.id!==blocked && inside(o)){
          clean();resolve(o.id);return;
        }
      }
    };
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',blur);
    scene.input.on('pointerdown',point);scene.input.on('pointermove',drag);scene.events.on('update',tick);
    signal.addEventListener('abort',abort,{once:true});if(signal.aborted)abort();
  });
}
