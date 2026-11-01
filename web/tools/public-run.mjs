import {chromium} from 'playwright';
const browser=await chromium.launch({executablePath:process.env.PREVIEW_BROWSER,headless:true,args:['--mute-audio']});
try{const p=await browser.newPage({viewport:{width:1280,height:900}});
 const statuses=[];p.on('response',r=>{if(/itch\.zone\/html\//.test(r.url()))statuses.push(r.status()+' '+r.url().slice(0,90));});
 await p.goto('https://carlcrafterz.itch.io/gg-ez',{waitUntil:'domcontentloaded'});
 const run=p.getByRole('button',{name:/Run game/i});if(await run.count()){await run.first().click();}else console.log('no Run button; iframe may autostart');
 await p.waitForTimeout(12000);
 const frames=p.frames().map(f=>f.url()).filter(u=>/itch\.zone/.test(u));console.log('frames',frames);
 const gameFrame=p.frames().find(f=>/itch\.zone\/html\//.test(f.url()));
 if(gameFrame){const ok=await gameFrame.getByRole('button',{name:'Start game',exact:true}).count().catch(()=>0);console.log('Start game button in frame:',ok);console.log('frame title:',await gameFrame.title().catch(()=>'?'));console.log('frame text head:',(await gameFrame.evaluate(()=>document.body.innerText.slice(0,200)).catch(()=>'?')));}
 console.log(statuses.slice(0,8));
 await p.screenshot({path:'verification/public-page-run.png'});
}finally{await browser.close();}
