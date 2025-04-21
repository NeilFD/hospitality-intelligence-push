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
    
    // Validate inputs with stronger error reporting
    if (!p_message_id) {
      console.error('Missing required parameter: message_id');
      return new Response(JSON.stringify({ error: 'Missing message_id parameter' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    
    if (!p_user_id) {
      console.error('Missing required parameter: user_id');
      return new Response(JSON.stringify({ error: 'Missing user_id parameter' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    
    if (!p_emoji) {
      console.error('Missing required parameter: emoji');
      return new Response(JSON.stringify({ error: 'Missing emoji parameter' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    console.log(`[add_message_reaction] Processing: emoji=${p_emoji}, message=${p_message_id}, user=${p_user_id}`);

    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use service role key for admin access
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Try to use the SQL function directly for better performance
    try {
      console.log(`[add_message_reaction] Attempting to use SQL function directly`);
      const { data: sqlResult, error: sqlError } = await supabaseClient.rpc(
        'update_message_reaction',
        {
          p_message_id,
          p_user_id,
          p_emoji
        }
      );
      
      if (!sqlError) {
        console.log(`[add_message_reaction] SQL function succeeded:`, sqlResult);
        return new Response(JSON.stringify(sqlResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      } else {
        console.log(`[add_message_reaction] SQL function failed, falling back to manual update:`, sqlError);
      }
    } catch (sqlFunctionError) {
      console.error('Error calling SQL function:', sqlFunctionError);
      // Continue with manual update as fallback
    }

    // If SQL function failed, do the manual update
    // First fetch the message to get current reactions
    const { data: message, error: fetchError } = await supabaseClient
      .from('team_messages')
      .select('reactions, author_id')
      .eq('id', p_message_id)
      .single()
    
    if (fetchError) {
      console.error('Error fetching message:', fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }
    
    console.log(`[add_message_reaction] Message found: author=${message.author_id}`);
    console.log(`[add_message_reaction] Current reactions:`, message.reactions);

    // Process reactions with careful parsing
    let reactions = [];
    
    if (message.reactions) {
      try {
        if (typeof message.reactions === 'string') {
          reactions = JSON.parse(message.reactions);
        } else if (Array.isArray(message.reactions)) {
          reactions = [...message.reactions];
        } else if (typeof message.reactions === 'object') {
          reactions = Object.values(message.reactions);
        }
      } catch (e) {
        console.error('Error parsing existing reactions:', e);
        reactions = [];
      }
    }

    console.log(`[add_message_reaction] Parsed reactions:`, reactions);

    // Find existing reaction by emoji
    const existingIndex = reactions.findIndex(r => r.emoji === p_emoji);
    
    // Variable to track if we're adding or removing
    let actionType = 'none';
    
    if (existingIndex >= 0) {
      // This emoji already has reactions
      let userIds = [];
      
      if (reactions[existingIndex].user_ids) {
        if (Array.isArray(reactions[existingIndex].user_ids)) {
          userIds = [...reactions[existingIndex].user_ids];
        } else if (typeof reactions[existingIndex].user_ids === 'string') {
          try {
            userIds = JSON.parse(reactions[existingIndex].user_ids);
          } catch (e) {
            console.error('Error parsing user_ids string:', e);
            userIds = [];
          }
        }
      }
      
      console.log(`[add_message_reaction] User IDs for emoji ${p_emoji}:`, userIds);
      
      const userIndex = userIds.indexOf(p_user_id);
      
      if (userIndex >= 0) {
        // User already reacted, remove reaction (toggle behavior)
        userIds.splice(userIndex, 1);
        actionType = 'removed';
        
        if (userIds.length === 0) {
          // No users left for this emoji, remove emoji
          reactions.splice(existingIndex, 1);
        } else {
          // Update user IDs for this emoji
          reactions[existingIndex].user_ids = userIds;
        }
      } else {
        // User hasn't reacted with this emoji, add them
        reactions[existingIndex].user_ids = [...userIds, p_user_id];
        actionType = 'added';
      }
    } else {
      // No reactions for this emoji, add new entry
      reactions.push({
        emoji: p_emoji,
        user_ids: [p_user_id]
      });
      actionType = 'added';
    }

    console.log(`[add_message_reaction] Action: ${actionType}`);
    console.log(`[add_message_reaction] Updated reactions:`, reactions);

    // To ensure immediate update visibility, let's manually force an update to the updated_at column
    const { data: updateData, error: updateError } = await supabaseClient
      .from('team_messages')
      .update({ 
        reactions: reactions,
        updated_at: new Date().toISOString()  // Force timestamp update for realtime
      })
      .eq('id', p_message_id)
      .select();
    
    if (updateError) {
      console.error('Error updating message with reactions:', updateError);
      return new Response(JSON.stringify({ error: updateError.message }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log(`[add_message_reaction] Update successful, returning reactions`);
    
    return new Response(JSON.stringify({ 
      success: true, 
      reactions,
      action: actionType,
      message_id: p_message_id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Unexpected error in add_message_reaction:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})
