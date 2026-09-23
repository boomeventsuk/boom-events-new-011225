#!/usr/bin/env python3
"""Build one production brand from its checked-in live feed and the other owned feed.

The repository's existing Eventbrite sync continues updating public/events*.json.
The opposite brand is read from its live owned domain. Network or data failures
stop the deploy rather than silently publishing old ticket details.
"""
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
BRAND = os.environ.get('TWIN_BRAND')
if BRAND not in {'pm', 'boom'}:
    raise SystemExit('TWIN_BRAND must be pm or boom')

own = Path(os.environ['TWIN_OWN_FEED']) if os.environ.get('TWIN_OWN_FEED') else ROOT / 'public' / ('events.json' if BRAND == 'pm' else 'events-boombastic.json')
other_url = ('https://www.boomevents.co.uk/events-boombastic.json' if BRAND == 'pm'
             else 'https://www.the2pmclub.co.uk/events.json')

def check(path, brand):
    data = json.loads(path.read_text())
    if not isinstance(data, list) or not data:
        raise ValueError(f'{brand} feed is empty or malformed')
    required = {'eventbriteId', 'start', 'title'}
    if any(not isinstance(item, dict) or not required <= item.keys() for item in data):
        raise ValueError(f'{brand} feed has missing event fields')
    return len(data)

with tempfile.TemporaryDirectory(prefix='boom-v2-build-') as tmp:
    temporary = Path(tmp)
    other = temporary / 'other.json'
    with urlopen(Request(other_url, headers={'User-Agent': 'Boombastic-V2-Build/1.0'}), timeout=25) as response:
        if response.status != 200:
            raise RuntimeError(f'Other brand feed returned HTTP {response.status}')
        other.write_bytes(response.read())
    pm = own if BRAND == 'pm' else other
    boom = own if BRAND == 'boom' else other
    print('Validated feed records:', '2PM', check(pm, '2PM'), 'Boombastic', check(boom, 'Boombastic'))
    env = os.environ.copy()
    env.update(TWIN_RELEASE='1', TWIN_BOOM_FEED=str(boom), TWIN_PM_FEED=str(pm),
               TWIN_OUTPUT_ROOT=str(temporary / 'out'))
    subprocess.run([sys.executable, str(ROOT / 'v2' / 'build' / 'build.py')], env=env, check=True)
    subprocess.run([sys.executable, str(ROOT / 'v2' / 'production-gate.py'), str(temporary / 'out')], check=True)
    source = temporary / 'out' / ('dist-2pm' if BRAND == 'pm' else 'dist-boom')
    target = ROOT / 'dist'
    if target.exists():
        shutil.rmtree(target)
    shutil.copytree(source, target)
    print('Production V2 artifact:', target, 'pages:', len(list(target.rglob('index.html'))))
