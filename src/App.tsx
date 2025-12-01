import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import TicketsRedirect from "./components/TicketsRedirect";
import EventTemplate from "./pages/EventTemplate";
import TwoPmClubEventTemplate from "./pages/TwoPmClubEventTemplate";

const App = () => (
  <TooltipProvider>
    <div className="min-h-screen bg-background font-poppins">
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/tickets" element={<TicketsRedirect />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/event/:eventCode" element={<EventTemplate />} />
          <Route path="/events/:slug" element={<TwoPmClubEventTemplate />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </div>
  </TooltipProvider>
);

export default App;
