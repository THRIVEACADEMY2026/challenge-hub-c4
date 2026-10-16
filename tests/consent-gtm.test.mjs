import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const loader = html.match(/<!-- Google Tag Manager -->\s*<script>([\s\S]*?)<\/script>/)?.[1];
if (!loader) throw new Error("Consent-gated GTM loader was not found");

function runLoader({ stored = null, pathname = "/" } = {}) {
  const storage = new Map();
  if (stored) storage.set("thriveHub_marketing_consent", stored);
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

test("ordinary Hub visits do not load GTM before explicit consent", () => {
  const result = runLoader();
  assert.equal(result.inserted.length, 0);
  assert.equal(result.context.dataLayer, undefined);
  assert.equal(result.context.thriveHubMarketingConsent.status(), "denied");
});

test("Magic Link visits do not load GTM without explicit consent", () => {
  const result = runLoader({ pathname: "/m/example-magic-link" });
  assert.equal(result.inserted.length, 0);
  assert.equal(result.context.dataLayer, undefined);
});

test("an explicit decline persists and keeps GTM unloaded", () => {
  const result = runLoader();
  result.context.thriveHubMarketingConsent.deny();
  assert.equal(result.storage.get("thriveHub_marketing_consent"), "denied");
  assert.equal(result.inserted.length, 0);
});

test("an explicit grant loads the existing GTM container exactly once", () => {
  const result = runLoader();
  result.context.thriveHubMarketingConsent.grant();
  result.context.thriveHubMarketingConsent.grant();
  assert.equal(result.storage.get("thriveHub_marketing_consent"), "granted");
  assert.equal(result.inserted.length, 1);
  assert.equal(
    result.inserted[0].src,
    "https://www.googletagmanager.com/gtm.js?id=GTM-W3NJN7NZ",
  );
  assert.equal(result.context.dataLayer.length, 1);
  assert.equal(result.context.dataLayer[0].event, "gtm.js");
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
});

test("invalid consent values fail closed", () => {
  const result = runLoader({ stored: "yes" });
  assert.equal(result.inserted.length, 0);
  assert.equal(result.context.thriveHubMarketingConsent.status(), "denied");
});

test("the privacy UI has explicit allow and decline controls", () => {
  assert.match(html, /id="privacyAllow"/);
  assert.match(html, /id="privacyDecline"/);
  assert.match(html, /Marketing tracking stays off unless/);
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

test("marketing consent grant resumes the bridge without a page reload", () => {
  assert.match(html, /typeof w\.thriveHubClaimMetaLead==='function'/);
  assert.match(html, /window\.thriveHubClaimMetaLead=claimChallengeMetaLead/);
});
