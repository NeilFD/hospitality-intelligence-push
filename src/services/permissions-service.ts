
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

    // HiQ is available to all users
    if (moduleType === 'hiq') {
      console.log('HiQ access check: Always granted');
      return true;
    }

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
      console.log('[permissions-service] GOD role detected, granting access to all modules including HiQ');
      return ['home', 'food', 'beverage', 'pl', 'wages', 'performance', 'team', 'master', 'hiq'];
    }

    // Get the permission matrix from the database
    const { data, error } = await supabase.rpc('get_permission_matrix');
    
    if (error) {
      console.error('Error fetching permission matrix:', error);
      // Ensure HiQ is included in the fallback array
      return ['home', 'hiq'];
    }
    
    // Find the user's role in the permission matrix
    const userRole = data.find((r: any) => r.roleId === role);
    if (!userRole) {
      console.log('[permissions-service] Role not found in matrix, defaulting with HiQ');
      return ['home', 'hiq'];
    }
    
    // Filter modules that the user has access to
    const accessibleModules = userRole.modulePermissions
      .filter((m: any) => m.hasAccess)
      .map((m: any) => m.moduleType as ModuleType);
      
    // ALWAYS include HiQ
    if (!accessibleModules.includes('hiq')) {
      console.log('[permissions-service] Explicitly adding HiQ to accessible modules');
      accessibleModules.push('hiq');
    }
      
    console.log(`[permissions-service] Accessible modules for ${role}:`, accessibleModules);
    
    return accessibleModules;
  } catch (err) {
    console.error('Error fetching accessible modules:', err);
    // Add default modules in case of error, including HiQ
    return ['home', 'hiq'];
  }
};

// Function to clear any cached module permissions from localStorage
export const clearCachedModulePermissions = () => {
  try {
    // Check if we have cached module permissions
    const storeData = localStorage.getItem('tavern-kitchen-ledger');
    if (storeData) {
      const parsedData = JSON.parse(storeData);
      
      // Force HiQ to be included in modules array
      if (parsedData.state && parsedData.state.modules) {
        let hiqExists = false;
        
        // Check if HiQ already exists
        for (const module of parsedData.state.modules) {
          if (module.type === 'hiq') {
            hiqExists = true;
            break;
          }
        }
        
        // Add HiQ if it doesn't exist
        if (!hiqExists) {
          parsedData.state.modules.push({
            id: 'hiq',
            type: 'hiq',
            name: 'HiQ',
            displayOrder: 900
          });
          
          localStorage.setItem('tavern-kitchen-ledger', JSON.stringify(parsedData));
          console.log('[permissions-service] Added HiQ to cached modules in localStorage');
        }
      }
      
      // Force currentModule to be 'hiq' if we're on an HiQ page
      if (window.location.pathname.includes('/hiq')) {
        if (parsedData.state) {
          parsedData.state.currentModule = 'hiq';
          localStorage.setItem('tavern-kitchen-ledger', JSON.stringify(parsedData));
          console.log('[permissions-service] Forced currentModule to hiq in localStorage');
        }
      }
    }
  } catch (error) {
    console.error('Error clearing cached module permissions:', error);
  }
};
