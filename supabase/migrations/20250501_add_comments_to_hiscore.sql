
-- Add comments column to hi_score_evaluations table
ALTER TABLE IF EXISTS public.hi_score_evaluations 
ADD COLUMN IF NOT EXISTS comments TEXT;

COMMENT ON COLUMN public.hi_score_evaluations.comments IS 'Additional comments for the evaluation';
