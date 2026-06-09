import {
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
  parseJsonBody,
  safeGetJSON,
  safeSetJSON,
  sendMetaEvent,
  getOptionalStore,
  nowIso
} from './_tracking.js';

const DEFAULT_PIXEL_ID = '1947538679159165';
const EVENTS_FILE = 'public/events-boombastic.json';
const DEFAULT_SITE_URL = 'https://www.boomevents.co.uk';

const getProvidedSecret = (event) => {
  const queryToken = event.queryStringParameters?.token;
  const headerToken = event.headers['x-webhook-token'];
  const auth = event.headers.authorization || '';
  const bearer = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : undefined;
  return queryToken || headerToken || bearer;
};

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: JSON_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'method_not_allowed' });
  }

  const requiredSecret = process.env.EVENTBRITE_WEBHOOK_SECRET;
  if (requiredSecret && getProvidedSecret(event) !== requiredSecret) {
    return jsonResponse(401, { ok: false, error: 'unauthorized' });
  }

  try {
    const payload = parseJsonBody(event);
    const action = payload?.config?.action || payload?.action;
    if (action && !String(action).startsWith('order.')) {
      return jsonResponse(200, { ok: true, ignored: action });
    }

    const eventbriteToken = process.env.EVENTBRITE_TOKEN || process.env.EVENTBRITE_PRIVATE_TOKEN;
    const order = await fetchEventbriteObject(payload.api_url, eventbriteToken).catch((error) => {
      console.warn(`[eventbrite-webhook] order fetch failed: ${error.message}`);
      return payload;
    });

    const orderId = extractOrderId(payload, order);
    const eventbriteId = extractEventbriteId(payload, order);
    const events = loadEvents(EVENTS_FILE);
    const siteEvent = findEventByEventbriteId(events, eventbriteId) || {};
    const slug = siteEvent.eventCode?.toLowerCase() || siteEvent.slug || eventbriteId;
    const buyer = extractBuyer(order);
    const value = extractOrderValue(order);
    const pixelId = process.env.META_PIXEL_ID || process.env.BOOM_META_PIXEL_ID || DEFAULT_PIXEL_ID;
    const accessToken = process.env.META_CAPI_ACCESS_TOKEN || process.env.BOOM_META_CAPI_ACCESS_TOKEN;
    const testEventCode = process.env.META_TEST_EVENT_CODE || process.env.BOOM_META_TEST_EVENT_CODE;
    const store = getOptionalStore();
    const storedOrderContext = await safeGetJSON(store, orderId ? `order:${orderId}` : null);
    const eventId = storedOrderContext?.event_id || createStablePurchaseEventId(slug, orderId);
    const eventSourceUrl = storedOrderContext?.event_source_url || `${process.env.URL || DEFAULT_SITE_URL}/event/${siteEvent.eventCode || slug}/`;
    const body = compact({
      event_slug: slug,
      event_title: siteEvent.title,
      eventbrite_id: eventbriteId,
      event_city: siteEvent.city,
      event_venue: siteEvent.venue || siteEvent.location?.split(',')[0]?.trim(),
      event_start: siteEvent.start,
      event_price: siteEvent.price,
      event_brand: 'Boombastic Events',
      content_name: siteEvent.title,
      order_id: orderId,
      value,
      currency: 'GBP'
    });

    const userData = buildUserData({
      body,
      headers: event.headers,
      storedContext: storedOrderContext,
      buyer,
      includeRequestClient: false
    });
    const customData = buildCustomData({
      body,
      eventRecord: siteEvent,
      value,
      currency: 'GBP',
      orderId
    });

    const metaResult = await sendMetaEvent({
      pixelId,
      accessToken,
      testEventCode,
      eventName: 'Purchase',
      eventId,
      eventSourceUrl,
      userData,
      customData
    });

    const record = compact({
      received_at: nowIso(),
      source: 'eventbrite_webhook',
      action,
      event_name: 'Purchase',
      event_id: eventId,
      order_id: orderId,
      eventbrite_id: eventbriteId,
      event_slug: slug,
      event_source_url: eventSourceUrl,
      value,
      currency: 'GBP',
      used_browser_context: Boolean(storedOrderContext),
      meta: metaResult
    });

    await safeSetJSON(store, orderId ? `webhook_order:${orderId}` : `webhook:${Date.now()}`, record);

    return jsonResponse(200, {
      ok: true,
      order_id: orderId,
      eventbrite_id: eventbriteId,
      event_id: eventId,
      used_browser_context: Boolean(storedOrderContext),
      meta: metaResult
    });
  } catch (error) {
    console.error('[eventbrite-webhook] failed', error);
    return jsonResponse(500, { ok: false, error: error.message });
  }
};
