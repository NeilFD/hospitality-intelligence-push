
-- Enable RPC functions with stronger grants
GRANT EXECUTE ON FUNCTION update_message_reaction(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_message_reaction(uuid, uuid, text) TO anon;
GRANT EXECUTE ON FUNCTION add_message_reaction TO authenticated;
GRANT EXECUTE ON FUNCTION add_message_reaction TO anon;

-- Enable REPLICA IDENTITY FULL on team_messages table to ensure complete row data is available for realtime
ALTER TABLE team_messages REPLICA IDENTITY FULL;

-- Make sure team_messages table is added to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE team_messages;
