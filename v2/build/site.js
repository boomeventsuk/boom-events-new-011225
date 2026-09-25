(() => {
  // Header disclosure menus (Locations, About): click or tap to open. Inline accordions inside the phone menu.
  const dds = Array.from(document.querySelectorAll('.dd'));
  const desktop = window.matchMedia('(min-width: 761px)');
  const setDd = (dd, open, focusBtn) => {
    const b = dd.querySelector('.dd-btn');
    b.setAttribute('aria-expanded', String(open));
    dd.querySelector('.dd-panel').hidden = !open;
    dd.classList.toggle('is-open', open);
    if (focusBtn) b.focus();
  };
  dds.forEach(dd => {
    dd.querySelector('.dd-btn').addEventListener('click', () => {
      const open = !dd.classList.contains('is-open');
      dds.forEach(o => { if (o !== dd) setDd(o, false); });
      setDd(dd, open);
    });
    // Desktop: tabbing out of an open menu closes it. relatedTarget is null for mouse clicks, which the document handler covers.
    dd.addEventListener('focusout', e => { if (desktop.matches && e.relatedTarget && !dd.contains(e.relatedTarget)) setDd(dd, false); });
  });
  document.addEventListener('click', e => { dds.forEach(dd => { if (dd.classList.contains('is-open') && !dd.contains(e.target) && desktop.matches) setDd(dd, false); }); });

  // Phone menu
  const menu = document.querySelector('.menu-btn');
  const nav = document.querySelector('#main-nav');
  const closeNav = () => { if (!menu) return; menu.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-label', 'Open menu'); nav.classList.remove('is-open'); document.body.classList.remove('menu-open'); };
  if (menu && nav) {
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('menu-open', open);
      if (open) nav.querySelector('a, button')?.focus();
    });
    nav.addEventListener('click', e => { if (e.target.closest('a')) { closeNav(); dds.forEach(dd => setDd(dd, false)); } });
  }
  // Escape closes the innermost open layer first: a disclosure menu, then the phone menu.
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const open = dds.find(dd => dd.classList.contains('is-open'));
    if (open) { setDd(open, false, true); return; }
    if (nav?.classList.contains('is-open')) { closeNav(); menu.focus(); }
  });

  // Event filters: hide non-matching cards/rows for real
  document.querySelectorAll('[data-filters]').forEach(bar => {
    const section = bar.closest('section');
    const items = Array.from(section.querySelectorAll('[data-item]'));
    const fields = Array.from(bar.querySelectorAll('select'));
    const reset = bar.querySelector('.reset');
    const count = section.querySelector('.count');
    const empty = section.querySelector('.empty');
    const featured = Number(bar.dataset.featured || 0);
    const limit = () => (featured ? (window.innerWidth < 760 ? Math.min(2, featured) : featured) : 0);
    function update() {
      const active = fields.some(f => f.value);
      const lim = limit();
      let matched = 0, shown = 0;
      items.forEach(item => {
        const ok = fields.every(f => !f.value || (f.dataset.filter === 'month' ? item.dataset.date.startsWith(f.value) : f.dataset.filter === 'type' ? item.dataset.type.split(' ').includes(f.value) : item.dataset[f.dataset.filter] === f.value));
        if (ok) matched++;
        const visible = ok && (!lim || active || matched <= lim);
        item.hidden = !visible;
        if (visible) shown++;
      });
      if (reset) reset.hidden = !active;
      if (count) count.textContent = lim && !active ? `Showing the next ${shown} of ${items.length} dates` : `${shown} ${shown === 1 ? 'date' : 'dates'}${active ? ' match' : ''}`;
      if (empty) empty.hidden = shown !== 0;
    }
    const clear = () => { fields.forEach(f => { f.value = ''; }); update(); };
    bar.addEventListener('change', update);
    reset?.addEventListener('click', clear);
    empty?.querySelector('.empty-reset')?.addEventListener('click', clear);
    let w = window.innerWidth;
    window.addEventListener('resize', () => { if ((w < 760) !== (window.innerWidth < 760)) { w = window.innerWidth; update(); } });
    update();
  });

  // FAQ side navigation highlight
  const faqLinks = Array.from(document.querySelectorAll('.faq-side nav a'));
  if (faqLinks.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) faqLinks.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    document.querySelectorAll('.faq-group').forEach(g => io.observe(g));
  }

  // Sticky booking bar steps aside when the section it points to (tickets, signup, nearby dates) or the footer is on screen
  const bar = document.querySelector('.sticky-cta');
  const targets = [document.querySelector('#tickets'), document.querySelector('.ftr'), document.querySelector('#signup'), document.querySelector('#nearby')].filter(Boolean);
  if (bar && targets.length && 'IntersectionObserver' in window) {
    const seen = new Set();
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { en.isIntersecting ? seen.add(en.target) : seen.delete(en.target); });
      bar.classList.toggle('is-hidden', seen.size > 0);
    });
    targets.forEach(t => io.observe(t));
  }

  // Prior-event video on 2PM ticket pages. Keep the poster visible and the
  // checkout ahead of this media; load the reel only when it is approached.
  document.querySelectorAll('[data-event-reel]').forEach(video => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let started = false;
    let fallbackUsed = false;
    const start = () => {
      if (started) return;
      started = true;
      video.src = video.dataset.primary;
      video.load();
    };
    video.addEventListener('canplay', () => {
      video.classList.add('is-ready');
      if (!reducedMotion && video.paused) video.play().catch(() => {});
    });
    video.addEventListener('error', () => {
      if (fallbackUsed || video.dataset.primary === video.dataset.fallback) return;
      fallbackUsed = true;
      video.src = video.dataset.fallback;
      video.load();
    });
    const poster = video.parentElement.querySelector('img');
    const activate = () => {
      if (poster && !poster.complete) {
        poster.addEventListener('load', start, { once: true });
        poster.addEventListener('error', start, { once: true });
      }
      else start();
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) { activate(); io.disconnect(); }
      }, { rootMargin: '250px 0px' });
      io.observe(video);
    } else activate();
  });

  // Eventbrite checkout widget with owned fallback
  const widget = document.querySelector('[data-eventbrite-id]');
  if (widget) {
    const loading = widget.querySelector('.widget-loading');
    const eventId = widget.dataset.eventbriteId;
    const fail = () => { if (loading) loading.textContent = 'Ticket selector unavailable here. Use the official event page link.'; };
    let widgetStarted = false;
    const start = () => {
      if (widgetStarted) return;
      widgetStarted = true;
      if (!window.EBWidgets || !/^\d+$/.test(eventId)) return fail();
      try {
        window.EBWidgets.createWidget({ widgetType: 'checkout', eventId, iframeContainerId: widget.id, iframeContainerHeight: 480 });
        const done = () => {
          const frame = widget.querySelector('iframe');
          if (frame) { frame.title = widget.getAttribute('aria-label'); loading?.remove(); return true; }
          return false;
        };
        if (!done()) { const mo = new MutationObserver(() => { if (done()) mo.disconnect(); }); mo.observe(widget, { childList: true, subtree: true }); }
      } catch (_) { fail(); }
    };
    const load = () => {
      const s = document.createElement('script');
      s.src = 'https://www.eventbrite.co.uk/static/widgets/eb_widgets.js';
      s.async = true; s.onload = start; s.onerror = fail;
      document.body.appendChild(s);
    };
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        if (entries.some(entry => entry.isIntersecting)) { load(); io.disconnect(); }
      }, { rootMargin: '900px 0px' });
      io.observe(widget);
    } else load();
  }
})();
