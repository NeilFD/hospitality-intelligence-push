
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

-- Create function for adding message reactions
CREATE OR REPLACE FUNCTION add_message_reaction(
  p_message_id UUID,
  p_user_id UUID,
  p_emoji TEXT
) RETURNS JSONB AS $$
DECLARE
  v_message team_messages;
  v_reactions JSONB;
  v_reaction_index INTEGER := 0;
  v_user_index INTEGER := 0;
  v_found BOOLEAN := FALSE;
  v_updated_reactions JSONB;
BEGIN
  -- Get the message
  SELECT * INTO v_message
  FROM team_messages
  WHERE id = p_message_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Message not found';
  END IF;
  
  -- Initialize reactions if null
  v_reactions := COALESCE(v_message.reactions, '[]'::jsonb);
  
  -- Find if this emoji already has a reaction entry
  FOR i IN 0..jsonb_array_length(v_reactions) - 1 LOOP
    IF v_reactions->i->>'emoji' = p_emoji THEN
      v_reaction_index := i;
      v_found := TRUE;
      EXIT;
    END IF;
  END LOOP;
  
  IF v_found THEN
    -- Check if user already reacted with this emoji
    v_found := FALSE;
    FOR i IN 0..jsonb_array_length(v_reactions->v_reaction_index->'user_ids') - 1 LOOP
      IF (v_reactions->v_reaction_index->'user_ids'->i)::TEXT = ('"' || p_user_id || '"') THEN
        v_user_index := i;
        v_found := TRUE;
        EXIT;
      END IF;
    END LOOP;
    
    IF v_found THEN
      -- Remove user from this reaction (toggle behavior)
      IF jsonb_array_length(v_reactions->v_reaction_index->'user_ids') = 1 THEN
        -- If this was the only user, remove the entire emoji entry
        v_updated_reactions := v_reactions - v_reaction_index;
      ELSE
        -- Otherwise just remove the user
        v_updated_reactions := jsonb_set(
          v_reactions,
          ARRAY[v_reaction_index::TEXT, 'user_ids'],
          (v_reactions->v_reaction_index->'user_ids') - v_user_index
        );
      END IF;
    ELSE
      -- Add user to existing emoji reaction
      v_updated_reactions := jsonb_set(
        v_reactions,
        ARRAY[v_reaction_index::TEXT, 'user_ids'],
        (v_reactions->v_reaction_index->'user_ids') || to_jsonb(p_user_id)
      );
    END IF;
  ELSE
    -- Add new emoji reaction with this user
    v_updated_reactions := v_reactions || jsonb_build_array(
      jsonb_build_object(
        'emoji', p_emoji,
        'user_ids', jsonb_build_array(p_user_id)
      )
    );
  END IF;
  
  -- Update the message
  UPDATE team_messages
  SET reactions = v_updated_reactions
  WHERE id = p_message_id;
  
  RETURN v_updated_reactions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to the function for authenticated users
GRANT EXECUTE ON FUNCTION add_message_reaction TO authenticated;
