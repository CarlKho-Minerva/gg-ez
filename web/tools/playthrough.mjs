import {chromium} from 'playwright';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({...(process.env.PREVIEW_BROWSER?{executablePath:process.env.PREVIEW_BROWSER}:{}),headless:true,args:['--mute-audio']});
const page=await browser.newPage({viewport:{width:960,height:540}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
let battle='',observed=new Set(),started=Date.now();
try{
 await page.goto(pathToFileURL(resolve('release/GG-EZ-PLAY.html')).href);
 await page.getByRole('button',{name:'Start game',exact:true}).click();
 while(Date.now()-started<300000){
  const state=await page.evaluate(()=>({beat:window.__beat,done:window.__done,error:window.__error,choice:window.__choice}));
  assert.equal(state.error,undefined);if(state.done){assert(state.done.completed);assert.equal(state.done.chapters,13);assert.equal(state.done.outcome,'win');assert.deepEqual(state.done.seen,['badge','phone','food']);
    assert.deepEqual(errors,[]);await page.screenshot({path:resolve('verification/standalone-ending.png')});
    await writeFile(resolve('verification/playthrough.json'),JSON.stringify({passed:true,seconds:(Date.now()-started)/1000,result:state.done,errors},null,2));console.log(JSON.stringify({passed:true,seconds:(Date.now()-started)/1000,result:state.done}));break;}
  if(['2.1','L2.1','L3.1','M2.1','F.1'].includes(state.beat)&&battle!==state.beat){battle=state.beat;await page.keyboard.up('KeyK');await page.keyboard.up('KeyL');await page.keyboard.down('KeyK');await page.keyboard.down('KeyL');}
  if(state.choice){const button=page.getByRole('button',{name:'okay that was clean',exact:true});if(await button.count())await button.click();}
  if(state.beat==='explore'){
    const o=['badge','phone','food'].find(x=>!observed.has(x));if(o){await page.getByRole('button',{name:o,exact:true}).click();observed.add(o);}else await page.getByRole('button',{name:'Continue the night →',exact:true}).click();
  }else{const next=page.getByRole('button',{name:'Continue',exact:true});if(await next.count())await next.click();}
  await page.waitForTimeout(120);
 }
 assert(await page.evaluate(()=>window.__done?.completed),'Playthrough reached credits within five minutes');
}finally{await browser.close();}
