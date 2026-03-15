// Netlify Edge Function: thin proxy that detects social crawlers
// and forwards to Lovable Cloud backend function for OG meta tags

const CRAWLER_UA = /facebookexternalhit|Facebot|Twitterbot|WhatsApp|LinkedInBot|Slackbot|TelegramBot|Discordbot|Pinterest|Googlebot/i;

const SUPABASE_URL = 'https://loizstloeokvkfuooakm.supabase.co';

export default async function handler(request: Request, context: any) {
  const ua = request.headers.get('user-agent') || '';

  // Only intercept crawlers — real users get the normal SPA
  if (!CRAWLER_UA.test(ua)) {
    return context.next();
  }

  const url = new URL(request.url);
  const normalizedPath = url.pathname.replace(/\/+$/, '') || '/';
  const pathParts = normalizedPath.split('/').filter(Boolean);
  const parentSegment = pathParts[pathParts.length - 2] || '';
  const slug = decodeURIComponent(pathParts[pathParts.length - 1] || '').trim();

  // Only handle event detail pages
  if (!slug || !['event', 'events'].includes(parentSegment.toLowerCase())) {
    return context.next();
  }

  try {
    // Call Lovable Cloud backend function
    const fnUrl = `${SUPABASE_URL}/functions/v1/og-event?slug=${encodeURIComponent(slug)}`;
    const res = await fetch(fnUrl);

    if (!res.ok) {
      return context.next();
    }

    const html = await res.text();
    return new Response(html, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'public, max-age=300',
      },
    });
  } catch {
    return context.next();
  }
}

export const config = { path: ['/event/*', '/events/*'] };
