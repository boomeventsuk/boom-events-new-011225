#!/usr/bin/env python3
"""Event structured-data guard (added 16th October 2026 after Google Search Console
critical alerts: Event missing name, startDate and location).

Fails if, in any built page's JSON-LD:
  1. an Event instance (Event or any Event subtype except EventSeries) has an empty or
     missing name, startDate or location;
  2. a subEvent, subEvents, superEvent, event or events value is a thin reference
     ({"@id": ...} only) or otherwise not a complete object. Google reads a thin reference
     in an Event-typed property as a separate, incomplete Event;
  3. a standalone EventSeries has an empty or missing name.
Standalone EventSeries blocks are allowed without startDate and location; Google's Rich
Results Test settles whether Google accepts them.

Usage:
  check-event-schema.py DIST [--event-pages REGEX] [--expect-events N]
    --event-pages: every built page whose path matches REGEX must carry at least one
    complete Event instance (the event detail pages).
  check-event-schema.py --self-test
"""
import glob
import json
import re
import sys

EVENT_INSTANCE_TYPES = {
    'Event', 'BusinessEvent', 'ChildrensEvent', 'ComedyEvent', 'CourseInstance', 'DanceEvent',
    'DeliveryEvent', 'EducationEvent', 'ExhibitionEvent', 'Festival', 'FoodEvent', 'Hackathon',
    'LiteraryEvent', 'MusicEvent', 'PublicationEvent', 'SaleEvent', 'ScreeningEvent', 'SocialEvent',
    'SportsEvent', 'TheaterEvent', 'VisualArtsEvent',
}
SERIES_TYPES = {'EventSeries'}
EVENT_PROPS = {'subEvent', 'subEvents', 'superEvent', 'event', 'events'}
REQUIRED = ('name', 'startDate', 'location')
LD_RE = re.compile(r'<script type="application/ld\+json">(.*?)</script>', re.S)


def blank(v):
    if v is None:
        return True
    if isinstance(v, str):
        return not v.strip()
    if isinstance(v, (list, dict)):
        return len(v) == 0
    return False


def location_ok(v):
    if isinstance(v, list):
        return bool(v) and all(location_ok(x) for x in v)
    if isinstance(v, dict):
        return not blank(v.get('name')) or not blank(v.get('address'))
    return not blank(v)


def types_of(o):
    t = o.get('@type')
    return set(t if isinstance(t, list) else [t]) if t else set()


def check_doc(doc, page, stats):
    problems = []

    def walk(o, path, via):
        if isinstance(o, list):
            for i, v in enumerate(o):
                walk(v, f'{path}[{i}]', via)
            return
        if not isinstance(o, dict):
            if via in EVENT_PROPS:
                problems.append(f'{page}: {path} {via} is a bare value, not an Event object')
            return
        ts = types_of(o)
        if via in EVENT_PROPS and set(o) <= {'@id', '@type'}:
            problems.append(f'{page}: {path} thin {via} reference {json.dumps(o)[:100]}')
        is_instance = bool(ts & EVENT_INSTANCE_TYPES)
        is_series = bool(ts & SERIES_TYPES) and not is_instance
        if is_instance or (via in EVENT_PROPS and not is_series and not set(o) <= {'@id', '@type'}):
            missing = [k for k in REQUIRED if (blank(o.get(k)) if k != 'location' else not location_ok(o.get(k)))]
            if missing:
                problems.append(f'{page}: {path} Event missing or empty {missing}')
            elif is_instance:
                stats['events'] += 1
        if is_series:
            if blank(o.get('name')):
                problems.append(f'{page}: {path} EventSeries missing or empty name')
            stats['series'] += 1
        for k, v in o.items():
            walk(v, f'{path}.{k}', k)

    walk(doc, '$', None)
    return problems


def check_html(html, page, stats):
    problems = []
    for block in LD_RE.findall(html):
        try:
            doc = json.loads(block)
        except Exception as e:
            problems.append(f'{page}: JSON-LD does not parse ({e})')
            continue
        problems += check_doc(doc, page, stats)
    return problems


def self_test():
    good_event = {'@type': 'Event', 'name': 'X', 'startDate': '2026-12-12T11:00:00+00:00',
                  'location': {'@type': 'Place', 'name': 'The Charles Bradlaugh'}}
    cases = {
        'thin subEvent': {'@type': 'EventSeries', 'name': 'S', 'subEvent': [{'@id': 'https://e/#event'}]},
        'thin superEvent': dict(good_event, superEvent={'@id': 'https://e/#series'}),
        'empty name': dict(good_event, name='  '),
        'missing location': {k: v for k, v in good_event.items() if k != 'location'},
        'empty location object': dict(good_event, location={}),
        'subtype missing startDate': {'@type': 'MusicEvent', 'name': 'X', 'location': {'name': 'V'}},
        'series without name': {'@type': 'EventSeries', 'name': ''},
    }
    ok = True
    for name, doc in cases.items():
        stats = {'events': 0, 'series': 0}
        caught = bool(check_doc(doc, 'self-test', stats))
        print(('CAUGHT ' if caught else 'MISSED ') + name)
        ok &= caught
    for name, doc in {'valid event': good_event,
                      'standalone series': {'@type': 'EventSeries', 'name': 'Silent Disco Greatest Hits'}}.items():
        stats = {'events': 0, 'series': 0}
        clean = not check_doc(doc, 'self-test', stats)
        print(('ACCEPTED ' if clean else 'WRONGLY REJECTED ') + name)
        ok &= clean
    print('EVENT-SCHEMA-SELF-TEST', 'PASS' if ok else 'FAIL')
    return ok


def main(argv):
    if '--self-test' in argv:
        return 0 if self_test() else 1
    dist = argv[1]
    expect = int(argv[argv.index('--expect-events') + 1]) if '--expect-events' in argv else None
    page_re = re.compile(argv[argv.index('--event-pages') + 1]) if '--event-pages' in argv else None
    detail_pages = 0
    stats = {'events': 0, 'series': 0}
    problems, pages = [], 0
    for path in sorted(glob.glob(dist.rstrip('/') + '/**/*.html', recursive=True)):
        html = open(path, encoding='utf-8', errors='ignore').read()
        rel = path[len(dist.rstrip('/')):]
        before = stats['events']
        if LD_RE.search(html):
            pages += 1
            problems += check_html(html, rel, stats)
        if page_re and page_re.search(rel):
            detail_pages += 1
            if stats['events'] == before:
                problems.append(f'{rel}: event detail page has no complete Event instance')
    if page_re and detail_pages == 0:
        problems.append(f'no event detail pages matched {page_re.pattern}')
    if expect is not None and stats['events'] != expect:
        problems.append(f'expected {expect} complete Event instances, found {stats["events"]}')
    print(f'event detail pages {detail_pages if page_re else "n/a"}; pages with JSON-LD {pages}; complete Event instances {stats["events"]}; standalone EventSeries {stats["series"]}; problems {len(problems)}')
    for p in problems[:40]:
        print('  FAIL', p)
    print('CHECK-EVENT-SCHEMA', 'PASS' if not problems else 'FAIL')
    return 0 if not problems else 1


if __name__ == '__main__':
    sys.exit(main(sys.argv))
