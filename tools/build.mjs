import {createHash} from 'node:crypto';
import {cp, mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';

const source=path.resolve('dist'), output=path.resolve('.build/site');
async function files(directory,prefix='') {
  const result=[];
  for(const entry of await readdir(directory,{withFileTypes:true})) {
    const name=path.posix.join(prefix,entry.name);
    if(entry.isDirectory())result.push(...await files(path.join(directory,entry.name),name));
    else if(/\.(js|css|cpp)$/.test(name))result.push(name);
  }
  return result.sort();
}
const names=await files(source), contents=new Map(), hash=createHash('sha256');
for(const name of names){
  const bytes=await readFile(path.join(source,name));
  contents.set(name,bytes.toString());hash.update(name).update('\0').update(bytes).update('\0');
}
const version=hash.digest('hex').slice(0,16);
const versions=new Map(names.map(name=>[name,name.replace(/(\.[^.]+)$/,`.${version}$1`)]));
await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
await cp(source,output,{recursive:true});
for(const [name,content] of contents){
  // Rewrite the entire module graph, plus worker, shared runtime and source URLs.
  // A fresh HTML document must never import an older, still-fresh cached module.
  const revised=content.replace(/(from\s*|importScripts\(\s*|new URL\(\s*|fetch\(\s*)(['"])([^'"\n]+)\2/g,(match,prefix,quote,url)=>{
    if(url.startsWith('/')||/^[a-z]+:/i.test(url))return match;
    const target=versions.get(path.posix.normalize(path.posix.join(path.posix.dirname(name),url)));
    if(!target)return match;
    const relative=path.posix.relative(path.posix.dirname(name),target);
    return `${prefix}${quote}${relative.startsWith('.')?relative:'./'+relative}${quote}`;
  });
  await writeFile(path.join(output,versions.get(name)),revised);
}
const html=await readFile(path.join(source,'index.html'),'utf8');
await writeFile(path.join(output,'index.html'),html.replace(/(src|href)="(app\.js|style\.css)"/g,(_,attribute,name)=>`${attribute}="${versions.get(name)}"`));
console.log(`Built .build/site with versioned application assets (${version}).`);
