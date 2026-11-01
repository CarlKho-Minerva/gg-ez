// Short gameplay clips for the narrated trailer, recorded from the built game with real input (no autoplay).
// Run from web/: node tools/trailer-record.mjs. Clips and marks.json go to TRAILER_OUT (default /tmp/gg-ez-trailer/clips).
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir,rename,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('dist'),out=process.env.TRAILER_OUT||'/tmp/gg-ez-trailer/clips';await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{try{const file=resolve(root,new URL(req.url,'http://localhost').pathname.slice(1)||'index.html');if(!file.startsWith(root+sep))throw Error('escape');res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.mp3':'audio/mpeg','.png':'image/png'})[extname(file)]??'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch({...(process.env.PREVIEW_BROWSER?{executablePath:process.env.PREVIEW_BROWSER}:{}),headless:true,args:['--mute-audio']});
const only=process.env.CLIPS?.split(',');
const log=await readFile(resolve(out,'marks.json'),'utf8').then(JSON.parse).catch(()=>({}));
const hold=(p,ms)=>p.waitForTimeout(ms);
const advance=async p=>{const b=p.getByRole('button',{name:'Continue',exact:true});if(await b.count()){await b.first().click();return true;}return false;};
const press=async(p,key,ms=240)=>{await p.keyboard.press(key);await hold(p,ms);};
const held=async(p,key,ms)=>{await p.keyboard.down(key);await hold(p,ms);await p.keyboard.up(key);};
async function clip(name,run){
  if(only&&!only.includes(name))return;
  const ctx=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:1,recordVideo:{dir:out,size:{width:1280,height:720}}});
  const t0=Date.now();const marks=[];const page=await ctx.newPage();
  const mark=label=>{marks.push({t:+((Date.now()-t0)/1000).toFixed(2),label});};
  page.on('pageerror',e=>mark('pageerror '+e.message));
  // Poll the beat id until `until` shows (or timeout), logging every change with its time in the clip.
  const watch=async(until,timeout=30000)=>{let last;const end=Date.now()+timeout;while(Date.now()<end){const b=await page.evaluate(()=>window.__beat);if(b!==last){last=b;mark('beat '+b);}if(b===until)return true;await hold(page,50);}mark('timeout waiting '+until);return false;};
  try{await run(page,mark,watch);}catch(e){mark('ERROR '+e.message);console.error(name,e.message);}
  const v=page.video();await ctx.close();const p=await v.path();const dest=resolve(out,name+'.webm');await rename(p,dest);
  log[name]={file:dest,marks};console.log(name,JSON.stringify(marks));
}
try{
 // Title, then Start game into matchmaking.
 await clip('title',async(p,mark)=>{await p.goto(base);await p.getByRole('button',{name:'Start game',exact:true}).waitFor();mark('title');await hold(p,3000);
   await p.getByRole('button',{name:'Start game',exact:true}).click();mark('start');await hold(p,7000);});
 // First match: approach, string, finisher, keep playing until the rigged round ends, then the ez chat and a reply.
 await clip('match1',async(p,mark,watch)=>{await p.goto(base+'?scene=campaign&chapter=1');await watch('2.1');
   await held(p,'KeyA',1300);mark('approach');
   for(let i=0;i<3;i++)await press(p,'KeyJ');mark('string1');
   await hold(p,900);await press(p,'KeyJ',230);await press(p,'KeyJ',230);await press(p,'KeyK',120);mark('finisher');
   await hold(p,1200);
   const started=Date.now();
   while(!(await p.evaluate(()=>!!window.__combat))&&Date.now()-started<50000){
     await held(p,'KeyD',500);for(let i=0;i<3;i++)await press(p,'KeyJ');await press(p,'KeyK',700);
     await held(p,'KeyL',600);await held(p,'KeyA',500);await press(p,'KeyW',400);
   }
   mark('result');await watch('2.5',10000);await hold(p,1200);await advance(p);mark('continue');
   await p.waitForFunction(()=>window.__choice,{},{timeout:30000});mark('chat');
   await hold(p,2000);await p.getByRole('button',{name:'fuck off',exact:true}).click();mark('reply');await hold(p,2600);});
 // Rematch: a few seconds of play under the lag.
 await clip('rematch',async(p,mark,watch)=>{await p.goto(base+'?scene=campaign&chapter=2');await watch('L2.1');
   await held(p,'KeyA',1100);for(let i=0;i<3;i++)await press(p,'KeyJ');await press(p,'KeyK',600);await held(p,'KeyL',700);await press(p,'KeyS',500);
   for(let i=0;i<3;i++)await press(p,'KeyJ');await held(p,'KeyK',1200);await held(p,'KeyD',600);for(let i=0;i<3;i++)await press(p,'KeyJ');await hold(p,1500);mark('end');});
 // Third loss: hold K and L until the result, Continue twice, then the throw, the crack and the pull through the screen.
 await clip('third',async(p,mark,watch)=>{await p.goto(base+'?scene=campaign&chapter=3');await watch('L3.1');
   await p.keyboard.down('KeyK');await p.keyboard.down('KeyL');
   await p.waitForFunction(()=>window.__combat,{},{timeout:60000});mark('result');await p.keyboard.up('KeyK');await p.keyboard.up('KeyL');
   await p.getByRole('button',{name:'Continue',exact:true}).click();mark('continue1');await watch('L3.5');
   await p.getByRole('button',{name:'Continue',exact:true}).click();mark('continue2');
   await watch('T.9',40000);await hold(p,1500);});
 // First room visit: arrival, Lia at her desk, then drift the ghost.
 await clip('room',async(p,mark,watch)=>{await p.goto(base+'?scene=campaign&chapter=4');await watch('R.1');await hold(p,1800);
   for(const [k,ms] of [['KeyA',900],['KeyW',500],['KeyD',1500],['KeyS',600],['KeyA',800]])await held(p,k,ms);mark('drift');await hold(p,1500);});
 // The customer call close-up.
 await clip('call',async(p,mark,watch)=>{await p.goto(base+'?scene=campaign&chapter=7');await watch('C1.1');
   // Held lines wait for Continue; advance every few seconds so the call moves.
   const started=Date.now();let last;while(Date.now()-started<18000){const b=await p.evaluate(()=>window.__beat);if(b!==last){last=b;mark('beat '+b);}await hold(p,2600);if(await advance(p))mark('continue');}});
 // The fair fight: cast, block, strike, move.
 await clip('final',async(p,mark,watch)=>{await p.goto(base+'?scene=campaign&chapter=11');await watch('F.1');
   // Keep the cast, block, strike, move pattern going until the fair fight ends (up to 42 s), then hold on the result.
   const started=Date.now();
   while(!(await p.evaluate(()=>!!window.__combat))&&Date.now()-started<42000){
     await p.keyboard.down('KeyK');await hold(p,1700);await p.keyboard.down('KeyL');await hold(p,900);await p.keyboard.up('KeyL');await p.keyboard.up('KeyK');mark('cast+block');
     await held(p,'KeyA',600);for(let i=0;i<3;i++)await press(p,'KeyJ');await press(p,'KeyK',600);mark('string');
     await held(p,'KeyL',900);await held(p,'KeyK',1500);await held(p,'KeyD',500);for(let i=0;i<3;i++)await press(p,'KeyJ');await press(p,'KeyK',600);
     await held(p,'KeyL',800);
   }
   mark('result');await hold(p,2500);});
 // Title and end cards, rendered by the browser (this machine's ffmpeg has no drawtext).
 const card=async(name,html)=>{if(only)return;const p=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});await p.setContent(`<html><body style="margin:0;background:#000;width:1280px;height:720px;display:flex;align-items:center;justify-content:center;font-family:'Arial Black','Helvetica Neue',Arial,sans-serif;color:#fff;text-align:center">${html}</body></html>`);await hold(p,300);await p.screenshot({path:resolve(out,name+'.png')});await p.close();};
 await card('card-title','<div><div style="font-size:150px;letter-spacing:10px;line-height:1">GG EZ</div><div style="font-family:Helvetica,Arial,sans-serif;font-size:34px;margin-top:28px;color:#cfd4e6">a game by Carl Kho and Dain Kim</div></div>');
 await card('card-end','<div><div style="font-size:120px;letter-spacing:8px;line-height:1">GG EZ</div><div style="font-family:Helvetica,Arial,sans-serif;font-size:30px;margin-top:22px;color:#cfd4e6">Carl Kho and Dain Kim, for the Checkpoint Game Jam</div><div style="font-family:Helvetica,Arial,sans-serif;font-size:46px;margin-top:54px;color:#ffffff">carlcrafterz.itch.io/gg-ez</div></div>');
 await writeFile(resolve(out,'marks.json'),JSON.stringify(log,null,2));console.log('clips written to',out);
}finally{await browser.close();server.close();}
