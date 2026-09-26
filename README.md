# Sabatino's Italian Market — marketing website

A static marketing site for an importer of fine Italian provisions. Hand-written
HTML, CSS and JavaScript: no build step, no dependencies, no package manager.

## Running it

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Live site

<https://cleblanc87.github.io/sabatinos-italian-market/>

Served by GitHub Pages from `main` at the repository root. Pushing to `main`
redeploys; a build takes about a minute.

## Deploying

Upload the whole folder. Any static host works — Netlify, Vercel, Cloudflare
Pages, GitHub Pages, or plain S3. There is nothing to compile.

### Moving to a custom domain

The site currently refers to itself by its GitHub Pages URL. Once
`sabatinositalianmarket.com` (or whatever domain you settle on) is registered:

1. Add a `CNAME` file at the repository root containing the bare domain.
2. Point the domain's DNS at GitHub Pages, and enable HTTPS in Settings → Pages.
3. Replace `https://cleblanc87.github.io/sabatinos-italian-market` throughout —
   it appears in the `canonical` and `og:url` tags of all seven pages, in the
   two JSON-LD blocks (`index.html`, `contact.html`), and in `sitemap.xml` and
   `robots.txt`:

   ```sh
   grep -rl "cleblanc87.github.io/sabatinos-italian-market" . \
     | xargs sed -i '' 's|https://cleblanc87.github.io/sabatinos-italian-market|https://www.yourdomain.com|g'
   ```

---

## Before launch

Everything below is a placeholder. Each one is marked in the source with a
`<!-- TODO: -->` comment, so `grep -rn "TODO" .` will find them all.

- [ ] **Formspree form ID** — `js/main.js`, the `FORMSPREE_ID` constant.
      See "Making the forms live" below. Until this is set, both forms validate
      normally and then show the visitor the email address instead.
- [ ] **Email addresses** — `hello@` and `trade@sabatinositalianmarket.com`.
      Appear in `js/main.js` (`CONTACT_EMAIL`), `contact.html`, the footer of
      every page, and the JSON-LD in `index.html` and `contact.html`.
- [x] **Telephone** — `(970) 306-8153`. Footer, `contact.html`, `wholesale.html`,
      and both JSON-LD blocks. Update the `tel:` href as well as the visible text.
- [ ] **Street address** — `144 Prince Street, Boston MA 02113`. `contact.html`
      and both JSON-LD blocks.
- [ ] **Business hours** — `contact.html`.
- [ ] **Founding year** — `EST. 2026` in the crest (`<text>` element near the end
      of the hero crest SVG on every page) and in the footer.
- [ ] **Social links** — none are present. The footer deliberately has no dead
      social icons; add them when the accounts exist.
- [ ] **The founding story** — `our-story.html` is written about the house's
      method rather than about specific people, so it is true as written. It will
      be considerably stronger with a real name and a real reason behind it.
- [ ] **Open Graph image** — `og:image` is not set. Add a 1200×630 image and
      reference it in each page's `<head>` before sharing links publicly.

### Making the forms live

1. Sign up at [formspree.io](https://formspree.io) and verify your email address.
2. Create a form, name it, and set the destination address.
3. From the endpoint it gives you — `https://formspree.io/f/abcdwxyz` — copy the
   ID, the `abcdwxyz` part.
4. Paste it into `FORMSPREE_ID` at the top of `js/main.js`.

Both the contact form and the trade enquiry form use that one ID and are
distinguished by their `_subject` hidden field. Both include a `_gotcha`
honeypot, which Formspree uses to drop bot submissions.

With the ID set, the forms submit over `fetch` and swap in a confirmation panel.
If the request fails, the visitor is given the email address rather than a dead
end. With JavaScript disabled entirely, the forms still POST to Formspree
directly.

---

## Layout

```
index.html         Home — hero, standards, collections, sourcing, trade
collections.html   The seven collections, with regions and denominations
sourcing.html      Regions we buy from, SVG map, DOP/IGP/DOCG explained
our-story.html     The house, its standards, and the sourcing calendar
wholesale.html     Trade partnerships, how it works, trade enquiry form
contact.html       Contact form and details
404.html           Branded not-found page
css/style.css      The entire stylesheet, sectioned and commented
js/main.js         Navigation, scroll reveal, map, form handling
images/favicon.svg The crest
```

## Design notes

- **No photography.** The site is built from typography, colour and custom SVG —
  the crest, the section dividers, seven line-art collection icons and the map of
  Italy. Nothing needs licensing, and there are no placeholder images to replace.
  Real photography can be added later without disturbing the layout.
- **Colour and type** are defined once as custom properties at the top of
  `css/style.css`. Changing the palette or the typefaces is a single-block edit.
- **Icons** are an SVG sprite near the top of each page's `<body>`, referenced
  with `<use href="#i-…">`.
- **Accessibility**: semantic landmarks, one `<h1>` per page, a skip link, visible
  focus rings, labelled form fields with errors tied by `aria-describedby`, a
  focus-trapped mobile menu, and full support for `prefers-reduced-motion`. The
  scroll-reveal animation is opt-in from JavaScript, so content is never hidden
  by a script that failed to run.
- **Print**: each page has a print stylesheet that drops the chrome and prints
  the content on white.

## The one tradeoff worth knowing

Because there is no build step, the header and footer markup is duplicated in all
seven HTML files. A change to the navigation is a seven-file edit. That was a
deliberate trade for having zero dependencies.

If that becomes tiresome, moving to a static site generator such as Astro is
mechanical: the stylesheet and the page bodies carry over unchanged, and only the
shared header and footer are lifted into a layout component.
