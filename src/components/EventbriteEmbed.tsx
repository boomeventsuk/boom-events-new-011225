import { useEffect } from 'react';

interface EventbriteEmbedProps {
  eventbriteId: string;
  containerId: string;
  height?: number;
}

const EventbriteEmbed = ({ eventbriteId, containerId, height = 425 }: EventbriteEmbedProps) => {
  useEffect(() => {
    // Load Eventbrite widget script
    const script = document.createElement('script');
    script.src = 'https://www.eventbrite.co.uk/static/widgets/eb_widgets.js';
    script.async = true;
    
    script.onload = () => {
      // @ts-ignore - Eventbrite global object
      if (window.EBWidgets) {
        // @ts-ignore
        window.EBWidgets.createWidget({
          widgetType: 'checkout',
          eventId: eventbriteId,
          iframeContainerId: containerId,
          iframeContainerHeight: height,
        });
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
  }, [eventbriteId, containerId, height]);

  return (
    <div 
      id={containerId} 
      className="w-full min-h-[425px] bg-muted/20 rounded-lg"
    />
  );
};

export default EventbriteEmbed;
