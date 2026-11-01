import {unlink} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
// Keep source artwork/reference sheets intact; omit unused copies from the build.
const root=resolve('dist');
for(const name of ['lia-room-wip-20261031.jpg','ref-arena-shot-1.png','ref-arena-shot-2.png']){
  const path=resolve(root,'assets/dain',name);if(!path.startsWith(root+sep))throw Error('Build path escaped');
  await unlink(path).catch(e=>{if(e.code!=='ENOENT')throw e;});
}
