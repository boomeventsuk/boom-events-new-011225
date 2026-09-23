#!/usr/bin/env python3
"""Fail closed if the current V2 build is mistaken for a production release.

Run after building both brands. This checks the artifacts, not Eventbrite's live
state or Netlify configuration; those need separate release-day readback.
"""
from pathlib import Path
import sys

BUILD = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[1] / 'build'
failures = []

for brand, dirname, domain in (
    ('2PM', 'dist-2pm', 'www.the2pmclub.co.uk'),
    ('Boombastic', 'dist-boom', 'www.boomevents.co.uk'),
):
    root = BUILD / dirname
    pages = list(root.rglob('index.html'))
    if not pages:
        failures.append(f'{brand}: no generated pages')
        continue
    html = {str(p.relative_to(root)): p.read_text() for p in pages}
    if any(phrase in page for page in html.values() for phrase in ('FIVE PARTIES', 'Opens THE 2PM CLUB site', '2PM CLUB dates open on THE 2PM CLUB site')):
        failures.append(f'{brand}: misleading brand statistic or unnecessary cross-site explanation remains')
    if any('data-preview-form' in page for page in html.values()):
        failures.append(f'{brand}: nonfunctional preview signup is visible')
    if any('noindex' in page for page in html.values()):
        failures.append(f'{brand}: HTML still has preview noindex')
    if any('Website preview (Twin V2)' in page for page in html.values()):
        failures.append(f'{brand}: preview footer remains')
    if any('in this preview' in page.lower() for page in html.values()):
        failures.append(f'{brand}: preview-only copy remains')
    if any('Selector not loading?' in page and 'Book on the official event page' in page for page in html.values()):
        failures.append(f'{brand}: ticket fallback links to the same page')
    if any('href="https://www.eventbrite.co.uk/e/' in page for page in html.values()):
        failures.append(f'{brand}: direct Eventbrite ticket link appears in customer-facing HTML')
    if any('This preview keeps the current' in page for page in html.values()):
        failures.append(f'{brand}: legal or support gateway would loop on the production domain')
    if not all(f'<link rel="canonical" href="https://{domain}/' in page for page in html.values()):
        failures.append(f'{brand}: production canonical missing on at least one page')
    if not (root / 'sitemap.xml').is_file():
        failures.append(f'{brand}: production sitemap missing')
    if 'Disallow: /' in (root / 'robots.txt').read_text():
        failures.append(f'{brand}: robots.txt still blocks the site')
    if 'noindex' in (root / '_headers').read_text():
        failures.append(f'{brand}: HTTP header still blocks indexing')
    if not (root / '_redirects').is_file():
        failures.append(f'{brand}: legacy and duplicate URL redirect map missing')
    elif 'INCOMPLETE' in (root / '_redirects').read_text():
        failures.append(f'{brand}: historical production redirects still need merge and tests')
    elif len([line for line in (root / '_redirects').read_text().splitlines() if line and not line.startswith('#')]) < (20 if brand == '2PM' else 60):
        failures.append(f'{brand}: historical redirect map is unexpectedly short')
    if not any('consent' in page.lower() and ('gtm' in page.lower() or 'analytics' in page.lower()) for page in html.values()):
        failures.append(f'{brand}: consent-aware measurement is not in the generated HTML')

print(f'PRODUCTION GATE: {"FAIL" if failures else "PASS"} ({len(failures)} outstanding artifact checks)')
for failure in failures:
    print(' -', failure)
sys.exit(1 if failures else 0)
