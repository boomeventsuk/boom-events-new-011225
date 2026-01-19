const CONSENT_KEY = 'cookie_consent';
const META_PIXEL_ID = '1947538679159165';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export type ConsentStatus = 'granted' | 'denied' | null;

export const getConsentStatus = (): ConsentStatus => {
  if (typeof window === 'undefined') return null;
  const status = localStorage.getItem(CONSENT_KEY);
  if (status === 'granted' || status === 'denied') return status;
  return null;
};

export const setConsentStatus = (status: 'granted' | 'denied'): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CONSENT_KEY, status);
};

export const hasConsentBeenGiven = (): boolean => {
  return getConsentStatus() !== null;
};

export const isConsentGranted = (): boolean => {
  return getConsentStatus() === 'granted';
};

// Grant consent and fire PageView for both Meta Pixel and GA4
export const grantConsent = (): void => {
  setConsentStatus('granted');
  
  if (typeof window !== 'undefined') {
    // Meta Pixel consent
    if (window.fbq) {
      window.fbq('consent', 'grant');
      window.fbq('track', 'PageView');
    }
    
    // GA4 consent
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted',
        'ad_storage': 'granted'
      });
    }
  }
};

// Deny consent - pixel remains in revoke mode, GA4 stays denied
export const denyConsent = (): void => {
  setConsentStatus('denied');
  // fbq stays in 'revoke' mode, gtag stays 'denied' - no action needed
};

// Check consent and update on page load if already granted
export const initConsentOnLoad = (): void => {
  if (typeof window === 'undefined') return;
  
  const status = getConsentStatus();
  if (status === 'granted') {
    // Meta Pixel
    if (window.fbq) {
      window.fbq('consent', 'grant');
      window.fbq('track', 'PageView');
    }
    // GA4
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        'analytics_storage': 'granted',
        'ad_storage': 'granted'
      });
    }
  }
  // If denied or null, consent stays revoked/denied (set in index.html)
};
