import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Jobs from "./pages/Jobs";
import TicketsRedirect from "./components/TicketsRedirect";
import EventTemplate from "./pages/EventTemplate";
import CookieConsent from "./components/CookieConsent";
import { initConsentOnLoad } from "./lib/cookieConsent";

const App = () => {
  useEffect(() => {
    initConsentOnLoad();
  }, []);

  return (
  <TooltipProvider>
    <div className="min-h-screen bg-background font-poppins">
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/tickets" element={<TicketsRedirect />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/event/:eventCode" element={<EventTemplate />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <CookieConsent />
    </div>
  </TooltipProvider>
  );
};

export default App;
