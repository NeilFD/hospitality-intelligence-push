
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const MONZO_USER_ID = Deno.env.get("MONZO_USER_ID");
const MONZO_ACCESS_TOKEN = Deno.env.get("MONZO_ACCESS_TOKEN");
const MONZO_API_BASE = "https://api.monzo.com";

console.log("Monzo Edge Function initialized");

serve(async (req) => {
  console.log("Received request to Monzo edge function:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    let params;
    try {
      params = await req.json();
      console.log("Request params:", JSON.stringify(params));
    } catch (e) {
      console.error("Error parsing JSON body:", e);
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    const endpoint = params.endpoint;
    
    if (!endpoint) {
      console.error("No API endpoint specified");
      return new Response(
        JSON.stringify({ error: "No API endpoint specified" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    if (!MONZO_ACCESS_TOKEN) {
      console.error("Monzo access token not configured");
      return new Response(
        JSON.stringify({ error: "Monzo access token not configured", message: "Please add MONZO_ACCESS_TOKEN to your Supabase secrets" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Parse request parameters
    const accountId = params.account_id || "";
    const transactionId = params.transaction_id || "";
    
    // Map endpoint parameter to actual API endpoints
    let apiUrl = "";
    let method = "GET";
    
    switch (endpoint) {
      case "whoami":
        apiUrl = `${MONZO_API_BASE}/ping/whoami`;
        break;
      case "accounts":
        apiUrl = `${MONZO_API_BASE}/accounts`;
        break;
      case "balance":
        if (!accountId) {
          return new Response(
            JSON.stringify({ error: "account_id is required for balance endpoint" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
        apiUrl = `${MONZO_API_BASE}/balance?account_id=${accountId}`;
        break;
      case "transactions":
        if (!accountId) {
          return new Response(
            JSON.stringify({ error: "account_id is required for transactions endpoint" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
        apiUrl = `${MONZO_API_BASE}/transactions?account_id=${accountId}`;
        break;
      case "transaction_detail":
        if (!transactionId) {
          return new Response(
            JSON.stringify({ error: "transaction_id is required for transaction detail endpoint" }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
          );
        }
        apiUrl = `${MONZO_API_BASE}/transactions/${transactionId}?expand[]=merchant`;
        break;
      default:
        console.error("Unknown endpoint:", endpoint);
        return new Response(
          JSON.stringify({ error: "Unknown endpoint" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
    }
    
    console.log(`Calling Monzo API: ${apiUrl}`);
    
    // Call Monzo API with the provided access token
    const response = await fetch(apiUrl, {
      method: method,
      headers: {
        "Authorization": `Bearer ${MONZO_ACCESS_TOKEN}`,
        "Accept": "application/json",
      },
    });
    
    const data = await response.json();
    console.log(`Monzo API response status: ${response.status}`);
    
    if (!response.ok) {
      console.error(`Monzo API error (${response.status}):`, data);
      return new Response(
        JSON.stringify({ error: "Monzo API error", details: data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: response.status }
      );
    }
    
    // Return successful response
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", message: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
