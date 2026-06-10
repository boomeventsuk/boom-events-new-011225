// Fires on every verified Netlify form submission (function name is the trigger).
// Pushes city-waitlist signups into the matching WAITLIST-BOOM-{CITY} Mailjet list.
// Capture only: never sends email. On Mailjet failure we log the full submission
// and return 200 so the data is still recoverable from logs + the Forms tab.

const MAILJET_BASE = 'https://api.mailjet.com/v3/REST';

// City name (as submitted by the form) -> Mailjet list ID, per boom-mailing-list conventions
const WAITLIST_LISTS = {
  northampton: 10533404, // WAITLIST-BOOM-NPTON
  'milton keynes': 10533405, // WAITLIST-BOOM-MK
  coventry: 10533406, // WAITLIST-BOOM-COV
  bedford: 10533407, // WAITLIST-BOOM-BED
  luton: 10533408, // WAITLIST-BOOM-LUT
  leicester: 10533409, // WAITLIST-BOOM-LEIC
  birmingham: 10533410 // WAITLIST-BOOM-BIRM
};
const FALLBACK_LIST = 10533411; // WAITLIST-BOOM-OTHER, also catches "Somewhere else"

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// POST with backoff on Mailjet rate limiting (429). Three attempts, waits of
// ~1.5s/3s between them: stays well inside the 10s function budget. Honours
// Retry-After when Mailjet sends one (capped so we never blow the budget).
async function mailjetPost(url, auth, payload) {
  let res;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: auth, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.status !== 429) return res;
    const retryAfter = Number(res.headers.get('retry-after')) || 0;
    const waitMs = Math.min(retryAfter * 1000 || 1500 * (attempt + 1), 3000);
    console.warn(`[submission-created] Mailjet 429, retrying in ${waitMs}ms (attempt ${attempt + 1}/3)`);
    await sleep(waitMs);
  }
  return res; // still 429 after retries: caller logs the payload, Forms tab keeps it
}

export const handler = async (event) => {
  let submission = null;
  try {
    submission = JSON.parse(event.body || '{}').payload || {};
    const formName = submission.form_name;
    if (formName !== 'city-waitlist') {
      console.log(`[submission-created] ignoring form: ${formName}`);
      return { statusCode: 200, body: 'ignored' };
    }

    const data = submission.data || {};
    const email = (data.email || '').trim().toLowerCase();
    const city = (data.city || '').trim();
    if (!email) {
      console.error('[submission-created] no email in payload', JSON.stringify(submission));
      return { statusCode: 200, body: 'no email' };
    }

    const apiKey = process.env.MAILJET_API_KEY;
    const apiSecret = process.env.MAILJET_SECRET_KEY;
    if (!apiKey || !apiSecret) {
      throw new Error('Mailjet credentials not configured');
    }
    const auth = 'Basic ' + Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    const listId = WAITLIST_LISTS[city.toLowerCase()] || FALLBACK_LIST;

    // Single call: creates the contact if new, sets properties, adds to list.
    // addnoforce respects prior unsubscribes; existing contacts are added to
    // the list, never errored (idempotent). 429s retried with backoff.
    const res = await mailjetPost(`${MAILJET_BASE}/contactslist/${listId}/managecontact`, auth, {
      Email: email,
      Action: 'addnoforce',
      Properties: {
        city,
        signup_source: 'city-waitlist',
        signup_date: new Date().toISOString().slice(0, 10)
      }
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Mailjet ${res.status}: ${text.slice(0, 300)}`);
    }

    console.log(`[submission-created] added ${email} to list ${listId} (city=${city})`);
    return { statusCode: 200, body: 'ok' };
  } catch (error) {
    // Never lose a signup: full payload into function logs, Forms tab keeps the original.
    console.error(`[submission-created] MAILJET FAILED, submission preserved in Forms tab: ${error.message}`);
    console.error('[submission-created] payload:', JSON.stringify(submission));
    return { statusCode: 200, body: 'logged' };
  }
};
