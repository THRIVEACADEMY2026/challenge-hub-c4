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
### Sharla and Jesse: show them whole

They appear on the welcome page only, cut from the Summit banner as **complete portraits**. Nothing about them is clipped, and that is a rule, not a preference.

- The crop stops 4px above the navy band, so no band pixel and no band shadow enters the file. An earlier crop ran down through the band and left navy artifacts welded to Jesse's shoulder, where his arm walled them off from the flood fill.
- On the page they are **inset from the frame edges**, never bled off them. Verified fully inside the viewport at 1440px and 375px. An earlier mobile rule used a negative offset and sliced Sharla's arm off at the screen edge.
- The navy band covers the lower edge of both portraits. That is the banner's own device, not a crop.
- They are **not** squeezed into the masthead on inside pages. A cropped headshot strip chopped them at the shoulders and looked worse than no photo at all.

**Do not reintroduce negative offsets, overflow crops, or fixed heights on these two images.** Size them by width; the cutouts are near square.

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
