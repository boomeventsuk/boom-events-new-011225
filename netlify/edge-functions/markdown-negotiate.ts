import type { Context } from "https://edge.netlify.com";

/**
 * markdown-negotiate.ts
 *
 * Netlify Edge Function: serve /llms.txt when Accept: text/markdown is requested.
 * Enables "Markdown for Agents" check on isitagentready.com.
 * Must be listed BEFORE homepage-inject in netlify.toml.
 */
export default async function handler(request: Request, context: Context) {
  const accept = request.headers.get("accept") || "";
  if (!accept.includes("text/markdown")) return context.next();

  const url = new URL(request.url);
  const llmsUrl = new URL("/llms.txt", url.origin);

  const llmsResponse = await fetch(llmsUrl.toString());
  if (!llmsResponse.ok) return context.next();

  const text = await llmsResponse.text();
  return new Response(text, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=UTF-8",
      "Cache-Control": "public, max-age=3600",
      "X-Markdown-Tokens": String(text.length),
    },
  });
}

export const config = { path: "/*" };
