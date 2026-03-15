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
  const pathParts = url.pathname.replace(/\/+$/, "").split("/");
  // /events/060626-2PM-COV → slug = "060626-2PM-COV"
  const slug = pathParts[pathParts.length - 1];

  if (!slug) {
    return context.next();
  }

  try {
    // Fetch event data from the origin
    const eventsUrl = new URL("/events-boombastic.json", url.origin);
    const res = await fetch(eventsUrl.toString());
    if (!res.ok) return context.next();

    const events = await res.json();
    const event = events.find(
      (ev: any) =>
        (ev.eventCode || "").toLowerCase() === slug.toLowerCase() ||
        (ev.slug || "").toLowerCase() === slug.toLowerCase()
    );

    if (!event) return context.next();

    const title = event.title || "Boombastic Event";
    const description = (event.description || "").slice(0, 200);
    const image = event.image || "";
    const canonical = `${url.origin}/events/${slug}/`;

    const html = `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<title>${esc(title)} | Boombastic Events</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:type" content="event">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${esc(image)}">
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
<p><a href="${canonical}">View event</a></p>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  } catch {
    return context.next();
  }
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export const config = { path: "/events/*" };
