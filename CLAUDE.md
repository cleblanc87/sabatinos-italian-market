# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A marketing website for Sabatino's Italian Market, an importer of fine Italian
provisions. Seven static pages, hand-written. Its job is credibility and
enquiry capture — there is no catalogue, no cart, no prices.

**There is no build step, no package manager, and no dependencies.** `node` and
`npm` are installed on the machine but deliberately unused. The HTML, CSS and JS
in the repo are exactly what ships. Do not introduce a bundler, framework or
`package.json` without being asked.

## Commands

```sh
python3 -m http.server 8000      # then http://localhost:8000
node --check js/main.js          # the only "build" check that exists
```

`index.html` also opens correctly over `file://`.

There is no test suite and no linter. The checks below catch the regressions
this codebase has actually had — run them after structural edits:

```sh
# Internal links and assets all resolve
for f in *.html; do
  for t in $(grep -o '\(href\|src\)="[^"#:]*\.\(html\|css\|js\|svg\|xml\|txt\)"' "$f" \
             | sed 's/.*="//;s/"//' | sort -u); do
    [ -f "$t" ] || echo "BROKEN $f -> $t"; done; done

# Shared header has not drifted between pages (aria-current normalised away)
for f in *.html; do sed -n '/<header class="site-header">/,/<\/header>/p' "$f" \
  | sed 's/ aria-current="page"//' | shasum | cut -c1-12; done | sort -u   # expect ONE hash

# No stale absolute URLs after a domain change
grep -rn "github\.io" *.html *.xml *.txt
```

## Architecture

### The shared blocks are duplicated, not included

Every page carries its own byte-identical copy of four shared blocks:

1. the `<head>` (fonts, meta, Open Graph, canonical)
2. the `<header class="site-header">` nav — identical except for one
   `aria-current="page"` attribute marking the current page
3. the inline SVG icon sprite (`<symbol id="i-…">` definitions)
4. the `<footer class="site-footer">`

These were originally produced by a generator script that **no longer exists**.
The HTML files are now the only source of truth.

**A change to the nav, footer, head or icon set is a seven-file edit.** Make it
with `sed`/a script across all seven rather than by hand, then run the drift
check above. Getting this wrong is the single most likely way to break this
repo. (A previous session lost a fix exactly this way: the generator rewrote the
pages from a stale template and silently reverted an earlier edit.)

### Icons: sprite plus `<use>`

Icons are referenced as `<svg class="…"><use href="#i-oil"></use></svg>`, with
the `<symbol>` definitions in the sprite near the top of each `<body>`.

**Trap:** an `<svg>` wrapping a `<use>` has no intrinsic aspect ratio. Given
only a CSS `width`, it falls back to `height: 150px` and the icon floats in ~100px
of dead space. Every icon class therefore sets an explicit `height`, and
`svg:not([viewBox]) { aspect-ratio: 1 }` in the reset is the backstop. Keep both
when adding an icon.

### Colour: two golds, and they are not interchangeable

`css/style.css` defines gold three times, on purpose:

| Token | Use | Why |
|---|---|---|
| `--oro` `#B08D4F` | Hairlines, rules, borders, focus rings — **never text** | Decorative; exempt from contrast minimums |
| `--oro-text` `#7E5F2C` | Gold **text and icons** on light grounds | 5.24:1 on cream, 4.71:1 on bone — passes AA |
| `--oro-light` `#D4B776` | Anything gold on `.on-dark` grounds | 7.64:1 on `--verde` |

Collapsing these back into one value looks like a tidy-up and is a WCAG
regression — the bright gold on cream is 2.76:1 against 4.5 required, and the
letterspaced gold eyebrow carrying the site's tone appears on every page.
Likewise `.btn--gold` uses near-black lettering (`--ink`), not white: white on
that gold is 3.05:1.

Every text pair on the site currently passes AA. Re-measure if you touch the
palette.

### `.on-dark` sections

`.on-dark` supplies the verde gradient, a grain overlay and light-on-dark
overrides for headings, `.lede`, `.eyebrow`, `.divider` and `.pillar__num`. A new
component used on a dark band needs a matching `.on-dark` override or it will
render dark-on-dark.

### Progressive enhancement

`js/main.js` is entirely enhancement — nav toggle, scroll reveal, map pin
highlighting, form handling. Two deliberate properties worth preserving:

- Scroll-reveal elements are **visible by default**; JS adds `.reveal-ready` to
  opt them into the animation. Content is never hidden by a script that failed
  to run, and the whole thing is skipped under `prefers-reduced-motion`.
- Both forms POST to Formspree natively, so they work with JS disabled.

### The map of Italy (`sourcing.html`)

The coastline is a generated path, plotted from real lat/lon coordinates with an
equirectangular projection and light Catmull-Rom smoothing; region pins are
placed from a representative town's coordinates. Hand-editing the path data is
not viable — an earlier by-eye version had no boot, heel or Gargano spur.
Regenerate from coordinates if it needs to change.

### Forms

`js/main.js` has two constants at the top: `FORMSPREE_ID` (empty — the forms fall
back to showing `CONTACT_EMAIL` until it is set) and `CONTACT_EMAIL`. Both forms
share the one endpoint and are distinguished by a `_subject` hidden field; each
carries a `_gotcha` honeypot.

## Copy constraints

The business is new and **has no inventory**. The owner asked that the site never
say so. The copy is therefore written to be true as written for a company that
has not yet shipped: sourcing philosophy, standards, process, and regions and
DOP/IGP denominations as *categories the house imports*.

Do not add stock levels, availability, prices, producer counts, awards, years of
trading, or certifications held. The four figures on the home page (20 regions,
7 categories, 100% bought at origin, est. 2026) were each chosen because they are
true by construction. New copy should meet the same bar — nothing that needs
retracting once real inventory exists.

## Deployment

GitHub Pages, from `main` at the repository root, at
<https://sabatinositalianmarket.com/>. Pushing to `main` redeploys.

The root `CNAME` file binds the domain; deleting it silently reverts the site to
`cleblanc87.github.io/sabatinos-italian-market/`.

The domain is written into the pages in four places — `canonical` and `og:url`
on all seven pages, both JSON-LD blocks (`index.html`, `contact.html`),
`sitemap.xml`, and `robots.txt`. Relative links are location-independent and need
no changes. `README.md` has the DNS records and the change-domain procedure.

`README.md` also carries the pre-launch checklist: the phone number and street
address in the copy and JSON-LD are still invented placeholders and are publicly
visible.

## Repo hygiene

`.claude/` is gitignored — a session worktree was once committed by accident.
Check `git status` before `git add -A`.
