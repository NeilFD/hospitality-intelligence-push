
import { supabase } from '@/lib/supabase';
import { ModuleType } from '@/types/kitchen-ledger';

// Function to check if a user with a specific role has access to a module
export const getHasAccessToModule = async (
  role: string,
  moduleType: ModuleType
): Promise<boolean> => {
  try {
    // If user is GOD, they have access to everything
    if (role === 'GOD') return true;

    // Get the permission matrix from the database
    const { data, error } = await supabase.rpc('get_permission_matrix');
    
    if (error) {
      console.error('Error fetching permission matrix:', error);
      return false;
    }
    
    // Find the user's role in the permission matrix
    const userRole = data.find((r: any) => r.roleId === role);
    if (!userRole) return false;
    
    // Check if the user has access to the specified module
    const module = userRole.modulePermissions.find((m: any) => m.moduleType === moduleType);
    
    console.log(`[permissions-service] Checking if ${role} has access to ${moduleType}:`, module?.hasAccess || false);
    
    return module ? module.hasAccess : false;
  } catch (err) {
    console.error('Error checking module access:', err);
    return false;
  }
};

// Function to get all modules a user has access to
export const getUserAccessibleModules = async (role: string): Promise<ModuleType[]> => {
  try {
    // If user is GOD, they have access to everything
    if (role === 'GOD') {
      return ['home', 'food', 'beverage', 'pl', 'wages', 'performance', 'team', 'master'];
    }

    // Get the permission matrix from the database
    const { data, error } = await supabase.rpc('get_permission_matrix');
    
    if (error) {
      console.error('Error fetching permission matrix:', error);
      return [];
    }
    
    // Find the user's role in the permission matrix
    const userRole = data.find((r: any) => r.roleId === role);
    if (!userRole) return [];
    
    // Filter modules that the user has access to
    const accessibleModules = userRole.modulePermissions
      .filter((m: any) => m.hasAccess)
      .map((m: any) => m.moduleType as ModuleType);
      
    console.log(`[permissions-service] Accessible modules for ${role}:`, accessibleModules);
    
    return accessibleModules;
  } catch (err) {
    console.error('Error fetching accessible modules:', err);
    return [];
  }
};
