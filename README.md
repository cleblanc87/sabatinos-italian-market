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

<https://sabatinositalianmarket.com/>

Served by GitHub Pages from `main` at the repository root. Pushing to `main`
redeploys; a build takes about a minute.

The `CNAME` file at the repository root is what binds the domain. **Do not
delete it** — if it disappears from `main`, GitHub unsets the custom domain and
the site reverts to `cleblanc87.github.io/sabatinos-italian-market/`.

### DNS

The apex domain is canonical. At the registrar:

| Type  | Name  | Value                     |
|-------|-------|---------------------------|
| A     | `@`   | `185.199.108.153`         |
| A     | `@`   | `185.199.109.153`         |
| A     | `@`   | `185.199.110.153`         |
| A     | `@`   | `185.199.111.153`         |
| CNAME | `www` | `cleblanc87.github.io.`   |

Optionally add AAAA records on `@` for IPv6: `2606:50c0:8000::153` through
`2606:50c0:8003::153`.

GitHub redirects `www` to the apex automatically once both are in place. After
DNS resolves, GitHub provisions a Let's Encrypt certificate — usually minutes —
and **Enforce HTTPS** in Settings → Pages becomes available. Tick it.

### Turning the custom domain off and on

```sh
scripts/custom-domain.sh status        # which mode the files are in, and what Pages has live
scripts/custom-domain.sh off           # drop CNAME, point URLs at cleblanc87.github.io/…
scripts/custom-domain.sh on            # restore CNAME and the sabatinositalianmarket.com URLs
```

Add `--push` to commit and push to `main` in one step. Without it the change is
left in the working tree for review. Registrar DNS records are not touched.

### Changing domain again

The domain appears in the `canonical` and `og:url` tags of all seven pages, in
the two JSON-LD blocks (`index.html`, `contact.html`), and in `sitemap.xml` and
`robots.txt`. To move it:

```sh
printf 'newdomain.com\n' > CNAME
grep -rl "sabatinositalianmarket.com" *.html *.xml *.txt \
  | xargs sed -i '' 's|https://sabatinositalianmarket.com|https://newdomain.com|g'
```

Note that the contact email addresses also contain the domain, so check the
`mailto:` links and JSON-LD `email` fields afterwards.

## Deploying

Upload the whole folder. Any static host works — Netlify, Vercel, Cloudflare
Pages, GitHub Pages, or plain S3. There is nothing to compile.

---

## Before launch

Everything below is a placeholder. Each one is marked in the source with a
`<!-- TODO: -->` comment, so `grep -rn "TODO" .` will find them all.

- [ ] **Formspree form ID** — `js/main.js`, the `FORMSPREE_ID` constant.
      See "Making the forms live" below. Until this is set, both forms validate
      normally and then show the visitor the email address instead.
- [ ] **Email mailboxes** — `hello@` and `trade@sabatinositalianmarket.com`.
      The domain is now yours, so these addresses are the right ones; they just
      need mailboxes or forwarding set up at your registrar or mail host. They
      appear in `js/main.js` (`CONTACT_EMAIL`), `contact.html`, the footer of
      every page, and the JSON-LD in `index.html` and `contact.html`.
- [ ] **Telephone** — `(617) 555-0142`. Footer, `contact.html`, `wholesale.html`,
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
