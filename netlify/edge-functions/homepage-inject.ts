import type { Context } from "https://edge.netlify.com";

/**
 * homepage-inject.ts
 *
 * Netlify Edge Function: inject JSON-LD structured data and a noscript HTML block
 * into the Boombastic Events homepage for agent/crawler discoverability.
 *
 * Also injects a classic <script> WebMCP shim so agents that read the raw HTML
 * (not the JS bundle) can still detect the WebMCP capability declaration.
 *
 * Only runs on the homepage (pathname === "/" or "").
 */

interface BoomEvent {
  eventCode: string;
  title: string;
  date: string;
  start: string;
  end: string;
  venue: string;
  city: string;
  isSoldOut: boolean;
  description?: string;
  image?: string;
}

export default async function handler(request: Request, context: Context) {
  const url = new URL(request.url);
  const path = url.pathname;

  // Only homepage
  if (path !== "/" && path !== "") {
    return context.next();
  }

  const response = await context.next();

  // Only process HTML responses
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return response;
  }

  let html = await response.text();

  // --- Fetch upcoming events ---
  let upcomingEvents: BoomEvent[] = [];
  try {
    const eventsUrl = new URL("/events-boombastic.json", url.origin);
    const eventsRes = await fetch(eventsUrl.toString());
    if (eventsRes.ok) {
      const allEvents: BoomEvent[] = await eventsRes.json();
      const today = new Date().toISOString().slice(0, 10);
      upcomingEvents = allEvents
        .filter((e) => e.start.slice(0, 10) >= today)
        .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
        .slice(0, 20);
    }
  } catch (_e) {
    // Events fetch failed - proceed without structured data
  }

  // Event JSON-LD is NOT injected here. The build-time prerender
  // (scripts/prerender-events.js) already writes a richer static Event @graph
  // into dist/index.html (offers, organizer sameAs, venue street addresses);
  // a second MusicEvent block here duplicated the schema. upcomingEvents is
  // still used for the noscript crawler block below.

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Boombastic Events",
    url: "https://www.boomevents.co.uk",
    description:
      "Midlands afternoon events company. 12+ years, 23,000+ attendees, regular sell-outs across the region. Sub-brands: THE 2PM CLUB (current 80s Edition daytime disco), SILENT DISCO GREATEST HITS (headphone multi-channel), FOOTLOOSE 80s (pure 80s themed), FAMILY SILENT DISCO (all-ages), GET READY (60s/70s Motown Soul Disco). All events 2pm to 6pm.",
    contactPoint: {
      "@type": "ContactPoint",
      email: "hello@boomevents.co.uk",
      contactType: "customer support",
    },
    areaServed: [
      "Northampton",
      "Bedford",
      "Milton Keynes",
      "Coventry",
      "Luton",
      "Leicester",
    ],
  };

  const jsonLdBlock = `<script type="application/ld+json">${JSON.stringify(orgSchema)}</script>`;

  // --- WebMCP shim (classic script, for agents reading raw HTML) ---
  const webMcpShim = `<script>
(function(){
  if(typeof navigator==='undefined'||!('modelContext' in navigator))return;
  try{
    var nav=navigator;
    var tools=[{
      name:"listEvents",
      description:"Returns upcoming Boombastic Events across all sub-brands (THE 2PM CLUB, SILENT DISCO GREATEST HITS, FOOTLOOSE 80s, FAMILY SILENT DISCO, GET READY) and all cities. Filter by city or sub-brand.",
      inputSchema:{type:"object",properties:{city:{type:"string"},brand:{type:"string"},limit:{type:"number"}},required:[]},
      execute:function(input){
        return fetch('/events-boombastic.json').then(function(r){return r.json();}).then(function(events){
          var now=new Date().toISOString().slice(0,10);
          var res=events.filter(function(e){return e.start.slice(0,10)>=now;});
          if(input.city)res=res.filter(function(e){return e.city.toLowerCase().includes(input.city.toLowerCase());});
          if(input.brand)res=res.filter(function(e){return e.title.toLowerCase().includes(input.brand.toLowerCase());});
          if(input.limit)res=res.slice(0,input.limit);
          return res;
        });
      }
    }];
    if(typeof nav.modelContext.provideContext==='function'){nav.modelContext.provideContext(tools);}
    else if(typeof nav.modelContext.registerTool==='function'){tools.forEach(function(t){nav.modelContext.registerTool(t);});}
  }catch(e){}
})();
</script>`;

  // --- Noscript HTML block with full brand content for crawlers ---
  const displayEventTitle = (event: any) => {
    const searchable = [
      event.eventCode,
      event.slug,
      event.title,
      event.subtitle,
      event.description,
      event.fullDescription,
      event.highlights,
      event.image,
    ].filter(Boolean).join(" ");
    const startTime = event.start ? new Date(event.start).getTime() : Number.NaN;
    const isEighties = /80s edition|2pm80s|2pm-80s|goes full-on 80s|your best 80s night out/i.test(searchable)
      || (/-2pm-/i.test(searchable) && Number.isFinite(startTime) && startTime >= new Date("2026-06-13T00:00:00").getTime());
    if (!isEighties) return event.title;
    return `THE 2PM CLUB ${event.city}: 80s Edition Daytime Disco`;
  };

  const upcomingHtml =
    upcomingEvents.length > 0
      ? `<ul>` +
        upcomingEvents
          .map(
            (e) =>
              `<li>${displayEventTitle(e)} - ${e.date}, ${e.venue}, ${e.city}${e.isSoldOut ? " [SOLD OUT]" : ""} - <a href="https://www.boomevents.co.uk/event/${e.eventCode.toLowerCase()}/">Book tickets</a></li>`
          )
          .join("") +
        `</ul>`
      : `<p>See <a href="https://www.boomevents.co.uk/events-boombastic.json">events-boombastic.json</a> for the full list.</p>`;

  const noscriptBlock = `<noscript>
<div id="boombastic-agent-data" style="display:none" aria-hidden="true">
<h1>Boombastic Events</h1>
<p>Midlands afternoon events company. 12+ years, 23,000+ attendees, regular sell-outs across the region, 4.9/5 rating. All events run 2pm to 6pm on weekends.</p>
<p>Contact: hello@boomevents.co.uk</p>

<h2>Sub-brands</h2>
<h3>THE 2PM CLUB</h3>
<p>Current 80s Edition daytime disco. Saturday afternoons 2pm to 6pm. Club-level production, confetti, full dance floor. Cities: Northampton, Bedford, Milton Keynes, Coventry, Luton, Leicester.</p>

<h3>SILENT DISCO GREATEST HITS</h3>
<p>Headphone-based silent disco. Multiple audio channels. No speakers. 2pm to 6pm.</p>

<h3>FOOTLOOSE 80s</h3>
<p>Pure 1980s themed event. Fancy dress encouraged. 2pm to 6pm.</p>

<h3>FAMILY SILENT DISCO</h3>
<p>All-ages daytime silent disco on headphones. Children welcome. Weekend afternoons.</p>

<h3>GET READY</h3>
<p>60s and 70s Motown, Soul and Disco. 2pm to 6pm. Running from 2026.</p>

<h2>Cities</h2>
<ul>
<li>Northampton - The Picturedrome</li>
<li>Bedford - Esquires</li>
<li>Milton Keynes - MK11 Music Venue</li>
<li>Coventry - hmv Empire</li>
<li>Luton - Hat Factory</li>
<li>Leicester - O2 Academy / Athena</li>
</ul>

<h2>Upcoming Events</h2>
${upcomingHtml}

<h2>FAQ</h2>
<dl>
<dt>What time do events run?</dt><dd>All events: 2pm to 6pm. Home by 7pm.</dd>
<dt>How do I book?</dt><dd>Via <a href="https://www.boomevents.co.uk">boomevents.co.uk</a>. Ticket links always go to the Boombastic Events site, not Eventbrite directly.</dd>
<dt>Are events accessible?</dt><dd>Yes. All venues are step-free. Email hello@boomevents.co.uk for specific access requirements.</dd>
<dt>Is there a machine-readable events feed?</dt><dd>Yes: <a href="https://www.boomevents.co.uk/events-boombastic.json">events-boombastic.json</a></dd>
</dl>

<h2>Data Endpoints</h2>
<ul>
<li>Events: <a href="https://www.boomevents.co.uk/events-boombastic.json">events-boombastic.json</a></li>
<li>Venues: <a href="https://www.boomevents.co.uk/venues.json">venues.json</a></li>
<li>OpenAPI: <a href="https://www.boomevents.co.uk/openapi.json">openapi.json</a></li>
<li>API catalog: <a href="https://www.boomevents.co.uk/.well-known/api-catalog">.well-known/api-catalog</a></li>
</ul>
</div>
</noscript>`;

  // --- Inject into <head> (JSON-LD + WebMCP shim) ---
  const headInsert = `${jsonLdBlock}\n${webMcpShim}\n`;
  html = html.replace("</head>", `${headInsert}</head>`);

  // --- Inject noscript block at start of <body> ---
  html = html.replace("<body>", `<body>\n${noscriptBlock}`);

  return new Response(html, {
    status: response.status,
    headers: response.headers,
  });
}

export const config = { path: "/" };
