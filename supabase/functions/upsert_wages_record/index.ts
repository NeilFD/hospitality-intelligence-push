
// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'
import { corsHeaders } from '../_shared/cors.ts'
import { Database } from '../_shared/database.types.ts'

console.log("Function upsert_wages_record loaded");

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
    
    // Handling empty values properly (convert empty strings to null)
    const fohWages = p_foh_wages === '' ? null : p_foh_wages !== undefined ? parseFloat(p_foh_wages) || 0 : null;
    const kitchenWages = p_kitchen_wages === '' ? null : p_kitchen_wages !== undefined ? parseFloat(p_kitchen_wages) || 0 : null;
    const foodRevenue = p_food_revenue === '' ? null : p_food_revenue !== undefined ? parseFloat(p_food_revenue) || 0 : null;
    const bevRevenue = p_bev_revenue === '' ? null : p_bev_revenue !== undefined ? parseFloat(p_bev_revenue) || 0 : null;
    
    console.log(`Parsed values: foh=${fohWages}, kitchen=${kitchenWages}, food=${foodRevenue}, bev=${bevRevenue}`);

    // Format date for SQL (converting from YYYY-MM-DD string to a proper date format)
    const formattedDate = p_date ? p_date.split('T')[0] : `${p_year}-${p_month.toString().padStart(2, '0')}-${p_day.toString().padStart(2, '0')}`;

    // Primary method: Try direct database operations first as it's most reliable
    try {
      console.log('Using direct database operations');
      
      // Check if record exists
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
          
        if (updateError) {
          console.error('Error updating wages:', updateError);
          throw updateError;
        }
        
        result = data;
        console.log('Update result:', result);
      } else {
        // Insert new record
        console.log('Creating new record');
        
        const { data, error: insertError } = await supabaseClient
          .from('wages')
          .insert([{
            year: p_year,
            month: p_month,
            day: p_day,
            date: formattedDate,
            day_of_week: p_day_of_week,
            foh_wages: fohWages,
            kitchen_wages: kitchenWages,
            food_revenue: foodRevenue,
            bev_revenue: bevRevenue
          }])
          .select();
          
        if (insertError) {
          console.error('Error inserting wages:', insertError);
          throw insertError;
        }
        
        result = data;
        console.log('Insert result:', result);
      }
      
      return new Response(JSON.stringify({
        success: true,
        data: result,
        message: 'Data saved successfully via direct database operation'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    } catch (dbError) {
      console.error('Direct database operation failed, trying RPC call:', dbError);
      
      // Fallback: Try RPC call
      try {
        console.log('Using direct RPC call to direct_upsert_wages');
        
        const { data: directResult, error: directError } = await supabaseClient.rpc(
          'direct_upsert_wages',
          {
            p_year,
            p_month,
            p_day,
            p_date: formattedDate,
            p_day_of_week,
            p_foh_wages: fohWages,
            p_kitchen_wages: kitchenWages,
            p_food_revenue: foodRevenue,
            p_bev_revenue: bevRevenue
          }
        );
        
        if (directError) {
          console.error('Direct RPC call failed:', directError);
          throw new Error(`Direct RPC failed: ${directError.message}`);
        }
        
        console.log('Direct RPC call succeeded:', directResult);
        
        return new Response(JSON.stringify({
          success: true,
          data: directResult,
          message: 'Data saved successfully via direct RPC'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        });
      } catch (rpcError) {
        console.error('All save attempts failed:', rpcError);
        throw new Error(`All save attempts failed: ${rpcError.message}`);
      }
    }
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
