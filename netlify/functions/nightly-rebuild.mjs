// Nightly rebuild (added 28th September 2026).
//
// The site is static: each build keeps events dated today or later (Europe/London).
// Without a rebuild after midnight, finished dates stay listed until something else
// happens to deploy. This scheduled function asks Netlify for a fresh production build
// shortly after midnight UK time, every night.
//
// 00:05 UTC is 01:05 in summer time and 00:05 in winter, so the build always runs on the
// new London calendar day.
//
// Needs the NIGHTLY_BUILD_HOOK_URL environment variable (a Netlify build hook for this
// site's main branch). Without it the function does nothing and says so in the log.

export default async () => {
  const hook = process.env.NIGHTLY_BUILD_HOOK_URL;
  if (!hook) {
    console.warn('nightly-rebuild: NIGHTLY_BUILD_HOOK_URL is not set; no build requested.');
    return new Response('not configured', { status: 200 });
  }
  const res = await fetch(`${hook}?trigger_title=${encodeURIComponent('Nightly rebuild: drop finished dates')}`, { method: 'POST' });
  console.log(`nightly-rebuild: build hook responded ${res.status}`);
  return new Response(`build hook ${res.status}`, { status: res.ok ? 200 : 502 });
};

export const config = { schedule: '5 0 * * *' };
