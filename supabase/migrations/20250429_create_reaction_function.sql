
-- Function to update message reactions directly in the database
CREATE OR REPLACE FUNCTION update_message_reaction(
  p_message_id UUID,
  p_user_id UUID,
  p_emoji TEXT
) RETURNS JSONB AS $$
DECLARE
  v_reactions JSONB;
  v_existing_index INTEGER := 0;
  v_user_ids JSONB;
  v_action_type TEXT := 'none';
  v_found BOOLEAN := FALSE;
BEGIN
  -- Get current reactions
  SELECT COALESCE(reactions, '[]'::JSONB) INTO v_reactions 
  FROM team_messages 
  WHERE id = p_message_id;
  
  -- Look for existing emoji
  FOR i IN 0..jsonb_array_length(v_reactions) - 1 LOOP
    IF v_reactions->i->>'emoji' = p_emoji THEN
      v_existing_index := i;
      v_found := TRUE;
      EXIT;
    END IF;
  END LOOP;
  
  IF v_found THEN
    -- Emoji exists, get user_ids
    v_user_ids := COALESCE(v_reactions->v_existing_index->'user_ids', '[]'::JSONB);
    
    -- Check if user already reacted
    v_found := FALSE;
    FOR i IN 0..jsonb_array_length(v_user_ids) - 1 LOOP
      IF v_user_ids->>i = p_user_id::TEXT THEN
        -- Remove user from the array
        v_user_ids := v_user_ids - i;
        v_action_type := 'removed';
        v_found := TRUE;
        EXIT;
      END IF;
    END LOOP;
    
    IF NOT v_found THEN
      -- User hasn't reacted, add them
      v_user_ids := v_user_ids || to_jsonb(p_user_id::TEXT);
      v_action_type := 'added';
    END IF;
    
    -- If no users left, remove entire emoji
    IF jsonb_array_length(v_user_ids) = 0 THEN
      v_reactions := v_reactions - v_existing_index;
    ELSE
      -- Update user_ids for this emoji
      v_reactions := jsonb_set(v_reactions, ARRAY[v_existing_index::TEXT, 'user_ids'], v_user_ids);
    END IF;
  ELSE
    -- Emoji doesn't exist, add new entry
    v_reactions := v_reactions || jsonb_build_array(
      jsonb_build_object(
        'emoji', p_emoji,
        'user_ids', jsonb_build_array(p_user_id::TEXT)
      )
    );
    v_action_type := 'added';
  END IF;
  
  -- Update the message with new reactions and force updated_at to change
  UPDATE team_messages 
  SET 
    reactions = v_reactions,
    updated_at = NOW()
  WHERE id = p_message_id;
  
  -- Return the result
  RETURN jsonb_build_object(
    'success', TRUE,
    'reactions', v_reactions,
    'action', v_action_type
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function to all users
GRANT EXECUTE ON FUNCTION update_message_reaction TO authenticated;
GRANT EXECUTE ON FUNCTION update_message_reaction TO anon;
GRANT EXECUTE ON FUNCTION update_message_reaction TO service_role;

-- Make sure team_messages has REPLICA IDENTITY FULL for proper realtime updates
ALTER TABLE team_messages REPLICA IDENTITY FULL;

-- Ensure team_messages is in the realtime publication
BEGIN;
  -- Check if the table is already in the publication
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE tablename = 'team_messages' 
    AND pubname = 'supabase_realtime'
  ) THEN
    -- Add it to the publication if it's not already there
    ALTER PUBLICATION supabase_realtime ADD TABLE team_messages;
  END IF;
COMMIT;
