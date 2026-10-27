# C2C3-22 — temporary C1 preservation approval candidate

Status: READY FOR ACCESS-MITIGATION APPROVAL. Policy ships disabled. No production writes/deployment/enablement is authorized or executed. Existing C2/C3 assignment and enrollment pipelines are unchanged.

## Selected solution and scope

Use the existing Hub authentication and canonical D1 resolver with a strictly bounded C1 entitlement exception for the exact 13 entries in `src/config/challenge-hub-c1-preservation.ts`. These are P01,P02,P05,P06,P07,P08,P11,P12,P13,P14,P15,P16,P17 from the retained risk assessment. The public summary uses aliases; the reviewed local manifest contains their exact canonical keys. There are no wildcard, tag, domain or email-pattern rules. Do not add other identities implicitly.

The normal authoritative enrollment path runs first. A unique supported active enrollment always selects its own cohort. Multiple supported enrollments fail closed. Only zero supported active enrollments can enter preservation. The existing route must already have authenticated/bound the contact and verified generic Challenge membership. The resolver maps to canonical identity, requires exactly one allowlist entry, existing canonical contact and membership, no canonical supersession, no known C1 synthetic classification, no supported active enrollment (rechecked in the gate), a fixed policy ID and finite server-time expiry no later than the hard C1 ceiling.

The upper bound is **2026-11-15 21:00 America/Los_Angeles** (2026-11-16 05:00 UTC), the existing last C1 Finale replay cutoff. Ordinary C1 Days 1–5 still close November 8 at 21:00; the exception does not extend their replay availability or unlock dates. No automatic extension exists. The policy cannot set a later deadline without changing the hard ceiling in separately reviewed source. Existing enrolled C1 participants do not acquire this expiration; their current behavior is preserved.

A temporary result returns C1 only, with `access_basis`, `policy_id` and `expires_at`, never C2/C3. It creates no enrollment or identity and writes no D1, GHL, calendar, attribution or tracking records. Enabled grants emit a structured Worker audit log containing only policy ID, stable case reference and deadline, without raw contact IDs/emails/tokens. The policy source, exact manifest, reviewed commit and logs make grants auditable. This is an explicitly proposed entitlement exception, not a claim that these people have authoritative enrollment or proven genuine status.

The Hub consumes the existing `hub_cohort` object. Temporary sessions validate scope/deadline metadata, expire their rendered view at the cutoff and refresh the existing session endpoint at most once per minute while temporary access is active. Server policy revocation, synthetic classification or new conflicting enrollment therefore stops future grants; an online open tab is updated on its next check. Suspended/offline tabs cannot be remotely erased, but perform no new successful server authorization; upon resume the deadline/revalidation applies. Identity cookies are never invalidated by the policy. A later authoritative enrollment replaces temporary access without a new identity. Normal participants do not acquire periodic polling.

Static Hub content and intentionally shared external URLs remain under the pre-existing presentation/resource model. This change prevents the policy from selecting C2/C3; it does not claim that static HTML or Facebook/Zoom resources become confidential. No broad resource authorization redesign is introduced.

## Thirteen-case evidence / current impact

Fresh read-only checks show all 13 have exactly one active email identity match, direct generic membership and at least one bound browser record. All 13 pass the proposed canonical/member/synthetic/conflict gate. This establishes current authentication eligibility, not possession of a live browser cookie; no login/redemption request was executed against production. Their existing access depends on generic membership. The previous strict candidate would return no round for them; the proposed exception, if explicitly approved/enabled, preserves C1 only for the bounded window. The confirmed synthetic P03 and three nonblocking F cases are excluded.

Seven (P02,P06,P08,P12,P15,P16,P17) have exact existing verified native C1 registration records before enrollment migration 0029. The established normal enrollment contract requires a verified native submission, trusted form and bound canonical identity; independent external proof of human realness is not an additional enrollment prerequisite. These seven are bounded repair candidates under that existing contract, without declaring them genuine or discarding synthetic evidence. Exact original form/funnel/payload fields must be rehydrated before any executable repair; they must not be invented from GHL tags. No permanent repair was executed or selected here. The candidate repair manifest records existing IDs/timestamps and missing execution prerequisites.

The other six have corroborating C1 context but no inspected verified native CAS registration. Tags/activity alone cannot justify permanent enrollment. Synthetic provenance remains unresolved for these cases; no genuine classification is manufactured.

## Options compared

| Option | Coverage and evidence | Production action | Tradeoff / rollback | C2 impact |
|---|---|---|---|---|
| A: bounded enrollment repair | 7 native-registration candidates after exact payload reconstruction; cannot alone cover other 6 | Approved enrollment-only D1 writes; no side-effecting service replay | Permanent entitlement must be justified; preserve synthetic evidence/classification; guarded rollback only for receipt-proven new rows | Alone leaves 6 current-access risks |
| B: exact temporary C1 preservation — SELECTED | All 13 existing authenticated canonical members under explicitly approved access policy | Reviewed Worker/Hub release and explicit local policy enablement; no enrollment writes/migration | Potential temporary access for unidentified synthetic cases is bounded to the existing 13 and C1 deadline; known synthetic rows rejected. Disable policy/redeploy; no data rollback | Separates C1 continuity from November 2 C2 acquisition |
| C: deploy prior strict candidate unchanged | Enrolled C1 safe, all 13 lose generic-only access | Existing coordinated release | No exception but credible participant exclusion remains; old live Hub cannot solve C2 routing | Leaves material risk; retaining old Hub leaves wrong C2 fallback |

B is the smallest complete option: one narrow policy in existing auth flow, a small expiry/revalidation addition to the existing Hub, no permanent uncertain enrollments, and no D1 recovery operation. A plus a six-person temporary policy would require both source release and data repair, with no continuity advantage for this immediate release. Temporary preservation is not automatically safer in general; it is appropriate here only for the reviewed existing identities, bounded scope and explicit approval.

## Approval and controlled release — NOT EXECUTED

Approval must explicitly accept: exact 13 canonical identities; temporary C1-only access despite unresolved provenance; possible temporary access for an unidentified test identity; fixed Finale ceiling and unchanged earlier ordinary-day replay cutoff; no C2/C3 entitlement, permanent enrollment or delivery side effects. Approve enabling this exact policy separately from deployment. Current `enabled:false` is deliberate and does not itself remove the old release blocker.

After policy approval: set only `enabled:true` on the reviewed existing branch, record a new reviewed commit, rerun focused enabled-policy and normal regressions, refresh exact-identity preflight/production drift, then obtain separate controlled deployment approval. Do not silently modify the identity list or deadline. Do not push/merge/deploy as part of C2C3-22.

Use Worker-first release, validate ordinary C1/C2/C3 and scoped responses, then publish the matched Hub artifact. Existing Worker/Hub secrets, deployment routes, Google false flags, C2/C3 bulk zero and dated future-auto gates must remain unchanged. No D1 migration or GHL workflow change. C2 future-auto can dispatch after its pre-existing November 2 19:00 UTC release even while bulk=0; the Hub must be coordinated so new C2 participants do not see old C1 fallback.

## Deterministic rollback

Immediate exception-only rollback: set `enabled:false` and redeploy the reviewed Worker after authorization. Subsequent authorization cannot use the exception; active online temporary tabs revalidate within one minute. Do not invalidate cookies or alter membership/enrollment. Existing enrolled C1/C2 users remain on their normal paths. Ordinary replay timers remain unchanged.

For full release rollback: restore the captured pre-release Hub first, then the captured Worker version (currently c68155a0-7bfd-4153-be8b-a2d1f6c17cc8) after rechecking drift. Preserve existing /entry/assets. Validate health, identity/session, links, tracking and release controls. No database rollback is necessary. The restored old Hub has its documented date-fallback limitation, which must be reported. Worker source, Hub hashes and rollback archives remain captured in prior release packages.

## Validation

Full Worker and Hub suites plus exact source-SQL gate fixtures cover normal C1 and C1+history, native-less allowlisted case, historical-only non-allowlisted denial, known synthetic gate rejection, missing member/identity, stale identity, ambiguous/conflicting supported cohorts, unknown person, anonymous session, exact expiry, no extension, deterministic repeat, C2 precedence and forged cohort requests. Hub tests cover metadata rejection, UI expiry and server revocation/enrollment promotion. Read-only actual-identity preflight evaluates all 13 gate predicates without enabling the policy or authenticating a real browser. Existing tests preserve first-touch, link/calendar/RSVP, GHL, Meta/GA4/reporting and handoff behavior. No test claims that source-visible static assets are newly server-protected.
