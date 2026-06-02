import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { trackBookClick } from '@/lib/dataLayer';

interface StickyBookButtonProps {
  eventSlug: string;
  eventTitle?: string;
  eventbriteId?: string;
  urgencyText?: string;
}

export const StickyBookButton = ({ eventSlug, eventTitle, eventbriteId, urgencyText }: StickyBookButtonProps) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const heroBtn = document.getElementById('hero-book-button');
      const checkout = document.getElementById('checkout-section');
      
      if (!heroBtn || !checkout) return;
      
      const heroBtnRect = heroBtn.getBoundingClientRect();
      const checkoutRect = checkout.getBoundingClientRect();
      
      // Show when hero button scrolls out of view (above viewport)
      const heroOut = heroBtnRect.bottom < 0;
      
      // Hide when checkout section is visible
      const checkoutVisible = checkoutRect.top < window.innerHeight;
      
      setVisible(heroOut && !checkoutVisible);
    };
    
    // Run on mount and scroll
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = () => {
    trackBookClick(eventSlug, eventTitle || '', {
      eventbriteId,
      source: 'sticky_book_button'
    });
    const checkoutSection = document.getElementById('checkout-section');
    checkoutSection?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <Button
      onClick={handleClick}
      size="lg"
      className="fixed bottom-4 left-4 right-4 z-40 min-h-12 whitespace-normal leading-tight shadow-xl shadow-primary/30 animate-fade-in md:left-auto md:bottom-auto md:top-20 md:right-4 md:w-auto md:max-w-sm"
    >
      {urgencyText || 'Book Tickets'}
    </Button>
  );
};
