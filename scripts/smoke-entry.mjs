import {mkdtempSync,mkdirSync,copyFileSync,writeFileSync,rmSync} from 'node:fs';import{tmpdir}from'node:os';import{join}from'node:path';import{validateEntryAssets}from'./validate-entry-assets.mjs';
const origin='https://hub.clientattractionsummit.com';const dir=mkdtempSync(join(tmpdir(),'cas-entry-smoke-'));mkdirSync(join(dir,'entry'));try{
copyFileSync(new URL('../entry/asset-manifest.json',import.meta.url),join(dir,'entry/asset-manifest.json'));
const result={};for(const path of ['entry/index.html','entry/handoff.js','index.html']){const url=path==='entry/index.html'?origin+'/entry/':origin+'/'+path;const r=await fetch(url,{cache:'no-store'});if(r.status!==200)throw Error(path+' HTTP '+r.status);writeFileSync(join(dir,path),await r.text());result[path]=r.status;}
validateEntryAssets(dir);console.log(JSON.stringify({production:origin,status:'PASS',http:result,scope:'Asset and initialization presence; does not claim participant enrollment or authentication'}));
}finally{rmSync(dir,{recursive:true,force:true})}
