import { useEffect } from 'react';
import { pushToDataLayer } from '@/lib/dataLayer';

declare global {
  interface Window {
    EBWidgets?: {
      createWidget: (config: any) => void;
    };
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

const EventbriteEmbed = ({ 
  eventbriteId, 
  containerId, 
  eventTitle, 
  eventSlug, 
  promoCode, 
  height = 425 
}: EventbriteEmbedProps) => {
  useEffect(() => {
    // Load Eventbrite widget script
    const script = document.createElement('script');
    script.src = 'https://www.eventbrite.co.uk/static/widgets/eb_widgets.js';
    script.async = true;
    
    script.onload = () => {
      // @ts-ignore - Eventbrite global object
      if (window.EBWidgets) {
        // @ts-ignore
        const widgetConfig: any = {
          widgetType: 'checkout',
          eventId: eventbriteId,
          iframeContainerId: containerId,
          iframeContainerHeight: height,
          onOrderComplete: () => {
            // Track purchase completion
            pushToDataLayer({
              event: 'purchase',
              event_slug: eventSlug,
              event_type: '2PM',
              event_title: eventTitle
            });
          }
        };
        
        // Add promo code if provided
        if (promoCode) {
          widgetConfig.promoCode = promoCode;
        }
        
        window.EBWidgets.createWidget(widgetConfig);
      }
    };
    
    document.body.appendChild(script);
    
    return () => {
      // Cleanup script on unmount
      const existingScript = document.querySelector(`script[src="${script.src}"]`);
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, [eventbriteId, containerId, eventTitle, eventSlug, promoCode, height]);

  // Listen for Eventbrite postMessage events
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes('eventbrite')) return;
      
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        // Log for debugging
        console.log('Eventbrite postMessage:', data);
        
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
      
      if (iframe && activeElement === iframe && !iframeFocused) {
        iframeFocused = true;
        pushToDataLayer({
          event: 'eb_checkout_interaction',
          eventbrite_id: eventbriteId,
          event_title: eventTitle
        });
      }
    };
    
    window.addEventListener('focusin', handleFocusIn);
    return () => window.removeEventListener('focusin', handleFocusIn);
  }, [containerId, eventbriteId, eventTitle]);

  return (
    <div 
      id={containerId} 
      className="w-full min-h-[425px] bg-muted/20 rounded-lg"
    />
  );
};

export default EventbriteEmbed;
