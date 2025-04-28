
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/cors.ts'
import { Database } from '../_shared/database.types.ts'

console.log("Function upsert_wages_record called");

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    
    // Parse the request body
    const body = await req.json()
    const {
      p_year,
      p_month, 
      p_day,
      p_date,
      p_day_of_week,
      p_foh_wages,
      p_kitchen_wages,
      p_food_revenue,
      p_bev_revenue
    } = body
    
    console.log(`Processing wages upsert for ${p_year}-${p_month}-${p_day}`)
    console.log(`Values received: foh=${p_foh_wages}, kitchen=${p_kitchen_wages}, food=${p_food_revenue}, bev=${p_bev_revenue}`)
    
    // Convert empty strings to null to ensure proper database handling
    const fohWages = p_foh_wages === '' ? null : (p_foh_wages === undefined ? null : parseFloat(p_foh_wages) || 0);
    const kitchenWages = p_kitchen_wages === '' ? null : (p_kitchen_wages === undefined ? null : parseFloat(p_kitchen_wages) || 0);
    const foodRevenue = p_food_revenue === '' ? null : (p_food_revenue === undefined ? null : parseFloat(p_food_revenue) || 0);
    const bevRevenue = p_bev_revenue === '' ? null : (p_bev_revenue === undefined ? null : parseFloat(p_bev_revenue) || 0);
    
    console.log(`Parsed values: foh=${fohWages}, kitchen=${kitchenWages}, food=${foodRevenue}, bev=${bevRevenue}`);
    
    // Skip database operations if all fields are empty/undefined
    if (fohWages === null && kitchenWages === null && foodRevenue === null && bevRevenue === null) {
      console.log('All wage values are null, skipping database operation');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No changes detected, skipping update' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }
    
    // First check if record exists
    const { data: existingRecord, error: fetchError } = await supabaseClient
      .from('wages')
      .select('id, foh_wages, kitchen_wages, food_revenue, bev_revenue')
      .eq('year', p_year)
      .eq('month', p_month)
      .eq('day', p_day)
      .maybeSingle();
      
    if (fetchError) {
      console.error('Error checking for existing record:', fetchError);
      throw new Error(`Failed to check for existing record: ${fetchError.message}`);
    }
    
    let result;
    let error = null;
    
    try {
      // If record exists, update it
      if (existingRecord?.id) {
        console.log(`Updating existing record with ID ${existingRecord.id}`);
        
        // Only update fields that have been provided
        const updateData: any = {
          updated_at: new Date().toISOString()
        };
        
        if (fohWages !== null) updateData.foh_wages = fohWages;
        if (kitchenWages !== null) updateData.kitchen_wages = kitchenWages;
        if (foodRevenue !== null) updateData.food_revenue = foodRevenue;
        if (bevRevenue !== null) updateData.bev_revenue = bevRevenue;
        
        console.log('Update data:', updateData);
        
        const { data, error: updateError } = await supabaseClient
          .from('wages')
          .update(updateData)
          .eq('id', existingRecord.id)
          .select();
          
        result = data;
        error = updateError;
        console.log('Update result:', result, 'Error:', error);
      } else {
        // Insert new record
        console.log('Creating new record');
        
        const { data, error: insertError } = await supabaseClient
          .from('wages')
          .insert([{
            year: p_year,
            month: p_month,
            day: p_day,
            date: p_date,
            day_of_week: p_day_of_week,
            foh_wages: fohWages,
            kitchen_wages: kitchenWages,
            food_revenue: foodRevenue,
            bev_revenue: bevRevenue
          }])
          .select();
          
        result = data;
        error = insertError;
        console.log('Insert result:', result, 'Error:', error);
      }
    } catch (operationError) {
      console.error('Exception during database operation:', operationError);
      error = { message: operationError.message };
    }
    
    // Handle materialized view error or any other error
    if (error) {
      console.error('Error during upsert:', error);
      
      // Specifically catch materialized view errors
      if (error.message && (
          error.message.includes('financial_performance_analysis') || 
          error.message.includes('permission denied') ||
          error.message.includes('42501'))) {
        console.log('Detected materialized view error - using direct upsert as fallback');
        
        // Use the direct upsert function as a fallback
        try {
          const { data: directResult, error: directError } = await supabaseClient.rpc(
            'direct_upsert_wages',
            {
              p_year,
              p_month,
              p_day,
              p_date,
              p_day_of_week,
              p_foh_wages: fohWages,
              p_kitchen_wages: kitchenWages,
              p_food_revenue: foodRevenue,
              p_bev_revenue: bevRevenue
            }
          );
          
          if (directError) {
            console.error('Direct upsert failed:', directError);
            throw new Error(`Direct upsert failed: ${directError.message}`);
          }
          
          console.log('Direct upsert succeeded:', directResult);
          
          return new Response(JSON.stringify({
            success: true,
            data: directResult,
            message: 'Data saved successfully via direct method'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          });
        } catch (directErr) {
          console.error('Direct upsert exception:', directErr);
          throw new Error(`All save attempts failed: ${directErr.message}`);
        }
      }
      
      // For non-materialized view errors that weren't caught above
      throw new Error(`Database operation failed: ${error.message}`);
    }
    
    // Success case - return the result
    return new Response(JSON.stringify({ 
      success: true, 
      data: result,
      message: 'Data saved successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (error) {
    console.error('Unhandled error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false,
      message: 'Failed to save data' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
})
