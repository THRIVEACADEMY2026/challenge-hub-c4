# Challenge Hub, C4 (September 7 to 11, 2026)

The content control centre for the Book 5 Consults in 5 Days Challenge.

**Live:** https://thriveacademy2026.github.io/challenge-hub-c4/

One responsive page. Desktop gets a sticky day-nav sidebar plus a two-column day layout; mobile collapses to a single column with the day list inline. Same file, no separate mobile build to keep in sync.

## The rules this is built to

Thrive Brand Guidelines 2024 (Canva, 26pp), plus two standing overrides from Sharla and Ella.

- **Raleway is the primary family. Oswald is the accent family, used sparingly** (subheads, buttons, small labels). Not the other way round.
- **Buttons are `#1D74BD` on light grounds.** Strict rule from the guide.
- Header type `#019ACD`, body text `#636363`, headings Delft Blue `#1A325C`.
- **60 / 30 / 10** colour ratio: white ground, `#019ACD` headers, `#1D74BD` CTAs.
- **90 degree corners everywhere.** `border-radius: 0` is set globally in the reset.
- **No dark navy grounds.** Navy is type only. Premium emphasis comes from the approved gold gradient used as a rule, never a dark panel.
- The Hub is where you learn. The Facebook Group is where you do. The Group is never named as a place to watch anything, and the word "replay" is not used.

## What works

- Magic-link login, plus manual email entry with a real error state
- Day locking, with locked days visible but not clickable
- Two states per day: before the live (countdown, Join Zoom) and after (video, Quest)
- Quest step tracking with Golden Tickets, persisted in `localStorage`
- Day 1 uses its own Quest format (Compelling Consult Name), not the four-step one
- Copy-to-clipboard for the registration email, for the Facebook Group join question
- Non-Facebook submission path for Days 1 to 5

## Wired to real URLs

Playbooks (all 5 verified live), Quest posts (`giftfromthrive.com/day1` to `day5`), the Zoom room, and the September Summit order page.

## Before launch

1. **Delete the review bar.** Remove the `<div id="demo">` block and the review-bar script section at the bottom. It is clearly marked.
2. **Supply the Facebook Group URL.** The `FBGROUP` constant is a placeholder; the field is blank in both the Aug 17-23 and Sept 7-13 Notebooks.
3. **Swap the video placeholders** for the real embeds. Use Fathom immediately after each session rather than waiting for the Zoom render.
4. **Replace the Quest post URLs** with the direct Facebook post URLs if we want the "ugly" URLs Sharla asked for. The pretty URLs work today.
5. **Wire the login** to real registrant data. `REGISTERED` is a demo allowlist.
6. **Point the submission form** at a real endpoint.
7. Sharla to approve the Summit block wording. Price and scholarship framing are deliberately absent.

`noindex,nofollow` is set, matching C3.
