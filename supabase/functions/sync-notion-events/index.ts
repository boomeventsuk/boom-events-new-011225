import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotionEvent {
  eventKey: string;
  eventName: string;
  capacity: number;
  ticketsRemaining: number;
  percentSold: number;
  daysUntilEvent: number;
  status: string;
}

interface FomoResult {
  tier: string;
  message: string;
  timeMessage: string | null;
}

function calculateFomoTier(
  ticketsRemaining: number,
  capacity: number,
  percentSold: number,
  daysOut: number,
  status: string
): FomoResult {
  // Sold out check
  if (status === "Sold Out" || ticketsRemaining <= 0) {
    return { tier: "sold_out", message: "SOLD OUT", timeMessage: null };
  }

  // Time-based message (shown alongside stock message)
  let timeMessage: string | null = null;
  if (daysOut <= 1) timeMessage = "TOMORROW!";
  else if (daysOut <= 3) timeMessage = "THIS WEEKEND!";
  else if (daysOut <= 7) timeMessage = "THIS WEEK!";

  // Determine if small or large venue
  const isLargeVenue = capacity > 400;

  // Quantity thresholds based on venue size
  const thresholds = isLargeVenue
    ? { critical: 50, urgent: 100, low: 150 }
    : { critical: 15, urgent: 40, low: 75 };

  // Display numbers (slightly ahead of actual)
  const displayNumbers = isLargeVenue
    ? { critical: 25, urgent: 50, low: 100 }
    : { critical: 5, urgent: 15, low: 50 };

  // Use quantity messaging when stock is low enough
  if (ticketsRemaining <= thresholds.critical) {
    return {
      tier: "critical",
      message: `LAST ${displayNumbers.critical} TICKETS!`,
      timeMessage,
    };
  }
  if (ticketsRemaining <= thresholds.urgent) {
    return {
      tier: "urgent",
      message: `${displayNumbers.urgent} TICKETS LEFT!`,
      timeMessage,
    };
  }
  if (ticketsRemaining <= thresholds.low) {
    return {
      tier: "low",
      message: `${displayNumbers.low} TICKETS LEFT!`,
      timeMessage,
    };
  }

  // Use percentage messaging for higher stock
  if (percentSold >= 75) {
    return { tier: "percent_80", message: "80% SOLD", timeMessage };
  }
  if (percentSold >= 60) {
    return { tier: "percent_70", message: "70% SOLD", timeMessage };
  }
  if (percentSold >= 45) {
    return { tier: "percent_60", message: "60% SOLD", timeMessage };
  }
  if (percentSold >= 20) {
    return { tier: "selling_fast", message: "SELLING FAST!", timeMessage };
  }

  return { tier: "on_sale", message: "NOW ON SALE", timeMessage };
}

async function queryNotionDatabase(notionApiKey: string, databaseId: string): Promise<NotionEvent[]> {
  console.log("Querying Notion database:", databaseId);
  
  const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${notionApiKey}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      filter: {
        property: "Status",
        select: {
          equals: "On-Sale",
        },
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Notion API error:", response.status, errorText);
    throw new Error(`Notion API error: ${response.status}`);
  }

  const data = await response.json();
  console.log(`Found ${data.results.length} on-sale events`);

  const events: NotionEvent[] = [];

  for (const page of data.results) {
    try {
      const props = page.properties;
      
      // Extract event key (slug)
      const eventKey = props["Event Key"]?.rich_text?.[0]?.plain_text || 
                       props["Slug"]?.rich_text?.[0]?.plain_text || 
                       page.id;
      
      // Extract event name
      const eventName = props["Event Name"]?.title?.[0]?.plain_text ||
                        props["Name"]?.title?.[0]?.plain_text || 
                        "Unknown Event";
      
      // Extract capacity
      const capacity = props["Capacity"]?.number || 300;
      
      // Extract tickets remaining
      const ticketsRemaining = props["Tickets Remaining"]?.number ?? capacity;
      
      // Extract percent sold
      const percentSold = props["% Sold"]?.number || 
                          props["Percent Sold"]?.number ||
                          ((capacity - ticketsRemaining) / capacity * 100);
      
      // Extract event date and calculate days until
      const eventDateStr = props["Event Date"]?.date?.start ||
                           props["Date"]?.date?.start;
      
      let daysUntilEvent = 30; // Default
      if (eventDateStr) {
        const eventDate = new Date(eventDateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        eventDate.setHours(0, 0, 0, 0);
        daysUntilEvent = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      // Extract status
      const status = props["Status"]?.status?.name || "On-Sale";

      events.push({
        eventKey,
        eventName,
        capacity,
        ticketsRemaining,
        percentSold,
        daysUntilEvent,
        status,
      });

      console.log(`Processed event: ${eventName} - ${ticketsRemaining}/${capacity} tickets (${percentSold.toFixed(1)}% sold)`);
    } catch (err) {
      console.error("Error processing page:", page.id, err);
    }
  }

  return events;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const NOTION_API_KEY = Deno.env.get("NOTION_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!NOTION_API_KEY) {
      throw new Error("NOTION_API_KEY is not configured");
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    // Notion Events Database ID
    const DATABASE_ID = "260f3a8f-8497-4198-8920-0dcec7c68a30";

    // Query Notion for on-sale events
    const events = await queryNotionDatabase(NOTION_API_KEY, DATABASE_ID);

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Process each event and calculate FOMO tiers
    const results = [];
    for (const event of events) {
      const fomo = calculateFomoTier(
        event.ticketsRemaining,
        event.capacity,
        event.percentSold,
        event.daysUntilEvent,
        event.status
      );

      const record = {
        event_key: event.eventKey,
        event_name: event.eventName,
        percent_sold: event.percentSold,
        capacity: event.capacity,
        tickets_remaining: event.ticketsRemaining,
        days_until_event: event.daysUntilEvent,
        status: event.status,
        fomo_tier: fomo.tier,
        fomo_message: fomo.message,
        time_message: fomo.timeMessage,
        is_sold_out: event.status === "Sold Out" || event.ticketsRemaining <= 0,
        last_synced_at: new Date().toISOString(),
      };

      // Upsert into database
      const { error } = await supabase
        .from("events_fomo")
        .upsert(record, { onConflict: "event_key" });

      if (error) {
        console.error("Error upserting event:", event.eventKey, error);
      } else {
        console.log(`Synced: ${event.eventName} -> ${fomo.message}`);
        results.push({
          eventKey: event.eventKey,
          eventName: event.eventName,
          fomoMessage: fomo.message,
          timeMessage: fomo.timeMessage,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced: results.length,
        events: results,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});