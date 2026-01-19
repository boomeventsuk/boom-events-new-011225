import { isConsentGranted } from './cookieConsent';

declare global {
  interface Window {
    dataLayer: any[];
    fbq?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
  }
}

// Helper to track Meta Pixel events - only fires if consent granted
const trackFbEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.fbq && isConsentGranted()) {
    window.fbq('track', eventName, params);
  }
};

// Helper to track GA4 events - only fires if consent granted
const trackGaEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.gtag && isConsentGranted()) {
    window.gtag('event', eventName, params);
  }
};

export const pushToDataLayer = (event: Record<string, any>) => {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(event);
};

export const trackEventPageView = (slug: string, title: string) => {
  pushToDataLayer({
    event: 'eventpage_view',
    event_slug: slug,
    event_type: '2PM',
    event_title: title
  });
  
  // Meta Pixel: ViewContent
  trackFbEvent('ViewContent', {
    content_name: title,
    content_type: 'event',
    content_ids: [slug]
  });
  
  // GA4: page_view
  trackGaEvent('page_view', {
    page_title: title,
    page_location: window.location.href
  });
};

export const trackBookClick = (slug: string) => {
  pushToDataLayer({
    event: 'eventpage_book_click',
    event_slug: slug,
    event_type: '2PM'
  });
  
  // Meta Pixel: InitiateCheckout
  trackFbEvent('InitiateCheckout', {
    content_ids: [slug]
  });
  
  // GA4: begin_checkout
  trackGaEvent('begin_checkout', {
    event_slug: slug
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

export const trackPurchase = (slug: string, title: string, value?: number, orderId?: string) => {
  pushToDataLayer({
    event: 'purchase',
    event_slug: slug,
    event_type: '2PM',
    event_title: title,
    transaction_value: value,
    currency: 'GBP',
    order_id: orderId
  });
  
  // Meta Pixel: Purchase
  trackFbEvent('Purchase', {
    content_name: title,
    content_ids: [slug],
    value: value || 0,
    currency: 'GBP'
  });
  
  // GA4: purchase
  trackGaEvent('purchase', {
    transaction_id: orderId,
    value: value || 0,
    currency: 'GBP',
    items: [{ item_id: slug, item_name: title }]
  });
};
