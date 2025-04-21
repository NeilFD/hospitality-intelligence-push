
-- Check if the reactions column exists in team_messages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'team_messages' 
    AND column_name = 'reactions'
  ) THEN
    -- Add reactions column to team_messages table
    ALTER TABLE team_messages 
    ADD COLUMN reactions JSONB DEFAULT '[]'::jsonb;
    
    -- Add a comment to the column
    COMMENT ON COLUMN team_messages.reactions IS 'Stores message reactions as JSON array of {emoji, user_ids[]}';
    
    -- Create index for reactions column
    CREATE INDEX idx_team_messages_reactions ON team_messages USING GIN (reactions);
    
    -- Enable realtime for the team_messages table if not already enabled
    ALTER PUBLICATION supabase_realtime ADD TABLE team_messages;
    
    -- Set REPLICA IDENTITY to FULL for the team_messages table
    ALTER TABLE team_messages REPLICA IDENTITY FULL;
  END IF;
END
$$;

-- Make sure RPC function is enabled for authenticated users
DO $$
BEGIN
  EXECUTE 'GRANT EXECUTE ON FUNCTION add_message_reaction TO authenticated';
  EXECUTE 'GRANT EXECUTE ON FUNCTION add_message_reaction TO anon';
EXCEPTION
  WHEN undefined_function THEN
    -- Function doesn't exist yet, that's fine
    NULL;
END
$$;
