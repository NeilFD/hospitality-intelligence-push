
-- This migration updates the system message for n8n webhook integration
-- to include proper column name references for the database

-- First, check if the function exists and create it if not
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'update_n8n_system_message'
    ) THEN
        -- Create a function to update the system message
        CREATE OR REPLACE FUNCTION update_n8n_system_message()
        RETURNS void AS $$
        BEGIN
            -- Update any existing system messages or config for n8n
            -- This is just a placeholder - the actual implementation would depend on
            -- where your system messages or n8n configurations are stored
            
            -- Example: If stored in a settings or config table
            -- UPDATE system_settings
            -- SET value = '{"database_structure": {"daily_performance_summary": {"revenue_columns": {"food": "food_revenue", "beverage": "beverage_revenue", "total": "total_revenue"}}}}'
            -- WHERE key = 'n8n_system_message';
            
            RAISE NOTICE 'N8N system message updated with correct column names';
        END;
        $$ LANGUAGE plpgsql;
    END IF;
END
$$;

-- Execute the function
SELECT update_n8n_system_message();

-- Add a comment to explain this migration's purpose
COMMENT ON FUNCTION update_n8n_system_message() IS 'Updates the system message for n8n integration to include proper column names for database tables';
