# Verified production deployment contract — 29 October 2026

The authoritative known-good checkpoint is the annotated tag
`cas-entry-known-good-2026-10-29` in this repository and in
`philippe-zbl/cas-identity-worker`. Resolve each tag to its commit; do not move or replace either tag.
See `releases/cas-entry-known-good-2026-10-29/deployment-manifest.json` for the exact Worker commit.
This branch preserves source; pushing it or its tag does not publish Apache or Cloudflare.

## Current production

Apache serves static files from `/opt/github/apps/challenge-hub/htdocs` on the existing SSH origin.
Cloudflare may transform public HTML. Compare origin files directly, not a reconstructed public response.
The exact 29 runtime files are listed in the release frontend-sha256.json; they include Hub index,
entry HTML/JS, robots.txt and all image/video assets. Git-only tests/docs are not public deployment assets.
Server housekeeping files, old recovered HTML, deploy.sh, preflight.sh and sync-fork.yml are not runtime
assets and are not part of the build allowlist. config.js is not present on the origin; do not invent it.

ENTRY-12 was released by explicit, hash-gated SSH staging and atomic replacement of exactly three files:
entry/handoff.js, entry/index.html and index.html, in that order. It preserved owner/mode, backed up originals,
and did not restart or reconfigure Apache. The historical scripts and rollback metadata are preserved in
this release directory as evidence, not as a reusable deployment command: their paths and old hashes
are specific to ENTRY-12. Do not execute them against current production without a separately reviewed release.
The old server deploy.sh performs a live-page merge and Git push; it is not the verified ENTRY-12 process.
Do not use it to overwrite this release or enable an automatic publish route.

Giveaway signing is a separate GHL page-level header integration. Exact source and deployed header bytes
are in integrations/giveaway/. The historical adapter comment about deployment predates release and is
retained to preserve exact deployed bytes. Both configured public aliases were reverified. No global
tracking or other signup page was changed. Its predecessor header was empty; any future rollback must
first confirm that the current header still matches this release and must touch that page header only.

## Reproduce without publishing

Use Node >=22. Run `node scripts/build-known-good.mjs /tmp/cas-known-good-build`,
`node scripts/validate-entry-assets.mjs`, `node --test tests/*.test.mjs`,
and `node --test integrations/giveaway/guard.test.mjs`.
The build verifies the origin asset hashes, copies only the runtime allowlist and verifies that the
readable Giveaway module regenerates its exact published inline artifact. No frontend compiler or
new CI service is required. Existing entry-integrity workflow runs checks only.
Worker instructions, applied migration ledger, schema-only checkpoint, runtime config, public SDK
assets, secret binding NAMES and exact deployment bundle are in the coordinated Worker tag.
No credentials, contact exports, authentication cookies or incident data-repair SQL are part of this release.

## Smallest future workflow

Development branch → PR/review → validated local build → new immutable annotated release tag
→ explicitly authorized coordinated release with separate Worker and Apache stages → production canary
→ component-specific rollback on failure. Never deploy by resetting a shared worktree or copying a whole
repository to the origin. Never use rsync --delete. Refresh origin and Worker baseline hashes immediately
before any deployment; stop on concurrent drift. Stage only approved changed assets, verify checksums,
back up with metadata, replace atomically and verify origin bytes. GHL changes require their own scoped approval.

Canaries cover all five signup sources, canonical authoritative cohort, automatic /entry/ redirect,
first and returning Hub authentication, browser-owner isolation, denied invalid identity, unchanged
permanent links and attribution, no duplicate enrollment or conversion replay, synthetic reporting
exclusions and Google activation flags OFF. Keep reporting scheduler PAUSED and Release B HOLD.

## Rollback and Summit isolation

To restore this checkpoint after a future frontend release, build this immutable tag and use the same
reviewed hash-gated atomic process against the freshly verified future baseline. Do not blindly run
an older rollback over concurrent frontend work. The previous ENTRY-12 backup remains at
`/opt/github/apps/challenge-hub/releases/entry-incident-12-20261029T014318Z` and its hashes were verified.
Worker history retains current version `492ceae6-d26f-4e2c-ba7c-72c7c511e41d` and previous
`ac684ca6-11e3-45a6-b3f8-22d84e2998f7`; rollback is separate from Apache and never implies a D1 restore.
Append-only enrollment and classification history must be retained.

Summit PAY-28 must branch from this tag's exact resolved Hub commit and from the exact Worker preservation
commit in deployment-manifest.json. Keep claim.clientattractionsummit.com migration and CAS integration
on separate Summit branches. No Summit merge, DNS change or deployment occurs in this phase.
