import {
  JSON_HEADERS,
  buildCustomData,
  buildUserData,
  compact,
  jsonResponse,
  nowIso,
  parseJsonBody,
  safeSetJSON,
  sendMetaEvent,
  getOptionalStore
} from './_tracking.js';

const DEFAULT_PIXEL_ID = '1947538679159165';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: JSON_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { ok: false, error: 'method_not_allowed' });
  }

  try {
    const body = parseJsonBody(event);
    const eventName = body.event_name;
    const eventId = body.event_id;

    if (!eventName || !eventId) {
      return jsonResponse(400, { ok: false, error: 'missing_event_name_or_event_id' });
    }

    const pixelId = process.env.META_PIXEL_ID || process.env.BOOM_META_PIXEL_ID || DEFAULT_PIXEL_ID;
    const accessToken = process.env.META_CAPI_ACCESS_TOKEN || process.env.BOOM_META_CAPI_ACCESS_TOKEN;
    const testEventCode = process.env.META_TEST_EVENT_CODE || process.env.BOOM_META_TEST_EVENT_CODE;
    const store = getOptionalStore();
    const userData = buildUserData({ body, headers: event.headers, includeRequestClient: true });
    const customData = buildCustomData({
      body,
      value: body.value ?? body.transaction_value,
      currency: body.currency || 'GBP',
      orderId: body.order_id
    });

    const record = compact({
      received_at: nowIso(),
      pixel_id: pixelId,
      event_name: eventName,
      event_id: eventId,
      event_slug: body.event_slug,
      event_title: body.event_title,
      eventbrite_id: body.eventbrite_id,
      tracking_session_id: body.tracking_session_id,
      event_source_url: body.event_source_url,
      order_id: body.order_id,
      value: body.value ?? body.transaction_value,
      currency: body.currency || 'GBP',
      user_data: userData,
      custom_data: customData,
      raw: body
    });

    await Promise.all([
      safeSetJSON(store, `event:${eventId}`, record),
      safeSetJSON(store, body.tracking_session_id ? `session:${body.tracking_session_id}` : null, record),
      safeSetJSON(store, body.eventbrite_id && body.tracking_session_id ? `eventbrite:${body.eventbrite_id}:${body.tracking_session_id}` : null, record),
      safeSetJSON(store, body.eventbrite_id ? `latest_eventbrite:${body.eventbrite_id}` : null, record),
      safeSetJSON(store, body.order_id ? `order:${body.order_id}` : null, record)
    ]);

    const metaResult = await sendMetaEvent({
      pixelId,
      accessToken,
      testEventCode,
      eventName,
      eventId,
      eventSourceUrl: body.event_source_url,
      userData,
      customData
    });

    return jsonResponse(200, {
      ok: true,
      stored: Boolean(store),
      meta: metaResult
    });
  } catch (error) {
    console.error('[meta-event] failed', error);
    return jsonResponse(500, { ok: false, error: error.message });
  }
};
