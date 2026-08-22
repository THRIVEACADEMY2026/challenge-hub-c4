# Challenge Hub, C4 (September 7 to 11, 2026)

The content control centre for the Book 5 Consults in 5 Days Challenge.

**Live:** https://thriveacademy2026.github.io/challenge-hub-c4/

One responsive page. Desktop gets a sticky day-nav sidebar plus a two-column day layout; mobile collapses to a single column with the day list inline. Same file, no separate mobile build to keep in sync.

## Layout

**Welcome page and inside are deliberately different.**

- **Welcome page** (signed out): the Summit banner composition, full bleed. Sharla left, centred type, Jesse right, navy strip across the foot with the two of them standing in front of it. Warm neutral ground.
- **Inside** (signed in): the sidebar layout. That is the working part of the product and it does not carry a hero.

**The sidebar layout is the design.** Persistent left nav with the five days, Golden Ticket progress and the Concierge block; content on the right. That was settled early and it stays. On mobile the sidebar drops and the day list appears inline on the Hub.

The branding below is applied *on top of* that layout. It does not change it.

## The branding

Palette sampled off the Client Attraction Summit banner and the live thrive-academy.com, not interpreted from the guide.

| | Value | Role |
|---|---|---|
| Ground | `#DAD6DA` | masthead and sidebar |
| Band | `#1A325C` | navy as a **strip**, never a background field |
| Accent | `#00AEEF` | highlighted words in the strip |
| Buttons | `#044470` | filled; outline buttons are `#1A325C` hairline |

- **Display type is Raleway 200**, not semibold. The live site ships weight 200 and that lightness is most of what makes Thrive read as high-end.
- **Buttons are Oswald 400 at 5px tracking**, 1px border, square corners, matching the live site exactly.
- **Labels are Oswald 300 at 6 to 8px tracking.** The wide tracking is the brand signature.
- Navy appears as the strip under the masthead and as type. Never as a page background - that is the distinction Sharla was drawing.
### The welcome page uses b-roll, not cutouts

Cutouts kept getting cut. Footage does not. The welcome page now runs real b-roll of Sharla working at her desk, so **nothing of her is ever cropped, covered or pasted** - the frame simply shows what the camera saw.

- Source: `SharlaTealDesignDress 9-11 s laugh.MOV`, from the **Sharla B-roll Mar-Jun 2026** folder. That folder is the professional shoot and it is a different class of footage from the phone clips; shot 1920x1080 at 60fps with real depth of field. Her dress is brand teal, which is why this clip in particular works.
- Cut `crop=1470:674:450:20` to **2.18:1**, matching the hero's own aspect so the browser barely crops it, and shifted right so she sits about a third in, leaving the right for the copy. 6 second loop, **480KB**.
- The window is 4.2s to 10.2s. Earlier than that the photographer is visible in shot; later she doubles over laughing and her face leaves frame. The crop keeps 20px of headroom because her head rises as she laughs.
- `hero-poster.jpg` is the still fallback. It shows if the video is slow, blocked, or the viewer has asked for reduced motion.
- **She sits on the left of the frame, so the copy sits on the right.** The scrim is opaque under the words and clears toward her, which is what keeps her visible and the type readable. Flipping one without the other buries her.
- On mobile there is no room to run footage behind the words without burying her face under the scrim, so it becomes its own band above the navy strip instead.
- Reduced-motion viewers get the poster, held. There is also a play nudge on first interaction, because some engines hold muted autoplay until the user has touched the page and a frozen first frame reads as broken.

The transparent portraits `sharla-summit.png` and `jesse-summit.png` are still in the repo and are clean, reusable assets, but nothing references them now.

**Font weights are requested, not assumed.** The stylesheet asks for Raleway 200-600 and Oswald 300-500, matching every weight the CSS actually uses. Worth checking after any edit: if a weight is used but not requested, the browser silently synthesises it from the nearest face and the light display type quietly stops being light. That happened once here and was invisible until measured.

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
