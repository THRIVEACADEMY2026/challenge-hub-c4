import os,hashlib,json,shutil,datetime
root='/opt/github/apps/challenge-hub/htdocs';sha=lambda p:hashlib.sha256(open(p,'rb').read()).hexdigest()
old={'index.html':'08e4d7f973f07dc9f6f286188e61faa3241d0cc345ce3caab869ae3693b0e00a','entry/index.html':'915581835bb9675f45e2373eeffab19d6758bb560e5326dfdf1ef11e43352010','entry/handoff.js':'2bd456b8122b4beb1258acb1def78f31c697906d0fead1fd14d1cd1b11699d26'}
for p,h in old.items():assert sha(root+'/'+p)==h,'Concurrent frontend drift: '+p
backup='/opt/github/apps/challenge-hub/releases/entry-incident-12-'+datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%SZ');os.makedirs(backup+'/entry')
for p,h in old.items():shutil.copy2(root+'/'+p,backup+'/'+p);assert sha(backup+'/'+p)==h
new={p:sha('/tmp/cas-entry12/'+p) for p in old}
for p in ['entry/handoff.js','entry/index.html','index.html']:
 target=root+'/'+p;st=os.stat(target);temp=target+'.entry12.tmp';assert sha(target)==old[p];shutil.copyfile('/tmp/cas-entry12/'+p,temp);os.chmod(temp,st.st_mode);os.chown(temp,st.st_uid,st.st_gid);os.replace(temp,target);assert sha(target)==new[p]
r={'version':'entry-incident-12','backup':backup,'previous':old,'deployed':new,'scope':list(old)};json.dump(r,open(backup+'/release.json','w'));print(json.dumps(r))
