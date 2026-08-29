import { useEffect, useRef } from 'react';
import {
  pushToDataLayer,
  trackAddToCart,
  trackBookClick,
  trackCheckoutInteraction,
  trackPurchase
} from '@/lib/dataLayer';

declare global {
  interface Window {
    EBWidgets?: {
      createWidget: (config: any) => void;
    };
    fbq?: (...args: any[]) => void;
  }
}

interface EventbriteEmbedProps {
  eventbriteId: string;
  containerId: string;
  eventTitle?: string;
  eventSlug?: string;
  promoCode?: string;
  height?: number;
  showTrustStrip?: boolean;
}

export const EventbriteTrustStrip = () => (
  <aside
    data-eventbrite-trust-strip="true"
    aria-label="Ticketing powered by Eventbrite"
    className="mb-3 rounded-xl border border-[#F05537]/30 bg-white px-4 py-3 text-slate-900 shadow-sm"
  >
    <div className="flex flex-col items-center justify-center gap-1.5 sm:flex-row sm:gap-3">
      <span className="text-xs font-extrabold uppercase tracking-[0.12em] text-slate-800">
        Ticketing powered by
      </span>
      <img
        src="/eventbrite-logo.png"
        alt="Eventbrite"
        width="160"
        height="28"
        className="h-7 w-auto"
      />
    </div>
    <p className="mt-1.5 text-center text-xs font-medium text-slate-600">
      Your ticket selection and payment are handled by Eventbrite.
    </p>
  </aside>
);

// Debug mode: enabled via ?eb_debug=1 or localStorage.setItem('eb_debug','1')
const isDebugMode = () => {
  if (typeof window === 'undefined') return false;
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('eb_debug') === '1' || localStorage.getItem('eb_debug') === '1';
};

const debugLog = (...args: any[]) => {
  if (isDebugMode()) {
    console.log(...args);
  }
};

const EventbriteEmbed = ({ 
  eventbriteId, 
  containerId, 
  eventTitle, 
  eventSlug, 
  promoCode, 
  height = 425,
  showTrustStrip = true
}: EventbriteEmbedProps) => {
  const checkoutIntentTracked = useRef(false);
  const checkoutSlug = eventSlug || eventbriteId;
  const checkoutTitle = eventTitle || '';
  const baseTrackingContext = {
    eventbriteId,
    source: 'eventbrite_embed'
  };

  const normaliseEventbriteValue = (order: any): number | undefined => {
    const rawValue = order?.gross_total?.major_value ?? order?.gross_total?.value;
    if (rawValue === undefined || rawValue === null) return undefined;
    const numericValue = Number(rawValue);
    if (Number.isNaN(numericValue)) return undefined;
    return numericValue > 1000 ? numericValue / 100 : numericValue;
  };

  const trackCheckoutIntentOnce = (source: string) => {
    if (checkoutIntentTracked.current) return;
    checkoutIntentTracked.current = true;
    trackBookClick(checkoutSlug, checkoutTitle, {
      ...baseTrackingContext,
      source
    });
  };

  const handleOrderComplete = (order?: any) => {
    const value = normaliseEventbriteValue(order);
    const orderId = order?.id || order?.order_id;
    debugLog('✅ Eventbrite onOrderComplete fired', { eventbriteId, eventSlug, eventTitle, orderId, value });

    trackPurchase(checkoutSlug, checkoutTitle, value, orderId, {
      ...baseTrackingContext,
      source: 'eventbrite_order_complete'
    });
  };

  useEffect(() => {
    debugLog('🔧 EventbriteEmbed mounted', { eventbriteId, containerId, eventTitle, eventSlug, promoCode });
    
    // Check if script already exists
    const existingScript = document.querySelector('script[src*="eb_widgets.js"]');
    
    if (existingScript && window.EBWidgets) {
      debugLog('📜 EB script already loaded, creating widget');
      // Script already loaded, just create the widget
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '';
      }
      
      const widgetConfig: any = {
        widgetType: 'checkout',
        eventId: eventbriteId,
        iframeContainerId: containerId,
        iframeContainerHeight: height,
        onOrderComplete: handleOrderComplete
      };
      
      if (promoCode) {
        widgetConfig.promoCode = promoCode;
      }
      
      window.EBWidgets.createWidget(widgetConfig);
      return;
    }
    
    // Load Eventbrite widget script
    const script = document.createElement('script');
    script.src = 'https://www.eventbrite.co.uk/static/widgets/eb_widgets.js';
    script.async = true;
    
    script.onload = () => {
      debugLog('📜 EB script loaded');
      if (window.EBWidgets) {
        // Clear any existing widget content to prevent duplicates
        const container = document.getElementById(containerId);
        if (container) {
          container.innerHTML = '';
        }
        
        const widgetConfig: any = {
          widgetType: 'checkout',
          eventId: eventbriteId,
          iframeContainerId: containerId,
          iframeContainerHeight: height,
          onOrderComplete: handleOrderComplete
        };
        
        if (promoCode) {
          widgetConfig.promoCode = promoCode;
        }
        
        window.EBWidgets.createWidget(widgetConfig);
      }
    };
    
    document.body.appendChild(script);
    
    return () => {
      // Clear the container content
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '';
      }
      
      // Cleanup script on unmount
      const scriptToRemove = document.querySelector(`script[src="${script.src}"]`);
      if (scriptToRemove) {
        document.body.removeChild(scriptToRemove);
      }
    };
  }, [eventbriteId, containerId, eventTitle, eventSlug, promoCode, height]);

  // Listen for Eventbrite postMessage events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes('eventbrite')) return;
      
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        debugLog('📨 Eventbrite postMessage:', data);
        
        // Forward events to dataLayer
        if (data.event) {
          pushToDataLayer({
            event: `eb_${data.event}`,
            ...data
          });
        }

        const eventName = data.event || data.type;
        if (eventName === 'checkout_started') {
          trackCheckoutIntentOnce('eventbrite_checkout_started');
          trackCheckoutInteraction(checkoutSlug, checkoutTitle, {
            ...baseTrackingContext,
            source: 'eventbrite_checkout_started'
          });
        }

        if (eventName === 'ticket_selected') {
          trackCheckoutIntentOnce('eventbrite_ticket_selected');
          trackAddToCart(checkoutSlug, checkoutTitle, {
            ...baseTrackingContext,
            source: 'eventbrite_ticket_selected'
          });
        }
      } catch (e) {
        // Not a JSON message, ignore
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Track iframe focus as proxy for checkout interaction
  useEffect(() => {
    let iframeFocused = false;
    
    const handleFocusIn = () => {
      const activeElement = document.activeElement;
      const container = document.getElementById(containerId);
      const iframe = container?.querySelector('iframe');
      
      // Pre-condition debug logs
      debugLog('👆 focusin event fired');
      debugLog('📦 Container found:', !!container);
      debugLog('🖼️ Iframe found:', !!iframe);
      debugLog('🎯 activeElement:', activeElement?.tagName, activeElement);
      debugLog('🔍 activeElement === iframe:', activeElement === iframe);
      debugLog('🔒 iframeFocused already:', iframeFocused);
      
      if (iframe && activeElement === iframe && !iframeFocused) {
        iframeFocused = true;
        
        debugLog('🎯 Iframe focus detected - condition passed!');
        
        trackCheckoutInteraction(checkoutSlug, checkoutTitle, {
          ...baseTrackingContext,
          source: 'eventbrite_iframe_focus'
        });

        trackCheckoutIntentOnce('eventbrite_iframe_focus');
        trackAddToCart(checkoutSlug, checkoutTitle, {
          ...baseTrackingContext,
          source: 'eventbrite_iframe_focus'
        });
      }
    };
    
    window.addEventListener('focusin', handleFocusIn);
    return () => window.removeEventListener('focusin', handleFocusIn);
  }, [containerId, eventbriteId, eventTitle, eventSlug]); // Fixed: added eventSlug to deps

  return (
    <>
      {showTrustStrip && <EventbriteTrustStrip />}
      <div
        id={containerId}
        className="w-full min-h-[425px] bg-muted/20 rounded-lg"
      />
    </>
  );
};

export default EventbriteEmbed;
