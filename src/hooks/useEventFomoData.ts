import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface EventFomoData {
  event_key: string;
  event_name: string | null;
  percent_sold: number | null;
  capacity: number | null;
  tickets_remaining: number | null;
  days_until_event: number | null;
  status: string | null;
  fomo_tier: string | null;
  fomo_message: string | null;
  time_message: string | null;
  is_sold_out: boolean | null;
  last_synced_at: string | null;
}

export function useEventFomoData(eventKey?: string) {
  const [data, setData] = useState<EventFomoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!eventKey) {
      setLoading(false);
      return;
    }

    const fetchFomoData = async () => {
      try {
        setLoading(true);
        const { data: fomoData, error: fetchError } = await supabase
          .from("events_fomo")
          .select("*")
          .eq("event_key", eventKey)
          .maybeSingle();

        if (fetchError) {
          throw fetchError;
        }

        setData(fomoData);
      } catch (err) {
        console.error("Error fetching FOMO data:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch FOMO data"));
      } finally {
        setLoading(false);
      }
    };

    fetchFomoData();
  }, [eventKey]);

  return { data, loading, error };
}

export function useAllEventsFomoData() {
  const [data, setData] = useState<EventFomoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAllFomoData = async () => {
      try {
        setLoading(true);
        const { data: fomoData, error: fetchError } = await supabase
          .from("events_fomo")
          .select("*");

        if (fetchError) {
          throw fetchError;
        }

        setData(fomoData || []);
      } catch (err) {
        console.error("Error fetching all FOMO data:", err);
        setError(err instanceof Error ? err : new Error("Failed to fetch FOMO data"));
      } finally {
        setLoading(false);
      }
    };

    fetchAllFomoData();
  }, []);

  return { data, loading, error };
}

export default useEventFomoData;