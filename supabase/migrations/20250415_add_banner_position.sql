
-- Add banner_position_y column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_position_y numeric DEFAULT 0;
