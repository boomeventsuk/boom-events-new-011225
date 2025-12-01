declare global {
  interface Window {
    dataLayer: any[];
  }
}

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
};

export const trackBookClick = (slug: string) => {
  pushToDataLayer({
    event: 'eventpage_book_click',
    event_slug: slug,
    event_type: '2PM'
  });
};

export const trackShare = (platform: 'WhatsApp' | 'Facebook' | 'Messenger', eventName: string) => {
  pushToDataLayer({
    event: 'share_event',
    event_category: 'Social Share',
    event_label: platform,
    event_name: eventName
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
};
