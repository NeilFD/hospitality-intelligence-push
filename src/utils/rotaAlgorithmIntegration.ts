
import { RotaSchedulingAlgorithm } from './rotaSchedulingAlgorithm';
import { supabase } from '@/lib/supabase';

/**
 * Load algorithm configuration from database and apply it to the algorithm instance
 */
export const applyAlgorithmConfiguration = async (
  algorithm: RotaSchedulingAlgorithm, 
  locationId: string
): Promise<void> => {
  try {
    // Fetch configuration from database
    const { data: configData, error } = await supabase
      .from('rota_algorithm_config')
      .select('*')
      .eq('location_id', locationId)
      .maybeSingle();
      
    if (error) {
      console.error("Error fetching algorithm configuration:", error);
      return;
    }
    
    if (!configData) {
      console.log("No algorithm configuration found, using defaults");
      return;
    }
    
    console.log("Applying algorithm configuration:", configData);
    
    // Apply staff priority weights - ensure numeric values with defaults
    algorithm.setStaffPriorityConfig({
      salariedWeight: typeof configData.salaried_weight === 'number' ? configData.salaried_weight : 100,
      managerWeight: typeof configData.manager_weight === 'number' ? configData.manager_weight : 50,
      hiScoreWeight: typeof configData.hi_score_weight === 'number' ? configData.hi_score_weight : 1,
    });
    
    // Apply part shift configuration if it exists in the config
    if ('enable_part_shifts' in configData) {
      algorithm.setPartShiftConfig({
        enable: configData.enable_part_shifts !== false,
        minHours: typeof configData.min_part_shift_hours === 'number' ? configData.min_part_shift_hours : 3,
        maxHours: typeof configData.max_part_shift_hours === 'number' ? configData.max_part_shift_hours : 5,
        dayLatestStart: configData.day_latest_start || '12:00:00',
        eveningLatestStart: configData.evening_latest_start || '18:00:00',
      });
    }
    
    console.log("Algorithm configuration applied successfully");
    
  } catch (err) {
    console.error("Error applying algorithm configuration:", err);
  }
};

/**
 * Load shift rules from database for a location
 */
export const loadShiftRules = async (
  algorithm: RotaSchedulingAlgorithm,
  locationId: string
): Promise<void> => {
  try {
    const { data: shiftRules, error } = await supabase
      .from('shift_rules')
      .select('*')
      .eq('location_id', locationId)
      .eq('is_active', true);
      
    if (error) {
      console.error("Error fetching shift rules:", error);
      return;
    }
    
    if (!shiftRules || shiftRules.length === 0) {
      console.log("No shift rules found for this location");
      return;
    }
    
    console.log(`Found ${shiftRules.length} active shift rules for location ${locationId}`);
    
    // Apply shift rules to algorithm
    algorithm.setShiftRules(shiftRules);
    
  } catch (err) {
    console.error("Error loading shift rules:", err);
  }
};

/**
 * Load role mappings from database
 */
export const loadRoleMappings = async (
  algorithm: RotaSchedulingAlgorithm,
  locationId: string
): Promise<void> => {
  try {
    const { data: roleMappings, error } = await supabase
      .from('job_role_mappings')
      .select('*')
      .eq('location_id', locationId);
      
    if (error) {
      console.error("Error fetching role mappings:", error);
      return;
    }
    
    if (!roleMappings || roleMappings.length === 0) {
      console.log("No role mappings found for this location");
      return;
    }
    
    console.log(`Found ${roleMappings.length} role mappings for location ${locationId}`);
    
    // Apply role mappings to algorithm
    algorithm.setRoleMapping(roleMappings);
    
  } catch (err) {
    console.error("Error loading role mappings:", err);
  }
};

