(() => {
  const form = document.getElementById('ww-enquiry');
  if (!form) return;
  const roles = {venue:'Venue partnership', creator:'Photography or video', promotion:'Local audience promotion', both:'Content creation and audience promotion', dj:'DJ work', 'event-assistant':'Event Assistant work'};
  const brands = {boom:'Boombastic Events', pm:'THE 2PM CLUB Daytime Disco'};
  const query = new URLSearchParams(location.search);
  const role = form.elements.namedItem('role');
  const brand = form.elements.namedItem('brand');
  if (Object.hasOwn(roles, query.get('role'))) role.value = query.get('role');
  if (Object.hasOwn(brands, query.get('brand'))) brand.value = query.get('brand');
  const prepared = document.getElementById('ww-prepared');
  const status = document.getElementById('ww-status');
  const update = () => {
    form.querySelectorAll('[data-roles]').forEach(fieldset => {
      const relevant = fieldset.dataset.roles.split(' ').includes(role.value);
      fieldset.hidden = !relevant;
      fieldset.disabled = !relevant;
    });
    const link = document.getElementById('ww-role-link');
    link.replaceChildren();
    if (['dj', 'event-assistant'].includes(role.value)) {
      const anchor = document.createElement('a');
      anchor.href = 'https://www.boomevents.co.uk/jobs/' + role.value + '/';
      anchor.textContent = 'Read the current ' + (role.value === 'dj' ? 'DJ' : 'Event Assistant') + ' role and practical requirements →';
      link.append(anchor);
    }
    prepared.hidden = true;
    status.textContent = '';
  };
  role.addEventListener('change', update);
  brand.addEventListener('change', update);
  form.addEventListener('input', () => { prepared.hidden = true; status.textContent = ''; });
  update();
  const labels = {name:'Name', email:'Email', location:'Town / location', phone:'Phone', venue:'Venue name', venue_url:'Venue website', capacity:'Usable event capacity', venue_contact_role:'Role at venue', programme:'Existing programme', dates:'Potential date windows', travel:'Travel range', links:'Portfolio / social links', collaboration:'Collaboration offered', availability:'Availability', rates:'Rates / proposed commercial approach', audience_location:'Audience locations', reach:'Audience size and recent reach', experience:'Experience and links', work_availability:'General availability', work_travel:'Travel / vehicle', message:'Other details'};
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const subject = brands[brand.value] + ' | ' + roles[role.value] + ' | ' + data.get('location').trim();
    const lines = ['Hello Boombastic team,', '', 'I would like to discuss ' + roles[role.value].toLowerCase() + ' with ' + brands[brand.value] + '.', ''];
    for (const [key, label] of Object.entries(labels)) {
      const value = data.get(key)?.toString().trim();
      if (value) lines.push(label + ': ' + value, '');
    }
    const body = lines.join('\n');
    document.getElementById('ww-subject').value = subject;
    document.getElementById('ww-email-body').value = body;
    const mail = document.getElementById('ww-open-email');
    const mailto = 'mailto:hello@boomevents.co.uk?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    // Keep a usable webmail copy for long proposals and mail apps with short URL limits.
    mail.href = mailto.length <= 7500 ? mailto : 'mailto:hello@boomevents.co.uk?subject=' + encodeURIComponent(subject);
    status.textContent = mailto.length <= 7500 ? 'Your email is ready to review below. Nothing has been sent.' : 'Your email is ready below. Copy the details into your email app; this longer message will not be added automatically.';
    prepared.hidden = false;
    document.getElementById('ww-review-title').focus();
    prepared.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block:'start'});
  });
  document.getElementById('ww-copy-email').addEventListener('click', async () => {
    const text = 'To: hello@boomevents.co.uk\nSubject: ' + document.getElementById('ww-subject').value + '\n\n' + document.getElementById('ww-email-body').value;
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = 'Email details copied. Paste them into your email app and send to hello@boomevents.co.uk.';
    } catch (_) {
      document.getElementById('ww-email-body').focus();
      document.getElementById('ww-email-body').select();
      status.textContent = 'Automatic copying is unavailable. Select and copy the subject and message below into your email app.';
    }
  });
})();
