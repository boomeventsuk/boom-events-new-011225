(() => {
  const brand = document.documentElement.classList.contains('pm') ? 'pm' : 'boom';
  const KEY = 'cookie_consent';
  const banner = document.querySelector('#cookie-banner');
  const settings = document.querySelector('#cookie-settings');
  if (!banner || !settings) return;
  let choice = null;
  try { choice = localStorage.getItem(KEY); } catch (_) { /* private browsing */ }
  const loadScript = (src) => {
    const script = document.createElement('script');
    script.async = true;
    script.src = src;
    document.head.appendChild(script);
  };
  const startTracking = () => {
    if (window.__v2TrackingStarted) return;
    window.__v2TrackingStarted = true;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'cookie_consent_granted' });
    const gtm = brand === 'pm' ? 'GTM-KMKF2NS2' : 'GTM-PJGV534N';
    loadScript(`https://www.googletagmanager.com/gtm.js?id=${gtm}`);
    if (brand === 'boom') {
      window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', 'G-FE0H4X5BBS');
      loadScript('https://www.googletagmanager.com/gtag/js?id=G-FE0H4X5BBS');
    }
    const pixel = brand === 'pm' ? '2629470400739413' : '1947538679159165';
    window.fbq = window.fbq || function () { (window.fbq.queue = window.fbq.queue || []).push(arguments); };
    window.fbq.loaded = true;
    window.fbq.version = '2.0';
    window.fbq('init', pixel);
    window.fbq('track', 'PageView');
    loadScript('https://connect.facebook.net/en_US/fbevents.js');
  };
  const show = () => { banner.hidden = false; banner.querySelector('button')?.focus(); };
  const hide = () => { banner.hidden = true; settings.focus(); };
  const save = (value) => {
    const previous = choice;
    choice = value;
    try { localStorage.setItem(KEY, value); } catch (_) { /* private browsing */ }
    if (value === 'granted') { hide(); startTracking(); }
    else {
      if (window.fbq) window.fbq('consent', 'revoke');
      if (window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied' });
      hide();
      if (previous === 'granted' && window.__v2TrackingStarted) location.reload();
    }
  };
  banner.querySelector('[data-consent-accept]').addEventListener('click', () => save('granted'));
  banner.querySelector('[data-consent-reject]').addEventListener('click', () => save('denied'));
  settings.addEventListener('click', show);
  if (choice === 'granted') startTracking();
  else if (choice !== 'denied') banner.hidden = false;
  document.addEventListener('click', (event) => {
    if (choice !== 'granted') return;
    const a = event.target.closest('a[href="#tickets"], a[href$="#tickets"]');
    if (!a) return;
    const id = document.querySelector('[data-eventbrite-id]')?.dataset.eventbriteId;
    window.dataLayer?.push({ event: 'ticket_intent', eventbrite_id: id || undefined, brand });
  });
})();
