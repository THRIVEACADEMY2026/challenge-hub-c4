# Isolated CAS cohort integration — C2C3-17B

Development only. No release or production mutation is authorized by this branch.

## Baselines and retained history

Hub base `83ee952` is the exact origin HTML verified in C2C3-17A (SHA256 dc23405620786ce02638d7e0b62fea5aa9b3c320ea8a643a7866aff1e9a66f31). It already incorporates Ella's `9989131` three-round selector, `a2b638b` November roll-forward, `fae2608` Quest-start release, `90efc97` automatic unlock, and `ee3f95d` C1 Quest links. No cherry-picks or main merge were needed. GitHub main contains preview/theme changes absent from production; these are intentionally excluded. CAS tracking, consent, /entry handoff and authentication changes present in the production snapshot are retained.

Companion Worker branch has the same name, `feature/cas-hub-cohort-integration`, based on deployed source `ad37d2d463d380baa7df5001ccefaf843f6ee6d4`. Both branches are local only. No remote branch is published.

## Contract

Existing login and session JSON gains `hub_cohort: {challenge_cohort_id, round} | null`. Existing authorization, CSRF/session tokens, name/email and conversion-routing fields retain their meanings. A cohort is returned only after existing generic membership authentication. The read-only resolver uses the existing canonical-contact reconciliation and active D1 enrollments, folds superseded contact IDs, and requires exactly one distinct supported cohort. Missing, unsupported or multiple active cohorts return null. No person_key is regenerated or exposed; no new identity or enrollment is written by this resolver. Login's existing identity-binding side effects remain unchanged.

Hub maps only C1/C2/C3 canonical IDs to Ella's existing round keys and validates the returned key. GHL tags, query parameters, localStorage and browser date cannot supply an authoritative cohort. This does not make a compromised browser a security boundary. Unknown/missing cohort clears selected days and prevents authenticated Hub rendering. Existing display design and date-lock rules remain: tabs 09:00 Pacific; Quests 09:50 Pacific. The C1 AddEvent backup remains C1-only. Other cohorts display their dates and continue using the already-existing calendar invitations.

## Replay configuration

`HUB_REPLAY_CUTOFFS` is keyed by canonical Challenge cohort. C1 retains November 8, 2026 at 21:00 Pacific. C2/C3 ordinary-day cutoffs are explicitly null pending approval; they do not inherit C1. Unapproved configuration displays a pending availability message after the session, rather than showing an expired C1 date or granting an indefinite replay window. Existing per-day Finale overrides are preserved from the baseline. Permanent Replay Magic Links and attribution are unchanged. Approved future changes belong in the reviewed configuration before release.

## Resource authorization boundary

The inspected live architecture serves a static Hub and uses CAS for authentication, tracking and link redirection. No distinct CAS-hosted cohort-exclusive media route was identified. Quest posts and replay destinations fall back to the intentionally shared Facebook Group; playbooks/art and Zoom remain shared as configured. No new restrictions are applied to Facebook or Zoom, and blank Quest posts remain valid. Client date locks and replay expiration remain presentation rules. This branch does not claim server-enforced confidentiality for URLs shipped in static HTML. If a specific CAS-hosted resource is designated exclusive, identify its route and entitlement policy before release and enforce access on that resource; do not infer exclusivity from the UI.

## Future controlled deployment plan — NOT EXECUTED

1. Confirm C2/C3 ordinary-day replay cutoffs, existing Finale overrides, shared-resource policy and any intended exclusive resource. Resolve or approve a policy for people with multiple active cohorts; current integration deliberately denies ambiguous selection. Read-only production preflight must establish that every intended C1 user has one supported canonical active enrollment. Do not backfill or invalidate sessions implicitly.
2. Refresh production drift evidence and deployment authorization. Cloudflare metadata was unavailable (401) during 17A; development uses its previously verified deployed source. Reconcile any later production changes before release. Record current Hub files, Worker version, flags and rollback artifacts.
3. Review and approve the two isolated commits together. No D1 migration, new environment variable, secret change, DNS change, session-key rotation or GHL publication is required. No Google/canary/bulk flags should change.
4. Deploy the additive Worker contract first in a controlled window. The old Hub ignores the extra field and continues its old selection behavior until the coordinated Hub release. Validate one authorized synthetic existing-session and login path per cohort, plus unauthorized/ambiguous cases; do not make real-participant changes. Confirm C1 identity, cookie and CSRF continuity.
5. Publish the reviewed Hub artifact only after the Worker returns the contract. Include the existing /entry files unchanged. Validate C1 normal behavior; C2 November 3 and C3 November 17 simulations; unknown-cohort denial; tab/Quest timing; approved replay cutoffs; permanent links; attribution; calendar controls; consent-gated tracking. Do not activate Google Ads or C2/C3 controls as part of this release.
6. Monitor auth errors, unresolved enrollments and C1 signals. Existing valid sessions need no invalidation or migration; restored sessions acquire cohort through the existing endpoint. Missing enrollment is a readiness blocker, not permission to create a new identity.

## Rollback — NOT EXECUTED

Restore the exact pre-release Hub artifact first, then roll back the Worker if necessary. The new Hub requires the new contract and should never remain paired with the old Worker. No database rollback or session invalidation is needed because this change adds only reads and response fields. Restore the captured current pre-release baseline, not a stale version if production has moved. Confirm /entry, C1 sign-in, links and tracking; preserve all release controls. The old Hub's known cohort fallback limitation returns after rollback and must be reported.

## Validation

Run `node --test tests/*.test.mjs` for Hub. Run `npm run typecheck` and `npm test -- --reporter=dot` in the companion Worker. Synthetic fixtures use local example.invalid identities; no production tokens or contacts are used. No public preview was created. A local VM exercises exact page functions and restoration without contacting CAS or loading trackers. Full suites cover existing identity/security, permanent links, attribution, GHL, calendar and reporting behavior. These are local regression results, not live delivery or reporting-pipeline certifications.
