import { getConsentStatus, isConsentGranted } from './cookieConsent';

declare global {
  interface Window {
    dataLayer: any[];
    fbq?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
  }
}

export interface EventTrackingContext {
  eventbriteId?: string;
  city?: string;
  venue?: string;
  date?: string;
  startIso?: string;
  status?: string;
  price?: number;
  source?: string;
  eventType?: string;
  brand?: string;
}

const TRACKING_SESSION_KEY = 'boom_tracking_session_id';
const trackedOnce = new Set<string>();

const compact = (payload: Record<string, any>): Record<string, any> => {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
};

const cleanIdPart = (value: string): string => {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
};

const getRandomPart = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(36).slice(2)}`;
};

const createEventId = (eventName: string, slug: string, stableId?: string): string => {
  return cleanIdPart(`${eventName}_${slug}_${stableId || getRandomPart()}`);
};

const getCookieValue = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
};

const getTrackingSessionId = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  try {
    const existing = sessionStorage.getItem(TRACKING_SESSION_KEY);
    if (existing) return existing;
    const next = `sess_${getRandomPart()}`;
    sessionStorage.setItem(TRACKING_SESSION_KEY, next);
    return next;
  } catch {
    return undefined;
  }
};

const getBrowserTrackingContext = (): Record<string, any> => {
  if (typeof window === 'undefined') return {};
  const url = new URL(window.location.href);
  const fbclid = url.searchParams.get('fbclid') || undefined;
  const fbc = getCookieValue('_fbc') || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : undefined);

  return compact({
    tracking_session_id: getTrackingSessionId(),
    event_source_url: window.location.href,
    page_path: window.location.pathname + window.location.search,
    meta_browser_id: getCookieValue('_fbp'),
    meta_click_id: fbc,
    fbclid,
    utm_source: url.searchParams.get('utm_source') || undefined,
    utm_medium: url.searchParams.get('utm_medium') || undefined,
    utm_campaign: url.searchParams.get('utm_campaign') || undefined,
    utm_content: url.searchParams.get('utm_content') || undefined,
    utm_term: url.searchParams.get('utm_term') || undefined
  });
};

const inferEventType = (slug: string): string => {
  const upper = slug.toUpperCase();
  if (upper.includes('-2PM-')) return '2PM';
  if (upper.includes('-GR-')) return 'GET_READY';
  if (upper.includes('-FSD-')) return 'FAMILY_SILENT_DISCO';
  if (upper.includes('-SD-')) return 'SILENT_DISCO';
  if (upper.includes('-FL80-')) return 'FOOTLOOSE_80S';
  if (upper.includes('-B90-')) return 'BOOMBASTIC_90S';
  return 'BOOM_EVENTS';
};

const buildEventContext = (
  slug: string,
  title: string,
  context: EventTrackingContext = {}
): Record<string, any> => {
  return compact({
    event_slug: slug,
    event_type: context.eventType || inferEventType(slug),
    event_title: title,
    eventbrite_id: context.eventbriteId,
    event_city: context.city,
    event_venue: context.venue,
    event_date: context.date,
    event_start: context.startIso,
    event_status: context.status,
    event_price: context.price,
    event_brand: context.brand || 'Boombastic Events',
    interaction_source: context.source,
    ...getBrowserTrackingContext()
  });
};

const buildMetaParams = (
  slug: string,
  title: string,
  context: EventTrackingContext = {},
  extra: Record<string, any> = {}
): Record<string, any> => {
  return compact({
    content_name: title,
    content_type: 'event',
    content_ids: [slug],
    contents: [
      compact({
        id: slug,
        quantity: 1,
        item_price: context.price
      })
    ],
    eventbrite_id: context.eventbriteId,
    city: context.city,
    venue: context.venue,
    event_date: context.date || context.startIso,
    brand: context.brand || 'Boombastic Events',
    ...extra
  });
};

const sendServerEvent = (
  eventName: string,
  eventId: string,
  metaParams: Record<string, any>,
  eventContext: Record<string, any>,
  extra: Record<string, any> = {}
) => {
  if (typeof window === 'undefined') return;
  if (!isConsentGranted()) return;

  const payload = compact({
    event_name: eventName,
    event_id: eventId,
    consent_status: getConsentStatus(),
    ...eventContext,
    content_name: metaParams.content_name,
    content_type: metaParams.content_type,
    content_ids: metaParams.content_ids,
    contents: metaParams.contents,
    eventbrite_id: metaParams.eventbrite_id || eventContext.eventbrite_id,
    currency: metaParams.currency,
    value: metaParams.value,
    ...extra
  });
  const body = JSON.stringify(payload);

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon('/.netlify/functions/meta-event', blob)) return;
    }
    fetch('/.netlify/functions/meta-event', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true
    }).catch(() => {});
  } catch {
    // Non-blocking analytics path.
  }
};

const normaliseTitleAndContext = (
  titleOrContext?: string | EventTrackingContext,
  context?: EventTrackingContext
): { title: string; context: EventTrackingContext } => {
  if (typeof titleOrContext === 'object') {
    return { title: '', context: titleOrContext };
  }
  return { title: titleOrContext || '', context: context || {} };
};

const shouldTrackOnce = (eventName: string, slug: string): boolean => {
  const key = `${eventName}:${slug}`;
  if (trackedOnce.has(key)) return false;
  trackedOnce.add(key);
  return true;
};

// Helper to track Meta Pixel events - only fires if consent granted
const trackFbEvent = (eventName: string, params?: Record<string, any>, eventId?: string) => {
  if (typeof window !== 'undefined' && window.fbq && isConsentGranted()) {
    if (eventId) {
      window.fbq('track', eventName, params, { eventID: eventId });
    } else {
      window.fbq('track', eventName, params);
    }
  }
};

// Conversion tracking calls fbq directly; Meta's consent state still controls transmission.
const trackFbConversion = (eventName: string, params?: Record<string, any>, eventId?: string) => {
  if (typeof window !== 'undefined' && window.fbq) {
    if (eventId) {
      window.fbq('track', eventName, params, { eventID: eventId });
    } else {
      window.fbq('track', eventName, params);
    }
  }
};

// Helper to track GA4 events - only fires if consent granted
const trackGaEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag && isConsentGranted()) {
    window.gtag('event', eventName, params);
  }
};

// Generic SPA page_view - fired on every route change. Respects consent.
export const trackPageView = (path: string, title: string) => {
  pushToDataLayer({
    event: 'page_view',
    page_path: path,
    page_title: title,
    page_location: typeof window !== 'undefined' ? window.location.href : undefined
  });

  trackFbEvent('PageView');

  trackGaEvent('page_view', {
    page_path: path,
    page_title: title,
    page_location: typeof window !== 'undefined' ? window.location.href : undefined
  });
};

export const pushToDataLayer = (event: Record<string, any>) => {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
};

export const trackEventPageView = (slug: string, title: string, context: EventTrackingContext = {}) => {
  if (!shouldTrackOnce('ViewContent', slug)) return;
  const eventId = createEventId('ViewContent', slug);
  const eventContext = buildEventContext(slug, title, context);
  const metaParams = buildMetaParams(slug, title, context);
  pushToDataLayer({
    event: 'eventpage_view',
    event_id: eventId,
    ...eventContext
  });
  
  // Meta Pixel: ViewContent
  trackFbEvent('ViewContent', metaParams, eventId);
  sendServerEvent('ViewContent', eventId, metaParams, eventContext);
  
  // GA4: page_view
  trackGaEvent('page_view', {
    page_title: title,
    page_location: window.location.href,
    event_id: eventId
  });
};

export const trackBookClick = (
  slug: string,
  titleOrContext?: string | EventTrackingContext,
  maybeContext?: EventTrackingContext
) => {
  const { title, context } = normaliseTitleAndContext(titleOrContext, maybeContext);
  if (!shouldTrackOnce('InitiateCheckout', slug)) return;
  const eventId = createEventId('InitiateCheckout', slug);
  const eventContext = buildEventContext(slug, title, context);
  const metaParams = buildMetaParams(slug, title, context);
  pushToDataLayer({
    event: 'eventpage_book_click',
    event_id: eventId,
    ...eventContext
  });
  
  // Meta Pixel: InitiateCheckout
  trackFbConversion('InitiateCheckout', metaParams, eventId);
  sendServerEvent('InitiateCheckout', eventId, metaParams, eventContext);
  
  // GA4: begin_checkout
  trackGaEvent('begin_checkout', {
    event_slug: slug,
    event_id: eventId
  });
};

export const trackShare = (platform: 'WhatsApp' | 'Facebook' | 'Messenger', eventName: string) => {
  pushToDataLayer({
    event: 'share_event',
    event_category: 'Social Share',
    event_label: platform,
    event_name: eventName
  });
  
  // Meta Pixel: Custom Share event
  trackFbEvent('Share', {
    content_name: eventName,
    method: platform
  });
  
  // GA4: share
  trackGaEvent('share', {
    method: platform,
    content_type: 'event',
    item_id: eventName
  });
};

export const trackAddToCart = (
  slug: string,
  titleOrContext?: string | EventTrackingContext,
  maybeContext?: EventTrackingContext
) => {
  const { title, context } = normaliseTitleAndContext(titleOrContext, maybeContext);
  if (!shouldTrackOnce('AddToCart', slug)) return;
  const eventId = createEventId('AddToCart', slug);
  const eventContext = buildEventContext(slug, title, context);
  const metaParams = buildMetaParams(slug, title, context);
  pushToDataLayer({
    event: 'add_to_cart',
    event_id: eventId,
    ...eventContext
  });

  trackFbConversion('AddToCart', metaParams, eventId);
  sendServerEvent('AddToCart', eventId, metaParams, eventContext);

  trackGaEvent('add_to_cart', {
    event_slug: slug,
    event_id: eventId
  });
};

export const trackCheckoutInteraction = (
  slug: string,
  titleOrContext?: string | EventTrackingContext,
  maybeContext?: EventTrackingContext
) => {
  const { title, context } = normaliseTitleAndContext(titleOrContext, maybeContext);
  pushToDataLayer({
    event: 'eb_checkout_interaction',
    event_id: createEventId('CheckoutInteraction', slug),
    ...buildEventContext(slug, title, context)
  });
};

export const trackPurchase = (
  slug: string,
  title: string,
  value?: number,
  orderId?: string,
  context: EventTrackingContext = {}
) => {
  const purchaseValue = Number.isFinite(value) && value && value > 0
    ? value
    : Number.isFinite(context.price) && context.price && context.price > 0
      ? context.price
      : undefined;
  const eventId = createEventId('Purchase', slug, orderId);
  const eventContext = buildEventContext(slug, title, context);
  const metaParams = buildMetaParams(slug, title, context, {
    value: purchaseValue,
    currency: purchaseValue !== undefined ? 'GBP' : undefined
  });
  pushToDataLayer({
    event: 'purchase',
    event_id: eventId,
    ...eventContext,
    transaction_value: purchaseValue,
    currency: purchaseValue !== undefined ? 'GBP' : undefined,
    order_id: orderId
  });
  
  // Meta Pixel: Purchase
  if (purchaseValue !== undefined) {
    trackFbConversion('Purchase', metaParams, eventId);
    sendServerEvent('Purchase', eventId, metaParams, eventContext, {
      transaction_value: purchaseValue,
      order_id: orderId
    });
  }
  
  // GA4: purchase
  if (purchaseValue !== undefined) {
    trackGaEvent('purchase', {
      transaction_id: orderId,
      value: purchaseValue,
      currency: 'GBP',
      event_id: eventId,
      items: [{ item_id: slug, item_name: title }]
    });
  }
};
