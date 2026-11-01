import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist'),out=resolve('verification');await mkdir(out,{recursive:true});
const errors=[],results=[];
const server=createServer(async(req,res)=>{try{const file=resolve(root,new URL(req.url,'http://localhost').pathname.slice(1)||'index.html');if(!file.startsWith(root+sep))throw Error('escape');res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.mp3':'audio/mpeg','.png':'image/png'})[extname(file)]??'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch({...(process.env.PREVIEW_BROWSER?{executablePath:process.env.PREVIEW_BROWSER}:{}),headless:true,args:['--mute-audio']});
const sceneState=p=>p.evaluate(()=>{const s=window.__previewGame.scene.getScene('campaign');return {beat:window.__beat,seen:[...s.seen],x:s.ghost?.x,y:s.ghost?.y,worldX:s.world?.x,worldY:s.world?.y,scale:s.world?.scaleX,children:s.children.length,updates:s.events.listenerCount('update'),tweens:s.tweens.getTweens().length};});
async function advanceUntil(p,beat){for(let n=0;n<160;n++){assert.equal(await p.evaluate(()=>window.__error),undefined);if(await p.evaluate(b=>window.__beat===b,beat))return;const next=p.getByRole('button',{name:'Continue',exact:true});if(await next.count())await next.click();await p.waitForTimeout(100);}throw Error('Did not reach '+beat);}
async function moveTo(p,x,y){const s=await sceneState(p);await p.mouse.click(s.worldX+x*s.scale,s.worldY+y*s.scale);}
async function arrive(p,x,y){await p.waitForFunction(({x,y})=>{const g=window.__previewGame.scene.getScene('campaign').ghost;return g&&Math.hypot(g.x-x,g.y-y)<5;},{x,y},{timeout:12000});}
try{
 const p=await browser.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errors.push(e.message));
 await p.goto(base+'?scene=campaign&chapter=4');await advanceUntil(p,'explore');await p.waitForTimeout(800);
 assert.equal(await p.locator('#ui button').count(),0,'No exploration buttons');
 await p.screenshot({path:resolve(out,'collision-room.png')});
 const timing=await p.evaluate(()=>{const s=window.__previewGame.scene.getScene('campaign'),start=s.ghost.x;
  try{window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyD'}));for(let i=0;i<10;i++)s.events.emit('update',i*100,100);const normal=s.ghost.x-start;s.events.emit('update',10000,10000);const resume=s.ghost.x-start-normal;
   window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyD'}));window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyA'}));for(let i=0;i<11;i++)s.events.emit('update',i*100,100);return {normal,resume};
  }finally{window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyA'}));window.dispatchEvent(new KeyboardEvent('keyup',{code:'KeyD'}));}});
 assert.equal(timing.normal,225,'10fps must retain full walking speed');assert.equal(timing.resume,22.5,'Long resume gap stays bounded');
 const before=await sceneState(p);await p.keyboard.down('ArrowLeft');await p.waitForFunction(x=>window.__previewGame.scene.getScene('campaign').ghost.x<x-25,before.x,{timeout:5000});await p.keyboard.up('ArrowLeft');const after=await sceneState(p);assert(after.x<before.x-20,`Keyboard moves ghost: ${JSON.stringify({before,after})}`);
 // Click only chooses a destination. Crossing physical object opens it later.
 await moveTo(p,711,454);assert.equal((await sceneState(p)).beat,'explore');await p.waitForFunction(()=>window.__beat==='C2',{},{timeout:5000});await advanceUntil(p,'explore');await p.waitForTimeout(900);
 let state=await sceneState(p);assert(state.seen.includes('food'));assert.equal(state.beat,'explore','Resting on an inspected item must not reopen it');
 // The monitor is physically reachable but locked after only one discovery.
 await moveTo(p,642,416);await arrive(p,642,416);assert.equal((await sceneState(p)).beat,'explore');
 await moveTo(p,390,474);await p.waitForFunction(()=>window.__beat==='A3',{},{timeout:5000});await advanceUntil(p,'explore');await p.waitForTimeout(700);
 await moveTo(p,181,450);await p.waitForFunction(()=>window.__beat==='B2',{},{timeout:5000});await advanceUntil(p,'explore');await p.waitForTimeout(700);
 state=await sceneState(p);assert.deepEqual(state.seen,['food','badge','phone']);assert.equal(state.updates,before.updates,'Exploration update owners do not accumulate');
 // Exit then re-enter a seen object. It opens once using its cached branch.
 await moveTo(p,270,375);await arrive(p,270,375);await moveTo(p,181,450);await p.waitForFunction(()=>window.__beat==='B2.cached',{},{timeout:5000});await advanceUntil(p,'explore');await p.waitForTimeout(600);
 // Walk above the desk to avoid other objects, then enter the monitor to leave.
 await moveTo(p,640,320);await arrive(p,640,320);await moveTo(p,642,416);await p.waitForFunction(()=>window.__beat==='N2',{},{timeout:5000});
 await p.evaluate(()=>window.__previewGame.scene.stop('campaign'));await p.waitForTimeout(100);
 const stopped=await p.evaluate(()=>({error:window.__error,rigTextures:window.__previewGame.textures.getTextureKeys().filter(k=>k.startsWith('room-lia-')),buttons:document.querySelectorAll('#ui button').length}));
 assert.equal(stopped.error,undefined);assert.deepEqual(stopped.rigTextures,[]);assert.equal(stopped.buttons,0);
 results.push({collision:true,keyboard:true,pointer:true,reentry:true,lockedExit:true,timing,scene:state,shutdown:stopped});await p.close();
 // Phone-sized viewport: input still maps to the scaled room.
 const phone=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});phone.on('pageerror',e=>errors.push(e.message));
 await phone.goto(base+'?scene=campaign&chapter=4');await phone.waitForTimeout(1600);await phone.screenshot({path:resolve(out,'phone-input-diagnostic.png')});console.log('mobile layout',await phone.evaluate(()=>({innerWidth,innerHeight,visualWidth:visualViewport.width,frame:document.querySelector('#frame').getBoundingClientRect().toJSON(),canvas:document.querySelector('canvas').getBoundingClientRect().toJSON()})));await advanceUntil(phone,'explore');await phone.waitForTimeout(600);
 const rect=await phone.locator('canvas').boundingBox();const s=await sceneState(phone);
 await phone.touchscreen.tap(rect.x+(s.worldX+711*s.scale)*rect.width/1280,rect.y+(s.worldY+454*s.scale)*rect.height/720);
 await phone.waitForFunction(()=>window.__beat==='C2',{},{timeout:5000});await phone.screenshot({path:resolve(out,'collision-phone.png')});results.push({scaledTouch:true,reducedMotion:true});await phone.close();
 assert.deepEqual(errors,[]);await writeFile(resolve(out,'exploration-report.json'),JSON.stringify({passed:true,results,errors},null,2));console.log(JSON.stringify({passed:true,results},null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
