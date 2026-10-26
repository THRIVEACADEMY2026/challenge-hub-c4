import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const script = await readFile(new URL("../entry/handoff.js", import.meta.url), "utf8");

function response(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function element() {
  return {
    hidden: false,
    textContent: "",
    attributes: new Map(),
    setAttribute(name, value) { this.attributes.set(name, value); },
    getAttribute(name) { return this.attributes.get(name) ?? null; },
    addEventListener(name, handler) { this[`on${name}`] = handler; },
  };
}

async function flush() {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
}

async function runEntry({
  href = "https://hub.test/entry/?contact_id=ghl_A",
  storedContactId = null,
  session = { authorized: false, csrf_token: "csrf-test" },
  readiness = [{ status: "PROVISIONING", ready: false, retry_after_ms: 1000 }],
  readinessGate = null,
  fetchOverride = null,
  visibilityState = "visible",
} = {}) {
  const title = element();
  const message = element();
  const pulse = element();
  const actions = element();
  const retry = element();
  const card = element();
  const storage = new Map();
  if (storedContactId) storage.set("thriveChallengeHubEntryContactId", storedContactId);
  const fetchCalls = [];
  const timers = [];
  const replacements = [];
  const historyCalls = [];
  const listeners = {};
  let readinessCall = 0;
  const location = {
    href,
    replace(value) { replacements.push(value); },
  };
  const document = {
    visibilityState,
    getElementById(id) {
      return { entryTitle: title, entryMessage: message, entryPulse: pulse, entryActions: actions, entryRetry: retry }[id] ?? null;
    },
    querySelector(selector) { return selector === ".card" ? card : null; },
    addEventListener(name, handler) { listeners[name] = handler; },
  };
  const context = {
    console,
    document,
    location,
    history: { replaceState(_state, _title, value) { historyCalls.push(value); } },
    sessionStorage: {
      getItem(key) { return storage.get(key) ?? null; },
      setItem(key, value) { storage.set(key, value); },
    },
    fetch: async (url, options = {}) => {
      fetchCalls.push({ url, options });
      if(fetchOverride) return fetchOverride(url,options,fetchCalls.length);
      if (url.endsWith("/browser/challenge-hub/session")) return response(session, session.csrf_token ? 200 : 503);
      if (url.endsWith("/browser/challenge-hub/readiness")) {
        if (readinessGate) await readinessGate;
        const result = readiness[Math.min(readinessCall++, readiness.length - 1)];
        return response(result.body ?? result, result.statusCode ?? (result.status === "IDENTITY_CONFLICT" ? 409 : result.status === "RECOVERABLE_ERROR" ? 503 : 200));
      }
      throw new Error(`Unexpected fetch ${url}`);
    },
    setTimeout(handler, delay) { const t={handler,delay,active:true}; timers.push(t); return t; },
    clearTimeout(t) { if(t)t.active=false; },
    AbortController,
    URL,
    Response,
    Math: Object.create(Math),
  };
  context.Math.random = () => 0.5;
  context.window = context;
  context.window.location = location;
  context.window.THRIVE_CAS_ORIGIN = "https://id.test";
  vm.runInNewContext(script, context, { filename: "handoff.js" });
  await flush();
  return { get timers(){return timers.filter(t=>t.active&&t.delay!==90000);}, allTimers:timers, actions, card, context, document, fetchCalls, historyCalls, listeners, location, message, replacements, retry, storage, title };
}

test("captures contact_id, stores it in sessionStorage, and scrubs it from the URL", async () => {
  const entry = await runEntry({ href: "https://hub.test/entry/?contact_id=ghl_A&utm_source=test" });
  assert.equal(entry.storage.get("thriveChallengeHubEntryContactId"), "ghl_A");
  assert.deepEqual(entry.historyCalls, ["/entry/?utm_source=test"]);
  const readiness = entry.fetchCalls.find((call) => call.url.endsWith("/readiness"));
  assert.deepEqual(JSON.parse(readiness.options.body), { contact_id: "ghl_A" });
});

test("refresh restores correlation from sessionStorage", async () => {
  const entry = await runEntry({ href: "https://hub.test/entry/", storedContactId: "ghl_A" });
  assert.equal(entry.fetchCalls.some((call) => call.url.endsWith("/readiness")), true);
  assert.equal(entry.historyCalls.length, 0);
});

test("missing contact_id fails safely after checking the existing session", async () => {
  const entry = await runEntry({ href: "https://hub.test/entry/" });
  assert.equal(entry.fetchCalls.length, 1);
  assert.equal(entry.card.getAttribute("data-entry-state"), "AUTH_UNAVAILABLE");
  assert.equal(entry.actions.hidden, false);
});

test("immediate READY replaces the temporary route with the normal Hub root", async () => {
  const entry = await runEntry({ readiness: [{ status: "READY", ready: true }] });
  assert.deepEqual(entry.replacements, ["/"]);
  assert.equal(entry.fetchCalls[0].url, "https://id.clientattractionsummit.com/browser/challenge-hub/session");
  assert.equal(entry.fetchCalls[1].url, "https://id.clientattractionsummit.com/browser/challenge-hub/readiness");
  assert.equal(entry.fetchCalls[1].options.headers["X-CAS-CSRF"], "csrf-test");
});

test("PROVISIONING schedules one bounded follow-up and then READY stops polling", async () => {
  const entry = await runEntry({ readiness: [
    { status: "PROVISIONING", ready: false, retry_after_ms: 1000 },
    { status: "READY", ready: true },
  ] });
  assert.equal(entry.timers.length, 1);
  assert.equal(entry.timers[0].delay, 1000);
  await entry.timers[0].handler();
  await flush();
  assert.deepEqual(entry.replacements, ["/"]);
  assert.equal(entry.fetchCalls.filter((call) => call.url.endsWith("/readiness")).length, 2);
  assert.equal(entry.timers.length, 1);
});

test("IDENTITY_CONFLICT stops without navigating or revealing protected content", async () => {
  const entry = await runEntry({ readiness: [{ status: "IDENTITY_CONFLICT", ready: false }] });
  assert.equal(entry.replacements.length, 0);
  assert.equal(entry.timers.length, 0);
  assert.equal(entry.card.getAttribute("data-entry-state"), "IDENTITY_CONFLICT");
  assert.match(entry.title.textContent, /right account/i);
});

test("missing or invalid browser session reaches recovery without automatic entry", async () => {
  const entry = await runEntry({ session: { authorized: false } });
  for (let index = 0; index < entry.timers.length; index += 1) {
    await entry.timers[index].handler();
    await flush();
  }
  assert.equal(entry.card.getAttribute("data-entry-state"), "RECOVERABLE_ERROR");
  assert.equal(entry.replacements.length, 0);
  assert.equal(entry.fetchCalls.some((call) => call.url.endsWith("/readiness")), false);
});

test("RECOVERABLE_ERROR retries through the bounded scheduler", async () => {
  const entry = await runEntry({ readiness: [{ status: "RECOVERABLE_ERROR", ready: false }] });
  assert.equal(entry.timers.length, 1);
  assert.ok(entry.timers[0].delay >= 750 && entry.timers[0].delay <= 10000);
  assert.equal(entry.replacements.length, 0);
});

test("prolonged provisioning reaches a terminal long-wait recovery state", async () => {
  const entry = await runEntry();
  for (let index = 0; index < entry.timers.length; index += 1) {
    await entry.timers[index].handler();
    await flush();
  }
  assert.equal(entry.card.getAttribute("data-entry-state"), "LONG_WAIT");
  assert.equal(entry.actions.hidden, false);
  assert.equal(entry.replacements.length, 0);
  assert.equal(entry.fetchCalls.filter((call) => call.url.endsWith("/readiness")).length, 12);
});

test("hidden tabs defer readiness requests until visible", async () => {
  const entry = await runEntry({ visibilityState: "hidden" });
  assert.equal(entry.fetchCalls.length, 0);
  entry.document.visibilityState = "visible";
  entry.listeners.visibilitychange();
  await flush();
  assert.equal(entry.fetchCalls.some((call) => call.url.endsWith("/readiness")), true);
});

test("an in-flight readiness request cannot overlap itself", async () => {
  let release;
  const blocked = new Promise((resolve) => { release = resolve; });
  const entry = await runEntry({ readinessGate: blocked });
  assert.equal(entry.fetchCalls.filter((call) => call.url.endsWith("/readiness")).length, 1);
  entry.context.window.ChallengeHubEntry.start();
  await flush();
  assert.equal(entry.fetchCalls.filter((call) => call.url.endsWith("/readiness")).length, 1);
  release();
  await flush();
});

test("candidate has no tracking, GHL, BigQuery, Magic Link, email-auth, or protected-Hub dependencies", () => {
  assert.doesNotMatch(script, /dataLayer|fbq|Meta Pixel|Stape|CompleteRegistration|Lead\b/);
  assert.doesNotMatch(script, /GHL|BigQuery|magic[-_ ]?link|email/i);
  assert.doesNotMatch(script, /innerHTML|protected|challenge_membership/i);
  assert.match(script, /JSON\.stringify\(\{contact_id:contactId\}\)/);
});

 test("existing authorized session completes direct entry without correlation",async()=>{
 const e=await runEntry({href:"https://hub.test/entry/",session:{authorized:true,csrf_token:"valid"}});
 assert.deepEqual(e.replacements,["/"]);
 assert.equal(e.fetchCalls.length,1);
 });
 test("invalid correlation cannot reuse a stale contact",async()=>{
 const e=await runEntry({href:"https://hub.test/entry/?contact_id=%20bad",storedContactId:"ghl_A"});
 assert.equal(e.fetchCalls.some(c=>c.url.endsWith("/readiness")),false);
 assert.equal(e.card.getAttribute("data-entry-state"),"AUTH_UNAVAILABLE");
 });
 test("overall deadline stops setup and ignores a late READY",async()=>{
 let release;const gate=new Promise(r=>release=r);
 const e=await runEntry({readinessGate:gate,readiness:[{status:"READY",ready:true}]});
 e.allTimers.find(t=>t.delay===90000).handler();
 assert.equal(e.card.getAttribute("aria-busy"),"false");
 release();await flush();assert.deepEqual(e.replacements,[]);
 });
 test("request timeout aborts stalled authentication and reaches recovery",async()=>{
 const e=await runEntry({fetchOverride:(_url,o)=>new Promise((_resolve,reject)=>o.signal.addEventListener("abort",()=>reject(new Error("aborted"))))});
 for(let i=0;i<12;i++){
   const timeout=e.allTimers.findLast(t=>t.active&&t.delay===8000);
   assert.ok(timeout);timeout.handler();await flush();
   const retry=e.timers.findLast(t=>t.active);
   if(retry){retry.handler();await flush();}
 }
 assert.equal(e.card.getAttribute("aria-busy"),"false");
 assert.equal(e.card.getAttribute("data-entry-state"),"RECOVERABLE_ERROR");
 assert.deepEqual(e.replacements,[]);
 });
 for(const status of [400,401,403,404]) test("permanent readiness HTTP "+status+" stops safely",async()=>{
 const e=await runEntry({readiness:[{statusCode:status,body:{error:"unavailable"}}]});
 assert.equal(e.card.getAttribute("aria-busy"),"false");assert.deepEqual(e.replacements,[]);assert.equal(e.timers.length,0);
 });
 test("temporary API failure recovers to READY",async()=>{
 const e=await runEntry({readiness:[{statusCode:503,body:{status:"RECOVERABLE_ERROR"}},{status:"READY",ready:true}]});
 await e.timers[0].handler();await flush();assert.deepEqual(e.replacements,["/"]);
 });
 test("network rejection is bounded and does not authorize entry",async()=>{
 const e=await runEntry({fetchOverride:async()=>{throw new Error("offline")}});
 for(let i=0;i<e.timers.length;i++){await e.timers[i].handler();await flush();}
 assert.equal(e.card.getAttribute("aria-busy"),"false");assert.deepEqual(e.replacements,[]);
 });
 test("existing session still checks correlation against server identity",async()=>{
 const e=await runEntry({session:{authorized:true,csrf_token:"valid"},readiness:[{status:"IDENTITY_CONFLICT"}]});
 assert.equal(e.card.getAttribute("data-entry-state"),"IDENTITY_CONFLICT");assert.deepEqual(e.replacements,[]);
 });
