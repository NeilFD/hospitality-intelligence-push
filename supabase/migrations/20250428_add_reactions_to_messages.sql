
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
  END IF;
  
  -- Always update the REPLICA IDENTITY to FULL for the team_messages table
  -- This ensures that the entire row data is available for realtime features
  ALTER TABLE team_messages REPLICA IDENTITY FULL;
  
  -- Always enable publication for realtime updates, idempotent operation
  -- This part is critical for realtime updates to work
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE team_messages;
  EXCEPTION
    WHEN duplicate_object THEN
      -- Table already in publication, that's fine
      NULL;
  END;
END
$$;
