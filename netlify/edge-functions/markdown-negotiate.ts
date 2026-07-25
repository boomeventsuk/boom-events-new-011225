import type { Context } from "https://edge.netlify.com";

/**
 * markdown-negotiate.ts
 *
 * Markdown for Agents: when a client sends `Accept: text/markdown`, serve a
 * clean markdown rendering of THE PAGE THAT WAS REQUESTED.
 *
 * Previously this returned /llms.txt for every path, which meant:
 *   - /events/031026-2pm-npton/ returned the generic site summary, not the event
 *   - /any-url-that-does-not-exist.md returned 200 instead of 404
 * so an agent asking for markdown could never reach per-event facts, and the
 * site advertised an infinite space of soft-200s.
 *
 * Now: pass the request through and convert the real response. Non-200
 * responses (404, and the 410s on ended events) are returned untouched so
 * status codes stay honest. The homepage still resolves to /llms.txt, which is
 * a richer hand-maintained summary than its rendered HTML.
 */

// Paths that must never be rewritten: machine endpoints, agent discovery
// documents, and static assets. /llms.txt and friends are already markdown.
const PASSTHROUGH_PREFIX = [
  "/.well-known/",
  "/assets/",
  "/fonts/",
  "/img/",
];
const PASSTHROUGH_EXT =
  /\.(txt|json|xml|md|ico|png|jpe?g|webp|avif|svg|gif|css|js|mjs|map|webmanifest|woff2?|ttf|mp4|webm)$/i;

function shouldPassThrough(pathname: string): boolean {
  if (PASSTHROUGH_PREFIX.some((p) => pathname.startsWith(p))) return true;
  return PASSTHROUGH_EXT.test(pathname);
}

/** Minimal, dependency-free HTML -> Markdown for our own generated markup. */
function htmlToMarkdown(html: string): string {
  let s = html;

  // Prefer the <noscript> agent block when present: it is the canonical
  // plain-HTML rendering of the page (event shells + homepage-inject write it).
  // Pages carry several <noscript> blocks (GTM and Meta pixel iframes come
  // first), so take the LONGEST one rather than the first.
  const noscripts = [...s.matchAll(/<noscript>([\s\S]*?)<\/noscript>/gi)]
    .map((m) => m[1])
    .sort((a, b) => b.length - a.length);
  if (noscripts.length && noscripts[0].length > 400) {
    s = noscripts[0];
  } else {
    // Take the RICHEST container, not the first that matches. Location and
    // brand pages wrap a small card in <article> while the real copy sits
    // further down <body>, so a fixed main > article > body precedence threw
    // most of the page away.
    const candidates = [
      s.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1],
      s.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1],
      s.match(/<body\b[^>]*>([\s\S]*)<\/body>/i)?.[1],
    ].filter(Boolean) as string[];
    if (candidates.length) {
      s = candidates.sort((a, b) => b.length - a.length)[0];
    }
  }

  // Drop anything that is not content.
  s = s.replace(/<(script|style|template|svg|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, " ");
  s = s.replace(/<!--[\s\S]*?-->/g, " ");

  // Structural elements -> markdown, before the remaining tags are stripped.
  s = s.replace(
    /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi,
    (_m, lvl, inner) =>
      `\n\n${"#".repeat(Number(lvl))} ${inner.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()}\n\n`
  );
  s = s.replace(
    /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi,
    (_m, href, inner) => {
      const text = inner.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      return text ? `[${text}](${href})` : "";
    }
  );
  s = s.replace(
    /<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi,
    (_m, _t, inner) => `**${inner.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()}**`
  );
  s = s.replace(
    /<li\b[^>]*>([\s\S]*?)<\/li>/gi,
    (_m, inner) => `\n- ${inner.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}`
  );
  s = s.replace(/<\/(p|div|section|tr|ul|ol|article)>/gi, "\n\n");
  s = s.replace(/<br\s*\/?>/gi, "\n");

  // Strip whatever tags remain, then decode the entities we emit.
  s = s.replace(/<[^>]+>/g, " ");
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&amp;/g, "&");

  // Tidy whitespace without collapsing intentional markdown line breaks.
  return s
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function markdownResponse(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/markdown; charset=UTF-8",
      "Cache-Control": "public, max-age=3600",
      "X-Markdown-Tokens": String(body.length),
      Vary: "Accept",
    },
  });
}

export default async function handler(request: Request, context: Context) {
  const accept = request.headers.get("accept") || "";
  if (!accept.includes("text/markdown")) return context.next();

  const url = new URL(request.url);
  if (shouldPassThrough(url.pathname)) return context.next();

  // Homepage: /llms.txt is a richer curated summary than the rendered page.
  if (url.pathname === "/" || url.pathname === "") {
    const llms = await fetch(new URL("/llms.txt", url.origin).toString());
    if (llms.ok) return markdownResponse(await llms.text());
    return context.next();
  }

  const response = await context.next();

  // Preserve real status codes: 404s stay 404, ended events stay 410.
  if (!response.ok) return response;

  const type = response.headers.get("content-type") || "";
  if (!type.includes("text/html")) return response;

  // Body can only be consumed once, so rebuild the HTML response if the
  // conversion comes back too thin to be worth serving.
  const html = await response.text();
  const md = htmlToMarkdown(html);
  if (md.length < 80) {
    return new Response(html, {
      status: response.status,
      headers: response.headers,
    });
  }

  return markdownResponse(
    `${md}\n\n---\n\nSource: ${url.origin}${url.pathname}\nSite summary: ${url.origin}/llms.txt\nEvent feed: ${url.origin}/events-boombastic.json\n`
  );
}

export const config = {
  path: "/*",
};
