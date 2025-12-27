import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { hasConsentBeenGiven, grantConsent, denyConsent } from '@/lib/cookieConsent';

const CookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Only show if consent hasn't been given yet
    if (!hasConsentBeenGiven()) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    grantConsent();
    setShowBanner(false);
  };

  const handleReject = () => {
    denyConsent();
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg">
      <div className="container mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-foreground/90 text-center sm:text-left">
          <p>
            We use cookies to enhance your experience and analyse site traffic.{' '}
            <a 
              href="/privacy" 
              className="underline hover:text-primary transition-colors"
            >
              Privacy Policy
            </a>
          </p>
        </div>
        <div className="flex gap-3 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReject}
            className="whitespace-nowrap"
          >
            Reject Non-Essential
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            className="whitespace-nowrap bg-primary hover:bg-primary/90"
          >
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
