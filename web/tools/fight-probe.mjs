// Balance probe: run the fair final fight N times with cast and block held, print each outcome.
import {chromium} from 'playwright';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('dist');const runs=Number(process.argv[2]??4);
const server=createServer(async(req,res)=>{try{const file=resolve(root,new URL(req.url,'http://localhost').pathname.slice(1)||'index.html');if(!file.startsWith(root+sep))throw Error('escape');res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.mp3':'audio/mpeg','.png':'image/png'})[extname(file)]??'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch({...(process.env.PREVIEW_BROWSER?{executablePath:process.env.PREVIEW_BROWSER}:{}),headless:true,args:['--mute-audio']});
try{
 const results=await Promise.all(Array.from({length:runs},async(_,i)=>{
  const p=await browser.newPage({viewport:{width:1280,height:720}});await p.goto(`${base}?scene=campaign&chapter=11`);await p.waitForFunction(()=>window.__beat==='F.1',{},{timeout:60000});
  await p.keyboard.down('KeyK');await p.keyboard.down('KeyL');await p.waitForFunction(()=>window.__combat,{},{timeout:60000});
  const r=await p.evaluate(()=>window.__combat);await p.close();return {run:i+1,...r,elapsed:Math.round(r.elapsed*10)/10};
 }));
 for(const r of results)console.log(JSON.stringify(r));
}finally{await browser.close();server.close();}
