"""Owner-reviewed recruitment copy for Boombastic's V2 website."""

from html import escape


PHOTOS = {
    "pm-arms.jpg": ("Guests singing with their arms raised at THE 2PM CLUB", "THE 2PM CLUB, Northampton, June 2026"),
    "b90-stage.jpg": ("DJs on the Boombastic stage above a busy dancefloor", "Boombastic 90s, Northampton, September 2026"),
    "silent-photo.jpeg": ("Guests dancing in glowing silent disco headphones", "Silent Disco Greatest Hits, Northampton, April 2026"),
}


def event_photo(name, eager=False):
    alt, caption = PHOTOS[name]
    loading = "eager" if eager else "lazy"
    return f'<figure style="margin:1.5rem 0"><img src="/assets/{name}" alt="{escape(alt)}" loading="{loading}" decoding="async" width="1400" height="932" style="display:block;width:100%;height:auto;aspect-ratio:3/2;object-fit:cover;border-radius:8px"><figcaption style="font-size:.85rem;line-height:1.5;margin-top:.5rem">{escape(caption)}</figcaption></figure>'


ROLES = {
    'dj': {
        'title': 'DJs for our daytime discos and decades parties',
        'summary': 'Big anthems. Lots of fun. A warm welcome.',
        'description': 'Join Boombastic Events as a DJ for daytime discos and decades parties. Broad music taste, confident microphone skills and a willingness to follow our event formats.',
        'body': '''<p>We are looking for friendly, reliable DJs to join the team at Boombastic Events, including THE 2PM CLUB daytime discos and our decades parties.</p>
<p>Our events are a lot of fun, with big anthems and music that is not too niche. If you are comfortable following the structure of an event and working the audience with a microphone, we want to hear from you.</p>
<h2>How we work</h2>
<p>Our parties have an established musical identity and structure. We need DJs who are comfortable following a brief, working with supplied music and running orders, and following the planned sequence exactly when an event calls for it.</p>
<p>You bring the warmth, confidence and delivery. Welcome the crowd, encourage the singalongs and help people feel part of the party. Use the microphone thoughtfully, knowing when a few words will lift the room and when to let the music and crowd carry the moment.</p>
<h2>Who we are looking for</h2>
<ul><li>A broad taste in music and a love of big anthems.</li><li>Confident, welcoming microphone skills and a good feel for the room.</li><li>Someone easy to get on with, flexible and happy working as part of a team.</li><li>Reliability, good communication and a willingness to follow instructions.</li><li>DJ experience and confidence working with event sound equipment.</li><li>Your own large car or van, suitable for transporting event kit to and from our NN7 base.</li></ul>
<h2>The practical bits</h2>
<p>Paid event work, offered around our calendar. Events include daytime and evening parties, mainly at weekends. Some of the locations include Leicester, Milton Keynes, Bedford, Coventry and Oxford, amongst others. Availability and responsibilities are agreed for each booking, including any setup and packdown.</p>
<p>You will need to collect and return some event kit at our NN7 base. The kit will fit in a large car or a van.</p>
<p>You do not need to own a PA system. Many of our venues have sound systems in place. Access to a PA is a useful bonus for additional bookings or second-room work, so let us know if that is something you can offer.</p>
<p>Experience using VirtualDJ software is helpful. We can introduce you to our event setup and formats.</p>''',
        'subject': 'DJ%20Role%20-%20Boombastic%20Events',
        'apply': 'Tell us where you are based, your DJ experience and the music you enjoy playing, your general availability and what vehicle you have for transporting kit to and from NN7. Include any links to clips of you DJing or hosting a room, if you have them. Let us know about access to a PA too, if applicable.',
        'button': 'Enquire about DJ work',
    },
    'event-assistant': {
        'title': 'Event Assistant: casual event work',
        'summary': 'Help set up the party, welcome the guests and keep things running smoothly.',
        'description': 'Paid casual event assistant work with Boombastic Events. Help with setup, guest welcome, ticket scanning and packdown at daytime and evening parties.',
        'body': '''<p>We are looking for a few friendly, reliable people to help at Boombastic events. If you enjoy being around people and are happy getting stuck into the practical side of a party, we would love to hear from you.</p>
<p>You could be a student, work in hospitality or customer service, have some event experience, or simply be someone local who is useful in a busy room. You do not need previous event experience. We can show you how our events work.</p>
<h2>What you will do</h2>
<ul><li>Help load in, set up and pack away event equipment.</li><li>Prepare headphones, signage, lights or check-in areas.</li><li>Scan tickets, welcome guests and answer straightforward questions.</li><li>Help with queues, wristbands and the flow of people through the room.</li><li>Support the DJ or event lead with practical tasks.</li><li>Capture a few short video clips during an event when needed.</li></ul>
<h2>Who we are looking for</h2>
<p>Someone warm, practical and easy to work with, who turns up on time, listens and follows instructions. You will be comfortable talking to guests, being on your feet and helping carry and set up equipment.</p>
<p>We will explain what needs doing and how we run our events. Reliability, a helpful attitude and good communication matter more than a long CV.</p>
<h2>The practical bits</h2>
<p>Paid casual shifts, offered around the event calendar and your availability. This is occasional work, with no guaranteed weekly hours. Events include daytime and evening shifts, mainly at weekends, in Northampton and surrounding areas, with some wider Midlands work.</p>
<p>Driving is useful, but is not essential for every shift. Tell us where you are based and how you would travel. Some family or community events may require a DBS check.</p>
<p>The rate, shift times and travel arrangements will be confirmed before you accept a shift.</p>''',
        'subject': 'Events%20Assistant%20Role',
        'apply': 'Tell us where you are based, when you are generally available, how you would travel to events and why this sounds like your kind of work. Include any relevant experience, but you do not need a formal CV to introduce yourself.',
        'button': 'Enquire about event assistant work',
    },
}


def render_recruitment_page(page, role=None):
    if role is None:
        css = '<style>.recruitment-index .legal-page{padding-top:56px;padding-bottom:56px}.recruitment-index .sticky-cta{display:none}.recruitment-intro{max-width:760px;margin:0 auto 32px}.recruitment-intro h1{margin:0 0 12px}.recruitment-intro p{font-size:18px;line-height:1.5}.recruitment-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;max-width:900px;margin:auto}.recruitment-card{border:2px solid #171717;border-radius:12px;background:#fff;padding:28px;display:flex;flex-direction:column;gap:16px}.recruitment-card h2{font-size:34px;line-height:1.1;margin:0}.recruitment-card p{margin:0;line-height:1.5}.recruitment-card ul{padding-left:20px;margin:0;line-height:1.7}.recruitment-card .btn{margin-top:auto;display:flex;justify-content:center;background:#df4537;color:#fff;min-height:48px;width:100%;font-weight:700}.recruitment-photo{max-width:900px;margin:36px auto 0}.recruitment-photo img{display:block;width:100%;height:160px;object-fit:cover;object-position:center 42%;border-radius:10px}.recruitment-photo figcaption{font-size:13px;margin-top:8px;line-height:1.4}@media(max-width:650px){.recruitment-index .legal-page{padding-top:36px;padding-bottom:40px}.recruitment-intro{margin-bottom:24px}.recruitment-grid{grid-template-columns:1fr;gap:16px}.recruitment-card{padding:24px;gap:16px}.recruitment-card h2{font-size:30px}.recruitment-intro p{font-size:16px}.recruitment-photo img{height:120px}}</style>'
        cards = '<section class="recruitment-card" aria-labelledby="dj-role"><h2 id="dj-role">DJs</h2><p>Host our daytime discos and decades parties. Big anthems, lots of fun. Comfortable following the event structure and working the audience with a microphone? We want to hear from you.</p><ul><li>Paid daytime and evening event work</li><li>Your own large car or van for kit transport from NN7</li><li>Owning a PA is optional</li></ul><a class="btn" href="/jobs/dj/">View DJ role →</a></section><section class="recruitment-card" aria-labelledby="assistant-role"><h2 id="assistant-role">Event Assistants</h2><p>Help set up, welcome guests and keep the party running smoothly. Friendly, reliable and happy to get stuck in.</p><ul><li>Paid casual shifts, mainly weekends</li><li>Northampton and surrounding areas</li><li>No event experience needed</li></ul><a class="btn" href="/jobs/event-assistant/">View Event Assistant role →</a></section>'
        photo = '<figure class="recruitment-photo"><img src="/assets/b90-stage.jpg" alt="DJs and a singing crowd at a Boombastic event" width="1400" height="932" loading="lazy"><figcaption>Boombastic 90s, Northampton, September 2026</figcaption></figure>'
        body = css + '<section class="container legal-page"><div class="recruitment-intro"><h1>Work with us</h1><p>Paid event work with Boombastic Events and THE 2PM CLUB. Choose a role below.</p></div><div class="recruitment-grid">' + cards + '</div>' + photo + '</section>'
        return page('boom', 'Work with us', body, 'Join Boombastic Events as a DJ or event assistant for daytime discos and decades parties.', body_class='recruitment-index')
    r = ROLES[role]
    lead_photo = event_photo('b90-stage.jpg' if role == 'dj' else 'silent-photo.jpeg', eager=True)
    supporting_photo = ''
    email = f'mailto:hello@boomevents.co.uk?subject={r["subject"]}'
    body = f'<style>.recruitment-role .legal-page{{padding-top:56px;padding-bottom:56px}}@media(max-width:650px){{.recruitment-role .legal-page{{padding-top:36px;padding-bottom:40px}}}}</style><article class="prose container legal-page"><p><a href="/jobs/">← All event roles</a></p><h1>{r["title"]}</h1><p class="lede">{r["summary"]}</p><p><a class="btn btn-dark" href="#apply">{r["button"]} →</a></p>{lead_photo}{r["body"]}{supporting_photo}<h2 id="apply">Interested?</h2><p>{r["apply"]}</p><p><a class="btn btn-dark" href="{email}">{r["button"]} →</a></p><p>Email <a href="{email}">hello@boomevents.co.uk</a>. We will be in touch to talk through suitable opportunities.</p></article>'
    return page('boom', r['title'], body, r['description'], sticky_label=r['button'], sticky_href='#apply', body_class='recruitment-role')
