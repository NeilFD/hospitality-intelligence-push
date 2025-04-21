
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { p_message_id, p_user_id, p_emoji } = await req.json()
    
    // Validate inputs
    if (!p_message_id || !p_user_id || !p_emoji) {
      console.error('Missing required parameters:', { p_message_id, p_user_id, p_emoji });
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    console.log(`Processing reaction: ${p_emoji} for message ${p_message_id} by user ${p_user_id}`);

    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the message
    const { data: message, error: fetchError } = await supabaseClient
      .from('team_messages')
      .select('reactions')
      .eq('id', p_message_id)
      .single()
    
    if (fetchError) {
      console.error('Error fetching message:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    if (!message) {
      console.error('Message not found:', p_message_id);
      return new Response(JSON.stringify({ error: 'Message not found' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      })
    }

    // Parse and update reactions
    let reactions = [];
    if (message.reactions) {
      try {
        reactions = typeof message.reactions === 'string'
          ? JSON.parse(message.reactions)
          : (Array.isArray(message.reactions) ? message.reactions : [])
      } catch (e) {
        console.error('Error parsing reactions:', e);
        reactions = []
      }
    }

    console.log('Current reactions:', reactions);

    // Find existing reaction or add new one
    const existingIndex = reactions.findIndex((r) => r.emoji === p_emoji)
    
    if (existingIndex >= 0) {
      // This emoji already has reactions
      const userIds = Array.isArray(reactions[existingIndex].user_ids) 
        ? reactions[existingIndex].user_ids 
        : [];
        
      const userIndex = userIds.indexOf(p_user_id)
      
      if (userIndex >= 0) {
        // User already reacted, remove reaction (toggle behavior)
        userIds.splice(userIndex, 1)
        
        if (userIds.length === 0) {
          // No users left for this emoji, remove emoji
          reactions.splice(existingIndex, 1)
        } else {
          // Update user IDs for this emoji
          reactions[existingIndex].user_ids = userIds
        }
      } else {
        // User hasn't reacted with this emoji, add them
        reactions[existingIndex].user_ids = [...userIds, p_user_id]
      }
    } else {
      // No reactions for this emoji, add new entry
      reactions.push({
        emoji: p_emoji,
        user_ids: [p_user_id]
      })
    }

    console.log('Updated reactions:', reactions);

    // Update the message with new reactions
    const { error: updateError } = await supabaseClient
      .from('team_messages')
      .update({ reactions: reactions })
      .eq('id', p_message_id)
    
    if (updateError) {
      console.error('Error updating message:', updateError);
      return new Response(JSON.stringify({ error: updateError.message }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    return new Response(JSON.stringify({ success: true, reactions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
