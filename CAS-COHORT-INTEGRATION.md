# Isolated CAS cohort integration — C2C3-17B

Development only. No release or production mutation is authorized by this branch.

## Baselines and retained history

Hub base `83ee952` is the exact origin HTML verified in C2C3-17A (SHA256 dc23405620786ce02638d7e0b62fea5aa9b3c320ea8a643a7866aff1e9a66f31). It already incorporates Ella's `9989131` three-round selector, `a2b638b` November roll-forward, `fae2608` Quest-start release, `90efc97` automatic unlock, and `ee3f95d` C1 Quest links. No cherry-picks or main merge were needed. GitHub main contains preview/theme changes absent from production; these are intentionally excluded. CAS tracking, consent, /entry handoff and authentication changes present in the production snapshot are retained.

Companion Worker branch has the same name, `feature/cas-hub-cohort-integration`, based on deployed source `ad37d2d463d380baa7df5001ccefaf843f6ee6d4`. Both branches are local only. No remote branch is published.

## Contract

Existing login and session JSON gains `hub_cohort: {challenge_cohort_id, round} | null`. Existing authorization, CSRF/session tokens, name/email and conversion-routing fields retain their meanings. A cohort is returned only after existing generic membership authentication. The read-only resolver uses the existing canonical-contact reconciliation and active D1 enrollments, folds superseded contact IDs, and requires exactly one distinct supported cohort. No supported active enrollment or multiple supported active cohorts return null. Historical unsupported cohorts do not prevent selection of one supported active enrollment. No person_key is regenerated or exposed; no new identity or enrollment is written by this resolver. Login's existing identity-binding side effects remain unchanged.

Hub maps only C1/C2/C3 canonical IDs to Ella's existing round keys and validates the returned key. GHL tags, query parameters, localStorage and browser date cannot supply an authoritative cohort. This does not make a compromised browser a security boundary. Unknown/missing cohort clears selected days and prevents authenticated Hub rendering. Existing display design and date-lock rules remain: tabs 09:00 Pacific; Quests 09:50 Pacific. The C1 AddEvent backup remains C1-only. Other cohorts display their dates and continue using the already-existing calendar invitations.

## Replay configuration

`HUB_REPLAY_CUTOFFS` is keyed by canonical Challenge cohort. C1 retains November 8, 2026 at 21:00 Pacific. C2 ordinary-day cutoff is November 22, 2026 at 21:00 Pacific; C3 is January 10, 2027 at 21:00 Pacific. These follow the same established Sunday policy and do not inherit C1. Unapproved configuration displays a pending availability message after the session, rather than showing an expired C1 date or granting an indefinite replay window. Existing per-day Finale overrides are preserved from the baseline. Permanent Replay Magic Links and attribution are unchanged. The existing Finale overrides remain November 15 (C1), November 29 (C2), and January 17 (C3), all 21:00 Pacific. Policy evidence: WORDPRESS.md:46 and README.md:108,131, corroborated by C1 index.html configuration. C1 Friday November 6 session ends 11:00 Pacific; Sunday November 8 cutoff is 58 hours later. C2 Friday November 20 and C3 Friday January 8 both use the same 58-hour interval in America/Los_Angeles (PST, UTC−08:00).

## Resource authorization boundary

The inspected live architecture serves a static Hub and uses CAS for authentication, tracking and link redirection. No distinct CAS-hosted cohort-exclusive media route was identified. Quest posts and replay destinations fall back to the intentionally shared Facebook Group; playbooks/art and Zoom remain shared as configured. No new restrictions are applied to Facebook or Zoom, and blank Quest posts remain valid. Client date locks and replay expiration remain presentation rules. This branch does not claim server-enforced confidentiality for URLs shipped in static HTML. If a specific CAS-hosted resource is designated exclusive, identify its route and entitlement policy before release and enforce access on that resource; do not infer exclusivity from the UI.

## Future controlled deployment plan — NOT EXECUTED

1. Replay cutoffs are derived and configured under the existing policy; Finale overrides are unchanged. No existing CAS-hosted media resource was designated cohort-exclusive in the inspected contract. Multiple supported cohorts deliberately fail closed: no verified cohort selection context exists in current visitor/session, permanent-link, or /entry contracts. No newest-enrollment policy is inferred. If access for ambiguous participants is required, an approved verified-context contract is necessary; do not add it implicitly. Read-only production preflight must establish that every intended C1 user has one supported canonical active enrollment. Do not backfill or invalidate sessions implicitly.
2. Refresh production drift evidence and deployment authorization. Cloudflare metadata was unavailable (401) during 17A; development uses its previously verified deployed source. Reconcile any later production changes before release. Record current Hub files, Worker version, flags and rollback artifacts.
3. Review and approve the two isolated commits together. No D1 migration, new environment variable, secret change, DNS change, session-key rotation or GHL publication is required. No Google/canary/bulk flags should change.
4. Deploy the additive Worker contract first in a controlled window. The old Hub ignores the extra field and continues its old selection behavior until the coordinated Hub release. Validate one authorized synthetic existing-session and login path per cohort, plus unauthorized/ambiguous cases; do not make real-participant changes. Confirm C1 identity, cookie and CSRF continuity.
5. Publish the reviewed Hub artifact only after the Worker returns the contract. Include the existing /entry files unchanged. Validate C1 normal behavior; C2 November 3 and C3 November 17 simulations; unknown-cohort denial; tab/Quest timing; approved replay cutoffs; permanent links; attribution; calendar controls; consent-gated tracking. Do not activate Google Ads or C2/C3 controls as part of this release.
6. Monitor auth errors, unresolved enrollments and C1 signals. Existing valid sessions need no invalidation or migration; restored sessions acquire cohort through the existing endpoint. Missing enrollment is a readiness blocker, not permission to create a new identity.

## Rollback — NOT EXECUTED

Restore the exact pre-release Hub artifact first, then roll back the Worker if necessary. The new Hub requires the new contract and should never remain paired with the old Worker. No database rollback or session invalidation is needed because this change adds only reads and response fields. Restore the captured current pre-release baseline, not a stale version if production has moved. Confirm /entry, C1 sign-in, links and tracking; preserve all release controls. The old Hub's known cohort fallback limitation returns after rollback and must be reported.

## Validation

Run `node --test tests/*.test.mjs` for Hub. Run `npm run typecheck` and `npm test -- --reporter=dot` in the companion Worker. Synthetic fixtures use local example.invalid identities; no production tokens or contacts are used. No public preview was created. A local VM exercises exact page functions and restoration without contacting CAS or loading trackers. Full suites cover existing identity/security, permanent links, attribution, GHL, calendar and reporting behavior. These are local regression results, not live delivery or reporting-pipeline certifications.


## C2C3-17C resource inventory and enrollment findings

| Resource | Classification | Existing authorization / treatment |
|---|---|---|
| Hub shell, artwork, welcome/hero videos | Shared, CAS-controlled static content | Public static delivery; authenticated rendering and client date locks; no claim of media confidentiality |
| Per-round dates, day metadata and replay windows | Cohort-specific presentation, CAS-controlled | Server derives selected cohort from canonical active D1 enrollment; Hub validates mapping; metadata remains static |
| CAS /session, /login, /logout, /readiness | Shared identity services | Existing membership, visitor binding, allowed origin and CSRF contracts retained; cohort response is server-derived |
| CAS Meta/GA4/Google claim and dispatch endpoints | Shared tracking services | Existing server identity/conversion authorization retained; no content access permissions added |
| Five permanent /m/:token destinations | Person-specific CAS redirect authorization | Existing token/contact policies retained; replay destination additionally validates membership; no cohort claim or token rotation introduced |
| /entry | Shared CAS-controlled handoff | contact_id is correlation only, checked against bound identity; does not authenticate cohort |
| Quest posts / shared Facebook Group | Externally controlled, intentionally shared fallback | Facebook controls access; blank post configuration remains valid |
| Zoom | Externally controlled, existing shared behavior | Existing Zoom access preserved, no new restrictions |
| giftfromthrive playbooks | Externally hosted shared destinations | Shared URLs retained |
| Vimeo / Facebook recordings | Externally controlled, per-day availability | Existing embeds/links retained; provider authorization not claimed |
| C1 AddEvent backup | Externally controlled, C1-specific presentation | C1-only button retained; C2/C3 use existing invitations |
| Apps Script log endpoint | Externally controlled shared operational service | Existing endpoint retained |
| Injected quest/chat/replies/tickets endpoints | Unknown runtime configuration; potentially external | Blanks/defaults preserved; exclusivity not established; review actual configured service if sensitive resources are designated |

The existing enrollment uniqueness key is (canonical_ghl_contact_id, challenge_cohort_id), so cross-cohort active enrollments are structurally legitimate. Registration persistence does not establish a newest-wins Hub contract. Supersession maps identities, not cohorts. The resolver keeps historical enrollment records unchanged and filters supported Hub rounds after canonical identity resolution.

A positively verified cohort-specific session cannot be exercised because no such context exists in the inspected current contract: signed assertions contain visitor_key, issue/expiry time and nonce; visitor records contain contact identity; permanent links carry person/destination identity; /entry supplies only a correlation contact ID. Tests confirm existing signed tokens do not carry cohort claims and arbitrary query context cannot override D1. Multiple supported enrollments therefore fail closed even if arbitrary client context is present. Adding a cohort selector or new token type is outside this prerequisite phase.

Release readiness: local prerequisites pass. No replay-policy or shared-resource business approval remains necessary under the existing inspected contract. Serving ambiguous multi-enrollment users requires a future approved verified-context policy only if that experience is required; current safe behavior is denial. Production enrollment coverage/drift checks and separate deployment authorization remain release gates. Runtime injected endpoint exclusivity remains unverified, not evidence of a known authorization defect. No D1 migrations, production changes, deployments, pushes or merges were performed.
