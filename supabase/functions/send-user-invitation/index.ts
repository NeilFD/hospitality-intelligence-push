
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InvitationRequest {
  email: string;
  firstName: string;
  lastName: string;
  invitationToken: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Parse the request body
    const requestData = await req.json();
    const { email, firstName, lastName, invitationToken } = requestData as InvitationRequest;
    
    // Basic validation
    if (!email || !invitationToken) {
      return new Response(
        JSON.stringify({ error: 'Email and invitation token are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL or service role key is missing');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the site URL for the registration link
    const siteUrl = Deno.env.get('SITE_URL') || '';
    if (!siteUrl) {
      throw new Error('Site URL is not defined');
    }
    
    // Construct the invitation URL
    const invitationUrl = `${siteUrl}/register?token=${invitationToken}`;
    
    // Here you would typically use an email service like SendGrid, Resend, etc.
    // For now, we'll just simulate sending an email
    console.log(`
      To: ${email}
      Subject: You've been invited to join the team
      
      Hi ${firstName},
      
      You've been invited to join the team. Please click the link below to complete your registration:
      
      ${invitationUrl}
      
      This invitation will expire in 7 days.
    `);
    
    // For demonstration purposes, we'll just return a success message
    // In a real application, you would send an actual email here
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation email would be sent (simulated)',
        invitationUrl 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
    
  } catch (error) {
    console.error('Error processing invitation:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to process invitation' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
