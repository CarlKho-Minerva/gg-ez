// Visual check frames: the pull through the screen (chapter 3) and the survey after the credits (chapter 12).
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('dist'),out=resolve('verification');await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{try{const file=resolve(root,new URL(req.url,'http://localhost').pathname.slice(1)||'index.html');if(!file.startsWith(root+sep))throw Error('escape');res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.mp3':'audio/mpeg','.png':'image/png'})[extname(file)]??'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch({...(process.env.PREVIEW_BROWSER?{executablePath:process.env.PREVIEW_BROWSER}:{}),headless:true,args:['--mute-audio']});
const beat=(p,id)=>p.waitForFunction(b=>window.__beat===b,id,{timeout:60000});
try{
 const k=await browser.newPage({viewport:{width:1280,height:720}});await k.goto(base+'?scene=campaign&chapter=3');await beat(k,'L3.1');await k.keyboard.down('KeyK');await k.keyboard.down('KeyL');
 await k.waitForFunction(()=>window.__combat,{},{timeout:60000});await k.keyboard.up('KeyK');await k.keyboard.up('KeyL');
 await k.getByRole('button',{name:'Continue',exact:true}).click();await beat(k,'L3.5');await k.getByRole('button',{name:'Continue',exact:true}).click();
 await beat(k,'T.3');await k.waitForTimeout(1500);await k.screenshot({path:resolve(out,'pull-1.png')});
 await k.waitForTimeout(700);await k.screenshot({path:resolve(out,'pull-2.png')});
 await beat(k,'T.4');await k.waitForTimeout(150);await k.screenshot({path:resolve(out,'pull-3.png')});
 await beat(k,'T.9');await k.screenshot({path:resolve(out,'pull-4-room.png')});
 await beat(k,'R.1');await k.waitForTimeout(300);await k.screenshot({path:resolve(out,'room-desk-food.png')});await k.close();
 const e=await browser.newPage({viewport:{width:1280,height:720}});await e.goto(base+'?scene=campaign&chapter=12');await e.waitForFunction(()=>window.__choice);
 await e.getByRole('button',{name:'okay that was clean',exact:true}).click();
 for(let i=0;i<40;i++){if(await e.evaluate(()=>window.__beat==='E.9'))break;const c=e.getByRole('button',{name:'Continue',exact:true});if(await c.count())await c.click();await e.waitForTimeout(500);}
 await e.waitForFunction(()=>document.querySelector('.survey'),{},{timeout:30000});await e.waitForTimeout(300);await e.screenshot({path:resolve(out,'survey.png')});
 await e.getByRole('button',{name:'angry',exact:true}).click();await e.getByRole('button',{name:'maybe',exact:true}).click();await e.locator('.survey-note').fill('test note');await e.getByRole('button',{name:'Send',exact:true}).click();
 await e.waitForTimeout(300);await e.screenshot({path:resolve(out,'survey-sent.png')});
 const saved=await e.evaluate(()=>({local:localStorage.getItem('gg-ez-survey'),done:window.__done}));console.log(JSON.stringify(saved).slice(0,400));
 await e.getByRole('button',{name:'Done',exact:true}).click();await e.waitForTimeout(200);console.log('play again buttons:',await e.getByRole('button',{name:'Play again',exact:true}).count());await e.close();
 console.log('look done');
}finally{await browser.close();server.close();}
