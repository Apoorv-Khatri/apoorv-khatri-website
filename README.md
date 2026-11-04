# Apoorv Khatri Website

Public, user-approved academic website: https://apoorv-khatri.github.io/apoorv-khatri-website/
Public repository: https://github.com/Apoorv-Khatri/apoorv-khatri-website
GitHub Pages publishes the root of `main`. Changes pushed to `main` redeploy automatically.

## Current design
The user requested a redesign based on https://pzryumov.github.io/index.html . Use a white page, navy links/header rule, cream (#f7f0e1) profile band, Helvetica/Arial typography, centred 40px name, a 1000px desktop container, and a two-column image/biography layout. Stack the profile on phones. The previous pale-blue serif design and animated candlestick background are superseded: do not restore them unless requested.

The header uses a text-only HKUST Business School label, not a borrowed institutional logo. Keep the user's colourful bird placeholder until supplied with a replacement. Do not copy the reference author's portrait, logo, research, job-market claims, tracking code, or personal information. The reference has considerably more text because it includes publications; do not pad this user's page with invented credentials or papers.

## Content and files
- `index.html`: profile, research interests, working-paper placeholder, contact.
- `working-papers/index.html`: working-paper landing page and hidden reusable article template.
- `assets/css/style.css`: responsive layout and styling, no external dependencies.
- `assets/images/portrait.svg`: colourful bird placeholder.
- `cv/Apoorv-Khatri-CV.pdf`: valid blank one-page PDF, linked directly on GitHub; replace using the same filename.
- `tests/check_site.py`: Playwright checks at 1440, 1024, 768, 390 and 320px.
- Older images, fonts and `assets/js/market-backdrop.js` are retained as unused legacy assets; neither HTML page loads the animation or old font.

Biography: first-year PhD student in Finance at HKUST Business School.
Research interests: Corporate Finance & Financial Intermediation.
Email: akhatri@connect.ust.hk
Office: 5067, 5th Floor, Lee Shau Kee Business Building, HKUST.
Only change these details when the user requests it. No verified publications, Scholar/SSRN URLs or research statement have been supplied.

## Local preview and tests
Open `index.html`, or run `python3 -m http.server 8765 --bind 127.0.0.1` and visit http://127.0.0.1:8765 . No build, analytics, CDN, or API keys.

```sh
python3 -m venv .venv
.venv/bin/pip install playwright
.venv/bin/python -m playwright install chromium
.venv/bin/python tests/check_site.py
```
Use an isolated environment to avoid altering research-package dependencies. Review staged files before pushing and verify the deployed files after the Pages build succeeds. `noindex` and robots.txt indexing hints remain; they do not restrict public access.
