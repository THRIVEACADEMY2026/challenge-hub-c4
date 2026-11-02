import test from'node:test';import assert from'node:assert/strict';import vm from'node:vm';import{readFileSync}from'node:fs';
const root=new URL('../',import.meta.url).pathname;
test('approved registration destination and resource config change only for authorized replay and cohort links',()=>{
 const current=readFileSync(root+'index.html','utf8'),old=readFileSync(root+'tests/fixtures/registration-config-baseline.html','utf8');
 const config=s=>{const c={window:{}};vm.createContext(c);vm.runInContext(s.slice(s.indexOf('var CHALLENGE ='),s.indexOf('var MEDIA =')),c);return JSON.parse(JSON.stringify(c.CHALLENGE));};const a=config(current),b=config(old),c1='(5-day challenge) nov 2-6 2026',c2='(5-day challenge) nov 16-20 2026',c3='(5-day challenge) jan 4-8 2027';
 assert.equal(a.rounds[c1].days[0].vimeo,'1242515944');assert.equal(a.days[0].vimeo,'1242515944');b.rounds[c1].days[0].vimeo='1242515944';b.days[0].vimeo='1242515944';
 for(const [round,group,calendar]of[[c1,'1103115088773996','https://www.addevent.com/calendar/yw2557c2xbsj'],[c2,'1721649735561700',''],[c3,'','']]){assert.deepEqual(a.rounds[round].links,{fbGroup:group?'https://www.facebook.com/groups/'+group:'',fbGuides:group?'https://www.facebook.com/groups/'+group+'/learning_content':'',addCal:calendar});delete a.rounds[round].links;}
 assert.deepEqual(a,b);assert.equal(current.match(/var REGISTER="[^\"]*";/)[0],'var REGISTER="https://apply.clientattractionsummit.com/challenge-optin-challenge-hub";');assert.ok(!current.includes('THRIVE_PROPOSED_HUB_SOURCE_ENABLED'));
});
