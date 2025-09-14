LOVABLE ONE-SHOT PATCH — USAGE

Paste these files into your repo as shown.

Commit and push. The script will run automatically on `npm install` (postinstall).

For best results, set Lovable build command to:
npm run build
(This now runs: generate-event-pages -> vite build)

After deploy, open:
- /geo-seo-validation-report.md (summary)
- /sitemap.xml and /robots.txt
- any /events/<slug>/ and View Source: JSON-LD should include timezone (+01:00/+00:00), offers.url, no "TBA" price (numeric or omitted), venue in location.name and city in addressLocality.

If SITE_URL isn't https://boomevents.co.uk, set env var SITE_URL in Lovable or edit scripts.