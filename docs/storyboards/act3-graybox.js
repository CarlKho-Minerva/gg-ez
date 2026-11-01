// GG EZ Act III grayboxes: static editable keyframes, not runtime. Inject GROUP, STORY, ASSETS before execution.
// Arena cards clone Dain's PNG sprites from the page assets below Scene 1 instead of redrawing them.
const page=await figma.getNodeByIdAsync('0:1');
if(!page||page.type!=='PAGE')throw Error('Missing page, no mutation');
await figma.setCurrentPageAsync(page);
const boardNames={m2:"GG EZ / Second match / knowing doesn't help",v2:'GG EZ / Second arrival / work mode',c1:'GG EZ / The call / thank you for your patience'};
if(!boardNames[GROUP])throw Error('Unknown group');
if(page.children.some(n=>n.name===boardNames[GROUP]))throw Error('Duplicate board; read existing, never replay builder');
const available=await figma.listAvailableFontsAsync();
for(const f of [{family:'Inter',style:'Regular'},{family:'Inter',style:'Bold'},{family:'Noto Color Emoji',style:'Regular'}]){
 if(!available.some(a=>a.fontName.family===f.family&&a.fontName.style===f.style))throw Error('Missing font '+JSON.stringify(f));
 await figma.loadFontAsync(f);
}
const A={};
for(const [key,spec] of Object.entries(ASSETS)){const n=await figma.getNodeByIdAsync(spec.id);if(!n||n.type!=='RECTANGLE')throw Error('Asset missing '+key);const f=n.fills;if(!Array.isArray(f)||f.length!==1||f[0].type!=='IMAGE'||f[0].imageHash!==spec.hash)throw Error('Asset changed '+key+'; no mutation');if(n.width!==spec.w||n.height!==spec.h)throw Error('Asset size changed '+key);A[key]=n;}
const before=page.children.map(n=>({id:n.id,x:n.x,y:n.y,width:n.width,height:n.height}));
const created=[],shots=[],sprites=[];
const paint=h=>[{type:'SOLID',color:{r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255}}];
function put(n,p,name,w,h){p.appendChild(n);n.name=name;n.resize(w,h);created.push(n.id);return n;}
function frame(p,name,x,y,w,h,c='#EDEDED',clip=false){const n=put(figma.createFrame(),p,name,w,h);n.x=x;n.y=y;n.fills=c?paint(c):[];n.clipsContent=clip;return n;}
function rect(p,name,x,y,w,h,c='#777777',o=1){const n=put(figma.createRectangle(),p,name,w,h);n.x=x;n.y=y;n.fills=paint(c);if(o!==1)n.opacity=o;return n;}
function ellipse(p,name,x,y,w,h,c,o=1){const n=put(figma.createEllipse(),p,name,w,h);n.x=x;n.y=y;n.fills=paint(c);if(o!==1)n.opacity=o;return n;}
function path(p,name,data,c,o=1){const n=figma.createVector();p.appendChild(n);created.push(n.id);n.name=name;n.vectorPaths=[{windingRule:'NONZERO',data}];n.fills=paint(c);n.strokes=[];if(o!==1)n.opacity=o;return n;}
function text(p,s,x,y,w,size=18,bold=false,c='#252525',align='LEFT'){const n=figma.createText();n.fontName={family:'Inter',style:bold?'Bold':'Regular'};p.appendChild(n);created.push(n.id);n.name=s.slice(0,60);n.resize(w,24);n.fontSize=size;n.lineHeight={unit:'PERCENT',value:125};n.characters=s;n.textAutoResize='HEIGHT';n.textAlignHorizontal=align;n.fills=paint(c);n.x=x;n.y=y;for(const m of s.matchAll(/\p{Extended_Pictographic}/gu))n.setRangeFontName(m.index,m.index+m[0].length,{family:'Noto Color Emoji',style:'Regular'});return n;}
function stack(p,name,w,gap=10,pad=16,c='#FFFFFF'){const n=put(figma.createFrame(),p,name,w,1);n.layoutMode='VERTICAL';n.primaryAxisSizingMode='AUTO';n.counterAxisSizingMode='FIXED';n.itemSpacing=gap;n.paddingTop=n.paddingBottom=n.paddingLeft=n.paddingRight=pad;n.fills=c?paint(c):[];n.clipsContent=false;return n;}
function sprite(p,key,name,x,y,scale=1,o={}){const n=A[key].clone();p.appendChild(n);created.push(n.id);n.name=name;n.resize(A[key].width*scale,A[key].height*scale);n.x=x;n.y=y;if(o.rotation)n.rotation=o.rotation;if(o.opacity!==undefined)n.opacity=o.opacity;sprites.push({id:n.id,asset:key,name});return n;}
// ---------- arena, built from Dain's PNG sprites ----------
const K=360/224,FLOOR=315;
function arena(s,pose,d){
 s.fills=paint('#111226');
 sprite(s,'bg','arena background / Dain game-bg',(652-512*K)/2,0,K);
 rect(s,'HUD band',0,0,652,44,'#111226',0.85);
 text(s,'LIA / WIZARD',22,8,220,15,true,'#F5F6FF');text(s,'YOU / WOLF',490,8,140,15,true,'#F5F6FF','RIGHT');
 rect(s,'left health',22,30,180,6,'#DDDDDD');rect(s,'right health',450,30,180,6,'#BBBBBB');
 sprite(s,'lia','Lia wizard / Dain Leah-game',150,FLOOR-43*K,K);
 let wx=460,wy=FLOOR-37*K,rot=0;
 if(pose==='hit'){sprite(s,'spell','cyan spell / Dain leah-effect',200,FLOOR-73*K+6,K);wx=500;rot=8;}
 if(pose==='block'){sprite(s,'spell','cyan spell already past / Dain leah-effect',330,FLOOR-73*K+6,K);rect(s,'late guard slab',440,FLOOR-62,14,62,'#DDDDDD',0.9);}
 if(pose==='ko'){wx=560;wy=120;rot=-20;path(s,'launch trail','M 470 250 L 575 150 L 500 232 Z','#FFFFFF',0.7);}
 const w=sprite(s,'wolf','You / Dain ghost-game wolf / '+pose,wx,wy,K,{rotation:rot});
 if(d.overlay){const big=d.overlay==='DEFEAT';text(s,d.overlay,0,big?140:60,652,big?40:22,true,'#F5F6FF','CENTER');}
 if(d.chat&&d.view==='arena'){rect(s,'mid-match chat',400,52,236,30,'#0F1020',0.9);text(s,d.chat,410,58,220,14,true,'#F5F6FF');}
 return w;
}
function narration(s,d){arena(s,'idle',{});rect(s,'inner voice box',40,300,572,46,'#111226',0.88);text(s,'“'+d.narration+'”',56,311,540,18,false,'#F5F6FF');}
function chat(s,d){
 arena(s,'ko',{});text(s,'DEFEAT',0,50,652,20,true,'#F5F6FF','CENTER');
 rect(s,'MATCH CHAT panel',96,84,460,236,'#0F1020',0.96);
 text(s,'MATCH CHAT',112,94,200,14,true,'#F5F6FF');text(s,d.id==='M2.7C'?'00:00':'00:03',480,94,60,14,true,'#F5F6FF','RIGHT');
 let y=124;for(const line of d.chat.split('\n')){text(s,line,112,y,420,18,line.startsWith('lia_ph'),'#F5F6FF');y+=28;}
 if(d.id==='M2.6'){rect(s,'reply button A',112,236,200,44,'#2A2C44');text(s,'okay that was clean',112,248,200,16,true,'#F5F6FF','CENTER');rect(s,'reply button B',336,236,200,44,'#2A2C44');text(s,'fuck off',336,248,200,16,true,'#F5F6FF','CENTER');text(s,'same two buttons as Scene 2 and the ending',112,290,420,11,false,'#9AA0C8');}
 if(d.id==='M2.7C'){rect(s,'reply box closed',112,236,424,44,'#2A2C44',0.4);text(s,'(reply box closed)',112,248,424,16,false,'#9AA0C8','CENTER');}
}
function fold(s,d){
 s.fills=paint('#111226');
 const win=frame(s,'folding arena window / center slice',226,0,200,360,null,true);sprite(win,'bg','arena background slice / Dain game-bg',(200-512*K)/2,0,K);
 path(s,'crease left','M 226 0 L 206 180 L 226 360 L 232 180 Z','#F5F6FF',0.5);path(s,'crease right','M 426 0 L 446 180 L 426 360 L 420 180 Z','#F5F6FF',0.5);
 rect(s,'line of light',324,0,4,360,'#F5F6FF');
 text(s,d.overlay,0,40,652,20,true,'#F5F6FF','CENTER');
}
// ---------- room, vector graybox; ghost = Dain wolf PNG placeholder ----------
function lia(p,pose,x,y,scale,work){
 const f=frame(p,'Lia HOME placeholder / '+pose,0,0,120,145,null,false);
 ellipse(f,'hair placeholder',18,0,43,51,'#555555');ellipse(f,'head placeholder',38,13,28,30,'#B4B4B4');
 path(f,'oversized T-shirt','M 24 46 L 57 43 L 82 67 L 66 76 L 64 103 L 15 103 L 12 64 Z','#C8C8C8');
 rect(f,'seated leg',32,102,54,13,'#999999');rect(f,'shin',73,109,13,26,'#999999');rect(f,'slipper ON',68,132,29,10,'#777777');
 const Y={upright:80,straighten:100,typing:86,listen:84,face:80,gesture:50,leanback:72}[pose]||80;
 if(pose==='forehead')path(f,'forearm to forehead','M 56 61 L 66 57 L 64 30 L 52 24 L 46 30 L 56 52 Z','#999999');
 else path(f,'right forearm / '+pose,'M 56 61 L 66 57 L 89 '+Y+' L 105 '+Y+' L 105 '+(Y+8)+' L 83 '+(Y+8)+' Z','#999999');
 rect(f,'other hand',25,72,12,24,'#999999');
 if(pose==='typing')path(f,'left forearm to keys','M 24 66 L 14 70 L 40 96 L 56 96 L 56 90 L 36 88 Z','#999999');
 if(pose==='straighten')path(f,'left hand tugging hem','M 22 70 L 12 74 L 16 104 L 28 104 Z','#999999');
 rect(f,pose==='face'?'eyes crossed':'eye',58,20,4,5,'#444444');
 if(pose==='face')rect(f,'tongue out',62,36,6,5,'#CFB2B8');
 if(work){path(f,'work headset band','M 36 12 Q 52 -4 68 12 L 64 14 Q 52 2 40 14 Z','#333333');rect(f,'headset pad',32,16,8,14,'#333333');rect(f,'headset pad right',62,16,8,14,'#333333');rect(f,'mic boom',62,32,16,3,'#333333');}
 f.rescale(scale);f.x=x;f.y=y;return f;
}
function ghost(p,x,y,scale,o){
 const w=32*scale,h=28*scale;
 const f=frame(p,'ghost placeholder / Dain wolf PNG, legs cropped, ghost form pending',x,y,w,h,null,true);
 const sp=sprite(f,'wolf','wolf sprite / Dain ghost-game',0,0,scale,{opacity:o});
 sp.relativeTransform=[[-1,0,w],[0,1,0]];
 ellipse(p,'translucent tail',x+w*0.15,y+h-2,w*0.7,10,'#B9B9B9',0.45);
 return f;
}
function room(s,d){
 const R=frame(s,'ROOM / same geometry as first visit',0,0,652,360,'#EDEDED',false);
 rect(R,'floor',0,310,652,50,'#C3C3C3');rect(R,'bed',20,249,149,51,'#B1B1B1');rect(R,'window',34,65,124,102,'#D4D4D4');rect(R,'window crossbar',92,65,6,102,'#999999');rect(R,'towel drying',188,90,28,73,'#BCBCBC');
 rect(R,'kitchenette',15,195,135,35,'#B4B4B4');ellipse(R,'rice cooker',62,162,53,32,'#BDBDBD');
 ellipse(R,'fan cage',222,171,63,63,'#CFCFCF');path(R,'fan blades','M 254 180 L 241 210 L 255 203 L 276 218 L 261 201 Z','#9D9D9D');rect(R,'fan stand',251,234,7,64,'#999999');
 rect(R,'desk',334,246,293,13,'#8C8C8C');rect(R,'desk leg',611,259,9,53,'#8C8C8C');
 const work=d.mode==='work',cx=work?18:0;
 rect(R,'plastic chair back'+(cx?' / 18 px closer':''),374+cx,207,13,86,'#AAAAAA');rect(R,'plastic chair seat',383+cx,285,80,10,'#AAAAAA');rect(R,'chair leg',383+cx,295,9,20,'#AAAAAA');
 if(!work)rect(R,'spare slipper UNDER desk',465,307,25,8,'#777777');
 lia(R,d.pose||'upright',386+cx,work?164:170,0.95,work);
 const mon=frame(R,'monitor aperture',510,146,114,82,'#777777',true);rect(mon,work?'work app, game minimized':'desktop screen',5,5,104,66,'#CCCCCC');
 text(mon,d.monitor||(work?'WORK APP\nAFTER BREAK':'GAME'),9,9,96,8,true,'#222222');
 rect(R,'monitor stand',559,228,12,18,'#777777');rect(R,'mouse',486,239,14,6,'#555555');rect(R,'keyboard',430,238,52,6,'#666666');
 rect(R,'hanging badge strap',328,112,3,24,'#888888');rect(R,'badge',314,134,28,36,'#FFFFFF');text(R,'ID',319,143,20,10,true);
 if(work)rect(R,'headset hook, empty',372,137,4,10,'#888888');else path(R,'headset on hook','M 350 139 Q 350 113 376 115 Q 399 113 399 139 L 391 139 Q 391 125 376 124 Q 359 124 358 139 Z','#777777');
 rect(R,'schedule note',316,176,69,54,'#F7F7F7');text(R,'9 PM–6 AM\nBREAK 2:00–2:30\nQA COACHING\nTHURSDAY',320,179,62,8,true);
 rect(R,'phone face up / dim',484,226,23,10,'#999999');rect(R,'food container',449,232,31,14,'#F8F8F8');rect(R,'cold rice',452,235,11,8,'#DDDDDD');rect(R,'leftover adobo',465,235,11,8,'#77715E');
 if(!d.noGhost)ghost(R,268,196,1.35,0.55);
 return R;
}
function fall(s,d){
 s.fills=paint('#2B2D44');
 const R=room(s,{mode:'work',pose:'upright',monitor:' ',noGhost:true});R.opacity=0.5;
 rect(s,'monitor glow',515,151,104,66,'#F5F6FF',0.55);
 const pts=[[548,186],[522,172],[486,176],[448,198],[408,224],[370,236],[336,232]];
 for(const [x,y] of pts)ellipse(s,'drift path dot',x,y,6,6,'#F5F6FF',0.8);
 const g=ghost(s,318,196,1.35,0.6);g.rotation=25;
 rect(s,'caption band',0,0,652,40,'#111226',0.85);text(s,d.overlay,0,10,652,18,true,'#F5F6FF','CENTER');
}
function balloon(s,line,x,y,w,px){const b=stack(s,'Speech / Lia',w,0,12);b.x=x;b.y=y;text(b,line,0,0,w-24,20,true);const ptr=path(s,'speaker pointer ABOVE Lia','M 0 0 L 15 0 L 20 24 Z','#FFFFFF');ptr.x=x+px;ptr.y=y+b.height;return b;}
function customer(s,line,x,y,w){const b=stack(s,'Customer / heard through headset',w,4,10,'#0F1020');b.x=x;b.y=y;text(b,'CUSTOMER (headset)',0,0,w-20,10,true,'#9AA0C8');text(b,'“'+line+'”',0,0,w-20,14,false,'#F5F6FF');const m=path(s,'speaker mark','M 0 8 L 8 8 L 16 0 L 16 24 L 8 16 L 0 16 Z','#F5F6FF');m.x=x-22;m.y=y+10;return b;}
function portrait(s,label){const f=frame(s,'portrait / '+label,12,12,66,66,'#F7F7F7',true);ellipse(f,'face',18,10,30,32,'#B4B4B4');rect(f,'eye',27,20,3,4,'#444444');rect(f,'eye',36,20,3,4,'#444444');path(f,'polite smile','M 27 33 Q 33 38 39 33 L 39 35 Q 33 41 27 35 Z','#444444');text(f,label,4,50,60,8,true,'#333333');return f;}
function hands(s,d){
 rect(s,'desk surface',0,200,652,160,'#8C8C8C');rect(s,'keyboard',176,218,300,52,'#555555');
 for(let r=0;r<3;r++)for(let c=0;c<12;c++)rect(s,'key',184+c*24,224+r*15,18,10,'#777777');
 ellipse(s,'left hand, stopped',200,140,120,70,'#B4B4B4');ellipse(s,'right hand, stopped',340,140,120,70,'#B4B4B4');
 for(let i=0;i<4;i++){rect(s,'curled finger',226+i*22,196,14,18,'#A0A0A0');rect(s,'curled finger',366+i*22,196,14,18,'#A0A0A0');}
 text(s,'HANDS STOP 0.5 s ABOVE THE KEYS',20,20,300,14,true,'#333333');
}
function eyes(s,d){
 s.fills=paint('#D9D9D9');ellipse(s,'head close-up',146,-40,360,440,'#B4B4B4');ellipse(s,'hair',120,-80,300,220,'#555555');
 for(const x of [230,370]){ellipse(s,'eye white',x,160,70,34,'#F5F5F5');ellipse(s,'pupil',x+26,166,20,22,'#333333');rect(s,'lid half lowered',x,152,70,20,'#B4B4B4');path(s,'tired line','M '+x+' 200 Q '+(x+35)+' 212 '+(x+70)+' 200 L '+(x+70)+' 203 Q '+(x+35)+' 216 '+x+' 203 Z','#8F8F8F');}
 rect(s,'headset pad at frame edge',120,120,36,90,'#333333');
 text(s,'CLOSE-UP / tired eyes, no tears, no music',16,16,400,14,true,'#333333');
}
function monitorView(s,d,pose){
 rect(s,'desk',0,330,652,30,'#8C8C8C');lia(s,pose,-20,60,1.9,true);
 const mon=frame(s,'monitor close',150,24,470,300,'#777777',true);rect(mon,'screen',10,10,450,280,'#E6E6E6');
 let y=28;(d.monitor||'').split('\n').forEach((ln,i)=>{if(/NEEDS IMPROVEMENT|Confirm the customer/.test(ln))rect(mon,'highlight',22,y-6,420,30,'#FFD46E',0.9);text(mon,ln,30,y,410,i===0?14:16,i>0,'#222222');y+=i===0?30:38;});
 rect(s,'monitor stand',370,324,16,10,'#777777');
}
function render(s,d){
 if(d.view==='arena')arena(s,d.pose,d);
 else if(d.view==='narration')narration(s,d);
 else if(d.view==='chat')chat(s,d);
 else if(d.view==='fold')fold(s,d);
 else if(d.view==='fall')fall(s,d);
 else if(d.view==='room'){room(s,d);if(d.overlay)text(s,d.overlay,20,18,600,18,true);}
 else if(d.view==='medium'){const R=room(s,d);R.rescale(1.7);R.x=326-470*1.7;R.y=180-215*1.7;if(d.id==='V2.5')portrait(s,'polite neutral');if(d.speech)balloon(s,d.speech,120,16,330,130);}
 else if(d.view==='close'){const R=room(s,d);R.rescale(2.2);R.x=326-470*2.2;R.y=180-200*2.2;portrait(s,'polite');if(d.customer)customer(s,d.customer,448,70,196);if(d.speech)balloon(s,d.speech,90,20,330,110);}
 else if(d.view==='hands'){hands(s,d);if(d.customer)customer(s,d.customer,330,40,300);}
 else if(d.view==='eyes')eyes(s,d);
 else if(d.view==='qa'||d.view==='doc'){monitorView(s,d,d.view==='doc'?'forehead':'listen');if(d.speech)balloon(s,d.speech,10,8,250,60);}
 else throw Error('Unknown view '+d.view);
}
// ---------- board ----------
const board=frame(page,boardNames[GROUP],Math.max(0,...before.map(n=>n.x+n.width))+352,2240,2944,1,'#E2E2E2');
text(board,boardNames[GROUP].replace('GG EZ / ','').toUpperCase(),40,32,2860,32,true);
text(board,'SIMPLE GRAYBOX / static keyframes, editable layers. All timings are draft values. Dain owns finished art.',40,84,2850,22);
text(board,{m2:'Scene 6 of the recovered v0.3 storyboard. Same arena, same chat buttons as Scene 2; one inner line varies by what the player observed.',v2:'Scene 7. Second ghost arrival: the same room framing, but Lia is in work mode. Ends on her professional voice.',c1:'Scene 8, the scene to protect. One customer call, staged the SANABI way: wide, close on hands and eyes, back wide. Exact v0.3 English dialogue; Cebuano drafts where the source had Tagalog.'}[GROUP],40,121,2850,20);
text(board,'ASSETS / Arena cards clone Dain\'s PNG sprites from the page assets below Scene 1 (game-bg, Leah-game, ghost-game, leah-effect, ghost-effect). Room cards use the wolf PNG, legs cropped, as the ghost placeholder until the ghost form lands; Lia at home stays a gray placeholder until her at-home form lands.',40,152,2850,18,false,'#444444');
const cards=STORY;const perColumn=Math.ceil(cards.length/4);
for(let ci=0;ci<4;ci++){
 const col=stack(board,'Column '+(ci+1),692,20,0,null);col.x=40+ci*724;col.y=220;
 for(const d of cards.slice(ci*perColumn,(ci+1)*perColumn)){
  const card=stack(col,d.id+' / '+d.title,692,10,20);text(card,d.id+' / '+d.title,0,0,652,23,true);
  const s=frame(card,d.id+' / SCREEN',0,0,652,360,'#EDEDED',true);render(s,d);
  const lines=[];
  if(d.speech)lines.push('LIA / “'+d.speech+'”');if(d.customer)lines.push('CUSTOMER (headset) / “'+d.customer+'”');if(d.chat)lines.push('CHAT / '+d.chat.replace(/\n/g,'  ·  '));if(d.narration)lines.push('INNER VOICE / “'+d.narration+'”');if(d.monitor)lines.push('ON SCREEN / '+d.monitor.replace(/\n/g,'  ·  '));
  lines.push('ACTION / '+d.action,'CAMERA / '+d.camera,'SOUND / '+d.sound,'DRAFT TIME / '+d.duration,'CONTROL / '+d.control);
  if(d.alts)for(const a of d.alts)lines.push('ALTERNATIVE / '+a);
  if(d.note)lines.push('SOURCE NOTE / '+d.note);
  for(const line of lines)text(card,line,0,0,652,17,false,line.startsWith('SOURCE')?'#666666':'#333333');
  shots.push({number:d.id,cardId:card.id,screenId:s.id});
 }
}
board.resize(2944,Math.max(...board.children.map(n=>n.y+n.height))+40);
const all=board.findAll(()=>true),counts={};for(const n of all)counts[n.type]=(counts[n.type]||0)+1;
const preserved=before.every(b=>{const n=page.children.find(n=>n.id===b.id);return n&&['x','y','width','height'].every(k=>n[k]===b[k]);});
if(!preserved)throw Error('Existing bounds changed; read canvas');
return {group:GROUP,boardId:board.id,name:board.name,shots,sprites,counts,createdNodeIds:[...new Set([...created,...all.map(n=>n.id)])],bounds:{x:board.x,y:board.y,width:board.width,height:board.height},before,preserved};
