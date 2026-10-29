#!/usr/bin/env bash
# Checks the whole path a paid lead walks, end to end, and says what is broken.
#
# Ella, in #tech-issues on 27 Oct, after conversion dropped over the weekend
# and Gianna found /entry stalling: "I'll automate a test where we can check
# for errors 2x a day." This is that test.
#
# It walks the same road the lead does:
#   the ad's landing page -> /entry -> the Hub -> the sign-in gate
# and checks the things that have actually broken here before: a missing
# asset, a page that loads but is empty, a gate that stops gating, a script
# the page waits on forever.
#
#   ./funnel-check.sh          human output
#   ./funnel-check.sh --quiet  prints nothing when everything passes
#
# Exit 0 = all clear. Exit 1 = something is wrong.

set -uo pipefail
QUIET=0; [ "${1:-}" = "--quiet" ] && QUIET=1
HUB="https://hub.clientattractionsummit.com"
AUTH="https://id.clientattractionsummit.com"
OPTIN="https://apply.clientattractionsummit.com/challenge-optin-fb-ads"
SLOW=4.0          # seconds before we call a page slow
FAILS=(); WARNS=[]; WARNS=()
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/152.0 Safari/537.36"

say(){ [ "$QUIET" = "1" ] || printf '%s\n' "$*"; }
fail(){ FAILS+=("$1"); }
warn(){ WARNS+=("$1"); }

# $1 label  $2 url  $3 expected code  $4 output file
page(){
  local out code tt
  out=$(curl -sL -m 30 -A "$UA" -o "$4" -w '%{http_code} %{time_total}' "$2" 2>/dev/null) || out="000 99"
  code=${out%% *}; tt=${out##* }
  if [ "$code" != "$3" ]; then fail "$1: expected HTTP $3, got $code"
  else
    say "  ok    $1  (${tt}s)"
    awk -v t="$tt" -v s="$SLOW" 'BEGIN{exit !(t+0>s+0)}' && warn "$1 took ${tt}s"
  fi
}

say ""; say "FUNNEL CHECK  $(date '+%Y-%m-%d %H:%M %Z')"; say "============"

# 1. Where the ad money lands.
page "ad landing page" "$OPTIN" 200 "$T/optin"
[ -s "$T/optin" ] && [ "$(wc -c < "$T/optin")" -lt 2000 ] && fail "ad landing page returned almost nothing"

# 2. The handoff page. It stalled on 27 Oct and cost us leads, so check both
#    the page AND the script it waits on. A page that loads while its script
#    404s is a spinner that never stops.
page "/entry" "$HUB/entry/" 200 "$T/entry"
HJS=$(grep -oE 'src="\./handoff\.js[^"]*"' "$T/entry" 2>/dev/null | head -1 | sed 's/src="\.\///;s/"//')
if [ -n "$HJS" ]; then
  page "/entry handoff.js" "$HUB/entry/$HJS" 200 "$T/hjs"
  grep -q 'AbortController\|setTimeout' "$T/hjs" 2>/dev/null \
    || warn "handoff.js has no visible timeout, so a slow reply could hang the page"
else
  warn "/entry does not reference handoff.js any more"
fi

# 3. The Hub itself, and the pieces that have gone missing before.
page "the Hub" "$HUB/" 200 "$T/hub"
for m in "CAS_ORIGIN:sign-in wiring" "logo-navy:masthead logo" "CHALLENGE.rounds:round config" \
         "GTM-:tracking" "thriveHubMarketingConsent:consent gate" "function reportLogin:sign-in log"; do
  grep -Fq "${m%%:*}" "$T/hub" 2>/dev/null || fail "the Hub is missing ${m##*:}"
done

# Every asset the page asks for must exist. The logo 404'd for 27 hours once.
MISS=0
for f in $(grep -oE '(src|href)="[^"#?:]+\.(js|css|png|jpg|jpeg|mp4|ico|svg|webp)"' "$T/hub" \
           | sed -E 's/.*="//;s/"//' | sort -u); do
  # config.js was excluded here until 28 Oct as "known, pre-existing, not a
  # regression". That exclusion is why this check passed four times in a row
  # while the Zoom join link was missing from every day of the Challenge.
  # Nothing gets a pass for being broken a long time.
  c=$(curl -s -o /dev/null -m 20 -w '%{http_code}' "$HUB/$f")
  [ "$c" = "200" ] || { fail "asset $f returns $c"; MISS=$((MISS+1)); }
done
[ "$MISS" = "0" ] && say "  ok    every asset the Hub references"

# 3b. The two links a lead cannot do without. Both are supplied at runtime and
#     both have been empty while every file-level check passed.
ZOOM=$(curl -s -m 20 "$HUB/config.js" 2>/dev/null | grep -c 'THRIVE_ZOOM' || true)
if [ "${ZOOM:-0}" -gt 0 ]; then say "  ok    the Zoom room is configured"
else fail "no Zoom join link: config.js does not supply THRIVE_ZOOM, so the join button is blank on every day"; fi

# An empty href renders as a link that reloads the page. Leads meet these on
# Day 1 after finishing their Quest.
EMPTY=$(grep -c "href=\"\"" "$T/hub" 2>/dev/null || echo 0)
SUMMIT_EMPTY=$(grep -c 'summit:  ""' "$T/hub" 2>/dev/null || echo 0)
if [ "${SUMMIT_EMPTY:-0}" -gt 0 ]; then
  fail "the Summit link is empty, so the Day 1 scholarship link goes nowhere"
else say "  ok    the Summit link is set"
fi

# Step 1 on the pre-Challenge page is "add the Challenge to my calendar".
# AddEvent is somebody else's service and it went into scheduled maintenance
# on 28 Oct, which turns that button into a maintenance page.
AC=$(curl -sL -o /dev/null -m 25 -w '%{http_code}' "https://www.addevent.com/calendar/yw2557c2xbsj")
if [ "$AC" = "200" ]; then say "  ok    the Add to calendar button works"
else fail "Step 1's calendar button is down (AddEvent returns $AC)"; fi


# 4. The gate. Two halves: it must answer, and it must still refuse a stranger.
S=$(curl -s -m 20 -c "$T/j" -H 'Accept: application/json' -H "Origin: $HUB" "$AUTH/browser/challenge-hub/session")
echo "$S" | grep -q 'csrf_token' || fail "the sign-in service did not return a session"
echo "$S" | grep -q "$HUB" >/dev/null 2>&1
CORS=$(curl -s -D- -o /dev/null -m 20 -H "Origin: $HUB" "$AUTH/browser/challenge-hub/session" | grep -ci "access-control-allow-origin: $HUB")
[ "${CORS:-0}" -gt 0 ] || fail "the sign-in service no longer allows the Hub's origin"
# The Hub places a lead in a round only from the cohort the server returns.
# If that field stops coming back, every lead is locked out at once.
echo "$S" | grep -q 'hub_cohort' \
  && say "  ok    the server still returns a cohort field" \
  || fail "the session no longer carries hub_cohort: nobody can be placed in a round"
CSRF=$(printf '%s' "$S" | sed -n 's/.*"csrf_token":"\([^"]*\)".*/\1/p')
if [ -n "$CSRF" ]; then
  RC=$(curl -s -o "$T/deny" -m 20 -b "$T/j" -c "$T/j" -w '%{http_code}' -X POST \
      "$AUTH/browser/challenge-hub/login" -H 'Content-Type: application/json' \
      -H "X-CAS-CSRF: $CSRF" -H "Origin: $HUB" \
      -d '{"email":"definitely-not-registered-'"$RANDOM"'@example.com"}')
  case "$RC" in
    401) say "  ok    the gate still refuses a stranger";;
    200) fail "THE GATE LET A STRANGER IN. Anyone can reach the Hub.";;
    429) warn "the gate is rate-limiting this checker, could not test refusal";;
    *)   fail "the gate answered $RC to a stranger, expected 401";;
  esac
fi

# 5. The sign-in log, so a silent failure does not go unrecorded.
LOG=$(grep -oE 'https://script\.google\.com/macros/s/[A-Za-z0-9_-]+/exec' "$T/hub" | head -1)
if [ -n "$LOG" ]; then
  c=$(curl -sL -o /dev/null -m 25 -w '%{http_code}' "$LOG")
  [ "$c" = "200" ] && say "  ok    the sign-in log is accepting" || warn "the sign-in log answered $c"
else
  warn "the Hub has no sign-in log endpoint set, so nothing is being recorded"
fi

say ""
if [ ${#WARNS[@]} -gt 0 ]; then say "WORTH A LOOK"; for w in "${WARNS[@]}"; do say "  - $w"; done; say ""; fi
if [ ${#FAILS[@]} -eq 0 ]; then say "ALL CLEAR."; exit 0; fi
printf 'BROKEN (%d)\n' "${#FAILS[@]}"
for f in "${FAILS[@]}"; do printf '  - %s\n' "$f"; done
exit 1
