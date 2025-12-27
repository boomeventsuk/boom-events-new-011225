import { isConsentGranted } from './cookieConsent';

declare global {
  interface Window {
    dataLayer: any[];
    fbq?: (...args: any[]) => void;
  }
}

// Helper to track Meta Pixel events - only fires if consent granted
const trackFbEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.fbq && isConsentGranted()) {
    window.fbq('track', eventName, params);
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
};
