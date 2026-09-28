// IndexNow ping on every successful production deploy (added 28th September 2026).
//
// Netlify runs a function named deploy-succeeded after each successful deploy. For
// production deploys of the live domain, this reads the fresh sitemap and submits every
// URL to IndexNow, so Bing, and the AI answer products that search its index, see new and
// changed event pages within minutes instead of waiting for a crawl.
//
// The key is public by design and is served from /<key>.txt by the build.

const KEY = '6f1c2b9e8d4a47b3a0e5c7d9f2b18e64';

export const handler = async (event) => {
  let payload = {};
  try { payload = JSON.parse(event.body || '{}').payload || {}; } catch (_) { /* ignore */ }
  if (payload.context !== 'production') return { statusCode: 200, body: 'skipped: not production' };

  const siteUrl = (process.env.URL || '').replace(/\/$/, '');
  const host = new URL(siteUrl || 'https://invalid').hostname.replace(/^(?!www\.)/, 'www.');
  const origin = `https://${host}`;
  try {
    const sitemap = await (await fetch(`${origin}/sitemap.xml`)).text();
    const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]).filter(u => u.startsWith(origin));
    if (!urlList.length) return { statusCode: 200, body: 'no urls' };
    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ host, key: KEY, keyLocation: `${origin}/${KEY}.txt`, urlList }),
    });
    console.log(`indexnow: submitted ${urlList.length} urls, status ${res.status}`);
    return { statusCode: 200, body: `indexnow ${res.status}` };
  } catch (err) {
    console.error('indexnow: failed', err);
    return { statusCode: 200, body: 'indexnow failed' };
  }
};
