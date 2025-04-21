

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import webpush from 'https://esm.sh/web-push@3.6.6'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { notification, userIds } = await req.json()
    console.log('Sending push notification to users:', userIds)
    console.log('Notification content:', notification)

    // Initialize web-push with VAPID details
    webpush.setVapidDetails(
      'mailto:support@your-domain.com',
      Deno.env.get('VAPID_PUBLIC_KEY') || '',
      Deno.env.get('VAPID_PRIVATE_KEY') || ''
    )

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get push subscriptions for mentioned users
    const { data: subscriptions, error: subscriptionError } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds)

    if (subscriptionError) {
      throw new Error(`Error fetching subscriptions: ${subscriptionError.message}`)
    }

    console.log(`Found ${subscriptions.length} subscription(s) for the specified users`)

    // If no subscriptions found, return early
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active push subscriptions found for the users' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Send push notifications to all subscriptions
    const pushPromises = subscriptions.map(async (subscription) => {
      try {
        console.log(`Sending notification to subscription ID: ${subscription.id}`)
        
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          JSON.stringify(notification)
        )
        
        console.log(`Push notification sent to subscription: ${subscription.id}`)
        return { status: 'success', subscriptionId: subscription.id }
      } catch (error) {
        console.error(`Error sending push notification: ${error}`)
        
        // If subscription is invalid (gone), remove it
        if (error.statusCode === 410) {
          console.log(`Subscription ${subscription.id} gone, removing from database`)
          
          await supabaseClient
            .from('push_subscriptions')
            .delete()
            .eq('id', subscription.id)
          
          return { 
            status: 'error', 
            subscriptionId: subscription.id, 
            reason: 'subscription_gone',
            removed: true 
          }
        }
        
        return { 
          status: 'error', 
          subscriptionId: subscription.id, 
          reason: error.message 
        }
      }
    })

    const results = await Promise.all(pushPromises)
    
    // Count successful notifications
    const successCount = results.filter(r => r.status === 'success').length

    return new Response(
      JSON.stringify({ 
        message: `Push notifications sent successfully to ${successCount} device(s)`,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error(`Fatal error in push notification service: ${error}`)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

