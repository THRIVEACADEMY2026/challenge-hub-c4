import test from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';
const root=new URL('../',import.meta.url).pathname;
test('approved Hub registration destination and all cohort/resource configuration are preserved',()=>{
 const current=readFileSync(root+'index.html','utf8'),old=readFileSync(root+'tests/fixtures/registration-config-baseline.html','utf8');
 const config=s=>s.slice(s.indexOf('var CHALLENGE ='),s.indexOf('var CAS_ORIGIN='));
 assert.equal(config(current),config(old));
 assert.equal(current.match(/var REGISTER="[^\"]*";/)[0],'var REGISTER="https://apply.clientattractionsummit.com/challenge-optin-challenge-hub";');
 assert.ok(!current.includes('THRIVE_PROPOSED_HUB_SOURCE_ENABLED'));
});
