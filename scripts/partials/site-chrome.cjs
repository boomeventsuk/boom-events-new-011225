/**
 * site-chrome.cjs
 *
 * ONE shared static header + footer for every non-React page on
 * www.boomevents.co.uk. Visually matches the canonical React app chrome
 * (src/components/Header.tsx + Footer.tsx): boombastic.events wordmark logo,
 * Our Parties + Locations dropdowns, Reviews / About / Jobs, social icons and
 * the pink Book Tickets button, plus the 4-column footer.
 *
 * Self-contained: ships its own scoped CSS (prefixed .bce-*) and inline brand
 * colours, so it renders identically without the app's compiled Tailwind.
 *
 * Consumers:
 *   - scripts/generate-location-pages.cjs  (require)
 *   - scripts/generate-brand-pages.js      (createRequire import)
 *   - static pages under public/ via the BOOM-GEN marker comments
 *
 * Source of truth for the design lives in the React components above. Keep the
 * link lists in sync with partyLinks / locationLinks / companyLinks there.
 *
 * No emojis, no em dashes in any copy here (house rule).
 */

const LOGO_SRC =
  'https://boombastic-events.b-cdn.net/The2PMCLUB-Website/57926c83-5a73-43e4-b501-9f9c758534fd_fs7hwi.png';

// Marker comments so generators / future tooling can find and replace the
// shared chrome in any static file idempotently.
const HEADER_START = '<!-- BOOM-GEN:SITE-HEADER START (shared chrome, do not hand-edit) -->';
const HEADER_END = '<!-- BOOM-GEN:SITE-HEADER END -->';
const FOOTER_START = '<!-- BOOM-GEN:SITE-FOOTER START (shared chrome, do not hand-edit) -->';
const FOOTER_END = '<!-- BOOM-GEN:SITE-FOOTER END -->';
const CSS_START = '<!-- BOOM-GEN:SITE-CHROME-CSS START (shared chrome, do not hand-edit) -->';
const CSS_END = '<!-- BOOM-GEN:SITE-CHROME-CSS END -->';

const partyLinks = [
  { label: 'BOOMBASTIC 90s', href: '/boombastic-90s/' },
  { label: 'Silent Disco Greatest Hits', href: '/silent-disco/' },
  { label: 'FOOTLOOSE 80s', href: '/footloose-80s/' },
  { label: 'GET READY', href: '/get-ready/' },
  { label: 'Family Silent Disco', href: '/family-silent-disco/' },
  { label: 'THE 2PM CLUB', href: 'https://www.the2pmclub.co.uk', external: true },
];

const locationLinks = [
  { label: 'Northampton', href: '/locations/northampton/' },
  { label: 'Bedford', href: '/locations/bedford/' },
  { label: 'Milton Keynes', href: '/locations/milton-keynes/' },
  { label: 'Coventry', href: '/locations/coventry/' },
  { label: 'Luton', href: '/locations/luton/' },
  { label: 'Leicester', href: '/locations/leicester/' },
];

const companyLinks = [
  { label: 'About', href: '/about/' },
  { label: 'Work With Us', href: '/jobs' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms & Conditions', href: '/terms' },
];

function extAttrs(link) {
  return link.external ? ' target="_blank" rel="noopener noreferrer"' : '';
}

// Scoped CSS. Brand tokens mirror src/index.css:
//   --primary 324 96% 62% = #FF3CAC, background #0B0B0F, card #13131A,
//   foreground #fff, muted-foreground rgba(255,255,255,.7),
//   border rgba(255,255,255,.1). Fonts: Poppins + Bebas Neue.
const SITE_CHROME_CSS = `${CSS_START}
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:wght@300;400;500;600;700&display=swap');
    :root {
      --bce-pink: #FF3CAC;
      --bce-pink-hover: #e62e98;
      --bce-bg: #0B0B0F;
      --bce-card: #13131A;
      --bce-fg: #ffffff;
      --bce-muted: rgba(255,255,255,0.7);
      --bce-border: rgba(255,255,255,0.1);
    }
    .bce-header, .bce-header *, .bce-footer, .bce-footer * { box-sizing: border-box; }
    .bce-header {
      position: fixed; top: 0; left: 0; width: 100%; z-index: 50;
      background: rgba(11,11,15,0.9); backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--bce-border);
      font-family: 'Poppins', sans-serif;
    }
    .bce-header__inner {
      max-width: 1200px; margin: 0 auto; padding: 14px 24px;
      display: flex; align-items: center; gap: 20px;
    }
    .bce-logo { display: inline-flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .bce-logo img { height: 40px; width: auto; display: block; }
    .bce-nav { display: flex; align-items: center; gap: 24px; margin-left: 8px; }
    .bce-nav > a, .bce-nav__trigger > button {
      font-family: 'Poppins', sans-serif; font-size: 15px; font-weight: 500;
      color: var(--bce-muted); background: none; border: 0; cursor: pointer;
      padding: 0; display: inline-flex; align-items: center; gap: 4px;
      transition: color .2s ease; text-decoration: none;
    }
    .bce-nav > a:hover, .bce-nav__trigger > button:hover { color: var(--bce-pink); }
    .bce-nav__trigger { position: relative; }
    .bce-nav__chev { width: 14px; height: 14px; transition: transform .2s ease; }
    .bce-nav__trigger:hover .bce-nav__chev,
    .bce-nav__trigger:focus-within .bce-nav__chev { transform: rotate(180deg); }
    .bce-dropdown {
      position: absolute; top: calc(100% + 12px); left: 0; min-width: 230px;
      background: var(--bce-card); border: 1px solid var(--bce-border);
      border-radius: 12px; padding: 8px; display: flex; flex-direction: column;
      opacity: 0; visibility: hidden; transform: translateY(-6px);
      transition: opacity .18s ease, transform .18s ease, visibility .18s ease;
      box-shadow: 0 18px 40px rgba(0,0,0,0.45);
    }
    .bce-nav__trigger:hover .bce-dropdown,
    .bce-nav__trigger:focus-within .bce-dropdown {
      opacity: 1; visibility: visible; transform: translateY(0);
    }
    .bce-dropdown a {
      font-size: 14px; color: var(--bce-muted); text-decoration: none;
      padding: 9px 12px; border-radius: 8px; transition: color .2s ease, background .2s ease;
      white-space: nowrap;
    }
    .bce-dropdown a:hover { color: var(--bce-fg); background: rgba(255,255,255,0.06); }
    .bce-dropdown a .bce-ext { font-size: 11px; color: var(--bce-muted); margin-left: 4px; }
    .bce-header__spacer { flex: 1; }
    .bce-social { display: flex; align-items: center; gap: 14px; }
    .bce-social a { color: var(--bce-muted); display: inline-flex; transition: color .2s ease; }
    .bce-social a:hover { color: var(--bce-pink); }
    .bce-social svg { width: 20px; height: 20px; fill: currentColor; }
    .bce-cta {
      background: var(--bce-pink); color: #fff; font-family: 'Poppins', sans-serif;
      font-weight: 600; font-size: 14px; padding: 10px 22px; border-radius: 999px;
      border: 0; cursor: pointer; text-decoration: none; white-space: nowrap;
      transition: background .2s ease, transform .2s ease;
    }
    .bce-cta:hover { background: var(--bce-pink-hover); transform: translateY(-1px); text-decoration: none; }
    .bce-nav-toggle {
      display: none; background: none; border: 0; color: #fff; font-size: 24px;
      cursor: pointer; padding: 6px; line-height: 1; border-radius: 8px;
    }
    .bce-nav-toggle:hover { background: rgba(255,255,255,0.1); }
    /* Mobile menu uses a native details element for zero-JS accordions. */
    .bce-mobile { display: none; }
    @media (max-width: 900px) {
      .bce-nav, .bce-social { display: none; }
      .bce-nav-toggle { display: inline-flex; }
      .bce-header__spacer { flex: 1; }
      .bce-mobile[open] { display: block; }
      .bce-mobile {
        display: block; border-top: 1px solid var(--bce-border);
        background: rgba(11,11,15,0.98); padding: 8px 24px 20px;
      }
      .bce-mobile > summary { list-style: none; }
      .bce-mobile > summary::-webkit-details-marker { display: none; }
      .bce-mobile__panel { display: flex; flex-direction: column; }
      .bce-mobile__panel > a, .bce-acc > summary, .bce-mobile__panel > .bce-mobile-link {
        font-family: 'Poppins', sans-serif; font-size: 17px; color: var(--bce-fg);
        text-decoration: none; padding: 12px 0; transition: color .2s ease;
        border-bottom: 1px solid rgba(255,255,255,0.06); display: block;
      }
      .bce-mobile__panel > a:hover, .bce-acc > summary:hover { color: var(--bce-pink); }
      .bce-acc { border-bottom: 1px solid rgba(255,255,255,0.06); }
      .bce-acc > summary {
        list-style: none; cursor: pointer; display: flex; align-items: center;
        justify-content: space-between; border-bottom: 0;
      }
      .bce-acc > summary::-webkit-details-marker { display: none; }
      .bce-acc > summary::after { content: '+'; font-size: 20px; color: var(--bce-muted); }
      .bce-acc[open] > summary::after { content: '-'; }
      .bce-acc__links { display: flex; flex-direction: column; padding: 0 0 8px 12px; }
      .bce-acc__links a {
        font-size: 15px; color: var(--bce-muted); text-decoration: none;
        padding: 8px 0; transition: color .2s ease;
      }
      .bce-acc__links a:hover { color: var(--bce-pink); }
      .bce-mobile__cta { margin-top: 14px; display: inline-block; }
    }
    /* Footer */
    .bce-footer {
      background: var(--bce-card); border-top: 1px solid var(--bce-border);
      font-family: 'Poppins', sans-serif; color: var(--bce-muted);
      padding: 56px 0 32px; margin: 0; width: 100%;
    }
    .bce-footer__inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
    .bce-footer__grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px;
    }
    @media (max-width: 900px) { .bce-footer__grid { grid-template-columns: repeat(2, 1fr); gap: 40px; } }
    @media (max-width: 560px) { .bce-footer__grid { grid-template-columns: 1fr; gap: 36px; } }
    .bce-footer__brand img { height: 56px; width: auto; display: block; margin-bottom: 22px; }
    .bce-footer__mail {
      display: inline-flex; align-items: center; gap: 8px; color: var(--bce-muted);
      text-decoration: none; font-size: 14px; margin-bottom: 22px; transition: color .2s ease;
    }
    .bce-footer__mail:hover { color: var(--bce-pink); }
    .bce-footer__mail svg { width: 16px; height: 16px; fill: currentColor; }
    .bce-footer__social { display: flex; align-items: center; gap: 16px; }
    .bce-footer__social a { color: var(--bce-muted); display: inline-flex; transition: color .2s ease; }
    .bce-footer__social a:hover { color: var(--bce-pink); }
    .bce-footer__social svg { width: 20px; height: 20px; fill: currentColor; }
    .bce-footer h3 {
      font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 13px;
      color: var(--bce-fg); text-transform: uppercase; letter-spacing: 0.08em;
      margin: 0 0 16px;
    }
    .bce-footer ul { list-style: none; margin: 0; padding: 0; }
    .bce-footer li { margin-bottom: 10px; }
    .bce-footer__grid a:not(.bce-footer__mail):not(.bce-footer__social a) {
      font-family: 'Poppins', sans-serif; font-size: 14px; color: var(--bce-muted);
      text-decoration: none; transition: color .2s ease;
    }
    .bce-footer__grid li a:hover { color: var(--bce-pink); }
    .bce-footer__copy {
      max-width: 1200px; margin: 40px auto 0; padding: 24px 24px 0;
      border-top: 1px solid var(--bce-border); text-align: center;
      font-size: 14px; color: var(--bce-muted);
    }
    /* Push page content below the fixed header. Pages can override --bce-header-h. */
    body { padding-top: var(--bce-header-h, 72px); }
  </style>
  ${CSS_END}`;

// Inline SVG social icons (header). Match the React custom paths.
const IG_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm5 3.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zm0 2a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zm5.75-.75a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5z"/></svg>';
const FB_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 22v-8h2.6l.4-3h-3v-1.9c0-.9.3-1.5 1.6-1.5H17V4.1c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8V11H8v3h3.1v8h2.4z"/></svg>';
const MAIL_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM4 7.5l8 5 8-5V6H4v1.5z"/></svg>';

function partyDropdownLinks() {
  return partyLinks
    .map(
      (l) =>
        `          <a href="${l.href}"${extAttrs(l)}>${l.label}${l.external ? ' <span class="bce-ext">&#8599;</span>' : ''}</a>`
    )
    .join('\n');
}

function locationDropdownLinks() {
  return locationLinks.map((l) => `          <a href="${l.href}">${l.label}</a>`).join('\n');
}

// Header. Reviews/About scroll to homepage anchors (/#reviews, /#about) so the
// links work from any static page; Jobs goes to /jobs; Book Tickets goes to
// /#tickets (site page, never eventbrite.com).
const SITE_HEADER_HTML = `${HEADER_START}
  <header class="bce-header">
    <div class="bce-header__inner">
      <a href="/" class="bce-logo" aria-label="Boombastic Events home">
        <img src="${LOGO_SRC}" alt="Boombastic Events Logo" width="160" height="40" loading="eager" decoding="async">
      </a>
      <nav class="bce-nav" aria-label="Primary">
        <div class="bce-nav__trigger">
          <button type="button" aria-haspopup="true">Our Parties
            <svg class="bce-nav__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div class="bce-dropdown">
${partyDropdownLinks()}
          </div>
        </div>
        <div class="bce-nav__trigger">
          <button type="button" aria-haspopup="true">Locations
            <svg class="bce-nav__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
          </button>
          <div class="bce-dropdown">
${locationDropdownLinks()}
          </div>
        </div>
        <a href="/#reviews">Reviews</a>
        <a href="/#about">About</a>
        <a href="/jobs">Jobs</a>
      </nav>
      <div class="bce-header__spacer"></div>
      <div class="bce-social">
        <a href="https://instagram.com/boombastic.eventsuk" aria-label="Instagram" target="_blank" rel="noopener noreferrer">${IG_SVG}</a>
        <a href="https://facebook.com/boombastic.eventsuk" aria-label="Facebook" target="_blank" rel="noopener noreferrer">${FB_SVG}</a>
        <a href="mailto:hello@boomevents.co.uk" aria-label="Email">${MAIL_SVG}</a>
      </div>
      <a href="/#tickets" class="bce-cta">Book Tickets</a>
      <details class="bce-mobile" id="bce-mobile-menu">
        <summary class="bce-nav-toggle" aria-label="Menu" role="button">&#9776;</summary>
        <div class="bce-mobile__panel">
          <details class="bce-acc">
            <summary>Our Parties</summary>
            <div class="bce-acc__links">
${partyLinks
  .map((l) => `              <a href="${l.href}"${extAttrs(l)}>${l.label}</a>`)
  .join('\n')}
            </div>
          </details>
          <details class="bce-acc">
            <summary>Locations</summary>
            <div class="bce-acc__links">
${locationLinks.map((l) => `              <a href="${l.href}">${l.label}</a>`).join('\n')}
            </div>
          </details>
          <a href="/#reviews">Reviews</a>
          <a href="/#about">About</a>
          <a href="/jobs">Jobs</a>
          <a href="/#tickets" class="bce-cta bce-mobile__cta">Book Tickets</a>
        </div>
      </details>
    </div>
  </header>
  ${HEADER_END}`;

function footerLinkList(links) {
  return links
    .map(
      (l) => `            <li><a href="${l.href}"${extAttrs(l)}>${l.label}</a></li>`
    )
    .join('\n');
}

const FOOTER_YEAR = new Date().getFullYear();

const SITE_FOOTER_HTML = `${FOOTER_START}
  <footer id="contact" class="bce-footer">
    <div class="bce-footer__inner">
      <div class="bce-footer__grid">
        <div class="bce-footer__brand">
          <img src="${LOGO_SRC}" alt="Boombastic Events Logo" loading="lazy" decoding="async">
          <a href="mailto:hello@boomevents.co.uk" class="bce-footer__mail">${MAIL_SVG}<span>hello@boomevents.co.uk</span></a>
          <div class="bce-footer__social">
            <a href="https://www.facebook.com/boombastic.eventsuk" aria-label="Facebook" target="_blank" rel="noopener noreferrer">${FB_SVG}</a>
            <a href="https://www.instagram.com/boombastic.eventsuk" aria-label="Instagram" target="_blank" rel="noopener noreferrer">${IG_SVG}</a>
          </div>
        </div>
        <div>
          <h3>Our Parties</h3>
          <ul>
${footerLinkList(partyLinks)}
          </ul>
        </div>
        <div>
          <h3>Locations</h3>
          <ul>
${footerLinkList(locationLinks)}
          </ul>
        </div>
        <div>
          <h3>Company</h3>
          <ul>
${footerLinkList(companyLinks)}
          </ul>
        </div>
      </div>
      <div class="bce-footer__copy">
        &copy; ${FOOTER_YEAR} Boombastic Events Ltd. All rights reserved.
      </div>
    </div>
  </footer>
  ${FOOTER_END}`;

module.exports = {
  LOGO_SRC,
  HEADER_START,
  HEADER_END,
  FOOTER_START,
  FOOTER_END,
  CSS_START,
  CSS_END,
  SITE_CHROME_CSS,
  SITE_HEADER_HTML,
  SITE_FOOTER_HTML,
  partyLinks,
  locationLinks,
  companyLinks,
};
