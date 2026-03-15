// Netlify Edge Function: serves event-specific OG meta tags to social crawlers
// so WhatsApp, Facebook, Twitter etc. show the correct event poster image

const CRAWLER_UA = /facebookexternalhit|Facebot|Twitterbot|WhatsApp|LinkedInBot|Slackbot|TelegramBot|Discordbot|Pinterest|Googlebot/i;

export default async function handler(request: Request, context: any) {
  const ua = request.headers.get("user-agent") || "";

  // Only intercept crawlers — real users get the normal SPA
  if (!CRAWLER_UA.test(ua)) {
    return context.next();
  }

  const url = new URL(request.url);
  const normalizedPath = url.pathname.replace(/\/+$/, "") || "/";
  const pathParts = normalizedPath.split("/").filter(Boolean);
  const parentSegment = pathParts[pathParts.length - 2] || "";
  const slug = decodeURIComponent(pathParts[pathParts.length - 1] || "").trim();

  // Only handle event detail pages
  if (!slug || !["event", "events"].includes(parentSegment.toLowerCase())) {
    return context.next();
  }

  try {
    // Fetch event data from the origin
    const eventsUrl = new URL("/events-boombastic.json", url.origin);
    const res = await fetch(eventsUrl.toString());
    if (!res.ok) return context.next();

    const events = await res.json();
    const slugKey = normalize(slug);
    const event = events.find((ev: any) => {
      const candidates = [ev?.eventCode, ev?.slug, ev?.eventbriteId].filter(Boolean);
      return candidates.some((candidate) => normalize(String(candidate)) === slugKey);
    });

    if (!event) return context.next();

    const title = sanitize(String(event.title || "Boombastic Event"));
    const description = sanitize(String(event.description || event.subtitle || "")).slice(0, 200);
    const image = toAbsoluteUrl(String(event.image || ""), url.origin);
    const canonical = `${url.origin}${normalizedPath}${url.search}`;

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
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300",
      },
    });
  } catch {
    return context.next();
  }
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function toAbsoluteUrl(value: string, origin: string): string {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;

  try {
    return new URL(value, origin).toString();
  } catch {
    return "";
  }
}

function sanitize(s: string): string {
  return s.replace(/[\r\n]+/g, " ").replace(/\s{2,}/g, " ").trim();
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export const config = { path: "/event/*" };
