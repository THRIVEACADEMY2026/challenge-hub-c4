import sys,json,hashlib,os,shutil
root='/opt/github/apps/challenge-hub/htdocs';r=json.load(open(sys.argv[1]+'/release.json'));sha=lambda p:hashlib.sha256(open(p,'rb').read()).hexdigest()
for p,h in r['deployed'].items():assert sha(root+'/'+p)==h,'Concurrent frontend drift: '+p
for p,h in r['previous'].items():assert sha(r['backup']+'/'+p)==h
for p in ['entry/handoff.js','entry/index.html','index.html']:
 target=root+'/'+p;temp=target+'.entry12.rollback.tmp';shutil.copy2(r['backup']+'/'+p,temp);os.replace(temp,target);assert sha(target)==r['previous'][p]
print('Exact three-file rollback PASS')
