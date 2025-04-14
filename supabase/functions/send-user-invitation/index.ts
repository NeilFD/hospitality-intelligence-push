
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type RequestBody = {
  email: string;
  firstName: string;
  invitationToken: string;
};

const handler = async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize the Resend client
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not set");
    }
    const resend = new Resend(resendApiKey);

    // Get Supabase credentials from environment
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables are not set");
    }

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { email, firstName, invitationToken }: RequestBody = await req.json();

    if (!email || !invitationToken) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get application URL - in a real setup, this would come from config
    const appUrl = Deno.env.get("APP_URL") || "http://localhost:5173";
    const invitationUrl = `${appUrl}/register?token=${invitationToken}`;

    // Send invitation email
    const emailResponse = await resend.emails.send({
      from: "Hospitality Intelligence <no-reply@hospitality-intelligence.com>",
      to: email,
      subject: "Invitation to Hospitality Intelligence",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #806cac;">Welcome to Hospitality Intelligence!</h1>
          <p>Hello ${firstName || "there"},</p>
          <p>You've been invited to join the Hospitality Intelligence platform.</p>
          <p>To get started, please click the button below to set up your account:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${invitationUrl}" style="background-color: #806cac; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Accept Invitation
            </a>
          </div>
          <p>This invitation link will expire in 7 days.</p>
          <p>If you have any questions, please contact your administrator.</p>
        </div>
      `,
    });

    console.log("Email sent successfully", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Invitation sent successfully" 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending invitation:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error occurred" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
