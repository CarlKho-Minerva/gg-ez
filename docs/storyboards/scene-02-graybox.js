// Approved Scene2 table, graybox only. Existing boards are read-only.
const p=await figma.getNodeByIdAsync('0:1');
if(!p||p.type!=='PAGE')throw new Error('Missing Draft page; no changes');
await figma.setCurrentPageAsync(p);
if(p.children.some(n=>n.name.includes('GG EZ / Scene 2')))throw new Error('Scene2 already exists; inspect instead of replaying');
await Promise.all(['Regular','Bold'].map(style=>figma.loadFontAsync({family:'Inter',style})));
const before=p.children.map(n=>({id:n.id,x:n.x,y:n.y,width:n.width,height:n.height}));
const ids=[];const color=h=>[{type:'SOLID',color:{r:parseInt(h.slice(1,3),16)/255,g:parseInt(h.slice(3,5),16)/255,b:parseInt(h.slice(5,7),16)/255}}];
function put(n,parent,name,w,h){ids.push(n.id);parent.appendChild(n);n.name=name;n.resize(w,h);return n;}
function box(parent,name,x,y,w,h,c='#777777'){const n=put(figma.createRectangle(),parent,name,w,h);n.x=x;n.y=y;n.fills=color(c);return n;}
function label(parent,s,x,y,w,size=20,c='#222222',bold=false){const n=figma.createText();ids.push(n.id);n.fontName={family:'Inter',style:bold?'Bold':'Regular'};parent.appendChild(n);n.name=s;n.textAutoResize='HEIGHT';n.resize(w,30);n.fontSize=size;n.lineHeight={unit:'PERCENT',value:125};n.characters=s;n.fills=color(c);n.x=x;n.y=y;return n;}
function stack(parent,name,w,gap,pad,fill){const n=put(figma.createAutoLayout(),parent,name,w,1);n.layoutMode='VERTICAL';n.primaryAxisSizingMode='AUTO';n.counterAxisSizingMode='FIXED';n.itemSpacing=gap;n.paddingTop=n.paddingBottom=n.paddingLeft=n.paddingRight=pad;n.fills=fill?color(fill):[];n.clipsContent=false;return n;}
function frame(parent,name,x,y,w,h,c){const n=put(figma.createFrame(),parent,name,w,h);n.x=x;n.y=y;n.fills=color(c);n.clipsContent=true;return n;}
const board=frame(p,'GG EZ / Scene 2 / approved graybox',Math.max(0,...before.map(n=>n.x+n.width))+352,2240,2220,2660,'#E5E5E5');
label(board,'SCENE 2 / THE FIRST HUMILIATION',40,34,2120,34,'#222222',true);
label(board,'GRAYBOX · Read A → B → C. At 2.08 choose ONE alternative. No finished art or animation.',40,86,2120,23);
label(board,'Revised chat: deflect with a joke, double down, or say nothing. Scene 1 stays untouched.',40,126,2120,20,'#555555');
const joke='wait, my punch is still on the way';
const challenge="again. i know what you're doing now.";
const beats=[
 ['2.01','Control works','Move before attacking. Two figures and one platform.','Footsteps respond immediately.'],
 ['2.02','Your hit lands','Your punch connects. Lia staggers. Let this success register.','One clean hit sound.'],
 ['2.03','The follow-up freezes','Your next attack stalls for half a second. Lia keeps moving.','Music continues; no whole-game pause.'],
 ['2.04','Lia launches you','A hit sends you across the arena. The camera stays fixed.','Hit, then a sideways whoosh.'],
 ['2.05','The guard arrives late','You try to defend. Guard registers late; show the network warning.','Late block sound; brief warning.'],
 ['2.06','DEFEAT','First loss. Hold DEFEAT, then show a small chat notification.','Announcer: “GAME!” Then a chat ping.'],
 ['2.07','MATCH CHAT / choose','Lia writes “ez”. Deflect with a lag joke, or ask for another shot.','Small interface tick. Preserve 00:03 as written.'],
 ['2.08A','A / joke about the lag','A face-saving joke. Lia laughs. Not a “good person” choice.','Message tick. Alternative to B and C.'],
 ['2.08B','B / double down','You think you have figured her out. Lia accepts the challenge.','Message tick. “sige” means “okay”.'],
 ['2.08C','C / say nothing','No message is sent. Lia gives no reply and requests a rematch.','Rematch-request ping. No automatic acceptance.']
];
function fighter(s,x,y,isLia,pose='idle'){
 const f=frame(s,(isLia?'Lia':'You')+' / '+pose,x,y,70,84,'#EEEEEE');f.fills=[];f.clipsContent=false;
 const shade=isLia?'#929292':'#333333';const head=put(figma.createEllipse(),f,'head',20,20);head.x=25;head.y=0;head.fills=color(shade);
 box(f,'body',22,24,26,32,shade);box(f,'leg left',22,57,10,27,shade);box(f,'leg right',38,57,10,27,shade);
 box(f,'arm',isLia?7:48,30,pose==='punch'?34:14,9,shade);
 if(pose==='down')f.rotation=75;if(pose==='airborne')f.rotation=28;
 return f;
}
function play(s,i){
 box(s,'platform',70,289,500,17,'#777777');
 box(s,'you health track',24,22,180,8,'#CCCCCC');box(s,'lia health track',436,22,180,8,'#CCCCCC');
 if(i<5)box(s,'you health',24,22,i>=3?65:180,8,'#333333');box(s,'lia health',436,22,i>=1?145:180,8,'#929292');
 label(s,'YOU',24,38,160,18,'#333333',true);label(s,'lia_ph',483,38,133,18,'#555555',true);label(s,'248ms',526,71,90,16,'#555555');
 const pos=[[216,205,372,205,'idle'],[276,205,358,205,'punch'],[276,205,341,205,'punch'],[116,158,340,205,'airborne'],[135,205,241,205,'idle']][i]||[132,267,324,205,'down'];
 fighter(s,pos[0],pos[1],false,pos[4]);fighter(s,pos[2],pos[3],true,i===4?'punch':'idle');
 if(i===1){box(s,'hit horizontal',352,233,36,4,'#222222');box(s,'hit vertical',368,217,4,36,'#222222');}
 if(i===3){box(s,'knockback direction',216,193,91,3,'#888888');label(s,'←',187,174,40,30);}
 if(i===4){box(s,'late guard',207,212,6,65,'#BBBBBB');box(s,'network panel',75,112,490,44,'#D2D2D2');label(s,'NETWORK DELAY — 248ms',97,122,450,24,'#222222',true);}
 if(i>=5){label(s,'DEFEAT',226,123,250,40,'#222222',true);}
 if(i===5){box(s,'chat notification',405,310,211,34,'#D0D0D0');label(s,'MATCH CHAT',424,316,186,17,'#222222',true);}
}
function chat(s,i){
 box(s,'chat panel',40,43,560,294,'#DDDDDD');label(s,'MATCH CHAT',60,59,420,23,'#222222',true);
 if(i===6)label(s,'00:03',510,63,83,19);
 label(s,'lia_ph: ez',60,103,510,24,'#222222',true);
 if(i===6){box(s,'choice / deflect',58,156,524,61,'#F6F6F6');label(s,joke,75,171,492,21);box(s,'choice / challenge',58,229,524,61,'#F6F6F6');label(s,challenge,75,244,492,21);}
 if(i===7){label(s,'you: '+joke,60,161,520,21);label(s,'lia_ph: HAHAHAHA',60,235,520,24,'#222222',true);}
 if(i===8){label(s,'you: '+challenge,60,161,520,21);label(s,'lia_ph: sige, rematch',60,235,520,24,'#222222',true);label(s,'[okay, rematch]',60,274,520,18,'#555555');}
 if(i===9){box(s,'system / rematch requested',58,236,524,63,'#C4C4C4');label(s,'lia_ph requested a rematch',76,255,490,22);}
}
const groups=[['A / A LITTLE HOPE',[0,1,2]],['B / FIRST LOSS',[3,4,5]],['C / CHAT + ALTERNATIVES',[6,7,8,9]]];
const shots=[];
for(let ci=0;ci<groups.length;ci++){
 const [name,indices]=groups[ci];const col=stack(board,name,680,18,0,null);col.x=40+ci*730;col.y=188;label(col,name,0,0,680,24,'#222222',true);
 for(const i of indices){const [number,title,action,sound]=beats[i];const card=stack(col,number+' / '+title,680,10,20,'#FFFFFF');label(card,number+'   '+title,0,0,640,23,'#222222',true);const screen=frame(card,number+' / SCREEN',0,0,640,360,'#EEEEEE');if(i<6)play(screen,i);else chat(screen,i);label(card,action,0,0,640,18);label(card,'SOUND / '+sound,0,0,640,16,'#555555');shots.push({number,cardId:card.id,screenId:screen.id});}
}
const all=board.findAll(()=>true),counts={};for(const n of all)counts[n.type]=(counts[n.type]||0)+1;
const preserved=before.every(b=>{const n=p.children.find(n=>n.id===b.id);return n&&['x','y','width','height'].every(k=>n[k]===b[k]);});
if(!preserved)throw new Error('Prior bounds changed; inspect before proceeding');
return {boardId:board.id,shots,counts,originalTopBounds:before,preserved,createdNodeIds:[...new Set([...ids,...all.map(n=>n.id)])],bounds:{x:board.x,y:board.y,width:board.width,height:board.height}};
