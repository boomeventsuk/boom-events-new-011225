#!/usr/bin/env python3
"""Make the smaller WebP copies the build uses in srcset (posters at 600px, photos at 800px).

Run locally after adding a poster or photo:  python3 v2/build/make-responsive.py
Needs Pillow. The build only references copies that exist, so a missing copy just means no srcset.
"""
from pathlib import Path
from PIL import Image

ASSETS = Path(__file__).resolve().parent / 'assets'
for f in sorted(ASSETS.iterdir()):
    stem, ext = f.stem, f.suffix.lower()
    if stem.endswith(('-600', '-800')) or ext not in ('.jpg', '.jpeg', '.webp', '.png'):
        continue
    if f.name.startswith('poster-'):
        if ext != '.webp' and (ASSETS / (stem + '.webp')).exists():
            continue
        target, width = ASSETS / (stem + '-600.webp'), 600
    elif ext in ('.jpg', '.jpeg') or f.name == 'pm-hero.webp':
        target, width = ASSETS / (stem + '-800.webp'), 800
    else:
        continue
    if target.exists():
        continue
    im = Image.open(f)
    if im.width <= width:
        continue
    im = im.convert('RGB')
    im.resize((width, round(im.height * width / im.width)), Image.LANCZOS).save(target, 'WEBP', quality=78, method=6)
    print('made', target.name)
