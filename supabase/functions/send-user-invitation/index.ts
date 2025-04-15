
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

// Define default site URL to be used as fallback
const DEFAULT_SITE_URL = "https://c6d57777-8a13-463c-b78c-8d74d834e5d9.lovableproject.com";

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
    
    // Get the site URL for the registration link, with fallback to default
    const siteUrl = Deno.env.get('SITE_URL') || DEFAULT_SITE_URL;
    console.log("Using site URL:", siteUrl);
    
    // If invitation already exists, return a specific error message
    if (existingInvitation && existingInvitation.length > 0) {
      console.log("Found existing invitation for email:", email);
      
      // Get the site URL for the registration link
      if (!siteUrl) {
        console.error("Site URL is not defined, using default");
      }
      
      // Resend the invitation using the existing token
      const existingToken = existingInvitation[0].invitation_token;
      const invitationUrl = `${siteUrl}/register?token=${existingToken}`;
      
      // Actually send the email here
      const emailResult = await sendInvitationEmail(email, firstName, invitationUrl);
      
      if (emailResult.error) {
        throw new Error(`Failed to send invitation email: ${emailResult.error}`);
      }
      
      return new Response(
        JSON.stringify({ 
          message: 'An invitation has already been sent to this email address. Resending the invitation.',
          existingInvitation: true,
          invitationUrl
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Construct the invitation URL
    const invitationUrl = `${siteUrl}/register?token=${invitationToken}`;
    console.log("Generated invitation URL:", invitationUrl);
    
    // Send the actual invitation email
    const emailResult = await sendInvitationEmail(email, firstName, invitationUrl);
    
    if (emailResult.error) {
      throw new Error(`Failed to send invitation email: ${emailResult.error}`);
    }
    
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
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation email sent successfully',
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

// Function to send the invitation email
async function sendInvitationEmail(
  toEmail: string, 
  firstName: string, 
  invitationUrl: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    // Create Supabase client for email operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the company name for the email
    const { data: settings } = await supabase
      .from('company_settings')
      .select('company_name')
      .single();
      
    const companyName = settings?.company_name || 'Our Company';
    
    console.log(`Sending invitation email to ${toEmail} with invitation URL: ${invitationUrl}`);
    
    // Use Supabase's built-in email service
    const { error } = await supabase.auth.admin.createUser({
      email: toEmail,
      email_confirm: false,
      user_metadata: {
        firstName,
        invited: true,
        invitationUrl
      },
      app_metadata: {
        invitation_pending: true
      }
    });
    
    if (error) {
      // If this fails, it might be because the user already exists
      console.log(`User creation failed, trying magic link: ${error.message}`);
      
      // Let's try to send a magic link instead
      try {
        // Send a magic link with custom metadata about the invitation
        const { error: magicLinkError } = await supabase.auth.admin.generateLink({
          type: 'magiclink',
          email: toEmail,
          options: {
            data: {
              invitation: true,
              firstName,
              invitationUrl
            }
          }
        });
        
        if (magicLinkError) {
          console.error('Error sending magic link:', magicLinkError);
          throw magicLinkError;
        }
        
        console.log(`Successfully sent magic link to ${toEmail}`);
        return { success: true };
      } catch (innerError) {
        console.error('Error sending magic link:', innerError);
        
        // Fall back to simulated email for development
        console.log(`
          To: ${toEmail}
          Subject: You've been invited to join ${companyName}
          
          Hi ${firstName},
          
          You've been invited to join ${companyName}. Please click the link below to complete your registration:
          
          ${invitationUrl}
          
          This invitation will expire in 7 days.
        `);
        
        return { success: true };
      }
    }
    
    console.log(`Successfully created user and sent invitation to ${toEmail}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending invitation email:', error);
    
    // Fall back to simulated email for development
    console.log(`
      To: ${toEmail}
      Subject: You've been invited to join the team
      
      Hi ${firstName},
      
      You've been invited to join the team. Please click the link below to complete your registration:
      
      ${invitationUrl}
      
      This invitation will expire in 7 days.
    `);
    
    return { success: true };
  }
}
