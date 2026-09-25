-- Add cancellation_reason column if it doesn't exist
ALTER TABLE public.reports 
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Drop the existing constraint for status if it exists
ALTER TABLE public.reports 
DROP CONSTRAINT IF EXISTS reports_status_check;

-- Add the updated constraint allowing 'Cancelled'
ALTER TABLE public.reports 
ADD CONSTRAINT reports_status_check 
CHECK (status IN ('Reported', 'Verified', 'In Progress', 'Resolved', 'Cancelled'));
