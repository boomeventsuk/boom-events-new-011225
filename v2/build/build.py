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
from partnerships import render_partnership_page
from recruitment import render_recruitment_page

HERE = Path(__file__).resolve().parent
TWIN = HERE.parent.parent
RELEASE_MODE = os.environ.get('TWIN_RELEASE') == '1'
OUTPUT_ROOT = Path(os.environ.get('TWIN_OUTPUT_ROOT', HERE / 'release-candidate' if RELEASE_MODE else HERE))
if RELEASE_MODE and not (os.environ.get('TWIN_BOOM_FEED') and os.environ.get('TWIN_PM_FEED')):
    raise SystemExit('Production candidate requires explicit TWIN_BOOM_FEED and TWIN_PM_FEED')
BOOM_FEED = Path(os.environ.get('TWIN_BOOM_FEED', TWIN / 'source-snapshots/boom-events-2026-09-23.json'))
PM_FEED = Path(os.environ.get('TWIN_PM_FEED', TWIN / 'source-snapshots/2pm-events-2026-09-23.json'))
BOOM = json.loads(BOOM_FEED.read_text())
# Withdrawn at John's instruction on 14th October 2026. Keep external feeds from restoring the event.
WITHDRAWN_EVENT_CODES = {'281026-FSD-NPTON'}
BOOM = [e for e in BOOM if str(e.get('eventCode', '')).upper() not in WITHDRAWN_EVENT_CODES]
PM = json.loads(PM_FEED.read_text())
# Ended Boombastic dates leave the public feed (sync script and build both filter them) and are kept
# in this archive so redirects, town history and venues.json still know where we have partied.
HISTORY_PATH = TWIN / 'data/boom-event-history.json'
HISTORY = json.loads(HISTORY_PATH.read_text()) if HISTORY_PATH.exists() else []
# One name per venue everywhere (venues.json, pages, feed). Franklin's Gardens: JD to confirm DPD versus cinch.
VENUE_ALIASES = {"Cinch Stadium, Franklin's Gardens": "DPD Stadium at Franklin's Gardens"}
for _r in BOOM + HISTORY:
    if _r.get('venue') in VENUE_ALIASES: _r['venue'] = VENUE_ALIASES[_r['venue']]
BOOM_ALL = BOOM + [h for h in HISTORY if h.get('eventCode') not in {r.get('eventCode') for r in BOOM}]
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
# IndexNow lets Bing (and the AI search products built on its index) hear about changed pages on deploy.
# The key is public by design: it is served at /<key>.txt on each owned domain.
INDEXNOW_KEY = '6f1c2b9e8d4a47b3a0e5c7d9f2b18e64'
ORG_DESCRIPTION = {
    'boom': 'Boombastic Events is a party promoter running Silent Disco Greatest Hits, Decades Parties (Boombastic 90s and Footloose 80s), Family Silent Disco, seasonal Halloween and Christmas parties, and THE 2PM CLUB daytime disco, since 2014.',
    'pm': 'THE 2PM CLUB Daytime Disco: Saturday afternoon parties with Sing Out Loud Anthems from the 80s, 90s and 00s, doors at 2pm. Run by Boombastic Events.',
}
# Route-specific descriptions where the page's own summary is too thin for search results.
DESCRIPTIONS = {
    ('boom', '/contact/'): 'Email Boombastic Events about tickets, access or an upcoming party. Include your event date, city and order reference and the team will help.',
    ('boom', '/faq/'): 'Straight answers on Boombastic Events tickets, timings, access and entry: finding your Eventbrite tickets, group bookings, silent disco headphones and family parties.',
    ('boom', '/faqs/'): 'Straight answers on Boombastic Events tickets, timings, access and entry: finding your Eventbrite tickets, group bookings, silent disco headphones and family parties.',
    ('boom', '/for-ai/'): 'Public facts and machine-readable data for Boombastic Events: the event feed, venues, and where to find live dates, times and ticket details.',
    ('boom', '/group-bookings/'): 'Plan a birthday, Christmas party or night out with Boombastic Events. Many dates have a group-of-four ticket; email us about larger groups.',
    ('boom', '/jobs/'): 'Paid DJ and Event Assistant roles with Boombastic Events and THE 2PM CLUB. Read the work and practical requirements, then introduce yourself.',
    ('boom', '/privacy/'): 'How Boombastic Events Ltd collects, uses and protects your information when you visit the website, book through Eventbrite or attend an event.',
    ('boom', '/silent-disco/'): 'Silent Disco Greatest Hits: three live DJs on three headphone channels, pop, indie and dance. Switch whenever you like. See dates, venues and tickets.',
    ('pm', '/about/'): 'About THE 2PM CLUB Daytime Disco: a Saturday afternoon party with a DJ, a full sound system and 80s, 90s and 00s anthems. Doors at 2pm. Run by Boombastic Events.',
    ('pm', '/blog/'): 'Guides from THE 2PM CLUB: what a daytime disco is, hen do and birthday ideas, and how an afternoon party works. Each event page has its own times and tickets.',
    ('pm', '/contact/'): 'Email THE 2PM CLUB team about tickets, access or an upcoming daytime disco. Include your event date, city and order reference so we can help.',
    ('pm', '/faqs/'): 'Straight answers before you book THE 2PM CLUB: tickets, start and finish times, access, coming on your own, what to wear and entry rules.',
    ('pm', '/for-ai/'): 'Public facts and machine-readable data for THE 2PM CLUB: the event feed, upcoming dates and where to find live times, venues and ticket details.',
    ('pm', '/group-bookings/'): 'Birthdays, hen dos and work dos at THE 2PM CLUB. Share one date with the group chat; many dates have a group-of-four ticket. Email us about larger groups.',
    ('pm', '/privacy/'): 'How Boombastic Events Ltd, which runs THE 2PM CLUB, collects and uses personal information, including consent-based analytics and advertising cookies.',
    ('pm', '/terms/'): 'Terms for THE 2PM CLUB tickets: sold through Eventbrite, valid for the named date, with refunds under the Eventbrite policy for each event.',
}
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
    'silent-photo.jpeg': ('Guests dancing in light-up silent disco headphones', 'Silent Disco Greatest Hits, Northampton, Apr 2026', 'reports/website-research-2026-09-22/page-designs/assets/silent-disco-crowd.jpeg'),
    'footloose-photo.jpeg': ('Friends singing into inflatable microphones under stage lights', 'Footloose 80s, Northampton, Mar 2026', 'reports/website-research-2026-09-22/page-designs/assets/footloose-crowd.jpeg'),
    'fl-room.jpg': ('A packed room at an 80s night, lights and balcony', 'Footloose 80s, Northampton, Mar 2026', '210326-FL80-NPTON processed no-logo'),
    'fl-group.jpg': ('Friends with inflatable microphones, arms raised', 'Footloose 80s, Northampton, Mar 2026', '210326-FL80-NPTON processed no-logo'),
    'fl-portrait.jpg': ('Four friends posing with an orange inflatable microphone', 'Footloose 80s, Northampton, Mar 2026', '210326-FL80-NPTON processed no-logo'),
    'fl-dj.jpg': ('The DJ booth and a colourful dancefloor', 'Footloose 80s, Northampton, Mar 2026', '210326-FL80-NPTON processed no-logo'),
    'b90-stage.jpg': ('90s videos on the big screen above a singing crowd', 'Boombastic 90s, Northampton, Sept 2026', '120926-B90-NPTON clean 006'),
    'b90-group.jpg': ('A group of friends posing under rainbow lights', 'Boombastic 90s, Northampton, Sept 2026', '120926-B90-NPTON clean 005'),
    'b90-crowd.jpg': ('A lively crowd singing along, inflatable microphones up', 'Boombastic 90s, Northampton, Sept 2026', '120926-B90-NPTON clean 003'),
    'b90-mic.jpg': ('A guest singing into an inflatable microphone', 'Boombastic 90s, Northampton, Sept 2026', '120926-B90-NPTON clean 002'),
    # Added 23rd Sept 2026 from the Notion Event Photo Library (unedited camera originals; see qa/photo-refresh/new-assets.json).
    'sd-energy.jpg': ('A group of friends dancing with arms raised in light-up headphones', 'Silent Disco Greatest Hits, Northampton, Apr 2026', 'Notion Event Photo Library: Main Event Images/SD/250426-SD-NPTON-high-energy-group-arms-up.jpeg'),
    'sd-four-friends.jpg': ('Four friends smiling together in light-up headphones', 'Silent Disco Greatest Hits, Northampton, Apr 2026', 'Notion Event Photo Library: Main Event Images/SD/250426-SD-NPTON-four-friends-smiling-headphones.jpeg'),
    'sd-dance-drinks.jpg': ('Friends dancing with drinks in light-up headphones', 'Silent Disco Greatest Hits, Northampton, Apr 2026', 'Notion Event Photo Library: Main Event Images/SD/250426-SD-NPTON-dancefloor-friends-drinks-headphones.jpeg'),
    'sd-two-women.jpg': ('Two friends smiling in light-up headphones', 'Silent Disco Greatest Hits, Northampton, Apr 2026', 'Notion Event Photo Library: Main Event Images/SD/250426-SD-NPTON-two-women-smiling-headphones.jpeg'),
    'poster-121226-fsd-npton.webp': ('Official Christmas Family Silent Disco event artwork', 'Christmas Family Silent Disco, Northampton, Dec 2026', 'Public event promotional artwork, 061226-FSD-NPTON'),
    'family-silent-disco-live.jpg': ('Families dancing in glowing headphones beneath a Family Silent Disco screen', 'At a Family Silent Disco event', 'Photo supplied by John on 23rd September 2026; event date and venue not supplied'),
    'pm-npton-feb.jpg': ('Two friends dancing mid-chorus, drinks in hand', 'THE 2PM CLUB, Northampton, Feb 2026', 'Notion Event Photo Library: Main Event Images/2PM/280226-2PM-NPTON-two-friends-dancing-with-drinks.jpeg'),
    'pm-leic.jpg': ('A packed dancefloor with arms raised and music videos on the big screens', 'THE 2PM CLUB, Leicester, May 2026', 'Notion Event Photo Library: Main Event Images/2PM/020526-2PM-LEIC-packed-leicester-dancefloor-arms-raised.jpeg'),
    'pm-cov.jpg': ('Three friends laughing together with stage lights behind', 'THE 2PM CLUB, hmv Empire, Coventry, Mar 2026', 'Notion Event Photo Library: Main Event Images/2PM/070326-2PM-COV-three-women-laughing-arms-raised-dancefloor.jpeg'),
    'pm-bed.jpg': ('Five friends smiling together under green lasers', 'THE 2PM CLUB, Bedford Esquires, Bedford, June 2026', 'Notion Event Photo Library: Main Event Images/2PM/130626-2PM-BED-five-friends-smiling-dancefloor.jpeg'),
    'pm-mk.jpg': ('A guest singing into an inflatable microphone in a busy crowd', 'THE 2PM CLUB, Milton Keynes, Mar 2026', 'Notion Event Photo Library: Main Event Images/2PM/140326-2PM-MK-woman-black-top-inflatable-mic-singing-crowd.jpeg'),
}

# 2PM event and city pages: a real photo from a 2PM date in that city.
PM_CITY_PHOTO = {'Leicester': 'pm-leic.jpg', 'Coventry': 'pm-cov.jpg', 'Bedford': 'pm-bed.jpg', 'Milton Keynes': 'pm-mk.jpg', 'Northampton': 'pm-npton-feb.jpg'}

# Per-route search metadata and extra JSON-LD set by page builders, read by seo_enrich.
# Key: (brand, route). PAGE_META value: dict(title=full <title>, description=meta description).
PAGE_META = {}
EXTRA_SCHEMA = {}
# Short venue names for meta descriptions where the full name is long.
# County for schema addressRegion (geography, not event data).
REGION = {'Northampton': 'Northamptonshire', 'Bedford': 'Bedfordshire', 'Luton': 'Bedfordshire', 'Leicester': 'Leicestershire',
          'Coventry': 'West Midlands', 'Milton Keynes': 'Buckinghamshire'}
SHORT_VENUE = {"DPD Stadium at Franklin's Gardens": "Franklin's Gardens"}

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


def d_day(v):
    """Full weekday and month, no year: Wednesday 28th October."""
    d = dt(v); return f"{d.strftime('%A')} {ordinal(d.day)} {d.strftime('%B')}"


def d_day_year(v):
    d = dt(v); return f"{d.strftime('%A')} {ordinal(d.day)} {d.strftime('%B %Y')}"


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
    if '-2PMDF-' in code: return 'pmdf'
    if '-2PM-' in code: return 'pm80' if '80s' in title else 'pmxmas'
    if '-FSD-' in code: return 'fsd'
    if '-SD-' in code: return 'sdxmas' if 'Christmas' in title else 'sd'
    if '-B90-' in code: return 'b90'
    if '-HHP-' in code: return 'hhp'
    if code == '311226-DEC-NPTON': return 'nye'
    if '-DEC-' in code: return 'dec'
    return 'party'


FORMAT = {
    # key: (badge, badge colour, filter type, display pre-title, eyebrow)
    'pmdf': ('Disco Fever', 'pink', 'Disco Fever', 'DISCO FEVER', 'THE 2PM CLUB'),
    'pm80': ('80s Edition', 'pink', '80s Edition', '80s Edition', 'THE 2PM CLUB Daytime Disco'),
    'pmxmas': ('Christmas', 'hot', 'Christmas', 'Christmas Daytime Disco', 'THE 2PM CLUB Daytime Disco'),
    'sd': ('Silent Disco', 'blue', 'Silent disco', 'Silent Disco', 'Silent Disco Greatest Hits'),
    'sdxmas': ('Christmas Silent Disco', 'blue', 'Silent disco', 'Christmas Silent Disco', 'Silent Disco Greatest Hits'),
    'fsd': ('Family Silent Disco', 'green', 'Family', 'Family Silent Disco', ''),
    'b90': ('Boombastic 90s', 'coral', 'Decades Parties', 'Boombastic 90s', ''),
    'hhp': ('Halloween House Party', 'orange', 'Halloween', 'Halloween House Party', ''),
    'nye': ('Boombastic NYE', 'coral', 'Decades Parties', 'Boombastic NYE: The Decades Party', 'New Year’s Eve 2026'),
    'dec': ('Christmas Decades Party', 'coral', 'Decades Parties', 'Christmas Decades Party', ''),
}


def badge(e):
    if e['brand'] == 'boom-crosslink':
        return ('THE 2PM CLUB Christmas Daytime Disco' if e['fmt'] == 'pmxmas' else 'THE 2PM CLUB'), 'hot'
    b = FORMAT[e['fmt']]; return b[0], b[1]


def normalized():
    p = []
    for raw in PM:
        if raw['start'][:10] < TODAY or raw.get('isCancelled'): continue
        code = raw['slug']
        p.append(dict(code=code, title=raw['title'], city=CITY_CODE.get(raw['cityCode'], raw['cityCode']), venue=raw['location'].rsplit(', ', 1)[0], address=raw.get('venueAddress') or {}, start=raw['start'], end=raw['end'], image=raw['image'], eventbriteId=raw['eventbriteId'], price=raw.get('priceLabel'), groupTicket=raw.get('groupTicket'), status=raw.get('statusLabel'), description=raw.get('description') or '', subtitle=raw.get('subtitle') or '', full=raw.get('fullDescription') or '', highlights=raw.get('highlights') or '', soundtrack=raw.get('soundtrack') or '', brand='pm', path=f'/events/{code.lower()}/', owned=f'https://www.the2pmclub.co.uk/events/{code.lower()}/'))
    p.sort(key=lambda e: e['start'])
    b = []
    for raw in BOOM:
        if raw['start'][:10] < TODAY or raw.get('isCancelled'): continue
        if '2PM' in raw['title'].upper():
            match = next((e for e in p if e['eventbriteId'] == raw['eventbriteId']), None)
            if match: b.append({**match, 'path': PM_BASE + match['path'], 'brand': 'boom-crosslink'})
            continue
        code = raw['eventCode']
        b.append(dict(saleStartsAt=raw.get('saleStartsAt'), code=code, title=raw['title'], city=raw['city'], venue=raw['venue'], address=raw.get('venueAddress') or {}, start=raw['start'], end=raw['end'], image=raw['image'], eventbriteId=raw['eventbriteId'], price=raw.get('priceLabel'), groupTicket=raw.get('groupTicket'), status=raw.get('statusLabel'), description=raw.get('description') or '', subtitle=raw.get('subtitle') or '', full=raw.get('fullDescription') or '', highlights=raw.get('highlights') or '', soundtrack=raw.get('soundtrack') or '', brand='boom', path=f'/event/{code.lower()}/', owned=f'https://www.boomevents.co.uk/event/{code.lower()}/'))
    b.sort(key=lambda e: e['start'])
    # Same named venue, address taken from another entry in the same dated feeds when this entry lacks one.
    known = {}
    for raw in PM + BOOM_ALL:
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


def format_sold_out(token):
    """Upcoming sold-out Boombastic dates for a format: listed with their waiting list, never hidden."""
    return [e for e in CURRENT_EVENTS['boom'] if e['brand'] == 'boom' and token in e['code'] and e['start'][:10] >= TODAY and e.get('soldout')]


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
    raw = PM if brand == 'pm' else BOOM_ALL
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
        # Prefer the lightest web format when several copies of the same poster exist.
        rank = {'.webp': 0, '.jpg': 1, '.jpeg': 1, '.png': 2}
        found = sorted((HERE / 'assets').glob(stem + '.*'), key=lambda f: (rank.get(f.suffix.lower(), 3), f.name))
        if found and found[0].stat().st_size > 1000: e['poster'] = '/assets/' + found[0].name
        else: e['poster'] = e['image']; errors.append(f"{e['code']}: local poster missing, remote fallback used")
    heavy = sorted({e['poster'] for e in events if e['poster'].startswith('/assets/') and (HERE / 'assets' / e['poster'].rsplit('/', 1)[1]).stat().st_size > 600_000})
    if heavy: print('WARNING: posters over 600 KB slow the listing pages on phones; add a .webp copy:', ', '.join(heavy))
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
    if e['code'] == '281026-FSD-NPTON':
        return ('Good to know for families', 'Supporter Village Barn at DPD Stadium at Franklin\'s Gardens. In adverse weather, the event moves to the Rodber Suite at Saints. Children must be supervised by their accompanying adult at all times; this is not a drop-off event. Designed for ages 4 and up. Under-4s are welcome, ideally as babes in arms, and babes in arms go free; everyone else needs a ticket. Maximum three children per adult.')
    if e['code'] == '121226-FSD-NPTON':
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
    if f == 'pmdf':
        return dict(h2='THE DISCO ERA. ALL AFTERNOON.', sub='Four hours of the biggest disco hits ever made. Glitter ball up, dancefloor full, all afternoon.',
                    lede='THE 2PM CLUB returns with a Disco Fever special.' if e['city'] == 'Northampton' else 'THE 2PM CLUB is back at Esquires with a Disco Fever special.',
                    bullets=[('music', 'The biggest disco hits, back to back'), ('star', 'Glitter ball, big lights, full dancefloor'), ('clock', '2pm till 6pm, home by 7')],
                    quote=QUOTES['lorne'], photo='pm-mic.jpg')
    if f == 'pm80':
        return dict(h2='ALL THE 80s. ALL AFTERNOON.', sub='Your best 80s night out. In the middle of the afternoon.', lede='Four hours of 80s Sing Out Loud Anthems, back to back. Doors at 2pm, and home by 7 if you want to be.',
                    bullets=[('music', 'Wall-to-wall 80s, from Madonna to Duran Duran'), ('people', 'One link for the group chat, one Saturday plan'), ('star', f'Doors at 2pm, done by {end}. Sunday not written off')], quote=QUOTES['lorne'], photo='pm-mic.jpg')
    if f == 'pmxmas':
        return dict(h2='YOUR CHRISTMAS PARTY. SORTED.', sub='Festive classics plus the biggest Sing Out Loud Anthems from the 80s, 90s and 00s.', lede='Festive classics first, then the choruses everyone knows. Doors at 2pm, with the rest of Saturday evening still yours.',
                    bullets=[('music', 'Mariah, Wham! and Slade, then Whitney, Take That and Oasis'), ('people', 'One link, one payment, Christmas reunion sorted'), ('star', f'Party early, home happy. Done by {end}')], quote=QUOTES['lorne_long'], photo='pm-hero.webp')
    if f == 'sd':
        return dict(h2='THREE CHANNELS. ONE DANCEFLOOR.', sub=e['subtitle'] + '. Three channels, three DJs, one dancefloor.', lede='Pick your channel and switch whenever you want. Your headphones, your rules.',
                    bullets=[('headphones', 'Three live DJs: pop throwbacks, indie classics, dance anthems'), ('people', 'The pop queen, the indie kid and the dance head, on one floor'), ('star', 'The tenth birthday sold out here in April 2026. Send it off properly')], quote=None, photo='silent-photo.jpeg')
    if f == 'sdxmas':
        return dict(h2='ELEVEN YEARS OF FESTIVE HEADPHONES.', sub='Three channels, three DJs, four hours. One very festive night.', lede='Friends, office parties and couples, all on one dancefloor. Pick your vibe or switch it up.',
                    bullets=[('headphones', 'Christmas & party, indie classics and dance anthems'), ('people', 'Office party, friends or a festive catch-up'), ('ticket', '£10 fully refundable headphone deposit on the night')], quote=None, photo='sd-dance-drinks.jpg')
    if e['code'] == '281026-FSD-NPTON':
        return dict(h2='THREE CHANNELS. ONE HALLOWEEN PARTY.', sub=e['subtitle'], lede='Costumes on, headphones on. Dance together at the home of Northampton Saints, DPD Stadium at Franklin\'s Gardens, on Wednesday 28th October from 2pm to 4pm.',
                    bullets=[('headphones', 'PARTY, THROWBACKS AND CHARTS: switch between three music channels'), ('child', 'Children dance with and are supervised by their accompanying adult'), ('ticket', '£10 adult or child tickets; group of four £35, plus Eventbrite booking fees')], quote=None, photo=None)
    if f == 'fsd':
        return dict(h2='EVERYONE FINDS THEIR VIBE.', sub=e['subtitle'], lede='Christmas jumpers on, headphones on. Kids bounce to party hits, parents move to throwbacks and teens pick the chart channel, all on the same dancefloor.',
                    bullets=[('child', 'Perfect for kids 4+, and parents join in too'), ('headphones', 'Three family-friendly channels, curated by the Boombastic team'), ('star', 'Best festive-dressed family or group wins tickets to the next one')], quote=None, photo=None)
    if f == 'b90':
        return dict(h2='YOUR DECADE. YOUR PEOPLE.', sub='All of the nineties. Every last bit of it.', lede='You picked a side in August 95, Blur or Oasis, and you still stand by it. Four hours of pop, Britpop, dance and hip-hop swagger at Bedford Esquires. We have been bringing Boombastic nights to Bedford for ten years.',
                    bullets=[('music', 'Spice Girls, Oasis, TLC and Faithless on one night'), ('screen', 'Giant screens with authentic 90s videos'), ('star', 'Come as you are. Just be ready to sing every word')], quote=None, photo='b90-mic.jpg')
    if f == 'hhp':
        return dict(h2='TWO FLOORS. ONE HALLOWEEN.', sub='One building. Two floors. Five hours of anthems and classics.', lede='Our first ever Halloween House Party. Upstairs is 90s and 00s throwback anthems; downstairs is 90s and 00s indie classics. Party from 8pm to 1am.',
                    bullets=[('music', 'Upstairs: Spice Girls to Daft Punk'), ('music', 'Downstairs: Oasis to Arctic Monkeys'), ('info', 'Entry is 18+. Valid photo ID may be required')], quote=None, photo='b90-crowd.jpg')
    if f == 'nye':
        return dict(h2='BOOMBASTIC NYE IS BACK!', sub=e['subtitle'],
                    lede='We couldn’t let another New Year’s Eve pass without a massive Boombastic party in Northampton. After 10 years of sellout New Year’s Eve parties, we’re bringing Boombastic NYE to The Charles Bradlaugh.',
                    bullets=[('music', 'The biggest hits of the 80s, 90s and 2000s'), ('people', 'All on one dancefloor. Get your mates together'), ('clock', '8pm to 1am on Thursday 31st December, seeing in 2027')], quote=None, photo=None)
    if f == 'dec':
        return dict(h2='THE CHRISTMAS NIGHT OUT.', sub='Wall-to-wall 80s, 90s and 00s anthems with festive classics from Mariah, Wham!, Slade and co.', lede='Grab your favourite people for four hours of 80s, 90s and 00s anthems, laced with the Christmas classics you still know word for word.',
                    bullets=[('music', 'Mariah and Wham! alongside Whitney, Take That and Oasis'), ('people', 'One date for the people you want to spend Christmas with'), ('star', 'Four hours on the dancefloor')], quote=QUOTES['emma_r'], photo='b90-group.jpg')
    return dict(h2='YOUR NEXT PARTY.', sub=e['subtitle'], lede=e['description'], bullets=[], quote=None, photo='boom-hero.jpg')


# ---------------------------------------------------------------- shared components

# Focal points for photos whose subject is off-centre (checked crop by crop).
PHOTO_POS = {'sd-energy.jpg': '50% 50%', 'b90-mic.jpg': '50% 42%', 'family-silent-disco-live.jpg': '50% 70%'}


_SIZES = {}


def img_size(path):
    """(width, height) of a JPEG, PNG or WebP without Pillow, so the Netlify build needs no extra package."""
    if path in _SIZES: return _SIZES[path]
    size = None
    try:
        data = Path(path).read_bytes()
        if data[:8] == b'\x89PNG\r\n\x1a\n':
            size = int.from_bytes(data[16:20], 'big'), int.from_bytes(data[20:24], 'big')
        elif data[:4] == b'RIFF' and data[8:12] == b'WEBP':
            kind = data[12:16]
            if kind == b'VP8 ': size = int.from_bytes(data[26:28], 'little') & 0x3fff, int.from_bytes(data[28:30], 'little') & 0x3fff
            elif kind == b'VP8L':
                b = int.from_bytes(data[21:25], 'little'); size = (b & 0x3fff) + 1, ((b >> 14) & 0x3fff) + 1
            elif kind == b'VP8X': size = int.from_bytes(data[24:27], 'little') + 1, int.from_bytes(data[27:30], 'little') + 1
        elif data[:2] == b'\xff\xd8':
            i = 2
            while i < len(data) - 9:
                if data[i] != 0xFF: i += 1; continue
                marker = data[i + 1]
                if marker in (0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7, 0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF):
                    size = int.from_bytes(data[i + 7:i + 9], 'big'), int.from_bytes(data[i + 5:i + 7], 'big'); break
                i += 2 + int.from_bytes(data[i + 2:i + 4], 'big')
    except OSError:
        size = None
    _SIZES[path] = size
    return size


def small_copy(asset_url, suffix):
    """'/assets/x-600.webp' when make-responsive.py has made it, else None."""
    if not asset_url.startswith('/assets/'): return None
    stem = asset_url.rsplit('/', 1)[1].rsplit('.', 1)[0]
    f = HERE / 'assets' / f'{stem}-{suffix}.webp'
    return f'/assets/{f.name}' if f.exists() else None


def srcset_attrs(asset_url, suffix, sizes):
    small = small_copy(asset_url, suffix)
    full = img_size(HERE / 'assets' / asset_url.rsplit('/', 1)[1]) if asset_url.startswith('/assets/') else None
    if not small or not full: return ''
    return f' srcset="{small} {suffix}w, {asset_url} {full[0]}w" sizes="{sizes}"'


def photo(name, cls='', loading='lazy', caption=True, cap=None, pos=None):
    alt, cap0, _ = PHOTOS[name]
    cap = cap or cap0
    pos = pos or PHOTO_POS.get(name)
    style = f' style="object-position:{pos}"' if pos else ''
    capx = f'<figcaption>{esc(cap)}</figcaption>' if caption else ''
    dims = img_size(HERE / 'assets' / name)
    wh = f' width="{dims[0]}" height="{dims[1]}"' if dims else ''
    prio = ' fetchpriority="high"' if loading == 'eager' else ''
    sizes = '100vw' if 'hero' in cls else '(max-width: 760px) 100vw, 50vw'
    return f'<figure class="ph {cls}"><img src="/assets/{name}"{srcset_attrs("/assets/" + name, 800, sizes)} alt="{esc(alt)}"{wh} loading="{loading}" decoding="async"{prio}{style}>{capx}</figure>'


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
            so = format_sold_out(token)
            sub = (f'{len(ds)} date{"s" if len(ds) != 1 else ""} on sale. Next: {d_short(ds[0]["start"])}' if ds
                   else f'{d_short(so[0]["start"])} sold out. Waiting list open' if so else 'No date on sale')
            fmts.append((label, sub, f'/{key}/', active == f'/{key}/', False))
        third = dropdown('parties', 'Our parties', fmts, f'<a class="dd-all" href="/about/#parties">All our parties {ARROW}</a>', active in [f'/{k}/' for k, _, _ in FORMAT_PAGES])
    xmas = '' if pm or not christmas_events(CURRENT_EVENTS[brand]) else f'<a href="/christmas-parties/"{cur("/christmas-parties/")}>Christmas</a>'
    items = f'<a href="/whats-on/"{cur("/whats-on/")}>What’s on</a>{xmas}{locs}{third}{about}<a href="/work-with-us/"{cur("/work-with-us/")}>Work with us</a>'
    return f'''<header class="hdr"><div class="container hdr-in"><a class="brand" href="/" aria-label="{name} home"><img src="/assets/{'pm' if pm else 'boom'}-logo.png" alt="{name}" width="{'120' if pm else '190'}" height="{'64' if pm else '56'}"></a><nav id="main-nav" class="nav" aria-label="Main navigation">{items}<a class="nav-more" href="/faqs/">FAQs</a><a class="nav-more" href="/group-bookings/">Groups</a><a class="nav-more" href="/contact/">Contact</a></nav><a class="pill-btn hdr-cta" href="{ticket_href}">Find tickets</a><a class="pill-btn m-tickets" href="{ticket_href}">Tickets</a><button class="menu-btn" type="button" aria-expanded="false" aria-controls="main-nav" aria-label="Open menu"><span></span><span></span><span></span></button></div></header>'''


def footer(brand):
    pm = brand == 'pm'
    other = (BOOM_BASE if pm else PM_BASE) + '/'
    live = 'https://www.the2pmclub.co.uk' if pm else 'https://www.boomevents.co.uk'
    socials = ''.join(f'<a href="{u}" aria-label="{label}" rel="noopener">{icon(n)}</a>' for n, u, label in SOCIAL[brand])
    by = f'<a class="by" href="{other}">By Boombastic Events</a>' if pm else ''
    more = f'<a href="/faqs/">FAQs</a><a href="/group-bookings/">Groups</a><a href="/contact/">Contact</a>' + ('<a href="/blog/">Blog</a>' if pm else '') + '<a href="/work-with-us/">Work with us</a>' + f'<a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="{other}">{"Boombastic Events" if pm else "THE 2PM CLUB"}</a>' + ('<button type="button" id="cookie-settings">Cookie settings</button>' if RELEASE_MODE else '')
    note = ('' if RELEASE_MODE else '<p>Website preview (Twin V2). Event details from the public feed of 23rd September 2026. Tickets and availability are live on each event page.</p>')
    return f'''<footer class="ftr"><div class="container ftr-in"><div class="ftr-brand"><a href="/"><img src="/assets/{'pm' if pm else 'boom'}-logo.png" alt="{'THE 2PM CLUB' if pm else 'Boombastic Events'} home" loading="lazy" width="{'120' if pm else '190'}" height="{'80' if pm else '55'}"></a>{by}</div><nav class="ftr-main" aria-label="Footer"><a href="/whats-on/">What’s on</a><a href="/locations/">Locations</a><a href="/about/">About</a></nav><div class="ftr-social">{socials}</div><p class="ftr-tag">{'Good people. Great afternoons.' if pm else 'Events bring people together.'}</p></div><div class="container ftr-sub"><nav aria-label="More links">{more}</nav>{note}</div></footer>'''


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
    return f'''<!doctype html><html lang="en-GB" class="{'pm' if pm else 'boom'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">{robots}<meta name="description" content="{esc(description or title)}"><meta property="og:type" content="website"><meta property="og:title" content="{esc(title)} | {site}"><meta property="og:description" content="{esc(description or title)}"><meta property="og:image" content="{esc(social)}"><meta name="theme-color" content="#080808"><title>{esc(title)} | {site}{suffix}</title><link rel="icon" href="/favicon.ico" sizes="any"><link rel="icon" type="image/png" href="/favicon-48.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="manifest" href="/site.webmanifest"><link rel="preload" href="/assets/display.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/assets/site.css"></head><body class="{body_class}"><a class="skip-link" href="#main">Skip to content</a>{nav(brand, active, '#tickets' if body_class == 'is-event' else '/whats-on/')}<main id="main">{decades(body)}</main>{footer(brand)}{sticky(brand, sticky_label, sticky_href)}<script src="/assets/site.js" defer></script>{consent}</body></html>'''


def hero(brand, h1, sub, cta, photo_name, eyebrow='', extra='', cls='', loading='eager', h1cls='', cap=None, slogan=''):
    eb = f'<p class="kicker">{esc(eyebrow)}</p>' if eyebrow else ''
    if slogan:
        # The display slogan stays as the big visual line; the H1 carries the searchable words (board #rewrites).
        heading = f'<p class="hero-slogan {h1cls}">{slogan}</p><h1 class="h1-seo">{h1}</h1>'
    else:
        heading = f'<h1 class="{h1cls}">{h1}</h1>'
    return f'''<section class="hero {cls}"><div class="hero-copy"><div class="hero-inner">{eb}{heading}<p class="hero-sub">{sub}</p>{extra}{cta}</div></div>{photo(photo_name, 'hero-media', loading, caption=bool(cap), cap=cap)}</section>'''


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


def event_filter_type(e):
    kind = 'Daytime disco' if e['brand'] == 'boom-crosslink' else FORMAT[e['fmt']][2]
    tags = [slug(kind)]
    if e['code'] == '281026-FSD-NPTON':
        tags.append('halloween')
    return ' '.join(tags)


def family_event_name(e):
    title = e['title'].lower()
    for season in ('Halloween', 'Christmas'):
        if season.lower() in title:
            return f'{season} Family Silent Disco'
    return 'Family Silent Disco'


def card_status(e):
    label = (e.get('status') or '').strip()
    if not label or e.get('soldout') or re.search(r'\d', label):
        return ''
    if e['city'] == 'Coventry' and re.search(r'(?i)fast|left|last|final|few', label):
        return ''
    return f'<p class="card-status">{esc(label)}</p>'


def event_card(e):
    href = e['path']; b, bc = badge(e)
    name = 'THE 2PM CLUB Disco Fever' if e['fmt'] == 'pmdf' else 'THE 2PM CLUB' if e['brand'] == 'pm' else event_name(e) if e['brand'] == 'boom-crosslink' else FORMAT[e['fmt']][3]
    if e['fmt'] == 'fsd':
        name = family_event_name(e)
    if e['brand'] != 'pm':
        b = 'Daytime' if e['brand'] == 'boom-crosslink' else 'Family' if e['fmt'] == 'fsd' else 'Evening'
    price = f'<p class="card-price">{esc(price_label(e["price"]))} + booking fee</p>' if e.get('price') and not e.get('soldout') else ''
    sold = f'<p class="card-status card-soldout">{SOLD_OUT_LINE}</p>' if e.get('soldout') else ''
    cta = 'Join the waiting list' if e.get('soldout') else 'View event'
    return f'''<article class="event-card" data-item data-city="{slug(e['city'])}" data-type="{event_filter_type(e)}" data-date="{e['start'][:10]}"><a class="poster" href="{esc(href)}" tabindex="-1" aria-hidden="true"><img src="{esc(e['poster'])}"{srcset_attrs(e['poster'], 600, '(max-width: 600px) 90vw, 360px')} alt="" loading="lazy" decoding="async" width="600" height="600"></a><div class="card-body"><span class="badge b-{bc}">{esc(b)}</span><h3><a href="{esc(href)}"><span class="card-event-type">{esc(name)}</span><span class="card-event-city">{esc(e['city'])}</span></a></h3><p class="card-facts">{esc(d_short(e['start']))} · {esc(e['venue'])}<br>{esc(times(e))}</p>{sold}{card_status(e)}{price}{group_price(e)}<a class="btn btn-dark btn-block" href="{esc(href)}" aria-label="{cta}: {esc(e['title'])}, {esc(d_long(e['start']))}">{cta} {ARROW}</a></div></article>'''


def event_row(e):
    href = e['path']; b, bc = badge(e)
    return f'''<article class="ev-row" data-item data-city="{slug(e['city'])}" data-type="{event_filter_type(e)}" data-date="{e['start'][:10]}"><a class="row-poster" href="{esc(href)}" tabindex="-1" aria-hidden="true"><img src="{esc(e['poster'])}"{srcset_attrs(e['poster'], 600, '160px')} alt="" loading="lazy" width="300" height="300"></a><div class="row-body"><span class="badge b-{bc}">{esc(b)}</span><h3><a href="{esc(href)}">{esc(d_mid(e['start']))}</a></h3><p class="row-facts"><span>{icon('pin')}{esc(e['venue'])}</span><span>{icon('clock')}{esc(times(e))}</span></p>{row_state(e)}</div><a class="btn btn-dark row-btn" href="{esc(href)}" aria-label="{'Join the waiting list' if e.get('soldout') else 'View event'}: {esc(e['title'])}, {esc(d_long(e['start']))}">{'Join the waiting list' if e.get('soldout') else 'View event'} {ARROW}</a></article>'''


SOLD_OUT_LINE = 'Sold out, join the waiting list'


def row_state(e):
    if e.get('soldout'):
        return f'<p class="card-status card-soldout">{SOLD_OUT_LINE}</p>'
    return f'<p class="card-price">{esc(price_label(e["price"]))} + booking fee</p>' if e.get('price') else ''


def date_row(e):
    sold = f'<em class="card-status card-soldout">{SOLD_OUT_LINE}</em>' if e.get('soldout') else ''
    label = 'Join the waiting list' if e.get('soldout') else 'View event'
    return f'''<a class="date-row" data-date="{e['start'][:10]}" href="{esc(e['path'])}"><span class="date-ico">{icon('calendar')}</span><span class="date-txt"><small>{esc(d_short(e['start']))} · {esc(e['venue'])}</small><strong>{esc(e['city'])}</strong>{sold}</span><span class="btn btn-dark btn-sm">{label} {ARROW}</span></a>'''


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
        h = hero(brand, 'YOUR BEST <br class="m-br">NIGHT OUT.<br>IN THE MIDDLE OF<br>THE AFTERNOON.', 'Sing Out Loud Anthems from the 80s, 90s and 00s. Home by 7-ish.', btn(f'See all <span data-live-total>{len(events)}</span> dates', '/events/', 'btn-hot') + f'<a class="hero-link" href="/what-to-expect/">First time? See what happens {ARROW}</a>' + home_city_finder(brand, events), 'pm-hero.webp', eyebrow='THE 2PM CLUB Daytime Disco', extra='<p class="hero-proof">Wham! to Whitney. Bon Jovi to Beyoncé. Doors at 2pm.</p>', h1cls='h1-long')
        rib = ribbon([('BIG CHORUSES', 'Sing Out Loud Anthems'), ('THIS SEASON', '80s Editions and Christmas specials'), ('SATURDAY NIGHT', 'Strictly on the sofa later') if STRICTLY_SEASON_2026 else ('AFTERNOON PLANS', 'Doors 2pm, home by 7-ish')])
        head = section_head('YOUR NEXT AFTERNOON', filters(events, 0, 'All editions'))
        music = pm_music_section(events)
        guide = f'''<section class="guide container" aria-labelledby="guide-h"><a class="guide-card" href="/blog/what-is-a-daytime-disco/">{photo('pm-arms.jpg', 'guide-media', caption=False)}<div class="guide-copy"><p class="eyebrow">The 2PM CLUB guide · New here?</p><h2 id="guide-h">WHAT IS A DAYTIME DISCO?</h2><p>The music, the timing, who goes and how to book, in one short read. Send it to whoever in the group chat is still asking.</p><span class="btn btn-hot">Read the guide {ARROW}</span></div></a></section>'''
        proof = f'''<section class="proof container"><div class="proof-lead">{quote_block(QUOTES['lorne'], 'quote-xl')}<p>Bring your group or come on your own. The songs give everyone something to sing about.</p></div><div class="proof-more">{quote_block(QUOTES['diane'])}{quote_block(QUOTES['lara'])}{quote_block(QUOTES['friends'])}</div></section>'''
        body = h + rib + f'<section class="section container" id="upcoming">{head}{results(events)}</section>' + band(brand, 'pm-friends.jpeg', 'ALL THE CHORUSES.<br>ALL YOUR PEOPLE.', [('What to expect', '/what-to-expect/'), ('The music', '#music'), ('Bring your group', '/group-bookings/')]) + music + guide + proof + signup(brand, 'YOUR CITY. YOUR NEXT AFTERNOON.', 'Be first to hear when THE 2PM CLUB announces a date near you.', events=events)
        return page(brand, 'Your best night out. In the middle of the afternoon.', body, 'THE 2PM CLUB Daytime Disco: Sing Out Loud Anthems from the 80s, 90s and 00s. Doors 2pm, home by 7-ish.', '/')
    h = hero(brand, esc(HOME_H1), 'THE 2PM CLUB in the afternoon. Silent Disco Greatest Hits and Decades Parties in the evening. Family Silent Disco too.', btn(f'See all <span data-live-total>{len(events)}</span> dates', '/whats-on/') + home_city_finder(brand, events), 'boom-hero.jpg', extra='<p class="hero-proof">SINCE 2014.</p>', h1cls='h1-boom', slogan='THE MIDLANDS’<br>PARTY STARTERS<br>SINCE 2014.')
    rib = ribbon([('DAYTIME', 'THE 2PM CLUB, doors at 2pm', PM_BASE + '/'), ('EVENING', 'Silent Disco and Decades Parties', '/about/#parties'), ('FAMILY', 'Family Silent Disco, ages 4+', '/family-silent-disco/')], cls='rib-short')
    head = section_head('WHAT’S COMING UP', filters(events, 0))
    parties = seasonal_section(events) + boom_parties_grid()
    rel = f'''<section class="relation container"><div class="relation-copy"><p class="eyebrow">The people behind the party</p><h2>FAMILY, DAYTIME OR EVENING.</h2><p>Family Silent Disco for kids and grown-ups. THE 2PM CLUB in the afternoon. Silent Disco Greatest Hits and Decades Parties in the evening. Same Boombastic team, bringing people together since 2014.</p>{btn('Explore THE 2PM CLUB', PM_BASE + '/')}</div><div class="relation-quotes">{quote_block(QUOTES['emma_r'])}</div></section>'''
    body = h + rib + f'<section class="section container" id="upcoming">{head}{results(events)}</section>' + band(brand, 'sd-four-friends.jpg', 'PICK YOUR PARTY.<br>BRING YOUR PEOPLE.', [('Daytime discos', PM_BASE + '/'), ('Silent discos', '/silent-disco/'), ('Decades Parties', '/about/#parties'), ('Family parties', '/family-silent-disco/')]) + parties + rel + signup(brand, 'YOUR CITY. YOUR NEXT NIGHT OUT.', 'Be first to hear about new parties near you.', events=events)
    PAGE_META[(brand, '/')] = dict(title='Silent Disco, 80s and 90s Parties | Boombastic Events', description=HOME_DESCRIPTION)
    return page(brand, 'Silent Disco, 80s and 90s Parties', body, HOME_DESCRIPTION, '/')


def seasonal_section(events):
    """Homepage links to the seasonal hubs that have dates in the feed."""
    cards = []
    hall = halloween_events(events)
    if hall:
        cards.append(('Halloween ' + hall[0]['start'][:4], f'Halloween in {join_words(list(dict.fromkeys(e["city"] for e in hall)))}', '; '.join(f'{d_short(e["start"])}: {event_name(e)}' for e in hall) + '.', '/halloween/', 'See Halloween parties'))
    xmas = christmas_events(events)
    if xmas:
        cards.append(('Christmas ' + xmas[0]['start'][:4], f'{len(xmas)} Christmas dates', f'From {d_short(xmas[0]["start"])} in {join_words(list(dict.fromkeys(e["city"] for e in sorted(xmas, key=lambda e: (e["city"] != "Northampton", e["start"])))))}.', '/christmas-parties/', 'See Christmas parties'))
    if not cards:
        return ''
    inner = ''.join(f'<div class="xmas-kind"><p class="eyebrow">{esc(a)}</p><h3>{esc(b)}</h3><p>{esc(c)}</p><a class="text-link" href="{u}">{esc(l)} {ARROW}</a></div>' for a, b, c, u, l in cards)
    return f'<section class="section container seasonal">{section_head("HALLOWEEN AND CHRISTMAS", "", "Seasonal parties")}<div class="xmas-kinds">{inner}</div></section>'


# Board #rewrites, 12th October 2026 (homepage). Exact wording.
HOME_H1 = 'Silent discos and decades parties in Northampton, Bedford, Leicester and Coventry'
HOME_DESCRIPTION = 'Silent discos, 90s and 80s nights and Family Silent Disco in Northampton, Bedford, Leicester and Coventry since 2014. Afternoons: THE 2PM CLUB.'


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
    ('SILENT DISCO GREATEST HITS', 'sd-energy.jpg', 'Three DJs, three channels, one dancefloor. Pop, indie or dance, switch whenever you like.', 'Evening', '/silent-disco/'),
    ('BOOMBASTIC 90s', 'b90-stage.jpg', 'Pop, Britpop, dance and hip-hop with 90s videos on giant screens.', 'Evening', '/boombastic-90s/'),
    ('FAMILY SILENT DISCO', 'family-silent-disco-live.jpg', 'Three family-friendly channels for kids 4+ and the grown-ups who bring them.', 'Family', '/family-silent-disco/'),
    ('FOOTLOOSE 80s', 'fl-room.jpg', 'Wall-to-wall 80s, Madonna and Queen to Bon Jovi and Whitney.', 'Evening', '/footloose-80s/'),
]


def party_status(u):
    """'No date on sale' line for a Boombastic format page with nothing on sale in the dated snapshot."""
    tok = next((t for k, _, t in FORMAT_PAGES if u == f'/{k}/'), None)
    if not tok or format_dates(tok):
        return ''
    so = format_sold_out(tok)
    if so:
        return f'<span class="party-nodate">{esc(d_short(so[0]["start"]))} {esc(so[0]["city"])} is sold out: join the waiting list.</span>'
    return '<span class="party-nodate">No date on sale at present.</span>'


def boom_parties_grid(cls=''):
    cards = ''.join(f'<a class="party-card" href="{u}">{photo(img, "party-media", caption=not img.startswith("poster-"))}<span class="party-when">{when}</span><h3>{name}</h3><p>{txt}{party_status(u)}</p><b>Explore {ARROW}</b></a>' for name, img, txt, when, u in PARTIES)
    return f'<section class="parties container {cls}" id="parties">{section_head("FIND YOUR KIND OF PARTY", "", "Our parties")}<div class="party-grid">{cards}</div></section>'


def listing(brand, events):
    pm = brand == 'pm'
    xmas_link = '' if pm or not christmas_events(events) else f' <a class="text-link" href="/christmas-parties/">Christmas parties {ARROW}</a>'
    if not pm and halloween_events(events):
        xmas_link = f' <a class="text-link" href="/halloween/">Halloween parties {ARROW}</a>' + xmas_link
    body = f'''<section class="page-band"><div class="container"><p class="eyebrow">What’s on</p><h1>{'YOUR NEXT AFTERNOON.' if pm else 'FIND YOUR NEXT PARTY.'}</h1><p>{'Every upcoming THE 2PM CLUB Daytime Disco. Pick a city, a date or an edition.' if pm else 'Your next daytime disco, silent disco, Decades Party or family party. Pick what sounds like you.'}{xmas_link}</p></div></section><section class="section container" id="upcoming">{section_head(f'<span data-live-total>{len(events)}</span> DATES ON SALE', filters(events, 0, 'All editions' if pm else 'All parties'))}{results(events)}</section>'''
    description = ('Find upcoming THE 2PM CLUB daytime discos and day parties by city and date. See venues, event details and live tickets.' if pm
                   else 'Find upcoming Boombastic daytime discos, silent discos, Decades Parties and family events by city and date.')
    return page(brand, 'What’s on', body, description, '/whats-on/')


def christmas_events(events):
    return [e for e in events if 'christmas' in e['title'].lower() and on_sale(e)]


def join_words(items):
    items = list(items)
    return items[0] if len(items) == 1 else ', '.join(items[:-1]) + ' and ' + items[-1]


def christmas_page(brand, events):
    """Seasonal landing page built only from the live feed and facts already published on event pages."""
    xmas = christmas_events(events)
    cities = list(dict.fromkeys(e['city'] for e in sorted(xmas, key=lambda e: (e['city'] != 'Northampton', e['start']))))
    kinds = {e['fmt'] if e['brand'] != 'boom-crosslink' else 'pmxmas' for e in xmas}
    first, last = xmas[0], xmas[-1]
    parts = []
    if 'pmxmas' in kinds: parts.append('THE 2PM CLUB Christmas Daytime Disco in the afternoon')
    evening = [n for k, n in (('sdxmas', 'the Christmas Silent Disco'), ('dec', 'the Christmas Decades Party')) if k in kinds]
    if evening: parts.append(join_words(evening) + ' in the evening')
    if 'fsd' in kinds: parts.append('a Christmas Family Silent Disco for ages 4 and up')
    year = first['start'][:4]
    # Answer-first paragraph: every date with venue, times and from-price, so this page is the quotable source.
    def xline(e):
        return f'{d_day(e["start"])}: {xmas_name(e)}, {e["venue"]}, {e["city"]}, {times(e).replace(" – ", " to ")}, {price_sentence(e)}.'
    def xmas_name(e):
        if e['brand'] == 'boom-crosslink' or e['fmt'] == 'pmxmas': return 'THE 2PM CLUB Christmas Daytime Disco'
        return {'sdxmas': 'Christmas Silent Disco', 'dec': 'Christmas Decades Party'}.get(e['fmt']) or family_event_name(e)
    lead = f'Boombastic Events has {len(xmas)} Christmas party dates in {year}, in {join_words(cities)}. ' + ' '.join(xline(e) for e in xmas)
    guide = []
    if 'pmxmas' in kinds:
        guide.append(('Afternoon', 'THE 2PM CLUB Christmas Daytime Disco', 'Festive classics first, then the biggest 80s, 90s and 00s anthems. Doors at 2pm, with the evening still yours.'))
    if 'sdxmas' in kinds:
        guide.append(('Evening', 'Christmas Silent Disco', 'Three DJs on three headphone channels: Christmas and party, indie classics and dance anthems. A £10 fully refundable headphone deposit is taken on the night.'))
    if 'dec' in kinds:
        guide.append(('Evening', 'Christmas Decades Party', '80s, 90s and 00s anthems with the Christmas classics from Mariah, Wham!, Slade and co.'))
    if 'fsd' in kinds:
        guide.append(('Family', 'Christmas Family Silent Disco', 'Three family-friendly channels, designed for ages 4 and up. Children must be accompanied by a paying adult, maximum three children per adult.'))
    guide_html = ''.join(f'<div class="xmas-kind"><p class="eyebrow">{esc(when)}</p><h3>{esc(name)}</h3><p>{esc(text)}</p></div>' for when, name, text in guide)
    when_list = '; '.join(f"{d_short(e['start'])}, {xmas_name(e)}, {e['city']} ({times(e)})" for e in xmas)
    faqs = [
        ('When are the Christmas parties?', esc(when_list) + '.'),
        ('Can we book for a work Christmas party or a big group?', f'Many dates have a group-of-four ticket, shown on each event page. For a larger group or a work party, email <a href="mailto:{EMAIL}">{EMAIL}</a> with the date and rough numbers.'),
        ('How do I get tickets?', 'Choose a date and use the live ticket selector on its event page. Prices and availability are live, and Eventbrite booking fees are added at checkout.'),
    ]
    if 'sdxmas' in kinds:
        faqs.append(('Is there a headphone deposit at the Christmas Silent Disco?', 'Yes. A £10 fully refundable headphone deposit is taken on the night.'))
    faq_html = ''.join(acc(q, a) for q, a in faqs)
    grouped = [e for e in xmas if (e.get('groupTicket') or {}).get('label') and not e.get('soldout')]
    group_items = ''.join(f'<li>{esc(d_short(e["start"]))}, {esc(xmas_name(e))}, {esc(e["city"])}: {esc(price_label(e["groupTicket"]["label"]))}</li>' for e in grouped)
    work = (f'<section class="section container" id="work-christmas"><h2>WORK CHRISTMAS PARTIES AND GROUPS</h2>'
            f'<p>Bringing the office, the team or a group of friends? Book a Christmas date together and everyone is on the same dancefloor.</p>'
            + (f'<p>{len(grouped)} of the {len(xmas)} Christmas dates have a group-of-4 ticket, plus booking fees, while available:</p><ul class="fact-list">{group_items}</ul>' if grouped else '')
            + f'<p>For a larger group, or to ask about a reserved area, email <a href="mailto:{EMAIL}">{EMAIL}</a> with the date and numbers and we will tell you what the venue can do. <a href="/group-bookings/">Group bookings {ARROW}</a></p></section>')
    body = (f'<section class="page-band"><div class="container"><p class="eyebrow">Christmas {year}</p>'
            f'<h1 class="h1-band">Christmas parties {year} in {esc(join_words(cities))}</h1><p class="answer">{esc(lead)}</p></div></section>'
            f'<section class="section container" id="upcoming">{section_head(f"<span data-live-total>{len(xmas)}</span> CHRISTMAS DATES", filters(xmas, 0))}{results(xmas)}</section>'
            f'<section class="section container"><h2>WHICH CHRISTMAS PARTY?</h2><div class="xmas-kinds">{guide_html}</div></section>'
            + work +
            f'<section class="section container faq-list"><h2>CHRISTMAS QUESTIONS</h2>{faq_html}</section>'
            + signup(brand))
    order = [('sdxmas', 'silent disco'), ('dec', 'decades party'), ('fsd', 'family silent disco'), ('pmxmas', 'THE 2PM CLUB')]
    kind_words = join_words([w for k, w in order if k in kinds])
    description = (f'{len(xmas)} Christmas party dates from {ordinal(dt(first["start"]).day)} {dt(first["start"]).strftime("%B")}: {kind_words}.'
                   + (f' Group-of-4 tickets on {len(grouped)} of the {len(xmas)}.' if grouped else ''))
    PAGE_META[(brand, '/christmas-parties/')] = dict(title=f'Christmas Parties {year}: ' + ', '.join(cities), description=description)
    EXTRA_SCHEMA[(brand, '/christmas-parties/')] = [series_schema('/christmas-parties/', f'Christmas parties {year} by Boombastic Events', f'Christmas parties in {join_words(cities)} by Boombastic Events and THE 2PM CLUB.', xmas)]
    return page(brand, 'Christmas Parties', body, description, '/christmas-parties/')


def halloween_events(events):
    """Upcoming Halloween dates (sold-out ones included, with their waiting-list state)."""
    return [e for e in events if 'halloween' in e['title'].lower() and e['start'][:10] >= TODAY]


def event_name(e):
    """Plain event name for copy: format name, seasonal family name or THE 2PM CLUB edition."""
    if e['brand'] == 'boom-crosslink' or e['brand'] == 'pm':
        return 'THE 2PM CLUB Christmas Daytime Disco' if e['fmt'] == 'pmxmas' else 'THE 2PM CLUB 80s Edition' if e['fmt'] == 'pm80' else 'THE 2PM CLUB'
    if e['fmt'] == 'fsd':
        return family_event_name(e)
    return FORMAT[e['fmt']][3]


def is_adult(e):
    """Age rule from the feed or the verified event copy. Unknown returns None, never a guess."""
    if e['brand'] in ('pm', 'boom-crosslink') or e['fmt'] == 'hhp':
        return True
    if e['fmt'] == 'fsd':
        return False
    return None


def is_evening(e):
    return dt(e['start']).hour >= 17


def price_sentence(e):
    if e.get('soldout'):
        return 'sold out, with a waiting list'
    return f'from {from_price(e)} plus booking fee' if e.get('price') else ''


def from_price(e):
    """'£12.50' from a feed label such as 'From £12.50'."""
    return re.sub(r'(?i)^from\s+', '', price_label(e.get('price') or ''))


def venue_cards_html(rel):
    cards = []
    for v in sorted({e['venue'] for e in rel}):
        item = next(e for e in rel if e['venue'] == v)
        addr = street(item)
        maps = 'https://www.google.com/maps/search/?api=1&query=' + quote(', '.join([v] + addr))
        cards.append(f'<div class="venue-card"><h3>{esc(v)}</h3><p>{icon("pin")}<span>{"<br>".join(esc(x) for x in addr) or "Address on your ticket"}</span></p><a href="{esc(maps)}" target="_blank" rel="noopener noreferrer">{icon("nav")}Directions {ARROW}</a></div>')
    return ''.join(cards)


def what_happens(e):
    """Facts about the night taken from this event's own page copy: lede, bullets and notice."""
    c = event_copy(e)
    items = [txt for _, txt in c['bullets']]
    return c['lede'], items


def series_schema(route, name, description, subs):
    """EventSeries tying Boombastic-owned dates to one series @id. 2PM dates are left to the2pmclub.co.uk."""
    item = {'@context': 'https://schema.org', '@type': 'EventSeries', '@id': BOOM_BASE + route + '#series', 'name': name,
            'description': description, 'url': BOOM_BASE + route, 'organizer': {'@id': 'https://www.boomevents.co.uk/#organization'}}
    owned = [{'@id': BOOM_BASE + e['path'] + '#event'} for e in subs if e['brand'] == 'boom']
    if owned:
        item['subEvent'] = owned
    return item


def halloween_page(brand, events):
    """Seasonal landing page: only the dated Halloween events in the feed and facts already on their event pages."""
    hall = halloween_events(events)
    cities = list(dict.fromkeys(e['city'] for e in hall))
    year = hall[0]['start'][:4]
    place = join_words(cities)
    has_family = any(e['fmt'] == 'fsd' for e in hall)
    h1 = (f'Halloween in {place}: two parties, one for the kids' if len(hall) == 2 and len(cities) == 1 and has_family
          else f'Halloween parties in {place}')
    def line(e):
        age = ' 18+' if is_adult(e) and e['brand'] == 'boom' else ''
        return f'The{age} {event_name(e)} is on {d_day(e["start"])}, {times(e).replace(" – ", " to ")}, at {e["venue"]}, {price_sentence(e)}.'
    count_word = {1: 'one', 2: 'two', 3: 'three', 4: 'four'}.get(len(hall), str(len(hall)))
    answer = f'Boombastic Events has {count_word} Halloween part{"y" if len(hall) == 1 else "ies"} in {place} in {year}. ' + ' '.join(line(e) for e in hall)
    desc = ', and '.join(f'{"the 18+ " if is_adult(e) else ""}{event_name(e)} on {d_day(e["start"])} at {SHORT_VENUE.get(e["venue"], e["venue"])}' for e in hall)
    desc = desc[0].upper() + desc[1:] + '.'
    kinds = ''.join(
        f'<div class="xmas-kind"><p class="eyebrow">{esc(d_short(e["start"]))} · {esc(e["venue"])}</p><h3>{esc(event_name(e))}</h3><p>{esc(what_happens(e)[0])}</p>'
        f'<ul class="fact-list">{"".join(f"<li>{esc(x)}</li>" for x in what_happens(e)[1])}</ul><a class="text-link" href="{esc(e["path"])}">Times and tickets {ARROW}</a></div>' for e in hall)
    groups = [f'{event_name(e)}: {price_label(e["groupTicket"]["label"])}' for e in hall if (e.get('groupTicket') or {}).get('label') and not e.get('soldout')]
    group_html = (f'<p>{esc("; ".join(groups))}, plus booking fees, while available.</p>' if groups else '') + f'<p>For a larger group, email <a href="mailto:{EMAIL}">{EMAIL}</a> with the date and numbers. <a href="/group-bookings/">Group bookings {ARROW}</a></p>'
    faqs = [(f'Are there Halloween parties in {place} in {year}?', esc(f'Yes, {count_word}. ' + ' '.join(line(e) for e in hall)))]
    if any(e['fmt'] == 'hhp' for e in hall):
        faqs.append(('Is the Halloween House Party 18+?', 'Yes. Entry is 18+. Valid photo ID may be required.'))
    if any(e['code'] == '281026-FSD-NPTON' for e in hall):
        faqs.append(('What age is the Halloween Family Silent Disco for?', 'Designed for ages 4 and up. Under-4s are welcome, ideally as babes in arms, and babes in arms go free. Children must be supervised by their accompanying adult at all times; this is not a drop-off event.'))
        faqs.append(('Do we need to dress up?', 'Halloween fancy dress is welcome but optional at the Family Silent Disco. Wear comfortable shoes for dancing.'))
    faqs.append(('How do I get tickets?', 'Choose a date and use the live ticket selector on its event page. Prices and availability are live, and Eventbrite booking fees are added at checkout.'))
    proof = (photo('family-silent-disco-live.jpg', 'season-photo') if has_family else '') + photo('b90-crowd.jpg', 'season-photo')
    body = (f'<section class="page-band"><div class="container"><p class="eyebrow">Halloween {year}</p><h1 class="h1-band">{esc(h1)}</h1><p class="answer">{esc(answer)}</p></div></section>'
            f'<section class="section container" id="upcoming">{section_head(f"<span data-live-total>{len(hall)}</span> HALLOWEEN DATES", "")}{results(hall)}</section>'
            f'<section class="section container"><h2>WHAT HAPPENS ON THE NIGHT</h2><div class="xmas-kinds">{kinds}</div></section>'
            f'<section class="kb container"><div class="kb-intro"><h2>THE VENUES</h2><p>Check the venue on your chosen event before travelling.</p></div><div class="kb-venues">{venue_cards_html(hall)}</div></section>'
            f'<section class="section container"><h2>FROM OUR PARTIES</h2><div class="season-photos">{proof}</div></section>'
            f'<section class="section container"><h2>COMING AS A GROUP</h2>{group_html}</section>'
            f'<section class="section container faq-list"><h2>HALLOWEEN QUESTIONS</h2>{"".join(acc(q, a) for q, a in faqs)}</section>'
            + signup(brand))
    PAGE_META[(brand, '/halloween/')] = dict(title=f'Halloween Parties {place} {year} | Boombastic Events', description=desc)
    EXTRA_SCHEMA[(brand, '/halloween/')] = [series_schema('/halloween/', f'Halloween parties {year} by Boombastic Events', f'Halloween parties in {place} by Boombastic Events.', hall)]
    return page(brand, 'Halloween Parties', body, desc, '/whats-on/')


FORMAT_SERIES = {'sd': '/silent-disco/', 'sdxmas': '/silent-disco/', 'fsd': '/family-silent-disco/', 'b90': '/boombastic-90s/'}


def event_series_routes(e):
    """Series an event belongs to: its format page, plus the seasonal hub when that page is built."""
    routes = []
    if e['fmt'] in FORMAT_SERIES: routes.append(FORMAT_SERIES[e['fmt']])
    if 'halloween' in e['title'].lower() and halloween_events(CURRENT_EVENTS['boom']): routes.append('/halloween/')
    if 'christmas' in e['title'].lower() and christmas_events(CURRENT_EVENTS['boom']): routes.append('/christmas-parties/')
    return routes


def link_list(links, label):
    if not links:
        return ''
    inner = ''.join(f'<a class="text-link" href="{esc(u)}">{esc(x)} {ARROW}</a>' for x, u in links)
    return f'<nav class="more-links container" aria-label="{esc(label)}">{inner}</nav>'


def event_more_links(e):
    """Links from an event page to the durable pages it belongs to."""
    links = [(f'More in {e["city"]}', city_url('boom', e['city']))]
    if e['fmt'] in FORMAT_LINK:
        key, name, label = FORMAT_LINK[e['fmt']]
        links.append((label, f'/{key}/'))
        if (key, e['city']) in TOWN_FORMAT_LIVE:
            links.append((f'{name} in {e["city"]}', f'/{key}/{slug(e["city"])}/'))
    if 'halloween' in e['title'].lower():
        links.append((f'Halloween in {e["city"]}', '/halloween/'))
    if 'christmas' in e['title'].lower() and christmas_events(CURRENT_EVENTS['boom']):
        links.append((f'Christmas parties {e["start"][:4]}', '/christmas-parties/'))
    return links


def details(brand, e):
    c = event_copy(e)
    saints_fsd = e['code'] == '281026-FSD-NPTON'
    pre, eyebrow = FORMAT[e['fmt']][3], FORMAT[e['fmt']][4]
    if e['fmt'] == 'fsd':
        pre = family_event_name(e)
    date, tm = d_mid(e['start']), times(e)
    addr = street(e)
    note = notice(e)
    base = PM_BASE if brand == 'pm' else BOOM_BASE
    share = 'https://wa.me/?text=' + quote(f"{clean_title(e)}, {e['city']}, {d_long(e['start'])}, {tm}: {base + e['path']}")
    b, bc = badge(e)
    is_disco_fever = e['fmt'] == 'pmdf'
    hero_cta = 'Book Disco Fever' if is_disco_fever else 'Find your tickets'
    alert = f'<a class="hero-alert" href="#good-to-know">{icon("info")}<span>{esc(note[0])}: read before you book</span></a>' if note and not saints_fsd else ''
    adult_event = brand == 'pm' or is_adult(e) is True
    # Evening dates whose age rule is not in the feed or verified copy say where the rule is shown, never a guess.
    age_li = (f"<li>{icon('info')}<span>18+ event</span></li>" if adult_event
              else f"<li>{icon('info')}<span>Entry rules for this date are shown in the ticket selector</span></li>" if is_evening(e) else '')
    facts_list = f'<ul class="hero-facts"><li>{icon("calendar")}<span>{esc(date)}</span></li><li>{icon("clock")}<span>{esc(tm)}</span></li><li>{icon("pin")}<span>{esc(e["venue"])}, {esc(e["city"])}</span></li>{age_li}</ul>'
    soldout = e.get('soldout', False)
    ticket_label = 'Join waiting list' if soldout else 'Choose tickets'
    book_cls = 'btn-hot' if brand == 'pm' else 'btn-coral'
    if brand == 'pm' and e['fmt'] != 'pmdf':
        reel = PM_REEL_BASE + ('/2pm-christmas-2026.mp4' if e['fmt'] == 'pmxmas' else '/hero-1x1-' + PM_REEL_CITIES[e['city']] + '.mp4' if e['city'] in PM_REEL_CITIES else '/hero-1x1.mp4')
        media = f'''<figure class="ev-poster ev-poster-reel"><img src="{esc(e['poster'])}" alt="Official promotional artwork for {esc(e['title'])}, {esc(date)}" width="800" height="800" fetchpriority="high"><video data-event-reel data-primary="{esc(reel)}" data-fallback="{esc(PM_REEL_MASTER)}" muted loop playsinline preload="none" controls aria-label="Footage from a previous THE 2PM CLUB event"></video><figcaption>Footage from a previous THE 2PM CLUB event</figcaption></figure>'''
    else:
        media = f'''<figure class="ev-poster"><img src="{esc(e['poster'])}" alt="Official promotional artwork for {esc(e['title'])}, {esc(date)}" width="800" height="800" fetchpriority="high"></figure>'''
    hero_html = f'''<section class="ev-hero" data-event-end="{esc(e['end'][:19])}"><div class="ev-copy"><div class="hero-inner">{f'<p class="kicker">{esc(eyebrow)}</p>' if eyebrow else ''}<h1><span class="pre">{esc(pre)}</span> <span class="city">{esc(e['city'])}</span></h1><p class="hero-sub">{esc(c['sub'])}</p>{facts_list}{alert}{'<p class=dc-status><strong>SOLD OUT</strong></p>' if soldout else ''}{btn('Join waiting list' if soldout else hero_cta, '#tickets', 'btn-dark' if brand == 'boom' else 'btn-hot')}</div></div>{media}</section>'''
    fact_rib = f'<div class="ribbon fact-rib"><div class="container ribbon-in"><div class="rib-item"><span class="rib-ico i1">{icon("calendar")}</span><b>{esc(date.upper())}</b></div><div class="rib-item"><span class="rib-ico i2">{icon("clock")}</span><b>{esc(tm.upper())}</b></div><div class="rib-item"><span class="rib-ico i3">{icon("pin")}</span><b>{esc(e["venue"].upper())}</b></div></div></div>'
    note_html = f'<section class="container"><div class="notice" id="good-to-know" role="note">{icon("info")}<div><h2>{esc(note[0])}</h2><p>{esc(note[1])} Access questions: <a href="mailto:{EMAIL}">{EMAIL}</a>.</p></div></div></section>' if note and not saints_fsd else ''
    bullets = ''.join(f'<li><span class="bubble bb{i + 1}">{icon(ic)}</span><span>{esc(txt)}</span></li>' for i, (ic, txt) in enumerate(c['bullets']))
    groups = artist_groups(e)
    if saints_fsd:
        channels = [
            ('blue', 'PARTY', 'Family favourites, sing-along party tunes and Halloween tracks.'),
            ('red', 'THROWBACKS', "Sing-out-loud hits from the 80s, 90s and 2000s. This one's for the grown-ups."),
            ('green', 'CHARTS', 'Current chart favourites and trending hits.'),
        ]
        music = '<div class="ev-music ev-channel-copy"><h3 class="mini-h">THE CHANNELS</h3>' + ''.join(
            f'<div class="channel-row channel-{colour}"><p><strong>{esc(label)}:</strong> {esc(description)}</p></div>'
            for colour, label, description in channels
        ) + '</div>'
    else:
        music = f'<div class="ev-music"><h3 class="mini-h">{"THE CHANNELS" if any(g[1] for g in groups) else "THE SOUNDTRACK"}</h3>{chips(groups)}</div>' if groups else ''
    if is_disco_fever:
        music = f'<div class="ev-music"><h3 class="mini-h">THE SOUNDTRACK</h3><p class="disco-artist-roll">{esc(e["soundtrack"])}</p></div>'
    price = f'<p class="dc-price">{esc(price_label(e["price"]))} + booking fee</p>' if e.get('price') and not soldout else ''
    status = '<p class="dc-status"><strong>Sold out</strong></p>' if soldout else (f'<p class="dc-status">{esc(e["status"])}</p>' if e.get('status') else '')
    date_card = f'''<aside class="date-card" aria-label="Booking summary"><h2>MAKE IT A DATE</h2><ul><li>{icon("calendar")}{esc(date.upper())}</li><li>{icon("clock")}{esc(tm.upper())}</li><li>{icon("pin")}{esc(e["venue"].upper())}</li></ul>{price}{group_price(e, True)}{status}{'' if soldout else '<p class=dc-live>Check live availability in the ticket selector</p>'}{btn(ticket_label, '#tickets', 'btn-block ' + book_cls)}<p class="dc-eb">Ticketing powered by <b>Eventbrite</b></p><a class="dc-share" href="{esc(share)}" target="_blank" rel="noopener noreferrer">{icon("share")}Share with your group {ARROW}</a></aside>'''
    sell = f'''<div class="sell"><p class="eyebrow">{esc(b)}</p><h2>{c['h2']}</h2><p class="lede">{esc(c['lede'])}</p><ul class="bullets">{bullets}</ul>{music}{quote_block(c['quote'])}</div>'''
    main = f'<section class="ev-main container">{sell}{date_card}</section>'
    ph = PM_CITY_PHOTO.get(e['city'], c['photo']) if e['brand'] == 'pm' else c['photo']
    strip_html = f'<div class="ev-strip">{photo(ph, "strip-media")}</div>' if ph else ''
    fallback = f'/tickets/{e["code"].lower()}/'
    tickets = f'''<section class="tickets container" id="tickets"><div class="tickets-intro"><p class="eyebrow">Tickets</p><h2>CHOOSE YOUR TICKETS.</h2><p>Secure checkout by Eventbrite. The selector shows live ticket types, fees and availability for {esc(date)}. Nothing is booked until you complete checkout.</p><p class="tickets-fallback">Selector not loading? <a href="{esc(fallback)}" rel="noopener">Open ticket checkout ↗</a></p></div><div class="ticket-widget" id="eventbrite-tickets" data-eventbrite-id="{esc(e['eventbriteId'])}" role="region" aria-label="Live ticket options for {esc(e['title'])}"><p class="widget-loading">Loading live tickets…</p></div></section>'''
    if soldout:
        tickets = f'<section class="tickets container" id="tickets"><div class="tickets-intro"><p class="eyebrow">Sold out</p><h2>SOLD OUT.</h2>{btn("Join waiting list", fallback, book_cls)}</div></section>'
    maps = 'https://www.google.com/maps/search/?api=1&query=' + quote(', '.join([e['venue']] + addr))
    addr_html = '<br>'.join(esc(x) for x in addr) if addr else 'Address on your ticket confirmation.'
    group_a = 'Group options vary by date. Open the ticket selector above to see what is on sale for this event. For a larger group, email ' + f'<a href="mailto:{EMAIL}">{EMAIL}</a> with the date and numbers.'
    wear = ('Fancy dress is welcome. Wear comfortable shoes for dancing.' if e['code'] == '281026-FSD-NPTON'
            else 'Christmas jumpers very welcome. Comfortable shoes for dancing.' if e['fmt'] == 'fsd'
            else 'No dress code. Wear what you can dance in.')
    access_a = (esc(note[1]) + ' ' if note and not saints_fsd else '') + f'For anything else about access, email <a href="mailto:{EMAIL}">{EMAIL}</a> with the date and what you need before you book or travel.'
    if saints_fsd:
        visit_questions = ''.join([
            acc('Is this a drop-off event?', 'No. Children must be accompanied and <strong>supervised by their participating, ticket-holding adult throughout</strong>. There is a maximum of three children per adult.'),
            acc('What age is it for?', 'Designed for ages 4 and up, and most suitable for that age. <strong>Under-4s are welcome, ideally as babes in arms, and babes in arms go free.</strong> Younger children may find the headphones too large.'),
            acc('Does everyone need a ticket?', 'Everyone except babes in arms. <strong>Every other adult and child attending needs a ticket.</strong> Adult and child tickets are £10 each, plus Eventbrite booking fees.'),
            acc('Who can use a group-of-four ticket?', 'The <strong>£35 group ticket</strong> covers either two adults and two children, or one adult and three children. Single tickets can be added to a group booking. Adults must attend with a child.'),
            acc('Where is it, and what happens in bad weather?', "The party is planned for the <strong>Supporter Village Barn</strong> at DPD Stadium at Franklin's Gardens. In adverse weather, it will move into the <strong>Rodber Suite</strong> at Saints."),
            acc('Where can we park?', f'We will share the event-specific parking, entrance and arrival details before the day. If you need access advice sooner, email <a href="mailto:{EMAIL}">{EMAIL}</a>.'),
            acc('Can we switch between the music channels?', 'Yes. Everyone gets headphones and can switch between Party, Throwbacks and Charts.'),
            acc('Do we need to dress up?', 'No. Halloween fancy dress is welcome but optional. Wear comfortable shoes for dancing.'),
            acc('What time does it finish?', 'The party runs from 2pm to 4pm on Wednesday 28th October.'),
            acc('What if I have an access question?', access_a),
        ])
    elif e['fmt'] == 'nye':
        visit_questions = ''.join([
            acc('When and where is Boombastic NYE?', 'Thursday 31st December 2026, 8pm to 1am on Friday 1st January 2027, at The Charles Bradlaugh, 1 Earl Street, Northampton, NN1 3AU.'),
            acc('What music will be played?', 'The biggest hits of the 80s, 90s and 2000s, including Wham!, Whitney Houston, Oasis, Spice Girls, The Killers, Robin S and N-TRANCE. These are tracks on the soundtrack, not live artist appearances.'),
            acc('Is the party on one floor?', 'Yes. Boombastic NYE is on one floor, with all three decades on the same dancefloor.'),
            acc('How much are tickets?', 'Earlybird tickets are £12.50 plus booking fees, until the end of October or until the allocation sells out. General Release is £15 plus booking fees from 1st November to 17th December. Final Release is £17.50 plus booking fees from 18th December. Each release has 100 tickets. The live selector shows availability and the full checkout total.'),
            acc('Can we book as a group?', 'There is no group-of-four offer on sale for this event. Book individual tickets together in the live selector.'),
            acc('Is the event 18+?', 'Yes. Entry is 18+.'),
            acc('What if I have an access question?', access_a),
        ])
    elif is_disco_fever:
        visit_questions = ''.join([acc('Is it all disco?', 'Yes. All disco, all afternoon.'), acc('Is it fancy dress?', 'No. Dig out the sequins or wear what you can dance in.'), acc('What time is it on?', '2pm till 6pm.'), acc('Is the event 18+?', 'Yes. Entry is 18+.'), acc('Can we book as a group?', 'The group-of-four release is £40 plus booking fees and follows Early Release. The live ticket selector shows what is available now.'), acc('What if I have an access question?', access_a)])
    else:
        visit_questions = ''.join([acc('What time does it finish?', f'This date runs {esc(tm)}. Times vary between events, so check the date you book.'), acc('What should I wear?', wear), acc('Can we book as a group?', group_a), acc('What if I have an access question?', access_a)])
    visit = f'''<section class="visit container"{' id="good-to-know"' if saints_fsd else ''}><div class="visit-venue"><h2>PLAN YOUR VISIT</h2><div class="visit-grid"><p><strong>{esc(e['venue'])}</strong><br>{addr_html}{'<br><strong>Supporter Village Barn.</strong> In adverse weather, the event moves to the <strong>Rodber Suite</strong> at Saints.' if saints_fsd else ''}</p><div class="visit-links"><a href="{esc(maps)}" target="_blank" rel="noopener noreferrer">{icon("pin")}Directions {ARROW}</a><a href="{'#good-to-know' if note and not saints_fsd else '/contact/'}">{icon("access")}Access information {ARROW}</a></div></div></div><div class="visit-qa">{visit_questions}</div></section>'''
    others = [x for x in CURRENT_EVENTS[brand] if x['code'] != e['code']][:3]
    if saints_fsd:
        related_codes = ('121226-FSD-NPTON', '311026-HHP-NPTON', '041226-SD-NPTON')
        others = [x for code in related_codes for x in CURRENT_EVENTS[brand] if x['code'] == code]
    related = f'<section class="section container related">{section_head("MORE COMING UP", f"<a class=text-link href=/whats-on/>See all events {ARROW}</a>")}<div class="card-grid">{"".join(event_card(x) for x in others)}</div></section>'
    more = event_more_links(e) if brand == 'boom' else []
    more_html = link_list(more, 'More like this')
    body = hero_html + fact_rib + note_html + main + (tickets + strip_html if brand == 'pm' else strip_html + tickets) + visit + more_html + related
    description = (f'THE 2PM CLUB daytime disco in {e["city"]} on {d_long(e["start"])}. {e["venue"]}, {tm}. Music, access information and live tickets.' if brand == 'pm'
                   else f'{clean_title(e)} on {d_long(e["start"])}. {e["venue"]}, {e["city"]}, {tm}. Event details and live tickets.')
    if is_disco_fever:
        description = f'THE 2PM CLUB Disco Fever at {e["venue"]}, {e["city"]}. {d_short(e["start"])}, 2pm till 6pm. Four hours of the biggest disco hits: Chic, Donna Summer, Bee Gees, ABBA and more.'
    if e['fmt'] == 'nye':
        description = 'Boombastic NYE 2026 in Northampton: 80s, 90s and 00s hits at The Charles Bradlaugh, 31st December, 8pm to 1am. Tickets from £12.50 plus booking fees.'
    return page(brand, f"{clean_title(e)}, {e['city']}, {d_short(e['start'])}", body, description, image=base + ('/assets/nye-2026-social.webp' if e['fmt'] == 'nye' else e['poster']), sticky_label=ticket_label, sticky_href='#tickets', body_class='is-event')


def clean_title(e):
    if e['fmt'] == 'pmdf': return 'THE 2PM CLUB Disco Fever'
    t_ = e['title'].replace('THE 2PM CLUB Daytime Disco: ', 'THE 2PM CLUB ').replace("Boombastic's ", 'Boombastic ')
    return t_


def locations(brand, events):
    pm = brand == 'pm'
    live = [c for c, _ in live_cities(brand)]
    tiles = []
    for city in live:
        rel = [e for e in events if e['city'] == city and on_sale(e)]
        thumbs = ''.join(f'<img src="{esc(small_copy(e["poster"], 600) or e["poster"])}" alt="" loading="lazy" width="120" height="120">' for e in rel[:3])
        venues = ', '.join(sorted({e['venue'] for e in rel}))
        meta = f'<p class="loc-count">{len(rel)} date{"s" if len(rel) != 1 else ""} on sale</p><p class="loc-next">Next: {esc(d_short(rel[0]["start"]))} · {esc(rel[0]["venue"])}</p>'
        tiles.append(f'<a class="loc-tile" href="{city_url(brand, city)}"><div class="loc-thumbs">{thumbs}</div><h2>{esc(city.upper())}</h2>{meta}<b>Explore {esc(city)} {ARROW}</b></a>')
    quiet = [c for c in verified_places(brand) if c not in live]
    quiet_rows = ''.join(f'<li><a href="{city_url(brand, c)}">{esc(c)}</a><span>No date announced at the moment.{" Nearest dates on sale: " + " and ".join(nearest_live(brand, c)) + "." if nearest_live(brand, c) else ""}</span></li>' for c in quiet)
    quiet_html = f'<section class="loc-quiet container" aria-labelledby="quiet-h"><h2 id="quiet-h">Other places we’ve partied</h2><p>We’ve held events here before. Nothing is on sale {'here' if len(quiet) == 1 else 'in these places'} at the moment.</p><ul>{quiet_rows}</ul></section>' if quiet else ''
    h = hero(brand, 'YOUR CITY.<br>YOUR NEXT<br>' + ('AFTERNOON.' if pm else 'PARTY.'), 'Pick your city for dates on sale, venue details and how to get there.', btn('Find your city', '#cities', 'btn-hot' if pm else 'btn-dark'), 'pm-packed.jpg' if pm else 'b90-crowd.jpg')
    rib = ribbon([('LOCAL DATES', 'Find an afternoon near you' if pm else 'Find a party near you'), ('REAL VENUES', 'Addresses and access for each date'), ('PICK YOUR EDITION', '80s and Christmas dates') if pm else ('PICK YOUR PARTY', 'Daytime, evening or family')])
    final = f'<section class="final-band"><div class="container final-in"><h2>EVERY DATE. EVERY CITY.</h2>{btn("See what’s on", "/whats-on/")}</div></section>'
    body = h + rib + f'<section class="section container" id="cities">{section_head("DATES ON SALE BY CITY", "", "Where we party")}<div class="loc-grid">{"".join(tiles)}</div></section>' + quiet_html + strip('pm-wide.jpg' if pm else 'fl-room.jpg') + final
    return page(brand, 'Locations', body, 'Find upcoming ' + ('THE 2PM CLUB daytime discos' if pm else 'Boombastic parties') + ' by city. See real dates, venues and tickets.', '/locations/')


def past_venues(city):
    """Venues and formats Boombastic has run in a town, from the event registry (retired venues and formats excluded)."""
    out = {}
    for r in BOOM_ALL:
        if r.get('city') != city or not r.get('venue') or r['venue'] == 'The Picturedrome' or str(r.get('eventCode')) in GONE_EVENT_CODES:
            continue
        kind = 'THE 2PM CLUB' if '-2PM-' in str(r.get('eventCode')) else next((label for _, label, token in FORMAT_PAGES if token in str(r.get('eventCode'))), 'parties')
        v = out.setdefault(r['venue'], {'kinds': [], 'address': r.get('venueAddress') or {}})
        if kind not in v['kinds']: v['kinds'].append(kind)
        if r.get('venueAddress') and not v['address']: v['address'] = r['venueAddress']
    return out


def past_venue_line(city):
    parts = []
    for venue, v in past_venues(city).items():
        where = ', '.join(x for x in [venue, v['address'].get('streetAddress'), city] if x)
        parts.append(f'{join_words(v["kinds"])} at {where}')
    return f'Boombastic has run {join_words(parts)}.' if parts else ''


def empty_city_page(brand, city):
    """A verified place with nothing on sale: say so plainly and point to real, bookable dates nearby."""
    pm = brand == 'pm'
    near = nearest_live(brand, city)
    if near:
        # The next date from each nearest town first, so the cards always match the towns the copy names.
        firsts = [next(e for e in CURRENT_EVENTS[brand] if on_sale(e) and e['city'] == c) for c in near]
        rest = [e for e in CURRENT_EVENTS[brand] if on_sale(e) and e['city'] in near and e not in firsts]
        nearby = sorted(firsts + rest[:max(0, 4 - len(firsts))], key=lambda e: e['start'])
    else:
        nearby = [e for e in CURRENT_EVENTS[brand] if on_sale(e)][:3]
    near_txt = ' and '.join(near)
    what = 'THE 2PM CLUB dates' if pm else 'dates'
    history = past_venue_line(city) if not pm else ''
    sub = (esc(history) + ' ' if history else '') + f'No date announced in {esc(city)} at the moment. ' + (f'The nearest {what} on sale are in {esc(near_txt)}.' if near else f'Here are the next {what} on sale.')
    if pm:
        h = hero(brand, f'<span class="city-big">{esc(city.upper())}</span>NO DATE<br>ANNOUNCED<br>RIGHT NOW.', sub, btn('See the nearest dates' if near else 'See dates on sale', '#nearby', 'btn-hot'), 'pm-packed.jpg', cls='city-hero')
    else:
        em = empty_town_meta(city)
        PAGE_META[(brand, city_url(brand, city))] = dict(title=em[0], description=em[1])
        h = hero(brand, esc(em[2]), sub, btn('See the nearest dates' if near else 'See dates on sale', '#nearby', 'btn-dark'), 'boom-hero.jpg', cls='city-hero', slogan=f'<span class="city-big">{esc(city.upper())}</span>NO DATE<br>ANNOUNCED<br>RIGHT NOW.')
    rib = ribbon([('NEAREST DATES', esc(near_txt) if near else 'On sale now', '#nearby'), ('ALL LOCATIONS', 'Every city with dates on sale', '/locations/'), ('EVERY DATE', 'All cities on What’s on', '/whats-on/')])
    rows = ''.join(event_row(e) for e in nearby)
    others = ''.join(f'<li><a href="{city_url(brand, c)}">{esc(c)}</a></li>' for c, _ in live_cities(brand))
    main = f'''<section class="section container" id="nearby">{section_head(("NEAREST DATES ON SALE" if near else "DATES ON SALE NOW"), f"<a class=text-link href=/whats-on/>All dates {ARROW}</a>")}<p class="nearby-lead">{"The closest dates you can book now, in " + esc(near_txt) + "." if near else "The next dates you can book now."}</p><div class="rows">{rows}</div><div class="nearby-more"><h3>ALL CITIES WITH DATES ON SALE</h3><ul class="city-chips">{others}</ul></div></section>'''
    answer = '' if pm else f'<section class="container answer-block"><p class="answer">{esc(empty_town_answer(city))}</p></section>'
    pm_hub = '' if pm else (f'<section class="section container town-formats"><h2>OUR PARTIES IN {esc(city.upper())}</h2><ul class="fact-list"><li><strong>THE 2PM CLUB</strong>: Saturday afternoon daytime disco with a live DJ, run on its own site. <a class="text-link" href="{PM_BASE}/hubs/{slug(city)}/">THE 2PM CLUB daytime disco in {esc(city)} {ARROW}</a></li></ul></section>'
                            if any('-2PM-' in str(r.get('eventCode')) and r.get('city') == city for r in BOOM_ALL) else '')
    body = f'<nav class="crumbs container" aria-label="Breadcrumb"><a href="/locations/">Locations</a> / {esc(city)}</nav>' + h + answer + rib + main + pm_hub
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
    if pm:
        h = hero(brand, f'<span class="city-big">{esc(city.upper())}</span>YOUR TOWN.<br>YOUR NEXT AFTERNOON.', sub, cta, photo_name, cls='city-hero')
    else:
        tm = town_meta(city)
        PAGE_META[(brand, city_url(brand, city))] = dict(title=tm[0], description=tm[1])
        h = hero(brand, esc(tm[2]), sub, cta, photo_name, cls='city-hero', slogan=f'<span class="city-big">{esc(city.upper())}</span>YOUR TOWN.<br>YOUR NEXT PARTY.')
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
    season = []
    if not pm and any(e in halloween_events(events) for e in rel):
        season.append((f'Halloween in {city}', '/halloween/'))
    if not pm and any(e in christmas_events(events) for e in rel):
        season.append((f'Christmas parties {TODAY[:4]}', '/christmas-parties/'))
    season_html = link_list(season, 'Seasonal parties')
    answer = '' if pm else f'<section class="container answer-block"><p class="answer">{esc(town_answer(city))}</p></section>'
    extra = '' if pm else town_formats_block(city) + night_block([k for k, _, _ in FORMAT_PAGES if any(e['brand'] == 'boom' and e['fmt'] in NIGHT_FMTS[k] for e in rel)])
    body = f'<nav class="crumbs container" aria-label="Breadcrumb"><a href="/locations/">Locations</a> / {esc(city)}</nav>' + h + answer + rib + list_html + extra + season_html + kb + strip(strip_name) + su
    desc = (f'THE 2PM CLUB daytime disco in {city}. See upcoming dates, {", ".join(venues)}, venue information and live tickets.' if pm
            else f'Boombastic events and parties in {city}. See upcoming dates, {", ".join(venues)}, venue information and live tickets.')
    return page(brand, city, body, desc, city_url(brand, city))

# ---------------------------------------------------------------- town and format copy (board #rewrites, 12th October 2026)
# Every dated phrase is rebuilt from the feed on each build, so the copy changes when the next date changes.

TOWN_FORMAT_PAGES = [('silent-disco', 'Northampton'), ('family-silent-disco', 'Northampton')]
FORMAT_ORDER = ['sdxmas', 'sd', 'dec', 'hhp', 'b90', 'fsd']
FORMAT_LINK = {'sd': ('silent-disco', 'Silent Disco Greatest Hits', 'More silent discos'), 'sdxmas': ('silent-disco', 'Silent Disco Greatest Hits', 'More silent discos'),
               'fsd': ('family-silent-disco', 'Family Silent Disco', 'More Family Silent Discos'), 'b90': ('boombastic-90s', 'Boombastic 90s', 'More Boombastic 90s')}
TITLE_VENUE = {'Mattioli Woods Welford Road Stadium': 'Welford Road'}

# What happens on the night: only facts already in this site's copy or the feed.
FORMAT_NIGHT = {
    'silent-disco': ['Everyone gets wireless headphones with three channels, each with its own live DJ: pop, indie and dance.',
                     'Switch channel with the button on the headphones whenever you like; the light shows which channel you are on, and you set your own volume.',
                     'The Christmas edition swaps pop for Christmas and party songs, alongside indie classics and dance anthems.',
                     'Take the headphones off for five seconds and you hear the whole room singing different songs at once.'],
    'family-silent-disco': ['Everyone gets headphones with three family-friendly channels: Party, Throwbacks and Charts.',
                            'Each person picks their own channel and sets their own volume, all on one dancefloor.',
                            'Designed for ages 4 and up. Children stay with, and are supervised by, their ticket-holding adult.'],
    'boombastic-90s': ['Four hours of 90s pop, Britpop, dance and hip-hop.', 'Authentic 90s videos on giant screens above the dancefloor.',
                       'Inflatable microphones up and every word sung back.'],
    'footloose-80s': ['Four hours of non-stop 80s anthems, played loud.', 'Classic 80s videos on big screens above the dancefloor.',
                      'Inflatable microphones, obviously.'],
}
NIGHT_FMTS = {'silent-disco': ('sd', 'sdxmas'), 'family-silent-disco': ('fsd',), 'boombastic-90s': ('b90',), 'footloose-80s': ()}


def town_events(city):
    return [e for e in CURRENT_EVENTS['boom'] if e['city'] == city and e['start'][:10] >= TODAY]


def owned_kinds(rel):
    """Boombastic-owned format names in a town, in a fixed order, seasonal family dates folded into one name."""
    fm = sorted({e['fmt'] for e in rel if e['brand'] == 'boom'}, key=lambda f: FORMAT_ORDER.index(f) if f in FORMAT_ORDER else 99)
    return [('Family Silent Disco' if f == 'fsd' else FORMAT[f][3]) for f in fm]


def venues_by_use(rel):
    counts = {}
    for e in rel: counts[e['venue']] = counts.get(e['venue'], 0) + 1
    return sorted(counts, key=lambda v: (-counts[v], v))


def age_words(e):
    a = is_adult(e)
    return 'for over-18s' if a is True else 'for ages 4 and up' if e['fmt'] == 'fsd' else ''


def with_article(name):
    return name if name.startswith(('THE ', 'Boombastic', 'Footloose')) else 'the ' + name


def date_sentence(e, lead='The next date is'):
    bits = [f'{lead} {with_article(event_name(e))} on {d_day_year(e["start"])}, {times(e).replace(" – ", " to ")}']
    if age_words(e): bits.append(age_words(e))
    bits.append(price_sentence(e))
    return ', '.join(b for b in bits if b) + '.'


def words(text): return len(plain_text(text).split())


def fit_answer(core, extras):
    """Answer block of 40 to 60 words: core sentences, then extras while they fit."""
    out = list(core)
    for x in extras:
        if words(' '.join(out + [x])) <= 60: out.append(x)
    while words(' '.join(out)) > 60 and len(out) > 1: out.pop()
    return ' '.join(out)


def strip_number(street_):
    return re.sub(r'^\d+[A-Za-z]?\s+', '', street_ or '')


def town_answer(city):
    rel = town_events(city)
    kinds = owned_kinds(rel)
    venues = venues_by_use(rel)
    pm_dates = [e for e in rel if e['brand'] == 'boom-crosslink']
    first = rel[0]
    if kinds:
        core = [f'Boombastic Events runs {join_words(kinds)} in {city}, at {join_words(venues)}.', date_sentence(first)]
    else:
        v = venues[0]; addr = (first.get('address') or {}).get('streetAddress')
        core = [f'Boombastic Events runs THE 2PM CLUB daytime disco in {city} at {v}{", " + strip_number(addr) if addr else ""}.', date_sentence(first)]
    extras = [date_sentence(e, 'Then') for e in rel if e is not first][:2]
    if kinds and pm_dates: extras.append(f'THE 2PM CLUB daytime disco runs here on Saturday afternoons too.')
    extras += ['Each date has its own page with times, venue, age rule and tickets.']
    return fit_answer(core, extras)


def empty_town_answer(city):
    near = nearest_live('boom', city)
    nxt = [(c, next(e for e in CURRENT_EVENTS['boom'] if on_sale(e) and e['city'] == c)) for c in near]
    core = [past_venue_line(city), f'No {city} date is on sale right now.']
    if nxt:
        core.append('The nearest dates on sale are in ' + join_words([f'{c} (from {d_day_year(e["start"])})' for c, e in sorted(nxt, key=lambda x: x[1]['start'])]) + '.')
    return fit_answer([x for x in core if x], ['Each date has its own page with times, venue, age rule and tickets.', 'Booking fees are added at checkout.', f'Check the {city} page again for new dates.'])


def town_meta(city):
    """(title, description, h1) for a town page with dates, following the board pattern."""
    rel = town_events(city)
    kinds = owned_kinds(rel)
    venues = venues_by_use(rel)
    short = [SHORT_VENUE.get(v, v) for v in venues]
    first = next((e for e in rel if on_sale(e)), rel[0])
    if city == 'Northampton' and kinds:
        title = 'Silent Disco and Party Nights in Northampton | Boombastic' if any('Silent Disco' in k for k in kinds) else f'Party Nights in {city} | Boombastic Events'
        names = [k for k in kinds if k != 'Family Silent Disco'] + (['Family Silent Disco'] if 'Family Silent Disco' in kinds else [])
        desc = f'{join_words(names)} at {join_words(short)}, {city}.'
        fam = 'Family Silent Disco' in kinds
        decades_ = any(k in kinds for k in ('Christmas Decades Party', 'Boombastic 90s', 'Footloose 80s', 'Halloween House Party'))
        flags = [('silent disco', any('Silent Disco' in k for k in kinds)), ('decades', decades_), ('family', fam)]
        h1 = f'Parties in {city}: ' + join_words([x for x, ok in flags if ok])
    elif kinds:
        lead = 'Boombastic 90s' in kinds
        title = (f'90s Nights and Parties in {city} | Boombastic Events' if lead else f'Parties in {city} at {TITLE_VENUE.get(venues[0], venues[0])} | Boombastic Events')
        addr = (next(e for e in rel if e['venue'] == venues[0]).get('address') or {}).get('streetAddress')
        all_kinds = kinds + (['THE 2PM CLUB'] if any(e['brand'] == 'boom-crosslink' for e in rel) else [])
        desc = f'{join_words(all_kinds)} at {venues[0]}{", " + addr if addr else ""}. Dates, ' + ('sold-out waiting lists and tickets.' if any(e.get('soldout') for e in rel) else 'venue details and tickets.')
        h1 = f'Parties in {city} at {join_words(venues)}'
    else:
        v = venues[0]
        addr = strip_number((first.get('address') or {}).get('streetAddress'))
        title = f'Parties in {city} at {TITLE_VENUE.get(v, v)} | Boombastic Events'
        desc = f'{event_name(first)} at {v}{", " + addr if addr and city == "Coventry" else ""}, on {d_day_year(first["start"])}. Dates and tickets.'
        h1 = f'Parties in {city}' + (f' at {v}' if city == 'Coventry' else '')
    return title, desc, h1


def empty_town_meta(city):
    near = nearest_live('boom', city)
    nxt = [(c, next(e for e in CURRENT_EVENTS['boom'] if on_sale(e) and e['city'] == c)) for c in near]
    title = (f'Parties in {city}: Next Date Coming Soon | Boombastic' if len(f'Parties in {city}: Next Date Coming Soon | Boombastic') <= 55
             else f'Parties in {city}: Coming Soon | Boombastic')
    near_txt = (f' the nearest is {nxt[0][0]} on {ordinal(dt(nxt[0][1]["start"]).day)} {dt(nxt[0][1]["start"]).strftime("%B")}' if len(nxt) == 1
                else f' the nearest are in {join_words([c for c, _ in nxt])}') if nxt else ''
    desc = (past_venue_line(city) + ' ' if past_venue_line(city) else '') + f'No {city} date is on sale right now;{near_txt}.'
    return title, desc.replace(';.', '.'), f'{city}: next date coming soon'


def night_block(keys, heading='WHAT HAPPENS ON THE NIGHT'):
    """Factual 'what happens' list for the given format pages, with their next times from the feed."""
    parts = []
    for key in keys:
        facts = list(FORMAT_NIGHT.get(key, []))
        dated = [e for e in CURRENT_EVENTS['boom'] if e['brand'] == 'boom' and e['fmt'] in NIGHT_FMTS.get(key, ()) and e['start'][:10] >= TODAY]
        for e in dated[:2]:
            facts.append(f'{d_short(e["start"])} at {e["venue"]}: {times(e).replace(" – ", " to ")}' + (', sold out with a waiting list.' if e.get('soldout') else '.'))
        if facts:
            name = next(label for k, label, _ in FORMAT_PAGES if k == key)
            parts.append(f'<div class="xmas-kind"><h3>{esc(name)}</h3><ul class="fact-list">{"".join(f"<li>{esc(x)}</li>" for x in facts)}</ul><a class="text-link" href="/{key}/">About {esc(name)} {ARROW}</a></div>')
    return f'<section class="section container night"><h2>{heading}</h2><div class="xmas-kinds">{"".join(parts)}</div></section>' if parts else ''


def town_formats_block(city):
    """Formats Boombastic runs in a town, each linked to its format page (and town and format page), then THE 2PM CLUB hub."""
    rel = town_events(city)
    items = []
    seen = set()
    for e in rel:
        if e['brand'] != 'boom' or e['fmt'] not in FORMAT_LINK: continue
        key, name, _ = FORMAT_LINK[e['fmt']]
        if key in seen: continue
        seen.add(key)
        tf = f'/{key}/{slug(city)}/' if (key, city) in TOWN_FORMAT_LIVE else ''
        n = len([x for x in rel if x['brand'] == 'boom' and x['fmt'] in NIGHT_FMTS[key]])
        extra = f' <a class="text-link" href="{tf}">{esc(name)} in {esc(city)} {ARROW}</a>' if tf else ''
        items.append(f'<li><strong>{esc(name)}</strong>: {n} date{"s" if n != 1 else ""} coming up. <a class="text-link" href="/{key}/">About {esc(name)} {ARROW}</a>{extra}</li>')
    for e in rel:
        if e['brand'] == 'boom' and e['fmt'] in ('hhp', 'dec') and e['fmt'] not in seen:
            seen.add(e['fmt'])
            items.append(f'<li><strong>{esc(event_name(e))}</strong>: {esc(d_short(e["start"]))} at {esc(e["venue"])}. <a class="text-link" href="{esc(e["path"])}">Times and tickets {ARROW}</a></li>')
    pm_link = f'<li><strong>THE 2PM CLUB</strong>: Saturday afternoon daytime disco with a live DJ, run on its own site. <a class="text-link" href="{PM_BASE}/hubs/{slug(city)}/">THE 2PM CLUB daytime disco in {esc(city)} {ARROW}</a></li>'
    if any(e['brand'] == 'boom-crosslink' for e in rel) or any('-2PM-' in str(r.get('eventCode')) and r.get('city') == city for r in BOOM_ALL):
        items.append(pm_link)
    return f'<section class="section container town-formats"><h2>OUR PARTIES IN {esc(city.upper())}</h2><ul class="fact-list">{"".join(items)}</ul></section>' if items else ''


TOWN_FORMAT_LIVE = set()


def format_meta(key, upcoming, sold):
    """(title, description, h1) for a format page, from the board pattern and the feed."""
    on = [e for e in upcoming if not e.get('soldout')]
    token = next((t for k, _, t in FORMAT_PAGES if k == key), '#')
    reg_towns = list(dict.fromkeys(r['city'] for r in BOOM_ALL if token in str(r.get('eventCode')) and r.get('city')))
    if key == 'silent-disco':
        towns = list(dict.fromkeys(e['city'] for e in on))
        title = f'Silent Disco Greatest Hits: {towns[0]} Silent Disco' if len(towns) == 1 else 'Silent Disco Greatest Hits | Boombastic Events'
        nxt = on[0] if on else None
        desc = 'Three DJs, three headphone channels: pop, indie and dance.' + (f' Next: {event_name(nxt)}, {d_day_year(nxt["start"])}, {nxt["venue"]}, {nxt["city"]}.' if nxt else ' No date is on sale right now.')
        return title, desc, 'Silent Disco Greatest Hits: three channels, one dancefloor'
    if key == 'boombastic-90s':
        towns = sorted(set(reg_towns), key=lambda c: (c != 'Bedford', c))
        title = f'Boombastic 90s: 90s Party Nights in {join_words(towns)}'
        if len(title) > 65: title = 'Boombastic 90s: 90s Party Nights | Boombastic Events'
        state = (f' {sold[0]["venue"]} on {ordinal(dt(sold[0]["start"]).day)} {dt(sold[0]["start"]).strftime("%B %Y")} is sold out: join the waiting list.' if sold and not on
                 else f' Next: {d_day_year(on[0]["start"])} at {on[0]["venue"]}.' if on else ' No date is on sale right now.')
        return title, 'Pop, Britpop, dance and hip-hop with 90s videos on giant screens.' + state, f'Boombastic 90s: the 90s night for {join_words(towns)}'
    if key == 'footloose-80s':
        dec = next((e for e in CURRENT_EVENTS['boom'] if e['brand'] == 'boom' and e['fmt'] == 'dec' and on_sale(e)), None)
        state = (f' Next: {d_day_year(on[0]["start"])} at {on[0]["venue"]}.' if on else ' No Footloose 80s date is on sale right now' + (f'; see the Christmas Decades Party in {dec["city"]}.' if dec else '.'))
        return 'Footloose 80s: 80s Party Nights | Boombastic Events', 'Wall-to-wall 80s anthems, four hours long.' + state, 'Footloose 80s: all the anthems, all night'
    if key == 'family-silent-disco':
        towns = list(dict.fromkeys(e['city'] for e in on)) or ['the Midlands']
        bits = []
        for e in on[:3]:
            season = 'Halloween' if 'halloween' in e['title'].lower() else 'Christmas' if 'christmas' in e['title'].lower() else event_name(e)
            bits.append(f'{season} at {SHORT_VENUE.get(e["venue"], e["venue"])} on {ordinal(dt(e["start"]).day)} {dt(e["start"]).strftime("%B")}')
        desc = 'Three family-friendly headphone channels for kids 4+ and their grown-ups.' + (' ' + ', '.join(bits[:-1]) + (', ' if len(bits) > 1 else '') + bits[-1] + '.' if bits else '')
        if len(bits) == 2: desc = 'Three family-friendly headphone channels for kids 4+ and their grown-ups. ' + bits[0] + ', ' + bits[1][0].lower() + bits[1][1:] + '.'
        if len(bits) == 2: desc = desc.replace(', christmas', ', Christmas').replace(', halloween', ', Halloween')
        town = towns[0] if len(towns) == 1 else join_words(towns)
        return f'Family Silent Disco {town}, Ages 4+ | Boombastic', desc, f'Family Silent Disco in {town}, for kids 4+ and their grown-ups'
    return None


def format_towns_block(key, upcoming):
    """Format page: link to the town pages that have (or have had) this format."""
    token = next(t for k, _, t in FORMAT_PAGES if k == key)
    towns = list(dict.fromkeys(e['city'] for e in upcoming))
    label = 'WHERE IT IS ON'
    if not towns:
        towns = list(dict.fromkeys(r['city'] for r in BOOM_ALL if token in str(r.get('eventCode')) and r.get('city')))
        label = 'WHERE IT HAS RUN'
    links = ''.join(f'<li><a href="{city_url("boom", c)}">{esc(c)}</a></li>' for c in towns)
    tf = ''.join(f'<a class="text-link" href="/{key}/{slug(c)}/">{esc(next(l for k, l, _ in FORMAT_PAGES if k == key))} in {esc(c)} {ARROW}</a> ' for c in towns if (key, c) in TOWN_FORMAT_LIVE)
    return f'<section class="section container">{section_head(label)}<ul class="city-chips">{links}</ul>{f"<p class=more-links>{tf}</p>" if tf else ""}</section>' if towns else ''


TOWN_FORMAT_PROOF = {'silent-disco': ['sd-energy.jpg', 'sd-four-friends.jpg', 'sd-dance-drinks.jpg'], 'family-silent-disco': ['family-silent-disco-live.jpg']}


def town_format_page(key, city, events):
    """Town and format page, built only while that format has upcoming dates in that town (board #newtown template)."""
    name = next(label for k, label, _ in FORMAT_PAGES if k == key)
    token = next(t for k, _, t in FORMAT_PAGES if k == key)
    rel = [e for e in events if e['brand'] == 'boom' and e['city'] == city and e['fmt'] in NIGHT_FMTS[key]]
    route = f'/{key}/{slug(city)}/'
    nxt = next((e for e in rel if on_sale(e)), rel[0])
    venues = venues_by_use(rel)
    past = sorted([r for r in BOOM_ALL if token in str(r.get('eventCode')) and r.get('city') == city and r['start'][:10] < TODAY and not r.get('isCancelled')], key=lambda r: r['start'])
    if key == 'silent-disco':
        title = f'Silent Disco in {city}: Dates and Venue | Boombastic'
        h1 = f'Silent disco in {city}: {name}'
        lead = f'{name} is the Boombastic Events silent disco in {city}: three live DJs on three headphone channels, and you switch whenever you like.'
        desc = f'{name} in {city}: three DJs on three headphone channels. Next: {event_name(nxt)}, {d_day_year(nxt["start"])}, {nxt["venue"]}, {price_sentence(nxt)}.'
    else:
        title = f'Family Silent Disco in {city}: Dates | Boombastic'
        h1 = f'Family Silent Disco in {city}: dates, venues and ages'
        lead = f'Family Silent Disco by Boombastic Events runs in {city} for children aged 4 and up and the grown-ups who bring them, with three family-friendly headphone channels.'
        bits = [f'{("Halloween" if "halloween" in e["title"].lower() else "Christmas" if "christmas" in e["title"].lower() else name)} at {SHORT_VENUE.get(e["venue"], e["venue"])} on {ordinal(dt(e["start"]).day)} {dt(e["start"]).strftime("%B")}' for e in rel[:3]]
        desc = f'Family Silent Disco in {city} for kids 4+ and their grown-ups: ' + join_words(bits) + '.'
    answer = fit_answer([lead, date_sentence(nxt)], [date_sentence(e, 'Then') for e in rel if e is not nxt][:2] + ['Each date has its own page with times, venue and tickets.'])
    notes = []
    for e in rel:
        n = notice(e)
        if n: notes.append(f'<p><strong>{esc(d_short(e["start"]))}:</strong> {esc(n[1])} <a href="{esc(e["path"])}#good-to-know">Details {ARROW}</a></p>')
    venue_html = (f'<section class="kb container"><div class="kb-intro"><h2>THE VENUE{"S" if len(venues) > 1 else ""}</h2><p>Check the venue on your chosen date before travelling.</p></div>'
                  f'<div class="kb-venues">{venue_cards_html(rel)}</div><div class="kb-notes">{"".join(notes)}<p class="kb-access">{icon("access")}<span>Access questions? <a href="mailto:{EMAIL}">Get in touch {ARROW}</a></span></p></div></section>')
    past_txt = (f'<p>{esc(name)} has run in {esc(city)} before: ' + join_words([d_day_year(r['start']) for r in past[-3:]]) + '.</p>') if past else ''
    proof = f'<section class="section container"><h2>FROM OUR {esc(name.upper())} NIGHTS</h2>{past_txt}<div class="season-photos">{"".join(photo(x, "season-photo") for x in TOWN_FORMAT_PROOF.get(key, []))}</div></section>'
    if key == 'silent-disco':
        faqs = [(f'When is the next silent disco in {city}?', esc(date_sentence(nxt).replace('The next date is ', ''))),
                ('How do the channels work?', 'Wireless headphones pick up three DJs. Switch channel with the button on the headphones; the light shows which channel you are on.')]
        if any('£10 fully refundable headphone deposit' in (e.get('full') or '') or e['fmt'] == 'sdxmas' for e in rel):
            faqs.append(('Is there a headphone deposit?', 'For the Christmas Silent Disco, a £10 fully refundable headphone deposit is taken on the night. Check your event page for others.'))
        faqs.append((f'Where is it in {city}?', esc('; '.join(f'{v}, {", ".join(street(next(e for e in rel if e["venue"] == v)))}' for v in venues) + '.') + (' Some events use an upstairs room reached by steps; check your event page.' if 'The Charles Bradlaugh' in venues else '')))
    else:
        faqs = [(f'When is the next Family Silent Disco in {city}?', esc('; '.join(f'{event_name(e)}: {d_day_year(e["start"])}, {times(e).replace(" – ", " to ")}, {e["venue"]}' for e in rel) + '.')),
                ('What age is it for?', 'Designed for ages 4 and up. Younger children may find the headphones too large. Check your event page for the under-4s policy on that date.'),
                ('Do children need an adult?', 'Yes. Children must be accompanied and supervised by a ticket-holding adult at all times, maximum three children per adult.'),
                ('Is the venue accessible?', 'Venue arrangements vary by date. The Charles Bradlaugh events are upstairs, accessed by steps. Email us before booking if you need to check an arrangement.')]
    body = (f'<nav class="crumbs container" aria-label="Breadcrumb"><a href="/{key}/">{esc(name)}</a> / {esc(city)}</nav>'
            f'<section class="page-band"><div class="container"><p class="eyebrow">{esc(name)} · {esc(city)}</p><h1 class="h1-band">{esc(h1)}</h1><p class="answer">{esc(answer)}</p></div></section>'
            f'<section class="section container" id="upcoming">{section_head(f"{esc(name.upper())} IN {esc(city.upper())}", f"<a class=text-link href={city_url("boom", city)}>Everything in {esc(city)} {ARROW}</a>")}{results(rel)}</section>'
            + night_block([key]) + venue_html + proof
            + f'<section class="section container faq-list"><h2>{esc(name.upper())} IN {esc(city.upper())}: QUESTIONS</h2>{"".join(acc(q, a) for q, a in faqs)}</section>'
            + link_list([(f'All {name} dates', f'/{key}/'), (f'Everything in {city}', city_url('boom', city)), ('Group bookings', '/group-bookings/')], 'More')
            + signup('boom', city=city))
    PAGE_META[('boom', route)] = dict(title=title, description=desc)
    return page('boom', f'{name} in {city}', body, desc, route)


def boom_format(key, events):
    F = BOOM_FORMATS[key]
    upcoming = [e for e in events if e['fmt'] in F['fmts'] and e['brand'] == 'boom']
    rel = [e for e in upcoming if not e.get('soldout')]
    sold = [e for e in upcoming if e.get('soldout')]
    now = ('See what’s on', '/whats-on/')  # no-date formats: the next step is real events on sale, not a preview signup
    fm = format_meta(key, upcoming, sold)
    h = hero('boom', esc(fm[2]) if fm else F['h1'], F['sub'], btn(F['cta'], '#dates') if (rel or sold) else btn(*now), F['hero'], eyebrow=F['eyebrow'], cap=F.get('hero_cap'), cls='hero-family' if key == 'family-silent-disco' else '', slogan=F['h1'] if fm else '')
    rib = ribbon(F['ribbon'])
    how = f'<section class="section container how">{section_head(F["how_h"])}{steps(F["steps"])}{pill_cards(F["cards"])}{F.get("after", "")}</section>'
    if rel:
        dates = f'<section class="section container" id="dates">{section_head(F["dates_h"])}<div class="date-rows">{"".join(date_row(e) for e in sorted(rel[:4] + sold, key=lambda x: x["start"]))}</div></section>'
    elif sold:
        dates = f'<section class="section container" id="dates">{section_head("SOLD OUT: JOIN THE WAITING LIST")}<div class="date-rows">{"".join(date_row(e) for e in sold[:4])}</div></section>'
    else:
        dates = f'<section class="section container" id="dates">{section_head("NO DATE ON SALE")}<div class="no-date"><p>{esc(F["nodate"])} See the Boombastic events on sale now.</p>{btn(*now)}</div></section>'
    qa = qa_cta('boom', F['faq'], 'GOOD TIMES.<br>GREAT COMPANY.', F['cta_sub'], *((F['cta'], '#dates') if rel else now))
    body = h + rib + how + night_block([key]) + (strip(F['strip']) if F['strip'] else '') + dates + format_towns_block(key, upcoming) + qa
    if fm:
        PAGE_META[('boom', f'/{key}/')] = dict(title=fm[0], description=fm[1])
    token = next(t for k, _, t in FORMAT_PAGES if k == key)
    EXTRA_SCHEMA[('boom', f'/{key}/')] = [series_schema(f'/{key}/', F['title'], F['sub'] + ' By Boombastic Events.', upcoming)]
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
        'family-silent-disco': dict(title='Family Silent Disco', eyebrow='Family Silent Disco', h1='HEADPHONES ON.<br>EVERYONE DANCES.', sub='Three family-friendly channels, one dancefloor. For kids 4+ and the grown-ups who bring them.', cta='Find a family date', hero='family-silent-disco-live.jpg', hero_cap='Photo from a previous Family Silent Disco', fmts=('fsd',),
            ribbon=[('AGES 4+', 'Parents join in too'), ('3 CHANNELS', 'Party, throwbacks, charts'), ('WITH AN ADULT', 'Max three children per adult')], how_h='HERE’S HOW IT WORKS',
            steps=[('Pick up your headphones', 'Staff get everyone set up when you arrive.'), ('Choose your channel', 'Each person picks their own soundtrack.'), ('Dance together', 'Switch any time, all on one dancefloor.')],
            cards=[(None, 'Party', 'blue', 'Family favourites and sing-alongs, with seasonal songs on special dates.'), (None, 'Throwbacks', 'red', "Sing-out-loud hits from the 80s, 90s and 2000s. This one's for the grown-ups."), (None, 'Charts', 'green', 'Current favourites and trending hits.')],
            after='<p class="fine">Each person can choose a channel and set their own headphone volume. Check the individual event page for the channel line-up on your date.</p>',
            strip=None, dates_h='UPCOMING FAMILY SILENT DISCOS', nodate='',
            faq=[('What age is it for?', 'Designed for ages 4 and up. Younger children may find the headphones too large. Check your event page for its age guidance.'), ('Do children need an adult?', 'Yes. Children must be accompanied and supervised by a ticket-holding adult at all times, maximum three children per adult. Check your event page for ticket requirements.'), ('Is the venue accessible?', 'Venue arrangements vary by date. The 12th December event is upstairs at The Charles Bradlaugh, accessed by steps. Email us before booking if you need to check access arrangements.'), ('What time is it?', 'The 12th December party runs 11am to 1pm. Check your event page for the exact details.')],
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


def family_start_words():
    """Family Silent Disco start times read from the upcoming dates, so the FAQ never contradicts a date."""
    fam = [e for e in CURRENT_EVENTS['boom'] if e['brand'] == 'boom' and e['fmt'] == 'fsd' and e['start'][:10] >= TODAY]
    if not fam:
        return 'Family Silent Disco in the daytime'
    return 'Family Silent Disco ' + ' or '.join(f'from {t(e["start"])} on {d_day(e["start"])}' for e in fam)


def board_faqs():
    """The ten board FAQ answers (12th October 2026), with every dated fact rebuilt from the feed."""
    boom = CURRENT_EVENTS['boom']
    live = [c for c, _ in live_cities('boom')]
    out = [('What is Boombastic Events?', 'Boombastic Events is a party promoter that has run ticketed singalong parties since 2014. It runs Silent Disco Greatest Hits, the Decades Parties (Boombastic 90s and Footloose 80s), Family Silent Disco for ages 4 and up, seasonal Halloween and Christmas parties, and THE 2PM CLUB daytime disco. ' + f'Current venues are in {join_words(sorted(live, key=lambda c: ["Northampton", "Bedford", "Leicester", "Coventry"].index(c) if c in ["Northampton", "Bedford", "Leicester", "Coventry"] else 9))}.')]
    pm_up = [e for e in CURRENT_EVENTS['pm'] if e['start'][:10] >= TODAY]
    odd = sorted({e['city'] for e in pm_up if t(e['end']) != '6pm'})
    finish = ('Doors open at 2pm, most dates finish at 6pm, and the ' + join_words(odd) + ' Christmas dates finish at 5:30pm.'
              if pm_up and odd and all(t(e['end']) in ('6pm', '5:30pm') for e in pm_up) and all(e['fmt'] == 'pmxmas' for e in pm_up if t(e['end']) == '5:30pm')
              else 'Doors open at 2pm; each event page shows its finish time.')
    out.append(('Is THE 2PM CLUB a silent disco?', 'No. THE 2PM CLUB is a Saturday afternoon daytime disco with a live DJ and a full sound system playing 80s, 90s and 00s anthems. There are no headphones. ' + finish + ' Current dates are for over-18s.'))
    out.append(('How does Silent Disco Greatest Hits work?', 'Everyone gets wireless headphones with three channels, each with its own live DJ: pop, indie and dance. You switch channel whenever you like, so one room can sing three different songs at once.'))
    out.append(('What age is Family Silent Disco for?', 'Family Silent Disco by Boombastic Events is designed for children aged 4 and up and the grown-ups who bring them. It has three family-friendly headphone channels.'))
    sd = next((e for e in boom if e['brand'] == 'boom' and e['fmt'] in ('sd', 'sdxmas') and e['city'] == 'Northampton' and e['start'][:10] >= TODAY), None)
    if sd:
        group = ', and a group-of-4 ticket is available' if (sd.get('groupTicket') or {}).get('label') and not sd.get('soldout') else ''
        addr = ', '.join(street(sd))
        out.append(('Where is the next silent disco in Northampton?', f'Boombastic’s {event_name(sd)} is on {d_day_year(sd["start"])}, {times(sd).replace(" – ", " to ")}, at {sd["venue"]}, {addr}. ' + (f'Tickets start {price_sentence(sd)}{group}.' if not sd.get('soldout') else 'It is sold out, with a waiting list on the event page.')))
    xmas = christmas_events(boom)
    if xmas:
        out.append((f'What Christmas parties are on in {xmas[0]["start"][:4]}?', f'{len(xmas)} dates: ' + '; '.join(f'{event_name(e)} at {e["venue"]}, {e["city"]} ({d_day(e["start"])})' for e in xmas) + '.'))
    hall = halloween_events(boom)
    if hall:
        towns = list(dict.fromkeys(e['city'] for e in hall))
        out.append((f'Are there Halloween parties in {join_words(towns)} in {hall[0]["start"][:4]}?', f'Yes, {({1: "one", 2: "two", 3: "three"}).get(len(hall), len(hall))}. ' + ' '.join(f'The {event_name(e)} is {"for over-18s " if is_adult(e) else ""}on {d_day(e["start"])}, {times(e).replace(" – ", " to ")}, at {e["venue"]}, {price_sentence(e)}.' for e in hall)))
    out.append(('Can I book for a group or a work Christmas party?', f'Many Boombastic dates have a group-of-4 ticket at a lower price per person. For larger groups, birthdays, work parties or a reserved area, email <a href="mailto:{EMAIL}">{EMAIL}</a> with the date and group size.'))
    out.append(('How do I buy tickets, and what if it is sold out?', 'Every Boombastic party has its own page on boomevents.co.uk (or the2pmclub.co.uk for THE 2PM CLUB) with times, venue, age rule and prices. Checkout is handled by Eventbrite. Prices are shown plus a booking fee. Sold-out dates have a waiting list on the event page.'))
    quiet = [c for c in ('Luton', 'Milton Keynes') if c not in live]
    if quiet:
        hist = ' '.join(past_venue_line(c) for c in quiet if past_venue_line(c))
        near = sorted({n for c in quiet for n in nearest_live('boom', c)})
        either = join_words(quiet).replace(' and ', ' or ')
        out.append((f'Is there a Boombastic party in {either}?', f'Not at the moment. {hist} No {either} date is on sale right now' + (f'; the nearest dates are in {join_words(near)}.' if near else '.')))
    return out


def faq_page(brand):
    pm = brand == 'pm'
    sections = ([('about', 'star', 'About us', 'Boombastic, our parties and where', 'ABOUT OUR PARTIES', board_faqs())] if not pm else []) + [
        ('tickets', 'ticket', 'Tickets', 'Booking and your tickets', 'TICKETS & BOOKING', [
            ('Where are my tickets?', f'Check the email address you used at checkout for your Eventbrite confirmation. Still stuck? <a href="mailto:{EMAIL}">Get in touch</a> with your name, event date, city and order reference.'),
            ('How do I book?', 'Choose a date on this site and use the live ticket selector on its event page. It shows the ticket types, fees and availability for that event.'),
            ('Can we book as a group?', 'Group options vary by event. Check the live selector on your chosen date. For a larger group, email us with the city, date and rough numbers.'),
            ('Are tickets refundable?', ('Current THE 2PM CLUB ticket listings say tickets are non-refundable unless the event is cancelled. Check the policy for your chosen date before paying. Our <a href="/terms/">terms</a> explain how we handle event changes.' if pm else 'Refund conditions vary by event. Check the policy shown with your chosen tickets before paying. Our <a href="/terms/">terms</a> explain where to find it.')),
            ('What if an event is changed or cancelled?', 'We update the event page and email ticket holders. If you need help with a change, email us with your booking details.'),
        ]),
        ('timing', 'clock', 'Timing', 'Event times and schedules', 'TIMING', [
            ('What time does it start and finish?', ('Doors are at 2pm. Most dates finish at 6pm; the Northampton Christmas dates finish at 5:30pm. Your event page has the exact times.' if pm else 'Times vary: THE 2PM CLUB runs from 2pm, ' + family_start_words() + ', evening parties from 8pm or 8:30pm. Your event page has the exact times.')),
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
            ('Is there an age limit for evening parties?', 'Entry rules are set for each event and shown on its event page. The Halloween House Party is an 18+ event, and valid photo ID may be required. Check your chosen event page and ticket selector before you book.'),
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
    rib = ribbon([('DAYTIME', 'THE 2PM CLUB', PM_BASE + '/'), ('EVENING', 'Silent Disco and Decades Parties', '#parties'), ('FAMILY', 'Family Silent Disco', '/family-silent-disco/')], cls='rib-short')
    story = f'''<section class="section container about-grid"><div><p class="eyebrow">What we do</p><h2>PARTIES BUILT AROUND THE SONGS.</h2><p>Every Boombastic party starts with the music people actually want to sing, then puts it in a room with the right people. Three DJs on three headphone channels at Silent Disco Greatest Hits. Giant-screen 90s videos at Boombastic 90s. Wall-to-wall 80s anthems at Footloose 80s. A Saturday afternoon of 80s, 90s and 00s anthems at THE 2PM CLUB.</p><p>We’ve filled rooms across the Midlands for years, with sell-out nights across our different parties. We run them in venues we know: The Charles Bradlaugh in Northampton, Bedford Esquires, MK11 in Milton Keynes, hmv Empire in Coventry and Mattioli Woods Welford Road Stadium in Leicester. For years our silent discos called The Picturedrome home, until our final night there on Saturday 26th September 2026.</p></div><div class="about-story-photo">{photo('b90-group.jpg', 'about-photo', caption=False)}</div></section>'''
    rel = f'<section class="relation container"><div class="relation-copy"><p class="eyebrow">THE 2PM CLUB</p><h2>THE SAME TEAM. AN EARLIER START.</h2><p>Our daytime disco brings big singalong energy into the afternoon. Doors at 2pm, home by 7-ish.</p>{btn("Explore THE 2PM CLUB", PM_BASE + "/")}</div><div class="relation-quotes">{quote_block(QUOTES["emma_r"])}{quote_block(QUOTES["fl80"])}</div></section>'
    body = h + rib + story + boom_parties_grid() + strip('footloose-photo.jpeg') + rel + signup('boom', 'YOUR CITY. YOUR NEXT NIGHT OUT.', 'Be first to hear about new parties near you.', events=events)
    return page('boom', 'About', body, 'About Boombastic Events: singalong parties across the Midlands since 2014.', '/about/')


def contact_page(brand):
    pm = brand == 'pm'
    body = f'''<section class="page-band"><div class="container"><p class="eyebrow">Contact</p><h1>LET’S TALK.</h1><p>Questions about an event, your tickets or access? Email the team.</p></div></section><section class="section container contact-grid"><div><h2>EMAIL US</h2><p><a class="help-mail" href="mailto:{EMAIL}">{icon('mail')}{EMAIL}</a></p><p>Include your name, the event date and city, and your order reference if you already have tickets. For access, tell us what you need so we can advise before you book or travel.</p>{btn('Email us', 'mailto:' + EMAIL)}</div><div class="contact-side"><h2>QUICK ANSWERS</h2><a href="/work-with-us/">Venues, creators and event roles {ARROW}</a><a href="/faqs/#tickets">Where are my tickets? {ARROW}</a><a href="/faqs/#timing">What time does it finish? {ARROW}</a><a href="/faqs/#access">Is my event accessible? {ARROW}</a><a href="/group-bookings/">Coming as a group? {ARROW}</a></div></section>'''
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


def official_content_page(brand, key):
    if brand == 'boom' and key == 'jobs':
        return render_recruitment_page(page)
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
            body = f'''<article class="prose container legal-page"><h1>Public information about {esc(name)}</h1><p>{esc(name)} is operated by Boombastic Events Ltd. The <a href="{feed}">public event feed</a> lists upcoming dates, venues and links.{' The <a href="/venues.json">venues feed</a> lists each venue with its address, town page and current dates.' if brand == 'boom' else ''} The <a href="/whats-on/">What’s on page</a> is the current visitor-facing listing; each event page links to its live Eventbrite ticket selector.</p><p>Check the individual event page for the current time, access details and ticket options. Questions: <a href="mailto:{EMAIL}">{EMAIL}</a>.</p></article>'''
            return page(brand, label, body, f'Public event information and data feed for {name}.')
        raise SystemExit(f'{brand}/{key}: no production content source')
    body = f'<section class="page-band"><div class="container"><p class="eyebrow">Current information</p><h1>{esc(label.upper())}.</h1><p>This preview keeps the current {esc(label.lower())} on the official website while the new site is reviewed.</p>{btn("Read the current " + esc(label.lower()) + " ↗", f"{live}/{key}/")}</div></section>'
    return page(brand, label, body)


def not_found(brand):
    """Unknown or finished URLs: say so plainly, then show what is on sale next."""
    pm = brand == 'pm'
    listing_href = '/events/' if pm else '/whats-on/'
    upcoming = [e for e in CURRENT_EVENTS.get(brand, []) if on_sale(e)][:6]
    grid = (f'<section class="section container"><div class="sec-head"><div><h2>WHAT’S ON NEXT</h2></div><a class="text-link" href="{listing_href}">All dates {ARROW}</a></div>'
            f'<div class="card-grid">{"".join(event_card(e) for e in upcoming)}</div></section>') if upcoming else ''
    body = (f'<section class="page-band"><div class="container"><p class="eyebrow">Page not found</p><h1>THAT ONE’S GONE.</h1>'
            f'<p>The page you were after has moved, or the event has been and gone. Here’s what’s on next.</p>{btn("See all dates", listing_href)}</div></section>' + grid)
    return page(brand, 'Page not found', body, 'That page has moved or the event has finished. See what is on sale next.')


def plain_text(fragment):
    # The lowercase-s span in "80s" is display styling only: drop it without adding a space.
    fragment = re.sub(r'<span class="lc">([^<]*)</span>', r'\1', fragment or '')
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', fragment))).strip()


def price_amount(label):
    m = re.search(r'£\s*(\d+(?:\.\d{1,2})?)', label or '')
    return f'{float(m.group(1)):.2f}' if m else None


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
    meta = PAGE_META.get((brand, route))
    if event:
        title = (f'{clean_title(event)} {event["city"]} | {d_short(event["start"])} | {event["venue"]}' if event['fmt'] == 'pmdf' else f'{clean_title(event)} | {d_short(event["start"])}')
        if event['fmt'] == 'nye':
            title = 'Boombastic NYE 2026 Northampton | The Charles Bradlaugh'
        if brand == 'boom' and 'halloween' in event['title'].lower():
            # Town in the title (board F02): "Halloween House Party Northampton, Sat 31st Oct | Boombastic".
            title = f'{event_name(event)} {event["city"]}, {d_short(event["start"])}'
            if len(title + ' | Boombastic') <= 60:
                title += ' | Boombastic'
    elif meta:
        title = meta['title']
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
    better = (meta or {}).get('description') or DESCRIPTIONS.get((brand, route))
    if better:
        description = better
        content = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{esc(better)}">', content, count=1)
        content = re.sub(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{esc(better)}">', content, count=1)
    schema = []
    host = 'the2pmclub.co.uk' if brand == 'pm' else 'boomevents.co.uk'
    site_url = f'https://www.{host}/'
    org_id = site_url + '#organization'
    page_url = base + route
    if route == '/':
        org = {'@context': 'https://schema.org', '@type': 'Organization', '@id': org_id, 'name': site, 'url': site_url,
               'logo': base + ('/assets/pm-logo.png' if brand == 'pm' else '/assets/boom-logo.png'),
               'description': ORG_DESCRIPTION[brand], 'email': EMAIL,
               'areaServed': [{'@type': 'City', 'name': c} for c in (sorted(verified_places('boom')) if brand == 'boom' else sorted({e['city'] for e in CURRENT_EVENTS[brand]}))],
               'sameAs': [url for _, url, _ in SOCIAL[brand]]}
        if brand == 'pm':
            org['parentOrganization'] = {'@type': 'Organization', '@id': 'https://www.boomevents.co.uk/#organization',
                                         'name': 'Boombastic Events', 'url': 'https://www.boomevents.co.uk/'}
        else:
            org['foundingDate'] = '2014'
            org['subOrganization'] = {'@type': 'Organization', '@id': 'https://www.the2pmclub.co.uk/#organization',
                                      'name': 'THE 2PM CLUB', 'url': 'https://www.the2pmclub.co.uk/'}
        schema.append(org)
        schema.append({'@context': 'https://schema.org', '@type': 'WebSite', '@id': site_url + '#website', 'name': site,
                       'url': site_url, 'inLanguage': 'en-GB', 'publisher': {'@id': org_id}})
    if event:
        address = event.get('address') or {}
        place = {'@type': 'Place', 'name': event['venue']}
        if brand == 'boom':
            place = {'@type': 'Place', '@id': site_url + '#place-' + slug(event['venue']), 'name': event['venue']}
        if address:
            place['address'] = {'@type': 'PostalAddress', **{k: v for k, v in address.items()
                                if k in ('streetAddress', 'addressLocality', 'addressRegion', 'postalCode', 'addressCountry') and v}}
            if brand == 'boom' and event['city'] in REGION:
                place['address'].setdefault('addressRegion', REGION[event['city']])
        item = {'@context': 'https://schema.org', '@type': 'Event',
                'name': event['title'], 'description': description,
                'startDate': schema_time(event['start']), 'endDate': schema_time(event['end']),
                'eventAttendanceMode': 'https://schema.org/OfflineEventAttendanceMode',
                'eventStatus': 'https://schema.org/EventScheduled',
                'location': place, 'image': [base + event['poster']],
                'organizer': {'@type': 'Organization', '@id': org_id, 'name': site, 'url': site_url},
                'url': page_url}
        if event['fmt'] == 'nye':
            item['image'].append(base + '/assets/nye-2026-social.webp')
        amount = price_amount(event.get('price'))
        if amount:
            # The page's own "from" price. Booking fees are added at Eventbrite checkout, as the page states.
            # Price stays the page's own "from" price; whether to include the Eventbrite fee is pending JD.
            item['offers'] = {'@type': 'Offer', 'url': page_url, 'price': amount, 'priceCurrency': 'GBP',
                              'availability': 'https://schema.org/SoldOut' if event.get('soldout') else 'https://schema.org/InStock'}
            if brand == 'boom' and event.get('saleStartsAt'):
                item['offers']['validFrom'] = event['saleStartsAt']
        if brand == 'boom':
            # No DJ is named in the feed, so performer is omitted rather than invented.
            item = {'@context': item['@context'], '@type': 'Event', '@id': page_url + '#event', **{k: v for k, v in item.items() if k not in ('@context', '@type')}}
            age = is_adult(event)
            if age is True: item['typicalAgeRange'] = '18-'
            elif event['fmt'] == 'fsd': item['typicalAgeRange'] = '4-'
            series = event_series_routes(event)
            if series:
                refs = [{'@id': BOOM_BASE + r + '#series'} for r in series]
                item['superEvent'] = refs[0] if len(refs) == 1 else refs
        schema.append(item)
        listing_route = '/events/' if brand == 'pm' else '/whats-on/'
        crumbs = ([('Home', site_url), ('What’s on', base + listing_route)] if brand == 'pm'
                  else [('Home', site_url), ('Locations', base + '/locations/'), (event['city'], base + city_url('boom', event['city']))])
        crumbs.append((clean_title(event), page_url))
        schema.append({'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': u} for i, (n, u) in enumerate(crumbs)]})
    elif route != '/':
        parts = route.strip('/').split('/')
        if len(parts) > 1:
            parent = '/' + parts[0] + '/'
            schema.append({'@context': 'https://schema.org', '@type': 'BreadcrumbList',
                           'itemListElement': [
                               {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': base + '/'},
                               {'@type': 'ListItem', 'position': 2, 'name': parts[0].replace('-', ' ').title(), 'item': base + parent},
                               {'@type': 'ListItem', 'position': 3, 'name': short_title, 'item': base + route}]})
    if route.startswith('/blog/') and route != '/blog/':
        h1 = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.S)
        img = re.search(r'<meta property="og:image" content="([^"]+)"', content)
        schema.append({'@context': 'https://schema.org', '@type': 'Article', 'headline': plain_text(h1.group(1)) if h1 else short_title,
                       'description': description, 'mainEntityOfPage': page_url, 'inLanguage': 'en-GB',
                       **({'image': [img.group(1)]} if img else {}),
                       'author': {'@type': 'Organization', '@id': org_id, 'name': site},
                       'publisher': {'@type': 'Organization', '@id': org_id, 'name': site}})
    if not event and 'id="nearby"' not in content:
        # Listing pages: an ordered list of the event pages shown, so answer engines can follow each date.
        hrefs = []
        for a, b in re.findall(r'<a class="(?:poster|row-poster)" href="([^"]+)"|<a class="date-row" data-date="[^"]*" href="([^"]+)"', content):
            h = a or b
            full = h if h.startswith('http') else base + h
            if full not in hrefs: hrefs.append(full)
        if hrefs:
            schema.append({'@context': 'https://schema.org', '@type': 'ItemList', 'name': short_title,
                           'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'url': u} for i, u in enumerate(hrefs)]})
    schema += EXTRA_SCHEMA.get((brand, route), [])
    faqs = re.findall(r'<details class="acc"[^>]*><summary>(.*?)</summary><div class="acc-body"><p>(.*?)</p></div></details>', content, re.S)
    if faqs:
        schema.append({'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
            {'@type': 'Question', 'name': plain_text(q), 'acceptedAnswer': {'@type': 'Answer', 'text': plain_text(a)}} for q, a in faqs]})
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
    target.write_text(version_assets(seo_enrich(brand, path, content)))


_VERSIONS = {}


def asset_version(url):
    """Short content hash for a /assets/ file, so it can be cached for a year and still refresh on change."""
    name = url.split('/assets/', 1)[1]
    if name not in _VERSIONS:
        src = HERE / name if name in ('site.css', 'site.js', 'consent.js') else HERE / 'assets' / name
        _VERSIONS[name] = hashlib.sha256(src.read_bytes()).hexdigest()[:10] if src.exists() else ''
    return _VERSIONS[name]


def version_assets(content):
    """Add ?v=<hash> to every /assets/ reference except the font, which site.css loads by its plain URL."""
    def one(url):
        if url.endswith('.woff2') or '?' in url: return url
        v = asset_version(url)
        return f'{url}?v={v}' if v else url
    content = re.sub(r'((?:src|href)=")(/assets/[^"?#]+)(")', lambda m: m.group(1) + one(m.group(2)) + m.group(3), content)
    return re.sub(r'srcset="([^"]+)"', lambda m: 'srcset="' + re.sub(r'/assets/[^\s,?]+', lambda n: one(n.group(0)), m.group(1)) + '"', content)


def provenance(all_events):
    rows = []
    for name, (alt, cap, src) in PHOTOS.items():
        p = HERE / 'assets' / name
        rows.append(dict(file=name, caption=cap, alt=alt, source=src, sha256=hashlib.sha256(p.read_bytes()).hexdigest() if p.exists() else None))
    posters = [dict(event=e['code'], file=e['poster'], source=e['image'], sha256=hashlib.sha256((HERE / e['poster'].lstrip('/')).read_bytes()).hexdigest() if e['poster'].startswith('/assets/') else None) for e in all_events]
    (HERE / 'V2-ASSET-PROVENANCE.json').write_text(json.dumps(dict(photos=rows, posters=posters, boom_base=BOOM_BASE, pm_base=PM_BASE), indent=1))


def case_variants(src, dest, status='301!'):
    """Old links arrive in either case, with or without a trailing slash: emit every form."""
    out = []
    for base in dict.fromkeys([src.rstrip('/'), src.rstrip('/').lower(), src.rstrip('/').upper().replace('/EVENTS/', '/events/').replace('/EVENT/', '/event/')]):
        out += [f'{base} {dest} {status}', f'{base}/ {dest} {status}', f'{base}/* {dest} {status}']
    return list(dict.fromkeys(out))


GONE_EVENT_CODES = ('250126-GR-NPTON', '260626-GR-NPTON')  # retired GET READY one-off dates
GONE_LEGACY = ('/events/get-ready-60s-70s-motown-soul-disco-sunday-matinee-special',)


def gone_paths():
    paths = []
    for code in GONE_EVENT_CODES:
        for form in dict.fromkeys([code.lower(), code]):
            paths += [f'/event/{form}', f'/event/{form}/', f'/event/{form}/*']
    for legacy in GONE_LEGACY:
        paths += [legacy, legacy + '/', legacy + '/*']
    return paths


def pm_dest(code, pm_by_code):
    code = code.lower()
    if code in pm_by_code:
        return PM_BASE + pm_by_code[code]['path']
    city = CITY_CODE.get(code.split('-')[-1].upper())
    return PM_BASE + '/hubs/' + slug(city) + '/' if city else PM_BASE + '/events/'


def gone_page(brand):
    body = ('<section class="page-band"><div class="container"><p class="eyebrow">Event finished</p><h1>THAT EVENT HAS ENDED.</h1>'
            '<p>This party has finished and will not be coming back. See what is on now.</p>' + btn('See what’s on', '/whats-on/') + '</div></section>')
    html_ = page(brand, 'Event ended', body, 'This event has finished.')
    return html_.replace('<meta charset="utf-8">', '<meta charset="utf-8"><meta name="robots" content="noindex">', 1)


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
        rows += ['/saintsfsd /404.html 404!',
                 '/saintsfsd/ /404.html 404!',
                 '/SAINTSFSD /404.html 404!',
                 '/SAINTSFSD/ /404.html 404!',
                 '/SaintsFSD /404.html 404!',
                 '/SaintsFSD/ /404.html 404!',
                 '/faqs/ /faq/ 301!',
                 '/event/061226-fsd-npton/ /event/121226-fsd-npton/ 301!',
                 '/event/061226-fsd-npton /event/121226-fsd-npton/ 301!',
                 '/event/061226-FSD-NPTON/ /event/121226-fsd-npton/ 301!',
                 '/event/061226-FSD-NPTON /event/121226-fsd-npton/ 301!',
                 '/events/christmas-silent-disco-northampton/* /silent-disco/ 301!',
                 '/events/the-2pm-club-northampton-christmas-daytime-disco/* https://www.the2pmclub.co.uk/hubs/northampton/ 301!',
                 '/events/boombastics-christmas-decades-party-northampton/* /whats-on/ 301!',
                 '/events/christmas-family-silent-disco-northampton/* /family-silent-disco/ 301!',
                 '/events/the-2pm-club-milton-keynes-christmas-daytime-disco/* https://www.the2pmclub.co.uk/hubs/milton-keynes/ 301!',
                 '/events/the-2pm-club-bedford-christmas-daytime-disco/* https://www.the2pmclub.co.uk/hubs/bedford/ 301!',
                 # GET READY is retired (it only ran in Northampton): the brand hub goes to the Northampton
                 # town page and its past one-off event URLs answer 410 Gone from a small gone page.
                 '/get-ready /locations/northampton/ 301!', '/get-ready/ /locations/northampton/ 301!', '/get-ready/* /locations/northampton/ 301!',
                 *[f'{src} /gone.html 410!' for src in gone_paths()],
                 # Indexed URLs that returned 404 (research 12th October 2026), restored to their nearest live page.
                 '/tickets /whats-on/ 301!', '/tickets/ /whats-on/ 301!',
                 *case_variants('/events/family-silent-disco-halloween-party-bedford', '/family-silent-disco/'),
                 *case_variants('/event/061225-DEC-NPTON', '/locations/northampton/'),
                 *case_variants('/events/the-2pm-club-northampton-80s-90s-00s-daytime-disco', PM_BASE + '/hubs/northampton/'),
                 '/events/the-2pm-club-luton-80s-90s-00s-daytime-disco/* https://www.the2pmclub.co.uk/hubs/luton/ 301!',
                 '/event/the-2pm-club-bedford-80s-90s-00s-daytime-disco https://www.the2pmclub.co.uk/hubs/bedford/ 301!',
                 '/event/the-2pm-club-bedford-80s-90s-00s-daytime-disco/* https://www.the2pmclub.co.uk/hubs/bedford/ 301!',
                 *case_variants('/event/071225-FSD-NPTON', '/locations/northampton/'),
                 *case_variants('/event/210326-SD-NPTON', '/locations/northampton/'),
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
            if any(row.split()[0] == f'/event/{code}' for row in rows):
                continue
            # One hop only: a current 2PM date goes to its 2PM page, any ended or moved date straight to its city hub.
            # (250726-2PM-NPTON moved to 3rd October, which has also now passed, so it lands on the Northampton hub.)
            rows += case_variants(f'/event/{code}', pm_dest(code, pm_by_code))
        listed = {row.split()[0].lower() for row in rows}
        for raw in BOOM_ALL:
            code = str(raw.get('eventCode') or '').lower()
            if '-2pm-' in code and f'/event/{code}' not in listed:
                rows += case_variants(f'/event/{code}', pm_dest(code, pm_by_code))
        for e in events:
            src = '/events/' + e['code'].lower()
            rows += [f'{src} {e["path"]} 301!', f'{src}/ {e["path"]} 301!']
        rows += ['/.env* /404.html 404!', '/.env/* /404.html 404!',
                 '/.git/* /404.html 404!', '/.DS_Store /404.html 404!']
    for e in events:
        if e['brand'] != brand: continue
        if brand == 'boom':
            # Rewrite to the ticket function so incoming utm_* tags survive alongside aff=BoomWeb (F12).
            rows.append(f'/tickets/{e["code"].lower()}/ /.netlify/functions/tickets/{e["code"].lower()} 200!')
        else:
            rows.append(f'/tickets/{e["code"].lower()}/ https://www.eventbrite.co.uk/e/{e["eventbriteId"]}?aff=BoomWeb 302!')
    rows += past_event_redirects(brand, rows)
    if brand == 'boom' and not christmas_events(events):
        rows += ['/christmas-parties/ /whats-on/ 302!', '/christmas-parties /whats-on/ 302!']
    if brand == 'boom':
        for key, city in TOWN_FORMAT_PAGES:
            if (key, city) not in TOWN_FORMAT_LIVE:
                rows += [f'/{key}/{slug(city)}/ /{key}/ 302!', f'/{key}/{slug(city)} /{key}/ 302!']
    if brand == 'boom' and not halloween_events(events):
        rows += ['/halloween/ /whats-on/ 302!', '/halloween /whats-on/ 302!']
    # An unknown URL should return a real 404, never an old React shell.
    rows.append('/* /404.html 404')
    return rows


def llms_txt(brand, events):
    """Plain-text site summary for AI tools, regenerated on every build from the same feed as the pages."""
    pm = brand == 'pm'
    base = PM_BASE if pm else BOOM_BASE
    site = 'THE 2PM CLUB' if pm else 'Boombastic Events'
    out = [f'# {site}', '', f'> {ORG_DESCRIPTION[brand]}', '',
           f'Updated {d_long(TODAY + "T00:00:00")}. Dates, venues, prices and availability come from the live event feed and change as tickets sell. '
           'A "from" price is the lowest current ticket price; Eventbrite booking fees are added at checkout. Check the event page before travelling.', '',
           '## Upcoming dates', '']
    for e in events:
        url = e['path'] if e['path'].startswith('http') else base + e['path']
        bits = [f"{d_long(e['start'])}, {times(e)}", f"{e['venue']}, {e['city']}"]
        if e.get('soldout'):
            bits.append('Sold out')
        elif e.get('price'):
            bits.append(f"{price_label(e['price'])} plus booking fee")
        out.append(f"- [{clean_title(e)}]({url}): " + '. '.join(bits) + '.')
    if not events:
        out.append('- No dates on sale right now.')
    out += ['', '## Pages', '']
    if pm:
        out += [f'- [About THE 2PM CLUB]({base}/about/)', f'- [What to expect]({base}/what-to-expect/)', f'- [All dates and tickets]({base}/events/)',
                f'- [Locations]({base}/hubs/)', f'- [FAQs]({base}/faqs/)', f'- [What is a daytime disco?]({base}/blog/what-is-a-daytime-disco/)',
                f'- [Group bookings]({base}/group-bookings/)', f'- [Run by Boombastic Events]({BOOM_BASE}/)']
    else:
        out += [f'- [About Boombastic Events]({base}/about/)', f'- [All dates and tickets]({base}/whats-on/)', f'- [Locations]({base}/locations/)',
                f'- [FAQs]({base}/faq/)', f'- [Silent Disco Greatest Hits]({base}/silent-disco/)', f'- [Family Silent Disco]({base}/family-silent-disco/)',
                f'- [Boombastic 90s]({base}/boombastic-90s/)', f'- [Footloose 80s]({base}/footloose-80s/)', f'- [Group bookings]({base}/group-bookings/)',
                *([f'- [Halloween parties]({base}/halloween/)'] if halloween_events(events) else []),
                *([f'- [Christmas parties]({base}/christmas-parties/)'] if christmas_events(events) else []),
                f'- [THE 2PM CLUB daytime disco]({PM_BASE}/)']
    out += ['', '## Data', '', f'- [Event feed (JSON)]({base}/{"events.json" if pm else "events-boombastic.json"})']
    if pm:
        out.append(f'- [Upcoming event feed (JSON)]({base}/upcoming-events.json)')
    else:
        out.append(f'- [Venues (JSON)]({base}/venues.json)')
    out += [f'- [Sitemap]({base}/sitemap.xml)', '', '## Contact', '', f'- {EMAIL}', '']
    return '\n'.join(out)


def past_event_redirects(brand, existing):
    """Finished or cancelled dates: send their old URLs somewhere useful instead of a dead page."""
    seen = {r.split()[0].lower() for r in existing if r.strip()}
    current = {e['path'].lower() for e in CURRENT_EVENTS[brand] if e['brand'] == brand}
    hubs = set(verified_places('pm')) if brand == 'pm' else set()
    rows = []
    for raw in (PM if brand == 'pm' else BOOM_ALL):
        if brand == 'boom' and ('2PM' in raw['title'].upper() or str(raw.get('eventCode')) in GONE_EVENT_CODES):
            continue
        code = str((raw.get('slug') if brand == 'pm' else raw.get('eventCode')) or '')
        if not code:
            continue
        path = f'/events/{code.lower()}/' if brand == 'pm' else f'/event/{code.lower()}/'
        if path in current or (raw['start'][:10] >= TODAY and not raw.get('isCancelled')):
            continue
        if brand == 'pm':
            city = CITY_CODE.get(raw.get('cityCode'), raw.get('cityCode'))
            dest = city_url('pm', city) if city in hubs else '/events/'
        else:
            # Ended Boombastic dates go to their town page, which lists what is on there now (board F06).
            city = raw.get('city')
            dest = city_url('boom', city) if city in verified_places('boom') else '/whats-on/'
        if brand == 'boom':
            if path.rstrip('/').lower() not in seen:
                rows += case_variants(path, dest)
                seen.update(r.split()[0].lower() for r in rows)
            continue
        for src in (path, path.rstrip('/')):
            if src.lower() not in seen:
                rows.append(f'{src} {dest} 301!')
                seen.add(src.lower())
    return list(dict.fromkeys(rows))


def public_feed():
    """events-boombastic.json as published: upcoming, not cancelled, start and end with their UK offset."""
    out = []
    for raw in BOOM:
        if raw['start'][:10] < TODAY or raw.get('isCancelled'):
            continue
        item = dict(raw)
        item['start'], item['end'] = schema_time(raw['start']), schema_time(raw['end'])
        out.append(item)
    return sorted(out, key=lambda r: r['start'])


def venues_feed(events):
    """venues.json regenerated from the event registry: one entry per venue, with address, town page and live URLs.

    Retired venues and formats are left out (The Picturedrome, GET READY)."""
    retired_venues = {'The Picturedrome'}
    cities = {}
    for raw in BOOM_ALL:
        venue, city = raw.get('venue'), raw.get('city')
        if not venue or not city or venue in retired_venues or str(raw.get('eventCode')) in GONE_EVENT_CODES:
            continue
        c = cities.setdefault(city, {'city': city, 'townPage': BOOM_BASE + city_url('boom', city), 'venues': {}})
        v = c['venues'].setdefault(venue, {'name': venue, 'address': None, 'upcomingEvents': [], 'pastEventCount': 0})
        if raw.get('venueAddress') and not v['address']:
            v['address'] = {k: raw['venueAddress'][k] for k in ('streetAddress', 'addressLocality', 'postalCode', 'addressCountry') if raw['venueAddress'].get(k)}
        if raw['start'][:10] < TODAY or raw.get('isCancelled'):
            v['pastEventCount'] += 1
    for e in events:
        if e['venue'] in retired_venues or e['city'] not in cities or e['venue'] not in cities[e['city']]['venues']:
            continue
        url = e['path'] if e['path'].startswith('http') else BOOM_BASE + e['path']
        cities[e['city']]['venues'][e['venue']]['upcomingEvents'].append(
            {'name': event_name(e), 'title': e['title'], 'start': schema_time(e['start']), 'url': url, 'soldOut': bool(e.get('soldout'))})
    return {'updated': TODAY, 'description': 'Venues Boombastic Events uses or has used, with addresses where published and links to current dates.',
            'cities': [dict(c, venues=sorted(c['venues'].values(), key=lambda v: v['name'])) for _, c in sorted(cities.items())]}


def build():
    global CURRENT_EVENTS
    boom, pm = normalized()
    all_events = {e['code']: e for e in boom + pm}
    errors = install_assets(all_events.values())
    for e in boom + pm: e['poster'] = all_events[e['code']]['poster']
    CURRENT_EVENTS = {'boom': boom, 'pm': pm}
    TOWN_FORMAT_LIVE.clear()
    TOWN_FORMAT_LIVE.update((k, c) for k, c in TOWN_FORMAT_PAGES
                            if any(e['brand'] == 'boom' and e['city'] == c and e['fmt'] in NIGHT_FMTS[k] for e in boom))
    build_formats()
    for brand, events in CURRENT_EVENTS.items():
        dist = OUTPUT_ROOT / ('dist-2pm' if brand == 'pm' else 'dist-boom')
        if dist.exists(): shutil.rmtree(dist)
        (dist / 'assets').mkdir(parents=True)
        for f in (HERE / 'assets').iterdir():
            if f.is_file() and not any(code.lower() in f.name.lower() for code in WITHDRAWN_EVENT_CODES):
                shutil.copyfile(f, dist / 'assets' / f.name)
        shutil.copyfile(HERE / 'site.css', dist / 'assets/site.css')
        shutil.copyfile(HERE / 'site.js', dist / 'assets/site.js')
        for f in (HERE / 'icons' / brand).iterdir():
            if f.is_file(): shutil.copyfile(f, dist / f.name)
        (dist / 'site.webmanifest').write_text(json.dumps({
            'name': 'THE 2PM CLUB' if brand == 'pm' else 'Boombastic Events',
            'short_name': '2PM CLUB' if brand == 'pm' else 'Boombastic',
            'start_url': '/', 'display': 'standalone', 'background_color': '#080808', 'theme_color': '#080808',
            'icons': [{'src': '/icon-192.png', 'sizes': '192x192', 'type': 'image/png'},
                      {'src': '/icon-512.png', 'sizes': '512x512', 'type': 'image/png'}]}, indent=1) + '\n')
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
            for key, city in sorted(TOWN_FORMAT_LIVE): write_page(dist, f'{key}/{slug(city)}', town_format_page(key, city, events))
            if christmas_events(events): write_page(dist, 'christmas-parties', christmas_page(brand, events))
            if halloween_events(events): write_page(dist, 'halloween', halloween_page(brand, events))
        write_page(dist, 'about', about_page(brand, events))
        write_page(dist, 'group-bookings', groups_page(brand, events))
        write_page(dist, 'faqs', faq_page(brand))
        write_page(dist, 'contact', contact_page(brand))
        for route in ('index', 'venues', 'content-creators', 'enquire'):
            path = 'work-with-us' + ('/' + route if route != 'index' else '')
            write_page(dist, path, render_partnership_page(brand, route, page, hero, photo, events, BOOM_BASE, PM_BASE))
        if brand == 'boom': write_page(dist, 'faq', faq_page(brand))
        if brand == 'pm':
            for route in ('/blog/hen-do-daytime-disco/', '/blog/hen-party-ideas-northampton/', '/blog/birthday-party-ideas-northampton-adults/', '/blog/why-daytime-discos-are-popular/'):
                write_page(dist, route, fresh_blog_page(route))
            write_page(dist, 'blog', blog_index())
            write_page(dist, 'blog/what-is-a-daytime-disco', blog_daytime_guide())
        for key in (['privacy', 'terms', 'for-ai'] if brand == 'pm' else ['privacy', 'terms', 'jobs', 'for-ai']):
            write_page(dist, key, official_content_page(brand, key))
        if brand == 'boom':
            for role in ('dj', 'event-assistant'):
                write_page(dist, 'jobs/' + role, render_recruitment_page(page, role))
        if brand == 'pm': shutil.copyfile(PM_FEED, dist / 'events.json')
        else:
            (dist / 'events-boombastic.json').write_text(json.dumps(public_feed(), ensure_ascii=False, indent=2) + '\n')
            (dist / 'venues.json').write_text(json.dumps(venues_feed(events), ensure_ascii=False, indent=2) + '\n')
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
            (dist / 'llms.txt').write_text(llms_txt(brand, events))
            (dist / f'{INDEXNOW_KEY}.txt').write_text(INDEXNOW_KEY)
            aliases = {'whats-on', 'locations'} if brand == 'pm' else {'faqs'}
            routes = sorted('/' + str(f.parent.relative_to(dist)).replace('.', '').strip('/') + '/' for f in dist.rglob('index.html'))
            routes = [r.replace('//', '/') for r in routes if r.strip('/') not in aliases]
            sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'  <url><loc>{base}{r}</loc></url>\n' for r in routes) + '</urlset>\n'
            (dist / 'sitemap.xml').write_text(sitemap)
            (dist / 'robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: {base}/sitemap.xml\n')
            # /assets/ references in the HTML carry ?v=<content hash>, so they can be cached for a year.
            (dist / '_headers').write_text('/*\n  X-Content-Type-Options: nosniff\n'
                                           '/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n'
                                           '/site.webmanifest\n  Content-Type: application/manifest+json\n')
            redirects = release_redirects(brand, events)
            if brand == 'boom':
                ticket_map = {e['code'].lower(): str(e['eventbriteId']) for e in events if e['brand'] == 'boom'}
                (TWIN / 'netlify/functions/tickets/ticket-map.mjs').write_text(
                    '// Generated by v2/build/build.py from the event feed. Do not edit by hand.\n'
                    'export default ' + json.dumps(ticket_map, indent=2) + ';\n')
            (dist / '_redirects').write_text('\n'.join(redirects) + '\n')
        else:
            (dist / 'robots.txt').write_text('User-agent: *\nDisallow: /\n')
            (dist / '_headers').write_text('/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  X-Content-Type-Options: nosniff\n')
        (dist / '404.html').write_text(not_found(brand))
        if brand == 'boom': (dist / 'gone.html').write_text(gone_page(brand))
        print(brand, len(list(dist.rglob('index.html'))), 'pages')
    provenance(all_events.values())
    print('poster errors', len(errors))


if __name__ == '__main__': build()
