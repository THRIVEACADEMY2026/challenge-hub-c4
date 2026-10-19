import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const loader = html.match(/<!-- Google Tag Manager -->\s*<script>([\s\S]*?)<\/script>/)?.[1];
if (!loader) throw new Error("Consent-aware GTM loader was not found");

function runLoader({ stored = null, analyticsStored = null, pathname = "/" } = {}) {
  const storage = new Map();
  if (stored) storage.set("thriveHub_marketing_consent", stored);
  if (analyticsStored) storage.set("thriveHub_analytics_consent", analyticsStored);
  const inserted = [];
  let reloads = 0;
  const firstScript = { parentNode: { insertBefore(node) { inserted.push(node); } } };
  const context = {
    Date,
    location: { pathname, reload() { reloads += 1; } },
    localStorage: {
      getItem(key) { return storage.get(key) ?? null; },
      setItem(key, value) { storage.set(key, value); },
    },
    document: {
      createElement(tagName) { return { tagName, async: false, src: "" }; },
      getElementsByTagName(tagName) {
        assert.equal(tagName, "script");
        return [firstScript];
      },
    },
  };
  context.window = context;
  vm.runInNewContext(loader, context, { filename: "index.html:gtm-consent" });
  return { context, inserted, reloads: () => reloads, storage };
}

function consentCommands(result) {
  return result.context.dataLayer.filter((entry) => (
    Object.prototype.toString.call(entry) === "[object Arguments]" &&
    entry[0] === "consent"
  ));
}

function assertDenied(command) {
  assert.equal(command[0], "consent");
  assert.equal(command[1], "default");
  assert.equal(command[2].ad_storage, "denied");
  assert.equal(command[2].ad_user_data, "denied");
  assert.equal(command[2].ad_personalization, "denied");
  assert.equal(command[2].analytics_storage, "denied");
}

function assertCustomHtmlBlocked(result) {
  const restrictions = result.context.dataLayer.filter((entry) => entry["gtm.blocklist"]);
  assert.equal(restrictions.length, 1);
  assert.deepEqual(Array.from(restrictions[0]["gtm.blocklist"]), ["html"]);
}

test("ordinary Hub visits load GTM once after denied consent defaults", () => {
  const result = runLoader();
  assert.equal(result.inserted.length, 1);
  assert.equal(result.inserted[0].src, "https://www.googletagmanager.com/gtm.js?id=GTM-W3NJN7NZ");
  assertDenied(consentCommands(result)[0]);
  assertCustomHtmlBlocked(result);
  assert.equal(result.context.dataLayer[2].event, "gtm.js");
  assert.equal(result.context.thriveHubMarketingConsent.status(), "denied");
  assert.equal(result.context.thriveHubAnalyticsConsent.status(), "denied");
});

test("Magic Link visits initialize GTM under denied consent", () => {
  const result = runLoader({ pathname: "/m/example-magic-link" });
  assert.equal(result.inserted.length, 1);
  assertDenied(consentCommands(result)[0]);
  assertCustomHtmlBlocked(result);
});

test("an explicit decline persists, updates denied consent, and reloads", () => {
  const result = runLoader();
  result.context.thriveHubMarketingConsent.deny();
  assert.equal(result.storage.get("thriveHub_marketing_consent"), "denied");
  assert.equal(result.inserted.length, 1);
  const commands = consentCommands(result);
  assert.equal(commands[1][1], "update");
  assert.equal(commands[1][2].ad_storage, "denied");
  assert.equal(commands[1][2].analytics_storage, undefined);
  assert.equal(result.reloads(), 1);
});

test("an explicit grant reloads once before any consented Custom HTML or Lead claim", () => {
  const result = runLoader();
  let claims = 0;
  result.context.thriveHubClaimMetaLead = () => { claims += 1; };
  result.context.thriveHubMarketingConsent.grant();
  assert.equal(result.storage.get("thriveHub_marketing_consent"), "granted");
  assert.equal(result.inserted.length, 1);
  assert.equal(result.reloads(), 1);
  assert.equal(consentCommands(result).length, 1);
  assert.equal(claims, 0);
});

test("withdrawing previously granted consent reloads into the fail-closed state", () => {
  const result = runLoader({ stored: "granted" });
  result.context.thriveHubMarketingConsent.deny();
  assert.equal(result.storage.get("thriveHub_marketing_consent"), "denied");
  assert.equal(result.reloads(), 1);
});

test("previously granted consent loads GTM once on a later Hub visit", () => {
  const result = runLoader({ stored: "granted" });
  assert.equal(result.inserted.length, 1);
  assert.equal(result.context.thriveHubMarketingConsent.status(), "granted");
  const commands = consentCommands(result);
  assertDenied(commands[0]);
  assert.equal(commands[1][1], "update");
  assert.equal(commands[1][2].ad_storage, "granted");
  assert.equal(commands[1][2].analytics_storage, undefined);
  assert.equal(result.context.dataLayer.some((entry) => entry["gtm.blocklist"]), false);
  assert.equal(result.context.dataLayer[2].event, "gtm.js");
});

test("analytics consent is independent of marketing consent", () => {
  const result = runLoader({ stored: "denied", analyticsStored: "granted" });
  const commands = consentCommands(result);
  assertDenied(commands[0]);
  assert.equal(commands[1][1], "update");
  assert.equal(commands[1][2].analytics_storage, "granted");
  assert.equal(commands[1][2].ad_storage, undefined);
  assertCustomHtmlBlocked(result);
  assert.equal(result.context.thriveHubMarketingConsent.status(), "denied");
  assert.equal(result.context.thriveHubAnalyticsConsent.status(), "granted");
});

test("granting analytics does not grant advertising consent or reload", () => {
  const result = runLoader({ stored: "denied" });
  let ga4Claims = 0;
  result.context.thriveHubClaimGa4Signup = () => { ga4Claims += 1; };
  result.context.thriveHubAnalyticsConsent.grant();
  assert.equal(result.storage.get("thriveHub_analytics_consent"), "granted");
  const commands = consentCommands(result);
  assert.equal(commands.at(-1)[2].analytics_storage, "granted");
  assert.equal(commands.at(-1)[2].ad_storage, undefined);
  assert.equal(result.reloads(), 0);
  assert.equal(ga4Claims, 1);
});

test("denied analytics consent remains independent when marketing is granted", () => {
  const result = runLoader({ stored: "granted", analyticsStored: "denied" });
  const commands = consentCommands(result);
  assert.equal(commands[1][2].ad_storage, "granted");
  assert.equal(commands[1][2].analytics_storage, undefined);
  assert.equal(result.context.thriveHubAnalyticsConsent.status(), "denied");
});

test("invalid consent values fail closed", () => {
  const result = runLoader({ stored: "yes" });
  assert.equal(result.inserted.length, 1);
  assert.equal(consentCommands(result).length, 1);
  assertDenied(consentCommands(result)[0]);
  assertCustomHtmlBlocked(result);
  assert.equal(result.context.thriveHubMarketingConsent.status(), "denied");
});

test("the privacy UI has explicit allow and decline controls", () => {
  assert.match(html, /id="privacyAllow"/);
  assert.match(html, /id="privacyDecline"/);
  assert.match(html, /Analytics and marketing tracking[\s\n]+stay off unless/);
  assert.match(html, /id="analyticsAllow"/);
  assert.match(html, /id="analyticsDecline"/);
});

test("no consent-bypassing noscript container is present", () => {
  assert.doesNotMatch(html, /googletagmanager\.com\/ns\.html/);
});

test("Hub source does not directly initialize fbq", () => {
  assert.doesNotMatch(html, /fbq\s*\(/);
});

test("authenticated Hub bridge claims only the consented browser Lead contract", () => {
  assert.match(html, /authState!=="hub"\|\|!csrfToken/);
  assert.match(html, /thriveHubMarketingConsent\.status\(\)!=="granted"/);
  assert.match(html, /\/browser\/challenge-hub\/meta-lead\/claim/);
  assert.match(html, /"X-CAS-CSRF":csrfToken/);
  assert.match(html, /event:"meta_lead_dedupe_ready"/);
  assert.match(html, /browser_only:true/);
  assert.match(html, /server_delivery_status:"not_authorized"/);
  assert.match(html, /if\(!response\.ok\|\|result\.eligible!==true\) return/);
});

test("marketing consent grant defers the bridge until the consented reload", () => {
  assert.match(html, /typeof w\.thriveHubClaimMetaLead==='function'/);
  assert.match(html, /w\.location\.reload\(\);\s*return;/);
  assert.match(html, /window\.thriveHubClaimMetaLead=claimChallengeMetaLead/);
});

test("authenticated Hub has an independent PII-free GA4 signup bridge", () => {
  assert.match(html, /thriveHubAnalyticsConsent\.status\(\)!=="granted"/);
  assert.match(html, /\/browser\/challenge-hub\/ga4-signup\/claim/);
  assert.match(html, /event:"cas_ga4_challenge_signup_ready"/);
  assert.match(html, /ga4_event_name:"challenge_sign_up"/);
  assert.match(html, /event_id:result\.event_id/);
  assert.match(html, /challenge_cohort:result\.challenge_cohort/);
  const ga4Push = html.match(/window\.dataLayer\.push\(\{\s*event:"cas_ga4_challenge_signup_ready"([\s\S]*?)\}\);/)?.[0];
  assert.ok(ga4Push);
  assert.doesNotMatch(ga4Push, /email|phone|magic|token/i);
});

test("Ella's current Challenge round remains the active cohort", () => {
  assert.match(html, /id:\s*"c1-nov-2026"/);
  assert.match(html, /selectRound\(result\.tag \|\| result\.round \|\| ""\)/);
});

test("Ella's AddEvent calendar remains wired to the current calendar", () => {
  assert.match(html, /https:\/\/www\.addevent\.com\/calendar\/yw2557c2xbsj/);
});

test("Ella's quest completion reporting remains present", () => {
  assert.match(html, /function reportQuest\(n\)/);
  assert.match(html, /reportQuest\(n\)/);
});

test("Hub authentication and the existing signed-link flow remain present", () => {
  assert.match(html, /\/browser\/challenge-hub\/session/);
  assert.match(html, /credentials:\s*"include"/);
  assert.match(html, /authState===\s*"hub"/);
});
