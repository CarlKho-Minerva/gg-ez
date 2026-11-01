// GG EZ Scene 1. Native Figma shapes, ten approved beats. No destructive edits.
const page = await figma.getNodeByIdAsync('0:1');
if(!page || page.type!=='PAGE') throw new Error('Expected existing Draft page 0:1; no edits made.');
await figma.setCurrentPageAsync(page);
const boardName='GG EZ / Scene 1 / ten screen beats';
if(page.children.some(n=>n.name===boardName)) throw new Error('Board already exists. Inspect it before retrying; no duplicates created.');
await Promise.all(['Regular','Bold','Black'].map(style=>figma.loadFontAsync({family:'Inter',style})));
const ids=[];
const C={paper:'#F4F2EB',ink:'#141625',muted:'#565B70',night:'#111226',far:'#242744',mid:'#34375C',front:'#090D1A',cyan:'#65F8D1',pink:'#FF729B',gold:'#FFD46E',white:'#F5F6FF',dim:'#8991B9',purple:'#6954AA'};
function paint(hex){return [{type:'SOLID',color:{r:parseInt(hex.slice(1,3),16)/255,g:parseInt(hex.slice(3,5),16)/255,b:parseInt(hex.slice(5,7),16)/255}}];}
function place(n,p,name,x,y,w,h){ids.push(n.id);n.name=name;p.appendChild(n);n.x=x;n.y=y;n.resize(w,h);return n;}
function rect(p,name,x,y,w,h,c){const n=place(figma.createRectangle(),p,name,x,y,w,h);n.fills=paint(c);return n;}
function ellipse(p,name,x,y,w,h,c){const n=place(figma.createEllipse(),p,name,x,y,w,h);n.fills=paint(c);return n;}
function text(p,s,x,y,w,size=18,c=C.ink,style='Regular'){const n=figma.createText();ids.push(n.id);n.fontName={family:'Inter',style};p.appendChild(n);n.name=s;n.textAutoResize='HEIGHT';n.resize(w,30);n.fontSize=size;n.lineHeight={unit:'PERCENT',value:130};n.characters=s;n.fills=paint(c);n.x=x;n.y=y;return n;}
function frame(p,name,x,y,w,h,c){const n=place(figma.createFrame(),p,name,x,y,w,h);n.fills=paint(c);n.clipsContent=true;return n;}
const maxX=Math.max(0,...page.children.map(n=>n.x+n.width));
const board=frame(page,boardName,maxX+352,2240,2928,2830,C.paper);
text(board,'GG EZ',48,35,900,64,C.ink,'Black');
text(board,'SCENE 1 / THE MATCH BEFORE THE PERSON',50,125,2400,28,C.ink,'Bold');
text(board,'Read down each column, then move right. Ten distinct screens. Native editable shapes. Staging draft, not final game art.',50,175,2700,22,C.muted);
text(board,'Story direction preserved: Lapu-Lapu City, Cebuano / Bisaya with English translations. No later-scene changes in this board.',50,215,2700,20,C.muted);
// Reusable silhouettes are components; each screen uses instances.
const kit=frame(page,'GG EZ / Scene 1 / native silhouette kit',maxX+352,5240,600,230,C.paper);
text(kit,'Reusable fighters / edit these to update every shot',20,15,550,18,C.ink,'Bold');
function fighter(name,c,x,flip){
 const n=place(figma.createComponent(),kit,name,x,60,80,120);n.fills=[];n.description='Simple side-view fighter silhouette for Scene 1 blocking; editable head, torso, arms and legs.';
 ellipse(n,'head',26,4,26,26,C.white);rect(n,'hair',23,1,29,10,C.front);
 rect(n,'torso',22,33,34,43,c);rect(n,'belt',22,69,34,7,C.front);
 rect(n,'rear leg',23,76,12,31,C.white);rect(n,'front leg',44,76,12,31,C.white);
 rect(n,'rear boot',17,105,22,10,C.front);rect(n,'front boot',43,105,23,10,C.front);
 rect(n,'guard arm',flip?6:52,40,22,12,c);rect(n,'raised fist',flip?4:64,29,12,23,C.white);
 rect(n,'back elbow',flip?54:12,48,13,25,c);return n;
}
const you=fighter('Fighter / you / cyan',C.cyan,30,false),her=fighter('Fighter / opponent / coral',C.pink,150,true);
function person(p,comp,x,y,s=0.65){const n=comp.createInstance();ids.push(n.id);p.appendChild(n);n.name=comp===you?'You / silhouette':'Opponent / silhouette';n.rescale(s);n.x=x;n.y=y;return n;}
function city(p){
 rect(p,'sky',0,0,640,360,C.night);rect(p,'distant haze',0,90,640,185,C.far);
 const buildings=[[0,92,72],[82,145,66],[158,68,96],[265,113,80],[358,54,88],[458,129,74],[542,83,98]];
 buildings.forEach(([x,y,w],i)=>{rect(p,'far tower '+i,x,y,w,300-y,C.mid);for(let k=0;k<3;k++)rect(p,'window '+i+'-'+k,x+10,y+16+k*29,w-22,3,k===1?C.purple:C.dim);});
 rect(p,'neon sign left',20,169,66,10,C.pink);rect(p,'neon sign right',498,142,90,8,C.cyan);
 rect(p,'roof deck',0,290,640,70,C.front);rect(p,'roof edge',0,286,640,4,C.cyan);
 rect(p,'left foreground lip',0,320,95,40,C.night);rect(p,'right foreground lip',548,313,92,47,C.night);
}
const beats=[
 ['1.01','Title / idle','Hold one wide side view. Two small fighters spar behind the menu.','Loop: bright arcade music; light combat ticks.','S02: tiny figures against a deep, lit city.'],
 ['1.02','Start / selected','Keep the camera fixed. A cyan outline marks START GAME.','One soft selection tick; fight loop continues.','S02: preserve the same silhouette scale.'],
 ['1.03','Start / pressed','The button drops 4 px and flashes. Background sparring continues.','One sharp confirm; music carries into the snap.','Same frame: only the press response changes.'],
 ['1.04','Snap / first displacement','The title and menu move left together. First displaced position.','Short sideways whoosh begins; no camera zoom.','S03: action reads cleanly along the horizontal axis.'],
 ['1.05','Snap / halfway','Trail the departing letters. Offset cyan/coral echoes; next panel enters.','Whoosh peaks; arcade music stays continuous.','S03: directional movement with readable negative space.'],
 ['1.06','Connecting','Movement settles. CONNECTING… and a small cycling loader.','Loading pulse; music continues quietly underneath.','S05: isolated cyan screen light against darkness.'],
 ['1.07','Opponent / reveal','OPPONENT FOUND: lia_ph appears. Hold it as its own beat.','One notification ping; no personal information yet.','S05: username is the single new point of attention.'],
 ['1.08','Region / reveal','REGION: PH appears below. Keep the username visible.','A small interface tick. Still ordinary matchmaking.','S05: add information without changing the framing.'],
 ['1.09','Ping / warning','PING: 248ms appears with an amber connection indicator.','Brief warning chirp. Establish delay before the fight.','S05: use amber only for the new warning.'],
 ['1.10','Arena / ready','Loading clears. Read both fighters and the platform before control begins.','Loading tone ends; arena ambience comes forward.','S01 + S02: small figures, open space, clean ground line.']
];
const columns=[{name:'A / MENU',sub:'Wait → select → confirm',indices:[0,1,2],ref:'S02 · dense city / tiny character',node:'5:4'}, {name:'B / SNAP',sub:'First move → halfway',indices:[3,4],ref:'S03 · horizontal movement',node:'5:6'}, {name:'C / MATCHMAKING',sub:'Connect → name → region → ping',indices:[5,6,7,8],ref:'S05 · isolated screen light',node:'5:5'}, {name:'D / ARENA',sub:'Establish the play space',indices:[9],ref:'S01 + S02 · two-character scale',node:'5:3'}];
const shots=[],colIds=[];
columns.forEach((col,ci)=>{
 const x=48+ci*712;
 const column=frame(board,col.name,x,280,696,2480,C.paper);colIds.push(column.id);
 text(column,col.name,0,0,670,27,C.ink,'Black');text(column,col.sub,0,42,670,20,C.muted);
 text(column,'SANABI / '+col.ref,0,81,670,17,C.muted);
 const link=text(column,'Reference on existing desk ↗',0,110,670,16,C.muted);link.hyperlink={type:'URL',value:'https://www.figma.com/design/9n83sdzD1t2Fm3asaMi1Hs/GG-EZ?node-id='+col.node.replace(':','-')};
 col.indices.forEach((idx,row)=>{
  const [num,title,action,sound,ref]=beats[idx];
  const card=frame(column,num+' / '+title,0,164+row*570,680,550,'#FFFFFF');
  text(card,num,18,12,80,24,C.ink,'Black');text(card,title,103,15,555,21,C.ink,'Bold');
  const screen=frame(card,num+' / SCREEN',20,56,640,360,C.night);shots.push({number:num,cardId:card.id,screenId:screen.id});
  if(idx<5 || idx===9){city(screen);person(screen,you,165+(idx===1?8:0),208,.65);person(screen,her,416-(idx===2?8:0),208,.65);}
  if(idx<5){
   const offset=idx===3?-95:idx===4?-330:0;
   if(idx>=3){for(let j=0;j<4;j++)rect(screen,'horizontal motion trail '+j,Math.max(0,260+offset),100+j*19,200+j*28,4,j%2?C.pink:C.cyan);}
   if(idx===4){text(screen,'GG EZ',130+offset+25,46,450,78,C.pink,'Black');text(screen,'GG EZ',130+offset+12,50,450,78,C.cyan,'Black');}
   text(screen,'GG EZ',130+offset,35,500,78,C.white,'Black');
   text(screen,'READY FOR ANOTHER ROUND?',175+offset,127,420,14,C.white);
   const by=idx===2?156:152;
   const b=rect(screen,'START GAME button',204+offset,by,232,48,idx===2?C.white:C.front);
   if(idx===1){b.strokes=paint(C.cyan);b.strokeWeight=3;rect(screen,'selection cursor',185+offset,168,8,16,C.cyan);}
   text(screen,'START GAME',221+offset,by+10,220,22,idx===2?C.night:idx===1?C.cyan:C.white,'Bold');
   if(idx<3)text(screen,'OPTIONS · CREDITS',240,325,330,14,C.dim);
   if(idx===4){rect(screen,'incoming loading screen',472,0,168,360,C.front);rect(screen,'incoming cyan edge',472,0,4,360,C.cyan);text(screen,'CONNECTING…',500,150,300,25,C.cyan,'Bold');}
  }
  if(idx>=5 && idx<=8){
   rect(screen,'isolated interface',62,57,516,247,C.front);
   rect(screen,'cyan top edge',62,57,516,3,C.cyan);
   text(screen,'MATCHMAKING',89,79,460,14,C.dim,'Bold');
   text(screen,idx===5?'CONNECTING…':'CONNECTED',89,111,466,30,C.cyan,'Bold');
   if(idx===5){for(let k=0;k<5;k++)rect(screen,'loader cell '+k,90+k*28,187,18,8,k<3?C.cyan:C.mid);text(screen,'Looking for an opponent',90,221,445,17,C.dim);}
   if(idx>=6)text(screen,'OPPONENT FOUND: lia_ph',89,162,466,23,C.white,'Bold');
   if(idx>=7)text(screen,'REGION: PH',89,204,466,20,C.white);
   if(idx>=8){text(screen,'PING: 248ms',89,245,370,23,C.gold,'Bold');for(let k=0;k<4;k++)rect(screen,'connection bar '+k,464+k*17,278-(k+1)*8,11,(k+1)*8,k<2?C.gold:C.mid);}
   text(screen,'ONLINE / 1 v 1',62,323,500,14,C.dim);
  }
  if(idx===9){
   rect(screen,'you health bar',24,22,198,9,C.cyan);rect(screen,'opponent health bar',418,22,198,9,C.pink);
   text(screen,'YOU',24,40,170,16,C.white,'Bold');text(screen,'lia_ph',491,40,126,16,C.white,'Bold');
   text(screen,'VS',286,43,90,23,C.white,'Black');text(screen,'248ms',520,77,100,14,C.gold);
   text(screen,'READY',229,130,220,39,C.white,'Black');
  }
  text(card,action,20,430,640,17,C.ink);
  text(card,'SOUND / '+sound,20,485,640,15,C.muted);
 });
 if(ci===3){
  text(column,'END OF SCENE 1',20,775,620,27,C.ink,'Black');
  text(column,'Stop before player control.\nThe next scene is the first fight.\n\nNo controller throw, crack, or monitor crossing belongs in these ten frames.',20,824,620,23,C.muted);
  text(column,'FRAMING RULE',20,1050,620,22,C.ink,'Bold');
  text(column,'One side-view camera. The menu moves, not the camera. Characters remain small enough that the world reads first.',20,1093,620,23,C.muted);
  text(column,'REFERENCE CREDIT',20,1290,620,22,C.ink,'Bold');
  text(column,'SANABI / WONDER POTION / NEOWIZ\nOfficial Steam screenshots on the existing reference desk. Composition study only; no SANABI images inside these screens.',20,1330,620,20,C.muted);
 }
});
const all=board.findAll(()=>true),counts={};for(const n of all)counts[n.type]=(counts[n.type]||0)+1;
const imageNodes=all.filter(n=>'fills' in n && Array.isArray(n.fills)&&n.fills.some(f=>f.type==='IMAGE')).map(n=>({id:n.id,name:n.name,type:n.type,width:n.width,height:n.height}));
const fonts=[...new Set(board.findAllWithCriteria({types:['TEXT']}).map(n=>n.fontName.family))];
if(imageNodes.length || fonts.some(f=>f!=='Inter') || shots.length!==10)throw new Error('Structural validation failed; inspect created board');
return {boardId:board.id,kitId:kit.id,columns:colIds,shots,createdNodeIds:ids,descendants:all.length,counts,imageNodes,fonts,bounds:{x:board.x,y:board.y,width:board.width,height:board.height}};
