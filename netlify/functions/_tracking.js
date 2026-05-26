import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { getStore } from '@netlify/blobs';

const JSON_HEADERS = {
  'content-type': 'application/json',
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'content-type, authorization, x-webhook-token'
};

const nowIso = () => new Date().toISOString();

const jsonResponse = (statusCode, body) => ({
  statusCode,
  headers: JSON_HEADERS,
  body: JSON.stringify(body)
});

const parseJsonBody = (event) => {
  if (!event.body) return {};
  return JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body);
};

const compact = (payload) => Object.fromEntries(
  Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== '')
);

const sha256 = (value) => createHash('sha256')
  .update(String(value).trim().toLowerCase())
  .digest('hex');

const normalisePhone = (value) => String(value || '').replace(/[^\d+]/g, '');

const hashUserValue = (value, normaliser = (input) => String(input || '').trim().toLowerCase()) => {
  const normalised = normaliser(value);
  return normalised ? sha256(normalised) : undefined;
};

const getClientIp = (headers = {}) => {
  const direct = headers['x-nf-client-connection-ip'] || headers['client-ip'];
  if (direct) return direct;
  const forwarded = headers['x-forwarded-for'];
  return forwarded ? forwarded.split(',')[0].trim() : undefined;
};

const getOptionalStore = (name = 'pixel-tracking') => {
  try {
    return getStore(name);
  } catch (error) {
    console.warn(`[tracking] Netlify Blobs unavailable: ${error.message}`);
    return null;
  }
};

const safeSetJSON = async (store, key, value) => {
  if (!store || !key) return false;
  try {
    await store.setJSON(key, value);
    return true;
  } catch (error) {
    console.warn(`[tracking] Failed to store ${key}: ${error.message}`);
    return false;
  }
};

const safeGetJSON = async (store, key) => {
  if (!store || !key) return null;
  try {
    return await store.get(key, { type: 'json' });
  } catch (error) {
    console.warn(`[tracking] Failed to read ${key}: ${error.message}`);
    return null;
  }
};

const loadEvents = (eventsFile) => {
  try {
    const filePath = path.join(process.cwd(), eventsFile);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    console.warn(`[tracking] Failed to load ${eventsFile}: ${error.message}`);
    return [];
  }
};

const findEventByEventbriteId = (events, eventbriteId) => {
  if (!eventbriteId) return null;
  return events.find((event) => String(event.eventbriteId) === String(eventbriteId)) || null;
};

const cleanEventIdPart = (value) => String(value || '')
  .replace(/[^a-zA-Z0-9_-]/g, '_')
  .slice(0, 80);

const createStablePurchaseEventId = (slug, orderId) => (
  cleanEventIdPart(`Purchase_${slug || 'unknown'}_${orderId || Date.now()}`)
);

const appendQueryParam = (rawUrl, key, value) => {
  try {
    const url = new URL(rawUrl);
    url.searchParams.set(key, value);
    return url.toString();
  } catch {
    return rawUrl;
  }
};

const fetchEventbriteObject = async (apiUrl, token) => {
  if (!apiUrl || !token) return null;
  const url = new URL(apiUrl);
  if (!['www.eventbriteapi.com', 'eventbriteapi.com'].includes(url.hostname)) {
    throw new Error('Rejected non-Eventbrite api_url');
  }
  const res = await fetch(appendQueryParam(url.toString(), 'expand', 'attendees'), {
    headers: { authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    throw new Error(`Eventbrite API returned ${res.status}`);
  }
  return res.json();
};

const extractOrderId = (payload, order) => {
  if (order?.id) return String(order.id);
  const match = String(payload?.api_url || '').match(/orders\/([^/?]+)/);
  return match ? match[1] : undefined;
};

const extractEventbriteId = (payload, order) => (
  order?.event_id ||
  order?.event?.id ||
  payload?.event_id ||
  payload?.config?.event_id
);

const valueFromMoney = (money) => {
  if (!money) return undefined;
  if (money.major_value !== undefined) return Number(money.major_value);
  if (money.display !== undefined) {
    const parsed = Number(String(money.display).replace(/[^\d.]/g, ''));
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  if (money.value !== undefined) {
    const parsed = Number(money.value);
    return Number.isNaN(parsed) ? undefined : parsed / 100;
  }
  return undefined;
};

const extractOrderValue = (order) => {
  const candidates = [
    order?.costs?.gross,
    order?.gross,
    order?.gross_total,
    order?.total
  ];
  for (const candidate of candidates) {
    const value = valueFromMoney(candidate);
    if (value !== undefined) return value;
  }
  return undefined;
};

const extractBuyer = (order) => {
  const attendeeProfile = Array.isArray(order?.attendees) ? order.attendees[0]?.profile : undefined;
  const profile = order?.profile || order?.buyer || attendeeProfile || {};
  const name = profile.name || order?.name || [profile.first_name, profile.last_name].filter(Boolean).join(' ');
  const [firstName, ...lastParts] = String(name || '').trim().split(/\s+/).filter(Boolean);
  return {
    email: profile.email || order?.email,
    phone: profile.cell_phone || profile.phone || order?.phone,
    firstName: profile.first_name || firstName,
    lastName: profile.last_name || lastParts.join(' ')
  };
};

const buildUserData = ({ body = {}, headers = {}, storedContext = {}, buyer = {}, includeRequestClient = true }) => compact({
  client_ip_address: includeRequestClient ? getClientIp(headers) : storedContext?.user_data?.client_ip_address,
  client_user_agent: includeRequestClient ? headers['user-agent'] : storedContext?.user_data?.client_user_agent,
  fbp: body.meta_browser_id || body.fbp || storedContext?.user_data?.fbp,
  fbc: body.meta_click_id || body.fbc || storedContext?.user_data?.fbc,
  em: hashUserValue(buyer.email),
  ph: hashUserValue(buyer.phone, normalisePhone),
  fn: hashUserValue(buyer.firstName),
  ln: hashUserValue(buyer.lastName)
});

const buildCustomData = ({ body = {}, eventRecord = {}, value, currency = 'GBP', orderId }) => compact({
  currency,
  value,
  order_id: orderId || body.order_id,
  content_name: body.content_name || body.event_title || eventRecord.title,
  content_type: 'event',
  content_ids: body.content_ids || [body.event_slug || eventRecord.slug || eventRecord.eventCode].filter(Boolean),
  contents: body.contents || [
    compact({
      id: body.event_slug || eventRecord.slug || eventRecord.eventCode,
      quantity: 1,
      item_price: body.event_price || eventRecord.price
    })
  ],
  eventbrite_id: body.eventbrite_id || eventRecord.eventbriteId,
  city: body.event_city || eventRecord.city || eventRecord.location?.split(',').pop()?.trim(),
  venue: body.event_venue || eventRecord.venue || eventRecord.location?.split(',')[0]?.trim(),
  event_date: body.event_date || body.event_start || eventRecord.start,
  brand: body.event_brand
});

const sendMetaEvent = async ({ pixelId, accessToken, testEventCode, eventName, eventId, eventSourceUrl, userData, customData }) => {
  if (!accessToken) {
    return { sent: false, reason: 'missing_META_CAPI_ACCESS_TOKEN' };
  }
  if (!pixelId) {
    return { sent: false, reason: 'missing_META_PIXEL_ID' };
  }

  const payload = compact({
    data: [{
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: 'website',
      event_source_url: eventSourceUrl,
      user_data: userData,
      custom_data: customData
    }],
    test_event_code: testEventCode
  });

  const res = await fetch(`https://graph.facebook.com/v24.0/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const responseBody = await res.json().catch(() => ({}));
  return {
    sent: res.ok,
    status: res.status,
    response: responseBody
  };
};

export {
  JSON_HEADERS,
  buildCustomData,
  buildUserData,
  compact,
  createStablePurchaseEventId,
  extractBuyer,
  extractEventbriteId,
  extractOrderId,
  extractOrderValue,
  fetchEventbriteObject,
  findEventByEventbriteId,
  jsonResponse,
  loadEvents,
  nowIso,
  parseJsonBody,
  safeGetJSON,
  safeSetJSON,
  sendMetaEvent,
  getOptionalStore
};
