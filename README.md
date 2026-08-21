# Challenge Hub, C4 (September 7 to 11, 2026)

The content control centre for the Book 5 Consults in 5 Days Challenge.

**Live:** https://thriveacademy2026.github.io/challenge-hub-c4/

One responsive page. Desktop gets a sticky day-nav sidebar plus a two-column day layout; mobile collapses to a single column with the day list inline. Same file, no separate mobile build to keep in sync.

## The design basis

Sharla called the first version off-brand and she was right. This one is built to specs **measured off the live thrive-academy.com**, not interpreted from the guide. The live site is the brand in market.

| | Live site | What this build uses |
|---|---|---|
| Display type | Raleway **200**, 66-80px, ~1px tracking | Raleway 200, clamp(36px, 5.4vw, 66px) |
| Eyebrow | Oswald **300**, letter-spacing **11px**, uppercase | Oswald 300, 9px tracking |
| Buttons | Oswald **400**, letter-spacing **5px**, transparent, 1px border, 0 radius | identical |
| Corners | 0px on every button | 0 globally |

The single biggest earlier error was type weight. The guide says "Title, Raleway Semibold". The live site actually ships weight **200**, and that lightness is most of what makes Thrive read as high-end. The first build used semibold with heavy uppercase Oswald throughout, which read as a funnel page.

Other corrections: photography was missing entirely, so the page had no Thrive warmth in it. Sharla's image now anchors the hero. Bordered cards were replaced with whitespace and hairline rules.

**No navy grounds at all.** Sharla ruled out the dark navy look entirely, so every band on this page is light. The hero and Summit bands use barely-there light washes rather than flat white, so the page still has depth. Navy appears only as type. The gold gradient carries premium emphasis on the Summit band and the Golden Ticket.

**Sharla's photo is a cutout.** The source image (`sharla-glitter-ig.png` in the C3 repo) sits on a solid `#00AEEF` block, which read as a pasted-on square. `sharla-cutout.png` was produced by an edge-connected flood fill, not a global colour key, so her turquoise hat and top survive; the fringe was then despilled. Alpha-transparent, so it drops onto any background.

Editorial rules that still hold: the Hub is where you learn, the Facebook Group is where you do; the Group is never named as a place to watch anything; the word "replay" is not used.

## What works

- Magic-link login, plus manual email entry with a real error state
- Day locking, with locked days visible but not clickable
- Two states per day: before the live (countdown, Join Zoom) and after (video, Quest)
- Quest step tracking with Golden Tickets, persisted in `localStorage`
- Day 1 uses its own Quest format (Compelling Consult Name), not the four-step one
- Copy-to-clipboard for the registration email, for the Facebook Group join question
- Non-Facebook submission path for Days 1 to 5

## Wired to real URLs

Playbooks (all 5 verified live), Quest posts (`giftfromthrive.com/day1` to `day5`), and the September Summit order page.

**The Zoom join link is deliberately not in this repo.** It carries an embedded `?pwd=` password, so committing it to a public repo would let anyone read it from source and join the live session. The `ZOOM` constant is a placeholder and the Join button says so. Inject the real link server-side behind the magic-link gate, or paste it only into a private production build.

## Before launch

1. **Delete the review tools.** Remove the `<div id="rev">` block, its CSS section, and the review-tools script section at the bottom. All three are clearly marked. They sit in a collapsed panel in the bottom-right corner, not at the top of the page.
2. **Supply the Facebook Group URL.** The `FBGROUP` constant is a placeholder; the field is blank in both the Aug 17-23 and Sept 7-13 Notebooks.
3. **Swap the video placeholders** for the real embeds. Use Fathom immediately after each session rather than waiting for the Zoom render.
4. **Replace the Quest post URLs** with the direct Facebook post URLs if we want the "ugly" URLs Sharla asked for. The pretty URLs work today.
5. **Wire the login** to real registrant data. `REGISTERED` is a demo allowlist.
6. **Point the submission form** at a real endpoint.
7. Sharla to approve the Summit block wording. Price and scholarship framing are deliberately absent.

`noindex,nofollow` is set, matching C3.
