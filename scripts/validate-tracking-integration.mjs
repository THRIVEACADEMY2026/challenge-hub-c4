import { readFile } from "node:fs/promises";

const target = process.argv[2] ?? new URL("../index.html", import.meta.url);
const html = await readFile(target, "utf8");

const required = [
  ["GTM container", "GTM-W3NJN7NZ"],
  ["Consent Mode defaults", "gtag('consent','default'"],
  ["marketing consent control", 'id="privacyAllow"'],
  ["analytics consent control", 'id="analyticsAllow"'],
  ["Meta authorization claim", "/browser/challenge-hub/meta-lead/claim"],
  ["GA4 authorization claim", "/browser/challenge-hub/ga4-signup/claim"],
  ["Meta dataLayer event", 'event:"meta_lead_dedupe_ready"'],
  ["GA4 dataLayer event", 'event:"cas_ga4_challenge_signup_ready"'],
];

const missing = required.filter(([, marker]) => !html.includes(marker));
if (missing.length) {
  for (const [label] of missing) console.error(`Missing required tracking hook: ${label}`);
  process.exitCode = 1;
} else {
  console.log(`Tracking integration validation passed: ${required.length}/${required.length} hooks present.`);
}
