# Re-syncing Philippe's server changes

Philippe is still editing `index.html` directly on the live server, so the server is ahead of git in ways git cannot see. Run this before the final push to pull his latest in.

```bash
git fetch origin
git checkout philippe-live-snapshot
curl -s -L "https://hub.clientattractionsummit.com/?cb=$RANDOM" -o index.html
git commit -am "Snapshot: live server file $(date +%F)"
git merge main            # brings the content/design work back on top
```

Git merges this cleanly because both sides descend from `6c682f5`. It has been done once already with no conflicts.

**Then check these four before deploying**, since they are where the two sides touch the same code:

1. `render()` — his auth state machine wraps my routing. The `authState==="loading"` branch must still paint the "One moment" screen rather than a blank page.
2. `vLogin()` — his verification copy, my layout.
3. `wire()` — his async login handler replaced my demo one.
4. `bootstrapAuth()` — the review fallback at the end must survive, or the review URL becomes a login screen nobody can pass.

## Why the review URL still works

The auth service cannot answer a `github.io` origin, so without a fallback the review URL would be an unpassable login screen. `bootstrapAuth()` falls through to review mode **only** when `showReview` is true, which is the same check the review tools use: localhost, any `*.github.io`, or `?review=1`.

On a real host that branch is unreachable. Production auth is untouched.

## Audit, 2026-09-01

Every function exercised in a browser on the merged file. All passing:

routing and all views · day locking and `unlockAll` · Day 1's own Quest format · Day 8 Finale (no Quest, no ticket, excluded from the denominator) · Quest steps · Golden Tickets · `localStorage` under `thriveHub_c4` · replay gate (verified both sides of the cutoff) · toast · copy-to-clipboard · submission writing to `progress` · sign out · review tools present on review hosts and removed elsewhere. No JS errors on any route.

Two things found and fixed:

- **The loading state was a blank white page** while the session call resolved. On a slow connection that reads as broken. It now shows a branded "One moment" screen. Presentational only; his auth logic untouched.
- The review URL was unusable against the auth service. Fixed by the gated fallback above.

One thing noted and **not** changed, because Philippe is mid-flight:

- `bootstrapAuth()`'s `fetch` has no timeout. It fails fast today, but if the session service ever hangs rather than errors, `authState` stays `"loading"` indefinitely. The new loading screen means users see something branded rather than white, but they would still be stuck. Worth an `AbortController` on his side.
- Every checkbox tick re-renders the whole view. Harmless at human speed; it only shows up under automated fast clicking.
