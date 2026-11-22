// Bridge the pre-offline site's versioned URLs into the first verified release.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const validPath=path=>/^(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.[a-f0-9]{16}\.(?:js|css|cpp)$/.test(path);
export async function retainLegacyAssets(directory,source,currentId,{fetcher=fetch}={}){
 const base=new URL(source.endsWith('/')?source:source+'/');
 const request=path=>fetcher(new URL(path,base),{cache:'no-store',signal:AbortSignal.timeout(30000)});
 const published=await request('release.json');let records=[],original;
 if(published.ok){original=await published.json();records=original.legacyAssets??[];if(!Array.isArray(records)||records.length>50||records.some(f=>!validPath(f.path)||!Number.isSafeInteger(f.bytes)||f.bytes<0||f.bytes>10000000||!(/^[a-f0-9]{64}$/).test(f.sha256)))throw Error('Invalid legacy asset history.');}
 else if(published.status===404){
  const response=await request('');if(!response.ok)throw Error('Could not retain the pre-offline course.');
  const html=await response.text(),version=html.match(/(?:src|href)="(?:\.\/)?app\.([a-f0-9]{16})\.js"/)?.[1];
  if(!version)return [];
  // The old worker reads unversioned binary names. They must remain byte-identical.
  const toolchain=await request('compiler/toolchain.json');if(!toolchain.ok)throw Error('Could not verify the earlier compiler.');
  const prior=await toolchain.json(),next=JSON.parse(await readFile(`${directory}/compiler/toolchain.json`));
  for(const [name,file]of Object.entries(prior.assets))if(next.assets[name]?.sha256!==file.sha256||next.assets[name]?.bytes!==file.bytes)throw Error('The pre-offline compiler binaries changed; preserve their runtime before publishing.');
  const pending=[`app.${version}.js`,`style.${version}.css`],seen=new Set();
  while(pending.length){
   const path=pending.shift();if(seen.has(path))continue;seen.add(path);if(seen.size>50||!validPath(path))throw Error('Invalid pre-offline module graph.');
   const asset=await request(path);if(!asset.ok)throw Error('Could not retain earlier asset '+path);
   const bytes=Buffer.from(await asset.arrayBuffer());if(bytes.length>10000000)throw Error('Unexpected pre-offline asset size.');
   records.push({path,bytes:bytes.length,sha256:hash(bytes),body:bytes});
   for(const match of bytes.toString().matchAll(/['"]((?:\.\/|\.\.\/)?(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.[a-f0-9]{16}\.(?:js|css|cpp))['"]/g)){
    const target=new URL(match[1],new URL(path,base));if(!target.href.startsWith(base.href))throw Error('Pre-offline asset left the course scope.');pending.push(target.href.slice(base.href.length));
   }
  }
  const confirmation=await request('');if(!confirmation.ok||await confirmation.text()!==html)throw Error('The published course changed while retaining its pre-offline files.');
 }else throw Error('Could not inspect the published legacy release.');
 for(const file of records){
  let bytes=file.body;
  if(!bytes){const response=await request(`releases/${original.id}/${file.path}`);if(!response.ok)throw Error('Could not retain legacy asset '+file.path);bytes=Buffer.from(await response.arrayBuffer());}
  if(bytes.length!==file.bytes||hash(bytes)!==file.sha256)throw Error('Legacy asset failed verification: '+file.path);
  // Legacy tabs have no release pin. A newly claiming worker may address its
  // current release, so retain both URLs. These are online compatibility files,
  // outside the current course's verified offline download manifest.
  for(const path of [file.path,`releases/${currentId}/${file.path}`]){const target=`${directory}/${path}`;await mkdir(target.slice(0,target.lastIndexOf('/')),{recursive:true});await writeFile(target,bytes);}
 }
 return records.map(({body,...file})=>file);
}
