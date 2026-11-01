import {chromium} from 'playwright';
import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
await mkdir(resolve('verification'),{recursive:true});
const browser=await chromium.launch({...(process.env.PREVIEW_BROWSER?{executablePath:process.env.PREVIEW_BROWSER}:{}),headless:true,args:['--mute-audio']});
const errors=[],results=[];
try{
 const p=await browser.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errors.push(e.message));
 await p.goto(pathToFileURL(resolve('release/GG-EZ-PLAY.html')).href+'?scene=campaign&chapter=3');
 await p.waitForFunction(()=>window.__beat==='L3.1');await p.keyboard.down('KeyK');await p.keyboard.down('KeyL');
 const x=await p.evaluate(()=>window.__previewGame.scene.getScene('campaign').children.list.find(c=>c.texture?.key==='lia-wizard').x);
 await p.waitForFunction(x=>Math.abs(window.__previewGame.scene.getScene('campaign').children.list.find(c=>c.texture?.key==='lia-wizard').x-x)>15,x);
 await p.waitForFunction(()=>window.__combat,{},{timeout:45000});await p.keyboard.up('KeyK');await p.keyboard.up('KeyL');
 await p.getByRole('button',{name:'Continue',exact:true}).click();await p.waitForFunction(()=>window.__beat==='L3.5');await p.getByRole('button',{name:'Continue',exact:true}).click();
 await p.waitForFunction(()=>window.__beat==='T.2');await p.screenshot({path:resolve('verification/cracked-screen.png')});
 await p.waitForFunction(()=>window.__beat==='T.4');
 const transition=await p.evaluate(()=>{const s=window.__previewGame.scene.getScene('campaign');return {wolves:s.children.list.filter(c=>c.texture?.key==='wolf').map(c=>({sx:c.scaleX,sy:c.scaleY})),shaking:s.cameras.main.shakeEffect.isRunning};});
 assert.equal(transition.wolves.length,1);assert.equal(transition.wolves[0].sx,transition.wolves[0].sy);assert.equal(transition.shaking,false);
 await p.waitForFunction(()=>window.__beat==='T.9');await p.screenshot({path:resolve('verification/room-arrival.png')});results.push({liaFootwork:true,transition});
 await p.close();
 const room=await browser.newPage({viewport:{width:1280,height:720}});room.on('pageerror',e=>errors.push(e.message));
 await room.goto(pathToFileURL(resolve('release/GG-EZ-PLAY.html')).href+'?scene=campaign&chapter=7');
 await room.waitForFunction(()=>window.__beat==='C1.1');
 // The caller dialogue holds the same room so this samples actual sustained rendering.
 const frames=await room.evaluate(()=>new Promise(resolve=>{const deltas=[];let last=performance.now();function tick(now){deltas.push(now-last);last=now;if(deltas.length<120)requestAnimationFrame(tick);else{deltas.sort((a,b)=>a-b);const s=window.__previewGame.scene.getScene('campaign');resolve({medianMs:deltas[60],p95Ms:deltas[114],children:s.children.length,tweens:s.tweens.getTweens().length,updates:s.events.listenerCount('update')});}}requestAnimationFrame(tick);}));
 await room.screenshot({path:resolve('verification/lia-on-call.png')});results.push({roomFrames:frames});await room.close();
 assert.deepEqual(errors,[]);await writeFile(resolve('verification/presentation-report.json'),JSON.stringify({passed:true,results,errors},null,2));console.log(JSON.stringify({passed:true,results},null,2));
}finally{await browser.close();}
