// End-to-end check of the build itch actually serves: node tools/hosted-check.mjs <upload-id>
// Runs all six autoplay routes through the hosted frame, then a real keyboard fight and the real three-second silence.
import {chromium} from 'playwright';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const id=process.argv[2];if(!/^\d+$/.test(id??''))throw Error('usage: node tools/hosted-check.mjs <upload-id>');
const base=`https://html-classic.itch.zone/html/${id}/index.html`;
const out=resolve('verification');await mkdir(out,{recursive:true});
const browser=await chromium.launch({...(process.env.PREVIEW_BROWSER?{executablePath:process.env.PREVIEW_BROWSER}:{}),headless:true,args:['--mute-audio']});
const errors=[],failed=[],results=[];
const make=async()=>{const p=await browser.newPage({viewport:{width:1280,height:720}});p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)failed.push(`${r.status()} ${r.url()}`);});return p;};
try{
 const menu=await make();const first=await menu.goto(base);assert.equal(first.status(),200);await menu.getByRole('button',{name:'Start game',exact:true}).waitFor({timeout:60000});
 await menu.screenshot({path:resolve(out,'hosted-title.png')});
 const tagline=await menu.evaluate(()=>document.querySelector('meta[name=description]').content);assert(!/person/.test(tagline),'meta still spoils the twist');await menu.close();
 for(const outcome of ['win','loss'])for(const pick of ['okay that was clean','fuck off','silence']){
  const p=await make();await p.goto(`${base}?scene=campaign&autoplay=1&outcome=${outcome}&pick=${encodeURIComponent(pick)}`);
  await p.waitForFunction(()=>window.__done||window.__error,{},{timeout:180000});
  const r=await p.evaluate(()=>({done:window.__done,error:window.__error,beats:window.__beats.length}));
  assert.equal(r.error,undefined);assert(r.done.completed);assert.equal(r.done.outcome,outcome);assert.equal(r.done.replies.at(-1),pick);
  results.push({route:`${outcome}/${pick}`,beats:r.beats});await p.close();
 }
 const play=await make();await play.goto(`${base}?scene=campaign&chapter=11`);await play.waitForFunction(()=>window.__beat==='F.1',{},{timeout:60000});
 await play.keyboard.down('KeyK');await play.keyboard.down('KeyL');await play.waitForFunction(()=>window.__combat,{},{timeout:60000});
 const fight=await play.evaluate(()=>window.__combat);await play.keyboard.up('KeyK');await play.keyboard.up('KeyL');await play.screenshot({path:resolve(out,'hosted-final-result.png')});results.push({hostedFight:fight});await play.close();
 const t=await make();await t.goto(`${base}?scene=campaign&chapter=12`);await t.waitForFunction(()=>window.__choice,{},{timeout:60000});const started=Date.now();
 await t.waitForFunction(()=>window.__beat==='E.2C',{},{timeout:20000});results.push({hostedSilenceMs:Date.now()-started});await t.close();
 assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);
 await writeFile(resolve(out,'hosted-report.json'),JSON.stringify({passed:true,base,results},null,2));console.log(JSON.stringify({passed:true,base,results},null,1));
}catch(e){console.error('HOSTED CHECK FAILED',e,{errors,failed,results});process.exitCode=1;}finally{await browser.close();}
