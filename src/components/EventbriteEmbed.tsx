import { useEffect } from 'react';
import { pushToDataLayer } from '@/lib/dataLayer';

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
}

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
  height = 425 
}: EventbriteEmbedProps) => {
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
        onOrderComplete: () => {
          debugLog('✅ Eventbrite onOrderComplete fired', { eventbriteId, eventSlug, eventTitle });
          
          pushToDataLayer({
            event: 'purchase',
            event_slug: eventSlug,
            event_type: '2PM',
            event_title: eventTitle
          });
          
          // Meta Pixel: Purchase
          debugLog('💳 About to fire Purchase, fbq exists:', typeof window.fbq);
          if (window.fbq) {
            try {
              window.fbq('track', 'Purchase', {
                content_name: eventTitle,
                content_ids: [eventSlug],
                currency: 'GBP'
              });
              debugLog('✅ Purchase event fired!');
            } catch (err) {
              debugLog('❌ Purchase fbq error:', err);
            }
          } else {
            debugLog('❌ fbq not found for Purchase');
          }
        }
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
          onOrderComplete: () => {
            debugLog('✅ Eventbrite onOrderComplete fired', { eventbriteId, eventSlug, eventTitle });
            
            pushToDataLayer({
              event: 'purchase',
              event_slug: eventSlug,
              event_type: '2PM',
              event_title: eventTitle
            });
            
            // Meta Pixel: Purchase
            debugLog('💳 About to fire Purchase, fbq exists:', typeof window.fbq);
            if (window.fbq) {
              try {
                window.fbq('track', 'Purchase', {
                  content_name: eventTitle,
                  content_ids: [eventSlug],
                  currency: 'GBP'
                });
                debugLog('✅ Purchase event fired!');
              } catch (err) {
                debugLog('❌ Purchase fbq error:', err);
              }
            } else {
              debugLog('❌ fbq not found for Purchase');
            }
          }
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
        
        pushToDataLayer({
          event: 'eb_checkout_interaction',
          eventbrite_id: eventbriteId,
          event_title: eventTitle
        });

        // Fire Meta Pixel AddToCart event when user interacts with checkout
        debugLog('🛒 About to fire AddToCart, fbq exists:', typeof window.fbq);
        debugLog('🛒 eventTitle:', eventTitle, 'eventSlug:', eventSlug);
        
        if (window.fbq) {
          try {
            window.fbq('track', 'AddToCart', {
              content_name: eventTitle,
              content_ids: [eventSlug],
              currency: 'GBP'
            });
            debugLog('✅ AddToCart event fired!');
          } catch (err) {
            debugLog('❌ AddToCart fbq error:', err);
          }
        } else {
          debugLog('❌ fbq not found on window');
        }
      }
    };
    
    window.addEventListener('focusin', handleFocusIn);
    return () => window.removeEventListener('focusin', handleFocusIn);
  }, [containerId, eventbriteId, eventTitle, eventSlug]); // Fixed: added eventSlug to deps

  return (
    <div 
      id={containerId} 
      className="w-full min-h-[425px] bg-muted/20 rounded-lg"
    />
  );
};

export default EventbriteEmbed;
