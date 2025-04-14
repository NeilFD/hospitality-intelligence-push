
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
    
    // Check if an invitation already exists for this email
    const { data: existingInvitation, error: checkError } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('email', email)
      .limit(1);
      
    if (checkError) {
      console.error('Error checking existing invitation:', checkError);
      throw new Error('Failed to check existing invitations');
    }
    
    // If invitation already exists, return a specific error message
    if (existingInvitation && existingInvitation.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: 'An invitation has already been sent to this email address',
          existingInvitation: true 
        }),
        { status: 409, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
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
    
    // Use a direct SQL query with the service role to bypass RLS policies
    const { error: insertError } = await supabase.rpc('create_user_invitation', {
      p_email: email,
      p_first_name: firstName,
      p_last_name: lastName,
      p_role: requestData.role || 'Team Member',
      p_job_title: requestData.jobTitle || null,
      p_created_by: requestData.created_by || null,
      p_invitation_token: invitationToken
    });
        
    if (insertError) {
      console.error('Error creating invitation using RPC:', insertError);
      throw new Error('Failed to create invitation record');
    }
    
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
