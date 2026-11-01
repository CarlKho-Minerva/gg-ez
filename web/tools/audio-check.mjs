import {chromium} from 'playwright';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {writeFile} from 'node:fs/promises';
const browser=await chromium.launch({executablePath:process.env.PREVIEW_BROWSER,headless:true});
try{const page=await browser.newPage();await page.goto(pathToFileURL(resolve('release/GG-EZ-PLAY.html')).href);await page.waitForFunction(()=>window.__beat==='menu');
const report=await page.evaluate(async()=>{const ctx=new AudioContext();const rows=[];for(const [path,url] of Object.entries(window.__embeddedAssets)){if(!path.endsWith('.mp3'))continue;const b=await ctx.decodeAudioData(await(await fetch(url)).arrayBuffer());rows.push({path,seconds:b.duration,channels:b.numberOfChannels});}await ctx.close();return rows;});
await writeFile('verification/audio.json',JSON.stringify({passed:true,clips:report.length,files:report},null,2));console.log(JSON.stringify({passed:true,clips:report.length,seconds:report.reduce((a,b)=>a+b.seconds,0)}));}finally{await browser.close();}
