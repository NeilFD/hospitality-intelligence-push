
-- Recreate team_chat_rooms table if it doesn't exist
CREATE TABLE IF NOT EXISTS team_chat_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    is_announcement_only BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add some default chat rooms if they don't exist
INSERT INTO team_chat_rooms (name, slug, is_announcement_only)
VALUES 
    ('General', 'general', false),
    ('Announcements', 'announcements', true),
    ('Food', 'food', false),
    ('Beverage', 'beverage', false)
ON CONFLICT (slug) DO NOTHING;
