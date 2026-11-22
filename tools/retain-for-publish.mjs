import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {retainLegacyAssets} from './retain-legacy-assets.mjs';
import {retainPublishedReleases} from './retain-releases.mjs';
const directory='.build/site',source=process.env.PUBLISHED_COURSE_URL;
if(source){const release=JSON.parse(await readFile(`${directory}/release.json`));release.legacyAssets=await retainLegacyAssets(directory,source,release.id);release.retainedReleases=await retainPublishedReleases(directory,source,{currentId:release.id});for(const id of release.retainedReleases)for(const file of release.legacyAssets){const target=`${directory}/releases/${id}/${file.path}`;await mkdir(target.slice(0,target.lastIndexOf('/')),{recursive:true});await writeFile(target,await readFile(`${directory}/${file.path}`));}for(const name of ['release.json',`releases/${release.id}/release.json`])await writeFile(`${directory}/${name}`,JSON.stringify(release));}
