
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

// Fix: Use absolute URL instead of relative URL - ensuring it's always the same format
const SITE_URL = "https://c6d57777-8a13-463c-b78c-8d74d834e5d9.lovableproject.com";

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
    
    // Generate the full invitation URL with the correct domain
    const invitationUrl = `${SITE_URL}/register?token=${invitationToken}`;
    console.log("Generated invitation URL:", invitationUrl);
    
    // If invitation already exists, return a specific error message
    if (existingInvitation && existingInvitation.length > 0) {
      console.log("Found existing invitation for email:", email);
      
      // Resend the invitation using the existing token
      const existingToken = existingInvitation[0].invitation_token;
      
      // Use consistent URL format for invitation
      const existingInvitationUrl = `${SITE_URL}/register?token=${existingToken}`;
      console.log("Generated URL for existing invitation:", existingInvitationUrl);
      
      // Actually send the email here
      const emailResult = await sendInvitationEmail(email, firstName, existingInvitationUrl);
      
      if (emailResult.error) {
        console.warn(`Failed to send invitation email: ${emailResult.error}`);
        // We'll continue despite the error to provide the URL
      }
      
      return new Response(
        JSON.stringify({ 
          message: 'An invitation has already been sent to this email address. Resending the invitation.',
          existingInvitation: true,
          invitationUrl: existingInvitationUrl
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }
    
    // Send the actual invitation email
    const emailResult = await sendInvitationEmail(email, firstName, invitationUrl);
    
    if (emailResult.error) {
      console.warn(`Warning: Issue with email sending: ${emailResult.error}`);
      // We'll continue despite the error to store the invitation
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
        message: emailResult.error 
          ? 'Invitation created but email could not be sent. Please share the link manually.' 
          : 'Invitation email sent successfully',
        invitationUrl,
        emailSent: !emailResult.error
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
    
    try {
      console.log("Attempting to send direct email using Supabase's SMTP service");
      
      // Send email with fixed URL and custom email template
      const { error: directEmailError } = await supabase.auth.admin.inviteUserByEmail(toEmail, {
        redirectTo: invitationUrl,
        data: {
          firstName,
          invitationUrl,
          companyName
        }
      });
      
      if (directEmailError) {
        throw directEmailError;
      }
      
      return { success: true };
      
    } catch (directEmailError) {
      console.error("Direct email method failed:", directEmailError);
      
      // Fall back to simulated email for development
      console.log(`
        SIMULATED EMAIL (after error):
        To: ${toEmail}
        Subject: You've been invited to join ${companyName}
        
        Hi ${firstName},
        
        You've been invited to join ${companyName}. Please click the link below to complete your registration:
        
        ${invitationUrl}
        
        This invitation will expire in 7 days.
      `);
      
      return { 
        success: true, 
        error: `Email sending failed but invitation was created. Error: ${directEmailError.message || "Unknown error"}`
      };
    }
  } catch (error) {
    console.error("Error in email sending function:", error);
    
    // Fall back to simulated email for development
    console.log(`
      SIMULATED EMAIL (after error):
      To: ${toEmail}
      Subject: You've been invited to join the team
      
      Hi ${firstName},
      
      You've been invited to join the team. Please click the link below to complete your registration:
      
      ${invitationUrl}
      
      This invitation will expire in 7 days.
    `);
    
    return { 
      success: true, 
      error: `Email sending failed but invitation was created. Error: ${error.message || "Unknown error"}`
    };
  }
}
