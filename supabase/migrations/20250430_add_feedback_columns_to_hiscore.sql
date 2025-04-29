
-- Add feedback columns to hi_score_evaluations table
ALTER TABLE IF EXISTS public.hi_score_evaluations 
ADD COLUMN IF NOT EXISTS hospitality_feedback TEXT,
ADD COLUMN IF NOT EXISTS friendliness_feedback TEXT,
ADD COLUMN IF NOT EXISTS internal_team_skills_feedback TEXT,
ADD COLUMN IF NOT EXISTS service_skills_feedback TEXT,
ADD COLUMN IF NOT EXISTS foh_knowledge_feedback TEXT,
ADD COLUMN IF NOT EXISTS work_ethic_feedback TEXT,
ADD COLUMN IF NOT EXISTS team_player_feedback TEXT,
ADD COLUMN IF NOT EXISTS adaptability_feedback TEXT,
ADD COLUMN IF NOT EXISTS cooking_skills_feedback TEXT,
ADD COLUMN IF NOT EXISTS food_knowledge_feedback TEXT;

COMMENT ON COLUMN public.hi_score_evaluations.hospitality_feedback IS 'Detailed feedback for hospitality rating';
COMMENT ON COLUMN public.hi_score_evaluations.friendliness_feedback IS 'Detailed feedback for friendliness rating';
COMMENT ON COLUMN public.hi_score_evaluations.internal_team_skills_feedback IS 'Detailed feedback for internal team skills rating';
COMMENT ON COLUMN public.hi_score_evaluations.service_skills_feedback IS 'Detailed feedback for service skills rating';
COMMENT ON COLUMN public.hi_score_evaluations.foh_knowledge_feedback IS 'Detailed feedback for front of house knowledge rating';
COMMENT ON COLUMN public.hi_score_evaluations.work_ethic_feedback IS 'Detailed feedback for work ethic rating';
COMMENT ON COLUMN public.hi_score_evaluations.team_player_feedback IS 'Detailed feedback for team player rating';
COMMENT ON COLUMN public.hi_score_evaluations.adaptability_feedback IS 'Detailed feedback for adaptability rating';
COMMENT ON COLUMN public.hi_score_evaluations.cooking_skills_feedback IS 'Detailed feedback for cooking skills rating';
COMMENT ON COLUMN public.hi_score_evaluations.food_knowledge_feedback IS 'Detailed feedback for food knowledge rating';
