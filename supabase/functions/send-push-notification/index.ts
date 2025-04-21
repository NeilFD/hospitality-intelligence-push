
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

    // Send push notifications to all subscriptions
    const pushPromises = subscriptions.map(async (subscription) => {
      try {
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
      } catch (error) {
        console.error(`Error sending push notification: ${error}`)
        // If subscription is invalid, remove it
        if (error.statusCode === 410) {
          await supabaseClient
            .from('push_subscriptions')
            .delete()
            .eq('id', subscription.id)
        }
      }
    })

    await Promise.all(pushPromises)

    return new Response(
      JSON.stringify({ message: 'Push notifications sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
