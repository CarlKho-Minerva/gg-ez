import {chromium} from 'playwright';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({...(process.env.PREVIEW_BROWSER?{executablePath:process.env.PREVIEW_BROWSER}:{}),headless:true,args:['--mute-audio']});
const page=await browser.newPage({viewport:{width:960,height:540}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
await mkdir(resolve('verification'),{recursive:true});
let battle='',started=Date.now(),waypoint=false,walkTarget='',lastBeat='',lastLog=0;
try{
 await page.goto(pathToFileURL(resolve('release/GG-EZ-PLAY.html')).href);
 await page.getByRole('button',{name:'Start game',exact:true}).click();
 while(Date.now()-started<300000){
  const state=await page.evaluate(()=>({beat:window.__beat,done:window.__done,error:window.__error,choice:window.__choice}));
  if(state.beat!==lastBeat||Date.now()-lastLog>10000){lastBeat=state.beat;lastLog=Date.now();console.log(JSON.stringify({seconds:(Date.now()-started)/1000,...state,scene:await page.evaluate(()=>{const s=window.__previewGame.scene.getScene('campaign');return {fps:window.__previewGame.loop.actualFps,seen:[...s.seen],ghost:s.ghost?{x:s.ghost.x,y:s.ghost.y}:null};})}));}
  assert.equal(state.error,undefined);if(state.done){assert(state.done.completed);assert.equal(state.done.chapters,13);assert.equal(state.done.outcome,'win');assert.deepEqual(state.done.seen,['badge','phone','food']);
    assert.deepEqual(errors,[]);await page.screenshot({path:resolve('verification/standalone-ending.png')});
    await writeFile(resolve('verification/playthrough.json'),JSON.stringify({passed:true,seconds:(Date.now()-started)/1000,result:state.done,errors},null,2));console.log(JSON.stringify({passed:true,seconds:(Date.now()-started)/1000,result:state.done}));break;}
  if(['2.1','L2.1','L3.1','M2.1','F.1'].includes(state.beat)&&battle!==state.beat){battle=state.beat;await page.keyboard.up('KeyK');await page.keyboard.up('KeyL');await page.keyboard.down('KeyK');await page.keyboard.down('KeyL');}
  if(state.choice){const button=page.getByRole('button',{name:'okay that was clean',exact:true});if(await button.count())await button.click();}
  if(state.beat==='explore'){
    const room=await page.evaluate(()=>{const s=window.__previewGame.scene.getScene('campaign');return {seen:[...s.seen],x:s.ghost.x,y:s.ghost.y,wx:s.world.x,wy:s.world.y,scale:s.world.scaleX};});
    const o=['badge','phone','food'].find(x=>!room.seen.includes(x))??'continue';
    if(o!==walkTarget){walkTarget=o;waypoint=false;}
    // Travel above the desk first so an unrelated object cannot intercept the route.
    const targets={badge:[390,474],phone:[181,450],food:[711,454],continue:[642,416]};
    const [x,y]=targets[o];if(Math.abs(room.x-x)<5&&Math.abs(room.y-320)<5)waypoint=true;
    const canvas=await page.locator('canvas').boundingBox();
    await page.mouse.click(canvas.x+(room.wx+x*room.scale)*canvas.width/1280,canvas.y+(room.wy+(waypoint?y:320)*room.scale)*canvas.height/720);
  }else{const next=page.getByRole('button',{name:'Continue',exact:true});if(await next.count())await next.click();}
  await page.waitForTimeout(120);
 }
 const completed=await page.evaluate(()=>window.__done?.completed);
 if(!completed)await page.screenshot({path:resolve('verification/playthrough-timeout.png')});
 assert(completed,'Playthrough reached credits within five minutes');
}finally{await browser.close();}
