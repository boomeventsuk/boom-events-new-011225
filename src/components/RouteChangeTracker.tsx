import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/dataLayer";

/**
 * Fires a generic page_view to dataLayer, Meta Pixel PageView, and GA4 page_view
 * on every SPA route change. The first paint is covered by the initial
 * script-tag fire; this listener covers client-side navigation.
 */
const RouteChangeTracker = () => {
  const location = useLocation();

  useEffect(() => {
    const id = setTimeout(() => {
      trackPageView(location.pathname + location.search, document.title);
    }, 0);
    return () => clearTimeout(id);
  }, [location.pathname, location.search]);

  return null;
};

export default RouteChangeTracker;
