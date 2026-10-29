import {readFileSync,mkdirSync,copyFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const output=resolve(process.argv[2]||'/tmp/cas-entry-known-good-build');
if(output===root||root.startsWith(output+'/'))throw Error('Use a separate output directory');
const assets=JSON.parse(readFileSync(resolve(root,'releases/cas-entry-known-good-2026-10-29/frontend-sha256.json'),'utf8'));
for(const [name,expected] of Object.entries(assets)){
 const data=readFileSync(resolve(root,name));
 if(createHash('sha256').update(data).digest('hex')!==expected)throw Error('Asset hash mismatch: '+name);
 const dest=resolve(output,name);mkdirSync(dirname(dest),{recursive:true});copyFileSync(resolve(root,name),dest);
}
const source=readFileSync(resolve(root,'integrations/giveaway/challenge-signing-guard.mjs'),'utf8');
const generated='<script data-cas-release="entry-incident-13-giveaway-v1">\n(function(){\n'+source.replaceAll('export function ','function ')+'\ninstallChallengeSigningGuard(productionAdapter(window));\n})();\n</script>\n';
const guard=readFileSync(resolve(root,'integrations/giveaway/inline-head-script.html'),'utf8');
if(generated!==guard)throw Error('Giveaway source/artifact mismatch');
if(createHash('sha256').update(guard).digest('hex')!=='7969b08e5f909b56ba6e5d52b4636d95064592b758f94bdebed8ba5f93758b64')throw Error('Giveaway artifact hash mismatch');
console.log(JSON.stringify({assets:Object.keys(assets).length,exactHashes:true,giveawaySourceParity:true,output}));
