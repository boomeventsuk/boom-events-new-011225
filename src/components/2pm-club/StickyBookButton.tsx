import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { trackBookClick } from '@/lib/dataLayer';

interface StickyBookButtonProps {
  eventSlug: string;
  eventTitle?: string;
  eventbriteId?: string;
  urgencyText?: string;
  start?: string;
  venue?: string;
}

// "Sat 13th Jun" house date style
const formatShortDate = (iso: string) => {
  const d = new Date(iso);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = d.getDate();
  const suffix = day % 100 >= 11 && day % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][day % 10] || 'th';
  return `${days[d.getDay()]} ${day}${suffix} ${months[d.getMonth()]}`;
};

export const StickyBookButton = ({ eventSlug, eventTitle, eventbriteId, urgencyText, start, venue }: StickyBookButtonProps) => {
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
    <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-background/95 backdrop-blur border-t border-border animate-fade-in pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          {(start || venue) && (
            <p className="text-sm font-semibold text-foreground truncate">
              {start ? formatShortDate(start) : ''}
              {start && venue ? ' · ' : ''}
              {venue || ''}
            </p>
          )}
          {urgencyText && (
            <p className="text-xs font-semibold text-primary truncate">{urgencyText}</p>
          )}
        </div>
        <Button onClick={handleClick} size="lg" className="shrink-0 shadow-lg shadow-primary/30">
          Book Tickets
        </Button>
      </div>
    </div>
  );
};
