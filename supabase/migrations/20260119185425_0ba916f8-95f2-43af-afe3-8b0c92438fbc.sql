-- Create events_fomo table to cache daily FOMO calculations
CREATE TABLE public.events_fomo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key TEXT UNIQUE NOT NULL,
  event_name TEXT,
  percent_sold DECIMAL(5,2),
  capacity INTEGER,
  tickets_remaining INTEGER,
  days_until_event INTEGER,
  status TEXT,
  fomo_tier TEXT,
  fomo_message TEXT,
  time_message TEXT,
  is_sold_out BOOLEAN DEFAULT FALSE,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.events_fomo ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anyone can see FOMO data)
CREATE POLICY "Anyone can view FOMO data" 
ON public.events_fomo 
FOR SELECT 
USING (true);

-- Create index for fast lookups
CREATE INDEX idx_events_fomo_event_key ON public.events_fomo(event_key);
CREATE INDEX idx_events_fomo_status ON public.events_fomo(status);