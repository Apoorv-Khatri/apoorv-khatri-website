# Apoorv Khatri Website

Public academic website, published on GitHub Pages with Apoorv’s explicit approval. The source repository is also public. Live URL: https://apoorv-khatri.github.io/apoorv-khatri-website/ . GitHub Pages serves the root of `main`; pushed changes are republished automatically. Draft `noindex` and robots.txt hints remain in place to discourage search indexing; these are not access controls and anyone with the URL can view the site.

## Preview
Open `index.html` directly in a browser, or run:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Visit http://127.0.0.1:8765. No build step, CDN, analytics, API keys, or runtime dependencies.

## Structure
- `index.html`: Home, biography and confirmed email/office details.
- `working-papers/index.html`: research landing page with a hidden reusable paper template.
- `cv/Apoorv-Khatri-CV.pdf`: valid, blank one-page PDF. Replace with your CV using this same filename; navigation already links to its GitHub file page.
- `assets/css/style.css`: shared responsive typography and layout.
- `assets/images/`: original pencil-style SVG cartoon placeholders, replaceable independently.
- `assets/fonts/`: locally hosted Merriweather and its OFL license.
- `tests/check_site.py`: browser smoke test (requires Playwright).

The three navigation destinations are Home, CV (direct PDF on GitHub), and Working Papers. CV intentionally has no intermediate HTML page. The GitHub PDF is publicly accessible.

## Content edits
Use HKUST Business School in the biography and site identity. Keep the user-provided office address ending in HKUST. Retain the colourful pencil-style bird illustrations and the existing editorial layout. Update contact details only when the user supplies changes. Add papers by copying the article inside `paper-template` into the visible section and replacing all placeholders. Do not invent affiliations, publications, coauthors, contact details, or credentials.

## Design
Reference: https://albertjmenkveld.com/ — narrow editorial column, Merriweather serif type, white background, dark underlined links, small masthead illustration and generous vertical rhythm. Implementation and illustrations are original. Menkveld’s biography, papers, and branding are not presented as Apoorv’s work.

## QA
Use an isolated environment to avoid changing research-package dependencies:

```sh
python3 -m venv .venv
.venv/bin/pip install playwright
.venv/bin/python -m playwright install chromium
.venv/bin/python tests/check_site.py
```
