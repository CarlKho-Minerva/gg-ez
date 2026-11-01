// Page screenshots for the itch listing, taken from the built game with real input. None of them shows the room.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('dist'),out=resolve('../docs/itch');await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{try{const file=resolve(root,new URL(req.url,'http://localhost').pathname.slice(1)||'index.html');if(!file.startsWith(root+sep))throw Error('escape');res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.mp3':'audio/mpeg','.png':'image/png'})[extname(file)]??'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch({...(process.env.PREVIEW_BROWSER?{executablePath:process.env.PREVIEW_BROWSER}:{}),headless:true,args:['--mute-audio']});
const page=async()=>browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
const beat=(p,id)=>p.waitForFunction(b=>window.__beat===b,id,{timeout:30000});
try{
 const t=await page();await t.goto(base);await t.getByRole('button',{name:'Start game',exact:true}).waitFor();await t.waitForTimeout(400);await t.screenshot({path:resolve(out,'shot-1.png')});await t.close();
 // Opening match: approach, land a string, let her answer.
 const o=await page();await o.goto(base+'?scene=campaign&chapter=1');await beat(o,'2.1');
 await o.keyboard.down('KeyA');await o.waitForTimeout(1300);await o.keyboard.up('KeyA');
 for(let i=0;i<3;i++){await o.keyboard.press('KeyJ');await o.waitForTimeout(240);}
 await o.waitForTimeout(900);await o.keyboard.press('KeyJ');await o.waitForTimeout(230);await o.keyboard.press('KeyJ');await o.waitForTimeout(230);await o.keyboard.press('KeyK');await o.waitForTimeout(120);
 await o.screenshot({path:resolve(out,'shot-2.png')});await o.waitForTimeout(1400);await o.screenshot({path:resolve(out,'shot-2b.png')});await o.close();
 // Final match: she moves, you block and cast.
 const f=await page();await f.goto(base+'?scene=campaign&chapter=11');await beat(f,'F.1');
 await f.keyboard.down('KeyK');await f.waitForTimeout(1700);await f.keyboard.down('KeyL');await f.waitForTimeout(900);await f.screenshot({path:resolve(out,'shot-3.png')});
 await f.waitForTimeout(1600);await f.screenshot({path:resolve(out,'shot-3b.png')});await f.keyboard.up('KeyK');await f.keyboard.up('KeyL');await f.close();
 // The three-second chat.
 const c=await page();await c.goto(base+'?scene=campaign&chapter=12');await c.waitForFunction(()=>window.__choice);await c.waitForTimeout(350);await c.screenshot({path:resolve(out,'shot-4.png')});await c.close();
 // The cracked monitor, before anything else is revealed.
 const k=await page();await k.goto(base+'?scene=campaign&chapter=3');await beat(k,'L3.1');await k.keyboard.down('KeyK');await k.keyboard.down('KeyL');
 await k.waitForFunction(()=>window.__combat,{},{timeout:60000});await k.keyboard.up('KeyK');await k.keyboard.up('KeyL');
 await k.getByRole('button',{name:'Continue',exact:true}).click();await beat(k,'L3.5');await k.getByRole('button',{name:'Continue',exact:true}).click();
 await beat(k,'T.2');await k.waitForTimeout(150);await k.screenshot({path:resolve(out,'shot-5.png')});await k.close();
 console.log('shots written to',out);
}finally{await browser.close();server.close();}
