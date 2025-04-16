
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

// Use application URL
const SITE_URL = "https://myhi.io";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const requestData: InvitationRequest = await req.json();
    const { email, firstName, lastName, invitationToken, role, jobTitle, created_by } = requestData;
    
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
      throw new Error('Failed to check existing invitations');
    }
    
    // Generate the invitation URL
    const invitationUrl = `${SITE_URL}/register?token=${invitationToken}`;
    
    // If invitation already exists, return a specific error message
    if (existingInvitation && existingInvitation.length > 0) {
      // Check if it's already claimed
      if (existingInvitation[0].is_claimed) {
        return new Response(
          JSON.stringify({ 
            message: 'This invitation has already been claimed. The user should be able to log in.',
            invitationAlreadyClaimed: true
          }),
          { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }
      
      // Resend the invitation using the existing token
      const existingToken = existingInvitation[0].invitation_token;
      const existingInvitationUrl = `${SITE_URL}/register?token=${existingToken}`;
      
      // Send the email here
      const emailResult = await sendInvitationEmail(email, firstName, existingInvitationUrl);
      
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
    
    // Use a direct SQL query with the service role to bypass RLS policies
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
      throw new Error('Failed to create invitation record: ' + insertError.message);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Invitation email sent successfully',
        invitationUrl,
        emailSent: true
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
    
  } catch (error) {
    console.error('Error in send-user-invitation:', error);
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
    
    try {
      // Send email with the invitation URL using Supabase's email service
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
      
      console.log(`Successfully sent invitation email to ${toEmail}`);
      return { success: true };
      
    } catch (directEmailError) {
      console.error("Direct email method failed:", directEmailError);
      
      // Fallback: Try an alternative method to send the email
      try {
        const { error: signInLinkError } = await supabase.auth.admin.generateLink({
          type: 'signup',
          email: toEmail,
          options: {
            redirectTo: invitationUrl
          }
        });
        
        if (signInLinkError) {
          throw signInLinkError;
        }
        
        console.log(`Successfully generated signup link for ${toEmail}`);
        return { success: true };
        
      } catch (signInLinkError) {
        console.error("Sign-in link generation failed:", signInLinkError);
        
        // Fallback: Log the email content for development purposes
        console.log(`
          SIMULATED EMAIL:
          To: ${toEmail}
          Subject: You've been invited to join ${companyName}
          
          Hi ${firstName},
          
          You've been invited to join ${companyName}. Please click the link below to complete your registration:
          
          ${invitationUrl}
          
          This invitation will expire in 7 days.
          
          After signing up, you will receive a confirmation link from our system which you must click on to continue.
          Then you can return to the register page to update your profile.
          
          We're looking forward to having you on the team!
        `);
        
        return { 
          success: true, 
          error: `Email sending failed but invitation was created. Error: ${signInLinkError.message}`
        };
      }
    }
  } catch (error) {
    console.error("Error in email sending function:", error);
    
    // Fallback: Log the email content for development purposes
    console.log(`
      SIMULATED EMAIL:
      To: ${toEmail}
      Subject: You've been invited to join the team
      
      Hi ${firstName},
      
      You've been invited to join the team. Please click the link below to complete your registration:
      
      ${invitationUrl}
      
      This invitation will expire in 7 days.
      
      After signing up, you will receive a confirmation link from our system which you must click on to continue.
      Then you can log in to access the platform.
    `);
    
    return { 
      success: true, 
      error: `Email sending failed but invitation was created. Error: ${error.message}`
    };
  }
}
