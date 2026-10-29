import {readFileSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
export function validateEntryAssets(root){
 const manifest=JSON.parse(readFileSync(resolve(root,'entry/asset-manifest.json'),'utf8'));
 for(const [name,expected] of Object.entries(manifest.assets)){
  if(!['entry/index.html','entry/handoff.js'].includes(name))throw Error('Unexpected manifest asset');
  const path=resolve(root,name);if(!existsSync(path))throw Error('Missing asset: '+name);
  const data=readFileSync(path);if(createHash('sha256').update(data).digest('hex')!==expected)throw Error('Asset manifest mismatch: '+name);
 }
 if(Object.keys(manifest.assets).length!==2)throw Error('Incomplete manifest');
 const html=readFileSync(resolve(root,'entry/index.html'),'utf8');
 const scripts=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)];
 if(scripts.length!==1||scripts[0][1]!=='./handoff.js?v=entry-incident-12-c482b2cc')throw Error('Invalid entry script source');
 for(const id of ['entryTitle','entryMessage','entryPulse','entryActions','entryRetry'])if(!html.includes('id="'+id+'"'))throw Error('Missing entry DOM contract: '+id);
 const js=readFileSync(resolve(root,'entry/handoff.js'),'utf8');new vm.Script(js);
 for(const contract of ['retry.addEventListener("click",start)','captureCorrelation();','start();','/browser/challenge-hub/session','/browser/challenge-hub/readiness'])if(!js.includes(contract))throw Error('Missing initialization contract');
 const hub=readFileSync(resolve(root,'index.html'),'utf8');
 for(const script of hub.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi))new vm.Script(script[1]);
 if(!hub.includes('bootstrapAuth();')||!hub.includes('lf.onsubmit=async function'))throw Error('Missing Hub authentication handler');
 return {assets:2,entryScript:scripts[0][1],initialization:'present'};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(validateEntryAssets(process.argv[2]||resolve(dirname(fileURLToPath(import.meta.url)),'..'))));
