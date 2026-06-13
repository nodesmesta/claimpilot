-- Add retry tracking for failed agent deliveries
ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS retry_count int DEFAULT 0;
ALTER TABLE public.claims ADD COLUMN IF NOT EXISTS last_retry_at timestamptz;
