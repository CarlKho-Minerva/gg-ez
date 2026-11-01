import { chromium } from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import assert from 'node:assert/strict';
const root=resolve('dist'), out=resolve('verification');await mkdir(out,{recursive:true});
const errors=[],missing=[],results=[];
const server=createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost');if(!url.pathname.startsWith('/game/'))throw Error('bad base');
 const file=resolve(root,decodeURIComponent(url.pathname.slice(6))||'index.html');if(!file.startsWith(root+sep))throw Error('escape');
 res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.mp3':'audio/mpeg','.png':'image/png'})[extname(file)]??'application/octet-stream');res.end(await readFile(file));
}catch{missing.push(req.url);res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/game/`;
const browser=await chromium.launch({...(process.env.PREVIEW_BROWSER?{executablePath:process.env.PREVIEW_BROWSER}:{}),headless:true,args:['--mute-audio','--no-first-run']});
const make=async()=>{const p=await browser.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errors.push(e.message));return p;};
try{
 const menu=await make();await menu.goto(base);await menu.getByRole('button',{name:'Start game',exact:true}).waitFor();await menu.screenshot({path:resolve(out,'title.png')});await menu.close();
 // Six complete paths include every chapter and distinct final result/reply combinations.
 await Promise.all(['win','loss'].flatMap(outcome=>['okay that was clean','fuck off','silence'].map(async pick=>{
  const p=await make();const shots=outcome==='win'&&pick==='okay that was clean';
  if(shots){await p.exposeFunction('captureBeat',async id=>{if(['R.1','R.3','A3','B2','C1.7','P.3','P.9','K.4','F.5','E.2A','E.9'].includes(id))await p.screenshot({path:resolve(out,`${id}.png`)});});await p.addInitScript(()=>window.__captureBeat=id=>window.captureBeat(id));}
  await p.goto(`${base}?scene=campaign&autoplay=1&outcome=${outcome}&pick=${encodeURIComponent(pick)}`);
  await p.waitForFunction(()=>window.__done||window.__error,{},{timeout:120000});
  const r=await p.evaluate(()=>({done:window.__done,error:window.__error,beats:window.__beats}));
  assert.equal(r.error,undefined);assert(r.done.completed);assert.equal(r.done.outcome,outcome);assert.equal(r.done.replies.at(-1),pick);
  for(let c=1;c<=13;c++)assert(r.beats.some(b=>b.id===`chapter.${c}`),`chapter ${c}`);
  const e=r.beats.find(b=>b.id==='E.1');assert.equal(e.text.includes('lia_ph: for you apparently 💀'),outcome==='win');
  assert.deepEqual(r.done.seen,['badge','phone','food']);results.push({route:`${outcome}/${pick}`,beats:r.beats.length,completed:true});await p.close();
 })));
 // Real keyboard fight: no autoplay, land projectiles and defend, then win independently of story state.
 const play=await make();await play.goto(`${base}?scene=campaign&chapter=11`);await play.waitForFunction(()=>window.__beat==='F.1');
 await play.keyboard.down('KeyK');await play.keyboard.down('KeyL');
 await play.waitForFunction(()=>window.__combat,{},{timeout:45000});const fight=await play.evaluate(()=>window.__combat);
 await play.keyboard.up('KeyK');await play.keyboard.up('KeyL');assert.equal(fight.outcome,'win');assert(fight.hits>=8);assert(fight.blocks>0);results.push({realCombat:fight});await play.close();
 // Real three-second silence is still a choice, with no third button or morality score.
 const timeout=await make();await timeout.goto(`${base}?scene=campaign&chapter=12`);await timeout.waitForFunction(()=>window.__choice);
 const started=Date.now();assert.equal(await timeout.getByRole('button',{name:'okay that was clean',exact:true}).count(),1);
 await timeout.waitForFunction(()=>window.__beat==='E.2C');assert(Date.now()-started>=2750);results.push({silenceMs:Date.now()-started});await timeout.close();
 // A passive new player still reaches the story; the tutorial has a grace period, not a dead end.
 const passive=await make();await passive.goto(`${base}?scene=campaign&chapter=1`);
 await passive.waitForFunction(()=>window.__combat||window.__error,{},{timeout:90000}).catch(async error=>{console.error('Passive opening diagnostic',await passive.evaluate(()=>({beat:window.__beat,error:window.__error,visibility:document.visibilityState,fps:window.__previewGame.loop.actualFps,paused:window.__previewGame.isPaused})));throw error;});
 assert.equal(await passive.evaluate(()=>window.__error),undefined);
 const idle=await passive.evaluate(()=>window.__combat);assert.equal(idle.outcome,'loss');assert.equal(idle.hits,0);assert(idle.elapsed>20&&idle.elapsed<40);results.push({passiveOpening:idle});await passive.close();
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
 await writeFile(resolve(out,'report.json'),JSON.stringify({passed:true,results,errors,missing},null,2));console.log(JSON.stringify({passed:true,results},null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
