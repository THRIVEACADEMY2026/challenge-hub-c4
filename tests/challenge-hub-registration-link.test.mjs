import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';import{execFileSync}from'node:child_process';
const root=new URL('../',import.meta.url).pathname;
test('approved Hub registration destination and all cohort/resource configuration are preserved',()=>{
 const current=readFileSync(root+'index.html','utf8'),old=execFileSync('git',['show','e41374123765ba7690fe4f4c58f123556b6dafa6:index.html'],{cwd:root,encoding:'utf8'});
 const config=s=>s.slice(s.indexOf('var CHALLENGE ='),s.indexOf('var CAS_ORIGIN='));
 assert.equal(config(current),config(old));
 assert.equal(current.match(/var REGISTER="[^\"]*";/)[0],'var REGISTER="https://apply.clientattractionsummit.com/challenge-optin-challenge-hub";');
 assert.ok(!current.includes('THRIVE_PROPOSED_HUB_SOURCE_ENABLED'));
});
