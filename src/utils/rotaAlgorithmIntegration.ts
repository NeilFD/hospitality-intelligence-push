
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
    
    // Apply staff priority weights
    algorithm.setStaffPriorityConfig({
      salariedWeight: configData.salaried_weight || 100,
      managerWeight: configData.manager_weight || 50,
      hiScoreWeight: configData.hi_score_weight || 1,
    });
    
    // Apply part shift configuration if it exists in the config
    if ('enable_part_shifts' in configData) {
      algorithm.setPartShiftConfig({
        enable: configData.enable_part_shifts !== false,
        minHours: configData.min_part_shift_hours || 3,
        maxHours: configData.max_part_shift_hours || 5,
        dayLatestStart: configData.day_latest_start || '12:00:00',
        eveningLatestStart: configData.evening_latest_start || '18:00:00',
      });
    }
    
    console.log("Algorithm configuration applied successfully");
    
  } catch (err) {
    console.error("Error applying algorithm configuration:", err);
  }
};
