import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {resolve,relative,extname} from 'node:path';
import {deflateRawSync} from 'node:zlib';
const root=resolve('dist'),out=resolve('release');await mkdir(out,{recursive:true});
async function files(dir){return (await Promise.all((await readdir(dir,{withFileTypes:true})).map(e=>e.isDirectory()?files(resolve(dir,e.name)):[resolve(dir,e.name)]))).flat();}
const paths=(await files(root)).sort();const entries=[];let offset=0;const central=[];
function crc32(buf){let c=0xffffffff;for(const b of buf){c^=b;for(let n=0;n<8;n++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
for(const path of paths){const name=Buffer.from(relative(root,path).replaceAll('\\','/'));const data=await readFile(path);const compressed=deflateRawSync(data);const crc=crc32(data);
 const local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(8,8);local.writeUInt32LE(crc,14);local.writeUInt32LE(compressed.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(name.length,26);
 local.writeUInt16LE(33,12); // ZIP DOS date: 1980-01-01, portable and deterministic.
 entries.push(local,name,compressed);const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(8,10);c.writeUInt16LE(33,14);c.writeUInt32LE(crc,16);c.writeUInt32LE(compressed.length,20);c.writeUInt32LE(data.length,24);c.writeUInt16LE(name.length,28);c.writeUInt32LE(offset,42);central.push(c,name);offset+=local.length+name.length+compressed.length;
}
const cd=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(paths.length,8);end.writeUInt16LE(paths.length,10);end.writeUInt32LE(cd.length,12);end.writeUInt32LE(offset,16);
await writeFile(resolve(out,'GG-EZ-itch.zip'),Buffer.concat([...entries,cd,end]));
let html=await readFile(resolve(root,'index.html'),'utf8');
const jsPath=html.match(/<script[^>]*src="([^"]+)"[^>]*><\/script>/)?.[1];const cssPath=html.match(/<link[^>]*href="([^\"]+\.css)"[^>]*>/)?.[1];
if(!jsPath)throw Error('Missing built JS');
const assets={};for(const path of paths){const name=relative(root,path).replaceAll('\\','/');if(!name.startsWith('assets/dain/')&&!name.startsWith('assets/audio/'))continue;
 const mime=({'.png':'image/png','.jpg':'image/jpeg','.mp3':'audio/mpeg','.json':'application/json'})[extname(path)];if(mime)assets[name]=`data:${mime};base64,${(await readFile(path)).toString('base64')}`;
}
const js=(await readFile(resolve(root,jsPath),'utf8')).replaceAll('</script','<\\/script');
html=html.replace(/<script[^>]*src="[^"]+"[^>]*><\/script>/,()=>`<script>window.__embeddedAssets=${JSON.stringify(assets)};</script><script type="module">${js}</script>`);
if(cssPath){const css=await readFile(resolve(root,cssPath),'utf8');html=html.replace(/<link[^>]*href="[^\"]+\.css"[^>]*>/,()=>`<style>${css}</style>`);}
await writeFile(resolve(out,'GG-EZ-PLAY.html'),html);console.log(`Packaged ${paths.length} files; ZIP and standalone HTML in release/`);
