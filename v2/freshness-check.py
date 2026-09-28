#!/usr/bin/env python3
"""Freshness acceptance check (added 28th September 2026).

Fails (exit 1) if either live site lists a date that has already passed on the
Europe/London calendar, in its event listing, sitemap or llms.txt. Run it after a
deploy, or the morning after the nightly rebuild, to prove finished dates drop off.

    python3 v2/freshness-check.py
"""
import re
import sys
from datetime import datetime
from urllib.request import Request, urlopen
from zoneinfo import ZoneInfo

import os
TODAY = os.environ.get('FRESHNESS_TODAY') or datetime.now(ZoneInfo('Europe/London')).date().isoformat()
SITES = {
    'Boombastic': ('https://www.boomevents.co.uk', '/whats-on/', r'/event/(\d{6})-'),
    'THE 2PM CLUB': ('https://www.the2pmclub.co.uk', '/events/', r'/events/(\d{6})-'),
}
MONTHS = {m: i for i, m in enumerate(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
                                      'September', 'October', 'November', 'December'], 1)}


def get(url):
    with urlopen(Request(url, headers={'User-Agent': 'Boombastic-Freshness-Check/1.0'}), timeout=30) as r:
        return r.read().decode('utf-8', 'ignore')


def code_date(ddmmyy):
    return f'20{ddmmyy[4:6]}-{ddmmyy[2:4]}-{ddmmyy[0:2]}'


failures = []
for name, (base, listing, pattern) in SITES.items():
    page = get(base + listing)
    stale = sorted({d for d in re.findall(r'data-date="(\d{4}-\d{2}-\d{2})"', page) if d < TODAY})
    if stale:
        failures.append(f'{name} {listing} still lists finished dates: {", ".join(stale)}')
    sitemap = get(base + '/sitemap.xml')
    stale_urls = [u for u in re.findall(r'<loc>([^<]+)</loc>', sitemap)
                  if re.search(pattern, u) and code_date(re.search(pattern, u).group(1)) < TODAY]
    if stale_urls:
        failures.append(f'{name} sitemap lists finished events: {", ".join(stale_urls)}')
    llms = get(base + '/llms.txt')
    for day, month, year in re.findall(r'(\d{1,2})(?:st|nd|rd|th) (' + '|'.join(MONTHS) + r') (\d{4})', llms):
        iso = f'{year}-{MONTHS[month]:02d}-{int(day):02d}'
        if iso < TODAY:
            failures.append(f'{name} llms.txt lists a finished date: {day} {month} {year}')
    print(f'{name}: checked {listing}, sitemap and llms.txt against {TODAY}')

if failures:
    print('FRESHNESS CHECK: FAIL')
    for f in failures:
        print(' -', f)
    sys.exit(1)
print('FRESHNESS CHECK: PASS')
