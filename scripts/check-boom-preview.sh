#!/bin/bash
# check-boom-preview.sh: acceptance check for the boomevents.co.uk SEO/GEO preview (13th October 2026).
# Exits non-zero on any failure. Never deploys, pushes or runs the Eventbrite sync.
#   ./check-boom-preview.sh                 full mode: production build (live 2PM feed), then serve dist on a free localhost port
#   SKIP_BUILD=1 ./check-boom-preview.sh    reuse the existing dist, still serve it over localhost
#   OFFLINE=1 ./check-boom-preview.sh       static mode: no network, no sockets; reads dist files directly
#   TWIN_OTHER_FEED=/path ...               build against a local copy of the 2PM feed (preview reruns only)
#   PM_FEED_SNAPSHOT=/path ...              2PM feed copy for the sanitised-feed fixture (default: newest ../pm-events-snapshot-*.json)
# Known exceptions are printed as WAIVER lines, never as ok.
set -u
REPO="$(cd "$(dirname "$0")/.." && pwd)"
LOGDIR="${LOGDIR:-$(dirname "$REPO")}"
DIST="$REPO/dist"
OFFLINE="${OFFLINE:-0}"
FAIL=0
WAIVERS=0
fail() { echo "FAIL: $*"; FAIL=1; }
pass() { echo "ok:   $*"; }
waive() { echo "WAIVER: $*"; WAIVERS=$((WAIVERS + 1)); }
echo "mode: $([ "$OFFLINE" = 1 ] && echo 'OFFLINE static (no network, no sockets)' || echo 'full (build and localhost HTTP)')"

cd "$REPO" || { echo "FAIL: repo missing at $REPO"; exit 1; }

# 0. Repository safety: right branch, main untouched, nothing pushed.
[ "$(git rev-parse --abbrev-ref HEAD)" = "seo-geo-2026-10-13" ] && pass "on branch seo-geo-2026-10-13" || fail "not on branch seo-geo-2026-10-13"
[ "$(git rev-parse main)" = "$(git rev-parse origin/main)" ] && pass "local main equals origin/main (no commits to main)" || fail "local main differs from origin/main"
git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1 && fail "branch has an upstream (was it pushed?)" || pass "branch has no upstream (not pushed)"
[ -z "$(git status --porcelain -- v2 scripts netlify data public .github)" ] && pass "working tree clean in source folders" || fail "uncommitted source changes"

# 1. Build (runs the production gate) unless skipped or offline.
if [ "${SKIP_BUILD:-0}" != "1" ] && [ "$OFFLINE" != "1" ]; then
  if TWIN_BRAND=boom python3 v2/release-work/build-v2-production.py > "$LOGDIR/.build.log" 2>&1; then
    pass "build and production gate: $(grep -o 'PRODUCTION GATE: [A-Z]*' "$LOGDIR/.build.log"); $(grep -o 'Other brand feed: .*' "$LOGDIR/.build.log")"
  else
    tail -20 "$LOGDIR/.build.log"; fail "build or production gate failed"; exit 1
  fi
  # The build regenerates the ticket map; it must match what is committed.
  git diff --quiet -- netlify/functions/tickets/ticket-map.mjs && pass "ticket map matches committed copy" || fail "ticket map changed on rebuild (commit it)"
fi
[ -f "$DIST/index.html" ] || { echo "FAIL: no dist"; exit 1; }

# 2. Existing and new repo tests.
node scripts/check-ticket-utm.js && pass "check-ticket-utm" || fail "check-ticket-utm"
node scripts/check-feed-upcoming-only.js && pass "check-feed-upcoming-only" || fail "check-feed-upcoming-only"
node scripts/check-cancelled-event-classification.js >/dev/null && pass "check-cancelled-event-classification" || fail "check-cancelled-event-classification"
OUT="$(node scripts/check-2pm-location-contracts.js 2>&1)"; RC=$?
if [ $RC -eq 0 ]; then
  pass "check-2pm-location-contracts"
elif [ "$(echo "$OUT" | grep '^- ' | grep -v 'appear after SPA fallback')" = "" ]; then
  # W1: pre-existing on 523d785. The test looks for a V1 "# SPA routes" marker that the V2 build never writes.
  waive "W1 check-2pm-location-contracts FAILS its V1 SPA-marker rule ('2PM redirects appear after SPA fallback'), pre-existing on 523d785; all its other rules pass"
else echo "$OUT"; fail "check-2pm-location-contracts has failures beyond waiver W1"; fi

# 2b. Sanitised 2PM feed fixture: ended 2PM records cut to slug, eventbriteId, title, start, end, city
# (the 2PM agent's planned feed). The Boom output must be byte-identical to the build from the full feed.
SNAP="${PM_FEED_SNAPSHOT:-$(ls -t "$LOGDIR"/pm-events-snapshot-*.json 2>/dev/null | head -1)}"
if [ -z "$SNAP" ] && [ "$OFFLINE" != "1" ]; then
  SNAP="$LOGDIR/pm-events-snapshot-$(date +%Y-%m-%d).json"
  curl -s --max-time 25 -A 'Boombastic-V2-Build/1.0' -o "$SNAP" https://www.the2pmclub.co.uk/events.json || SNAP=""
fi
if [ -n "$SNAP" ] && [ -f "$SNAP" ]; then
  TMPF="$(mktemp -d)"
  python3 - "$SNAP" "$TMPF/pm-sanitised.json" <<'PYS'
import json, sys
from datetime import datetime
from zoneinfo import ZoneInfo
today = datetime.now(ZoneInfo('Europe/London')).date().isoformat()
city = {'NPTON': 'Northampton', 'BED': 'Bedford', 'MK': 'Milton Keynes', 'LEIC': 'Leicester', 'COV': 'Coventry', 'LUT': 'Luton'}
out = []
for r in json.load(open(sys.argv[1])):
    if r['start'][:10] < today:
        out.append({'slug': r['slug'], 'eventbriteId': r['eventbriteId'], 'title': r['title'], 'start': r['start'], 'end': r['end'],
                    'city': city.get(r.get('cityCode'), r.get('city')), 'canonicalUrl': 'https://www.the2pmclub.co.uk/events/' + r['slug'].lower() + '/'})
    else:
        out.append(r)
json.dump(out, open(sys.argv[2], 'w'))
PYS
  ok_full=0; ok_san=0
  TWIN_RELEASE=1 TWIN_BOOM_FEED="$REPO/public/events-boombastic.json" TWIN_PM_FEED="$SNAP" TWIN_OUTPUT_ROOT="$TMPF/full" python3 v2/build/build.py > "$TMPF/full.log" 2>&1 && ok_full=1
  TWIN_RELEASE=1 TWIN_BOOM_FEED="$REPO/public/events-boombastic.json" TWIN_PM_FEED="$TMPF/pm-sanitised.json" TWIN_OUTPUT_ROOT="$TMPF/san" python3 v2/build/build.py > "$TMPF/san.log" 2>&1 && ok_san=1
  git checkout -q -- netlify/functions/tickets/ticket-map.mjs 2>/dev/null
  if [ $ok_full = 1 ] && [ $ok_san = 1 ] && diff -r -q "$TMPF/full/dist-boom" "$TMPF/san/dist-boom" >/dev/null; then
    pass "sanitised 2PM feed: build succeeds and Boom output is identical ($(basename "$SNAP"))"
  else tail -5 "$TMPF/san.log"; fail "sanitised 2PM feed breaks or changes the Boom build"; fi
  rm -rf "$TMPF"
else
  fail "no 2PM feed snapshot for the sanitised-feed fixture (set PM_FEED_SNAPSHOT)"
fi

# 3. Page checks: over localhost HTTP in full mode, straight from the files in OFFLINE mode.
PORT=0; SERVER=""
if [ "$OFFLINE" != "1" ]; then
  PORT="$(python3 -c 'import socket;s=socket.socket();s.bind(("127.0.0.1",0));print(s.getsockname()[1])')"
  ( cd "$DIST" && exec python3 -m http.server "$PORT" --bind 127.0.0.1 >/dev/null 2>&1 ) &
  SERVER=$!
  trap 'kill $SERVER 2>/dev/null' EXIT
  for i in 1 2 3 4 5 6 7 8 9 10; do curl -s -o /dev/null "http://127.0.0.1:$PORT/" && break; sleep 0.3; done
fi

OFFLINE="$OFFLINE" PORT="$PORT" DIST="$DIST" REPO="$REPO" python3 - <<'PY' || FAIL=1
import html, json, os, re, sys, urllib.request
from datetime import datetime
from zoneinfo import ZoneInfo
PORT, DIST, REPO = os.environ['PORT'], os.environ['DIST'], os.environ['REPO']
OFFLINE = os.environ.get('OFFLINE') == '1'
def fetch(p):
    """(status, html). OFFLINE reads dist/<p>index.html (status 200 if present, as the static host would serve it)."""
    if OFFLINE:
        f = os.path.join(DIST, p.strip('/'), 'index.html') if p.strip('/') else os.path.join(DIST, 'index.html')
        return (200, open(f).read()) if os.path.exists(f) else (404, '')
    r = urllib.request.urlopen(f'http://127.0.0.1:{PORT}{p}', timeout=10)
    return r.status, r.read().decode()
TODAY = datetime.now(ZoneInfo('Europe/London')).date().isoformat()
bad = []
def ok(c, m):
    print(('ok:   ' if c else 'FAIL: ') + m)
    if not c: bad.append(m)

PAGES = ['/', '/whats-on/', '/halloween/', '/christmas-parties/', '/faq/', '/about/', '/for-ai/', '/group-bookings/', '/locations/',
         '/silent-disco/', '/family-silent-disco/', '/boombastic-90s/', '/footloose-80s/',
         '/silent-disco/northampton/', '/family-silent-disco/northampton/']
PAGES += sorted('/' + os.path.relpath(os.path.dirname(os.path.join(r, f)), DIST) + '/' for r, _, fs in os.walk(DIST) for f in fs
                if f == 'index.html' and ('/locations/' in r + '/' or '/event/' in r + '/') and r != DIST)
PAGES = list(dict.fromkeys(p.replace('/./', '/') for p in PAGES))
EXPECT = {
    '/': ('Silent Disco, 80s and 90s Parties | Boombastic Events',
          'Silent discos, 90s nights and Family Silent Disco in Northampton and Bedford, and THE 2PM CLUB daytime disco in Leicester and Coventry. Since 2014.',
          'Silent discos, decades parties and daytime discos since 2014'),
    '/christmas-parties/': ('Christmas 2026: Northampton, Leicester, Coventry, Bedford', None, 'Christmas parties 2026 in Northampton, Leicester, Coventry and Bedford'),
    '/halloween/': ('Halloween Parties Northampton 2026 | Boombastic Events', None, 'Halloween in Northampton: two parties, one for the kids'),
    '/locations/northampton/': ('Silent Disco and Party Nights in Northampton | Boombastic', None, 'Parties in Northampton: silent disco, decades and family'),
    '/locations/bedford/': ('90s Nights and Parties in Bedford | Boombastic Events', None, 'Parties in Bedford at Bedford Esquires'),
    '/locations/leicester/': ('Parties in Leicester at Welford Road | Boombastic Events', None, 'Parties in Leicester'),
    '/locations/coventry/': ('Parties in Coventry at hmv Empire | Boombastic Events', None, 'Parties in Coventry at hmv Empire'),
    '/locations/luton/': ('Parties in Luton: Next Date Coming Soon | Boombastic', None, 'Luton: next date coming soon'),
    '/locations/milton-keynes/': ('Parties in Milton Keynes: Coming Soon | Boombastic', None, 'Milton Keynes: next date coming soon'),
    '/silent-disco/': ('Silent Disco Greatest Hits: Northampton Silent Disco', None, 'Silent Disco Greatest Hits: three channels, one dancefloor'),
    '/boombastic-90s/': ('Boombastic 90s: 90s Party Nights in Bedford and Northampton', None, 'Boombastic 90s: the 90s night for Bedford and Northampton'),
    '/footloose-80s/': ('Footloose 80s: 80s Party Nights | Boombastic Events', None, 'Footloose 80s: all the anthems, all night'),
    '/family-silent-disco/': ('Family Silent Disco Northampton, Ages 4+ | Boombastic', None, 'Family Silent Disco in Northampton, for kids 4+ and their grown-ups'),
    '/event/311026-hhp-npton/': ('Halloween House Party Northampton, Sat 31st Oct | Boombastic', None, None),
    '/event/281026-fsd-npton/': ('Halloween Family Silent Disco Northampton, Wed 28th Oct', None, None),
}
def text(fragment):
    fragment = re.sub(r'<span class="lc">([^<]*)</span>', r'\1', fragment)
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', fragment))).strip()

for p in PAGES:
    try:
        code, s = fetch(p)
    except Exception as e:
        ok(False, f'{p}: HTTP fetch failed {e}'); continue
    title = html.unescape((re.search(r'<title>(.*?)</title>', s) or [None, ''])[1])
    meta = html.unescape((re.search(r'<meta name="description" content="([^"]*)"', s) or [None, ''])[1])
    h1s = re.findall(r'<h1[^>]*>(.*?)</h1>', s, re.S)
    blocks = re.findall(r'<script type="application/ld\+json">(.*?)</script>', s, re.S)
    try: [json.loads(b) for b in blocks]; parsed = True
    except Exception: parsed = False
    body = re.sub(r'<script.*?</script>', '', s.split('<main', 1)[-1], flags=re.S)
    good = code == 200 and title and meta and len(h1s) == 1 and parsed and '\u2014' not in s and 'noindex' not in s \
        and 'href="https://www.eventbrite' not in s and 'eventbrite.co.uk/e/' not in text(body) and f'<link rel="canonical" href="https://www.boomevents.co.uk{p}">' in s
    ok(good, f'{p}: 200, title, meta, one H1, {len(blocks)} JSON-LD parse, no em dash, no Eventbrite link, self canonical')
    if p in EXPECT:
        t, m, h = EXPECT[p]
        ok(title == t, f'{p}: title "{title}"')
        if m: ok(meta == m, f'{p}: meta description per board')
        if h and h1s: ok(text(h1s[0]) == h, f'{p}: H1 "{text(h1s[0])}"')
    if p.startswith('/locations/') and p != '/locations/':
        a = re.search(r'class="answer">(.*?)</p>', s)
        n = len(text(a.group(1)).split()) if a else 0
        ok(40 <= n <= 60, f'{p}: answer block {n} words (40 to 60)')
    for cap in re.findall(r'<figcaption>(.*?)</figcaption>', s) + re.findall(r'alt="([^"]*)"', s):
        if 'Picturedrome' in cap: ok(False, f'{p}: Picturedrome in caption or alt: {cap}')

# Whole-dist text rules.
for root, _, files in os.walk(DIST):
    for f in files:
        if f.endswith(('.html', '.json', '.txt', '.xml')) or f in ('_redirects', '_headers'):
            data = open(os.path.join(root, f), encoding='utf-8', errors='ignore').read()
            if '\u2014' in data: ok(False, f'em dash in {os.path.relpath(os.path.join(root, f), DIST)}')
            if f.endswith('.html') and ('TRUSTED BY THOUSANDS' in data.upper()): ok(False, f'"Trusted by thousands" in {f}')
home = open(f'{DIST}/index.html').read()
ok('across the Midlands' not in re.search(r'<meta name="description" content="([^"]*)"', home).group(1), 'homepage meta no longer says "across the Midlands"')
ok('across the Midlands' not in open(f'{DIST}/llms.txt').read().split('\n')[2], 'llms.txt summary no longer "across the Midlands"')
org = next(json.loads(b) for b in re.findall(r'<script type="application/ld\+json">(.*?)</script>', home) if json.loads(b)['@type'] == 'Organization')
ok({'Luton', 'Milton Keynes'} <= {a['name'] for a in org['areaServed']}, 'Organization areaServed includes Luton and Milton Keynes')
ok('hero-slogan' in home and 'fetchpriority="high"' in home, 'homepage slogan is a visual line and hero has fetchpriority')
imgs = re.findall(r'<img[^>]*>', home)
ok(all('width=' in i and 'height=' in i for i in imgs), f'homepage: all {len(imgs)} images have width and height')
ok(sum('srcset=' in i for i in imgs) >= 10, 'homepage: posters and photos use srcset')
ok('href="/halloween/"' in home and 'href="/christmas-parties/"' in home, 'homepage links Halloween and Christmas hubs')
ok('href="/halloween/"' in open(f'{DIST}/whats-on/index.html').read(), "What's on links /halloween/")

# Sold-out state.
for p in ('index.html', 'whats-on/index.html', 'locations/bedford/index.html', 'boombastic-90s/index.html'):
    ok('Sold out, join the waiting list' in open(f'{DIST}/{p}').read(), f'{p}: sold-out waiting list wording')

# Event pages: links, age line, schema.
pm_feed = []
for e in sorted(os.listdir(f'{DIST}/event')):
    s = open(f'{DIST}/event/{e}/index.html').read()
    town = re.search(r'"Locations", "item": "[^"]+"\}, \{"@type": "ListItem", "position": 3, "name": "([^"]+)"', s)
    ok(bool(town), f'event {e}: breadcrumb Home > Locations > Town > Event')
    ok(re.search(r'href="/locations/[a-z-]+/">More in ', s) is not None, f'event {e}: "More in <town>" link')
    ev = next(json.loads(b) for b in re.findall(r'<script type="application/ld\+json">(.*?)</script>', s) if json.loads(b)['@type'] == 'Event')
    ok(ev.get('@id', '').endswith('#event') and ev['location'].get('@id') and ev['location']['address'].get('addressRegion'), f'event {e}: Event @id, Place @id, addressRegion')
    ok('performer' not in ev, f'event {e}: no invented performer')
    if 'christmas' in e or e.startswith(('0412', '0512', '1212')): ok('href="/christmas-parties/"' in s.split('<main', 1)[1], f'event {e}: links Christmas hub in body')
    if e in ('311026-hhp-npton', '281026-fsd-npton'): ok('href="/halloween/"' in s.split('<main', 1)[1], f'event {e}: links Halloween hub')
    if int(ev['startDate'][11:13]) >= 17: ok('18+ event' in s or 'Entry rules for this date' in s, f'event {e}: evening age line present')

# Format pages carry EventSeries.
for f in ('silent-disco', 'family-silent-disco', 'boombastic-90s', 'footloose-80s', 'christmas-parties', 'halloween'):
    s = open(f'{DIST}/{f}/index.html').read()
    ok(any(json.loads(b)['@type'] == 'EventSeries' for b in re.findall(r'<script type="application/ld\+json">(.*?)</script>', s)), f'/{f}/: EventSeries JSON-LD')
ok('href="/locations/northampton/"' in open(f'{DIST}/silent-disco/index.html').read().split('<main', 1)[1], '/silent-disco/ links its town page')
ok('Work Christmas parties and groups'.upper() in open(f'{DIST}/christmas-parties/index.html').read(), 'Christmas hub has work Christmas and groups section')
ok('Christmas Daytime Disco' in open(f'{DIST}/locations/leicester/index.html').read(), 'Leicester card says Christmas Daytime Disco')
for c in ('bedford', 'coventry'):
    ok(f'THE 2PM CLUB daytime disco in {c.title()}' in open(f'{DIST}/locations/{c}/index.html').read(), f'{c}: descriptive anchor to the 2PM hub')
ok('MK11 Music Venue' in open(f'{DIST}/locations/milton-keynes/index.html').read(), 'Milton Keynes page names MK11 Music Venue')
ok('Hat Factory' in open(f'{DIST}/locations/luton/index.html').read(), 'Luton page names the Hat Factory')
faq = open(f'{DIST}/faq/index.html').read()
for q in ('What is Boombastic Events?', 'Is THE 2PM CLUB a silent disco?', 'How does Silent Disco Greatest Hits work?', 'What age is Family Silent Disco for?',
          'Where is the next silent disco in Northampton?', 'What Christmas parties are on in 2026?', 'Are there Halloween parties in Northampton in 2026?',
          'Can I book for a group or a work Christmas party?', 'How do I buy tickets, and what if it is sold out?', 'Is there a Boombastic party in Luton or Milton Keynes?'):
    ok(html.escape(q, quote=True) in faq or q in faq, f'/faq/ has board FAQ: {q}')
ok('Sat 26th September' not in faq and 'from 11am, evening' not in faq, '/faq/ age and family time answers carry no stale date')
ok('until our final night there on Saturday 26th September 2026' in open(f'{DIST}/about/index.html').read(), 'About line in past tense')

# Feeds.
feed = json.load(open(f'{DIST}/events-boombastic.json'))
ok(feed and all(r['start'][:10] >= TODAY and re.search(r'[+-]\d\d:\d\d$', r['start']) and re.search(r'[+-]\d\d:\d\d$', r['end']) for r in feed), f'events-boombastic.json: {len(feed)} upcoming records, all with UTC offsets')
raw = json.dumps(feed) + open(f'{DIST}/venues.json').read()
ok('Picturedrome' not in raw and 'GET READY' not in raw.upper() and 'Cinch' not in raw, 'feeds: no Picturedrome, GET READY or Cinch')
ven = json.load(open(f'{DIST}/venues.json'))
names = {v['name'] for c in ven['cities'] for v in c['venues']}
ok("DPD Stadium at Franklin's Gardens" in names and 'MK11 Music Venue' in names, 'venues.json: consistent venue names')
for c in ven['cities']:
    for v in c['venues']:
        for u in [c['townPage']] + [x['url'] for x in v['upcomingEvents']]:
            if u.startswith('https://www.boomevents.co.uk/'):
                ok(os.path.exists(DIST + u.replace('https://www.boomevents.co.uk', '') + 'index.html'), f'venues.json URL resolves: {u}')
fa = open(f'{DIST}/for-ai/index.html').read()
ok('href="/events-boombastic.json"' in fa and 'href="/venues.json"' in fa, '/for-ai/ links both feeds')
sm = open(f'{DIST}/sitemap.xml').read()
for u in ('/halloween/', '/silent-disco/northampton/', '/family-silent-disco/northampton/', '/christmas-parties/'):
    ok(f'<loc>https://www.boomevents.co.uk{u}</loc>' in sm, f'sitemap has {u}')
ok('gone' not in sm and 'get-ready' not in sm, 'sitemap has no gone or GET READY URL')
ok('Cache-Control: public, max-age=31536000, immutable' in open(f'{DIST}/_headers').read() and '?v=' in home, 'long cache on versioned /assets/')

# Redirects.
rules = [l.split() for l in open(f'{DIST}/_redirects').read().splitlines() if l.strip() and not l.startswith('#')]
R = {r[0]: (r[1], r[2]) for r in reversed(rules)}  # first match wins
def has(src, dest, status):
    got = R.get(src)
    ok(got == (dest, status), f'_redirects {src} -> {dest} {status} (got {got})')
PM = 'https://www.the2pmclub.co.uk'
has('/tickets', '/whats-on/', '301!'); has('/tickets/', '/whats-on/', '301!')
for v in ('/event/060626-2PM-NPTON', '/event/060626-2PM-NPTON/', '/event/060626-2pm-npton', '/event/060626-2pm-npton/'): has(v, PM + '/hubs/northampton/', '301!')
for v in ('/events/family-silent-disco-halloween-party-bedford', '/events/family-silent-disco-halloween-party-bedford/'): has(v, '/family-silent-disco/', '301!')
for v in ('/event/061225-DEC-NPTON', '/event/061225-dec-npton/'): has(v, '/locations/northampton/', '301!')
for v in ('/events/the-2pm-club-northampton-80s-90s-00s-daytime-disco', '/events/the-2pm-club-northampton-80s-90s-00s-daytime-disco/'): has(v, PM + '/hubs/northampton/', '301!')
for v in ('/event/250726-2pm-npton', '/event/250726-2pm-npton/', '/event/250726-2PM-NPTON/'): has(v, PM + '/hubs/northampton/', '301!')
for v in ('/get-ready', '/get-ready/', '/get-ready/*'): has(v, '/locations/northampton/', '301!')
for v in ('/event/250126-gr-npton/', '/event/250126-GR-NPTON', '/event/260626-gr-npton', '/event/260626-GR-NPTON/', '/events/get-ready-60s-70s-motown-soul-disco-sunday-matinee-special/'): has(v, '/gone.html', '410!')
ok(os.path.exists(f'{DIST}/gone.html'), 'gone.html exists for 410 rules')
ok(not any(r[1] == '/get-ready/index.html' for r in rules), 'old get-ready rewrite removed')
for v in ('/event/260926-sd-npton/', '/event/120926-b90-npton/', '/event/210326-fsd-npton/', '/event/250426-SD-NPTON/'): has(v, '/locations/northampton/', '301!')
has('/event/280326-fl80-bed/', '/locations/bedford/', '301!')
upcoming_pm = {re.search(r'/events/([^/]+)/', r[1]).group(1) for r in rules if r[1].startswith(PM + '/events/')}
past_targets = [c for c in upcoming_pm if c[:6].isdigit() and f'20{c[4:6]}-{c[2:4]}-{c[0:2]}' < TODAY]
ok(not past_targets, f'no redirect points at an ended 2PM event page (2-hop chain): {past_targets}')
tickets = [r for r in rules if r[0].startswith('/tickets/') and r[0] != '/tickets/']
ok(tickets and all(r[1].startswith('/.netlify/functions/tickets/') and r[2] == '200!' for r in tickets), f'{len(tickets)} /tickets/<code>/ rules rewrite to the UTM-preserving function')
ok(rules[-1] == ['/*', '/404.html', '404'], 'catch-all 404 is last')
past_codes = [r['eventCode'].lower() for r in json.load(open(f'{REPO}/data/boom-event-history.json')) if '-2pm-' not in r['eventCode'].lower() and '-gr-' not in r['eventCode'].lower()]
ok(all(R.get(f'/event/{c}/', ('',))[0].startswith('/locations/') for c in past_codes), f'all {len(past_codes)} ended Boombastic events redirect to a town page')
# No page may claim a Boombastic format in a town where the registry (feed plus history) has never had it.
reg = {}
for r in json.load(open(f'{REPO}/public/events-boombastic.json')) + json.load(open(f'{REPO}/data/boom-event-history.json')):
    code = r['eventCode'].upper()
    kind = next((k for k, tok in (('silent disco', '-SD-'), ('family silent disco', '-FSD-'), ('boombastic 90s', '-B90-'), ('footloose 80s', '-FL80-'), ('halloween house party', '-HHP-'), ('decades party', '-DEC-'), ('2pm', '-2PM-')) if tok in code), None)
    if kind: reg.setdefault(r['city'], set()).add(kind)
reg = {c: v | ({'decades party'} if v & {'boombastic 90s', 'footloose 80s', 'decades party'} else set()) for c, v in reg.items()}
CLAIMS = [('family silent disco', r'family silent disco'), ('silent disco', r'(?<!family )silent disco'), ('boombastic 90s', r'boombastic 90s|90s night'),
          ('footloose 80s', r'footloose 80s'), ('halloween house party', r'halloween house party'), ('decades party', r'decades')]
def claims(txt):
    return {k for k, pat in CLAIMS if re.search(pat, txt.lower())}
for town in sorted(reg):
    tslug = town.lower().replace(' ', '-')
    for route in [f'/locations/{tslug}/'] + [f'/{k}/{tslug}/' for k in ('silent-disco', 'family-silent-disco') if os.path.exists(f'{DIST}/{k}/{tslug}/index.html')]:
        s = open(f'{DIST}{route}index.html').read()
        parts = [re.search(r'<title>(.*?)</title>', s).group(1), re.search(r'<meta name="description" content="([^"]*)"', s).group(1),
                 re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S).group(1)] + re.findall(r'class="answer">(.*?)</p>', s)
        # Only sentences about this town count (nearest-date sentences name other towns).
        txt = ' '.join(x for x in re.split(r'(?<=[.;])\s+', text(' '.join(html.unescape(p) for p in parts))) if town in x and 'nearest' not in x)
        extra = claims(txt) - reg[town]
        ok(not extra, f'{route}: claims only formats the registry has in {town} (extra: {sorted(extra)})')
s = open(f'{DIST}/index.html').read()
hm = html.unescape(re.search(r'<meta name="description" content="([^"]*)"', s).group(1))
for town in ('Leicester', 'Coventry'):
    sent = hm.split('and THE 2PM CLUB daytime disco in')[0]
    ok(town not in sent, f'homepage meta pairs no Boombastic format with {town}')
for key, kind in (('boombastic-90s', 'boombastic 90s'), ('silent-disco', 'silent disco'), ('family-silent-disco', 'family silent disco'), ('footloose-80s', 'footloose 80s')):
    s = open(f'{DIST}/{key}/index.html').read()
    named = [t for t in reg if t in text(re.search(r'<title>(.*?)</title>', s).group(1) + ' ' + re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S).group(1))]
    chips = re.findall(r'<ul class="city-chips"><li>(.*?)</ul>', s)
    named += [t for t in reg if chips and f'>{t}<' in chips[0]]
    ok(all(kind in reg[t] for t in named), f'/{key}/: towns named {sorted(set(named))} all have {kind} in the registry')
# Length rule: every built page, title 60 characters or under, meta description 160 or under.
long_ = []
for root, _, files in os.walk(DIST):
    if 'index.html' in files:
        s = open(os.path.join(root, 'index.html')).read()
        t = html.unescape(re.search(r'<title>(.*?)</title>', s).group(1)); m = html.unescape(re.search(r'<meta name="description" content="([^"]*)"', s).group(1))
        if len(t) > 60 or len(m) > 160: long_.append(f'{os.path.relpath(root, DIST)} (title {len(t)}, meta {len(m)})')
ok(not long_, f'every page: title <= 60 and meta description <= 160 characters {long_}')
print(f'\nPAGES CHECKED: {len(PAGES)} ({"files" if OFFLINE else "localhost HTTP"}); FAILURES: {len(bad)}')
sys.exit(1 if bad else 0)
PY

[ -n "$SERVER" ] && kill $SERVER 2>/dev/null; trap - EXIT
MODE="$([ "$OFFLINE" = 1 ] && echo OFFLINE || echo FULL)"
if [ $FAIL -ne 0 ]; then echo "CHECK-BOOM-PREVIEW ($MODE): FAIL"; exit 1; fi
echo "CHECK-BOOM-PREVIEW ($MODE): PASS with $WAIVERS named waiver(s)"
