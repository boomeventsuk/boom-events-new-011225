#!/usr/bin/env python3
"""Twin V2: build the two local website candidates from the dated 23rd September 2026 public feeds.

Run from anywhere:  python3 website-twin-2026-09-22/claude-v2/build/build.py
Cross-site links use TWIN_BOOM_BASE / TWIN_PM_BASE so the V2 previews can point at each other.
The V1 twin in ../../build/ is untouched by this script.
"""
from __future__ import annotations

import hashlib
import html
import json
import os
import re
import shutil
from datetime import datetime
from pathlib import Path
from urllib.parse import quote
from zoneinfo import ZoneInfo

HERE = Path(__file__).resolve().parent
TWIN = HERE.parent.parent
RELEASE_MODE = os.environ.get('TWIN_RELEASE') == '1'
OUTPUT_ROOT = Path(os.environ.get('TWIN_OUTPUT_ROOT', HERE / 'release-candidate' if RELEASE_MODE else HERE))
if RELEASE_MODE and not (os.environ.get('TWIN_BOOM_FEED') and os.environ.get('TWIN_PM_FEED')):
    raise SystemExit('Production candidate requires explicit TWIN_BOOM_FEED and TWIN_PM_FEED')
BOOM_FEED = Path(os.environ.get('TWIN_BOOM_FEED', TWIN / 'source-snapshots/boom-events-2026-09-23.json'))
PM_FEED = Path(os.environ.get('TWIN_PM_FEED', TWIN / 'source-snapshots/2pm-events-2026-09-23.json'))
BOOM = json.loads(BOOM_FEED.read_text())
PM = json.loads(PM_FEED.read_text())
SUPPORT = json.loads((TWIN / 'source-snapshots/support-pages.json').read_text())
TODAY = datetime.now(ZoneInfo('Europe/London')).date().isoformat()
STRICTLY_SEASON_2026 = '2026-09-19' <= TODAY <= '2026-12-19'
BOOM_BASE = os.environ.get('TWIN_BOOM_BASE', 'https://www.boomevents.co.uk' if RELEASE_MODE else 'https://boom-twin-preview-20260922.netlify.app').rstrip('/')
PM_BASE = os.environ.get('TWIN_PM_BASE', 'https://www.the2pmclub.co.uk' if RELEASE_MODE else 'https://2pm-club-twin-preview-20260922.netlify.app').rstrip('/')
if RELEASE_MODE and (BOOM_BASE != 'https://www.boomevents.co.uk' or PM_BASE != 'https://www.the2pmclub.co.uk'):
    raise SystemExit('Production candidate bases must be the owned www domains')
PM_REEL_BASE = 'https://boombastic-events.b-cdn.net/web%20hero'
PM_REEL_MASTER = PM_REEL_BASE + '/hero-1x1.mp4'
PM_REEL_CITIES = {'Northampton': 'NPTON', 'Bedford': 'BED', 'Coventry': 'COV', 'Milton Keynes': 'MK'}
CITY_CODE = {'NPTON': 'Northampton', 'BED': 'Bedford', 'MK': 'Milton Keynes', 'LEIC': 'Leicester', 'COV': 'Coventry', 'LUT': 'Luton'}
MONTHS = {1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'June', 7: 'July', 8: 'Aug', 9: 'Sept', 10: 'Oct', 11: 'Nov', 12: 'Dec'}
EMAIL = 'hello@boomevents.co.uk'
SOCIAL = {
    'boom': [('instagram', 'https://www.instagram.com/boombastic.eventsuk', 'Instagram'), ('facebook', 'https://www.facebook.com/boombastic.eventsuk', 'Facebook'), ('tiktok', 'https://www.tiktok.com/@boombastic.eventsuk', 'TikTok')],
    'pm': [('instagram', 'https://www.instagram.com/the2pmclub', 'Instagram'), ('facebook', 'https://www.facebook.com/the2pmclub', 'Facebook')],
}

# Attendee quotes carried from named sources. Verify original provenance before wider reuse.
QUOTES = {
    'lorne': ('It felt like 2am not 2pm!', 'Lorne, Northampton'),  # competitive-intel/CUSTOMER-FEEDBACK-ANALYSIS.md
    'lorne_long': ("I wasn't expecting much the first time I attended in December but couldn't believe the amazing vibe", 'Lorne, Northampton'),  # 2PM Christmas feed
    'diane': ("What do you mean I'm not still 18.....I WAS on Saturday afternoon!!", 'Diane, Northampton'),  # feedback analysis
    'julie': ('Still able to leave the place whilst its still light and feel safe walking to the car', 'Julie, Coventry'),  # feedback analysis
    'emma_leic': ('Pure and unadulterated fun.', 'Emma, Leicester'),  # feedback analysis
    'lara': ('Absolutely fantastic afternoon out. Great music, fab people and a really safe environment.', 'Lara, Northampton'),  # feedback analysis
    'friends': ("Finally able to get all my friends together, when's the next one?", 'Attendee, Northampton'),  # live 2PM site
    'bedford': ("Don't think I've danced and laughed so much in a long time. Thank you!", 'Attendee, Bedford'),  # live 2PM site
    'emma_r': ('The only Christmas night we book, best music, best crowd.', 'Emma R.'),  # Christmas Decades feed
    'fl80': ('Such a great mix of music. Now THAT was a proper 80s night!', 'Attendee, Northampton'),  # live Footloose page
}

# Real event photography. Caption = provenance shown on the page wherever a city could be misread.
PHOTOS = {
    'pm-hero.webp': ('THE 2PM CLUB crowd under confetti and stage lights', 'THE 2PM CLUB', 'https://www.the2pmclub.co.uk/img/hero-confetti-1280.webp'),
    'pm-friends.jpeg': ('Three friends laughing together on the dancefloor', 'THE 2PM CLUB, Bedford, June 2026', 'reports/website-research-2026-09-22/page-designs/assets/2pm-friends.jpeg'),
    'pm-group.jpg': ('A group of friends posing together, drinks in hand', 'THE 2PM CLUB, Northampton, June 2026', '060626-2PM-NPTON processed no-logo 055'),
    'pm-three.jpg': ('Three women with arms raised mid-chorus', 'THE 2PM CLUB, Northampton, June 2026', '060626-2PM-NPTON processed no-logo 043'),
    'pm-arms.jpg': ('Women singing with arms up under coloured lights', 'THE 2PM CLUB, Northampton, June 2026', '060626-2PM-NPTON processed no-logo 087'),
    'pm-hug.jpg': ('Two friends hugging and laughing on the dancefloor', 'THE 2PM CLUB, Northampton, June 2026', '060626-2PM-NPTON processed no-logo 088'),
    'pm-wide.jpg': ('A packed room with arms raised towards the stage', 'THE 2PM CLUB, Northampton, June 2026', '060626-2PM-NPTON processed no-logo 108'),
    'pm-mic.jpg': ('A guest leading the singing with an inflatable microphone', 'THE 2PM CLUB, Northampton, June 2026', '060626-2PM-NPTON processed no-logo 030'),
    'pm-smile.jpg': ('A guest smiling with arms raised in the crowd', 'THE 2PM CLUB, Northampton, June 2026', '060626-2PM-NPTON processed no-logo 083'),
    'pm-packed.jpg': ('A full daytime dancefloor', 'THE 2PM CLUB, Northampton, June 2026', '060626-2PM-NPTON processed no-logo 025'),
    'boom-hero.jpg': ('Crowd and stage lights at a Boombastic event', 'Boombastic Events', 'https://boombastic-events.b-cdn.net/BoomEvents%20Website-Backgrounds/Boom%20Crowd%20Web.jpg'),
    'silent-photo.jpeg': ('Guests dancing in light-up silent disco headphones', 'Silent Disco Greatest Hits, The Picturedrome, Northampton, Apr 2026', 'reports/website-research-2026-09-22/page-designs/assets/silent-disco-crowd.jpeg'),
    'footloose-photo.jpeg': ('Friends singing into inflatable microphones under stage lights', 'Footloose 80s, The Picturedrome, Northampton, Mar 2026', 'reports/website-research-2026-09-22/page-designs/assets/footloose-crowd.jpeg'),
    'fl-room.jpg': ('The Picturedrome packed for an 80s night, lights and balcony', 'Footloose 80s, The Picturedrome, Northampton, Mar 2026', '210326-FL80-NPTON processed no-logo'),
    'fl-group.jpg': ('Friends with inflatable microphones, arms raised', 'Footloose 80s, Northampton, Mar 2026', '210326-FL80-NPTON processed no-logo'),
    'fl-portrait.jpg': ('Four friends posing with an orange inflatable microphone', 'Footloose 80s, Northampton, Mar 2026', '210326-FL80-NPTON processed no-logo'),
    'fl-dj.jpg': ('The DJ booth and a colourful dancefloor', 'Footloose 80s, Northampton, Mar 2026', '210326-FL80-NPTON processed no-logo'),
    'b90-stage.jpg': ('90s videos on the big screen above a singing crowd', 'Boombastic 90s, Northampton, Sept 2026', '120926-B90-NPTON clean 006'),
    'b90-group.jpg': ('A group of friends posing under rainbow lights', 'Boombastic 90s, Northampton, Sept 2026', '120926-B90-NPTON clean 005'),
    'b90-crowd.jpg': ('A lively crowd singing along, inflatable microphones up', 'Boombastic 90s, Northampton, Sept 2026', '120926-B90-NPTON clean 003'),
    'b90-mic.jpg': ('A guest singing into an inflatable microphone', 'Boombastic 90s, Northampton, Sept 2026', '120926-B90-NPTON clean 002'),
    # Added 23rd Sept 2026 from the Notion Event Photo Library (unedited camera originals; see qa/photo-refresh/new-assets.json).
    'sd-energy.jpg': ('A group of friends dancing with arms raised in light-up headphones', 'Silent Disco Greatest Hits, The Picturedrome, Northampton, Apr 2026', 'Notion Event Photo Library: Main Event Images/SD/250426-SD-NPTON-high-energy-group-arms-up.jpeg'),
    'sd-four-friends.jpg': ('Four friends smiling together in light-up headphones', 'Silent Disco Greatest Hits, The Picturedrome, Northampton, Apr 2026', 'Notion Event Photo Library: Main Event Images/SD/250426-SD-NPTON-four-friends-smiling-headphones.jpeg'),
    'sd-dance-drinks.jpg': ('Friends dancing with drinks in light-up headphones', 'Silent Disco Greatest Hits, The Picturedrome, Northampton, Apr 2026', 'Notion Event Photo Library: Main Event Images/SD/250426-SD-NPTON-dancefloor-friends-drinks-headphones.jpeg'),
    'sd-two-women.jpg': ('Two friends smiling in light-up headphones', 'Silent Disco Greatest Hits, The Picturedrome, Northampton, Apr 2026', 'Notion Event Photo Library: Main Event Images/SD/250426-SD-NPTON-two-women-smiling-headphones.jpeg'),
    'poster-061226-fsd-npton.webp': ('Official Christmas Family Silent Disco event artwork', 'Christmas Family Silent Disco, Northampton, Dec 2026', 'Public event promotional artwork, 061226-FSD-NPTON'),
    'pm-npton-feb.jpg': ('Two friends dancing mid-chorus, drinks in hand', 'THE 2PM CLUB, The Picturedrome, Northampton, Feb 2026', 'Notion Event Photo Library: Main Event Images/2PM/280226-2PM-NPTON-two-friends-dancing-with-drinks.jpeg'),
    'pm-leic.jpg': ('A packed dancefloor with arms raised and music videos on the big screens', 'THE 2PM CLUB, Leicester, May 2026', 'Notion Event Photo Library: Main Event Images/2PM/020526-2PM-LEIC-packed-leicester-dancefloor-arms-raised.jpeg'),
    'pm-cov.jpg': ('Three friends laughing together with stage lights behind', 'THE 2PM CLUB, hmv Empire, Coventry, Mar 2026', 'Notion Event Photo Library: Main Event Images/2PM/070326-2PM-COV-three-women-laughing-arms-raised-dancefloor.jpeg'),
    'pm-bed.jpg': ('Five friends smiling together under green lasers', 'THE 2PM CLUB, Bedford Esquires, Bedford, June 2026', 'Notion Event Photo Library: Main Event Images/2PM/130626-2PM-BED-five-friends-smiling-dancefloor.jpeg'),
    'pm-mk.jpg': ('A guest singing into an inflatable microphone in a busy crowd', 'THE 2PM CLUB, Milton Keynes, Mar 2026', 'Notion Event Photo Library: Main Event Images/2PM/140326-2PM-MK-woman-black-top-inflatable-mic-singing-crowd.jpeg'),
}

# 2PM event and city pages: a real photo from a 2PM date in that city.
PM_CITY_PHOTO = {'Leicester': 'pm-leic.jpg', 'Coventry': 'pm-cov.jpg', 'Bedford': 'pm-bed.jpg', 'Milton Keynes': 'pm-mk.jpg', 'Northampton': 'pm-npton-feb.jpg'}

ICONS = {
    'calendar': '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/>',
    'clock': '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    'pin': '<path d="M12 22s-8-7.5-8-13a8 8 0 0 1 16 0c0 5.5-8 13-8 13z"/><circle cx="12" cy="9" r="3"/>',
    'music': '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    'people': '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    'star': '<path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2 1.2-6.8-5-4.9 6.9-1z"/>',
    'share': '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/>',
    'access': '<circle cx="12" cy="4" r="2"/><path d="M12 7v6h5l2 6"/><path d="M9.5 10.5a6 6 0 1 0 7 7.5"/>',
    'mail': '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 6l-10 7L2 6"/>',
    'info': '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    'ticket': '<path d="M3 7a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-3a2 2 0 0 0 0-4z"/><path d="M13 5v14" stroke-dasharray="2 2"/>',
    'gift': '<rect x="3" y="8" width="18" height="13" rx="1"/><path d="M12 8v13M3 12h18M12 8S10 3 7.5 4 9 8 12 8zm0 0s2-5 4.5-4S15 8 12 8z"/>',
    'glass': '<path d="M4 3h16l-8 9z"/><path d="M12 12v9M8 21h8"/>',
    'heart': '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',
    'headphones': '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z"/>',
    'screen': '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    'nav': '<path d="M3 11l19-9-9 19-2-8z"/>',
    'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    'moon': '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    'child': '<circle cx="12" cy="5" r="3"/><path d="M12 8v7M8 11h8M9 22l3-7 3 7"/>',
    'instagram': '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
    'facebook': '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>',
    'tiktok': '<path d="M16 3a5 5 0 0 0 5 5M16 3v12a5 5 0 1 1-5-5"/>',
}


def icon(name, cls='ico'):
    return f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">{ICONS[name]}</svg>'


def esc(x): return html.escape(str(x or ''), quote=True)


def slug(x): return re.sub(r'[^a-z0-9]+', '-', x.lower()).strip('-')


ARROW = '<span class="arr" aria-hidden="true">→</span>'


def ordinal(n): return f"{n}{'th' if 11 <= n % 100 <= 13 else {1: 'st', 2: 'nd', 3: 'rd'}.get(n % 10, 'th')}"


def dt(v): return datetime.fromisoformat(v[:19])


def d_long(v):
    d = dt(v); return f"{d.strftime('%a')} {ordinal(d.day)} {d.strftime('%B %Y')}"


def d_mid(v):
    d = dt(v); return f"{d.strftime('%a')} {ordinal(d.day)} {MONTHS[d.month]} {d.year}"


def d_short(v):
    d = dt(v); return f"{d.strftime('%a')} {ordinal(d.day)} {MONTHS[d.month]}"


def t(v):
    return dt(v).strftime('%I:%M%p').lstrip('0').replace(':00', '').lower()


def times(e): return f"{t(e['start'])} – {t(e['end'])}"


def schema_time(value):
    parsed = datetime.fromisoformat(value)
    return (parsed if parsed.tzinfo else parsed.replace(tzinfo=ZoneInfo('Europe/London'))).isoformat()


def strip_emoji(s):
    return re.sub(r'[\U0001F000-\U0001FFFF☀-➿️‍⬀-⯿▪▫]', '', s or '').strip()


# ---------------------------------------------------------------- events

def fmt_key(e):
    code, title = e['code'], e['title']
    if '-2PM-' in code: return 'pm80' if '80s' in title else 'pmxmas'
    if '-FSD-' in code: return 'fsd'
    if '-SD-' in code: return 'sdxmas' if 'Christmas' in title else 'sd'
    if '-B90-' in code: return 'b90'
    if '-HHP-' in code: return 'hhp'
    if '-DEC-' in code: return 'dec'
    return 'party'


FORMAT = {
    # key: (badge, badge colour, filter type, display pre-title, eyebrow)
    'pm80': ('80s Edition', 'pink', '80s Edition', '80s Edition', 'THE 2PM CLUB Daytime Disco'),
    'pmxmas': ('Christmas', 'hot', 'Christmas', 'Christmas Daytime Disco', 'THE 2PM CLUB Daytime Disco'),
    'sd': ('Silent Disco', 'blue', 'Silent disco', 'Silent Disco', 'Silent Disco Greatest Hits'),
    'sdxmas': ('Christmas Silent Disco', 'blue', 'Silent disco', 'Christmas Silent Disco', 'Silent Disco Greatest Hits'),
    'fsd': ('Family Silent Disco', 'green', 'Family', 'Christmas Family Silent Disco', ''),
    'b90': ('Boombastic 90s', 'coral', 'Decades Parties', 'Boombastic 90s', ''),
    'hhp': ('Halloween House Party', 'orange', 'Halloween', 'Halloween House Party', ''),
    'dec': ('Christmas Decades Party', 'coral', 'Decades Parties', 'Christmas Decades Party', ''),
}


def badge(e):
    if e['brand'] == 'boom-crosslink': return 'THE 2PM CLUB', 'hot'
    b = FORMAT[e['fmt']]; return b[0], b[1]


def normalized():
    p = []
    for raw in PM:
        if raw['start'][:10] < TODAY or raw.get('isCancelled'): continue
        code = raw['slug']
        p.append(dict(code=code, title=raw['title'], city=CITY_CODE.get(raw['cityCode'], raw['cityCode']), venue=raw['location'].rsplit(', ', 1)[0], address=raw.get('venueAddress') or {}, start=raw['start'], end=raw['end'], image=raw['image'], eventbriteId=raw['eventbriteId'], price=raw.get('priceLabel'), groupTicket=raw.get('groupTicket'), status=raw.get('statusLabel'), description=raw.get('description') or '', subtitle=raw.get('subtitle') or '', full=raw.get('fullDescription') or '', highlights=raw.get('highlights') or '', soundtrack='', brand='pm', path=f'/events/{code.lower()}/', owned=f'https://www.the2pmclub.co.uk/events/{code.lower()}/'))
    p.sort(key=lambda e: e['start'])
    b = []
    for raw in BOOM:
        if raw['start'][:10] < TODAY or raw.get('isCancelled'): continue
        if '2PM' in raw['title'].upper():
            match = next((e for e in p if e['eventbriteId'] == raw['eventbriteId']), None)
            if match: b.append({**match, 'path': PM_BASE + match['path'], 'brand': 'boom-crosslink'})
            continue
        code = raw['eventCode']
        b.append(dict(code=code, title=raw['title'], city=raw['city'], venue=raw['venue'], address=raw.get('venueAddress') or {}, start=raw['start'], end=raw['end'], image=raw['image'], eventbriteId=raw['eventbriteId'], price=raw.get('priceLabel'), groupTicket=raw.get('groupTicket'), status=raw.get('statusLabel'), description=raw.get('description') or '', subtitle=raw.get('subtitle') or '', full=raw.get('fullDescription') or '', highlights=raw.get('highlights') or '', soundtrack=raw.get('soundtrack') or '', brand='boom', path=f'/event/{code.lower()}/', owned=f'https://www.boomevents.co.uk/event/{code.lower()}/'))
    b.sort(key=lambda e: e['start'])
    # Same named venue, address taken from another entry in the same dated feeds when this entry lacks one.
    known = {}
    for raw in PM + BOOM:
        v = raw.get('venue') or (raw.get('location') or '').rsplit(', ', 1)[0]
        if raw.get('venueAddress') and v: known.setdefault(v, raw['venueAddress'])
    raw_by_id = {r['eventbriteId']: r for r in PM + BOOM}
    for e in p + b:
        e['fmt'] = fmt_key(e)
        if not e['address'] and e['venue'] in known: e['address'] = known[e['venue']]
        r = raw_by_id.get(e['eventbriteId'], {})
        e['soldout'] = r.get('isSoldOut') is True or r.get('status') == 'sold-out' or 'SoldOut' in (r.get('availability') or '')
    return b, p


# ---------------------------------------------------------------- places
# A city is "live" when the dated feed has at least one upcoming, not-sold-out date there.
# A "verified place" is any city in that brand's dated feed history or its current public sitemap.
# Nothing else is listed: no invented towns and no promised dates.

# Approximate town-centre coordinates, used only to order "nearest dates" for a place with nothing on sale.
TOWN_COORDS = {'Northampton': (52.2405, -0.9027), 'Bedford': (52.1360, -0.4667), 'Milton Keynes': (52.0406, -0.7594), 'Leicester': (52.6369, -1.1398), 'Coventry': (52.4068, -1.5197), 'Luton': (51.8787, -0.4200)}


def on_sale(e): return e['start'][:10] >= TODAY and not e.get('soldout')


# Boombastic format pages and the feed event-code token that identifies each format's dates.
FORMAT_PAGES = [('silent-disco', 'Silent Disco Greatest Hits', '-SD-'), ('family-silent-disco', 'Family Silent Disco', '-FSD-'), ('boombastic-90s', 'Boombastic 90s', '-B90-'), ('footloose-80s', 'Footloose 80s', '-FL80-')]


def format_dates(token):
    """On-sale Boombastic dates for a format, read from the dated feed's event codes."""
    return [e for e in CURRENT_EVENTS['boom'] if e['brand'] == 'boom' and token in e['code'] and on_sale(e)]


def city_url(brand, city): return f'/{"hubs" if brand == "pm" else "locations"}/{slug(city)}/'


def live_cities(brand):
    """Live cities for this brand, alphabetical, each with its next on-sale event."""
    seen = {}
    for e in CURRENT_EVENTS[brand]:
        if on_sale(e): seen.setdefault(e['city'], e)
    return [(c, seen[c]) for c in sorted(seen)]


def sitemap_city_slugs(brand):
    xml = (TWIN / f'source-snapshots/{"2pm" if brand == "pm" else "boom"}-sitemap.xml').read_text()
    return set(re.findall(r'/(?:hubs|locations)/([a-z0-9-]+)/</loc>', xml))


def verified_places(brand):
    raw = PM if brand == 'pm' else BOOM
    names = {CITY_CODE.get(r['cityCode'], r['cityCode']) if brand == 'pm' else r['city'] for r in raw}
    by_slug = {slug(n): n for n in names}
    missing = sitemap_city_slugs(brand) - set(by_slug)
    if missing: raise SystemExit(f'{brand}: sitemap city routes with no feed city to name them: {sorted(missing)}')
    return sorted(names)


def miles(a, b):
    (la1, lo1), (la2, lo2) = TOWN_COORDS[a], TOWN_COORDS[b]
    return ((la1 - la2) * 69) ** 2 + ((lo1 - lo2) * 42.5) ** 2  # squared, ordering only


def nearest_live(brand, city, n=2):
    live = [c for c, _ in live_cities(brand) if c != city]
    if city in TOWN_COORDS and all(c in TOWN_COORDS for c in live):
        return sorted(live, key=lambda c: miles(city, c))[:n]
    return []


def install_assets(events):
    errors = []
    for e in events:
        stem = 'poster-' + e['code'].lower()
        found = sorted((HERE / 'assets').glob(stem + '.*'))
        if found and found[0].stat().st_size > 1000: e['poster'] = '/assets/' + found[0].name
        else: e['poster'] = e['image']; errors.append(f"{e['code']}: local poster missing, remote fallback used")
    (HERE / 'asset-errors.json').write_text(json.dumps(errors, indent=2))
    return errors


def street(e):
    a = e.get('address') or {}
    return [v for v in [a.get('streetAddress'), ' '.join(x for x in [a.get('addressLocality'), a.get('postalCode')] if x)] if v]


def artist_groups(e):
    """Artist rolls exactly as the dated feed lists them, grouped under their feed heading."""
    groups = []
    if e.get('soundtrack'):
        groups.append(('The soundtrack', None, [s.strip() for s in e['soundtrack'].split('·') if s.strip()]))
        return groups
    lines = [l.strip() for l in (e['full'] + '\n' + e['description']).split('\n') if l.strip()]
    seen = set()
    colour = {'🔵': 'blue', '🔴': 'red', '🟢': 'green'}
    for i, line in enumerate(lines):
        c = next((v for k, v in colour.items() if line.startswith(k)), None)
        if c and ':' in line:  # "🔵 POP THROWBACKS: Whitney, Spice Girls"
            label, items = line.split(':', 1)
            parts = [strip_emoji(x) for x in items.split(',')]
            groups.append((strip_emoji(label).title(), c, [x for x in parts if x]))
            continue
        if line.startswith('Expect ') and line.count(',') >= 4:
            body = line[7:].rstrip('.')
            parts = re.split(r',\s*|\s+and\s+(?=[A-Z])', body)
            groups.append(('80s Sing Out Loud Anthems', None, [x.strip() for x in parts if x.strip()]))
            continue
        sep = ' · ' if line.count(' · ') >= 3 else ' / ' if line.count(' / ') >= 3 else None
        if not sep or line in seen: continue
        seen.add(line)
        raw_items = [x.strip() for x in line.split(sep)]
        last = re.sub(r'\s+(and the rest of the gang|and many more|AND MORE|and all the family party hits)$', '', raw_items[-1], flags=re.I)
        raw_items[-1] = last
        label, lc = 'The soundtrack', None
        for back in lines[max(0, i - 2):i][::-1]:
            cc = next((v for k, v in colour.items() if back.startswith(k)), None)
            if cc: label, lc = strip_emoji(back).title(), cc; break
            if back.isupper() or back.endswith('of') or back.startswith('As well as') or ':' in back:
                label = strip_emoji(back); break
        label = {'Christmas hits from the likes of': 'Christmas hits'}.get(label, label)
        if label.startswith('As well as'): label = '80s, 90s & 00s anthems'
        if label.startswith('UPSTAIRS') or label.startswith('DOWNSTAIRS'): label = label.title().replace('& 00S', '& 00s').replace('90S', '90s')
        groups.append((label, lc, [x for x in raw_items if x]))
    return groups


def notice(e):
    """Event-specific venue, access and entry notices. Text comes from the dated feed or the V1 verified notice."""
    if e['code'] == '031026-2PM-NPTON':
        return ('Good to know for Sat 3rd Oct', 'At The Charles Bradlaugh, 1 Earl Street, Northampton. One ticket covers the 80s party on both floors: Sing Out Loud Anthems upstairs and disco and smooth grooves downstairs. The upstairs room is reached by steps. Your existing ticket remains valid for both floors.')
    if e['code'] == '061226-FSD-NPTON':
        return ('Good to know for families', 'Now on Saturday 12th December, 11am to 1pm, with admission from 11am. Designed for ages 4 and up; younger children may find the headphones too large. Children must be accompanied by a paying adult, maximum three children per adult. The event is upstairs at The Charles Bradlaugh, accessed by steps. Existing tickets remain valid. Food downstairs is booked separately.')
    if 'Upstairs event, accessed by steps' in e['full']:
        tail = next((l for l in e['full'].split('\n') if 'Upstairs event, accessed by steps' in l), '')
        extra = ' A £10 fully refundable headphone deposit is taken on the night.' if '£10 fully refundable headphone deposit' in e['full'] else ''
        return ('Good to know before you go', tail.strip() + extra)
    if e['fmt'] == 'hhp':
        return ('Entry', 'Entry is 18+. Valid photo ID may be required. Two floors at The Charles Bradlaugh: throwback anthems upstairs, indie classics downstairs.')
    return None


def event_copy(e):
    """Selling copy for the event page. Facts come from this event's feed entry."""
    f = e['fmt']
    end = t(e['end'])
    if e['code'] == '031026-2PM-NPTON':
        return dict(h2='TWO FLOORS. ONE TICKET.', sub='One building, two DJs and a whole afternoon of 80s music.',
                    lede='Sing Out Loud Anthems upstairs. 80s disco and smooth grooves downstairs. Move between the two rooms with the same ticket, with DJs playing from 2pm to 6pm.',
                    bullets=[('music', 'Upstairs: Madonna, Whitney, Wham! and big 80s choruses'),
                             ('music', 'Downstairs: Chic, Luther Vandross and 80s soul, funk and disco'),
                             ('ticket', 'One ticket covers both floors. Existing tickets remain valid')],
                    quote=QUOTES['lorne'], photo='pm-mic.jpg')
    if f == 'pm80':
        return dict(h2='ALL THE 80s. ALL AFTERNOON.', sub='Your best 80s night out. In the middle of the afternoon.', lede='Four hours of 80s Sing Out Loud Anthems, back to back. Doors at 2pm, and home by 7 if you want to be.',
                    bullets=[('music', 'Wall-to-wall 80s, from Madonna to Duran Duran'), ('people', 'One link for the group chat, one Saturday plan'), ('star', f'Doors at 2pm, done by {end}. Sunday not written off')], quote=QUOTES['lorne'], photo='pm-mic.jpg')
    if f == 'pmxmas':
        return dict(h2='YOUR CHRISTMAS PARTY. SORTED.', sub='Festive classics plus the biggest Sing Out Loud Anthems from the 80s, 90s and 00s.', lede='Festive classics first, then the choruses everyone knows. Doors at 2pm, with the rest of Saturday evening still yours.',
                    bullets=[('music', 'Mariah, Wham! and Slade, then Whitney, Take That and Oasis'), ('people', 'One link, one payment, Christmas reunion sorted'), ('star', f'Party early, home happy. Done by {end}')], quote=QUOTES['lorne_long'], photo='pm-hero.webp')
    if f == 'sd':
        return dict(h2='THREE CHANNELS. ONE DANCEFLOOR.', sub=e['subtitle'] + '. Three channels, three DJs, one dancefloor.', lede='The Picturedrome closes its doors after Saturday 26th September, so this is the final night there. Pick your channel and switch whenever you want. Your headphones, your rules.',
                    bullets=[('headphones', 'Three live DJs: pop throwbacks, indie classics, dance anthems'), ('people', 'The pop queen, the indie kid and the dance head, on one floor'), ('star', 'The tenth birthday sold out here in April 2026. Send it off properly')], quote=None, photo='silent-photo.jpeg')
    if f == 'sdxmas':
        return dict(h2='ELEVEN YEARS OF FESTIVE HEADPHONES.', sub='Three channels, three DJs, four hours. One very festive night.', lede='Friends, office parties and couples, all on one dancefloor. Pick your vibe or switch it up.',
                    bullets=[('headphones', 'Christmas & party, indie classics and dance anthems'), ('people', 'Office party, friends or a festive catch-up'), ('ticket', '£10 fully refundable headphone deposit on the night')], quote=None, photo='sd-dance-drinks.jpg')
    if f == 'fsd':
        return dict(h2='EVERYONE FINDS THEIR VIBE.', sub=e['subtitle'], lede='Christmas jumpers on, headphones on. Kids bounce to party hits, parents move to throwbacks and teens pick the chart channel, all on the same dancefloor.',
                    bullets=[('child', 'Perfect for kids 4+, and parents join in too'), ('headphones', 'Three family-friendly channels, curated by the Boombastic team'), ('star', 'Best festive-dressed family or group wins tickets to the next one')], quote=None, photo=None)
    if f == 'b90':
        return dict(h2='YOUR DECADE. YOUR PEOPLE.', sub='All of the nineties. Every last bit of it.', lede='You picked a side in August 95, Blur or Oasis, and you still stand by it. Four hours of pop, Britpop, dance and hip-hop swagger at Bedford Esquires. We have been bringing Boombastic nights to Bedford for ten years.',
                    bullets=[('music', 'Spice Girls, Oasis, TLC and Faithless on one night'), ('screen', 'Giant screens with authentic 90s videos'), ('star', 'Come as you are. Just be ready to sing every word')], quote=None, photo='b90-mic.jpg')
    if f == 'hhp':
        return dict(h2='TWO FLOORS. ONE HALLOWEEN.', sub='One building. Two floors. Five hours of anthems and classics.', lede='Our first ever Halloween House Party. Upstairs is 90s and 00s throwback anthems; downstairs is 90s and 00s indie classics. Party from 8pm to 1am.',
                    bullets=[('music', 'Upstairs: Spice Girls to Daft Punk'), ('music', 'Downstairs: Oasis to Arctic Monkeys'), ('info', 'Entry is 18+. Valid photo ID may be required')], quote=None, photo='b90-crowd.jpg')
    if f == 'dec':
        return dict(h2='THE CHRISTMAS NIGHT OUT.', sub='Wall-to-wall 80s, 90s and 00s anthems with festive classics from Mariah, Wham!, Slade and co.', lede='Grab your favourite people for four hours of 80s, 90s and 00s anthems, laced with the Christmas classics you still know word for word.',
                    bullets=[('music', 'Mariah and Wham! alongside Whitney, Take That and Oasis'), ('people', 'One date for the people you want to spend Christmas with'), ('star', 'Four hours on the dancefloor')], quote=QUOTES['emma_r'], photo='b90-group.jpg')
    return dict(h2='YOUR NEXT PARTY.', sub=e['subtitle'], lede=e['description'], bullets=[], quote=None, photo='boom-hero.jpg')


# ---------------------------------------------------------------- shared components

# Focal points for photos whose subject is off-centre (checked crop by crop).
PHOTO_POS = {'sd-energy.jpg': '50% 50%', 'b90-mic.jpg': '50% 42%'}


def photo(name, cls='', loading='lazy', caption=True, cap=None, pos=None):
    alt, cap0, _ = PHOTOS[name]
    cap = cap or cap0
    pos = pos or PHOTO_POS.get(name)
    style = f' style="object-position:{pos}"' if pos else ''
    capx = f'<figcaption>{esc(cap)}</figcaption>' if caption else ''
    return f'<figure class="ph {cls}"><img src="/assets/{name}" alt="{esc(alt)}" loading="{loading}" decoding="async"{style}>{capx}</figure>'


CHEVRON = '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>'


def dropdown(ident, label, items, footer_link='', is_active=False):
    """Click/tap disclosure (not a hover menu). items: (label, sub, href, is_current, external)."""
    lis = ''.join(f'<li><a href="{esc(u)}"{" aria-current=page" if cur else ""}><span class="dd-name">{esc(x)}{"<span class=ext aria-hidden=true> ↗</span>" if ext else ""}</span><small>{esc(s)}</small></a></li>' for x, s, u, cur, ext in items)
    return f'<div class="dd{" is-active" if is_active else ""}"><button class="dd-btn" type="button" aria-expanded="false" aria-controls="dd-{ident}">{label}{CHEVRON}</button><div class="dd-panel" id="dd-{ident}" hidden><ul>{lis}</ul>{footer_link}</div></div>'


def nav(brand, active='', ticket_href='/whats-on/'):
    pm = brand == 'pm'; name = 'THE 2PM CLUB' if pm else 'Boombastic Events'
    cur = lambda u: f'{" aria-current=page" if active == u else ""}'
    cities = [(c, f'Next: {d_short(e["start"])}', city_url(brand, c), active == city_url(brand, c), False) for c, e in live_cities(brand)]
    loc_active = active == '/locations/' or active.startswith('/hubs/') or active.startswith('/locations/')
    locs = dropdown('locations', 'Locations', cities, f'<a class="dd-all" href="/locations/"{cur("/locations/")}>View all locations {ARROW}</a>', loc_active)
    if pm:
        about_items = [('About THE 2PM CLUB', 'Who we are and who it’s for', '/about/', active == '/about/', False),
                       ('Blog', 'Guides and ideas for your afternoon', '/blog/', active == '/blog/', False),
                       ('Boombastic Events', 'The team behind it', BOOM_BASE + '/about/', False, False)]
    else:
        about_items = [('About Boombastic', 'Our story and our parties', '/about/', active == '/about/', False),
                       ('THE 2PM CLUB', 'Our daytime disco', PM_BASE + '/', False, False),
                       ('THE 2PM CLUB blog', 'Daytime disco guides', PM_BASE + '/blog/', False, False)]
    about = dropdown('about', 'About', about_items, '', active in ('/about/', '/blog/'))
    if pm:
        third = f'<a href="/what-to-expect/"{cur("/what-to-expect/")}>What to expect</a>'
    else:
        fmts = []
        for key, label, token in FORMAT_PAGES:
            ds = format_dates(token)
            sub = f'{len(ds)} date{"s" if len(ds) != 1 else ""} on sale. Next: {d_short(ds[0]["start"])}' if ds else 'No date on sale'
            fmts.append((label, sub, f'/{key}/', active == f'/{key}/', False))
        third = dropdown('parties', 'Our parties', fmts, f'<a class="dd-all" href="/about/#parties">All our parties {ARROW}</a>', active in [f'/{k}/' for k, _, _ in FORMAT_PAGES])
    items = f'<a href="/whats-on/"{cur("/whats-on/")}>What’s on</a>{locs}{third}{about}'
    return f'''<header class="hdr"><div class="container hdr-in"><a class="brand" href="/" aria-label="{name} home"><img src="/assets/{'pm' if pm else 'boom'}-logo.png" alt="{name}" width="{'120' if pm else '190'}" height="{'64' if pm else '56'}"></a><nav id="main-nav" class="nav" aria-label="Main navigation">{items}<a class="nav-more" href="/faqs/">FAQs</a><a class="nav-more" href="/group-bookings/">Groups</a><a class="nav-more" href="/contact/">Contact</a></nav><a class="pill-btn hdr-cta" href="{ticket_href}">Find tickets</a><a class="pill-btn m-tickets" href="{ticket_href}">Tickets</a><button class="menu-btn" type="button" aria-expanded="false" aria-controls="main-nav" aria-label="Open menu"><span></span><span></span><span></span></button></div></header>'''


def footer(brand):
    pm = brand == 'pm'
    other = (BOOM_BASE if pm else PM_BASE) + '/'
    live = 'https://www.the2pmclub.co.uk' if pm else 'https://www.boomevents.co.uk'
    socials = ''.join(f'<a href="{u}" aria-label="{label}" rel="noopener">{icon(n)}</a>' for n, u, label in SOCIAL[brand])
    by = f'<a class="by" href="{other}">By Boombastic Events</a>' if pm else ''
    more = f'<a href="/faqs/">FAQs</a><a href="/group-bookings/">Groups</a><a href="/contact/">Contact</a>' + ('<a href="/blog/">Blog</a>' if pm else f'<a href="/jobs/">Work with us</a>') + f'<a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="{other}">{"Boombastic Events" if pm else "THE 2PM CLUB"}</a>' + ('<button type="button" id="cookie-settings">Cookie settings</button>' if RELEASE_MODE else '')
    note = ('' if RELEASE_MODE else '<p>Website preview (Twin V2). Event details from the public feed of 23rd September 2026. Tickets and availability are live on each event page.</p>')
    return f'''<footer class="ftr"><div class="container ftr-in"><div class="ftr-brand"><a href="/"><img src="/assets/{'pm' if pm else 'boom'}-logo.png" alt="{'THE 2PM CLUB' if pm else 'Boombastic Events'} home" loading="lazy"></a>{by}</div><nav class="ftr-main" aria-label="Footer"><a href="/whats-on/">What’s on</a><a href="/locations/">Locations</a><a href="/about/">About</a></nav><div class="ftr-social">{socials}</div><p class="ftr-tag">{'Good people. Great afternoons.' if pm else 'Events bring people together.'}</p></div><div class="container ftr-sub"><nav aria-label="More links">{more}</nav>{note}</div></footer>'''


def sticky(brand, label='Find tickets', href='/whats-on/'):
    return f'<a class="sticky-cta" href="{href}">{esc(label)} {ARROW}</a>'


def decades(markup):
    """Keep the lowercase s in 80s/90s/00s inside uppercase display type, text nodes only."""
    out = re.sub(r'>([^<]+)<', lambda m: '>' + re.sub(r'\b(\d0)[sS]\b', r'\1<span class="lc">s</span>', m.group(1)) + '<', markup)
    return re.sub(r'<option([^>]*)>(.*?)</option>', lambda m: f'<option{m.group(1)}>' + re.sub(r'<span class="lc">s</span>', 's', m.group(2)) + '</option>', out)


def page(brand, title, body, description='', active='', image='', sticky_label='Find tickets', sticky_href='/whats-on/', body_class=''):
    pm = brand == 'pm'; site = 'THE 2PM CLUB' if pm else 'Boombastic Events'
    base = PM_BASE if pm else BOOM_BASE
    social = image or base + ('/assets/pm-hero.webp' if pm else '/assets/boom-hero.jpg')
    robots = '' if RELEASE_MODE else '<meta name="robots" content="noindex,nofollow,noarchive">'
    suffix = '' if RELEASE_MODE else ' preview'
    consent = '''<div class="cookie-banner" id="cookie-banner" role="dialog" aria-label="Cookie choices" hidden><div><strong>Your privacy choices</strong><p>We use optional analytics and advertising cookies only if you agree. You can change your choice using Cookie settings in the footer. <a href="/privacy/">Read our privacy policy</a>.</p></div><div class="cookie-actions"><button type="button" data-consent-reject>Reject optional</button><button type="button" data-consent-accept>Accept optional</button></div></div><script src="/assets/consent.js" defer></script>''' if RELEASE_MODE else ''
    return f'''<!doctype html><html lang="en-GB" class="{'pm' if pm else 'boom'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">{robots}<meta name="description" content="{esc(description or title)}"><meta property="og:type" content="website"><meta property="og:title" content="{esc(title)} | {site}"><meta property="og:description" content="{esc(description or title)}"><meta property="og:image" content="{esc(social)}"><meta name="theme-color" content="#080808"><title>{esc(title)} | {site}{suffix}</title><link rel="icon" href="data:,"><link rel="preload" href="/assets/display.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/assets/site.css"></head><body class="{body_class}"><a class="skip-link" href="#main">Skip to content</a>{nav(brand, active, '#tickets' if body_class == 'is-event' else '/whats-on/')}<main id="main">{decades(body)}</main>{footer(brand)}{sticky(brand, sticky_label, sticky_href)}<script src="/assets/site.js" defer></script>{consent}</body></html>'''


def hero(brand, h1, sub, cta, photo_name, eyebrow='', extra='', cls='', loading='eager', h1cls='', cap=None):
    eb = f'<p class="kicker">{esc(eyebrow)}</p>' if eyebrow else ''
    return f'''<section class="hero {cls}"><div class="hero-copy"><div class="hero-inner">{eb}<h1 class="{h1cls}">{h1}</h1><p class="hero-sub">{sub}</p>{extra}{cta}</div></div>{photo(photo_name, 'hero-media', loading, caption=bool(cap), cap=cap)}</section>'''


def ribbon(items, cls=''):
    out = []
    for i, it in enumerate(items):
        title, text = it[0], it[1]
        href = it[2] if len(it) > 2 else None
        ic = it[3] if len(it) > 3 else None
        mark = f'<span class="rib-ico">{icon(ic)}</span>' if ic else f'<span class="dot d{i + 1}" aria-hidden="true"></span>'
        inner = f'{mark}<span><b>{title}</b><small>{text}</small></span>'
        out.append(f'<a class="rib-item" href="{href}">{inner}</a>' if href else f'<div class="rib-item">{inner}</div>')
    return f'<div class="ribbon {cls}"><div class="container ribbon-in">{"".join(out)}</div></div>'


def btn(label, href, cls='btn-dark'):
    return f'<a class="btn {cls}" href="{href}">{label} {ARROW}</a>'


def price_label(value):
    return re.sub(r'£(\d+)\.00\b', r'£\1', value or '')


def group_price(e, event_page=False):
    ticket = e.get('groupTicket')
    if not ticket or e.get('soldout') or not ticket.get('label'):
        return ''
    label = price_label(ticket['label']).replace(' for £', ': £')
    detail = '. Check availability and fees in the ticket selector.' if event_page else ', while available. Fees shown at checkout.'
    return f'<p class="group-price">{esc(label + detail)}</p>'


def event_card(e):
    href = e['path']; b, bc = badge(e)
    name = 'THE 2PM CLUB' if e['brand'] in ('pm', 'boom-crosslink') else FORMAT[e['fmt']][3]
    if e['brand'] != 'pm':
        b = 'Daytime' if e['brand'] == 'boom-crosslink' else 'Family' if e['fmt'] == 'fsd' else 'After dark'
    price = f'<p class="card-price">{esc(price_label(e["price"]))} + booking fee</p>' if e.get('price') else ''
    return f'''<article class="event-card" data-item data-city="{slug(e['city'])}" data-type="{slug(FORMAT[e['fmt']][2] if e['brand'] != 'boom-crosslink' else 'Daytime disco')}" data-date="{e['start'][:10]}"><a class="poster" href="{esc(href)}" tabindex="-1" aria-hidden="true"><img src="{esc(e['poster'])}" alt="" loading="lazy" decoding="async" width="600" height="600"></a><div class="card-body"><span class="badge b-{bc}">{esc(b)}</span><h3><a href="{esc(href)}"><span class="card-event-type">{esc(name)}</span><span class="card-event-city">{esc(e['city'])}</span></a></h3><p class="card-facts">{esc(d_short(e['start']))} · {esc(e['venue'])}<br>{esc(times(e))}</p>{price}{group_price(e)}<a class="btn btn-dark btn-block" href="{esc(href)}" aria-label="View event: {esc(e['title'])}, {esc(d_long(e['start']))}">View event {ARROW}</a></div></article>'''


def event_row(e):
    href = e['path']; b, bc = badge(e)
    return f'''<article class="ev-row" data-item data-city="{slug(e['city'])}" data-type="{slug(FORMAT[e['fmt']][2] if e['brand'] != 'boom-crosslink' else 'Daytime disco')}" data-date="{e['start'][:10]}"><a class="row-poster" href="{esc(href)}" tabindex="-1" aria-hidden="true"><img src="{esc(e['poster'])}" alt="" loading="lazy" width="300" height="300"></a><div class="row-body"><span class="badge b-{bc}">{esc(b)}</span><h3><a href="{esc(href)}">{esc(d_mid(e['start']))}</a></h3><p class="row-facts"><span>{icon('pin')}{esc(e['venue'])}</span><span>{icon('clock')}{esc(times(e))}</span></p></div><a class="btn btn-dark row-btn" href="{esc(href)}" aria-label="View event: {esc(e['title'])}, {esc(d_long(e['start']))}">View event {ARROW}</a></article>'''


def date_row(e):
    return f'''<a class="date-row" href="{esc(e['path'])}"><span class="date-ico">{icon('calendar')}</span><span class="date-txt"><small>{esc(d_short(e['start']))} · {esc(e['venue'])}</small><strong>{esc(e['city'])}</strong></span><span class="btn btn-dark btn-sm">View event {ARROW}</span></a>'''


def filters(events, featured=0, type_label='All parties', with_city=True):
    cities = sorted({e['city'] for e in events})
    types = sorted({FORMAT[e['fmt']][2] if e['brand'] != 'boom-crosslink' else 'Daytime disco' for e in events})
    months = sorted({e['start'][:7] for e in events})
    def sel(ident, label, first, options):
        return f'<label class="sel"><span class="sr-only">{label}</span><select id="{ident}" data-filter="{ident.split("-")[1]}"><option value="">{first}</option>{options}</select></label>'
    city = sel('filter-city', 'City', 'All cities', ''.join(f'<option value="{slug(c)}">{esc(c)}</option>' for c in cities)) if with_city and len(cities) > 1 else ''
    month = sel('filter-month', 'Month', 'All dates', ''.join(f'<option value="{m}">{datetime.strptime(m, "%Y-%m").strftime("%B %Y")}</option>' for m in months))
    typ = sel('filter-type', 'Type', type_label, ''.join(f'<option value="{slug(x)}">{esc(x)}</option>' for x in types)) if len(types) > 1 else ''
    return f'<div class="filters" data-filters data-featured="{featured}">{city}{month}{typ}<button class="reset" type="button" hidden>Reset</button></div>'


def results(events, kind='cards'):
    grid = ''.join(event_card(e) for e in events) if kind == 'cards' else ''.join(event_row(e) for e in events)
    return f'<p class="count" role="status" aria-live="polite"></p><div class="{"card-grid" if kind == "cards" else "rows"}">{grid}</div><p class="empty" hidden>No events match those filters. <button type="button" class="empty-reset">Show all events</button></p>'


def band(brand, photo_name, h2, links, sub=''):
    ls = ''.join(f'<a href="{u}">{x} {ARROW}</a>' for x, u in links)
    s = f'<p>{sub}</p>' if sub else ''
    return f'<section class="band">{photo(photo_name, "band-media", caption=False)}<div class="band-copy"><h2>{h2}</h2>{s}<nav class="band-links" aria-label="Explore">{ls}</nav></div></section>'


def signup(brand, h2='', sub='', city=None, events=None, cls=''):
    # The current 2PM newsletter is a placeholder, and this twin has no capture
    # endpoint. Keep the section useful without suggesting an email was saved.
    heading = f'SEE WHAT’S COMING TO {esc(city.upper())}.' if city else 'FIND YOUR NEXT PARTY.'
    detail = ('See the live dates and ticket options in your city.' if city else
              'Choose your city, date and the party that sounds like you.')
    href = '#city-dates' if city else '/whats-on/'
    return f'''<section class="signup {cls}" id="signup"><div class="container signup-in"><div><h2>{heading}</h2><p class="signup-sub">{detail}</p></div><a class="btn btn-dark" href="{href}">See dates and tickets {ARROW}</a></div></section>'''


def acc(q, a, open_=False):
    return f'<details class="acc"{" open" if open_ else ""}><summary>{esc(q)}</summary><div class="acc-body"><p>{a}</p></div></details>'


def quote_block(q, cls=''):
    if not q: return ''
    return f'<figure class="quote {cls}"><blockquote>“{esc(q[0])}”</blockquote><figcaption>{esc(q[1])}</figcaption></figure>'


def chips(groups, limit=None):
    out = []
    for label, colour, items in groups:
        dot = f'<span class="ch-dot c-{colour}" aria-hidden="true"></span>' if colour else ''
        its = items[:limit] if limit else items
        head = '' if label == 'The soundtrack' else f'<h3>{dot}<span>{esc(label)}</span></h3>'
        out.append(f'<div class="chip-group">{head}<ul class="chips">{"".join(f"<li>{esc(x)}</li>" for x in its)}<li class="more">and more</li></ul></div>')
    return ''.join(out)


def section_head(h2, extra='', eyebrow='', id_=''):
    eb = f'<p class="eyebrow">{eyebrow}</p>' if eyebrow else ''
    return f'<div class="sec-head"{f" id={id_}" if id_ else ""}><div>{eb}<h2>{h2}</h2></div>{extra}</div>'


def steps(items, cls=''):
    return f'<ol class="steps {cls}">' + ''.join(f'<li><b class="num">{i + 1:02d}</b><div><h3>{h}</h3><p>{p}</p></div></li>' for i, (h, p) in enumerate(items)) + '</ol>'


def pill_cards(items):
    out = []
    for img, label, colour, text in items:
        if img:
            name, _, pos = img.partition('@')
            fig = photo(name, "pcard-media", caption=False, pos=pos or None)
        else:
            fig = f'<div class="pcard-media pcard-graphic c-{colour}" aria-hidden="true"><span>{esc(label)}</span></div>'
        out.append(f'<div class="pcard">{fig}<span class="pcard-pill c-{colour}">{esc(label)}</span><p>{text}</p></div>')
    return '<div class="pcards">' + ''.join(out) + '</div>'


def qa_cta(brand, questions, h2, sub, label, href, eyebrow='Common questions'):
    return f'''<section class="qa-cta container"><div class="qa"><h2>{eyebrow.upper()}</h2>{''.join(acc(q, a) for q, a in questions)}<a class="text-link" href="/faqs/">All FAQs {ARROW}</a></div><div class="cta-block"><h2>{h2}</h2><p>{sub}</p>{btn(label, href)}</div></section>'''


def strip(photo_name):
    return f'<div class="strip">{photo(photo_name, "strip-media")}</div>'


# ---------------------------------------------------------------- pages

def next_up(events):
    if not events: return ''
    e = events[0]
    return f'<a class="hero-next" href="{esc(e["path"])}"><small>Next up</small><b>{esc(d_short(e["start"]))} · {esc(e["city"])}</b> {ARROW}</a>'


def home_city_finder(brand, events):
    """Put every on-sale city within reach before any chronological event cards."""
    cities = sorted({e['city'] for e in events if on_sale(e)})
    links = ''.join(
        f'<a href="{city_url(brand, city)}" aria-label="See {esc(city)} events">{esc(city)}</a>'
        for city in cities
    )
    return f'<nav class="home-city-finder" aria-label="Find events by city"><span>Find your city</span><div class="home-city-links">{links}</div></nav>'


def home(brand, events):
    pm = brand == 'pm'
    if pm:
        h = hero(brand, 'YOUR BEST <br class="m-br">NIGHT OUT.<br>IN THE MIDDLE OF<br>THE AFTERNOON.', 'Sing Out Loud Anthems from the 80s, 90s and 00s. Home by 7-ish.', btn(f'See all {len(events)} dates', '/events/', 'btn-hot') + f'<a class="hero-link" href="/what-to-expect/">First time? See what happens {ARROW}</a>' + home_city_finder(brand, events), 'pm-hero.webp', eyebrow='THE 2PM CLUB Daytime Disco', extra='<p class="hero-proof">Wham! to Whitney. Bon Jovi to Beyoncé. Doors at 2pm.</p>', h1cls='h1-long')
        rib = ribbon([('BIG CHORUSES', 'Sing Out Loud Anthems'), ('THIS SEASON', '80s Editions and Christmas specials'), ('SATURDAY NIGHT', 'Strictly on the sofa later') if STRICTLY_SEASON_2026 else ('AFTERNOON PLANS', 'Doors 2pm, home by 7-ish')])
        head = section_head('YOUR NEXT AFTERNOON', filters(events, 0, 'All editions'))
        music = pm_music_section(events)
        guide = f'''<section class="guide container" aria-labelledby="guide-h"><a class="guide-card" href="/blog/what-is-a-daytime-disco/">{photo('pm-arms.jpg', 'guide-media', caption=False)}<div class="guide-copy"><p class="eyebrow">The 2PM CLUB guide · New here?</p><h2 id="guide-h">WHAT IS A DAYTIME DISCO?</h2><p>The music, the timing, who goes and how to book, in one short read. Send it to whoever in the group chat is still asking.</p><span class="btn btn-hot">Read the guide {ARROW}</span></div></a></section>'''
        proof = f'''<section class="proof container"><div class="proof-lead">{quote_block(QUOTES['lorne'], 'quote-xl')}<p>Bring your group or come on your own. The songs give everyone something to sing about.</p></div><div class="proof-more">{quote_block(QUOTES['diane'])}{quote_block(QUOTES['lara'])}{quote_block(QUOTES['friends'])}</div></section>'''
        body = h + rib + f'<section class="section container" id="upcoming">{head}{results(events)}</section>' + band(brand, 'pm-friends.jpeg', 'ALL THE CHORUSES.<br>ALL YOUR PEOPLE.', [('What to expect', '/what-to-expect/'), ('The music', '#music'), ('Bring your group', '/group-bookings/')]) + music + guide + proof + signup(brand, 'YOUR CITY. YOUR NEXT AFTERNOON.', 'Be first to hear when THE 2PM CLUB announces a date near you.', events=events)
        return page(brand, 'Your best night out. In the middle of the afternoon.', body, 'THE 2PM CLUB Daytime Disco: Sing Out Loud Anthems from the 80s, 90s and 00s. Doors 2pm, home by 7-ish.', '/')
    h = hero(brand, 'THE MIDLANDS’<br>PARTY STARTERS<br>SINCE 2014.', 'THE 2PM CLUB by day. Silent Disco Greatest Hits after dark. Decades Parties with Boombastic 90s and Footloose 80s. Family Silent Disco too.', btn(f'See all {len(events)} dates', '/whats-on/') + home_city_finder(brand, events), 'boom-hero.jpg', extra='<p class="hero-proof">TRUSTED BY THOUSANDS.</p>', h1cls='h1-boom')
    rib = ribbon([('DAYTIME', 'THE 2PM CLUB, doors at 2pm', PM_BASE + '/'), ('AFTER DARK', 'Silent Disco and Decades Parties', '/about/#parties'), ('FAMILY', 'Family Silent Disco, ages 4+', '/family-silent-disco/')], cls='rib-short')
    head = section_head('WHAT’S COMING UP', filters(events, 0))
    parties = boom_parties_grid()
    rel = f'''<section class="relation container"><div class="relation-copy"><p class="eyebrow">The people behind the party</p><h2>11AM, 2PM OR AFTER DARK.</h2><p>Family Silent Disco in the morning. THE 2PM CLUB in the afternoon. Silent Disco Greatest Hits and Decades Parties after dark. Same Boombastic team, bringing people together since 2014.</p>{btn('Explore THE 2PM CLUB', PM_BASE + '/')}</div><div class="relation-quotes">{quote_block(QUOTES['emma_r'])}</div></section>'''
    body = h + rib + f'<section class="section container" id="upcoming">{head}{results(events)}</section>' + band(brand, 'sd-four-friends.jpg', 'PICK YOUR PARTY.<br>BRING YOUR PEOPLE.', [('Daytime discos', PM_BASE + '/'), ('Silent discos', '/silent-disco/'), ('Decades Parties', '/about/#parties'), ('Family parties', '/family-silent-disco/')]) + parties + rel + signup(brand, 'YOUR CITY. YOUR NEXT NIGHT OUT.', 'Be first to hear about new parties near you.', events=events)
    return page(brand, 'The Midlands’ party starters since 2014', body, 'Trusted by thousands. Boombastic Events runs daytime discos, silent discos, Decades Parties and family parties across the Midlands.', '/')


def pm_music_section(events):
    x80 = next((e for e in events if e['fmt'] == 'pm80'), None)
    xmas = next((e for e in events if e['fmt'] == 'pmxmas'), None)
    cols = ''
    if x80:
        g = artist_groups(x80)
        cols += f'<div class="music-col"><span class="badge b-pink">80s Edition</span><h3>FOUR HOURS OF 80s.</h3><ul class="chips">{"".join(f"<li>{esc(a)}</li>" for a in (g[0][2] if g else []))}</ul><p class="music-dates">Milton Keynes and Northampton this autumn.</p></div>'
    if xmas:
        g = artist_groups(xmas)
        fest = next((x for x in g if x[0] == 'Christmas hits'), None); anth = next((x for x in g if x[0].startswith('80s')), None)
        cols += f'<div class="music-col"><span class="badge b-hot">Christmas</span><h3>FESTIVE, THEN EVERYTHING.</h3><ul class="chips">{"".join(f"<li>{esc(a)}</li>" for a in (fest[2] if fest else []))}</ul><ul class="chips chips-alt">{"".join(f"<li>{esc(a)}</li>" for a in (anth[2] if anth else []))}</ul><p class="music-dates">Leicester, Northampton, Coventry and Bedford in Nov and Dec.</p></div>'
    return f'''<section class="music" id="music"><div class="container"><div class="music-head"><p class="eyebrow">The music</p><h2>IF THE WHOLE ROOM CAN’T SING IT, IT DOESN’T GET PLAYED.</h2><p>Whitney, Wham!, Madonna and the choruses you forgot you knew by heart. Some dates go all 80s; Christmas starts festive.</p></div><div class="music-cols">{cols}</div></div></section>'''


PARTIES = [
    ('THE 2PM CLUB', 'pm-three.jpg', 'Saturday afternoon disco. Sing Out Loud Anthems from the 80s, 90s and 00s, doors at 2pm.', 'Daytime', PM_BASE + '/'),
    ('SILENT DISCO GREATEST HITS', 'sd-energy.jpg', 'Three DJs, three channels, one dancefloor. Pop, indie or dance, switch whenever you like.', 'After dark', '/silent-disco/'),
    ('BOOMBASTIC 90s', 'b90-stage.jpg', 'Pop, Britpop, dance and hip-hop with 90s videos on giant screens.', 'After dark', '/boombastic-90s/'),
    ('FAMILY SILENT DISCO', 'poster-061226-fsd-npton.webp', 'Three family-friendly channels for kids 4+ and the grown-ups who bring them.', 'Family', '/family-silent-disco/'),
    ('FOOTLOOSE 80s', 'fl-room.jpg', 'Wall-to-wall 80s, Madonna and Queen to Bon Jovi and Whitney.', 'After dark', '/footloose-80s/'),
]


def party_status(u):
    """'No date on sale' line for a Boombastic format page with nothing on sale in the dated snapshot."""
    tok = next((t for k, _, t in FORMAT_PAGES if u == f'/{k}/'), None)
    return '<span class="party-nodate">No date on sale at present.</span>' if tok and not format_dates(tok) else ''


def boom_parties_grid(cls=''):
    cards = ''.join(f'<a class="party-card" href="{u}">{photo(img, "party-media", caption=not img.startswith("poster-"))}<span class="party-when">{when}</span><h3>{name}</h3><p>{txt}{party_status(u)}</p><b>Explore {ARROW}</b></a>' for name, img, txt, when, u in PARTIES)
    return f'<section class="parties container {cls}" id="parties">{section_head("FIND YOUR KIND OF PARTY", "", "Our parties")}<div class="party-grid">{cards}</div></section>'


def listing(brand, events):
    pm = brand == 'pm'
    body = f'''<section class="page-band"><div class="container"><p class="eyebrow">What’s on</p><h1>{'YOUR NEXT AFTERNOON.' if pm else 'FIND YOUR NEXT PARTY.'}</h1><p>{'Every upcoming THE 2PM CLUB Daytime Disco. Pick a city, a date or an edition.' if pm else 'Your next daytime disco, silent disco, Decades Party or family party. Pick what sounds like you.'}</p></div></section><section class="section container" id="upcoming">{section_head(f'{len(events)} DATES ON SALE', filters(events, 0, 'All editions' if pm else 'All parties'))}{results(events)}</section>'''
    description = ('Find upcoming THE 2PM CLUB daytime discos and day parties by city and date. See venues, event details and live tickets.' if pm
                   else 'Find upcoming Boombastic daytime discos, silent discos, Decades Parties and family events by city and date.')
    return page(brand, 'What’s on', body, description, '/whats-on/')


def details(brand, e):
    c = event_copy(e)
    pre, eyebrow = FORMAT[e['fmt']][3], FORMAT[e['fmt']][4]
    date, tm = d_mid(e['start']), times(e)
    addr = street(e)
    note = notice(e)
    base = PM_BASE if brand == 'pm' else BOOM_BASE
    share = 'https://wa.me/?text=' + quote(f"{clean_title(e)}, {e['city']}, {d_long(e['start'])}, {tm}: {base + e['path']}")
    b, bc = badge(e)
    alert = f'<a class="hero-alert" href="#good-to-know">{icon("info")}<span>{esc(note[0])}: read before you book</span></a>' if note else ''
    adult_event = brand == 'pm' or e['code'] == '260926-SD-NPTON' or e['fmt'] == 'hhp'
    facts_list = f'<ul class="hero-facts"><li>{icon("calendar")}<span>{esc(date)}</span></li><li>{icon("clock")}<span>{esc(tm)}</span></li><li>{icon("pin")}<span>{esc(e["venue"])}, {esc(e["city"])}</span></li>{f"<li>{icon('info')}<span>18+ event</span></li>" if adult_event else ""}</ul>'
    book_cls = 'btn-hot' if brand == 'pm' else 'btn-coral'
    if brand == 'pm':
        reel = PM_REEL_BASE + ('/2pm-christmas-2026.mp4' if e['fmt'] == 'pmxmas' else '/hero-1x1-' + PM_REEL_CITIES[e['city']] + '.mp4' if e['city'] in PM_REEL_CITIES else '/hero-1x1.mp4')
        media = f'''<figure class="ev-poster ev-poster-reel"><img src="{esc(e['poster'])}" alt="Official promotional artwork for {esc(e['title'])}, {esc(date)}" width="800" height="800" fetchpriority="high"><video data-event-reel data-primary="{esc(reel)}" data-fallback="{esc(PM_REEL_MASTER)}" muted loop playsinline preload="none" controls aria-label="Footage from a previous THE 2PM CLUB event"></video><figcaption>Footage from a previous THE 2PM CLUB event</figcaption></figure>'''
    else:
        media = f'''<figure class="ev-poster"><img src="{esc(e['poster'])}" alt="Official promotional artwork for {esc(e['title'])}, {esc(date)}" width="800" height="800" fetchpriority="high"></figure>'''
    hero_html = f'''<section class="ev-hero"><div class="ev-copy"><div class="hero-inner">{f'<p class="kicker">{esc(eyebrow)}</p>' if eyebrow else ''}<h1><span class="pre">{esc(pre)}</span> <span class="city">{esc(e['city'])}</span></h1><p class="hero-sub">{esc(c['sub'])}</p>{facts_list}{alert}{btn('Find your tickets', '#tickets', 'btn-dark' if brand == 'boom' else 'btn-hot')}</div></div>{media}</section>'''
    fact_rib = f'<div class="ribbon fact-rib"><div class="container ribbon-in"><div class="rib-item"><span class="rib-ico i1">{icon("calendar")}</span><b>{esc(date.upper())}</b></div><div class="rib-item"><span class="rib-ico i2">{icon("clock")}</span><b>{esc(tm.upper())}</b></div><div class="rib-item"><span class="rib-ico i3">{icon("pin")}</span><b>{esc(e["venue"].upper())}</b></div></div></div>'
    note_html = f'<section class="container"><div class="notice" id="good-to-know" role="note">{icon("info")}<div><h2>{esc(note[0])}</h2><p>{esc(note[1])} Access questions: <a href="mailto:{EMAIL}">{EMAIL}</a>.</p></div></div></section>' if note else ''
    bullets = ''.join(f'<li><span class="bubble bb{i + 1}">{icon(ic)}</span><span>{esc(txt)}</span></li>' for i, (ic, txt) in enumerate(c['bullets']))
    groups = artist_groups(e)
    music = f'<div class="ev-music"><h3 class="mini-h">{"THE CHANNELS" if any(g[1] for g in groups) else "THE SOUNDTRACK"}</h3>{chips(groups)}</div>' if groups else ''
    price = f'<p class="dc-price">{esc(price_label(e["price"]))} + booking fee</p>' if e.get('price') else ''
    status = f'<p class="dc-status">{esc(e["status"])}</p>' if e.get('status') else ''
    date_card = f'''<aside class="date-card" aria-label="Booking summary"><h2>MAKE IT A DATE</h2><ul><li>{icon("calendar")}{esc(date.upper())}</li><li>{icon("clock")}{esc(tm.upper())}</li><li>{icon("pin")}{esc(e["venue"].upper())}</li></ul>{price}{group_price(e, True)}{status}<p class="dc-live">Check live availability in the ticket selector</p>{btn('Choose tickets', '#tickets', 'btn-block ' + book_cls)}<p class="dc-eb">Ticketing powered by <b>Eventbrite</b></p><a class="dc-share" href="{esc(share)}" target="_blank" rel="noopener noreferrer">{icon("share")}Share with your group {ARROW}</a></aside>'''
    sell = f'''<div class="sell"><p class="eyebrow">{esc(b)}</p><h2>{c['h2']}</h2><p class="lede">{esc(c['lede'])}</p><ul class="bullets">{bullets}</ul>{music}{quote_block(c['quote'])}</div>'''
    main = f'<section class="ev-main container">{sell}{date_card}</section>'
    ph = PM_CITY_PHOTO.get(e['city'], c['photo']) if e['brand'] == 'pm' else c['photo']
    strip_html = f'<div class="ev-strip">{photo(ph, "strip-media")}</div>' if ph else ''
    fallback = f'/tickets/{e["code"].lower()}/'
    tickets = f'''<section class="tickets container" id="tickets"><div class="tickets-intro"><p class="eyebrow">Tickets</p><h2>CHOOSE YOUR TICKETS.</h2><p>Secure checkout by Eventbrite. The selector shows live ticket types, fees and availability for {esc(date)}. Nothing is booked until you complete checkout.</p><p class="tickets-fallback">Selector not loading? <a href="{esc(fallback)}" rel="noopener">Open ticket checkout ↗</a></p></div><div class="ticket-widget" id="eventbrite-tickets" data-eventbrite-id="{esc(e['eventbriteId'])}" role="region" aria-label="Live ticket options for {esc(e['title'])}"><p class="widget-loading">Loading live tickets…</p></div></section>'''
    maps = 'https://www.google.com/maps/search/?api=1&query=' + quote(', '.join([e['venue']] + addr))
    addr_html = '<br>'.join(esc(x) for x in addr) if addr else 'Address on your ticket confirmation.'
    group_a = 'Group options vary by date. Open the ticket selector above to see what is on sale for this event. For a larger group, email ' + f'<a href="mailto:{EMAIL}">{EMAIL}</a> with the date and numbers.'
    wear = 'No dress code. Wear what you can dance in.' if e['fmt'] != 'fsd' else 'Christmas jumpers very welcome. Comfortable shoes for dancing.'
    access_a = (esc(note[1]) + ' ' if note else '') + f'For anything else about access, email <a href="mailto:{EMAIL}">{EMAIL}</a> with the date and what you need before you book or travel.'
    visit = f'''<section class="visit container"><div class="visit-venue"><h2>PLAN YOUR VISIT</h2><div class="visit-grid"><p><strong>{esc(e['venue'])}</strong><br>{addr_html}</p><div class="visit-links"><a href="{esc(maps)}" target="_blank" rel="noopener noreferrer">{icon("pin")}Directions {ARROW}</a><a href="{'#good-to-know' if note else '/contact/'}">{icon("access")}Access information {ARROW}</a></div></div></div><div class="visit-qa">{acc('What time does it finish?', f'This date runs {esc(tm)}. Times vary between events, so check the date you book.')}{acc('What should I wear?', wear)}{acc('Can we book as a group?', group_a)}{acc('What if I have an access question?', access_a)}</div></section>'''
    others = [x for x in CURRENT_EVENTS[brand] if x['code'] != e['code']][:3]
    related = f'<section class="section container related">{section_head("MORE COMING UP", f"<a class=text-link href=/whats-on/>See all events {ARROW}</a>")}<div class="card-grid">{"".join(event_card(x) for x in others)}</div></section>'
    body = hero_html + fact_rib + note_html + main + (tickets + strip_html if brand == 'pm' else strip_html + tickets) + visit + related
    description = (f'THE 2PM CLUB daytime disco in {e["city"]} on {d_long(e["start"])}. {e["venue"]}, {tm}. Music, access information and live tickets.' if brand == 'pm'
                   else f'{clean_title(e)} on {d_long(e["start"])}. {e["venue"]}, {e["city"]}, {tm}. Event details and live tickets.')
    return page(brand, f"{clean_title(e)}, {e['city']}, {d_short(e['start'])}", body, description, image=base + e['poster'], sticky_label='Choose tickets', sticky_href='#tickets', body_class='is-event')


def clean_title(e):
    t_ = e['title'].replace('THE 2PM CLUB Daytime Disco: ', 'THE 2PM CLUB ').replace("Boombastic's ", 'Boombastic ')
    return t_


def locations(brand, events):
    pm = brand == 'pm'
    live = [c for c, _ in live_cities(brand)]
    tiles = []
    for city in live:
        rel = [e for e in events if e['city'] == city and on_sale(e)]
        thumbs = ''.join(f'<img src="{esc(e["poster"])}" alt="" loading="lazy" width="120" height="120">' for e in rel[:3])
        venues = ', '.join(sorted({e['venue'] for e in rel}))
        meta = f'<p class="loc-count">{len(rel)} date{"s" if len(rel) != 1 else ""} on sale</p><p class="loc-next">Next: {esc(d_short(rel[0]["start"]))} · {esc(rel[0]["venue"])}</p>'
        tiles.append(f'<a class="loc-tile" href="{city_url(brand, city)}"><div class="loc-thumbs">{thumbs}</div><h2>{esc(city.upper())}</h2>{meta}<b>Explore {esc(city)} {ARROW}</b></a>')
    quiet = [c for c in verified_places(brand) if c not in live]
    quiet_rows = ''.join(f'<li><a href="{city_url(brand, c)}">{esc(c)}</a><span>No date announced at the moment.{" Nearest dates on sale: " + " and ".join(nearest_live(brand, c)) + "." if nearest_live(brand, c) else ""}</span></li>' for c in quiet)
    quiet_html = f'<section class="loc-quiet container" aria-labelledby="quiet-h"><h2 id="quiet-h">Other places we’ve partied</h2><p>We’ve held events here before. Nothing is on sale {'here' if len(quiet) == 1 else 'in these places'} at the moment.</p><ul>{quiet_rows}</ul></section>' if quiet else ''
    h = hero(brand, 'YOUR CITY.<br>YOUR NEXT<br>' + ('AFTERNOON.' if pm else 'PARTY.'), 'Pick your city for dates on sale, venue details and how to get there.', btn('Find your city', '#cities', 'btn-hot' if pm else 'btn-dark'), 'pm-packed.jpg' if pm else 'b90-crowd.jpg')
    rib = ribbon([('LOCAL DATES', 'Find an afternoon near you' if pm else 'Find a party near you'), ('REAL VENUES', 'Addresses and access for each date'), ('PICK YOUR EDITION', '80s and Christmas dates') if pm else ('PICK YOUR PARTY', 'Daytime, after dark or family')])
    final = f'<section class="final-band"><div class="container final-in"><h2>EVERY DATE. EVERY CITY.</h2>{btn("See what’s on", "/whats-on/")}</div></section>'
    body = h + rib + f'<section class="section container" id="cities">{section_head("DATES ON SALE BY CITY", "", "Where we party")}<div class="loc-grid">{"".join(tiles)}</div></section>' + quiet_html + strip('pm-wide.jpg' if pm else 'fl-room.jpg') + final
    return page(brand, 'Locations', body, 'Find upcoming ' + ('THE 2PM CLUB daytime discos' if pm else 'Boombastic parties') + ' by city. See real dates, venues and tickets.', '/locations/')


def empty_city_page(brand, city):
    """A verified place with nothing on sale: say so plainly and point to real, bookable dates nearby."""
    pm = brand == 'pm'
    near = nearest_live(brand, city)
    nearby = sorted([e for e in CURRENT_EVENTS[brand] if on_sale(e) and e['city'] in near], key=lambda e: e['start'])[:4] if near else [e for e in CURRENT_EVENTS[brand] if on_sale(e)][:3]
    near_txt = ' and '.join(near)
    what = 'THE 2PM CLUB dates' if pm else 'dates'
    sub = f'No date announced in {esc(city)} at the moment. ' + (f'The nearest {what} on sale are in {esc(near_txt)}.' if near else f'Here are the next {what} on sale.')
    h = hero(brand, f'<span class="city-big">{esc(city.upper())}</span>NO DATE<br>ANNOUNCED<br>RIGHT NOW.', sub, btn('See the nearest dates' if near else 'See dates on sale', '#nearby', 'btn-hot' if pm else 'btn-dark'), 'pm-packed.jpg' if pm else 'boom-hero.jpg', cls='city-hero')
    rib = ribbon([('NEAREST DATES', esc(near_txt) if near else 'On sale now', '#nearby'), ('ALL LOCATIONS', 'Every city with dates on sale', '/locations/'), ('EVERY DATE', 'All cities on What’s on', '/whats-on/')])
    rows = ''.join(event_row(e) for e in nearby)
    others = ''.join(f'<li><a href="{city_url(brand, c)}">{esc(c)}</a></li>' for c, _ in live_cities(brand))
    main = f'''<section class="section container" id="nearby">{section_head(("NEAREST DATES ON SALE" if near else "DATES ON SALE NOW"), f"<a class=text-link href=/whats-on/>All dates {ARROW}</a>")}<p class="nearby-lead">{"The closest dates you can book now, in " + esc(near_txt) + "." if near else "The next dates you can book now."}</p><div class="rows">{rows}</div><div class="nearby-more"><h3>ALL CITIES WITH DATES ON SALE</h3><ul class="city-chips">{others}</ul></div></section>'''
    body = f'<nav class="crumbs container" aria-label="Breadcrumb"><a href="/locations/">Locations</a> / {esc(city)}</nav>' + h + rib + main
    desc = f'No date announced in {city} at the moment.' + (f' Nearest dates on sale in {near_txt}.' if near else '')
    return page(brand, city, body, desc, city_url(brand, city), sticky_label='See nearest dates' if near else 'Find tickets', sticky_href='#nearby' if near else '/whats-on/')


def city_page(brand, city, events):
    pm = brand == 'pm'
    rel = [e for e in events if e['city'] == city]
    if not any(on_sale(e) for e in rel): return empty_city_page(brand, city)
    venues = sorted({e['venue'] for e in rel})
    photo_name = PM_CITY_PHOTO.get(city, 'pm-packed.jpg') if pm else {'Northampton': 'sd-energy.jpg', 'Bedford': 'b90-stage.jpg'}.get(city, 'boom-hero.jpg')
    # Supporting strip: never the hero photo; Boombastic cities with only 2PM dates show that city's real 2PM photo, captioned.
    strip_name = {'Northampton': 'pm-group.jpg', 'Leicester': 'pm-three.jpg', 'Coventry': 'pm-arms.jpg', 'Bedford': 'pm-friends.jpeg', 'Milton Keynes': 'pm-hug.jpg'}.get(city, 'pm-wide.jpg') if pm else {'Northampton': 'silent-photo.jpeg', 'Bedford': 'pm-bed.jpg'}.get(city, PM_CITY_PHOTO.get(city, 'b90-group.jpg'))
    kinds = list(dict.fromkeys('THE 2PM CLUB' if e['brand'] == 'boom-crosslink' else FORMAT[e['fmt']][0] for e in rel))
    kind_list = ', '.join(kinds[:3]) + (' and more' if len(kinds) > 3 else '')
    sub = (f'THE 2PM CLUB Daytime Disco in {esc(city)}. See the editions, venues and times for every date on sale.' if pm else f'{esc(kind_list)} in {esc(city)}. See dates, venues and tickets below.')
    cta = btn(f'See {esc(city)} dates', '#city-dates', 'btn-hot' if pm else 'btn-dark')
    h = hero(brand, f'<span class="city-big">{esc(city.upper())}</span>YOUR TOWN.<br>YOUR NEXT {"AFTERNOON" if pm else "PARTY"}.', sub, cta, photo_name, cls='city-hero')
    rib = ribbon([(f'{len(rel)} DATE{"S" if len(rel) != 1 else ""} ON SALE', f'Next: {d_short(rel[0]["start"])}'), ('REAL DANCEFLOORS', ', '.join(venues)), ('YOUR PLAN', 'Bring friends or come on your own' if pm else 'Pick the party that sounds like you')])
    list_html = f'<section class="section container" id="city-dates">{section_head("COMING UP IN " + esc(city.upper()), filters(rel, 0, "All editions" if pm else "All parties", with_city=False))}{results(rel, "rows")}</section>'
    venue_cards = []
    for v in venues:
        item = next(e for e in rel if e['venue'] == v)
        addr = street(item)
        maps = 'https://www.google.com/maps/search/?api=1&query=' + quote(', '.join([v] + addr))
        venue_cards.append(f'<div class="venue-card"><h3>{esc(v)}</h3><p>{icon("pin")}<span>{"<br>".join(esc(x) for x in addr) or "Address on your ticket"}</span></p><a href="{esc(maps)}" target="_blank" rel="noopener noreferrer">{icon("nav")}Directions {ARROW}</a></div>')
    notes = []
    for e in rel:
        n = notice(e)
        if n and e['fmt'] in ('pm80', 'fsd', 'hhp') and e['brand'] != 'boom-crosslink':
            notes.append(f'<p><strong>{esc(d_short(e["start"]))}:</strong> {esc(n[1])} <a href="{esc(e["path"])}#good-to-know">Details {ARROW}</a></p>')
    if 'The Charles Bradlaugh' in venues:
        both = any(e['code'] == '031026-2PM-NPTON' for e in rel)
        hhp = ' The Halloween House Party also uses both floors.' if any(e['fmt'] == 'hhp' for e in rel) else ''
        access = ('The 3rd October 2PM CLUB uses both floors; the upstairs room is reached by steps. Check the specific event page before booking or travelling.' if both else
                  'Some events use an upstairs room reached by steps. Check the specific event page before booking or travelling.')
        notes.insert(0, f'<p><strong>The Charles Bradlaugh:</strong> {access}{hhp}</p>')
    notes_html = f'<div class="kb-notes">{"".join(notes)}<p class="kb-access">{icon("access")}<span>Access questions? <a href="mailto:{EMAIL}">Get in touch {ARROW}</a></span></p></div>'
    kb = f'<section class="kb container"><div class="kb-intro"><h2>KNOW BEFORE YOU GO</h2><p class="kb-lead">{"Different dates. Different venues." if len(venues) > 1 else esc(venues[0]) if venues else ""}</p><p>Check the venue on your chosen event before travelling.</p></div><div class="kb-venues">{"".join(venue_cards)}</div>{notes_html}</section>' if venues else ''
    su = signup(brand, city=city, cls='signup-band')
    body = f'<nav class="crumbs container" aria-label="Breadcrumb"><a href="/locations/">Locations</a> / {esc(city)}</nav>' + h + rib + list_html + kb + strip(strip_name) + su
    desc = (f'THE 2PM CLUB daytime disco in {city}. See upcoming dates, {", ".join(venues)}, venue information and live tickets.' if pm
            else f'Boombastic events and parties in {city}. See upcoming dates, {", ".join(venues)}, venue information and live tickets.')
    return page(brand, city, body, desc, city_url(brand, city))


def boom_format(key, events):
    F = BOOM_FORMATS[key]
    rel = [e for e in events if e['fmt'] in F['fmts']]
    now = ('See what’s on', '/whats-on/')  # no-date formats: the next step is real events on sale, not a preview signup
    h = hero('boom', F['h1'], F['sub'], btn(F['cta'], '#dates') if rel else btn(*now), F['hero'], eyebrow=F['eyebrow'], cap=F.get('hero_cap'))
    rib = ribbon(F['ribbon'])
    how = f'<section class="section container how">{section_head(F["how_h"])}{steps(F["steps"])}{pill_cards(F["cards"])}{F.get("after", "")}</section>'
    if rel:
        dates = f'<section class="section container" id="dates">{section_head(F["dates_h"])}<div class="date-rows">{"".join(date_row(e) for e in rel[:4])}</div></section>'
    else:
        dates = f'<section class="section container" id="dates">{section_head("NO DATE ON SALE")}<div class="no-date"><p>{esc(F["nodate"])} See the Boombastic events on sale now.</p>{btn(*now)}</div></section>'
    qa = qa_cta('boom', F['faq'], 'GOOD TIMES.<br>GREAT COMPANY.', F['cta_sub'], *((F['cta'], '#dates') if rel else now))
    body = h + rib + how + (strip(F['strip']) if F['strip'] else '') + dates + qa
    token = next(t for k, _, t in FORMAT_PAGES if k == key)
    if bool(rel) != bool(format_dates(token)): raise SystemExit(f'{key}: format page shows {len(rel)} dates but the feed has {len(format_dates(token))} on sale')
    return page('boom', F['title'], body, F['sub'], f'/{key}/', sticky_label='Find tickets' if rel else now[0], sticky_href='#dates' if rel else now[1])


def sd_channels():
    sd = next((e for e in CURRENT_EVENTS['boom'] if e['fmt'] == 'sd'), None)
    g = artist_groups(sd) if sd else []
    col = {x[1]: x for x in g if x[1]}
    def text(c, fallback):
        return ', '.join(col[c][2]) + '.' if c in col else fallback
    return g, text


BOOM_FORMATS = {}


def build_formats():
    g, sdtext = sd_channels()
    fsd = next((e for e in CURRENT_EVENTS['boom'] if e['fmt'] == 'fsd'), None)
    fg = {x[1]: x for x in artist_groups(fsd) if x[1]} if fsd else {}
    b90 = next((e for e in CURRENT_EVENTS['boom'] if e['fmt'] == 'b90'), None)
    b90_art = artist_groups(b90)[0][2] if b90 else []
    BOOM_FORMATS.update({
        'silent-disco': dict(title='Silent Disco Greatest Hits', eyebrow='Silent Disco Greatest Hits', h1='THREE CHANNELS.<br>ONE DANCEFLOOR.', sub='Pop, indie or dance. Switch whenever you like.', cta='Find a Silent Disco', hero='sd-energy.jpg', fmts=('sd', 'sdxmas'),
            ribbon=[('3 CHANNELS', 'Pop, indie or dance'), ('YOUR VOLUME', 'Set the vibe'), ('YOUR CHOICE', 'Switch anytime')], how_h='HERE’S HOW IT WORKS',
            steps=[('Pick up your headphones', 'We’ll get you set up on arrival.'), ('Choose your channel', 'Three live DJs, three channels.'), ('Follow your favourites', 'Switch whenever you like.')],
            cards=[('sd-four-friends.jpg@50% 30%', 'Pop', 'blue', sdtext('blue', 'Chart hits and feel-good classics.')), ('sd-two-women.jpg@50% 22%', 'Indie', 'red', sdtext('red', 'Indie anthems and alternative favourites.')), ('sd-dance-drinks.jpg@50% 40%', 'Dance', 'green', sdtext('green', 'Dancefloor fillers from across the decades.'))],
            after='<p class="fine">The Christmas edition swaps pop for Christmas and party songs. Check your date for its full channel line-up.</p><div class="moment"><h3>THE HEADPHONES-OFF MOMENT</h3><p>Take them off for five seconds. Shuffling feet. Muffled singing. Someone shouting “THIS SONG!” before slamming their headphones back on. It’s hilarious. It’s brilliant.</p></div>',
            strip='silent-photo.jpeg', dates_h='NEXT SILENT DISCOS', nodate='',
            faq=[('How do the channels work?', 'Wireless headphones pick up three DJs. Switch channel with the button on the headphones; the light shows which channel you are on.'), ('Is there a headphone deposit?', 'For the Christmas Silent Disco on Fri 4th Dec, a £10 fully refundable headphone deposit is taken on the night. Check your event page for others.'), ('What if headphones are lost or damaged?', 'Replacement charges may apply. Staff explain the terms when you collect your headphones.'), ('What should I wear?', 'No dress code. Wear what you can dance in.')],
            cta_sub='Find your next Silent Disco.'),
        'family-silent-disco': dict(title='Family Silent Disco', eyebrow='Family Silent Disco', h1='HEADPHONES ON.<br>EVERYONE DANCES.', sub='Three family-friendly channels, one dancefloor. For kids 4+ and the grown-ups who bring them.', cta='Find a family date', hero='poster-061226-fsd-npton.webp', fmts=('fsd',),
            ribbon=[('AGES 4+', 'Parents join in too'), ('3 CHANNELS', 'Christmas, throwback, chart'), ('WITH AN ADULT', 'Max three children per adult')], how_h='HERE’S HOW IT WORKS',
            steps=[('Pick up your headphones', 'Staff get everyone set up when you arrive.'), ('Choose your channel', 'Each person picks their own soundtrack.'), ('Dance together', 'Switch any time, all on one dancefloor.')],
            cards=[(None, 'Christmas & Party', 'blue', ', '.join(fg['blue'][2]) + '.' if 'blue' in fg else 'Family party hits.'), (None, 'Throwback', 'red', ', '.join(fg['red'][2]) + '.' if 'red' in fg else 'Throwback favourites.'), (None, 'Chart', 'green', 'Clean chart hits for older kids and grown-ups.')],
            after='<p class="fine">The music stays family-friendly. Each person can choose a channel and set their own headphone volume. Check the Christmas event page for the channel line-up on your date.</p>',
            strip=None, dates_h='NEXT FAMILY SILENT DISCO', nodate='',
            faq=[('What age is it for?', 'Designed for ages 4 and up. Younger children may find the headphones too large.'), ('Do children need an adult?', 'Yes. Children must be accompanied by a paying adult, maximum three children per adult.'), ('Is the venue accessible?', 'The Sat 12th Dec event is upstairs at The Charles Bradlaugh, accessed by steps. Email us before booking if you need to check an arrangement.'), ('What time is it?', 'The Sat 12th Dec party runs 11am to 1pm, with admission from 11am.')],
            cta_sub='Find your next Family Silent Disco.'),
        'boombastic-90s': dict(title='Boombastic 90s', eyebrow='Boombastic 90s', h1='ALL OF THE NINETIES.<br>EVERY LAST BIT.', sub='Pop, Britpop, dance and hip-hop. Four hours, giant screens, no filler.', cta='Find Boombastic 90s dates', hero='b90-stage.jpg', fmts=('b90',),
            ribbon=[('THE WHOLE DECADE', 'Pop, Britpop, hip-hop, dance'), ('GIANT SCREENS', 'Authentic 90s videos'), ('COME AS YOU ARE', 'Ready to sing every word')], how_h='HERE’S HOW IT FEELS',
            steps=[('Pick a side', 'Blur or Oasis. You still stand by it.'), ('Watch the screens', 'Cheer when your favourites appear.'), ('Sing every word', 'Four hours, the whole decade.')],
            cards=[('b90-group.jpg', 'The pop', 'coral', 'Spice Girls, Take That, S Club 7, Steps, Britney Spears, Backstreet Boys.'), ('b90-crowd.jpg', 'The Britpop', 'blue', 'Oasis, Blur, Pulp, Supergrass.'), ('b90-mic.jpg', 'The dance', 'green', 'Robin S, Faithless, N-Trance, CeCe Peniston, Fatboy Slim.')],
            after=f'<div class="ev-music"><h3 class="mini-h">THE FULL ROLL</h3><ul class="chips">{"".join(f"<li>{esc(a)}</li>" for a in b90_art)}</ul></div>',
            strip=None, dates_h='NEXT BOOMBASTIC 90s DATES', nodate='',
            faq=[('What music will you play?', 'The whole decade: pop, Britpop, dance and hip-hop. The Bedford listing names ' + ', '.join(b90_art[:8]) + ' and more.'), ('What time does it finish?', 'Bedford on Sat 17th Oct runs 8:30pm to 12:30am.'), ('What should I wear?', 'Come as you are. Just be ready to sing every word.')],
            cta_sub='Find your next Boombastic 90s date.'),
        'footloose-80s': dict(title='Footloose 80s', eyebrow='Footloose 80s', h1='FOOTLOOSE 80s.<br>ALL THE ANTHEMS.<br>ALL NIGHT.', sub='Four hours of non-stop 80s anthems, played loud, with people who feel exactly the same way.', cta='See what’s on', hero='fl-room.jpg', fmts=(),
            ribbon=[('THE ANTHEMS', 'All the biggest 80s hits'), ('THE VIDEOS', 'Classic footage on big screens'), ('YOUR PEOPLE', 'A great crowd, every time')], how_h='YOUR KIND OF EIGHTIES',
            steps=[('Hear the first chorus', 'The songs you know every word to.'), ('Grab a microphone', 'Inflatable, obviously.'), ('Sing it back', 'Four hours, no filler.')],
            cards=[('fl-group.jpg', 'The anthems', 'blue', 'Madonna, Queen, Wham!, Bon Jovi, Whitney Houston, A-ha.'), ('fl-dj.jpg', 'The videos', 'red', 'Classic footage on big screens above the dancefloor.'), ('fl-portrait.jpg', 'Your people', 'green', 'Both March 2026 dates, Northampton and Bedford, sold out.')],
            after=f'{quote_block(QUOTES["fl80"])}<p class="fine">Photos: Footloose 80s at The Picturedrome, Northampton, March 2026.</p>',
            strip='footloose-photo.jpeg', dates_h='', nodate='No Footloose 80s date is on sale at present.',
            faq=[('What music will you play?', 'Wall-to-wall 80s. Past listings named Madonna, Queen, Wham!, Bon Jovi, Whitney Houston, A-ha, Duran Duran, Michael Jackson, Cyndi Lauper and Prince.'), ('Is a date on sale?', 'No Footloose 80s date is on sale at present. See <a href="/whats-on/">What’s on</a> for events on sale now.'), ('What should I wear?', 'Bright and bold 80s or keep it casual. Just be ready to dance.')],
            cta_sub='See the Boombastic events on sale now.'),
    })


def pm_what_to_expect(events):
    x = [e for e in events][:2]
    finishes = sorted({t(e['end']) for e in events})
    h = hero('pm', 'KNOW THE WORDS?<br>YOU’RE IN.', 'Sing Out Loud Anthems. Home by 7-ish.', btn('Find your afternoon', '#first-dates', 'btn-hot'), 'pm-arms.jpg', eyebrow='Your first 2PM CLUB')
    rib = ribbon([('BIG CHORUSES', 'Sing Out Loud Anthems'), ('GOOD COMPANY', 'Friends, or come on your own'), ('SATURDAY NIGHT', 'Strictly on the sofa later') if STRICTLY_SEASON_2026 else ('AFTERNOON PLANS', 'Doors 2pm, home by 7-ish')])
    how = f'''<section class="section container how">{section_head('HERE’S HOW IT FEELS')}{steps([('2pm: doors open', 'Meet your friends or come on your own. Get a drink, find your spot and let the first song pull you in.'), ('The afternoon: sing it back', 'A DJ, a full sound system and choruses the whole room knows.'), ('5:30pm or 6pm: last song', 'The finish depends on the date. Leave with your evening ahead, or make a dinner plan if the afternoon gets ambitious.')])}{pill_cards([('pm-mic.jpg', 'The music', 'pink', 'Madonna, Whitney, Wham!, Take That, Spice Girls, Oasis, Beyoncé. If the whole room can’t sing it, it doesn’t get played.'), ('pm-group.jpg', 'The crowd', 'lilac', 'Bring your group or come on your own. Everyone has the songs in common.'), ('pm-hug.jpg', 'The timing', 'pink', f'Doors at 2pm. This season’s dates finish at {" or ".join(finishes)}. Check your event.')])}</section>'''
    editions = f'''<section class="editions container"><div class="ed-card"><span class="badge b-pink">80s Edition</span><h3>80s ONLY, START TO FINISH.</h3><p>Your best 80s night out. In the middle of the afternoon. Madonna, Michael Jackson, Wham!, Whitney, Prince, Bon Jovi, Duran Duran, A-ha, Tina Turner.</p></div><div class="ed-card"><span class="badge b-hot">Christmas</span><h3>FESTIVE, THEN EVERYTHING.</h3><p>Mariah, Wham!, Slade and Shakin’ Stevens, then the biggest 80s, 90s and 00s anthems. Doors at 2pm, with a proper dancefloor waiting.</p></div><div class="ed-card ed-quote">{quote_block(QUOTES['lara'])}</div></section>'''
    dates = f'<section class="section container" id="first-dates">{section_head("FIND YOUR FIRST AFTERNOON", f"<a class=text-link href=/whats-on/>All dates {ARROW}</a>")}<div class="date-rows">{"".join(date_row(e) for e in x)}</div></section>'
    qa = qa_cta('pm', [('Can I come on my own?', 'Yes. The music gives everyone something to join in with, whether you arrive with friends or on your own.'), ('What should I wear?', 'No dress code. Wear what you can dance in all afternoon.'), ('What time does it finish?', f'Doors are at 2pm. This season’s dates finish at {" or ".join(finishes)}; each event page shows its own times.'), ('Do I need to know the songs?', 'You’ll know most of them. That’s rather the point.')], 'ALL THE CHORUSES.<br>ALL YOUR PEOPLE.', 'Find your first 2PM CLUB.', 'Find your afternoon', '/whats-on/')
    body = h + rib + how + editions + strip('pm-wide.jpg') + dates + qa
    return page('pm', 'What to expect', body, 'Your first THE 2PM CLUB Daytime Disco: the music, the crowd and the timing.', '/what-to-expect/')


def faq_page(brand):
    pm = brand == 'pm'
    sections = [
        ('tickets', 'ticket', 'Tickets', 'Booking and your tickets', 'TICKETS & BOOKING', [
            ('Where are my tickets?', f'Check the email address you used at checkout for your Eventbrite confirmation. Still stuck? <a href="mailto:{EMAIL}">Get in touch</a> with your name, event date, city and order reference.'),
            ('How do I book?', 'Choose a date on this site and use the live ticket selector on its event page. It shows the ticket types, fees and availability for that event.'),
            ('Can we book as a group?', 'Group options vary by event. Check the live selector on your chosen date. For a larger group, email us with the city, date and rough numbers.'),
            ('Are tickets refundable?', ('Current THE 2PM CLUB ticket listings say tickets are non-refundable unless the event is cancelled. Check the policy for your chosen date before paying. Our <a href="/terms/">terms</a> explain how we handle event changes.' if pm else 'Refund conditions vary by event. Check the policy shown with your chosen tickets before paying. Our <a href="/terms/">terms</a> explain where to find it.')),
            ('What if an event is changed or cancelled?', 'We update the event page and email ticket holders. If you need help with a change, email us with your booking details.'),
        ]),
        ('timing', 'clock', 'Timing', 'Event times and schedules', 'TIMING', [
            ('What time does it start and finish?', ('Doors are at 2pm. Most dates finish at 6pm; the Northampton Christmas dates finish at 5:30pm. Your event page has the exact times.' if pm else 'Times vary: THE 2PM CLUB runs from 2pm, Family Silent Disco from 11am, evening parties from 8pm or 8:30pm. Your event page has the exact times.')),
            ('Can I buy tickets on the door?', 'Book online to secure your place. Door availability varies by event and is not guaranteed.'),
        ]),
        ('access', 'access', 'Access', 'Accessibility and your visit', 'VENUES & ACCESS', [
            ('Is my event accessible?', f'Access differs by venue and room. Several current dates at The Charles Bradlaugh are upstairs, reached by steps. Check your event page and email <a href="mailto:{EMAIL}">{EMAIL}</a> before you book or travel if you need to confirm an arrangement.'),
            ('Where is my event?', 'Every date has its own venue. The event page shows the address and any venue update.'),
            ('Who can I contact?', f'Email <a href="mailto:{EMAIL}">{EMAIL}</a> with the city, date and your question. Include your order reference if it’s about an existing booking.'),
        ]),
        ('day', 'info', 'On the day', 'Entry, what to wear and what to expect', 'ON THE DAY', ([
            ('Can I come on my own?', 'Yes. Come for the music; you can join in whether you arrive with friends or on your own.'),
            ('What should I wear?', 'No dress code. Wear what you can dance in.'),
            ('Do I need to know the songs?', 'You’ll know most of them. That’s rather the point.'),
            ('Are there entry rules?', 'Current THE 2PM CLUB dates are for over 18s. Check your chosen event page for its venue and entry details before you book.'),
        ] if pm else [
            ('What is a silent disco?', 'Music plays through wireless headphones. Three DJs, three channels; switch whenever you like and set your own volume.'),
            ('What if headphones are lost or damaged?', 'Replacement charges may apply. Staff explain the terms when you collect your headphones.'),
            ('Are there family events?', 'Yes. Family Silent Disco is designed for ages 4 and up; children need a paying adult, maximum three per adult.'),
            ('Is there an age limit for evening parties?', 'Silent Disco Greatest Hits on Sat 26th September and the Halloween House Party are 18+ events. Check each event page and ticket selector for its entry rules; valid photo ID may be required.'),
        ])),
    ]
    side = ''.join(f'<a href="#{i}"{" class=on" if n == 0 else ""}><span class="fn-ico">{icon(ic)}</span><span><b>{t_}</b><small>{d}</small></span></a>' for n, (i, ic, t_, d, _, _) in enumerate(sections))
    content = ''.join(f'<section class="faq-group" id="{i}"><h2>{h2}</h2>' + ''.join(acc(q, a, open_=(n == 0 and k == 0)) for k, (q, a) in enumerate(qs)) + '</section>' for n, (i, ic, t_, d, h2, qs) in enumerate(sections))
    herox = f'''<section class="faq-hero"><div class="container faq-hero-in"><div><h1>GOOD QUESTIONS.<br>STRAIGHT ANSWERS.</h1><p class="hero-sub">Everything you need before you book.</p></div><p class="doodle" aria-hidden="true"><span>{'SAME GREAT' if not pm else 'SAME GOOD'}</span><span>{'NIGHTS' if not pm else 'AFTERNOONS'}</span></p></div></section>'''
    layout = f'<div class="faq-layout container"><aside class="faq-side"><nav aria-label="Question categories">{side}</nav><div class="faq-tip">{icon("info")}<p>Check your event page for its venue, timings and entry information.</p></div></aside><div class="faq-body">{content}</div></div>'
    contact = f'''<section class="help"><div class="container help-in"><h2>STILL NEED A HAND?</h2><p>We’re here to help. Drop us an email and we’ll get back to you.</p><div class="help-row"><a class="help-mail" href="mailto:{EMAIL}">{icon("mail")}{EMAIL}</a>{btn('Email us', 'mailto:' + EMAIL)}<a class="text-link" href="/whats-on/">Find your event {ARROW}</a></div></div></section>'''
    body = herox + layout + strip('pm-smile.jpg' if pm else 'sd-dance-drinks.jpg') + contact
    return page(brand, 'FAQs', body, 'Straight answers on tickets, timings, access and the day itself.', '/faqs/')


def groups_page(brand, events):
    pm = brand == 'pm'
    h = hero(brand, 'ONE DATE.<br>ALL YOUR PEOPLE.' if pm else 'BRING THE<br>WHOLE CREW.', 'Birthdays. Hen dos. Just because.' if pm else 'Birthdays. Christmas parties. Nights you’ll talk about.', btn('Find your group’s afternoon' if pm else 'Find your group’s party', '/whats-on/', 'btn-hot' if pm else 'btn-dark'), 'pm-group.jpg' if pm else 'b90-group.jpg')
    rib = ribbon([('BIRTHDAYS', '', None, 'gift'), ('HEN DOS' if pm else 'CHRISTMAS PARTIES', '', None, 'people'), ('WORK DOS' if pm else 'NIGHTS OUT', '', None, 'glass')], cls='occasions')
    plan = f'''<section class="section container plan">{section_head('MAKE A PLAN TOGETHER.')}<p class="plan-sub">Choose your event, share it with your friends and make a plan.</p>{steps([('Pick your city', 'Browse our events and find a date that works for your group.'), ('Choose your date', 'Check the times and venue, then share the event link in the group chat.'), ('Get your tickets', 'Everyone can book through the live selector, or one person can book for all.')], 'steps-display')}<div class="group-strip"><span class="gs-ico">{icon('people')}</span><div><h3>GROUP TICKETS</h3><p>Many dates have a group-of-4 ticket. Check your date for the price and live availability.</p></div>{btn('Find an event', '/whats-on/')}<a class="gs-mail" href="mailto:{EMAIL}">{icon('mail')}<span>Larger group or a question?<br><u>Email us {ARROW}</u></span></a></div></section>'''
    proof = quote_block(QUOTES['friends'] if pm else QUOTES['emma_r'], 'quote-center')
    qa = f'''<section class="container group-qa">{acc('Can we arrive together?', 'Yes. Book together or separately; everyone uses the same event and venue. Arriving around doors gives the group time to find a spot.')}{acc('Are there group tickets?', 'Many dates have a group-of-4 ticket. Where one is listed, the event page shows its price; the ticket selector shows live availability and fees.')}{acc('What time does it finish?', ('Doors at 2pm. This season’s dates finish at 5:30pm or 6pm. Your event page has the exact times.' if pm else 'Times vary by party. Your event page has the exact start and finish.'))}{acc('Can you reserve an area for us?', f'Email <a href="mailto:{EMAIL}">{EMAIL}</a> with the date and numbers and we’ll tell you what the venue can do.')}</section>'''
    final = f'<section class="final-band"><div class="container final-in"><h2>{"THAT PLAN YOU KEEP TALKING ABOUT." if pm else "THE NIGHT EVERYONE ACTUALLY MAKES."}</h2>{btn("Make it happen", "/whats-on/")}</div></section>'
    body = h + rib + plan + strip('pm-three.jpg' if pm else 'fl-portrait.jpg') + proof + qa + final
    return page(brand, 'Groups and celebrations', body, 'Birthdays, hen dos and group plans.', '/group-bookings/')


def about_page(brand, events):
    pm = brand == 'pm'
    if pm:
        cities = sorted({e['city'] for e in events})
        h = hero('pm', 'A SATURDAY<br>AFTERNOON DISCO.<br>DONE PROPERLY.', 'THE 2PM CLUB Daytime Disco. Your best night out. In the middle of the afternoon.', btn('Find your afternoon', '/whats-on/', 'btn-hot'), 'pm-three.jpg', eyebrow='About THE 2PM CLUB')
        rib = ribbon([('DOORS AT 2PM', 'An afternoon on the dancefloor'), ('SING OUT LOUD', '80s, 90s and 00s anthems'), ('HOME BY 7-ISH', 'Sunday not written off')])
        what = f'''<section class="section container about-grid"><div><p class="eyebrow">What it is</p><h2>A PROPER PARTY. JUST EARLIER.</h2><p>A DJ, a full sound system and the biggest 80s, 90s and 00s anthems back to back, the kind the whole room knows every word to. Doors at 2pm. You can keep Saturday evening for dinner, the sofa or whatever happens next.</p><p>Some dates go 80s only. At Christmas it’s festive classics first, then everything. Every event page lists its own soundtrack, venue and finish time.</p></div><div><p class="eyebrow">Who it’s for</p><h2>YOUR PEOPLE. OR NEW ONES.</h2><p>Bring your group or come on your own. Either way, there’s a roomful of people who know the same choruses.</p>{quote_block(QUOTES['emma_leic'])}</div></section>'''
        where = f'<section class="section container">{section_head("WHERE WE PARTY", f"<a class=text-link href=/locations/>All locations {ARROW}</a>")}<ul class="city-chips">{"".join(f"<li><a href=/hubs/{slug(c)}/>{esc(c)}</a></li>" for c in cities)}</ul><p class="fine">This season: MK11 in Milton Keynes, The Charles Bradlaugh in Northampton, Mattioli Woods Welford Road Stadium in Leicester, hmv Empire in Coventry and Bedford Esquires.</p></section>'
        rel = f'<section class="relation container"><div class="relation-copy"><p class="eyebrow">Who runs it</p><h2>BY BOOMBASTIC EVENTS.</h2><p>THE 2PM CLUB is run by Boombastic Events, who have been putting on singalong parties across the Midlands since 2014: Silent Disco Greatest Hits, Decades Parties and family events among them. THE 2PM CLUB is the afternoon one.</p>{btn("Meet Boombastic Events", BOOM_BASE + "/about/")}</div><div class="relation-quotes">{quote_block(QUOTES["lorne"])}{quote_block(QUOTES["lara"])}</div></section>'
        body = h + rib + what + strip('pm-wide.jpg') + where + rel + signup('pm', 'YOUR CITY. YOUR NEXT AFTERNOON.', 'Be first to hear about new dates.', events=events)
        return page('pm', 'About', body, 'About THE 2PM CLUB Daytime Disco, by Boombastic Events.', '/about/')
    h = hero('boom', 'IT STARTED WITH<br>ONE 90s NIGHT.', 'Since 2014, tens of thousands of people have joined us for Silent Disco, Decades Parties, Family Silent Disco and THE 2PM CLUB.', btn('Find your next party', '/whats-on/'), 'b90-crowd.jpg', eyebrow='About Boombastic Events')
    rib = ribbon([('DAYTIME', 'THE 2PM CLUB', PM_BASE + '/'), ('AFTER DARK', 'Silent Disco and Decades Parties', '#parties'), ('FAMILY', 'Family Silent Disco', '/family-silent-disco/')], cls='rib-short')
    story = f'''<section class="section container about-grid"><div><p class="eyebrow">What we do</p><h2>PARTIES BUILT AROUND THE SONGS.</h2><p>Every Boombastic party starts with the music people actually want to sing, then puts it in a room with the right people. Three DJs on three headphone channels at Silent Disco Greatest Hits. Giant-screen 90s videos at Boombastic 90s. Wall-to-wall 80s anthems at Footloose 80s. A Saturday afternoon of 80s, 90s and 00s anthems at THE 2PM CLUB.</p><p>We’ve filled rooms across the Midlands for years, with sell-out nights across our different parties. We run them in venues we know: The Charles Bradlaugh in Northampton, Bedford Esquires, MK11 in Milton Keynes, hmv Empire in Coventry and Mattioli Woods Welford Road Stadium in Leicester. For years our silent discos called The Picturedrome home; its final night is Sat 26th Sept.</p></div><div class="about-story-photo">{photo('b90-group.jpg', 'about-photo', caption=False)}</div></section>'''
    rel = f'<section class="relation container"><div class="relation-copy"><p class="eyebrow">THE 2PM CLUB</p><h2>THE SAME TEAM. AN EARLIER START.</h2><p>Our daytime disco brings big singalong energy into the afternoon. Doors at 2pm, home by 7-ish.</p>{btn("Explore THE 2PM CLUB", PM_BASE + "/")}</div><div class="relation-quotes">{quote_block(QUOTES["emma_r"])}{quote_block(QUOTES["fl80"])}</div></section>'
    body = h + rib + story + boom_parties_grid() + strip('footloose-photo.jpeg') + rel + signup('boom', 'YOUR CITY. YOUR NEXT NIGHT OUT.', 'Be first to hear about new parties near you.', events=events)
    return page('boom', 'About', body, 'About Boombastic Events: singalong parties across the Midlands since 2014.', '/about/')


def contact_page(brand):
    pm = brand == 'pm'
    body = f'''<section class="page-band"><div class="container"><p class="eyebrow">Contact</p><h1>LET’S TALK.</h1><p>Questions about an event, your tickets or access? Email the team.</p></div></section><section class="section container contact-grid"><div><h2>EMAIL US</h2><p><a class="help-mail" href="mailto:{EMAIL}">{icon('mail')}{EMAIL}</a></p><p>Include your name, the event date and city, and your order reference if you already have tickets. For access, tell us what you need so we can advise before you book or travel.</p>{btn('Email us', 'mailto:' + EMAIL)}</div><div class="contact-side"><h2>QUICK ANSWERS</h2><a href="/faqs/#tickets">Where are my tickets? {ARROW}</a><a href="/faqs/#timing">What time does it finish? {ARROW}</a><a href="/faqs/#access">Is my event accessible? {ARROW}</a><a href="/group-bookings/">Coming as a group? {ARROW}</a></div></section>'''
    return page(brand, 'Contact', body, 'Contact the team about events, tickets or access.')


def ported_page(brand, route, record):
    content = record['html'].replace('/#tickets', '/events/')
    content = re.sub(r'<div>\s*<h3>Share this (?:page|article)</h3>.*?Link copied to clipboard![^<]*</div>\s*</div>', '', content, flags=re.I | re.S)
    note = '<div class="archive-note">This story describes the format. Times, venues, age rules, prices and group options vary by event. <a href="/whats-on/">Check the current events →</a></div>'
    body = f'<section class="page-band"><div class="container"><a class="back" href="/blog/">← All stories</a></div></section><article class="prose container">{note}{content}</article>'
    return page(brand, record['title'].split(' | ')[0], body, active='/blog/')


def fresh_blog_page(route):
    articles = {
        '/blog/hen-do-daytime-disco/': (
            'A hen do that starts at 2pm',
            'The group-chat plan with a dancefloor, the songs you all know and an evening that is still yours.',
            'pm-group.jpg',
            [
                ('A PLAN THE WHOLE GROUP CAN GET INTO', 'A hen do does not need a late finish to feel like a proper celebration. THE 2PM CLUB puts a DJ, a full sound system and 80s, 90s and 00s anthems in the middle of a Saturday afternoon. You can sing together, dance together and still make dinner afterwards.'),
                ('SEND ONE DATE TO THE GROUP CHAT', 'Choose the city and date first. Each event page gives you the venue, doors time, finish time and current ticket options. Some dates have a group-of-4 ticket; the ticket selector confirms what is still available and any fees.'),
                ('MAKE IT YOUR OWN', 'Come dressed for a celebration or in whatever you can dance in. There is no compulsory costume. Book together or separately, then meet at the venue and let the first chorus do the rest.'),
            ],
            'A daytime disco hen do with 80s, 90s and 00s singalong anthems. Find a city, date and live group ticket options.'),
        '/blog/hen-party-ideas-northampton/': (
            'Hen party ideas in Northampton',
            'Start with the people and the music. Build the rest of the Saturday around that.',
            'pm-three.jpg',
            [
                ('START WITH A DAYTIME DANCEFLOOR', 'THE 2PM CLUB is an afternoon disco with a DJ and the 80s, 90s and 00s songs your group already knows. The Northampton venue and finish time depend on the date, so check the current listing before you make the rest of the plan.'),
                ('THEN KEEP THE EVENING OPEN', 'Meet for lunch beforehand, head for dinner afterwards, or call it a day while everyone is still smiling. An afternoon party leaves room for the version of a hen do your group actually wants.'),
                ('KEEP BOOKING SIMPLE', 'Send one event link to the group. Each Northampton date shows its venue, times, access notes and live ticket selector. Group-of-4 tickets appear on some dates, while available; check the selector for fees and current options.'),
            ],
            'Ideas for a Northampton hen party, including THE 2PM CLUB daytime disco. Check current venues, dates and tickets.'),
        '/blog/birthday-party-ideas-northampton-adults/': (
            'Birthday ideas for grown-ups in Northampton',
            'A birthday with your favourite people, loud choruses and no need to wait until midnight.',
            'pm-hug.jpg',
            [
                ('PUT THE MUSIC FIRST', 'If the birthday person loves singing along, a THE 2PM CLUB afternoon gives the group a real dancefloor. The music is built around 80s, 90s and 00s anthems, with some dates devoted to the 80s or Christmas. Check the edition on the event you choose.'),
                ('MAKE A DAY OF IT', 'You can meet before doors, dance through the afternoon and carry on over dinner if you want to. Current dates begin at 2pm and finish at 5:30pm or 6pm, depending on the event.'),
                ('BRING YOUR PEOPLE', 'Share the Northampton date with your friends and book through its live selector. Some dates list group-of-4 tickets. For a larger party or a question about the venue, email our team before you book.'),
            ],
            'Northampton birthday ideas for adults who love music, including THE 2PM CLUB daytime disco and group tickets on selected dates.'),
        '/blog/why-daytime-discos-are-popular/': (
            'Why a daytime disco works',
            'All the energy of going out, with the rest of the weekend still ahead of you.',
            'pm-wide.jpg',
            [
                ('THE SONGS ARE THE REASON', 'At THE 2PM CLUB, the DJ plays Sing Out Loud Anthems from the 80s, 90s and 00s. You do not need to know a dance routine. If you know the chorus, you are already part of it.'),
                ('THE TIMING MAKES THE PLAN EASIER', 'Doors open at 2pm. This season’s dates finish at 5:30pm or 6pm, so you can go on for dinner or head home with your evening intact. Check the exact finish time on your chosen date.'),
                ('COME AS YOU ARE', 'Bring friends or come on your own. There is no dress code and no pressure to turn it into an all-night occasion. It is a proper party at a time that may suit you better.'),
            ],
            'Why an afternoon party appeals: familiar music, a full dancefloor and a finish time that leaves your evening free.'),
    }
    title, lede, image_name, sections, description = articles[route]
    blocks = ''.join(f'<h2>{esc(heading)}</h2><p>{body}</p>' for heading, body in sections)
    body = f'''<section class="page-band"><div class="container"><a class="back" href="/blog/">← All stories</a><p class="eyebrow">THE 2PM CLUB guide</p><h1>{esc(title.upper())}</h1></div></section><article class="prose container"><p class="lede">{esc(lede)}</p>{photo(image_name, 'prose-media')}{blocks}<div class="article-actions">{btn('See dates and tickets', '/whats-on/', 'btn-hot')}<a class="text-link" href="/group-bookings/">Planning for a group {ARROW}</a></div></article>'''
    return page('pm', title, body, description, '/blog/')


def blog_index():
    articles = [
        ('What is a Daytime Disco?', 'The music, the dancefloor and what an afternoon event actually feels like.', '/blog/what-is-a-daytime-disco/', 'pm-arms.jpg'),
        ('A hen do that starts at 2pm', 'A dancefloor, the songs you all know and an evening that is still yours.', '/blog/hen-do-daytime-disco/', 'pm-group.jpg'),
        ('Hen party ideas in Northampton', 'Ways to build an afternoon out around music and time with friends.', '/blog/hen-party-ideas-northampton/', 'pm-three.jpg'),
        ('Birthday ideas for grown-ups', 'A few ways to mark a birthday together, including a daytime dancefloor.', '/blog/birthday-party-ideas-northampton-adults/', 'pm-hug.jpg'),
        ('Why a daytime disco works', 'Familiar songs, an afternoon dancefloor and time left for dinner.', '/blog/why-daytime-discos-are-popular/', 'pm-wide.jpg'),
    ]
    cards = ''.join(f'<a class="post-card" href="{u}">{photo(img, "post-media", caption=False)}<h2>{esc(t_)}</h2><p>{esc(c)}</p><b>Read {ARROW}</b></a>' for t_, c, u, img in articles)
    body = f'<section class="page-band"><div class="container"><p class="eyebrow">The blog</p><h1>YOUR NEXT AFTERNOON, PLANNED.</h1><p>Guides and ideas for your next afternoon. Each event page has its own time, venue and tickets.</p></div></section><section class="section container"><div class="post-grid">{cards}</div></section>'
    return page('pm', 'Blog', body, 'Guides and ideas for your next THE 2PM CLUB afternoon.', '/blog/')


def blog_daytime_guide():
    body = f'''<section class="page-band"><div class="container"><a class="back" href="/blog/">← All stories</a><p class="eyebrow">THE 2PM CLUB guide</p><h1>WHAT IS A DAYTIME DISCO?</h1></div></section><article class="prose container"><p class="lede">A proper party, in the afternoon. A DJ, a full dancefloor and the songs you love singing with other people. Then an evening that’s still yours.</p>{photo('pm-arms.jpg', 'prose-media')}<h2>WHAT ACTUALLY HAPPENS?</h2><p>Doors open at 2pm. Meet your friends or come on your own, and let the music pull you in. THE 2PM CLUB plays Sing Out Loud Anthems from the 80s, 90s and 00s: Wham!, Whitney, Madonna, Take That, Spice Girls, Oasis, Bon Jovi, Beyoncé. An 80s Edition is 80s from start to finish; the Christmas dates add Mariah, Wham! and Slade.</p><h2>WHY THE AFTERNOON?</h2><p>All the energy of going out, with timing that leaves the rest of the weekend free. This season’s dates finish at 5:30pm or 6pm, so you’re home by 7-ish, or on to dinner if the afternoon gets ambitious.</p>{quote_block(QUOTES['diane'])}<h2>IS IT FOR ME?</h2><p>If you want to dance, sing along and spend time with good people, yes. Come with a group or come solo. There’s no dress code.</p><h2>HOW DO I BOOK?</h2><p>Pick your city and edition. Each event page shows the venue, times and access details, with live ticket types and fees from Eventbrite. Group tickets vary by event.</p><div class="article-actions">{btn('Find your afternoon', '/whats-on/', 'btn-hot')}<a class="text-link" href="/what-to-expect/">What to expect {ARROW}</a></div></article>'''
    return page('pm', 'What is a Daytime Disco?', body, 'A daytime disco is a proper party in the afternoon. See the music, timing, crowd and how to book a THE 2PM CLUB day party.', '/blog/', image=PM_BASE + '/assets/pm-arms.jpg')


def paused_format_page(name):
    """Old URL of a format that is not running. Plain statement and a route to real events; no dates, photos or revival promise."""
    body = f'<section class="page-band"><div class="container"><h1>{esc(name.upper())}.</h1><p>{esc(name)} is not running at the moment. No {esc(name)} date is on sale.</p>{btn("See what’s on", "/whats-on/")}</div></section>'
    return page('boom', name, body, f'{name} is not running at the moment.', sticky_label='See what’s on', sticky_href='/whats-on/')


def official_content_page(brand, key):
    live = 'https://www.the2pmclub.co.uk' if brand == 'pm' else 'https://www.boomevents.co.uk'
    label = {'privacy': 'Privacy policy', 'terms': 'Terms and conditions', 'jobs': 'Work with us', 'for-ai': 'Public information for AI systems'}[key]
    if RELEASE_MODE:
        record = SUPPORT.get(brand, {}).get(f'/{key}/')
        if record:
            content = record['html']
            if brand == 'pm' and key == 'privacy':
                content = content.replace('To change your choice later, clear this site&#x27;s data in your browser and the banner will ask again.',
                                          'To change your choice later, use Cookie settings in the footer.')
            if brand == 'boom' and key == 'privacy':
                content = content.replace('You can control cookies through your browser settings. Note that disabling cookies may affect the functionality of our website.',
                                          'You can reject optional cookies in our banner or change your choice using Cookie settings in the footer. Essential site functions remain available when you reject optional cookies.')
            return page(brand, label, f'<article class="prose container legal-page">{content}</article>', label)
        if brand == 'boom' and key == 'terms':
            body = f'''<article class="prose container legal-page"><h1>Terms and conditions</h1><p>Each event has its own booking conditions and refund policy, shown before payment in the Eventbrite ticket selector. Please review the conditions for the event you choose. For a question about a booking or an event, email <a href="mailto:{EMAIL}">{EMAIL}</a> with your event date and order reference.</p><p><a href="/whats-on/">Find an event and review its tickets →</a></p></article>'''
            return page(brand, label, body, 'Where to review event-specific booking and refund terms for Boombastic Events.')
        if brand == 'boom' and key == 'jobs':
            body = f'''<article class="prose container legal-page"><h1>Work with us</h1><p>Interested in working at a Boombastic event? Send a short introduction and your experience to <a href="mailto:{EMAIL}?subject=Work%20with%20Boombastic%20Events">{EMAIL}</a>. We will tell you whether there is a relevant opportunity. This page does not advertise a specific vacancy.</p></article>'''
            return page(brand, label, body, 'Contact Boombastic Events about event work.')
        if key == 'for-ai':
            name = 'THE 2PM CLUB' if brand == 'pm' else 'Boombastic Events'
            feed = '/events.json' if brand == 'pm' else '/events-boombastic.json'
            body = f'''<article class="prose container legal-page"><h1>Public information about {esc(name)}</h1><p>{esc(name)} is operated by Boombastic Events Ltd. The <a href="{feed}">public event feed</a> lists event-specific dates, venues and links. The <a href="/whats-on/">What’s on page</a> is the current visitor-facing listing; each event page links to its live Eventbrite ticket selector.</p><p>Check the individual event page for the current time, access details and ticket options. Questions: <a href="mailto:{EMAIL}">{EMAIL}</a>.</p></article>'''
            return page(brand, label, body, f'Public event information and data feed for {name}.')
        raise SystemExit(f'{brand}/{key}: no production content source')
    body = f'<section class="page-band"><div class="container"><p class="eyebrow">Current information</p><h1>{esc(label.upper())}.</h1><p>This preview keeps the current {esc(label.lower())} on the official website while the new site is reviewed.</p>{btn("Read the current " + esc(label.lower()) + " ↗", f"{live}/{key}/")}</div></section>'
    return page(brand, label, body)


def not_found(brand):
    body = f'<section class="page-band"><div class="container"><p class="eyebrow">404</p><h1>PAGE NOT FOUND.</h1><p>That page may have moved.</p>{btn("Find an event", "/whats-on/")}</div></section>'
    return page(brand, 'Page not found', body)


def seo_enrich(brand, path, content):
    """Give the noindex preview realistic, route-specific search metadata for review.

    Indexability, canonicals and XML sitemaps remain a separate production gate.
    """
    route = '/' + path.strip('/') + '/' if path.strip('/') else '/'
    base = PM_BASE if brand == 'pm' else BOOM_BASE
    site = 'THE 2PM CLUB' if brand == 'pm' else 'Boombastic Events'
    title_match = re.search(r'<title>(.*?)</title>', content)
    desc_match = re.search(r'<meta name="description" content="([^"]*)">', content)
    short_title = (html.unescape(title_match.group(1)).removesuffix(f' | {site} preview').removesuffix(f' | {site}') if title_match else site)
    description = html.unescape(desc_match.group(1)) if desc_match else short_title
    event = next((e for e in CURRENT_EVENTS[brand] if e['path'].lower() == route.lower()), None)
    if event:
        title = f'{clean_title(event)} | {d_short(event["start"])}'
    elif route == '/':
        title = ('THE 2PM CLUB | Daytime Disco and Day Parties' if brand == 'pm'
                 else 'Boombastic Events | Daytime Disco, Silent Disco and Decades Parties')
    elif route in ('/whats-on/', '/events/'):
        title = f'Upcoming {"Daytime Disco" if brand == "pm" else "Party"} Events | {site}'
    elif route in ('/locations/', '/hubs/'):
        title = f'Find {"Daytime Disco" if brand == "pm" else "Boombastic"} Events by Location | {site}'
    elif route.startswith(('/hubs/', '/locations/')):
        title = f'{short_title} {"Daytime Disco" if brand == "pm" else "Parties"} | {site}'
    elif route == '/what-to-expect/':
        title = f'What to Expect at a Daytime Disco | {site}'
    elif route == '/blog/what-is-a-daytime-disco/':
        title = f'What Is a Daytime Disco? | {site}'
    else:
        title = f'{short_title} | {site}'
    schema = []
    org_id = 'https://www.' + ('the2pmclub.co.uk' if brand == 'pm' else 'boomevents.co.uk') + '/#organization'
    if route == '/':
        schema.append({'@context': 'https://schema.org', '@type': 'Organization',
                       '@id': org_id, 'name': site,
                       'url': 'https://www.' + ('the2pmclub.co.uk' if brand == 'pm' else 'boomevents.co.uk') + '/',
                       'logo': base + ('/assets/pm-logo.png' if brand == 'pm' else '/assets/boom-logo.png'),
                       'sameAs': [url for _, url, _ in SOCIAL[brand]]})
    if event:
        address = event.get('address') or {}
        place = {'@type': 'Place', 'name': event['venue']}
        if address:
            place['address'] = {'@type': 'PostalAddress', **{k: v for k, v in address.items()
                                if k in ('streetAddress', 'addressLocality', 'addressRegion', 'postalCode', 'addressCountry') and v}}
        schema.append({'@context': 'https://schema.org', '@type': 'Event',
                       'name': event['title'], 'description': description,
                       'startDate': schema_time(event['start']), 'endDate': schema_time(event['end']),
                       'eventAttendanceMode': 'https://schema.org/OfflineEventAttendanceMode',
                       'eventStatus': 'https://schema.org/EventScheduled',
                       'location': place, 'image': [base + event['poster']],
                       'organizer': {'@type': 'Organization', '@id': org_id, 'name': site,
                                     'url': 'https://www.' + ('the2pmclub.co.uk' if brand == 'pm' else 'boomevents.co.uk') + '/'},
                       'url': base + route})
    elif route != '/':
        parts = route.strip('/').split('/')
        if len(parts) > 1:
            parent = '/' + parts[0] + '/'
            schema.append({'@context': 'https://schema.org', '@type': 'BreadcrumbList',
                           'itemListElement': [
                               {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': base + '/'},
                               {'@type': 'ListItem', 'position': 2, 'name': parts[0].replace('-', ' ').title(), 'item': base + parent},
                               {'@type': 'ListItem', 'position': 3, 'name': short_title, 'item': base + route}]})
    canonical_route = ({'/whats-on/': '/events/', '/locations/': '/hubs/'} if brand == 'pm' else {'/faqs/': '/faq/'}).get(route, route)
    extra = (f'<meta property="og:url" content="{esc(base + canonical_route)}">'
             f'<meta name="twitter:card" content="summary_large_image">'
             f'<meta name="twitter:title" content="{esc(title)}">'
             f'<meta name="twitter:description" content="{esc(description)}">'
             + (f'<link rel="canonical" href="{esc(base + canonical_route)}">' if RELEASE_MODE else '')
             + ''.join('<script type="application/ld+json">' + json.dumps(item, ensure_ascii=False).replace('<', '\\u003c') + '</script>' for item in schema))
    content = re.sub(r'<title>.*?</title>', f'<title>{esc(title)}</title>', content, count=1)
    content = re.sub(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{esc(title)}">', content, count=1)
    return content.replace('</head>', extra + '</head>', 1)


def write_page(dist, path, content):
    target = dist / path.strip('/') / 'index.html'
    target.parent.mkdir(parents=True, exist_ok=True)
    brand = 'pm' if dist.name == 'dist-2pm' else 'boom'
    if RELEASE_MODE:
        aliases = {'/whats-on/': '/events/', '/locations/': '/hubs/'} if brand == 'pm' else {'/faqs/': '/faq/'}
        for old, new in aliases.items():
            content = content.replace(f'href="{old}', f'href="{new}')
    target.write_text(seo_enrich(brand, path, content))


def provenance(all_events):
    rows = []
    for name, (alt, cap, src) in PHOTOS.items():
        p = HERE / 'assets' / name
        rows.append(dict(file=name, caption=cap, alt=alt, source=src, sha256=hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else None))
    posters = [dict(event=e['code'], file=e['poster'], source=e['image'], sha256=hashlib.sha256((HERE / e['poster'].lstrip('/')).read_bytes()).hexdigest() if e['poster'].startswith('/assets/') else None) for e in all_events]
    (HERE / 'V2-ASSET-PROVENANCE.json').write_text(json.dumps(dict(photos=rows, posters=posters, boom_base=BOOM_BASE, pm_base=PM_BASE), indent=1))


def release_redirects(brand, events):
    """Keep old owned URLs useful without sending ended events to stale ticket pages."""
    host = 'the2pmclub.co.uk' if brand == 'pm' else 'boomevents.co.uk'
    rows = [f'https://{host}/* https://www.{host}/:splat 301!',
            '/index.html / 301!', '/:path/index.html /:path/ 301!']
    if brand == 'pm':
        rows += ['/whats-on/ /events/ 301!', '/locations/ /hubs/ 301!',
                 '/developers /for-ai/ 301!', '/developers/* /for-ai/ 301!',
                 '/events/250726-2pm-npton /events/031026-2pm-npton/ 301!',
                 '/events/250726-2pm-npton/ /events/031026-2pm-npton/ 301!',
                 '/events/250726-2pm-npton/* /events/031026-2pm-npton/ 301!',
                 '/events/250726-2PM-NPTON /events/031026-2pm-npton/ 301!',
                 '/events/250726-2PM-NPTON/ /events/031026-2pm-npton/ 301!',
                 '/events/250726-2PM-NPTON/* /events/031026-2pm-npton/ 301!',
                 '/events/250726-2PM-NPTON-80S/* /events/031026-2pm-npton/ 301!',
                 '/events/031026-2pm-lut /hubs/luton/ 301!',
                 '/events/031026-2pm-lut/ /hubs/luton/ 301!',
                 '/events/031026-2pm-lut/* /hubs/luton/ 301!',
                 '/events/031026-2PM-LUT /hubs/luton/ 301!',
                 '/events/031026-2PM-LUT/ /hubs/luton/ 301!',
                 '/events/031026-2PM-LUT/* /hubs/luton/ 301!',
                 '/blog/why-2pm-works/ /blog/what-is-a-daytime-disco/ 301!']
        # Earlier blog URLs are retained as full pages and are not redirected.
    else:
        rows += ['/faqs/ /faq/ 301!',
                 '/events/christmas-silent-disco-northampton/* /silent-disco/ 301!',
                 '/events/the-2pm-club-northampton-christmas-daytime-disco/* https://www.the2pmclub.co.uk/hubs/northampton/ 301!',
                 '/events/boombastics-christmas-decades-party-northampton/* /whats-on/ 301!',
                 '/events/christmas-family-silent-disco-northampton/* /family-silent-disco/ 301!',
                 '/events/the-2pm-club-milton-keynes-christmas-daytime-disco/* https://www.the2pmclub.co.uk/hubs/milton-keynes/ 301!',
                 '/events/the-2pm-club-bedford-christmas-daytime-disco/* https://www.the2pmclub.co.uk/hubs/bedford/ 301!',
                 '/events/get-ready-60s-70s-motown-soul-disco-sunday-matinee-special/* /whats-on/ 301!',
                 '/get-ready /whats-on/ 301!', '/get-ready/ /whats-on/ 301!',
                 '/events/the-2pm-club-luton-80s-90s-00s-daytime-disco/* https://www.the2pmclub.co.uk/hubs/luton/ 301!',
                 '/event/the-2pm-club-bedford-80s-90s-00s-daytime-disco https://www.the2pmclub.co.uk/hubs/bedford/ 301!',
                 '/event/the-2pm-club-bedford-80s-90s-00s-daytime-disco/* https://www.the2pmclub.co.uk/hubs/bedford/ 301!',
                 '/event/071225-fsd-npton /family-silent-disco/ 301!',
                 '/event/210326-sd-npton /silent-disco/ 301!',
                 '/event/031026-2pm-lut /locations/luton/ 301!',
                 '/event/031026-2pm-lut/ /locations/luton/ 301!',
                 '/event/031026-2pm-lut/* /locations/luton/ 301!',
                 '/event/031026-2PM-LUT /locations/luton/ 301!',
                 '/event/031026-2PM-LUT/ /locations/luton/ 301!',
                 '/event/031026-2PM-LUT/* /locations/luton/ 301!']
        pm_by_code = {e['code'].lower(): e for e in CURRENT_EVENTS['pm']}
        old = (TWIN / 'legacy-redirects-boom.txt').read_text().splitlines()
        for line in old:
            parts = line.split()
            if len(parts) < 2 or not parts[0].startswith('/event/') or 'the2pmclub.co.uk/events/' not in parts[1]:
                continue
            src = parts[0]
            if any(row.split()[0] == src for row in rows):
                continue
            code = src.split('/')[2].lower()
            if code in pm_by_code:
                dest = PM_BASE + pm_by_code[code]['path']
            elif code == '250726-2pm-npton':
                dest = PM_BASE + '/events/031026-2pm-npton/'
            else:
                city = CITY_CODE.get(code.split('-')[-1].upper())
                dest = PM_BASE + '/hubs/' + (city.lower().replace(' ', '-') if city else '') + '/' if city else PM_BASE + '/events/'
            rows.append(f'{src} {dest} 301!')
        for e in events:
            src = '/events/' + e['code'].lower()
            rows += [f'{src} {e["path"]} 301!', f'{src}/ {e["path"]} 301!']
        rows += ['/.env* /404.html 404!', '/.env/* /404.html 404!',
                 '/.git/* /404.html 404!', '/.DS_Store /404.html 404!']
    for e in events:
        if e['brand'] != brand: continue
        rows.append(f'/tickets/{e["code"].lower()}/ https://www.eventbrite.co.uk/e/{e["eventbriteId"]}?aff=BoomWeb 302!')
    # An unknown URL should return a real 404, never an old React shell.
    rows.append('/* /404.html 404')
    return rows


def build():
    global CURRENT_EVENTS
    boom, pm = normalized()
    all_events = {e['code']: e for e in boom + pm}
    errors = install_assets(all_events.values())
    for e in boom + pm: e['poster'] = all_events[e['code']]['poster']
    CURRENT_EVENTS = {'boom': boom, 'pm': pm}
    build_formats()
    for brand, events in CURRENT_EVENTS.items():
        dist = OUTPUT_ROOT / ('dist-2pm' if brand == 'pm' else 'dist-boom')
        if dist.exists(): shutil.rmtree(dist)
        (dist / 'assets').mkdir(parents=True)
        for f in (HERE / 'assets').iterdir():
            if f.is_file(): shutil.copyfile(f, dist / 'assets' / f.name)
        shutil.copyfile(HERE / 'site.css', dist / 'assets/site.css')
        shutil.copyfile(HERE / 'site.js', dist / 'assets/site.js')
        if RELEASE_MODE: shutil.copyfile(HERE / 'consent.js', dist / 'assets/consent.js')
        write_page(dist, '', home(brand, events))
        write_page(dist, 'whats-on', listing(brand, events))
        if brand == 'pm':
            write_page(dist, 'events', listing(brand, events))
            write_page(dist, 'hubs', locations(brand, events))
        write_page(dist, 'locations', locations(brand, events))
        for city in sorted(set(verified_places(brand)) | {c for c, _ in live_cities(brand)}):
            write_page(dist, city_url(brand, city), city_page(brand, city, events))
        for e in events:
            if e['brand'] == brand: write_page(dist, e['path'], details(brand, e))
        if brand == 'pm':
            write_page(dist, 'what-to-expect', pm_what_to_expect(events))
        else:
            for key in BOOM_FORMATS: write_page(dist, key, boom_format(key, events))
            if not RELEASE_MODE: write_page(dist, 'get-ready', paused_format_page('Get Ready'))
        write_page(dist, 'about', about_page(brand, events))
        write_page(dist, 'group-bookings', groups_page(brand, events))
        write_page(dist, 'faqs', faq_page(brand))
        write_page(dist, 'contact', contact_page(brand))
        if brand == 'boom': write_page(dist, 'faq', faq_page(brand))
        if brand == 'pm':
            for route in ('/blog/hen-do-daytime-disco/', '/blog/hen-party-ideas-northampton/', '/blog/birthday-party-ideas-northampton-adults/', '/blog/why-daytime-discos-are-popular/'):
                write_page(dist, route, fresh_blog_page(route))
            write_page(dist, 'blog', blog_index())
            write_page(dist, 'blog/what-is-a-daytime-disco', blog_daytime_guide())
        for key in (['privacy', 'terms', 'for-ai'] if brand == 'pm' else ['privacy', 'terms', 'jobs', 'for-ai']):
            write_page(dist, key, official_content_page(brand, key))
        if brand == 'pm': shutil.copyfile(PM_FEED, dist / 'events.json')
        else:
            shutil.copyfile(BOOM_FEED, dist / 'events-boombastic.json')
            shutil.copyfile(TWIN / 'source-snapshots/venues.json', dist / 'venues.json')
        if RELEASE_MODE:
            base = PM_BASE if brand == 'pm' else BOOM_BASE
            if brand == 'pm':
                current_codes = {e['code'].lower() for e in events}
                upcoming = []
                for raw in PM:
                    code = str(raw.get('slug') or '').lower()
                    if code not in current_codes: continue
                    item = dict(raw)
                    item['canonicalUrl'] = base + '/events/' + code + '/'
                    item['bookUrl'] = item['canonicalUrl']
                    upcoming.append(item)
                upcoming.sort(key=lambda x: x['start'])
                (dist / 'upcoming-events.json').write_text(json.dumps(upcoming, ensure_ascii=False, indent=2) + '\n')
                llms = f'''# THE 2PM CLUB\n\nTHE 2PM CLUB is a daytime disco produced by Boombastic Events. Event times, venues, music editions, prices and availability vary by date. Confirm them on the individual event page and in Eventbrite checkout.\n\n- About: {base}/about/\n- What to expect: {base}/what-to-expect/\n- Dates and tickets: {base}/events/\n- Locations: {base}/hubs/\n- FAQs: {base}/faqs/\n- Daytime disco guide: {base}/blog/what-is-a-daytime-disco/\n- Full event feed: {base}/events.json\n- Upcoming event feed: {base}/upcoming-events.json\n- Operator: {BOOM_BASE}/\n- Contact: {EMAIL}\n'''
            else:
                llms = f'''# Boombastic Events\n\nBoombastic Events produces live parties including Silent Disco Greatest Hits, Footloose 80s, Boombastic 90s, Family Silent Disco and THE 2PM CLUB. Dates, venues, ticket prices and availability vary by event. Confirm details on the event page and in Eventbrite checkout.\n\n- About: {base}/about/\n- Dates and tickets: {base}/whats-on/\n- Our parties: {base}/about/#parties\n- Locations: {base}/locations/\n- FAQs: {base}/faq/\n- Full event feed: {base}/events-boombastic.json\n- Venues: {base}/venues.json\n- THE 2PM CLUB: {PM_BASE}/\n- Contact: {EMAIL}\n'''
            (dist / 'llms.txt').write_text(llms)
            aliases = {'whats-on', 'locations'} if brand == 'pm' else {'faqs', 'get-ready'}
            routes = sorted('/' + str(f.parent.relative_to(dist)).replace('.', '').strip('/') + '/' for f in dist.rglob('index.html'))
            routes = [r.replace('//', '/') for r in routes if r.strip('/') not in aliases]
            sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'  <url><loc>{base}{r}</loc></url>\n' for r in routes) + '</urlset>\n'
            (dist / 'sitemap.xml').write_text(sitemap)
            (dist / 'robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: {base}/sitemap.xml\n')
            (dist / '_headers').write_text('/*\n  X-Content-Type-Options: nosniff\n')
            redirects = release_redirects(brand, events)
            (dist / '_redirects').write_text('\n'.join(redirects) + '\n')
        else:
            (dist / 'robots.txt').write_text('User-agent: *\nDisallow: /\n')
            (dist / '_headers').write_text('/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  X-Content-Type-Options: nosniff\n')
        (dist / '404.html').write_text(not_found(brand))
        print(brand, len(list(dist.rglob('index.html'))), 'pages')
    provenance(all_events.values())
    print('poster errors', len(errors))


if __name__ == '__main__': build()
