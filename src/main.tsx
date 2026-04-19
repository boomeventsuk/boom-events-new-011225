import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import App from './App.tsx'
import './index.css'

// WebMCP: register tools so AI agents can discover site capabilities
// https://webmachinelearning.github.io/webmcp/
if (typeof navigator !== 'undefined' && 'modelContext' in navigator) {
  try {
    const nav = navigator as Navigator & {
      modelContext: {
        provideContext: (tools: unknown[]) => void;
        registerTool?: (tool: unknown) => void;
      };
    };
    const tools = [
      {
        name: "listEvents",
        description: "Returns upcoming Boombastic Events across all sub-brands (THE 2PM CLUB, SILENT DISCO GREATEST HITS, FOOTLOOSE 80s, FAMILY SILENT DISCO) and all cities. Filter by city or sub-brand. Each event includes title, date, venue, city, and booking URL.",
        inputSchema: {
          type: "object",
          properties: {
            city: {
              type: "string",
              description: "Filter by city: Northampton, Bedford, Milton Keynes, Coventry, Luton, or Leicester.",
              enum: ["Northampton", "Bedford", "Milton Keynes", "Coventry", "Luton", "Leicester"]
            },
            brand: {
              type: "string",
              description: "Filter by sub-brand: '2PM CLUB', 'SILENT DISCO', 'FOOTLOOSE', or 'FAMILY SILENT DISCO'."
            },
            limit: {
              type: "number",
              description: "Maximum number of events to return."
            }
          },
          required: []
        },
        execute: async (input: { city?: string; brand?: string; limit?: number }) => {
          const response = await fetch('/events-boombastic.json');
          const events = await response.json();
          const now = new Date().toISOString().slice(0, 10);
          let upcoming = events.filter((e: { start: string }) => e.start.slice(0, 10) >= now);
          if (input.city) {
            upcoming = upcoming.filter((e: { city: string }) =>
              e.city.toLowerCase().includes(input.city!.toLowerCase())
            );
          }
          if (input.brand) {
            upcoming = upcoming.filter((e: { title: string }) =>
              e.title.toLowerCase().includes(input.brand!.toLowerCase())
            );
          }
          if (input.limit) {
            upcoming = upcoming.slice(0, input.limit);
          }
          return upcoming;
        }
      }
    ];
    if (typeof nav.modelContext.provideContext === 'function') {
      nav.modelContext.provideContext(tools);
    } else if (typeof nav.modelContext.registerTool === 'function') {
      tools.forEach(t => nav.modelContext.registerTool!(t));
    }
  } catch (_e) {
    // WebMCP not available
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </StrictMode>
);
