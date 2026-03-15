// Supabase Edge Function: serves event-specific OG meta tags for social crawlers
// Called by Netlify edge function proxy for WhatsApp, Facebook, Twitter etc.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SITE_URL = 'https://boomevents.co.uk';
const EVENTS_CDN_URL = 'https://boom-bash-brief.lovable.app/events-boombastic.json';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');

    if (!slug) {
      return new Response(JSON.stringify({ error: 'Missing slug parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    // Fetch event data
    const res = await fetch(EVENTS_CDN_URL);
    if (!res.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch events' }), {
        status: 502,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const events = await res.json();
    const slugKey = normalize(slug);
    const event = events.find((ev: Record<string, unknown>) => {
      const candidates = [ev?.eventCode, ev?.slug, ev?.eventbriteId].filter(Boolean);
      return candidates.some((candidate) => normalize(String(candidate)) === slugKey);
    });

    if (!event) {
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const title = sanitize(String(event.title || 'Boombastic Event'));
    const description = sanitize(String(event.description || event.subtitle || '')).slice(0, 200);
    const image = String(event.image || '');
    const canonical = `${SITE_URL}/event/${slug}`;

    const html = `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<title>${esc(title)} | Boombastic Events</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="event">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:image:secure_url" content="${esc(image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:site_name" content="Boombastic Events">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
</head>
<body>
<h1>${esc(title)}</h1>
<p>${esc(description)}</p>
<p><a href="${esc(canonical)}">View event</a></p>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        ...corsHeaders,
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=300',
      },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function sanitize(s: string): string {
  return s.replace(/[\r\n]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
