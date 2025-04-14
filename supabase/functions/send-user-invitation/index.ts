
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
  role?: string;
  jobTitle?: string;
  created_by?: string;
}

serve(async (req) => {
  console.log("Received request:", req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request");
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Parse the request body
    const requestText = await req.text();
    console.log("Request body text:", requestText);
    
    let requestData;
    try {
      requestData = JSON.parse(requestText);
      console.log("Parsed request data:", requestData);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    const { email, firstName, lastName, invitationToken, role, jobTitle, created_by } = requestData as InvitationRequest;
    
    // Basic validation
    if (!email || !invitationToken) {
      console.error("Missing required fields:", { email, invitationToken });
      return new Response(
        JSON.stringify({ error: 'Email and invitation token are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase URL or service key");
      throw new Error('Supabase URL or service role key is missing');
    }
    
    console.log("Creating Supabase client with URL:", supabaseUrl);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if an invitation already exists for this email
    console.log("Checking for existing invitation for email:", email);
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
      console.log("Found existing invitation for email:", email);
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
      console.error("Site URL is not defined");
      throw new Error('Site URL is not defined');
    }
    
    // Construct the invitation URL
    const invitationUrl = `${siteUrl}/register?token=${invitationToken}`;
    console.log("Generated invitation URL:", invitationUrl);
    
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
    console.log("Creating invitation using RPC function");
    const { error: insertError } = await supabase.rpc('create_user_invitation', {
      p_email: email,
      p_first_name: firstName,
      p_last_name: lastName,
      p_role: role || 'Team Member',
      p_job_title: jobTitle || null,
      p_created_by: created_by || null,
      p_invitation_token: invitationToken
    });
        
    if (insertError) {
      console.error('Error creating invitation using RPC:', insertError);
      throw new Error('Failed to create invitation record: ' + insertError.message);
    }
    
    console.log("Invitation created successfully");
    
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
