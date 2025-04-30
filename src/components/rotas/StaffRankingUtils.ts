
/**
 * Format a revenue band range for display
 */
export const formatRevenueBand = (min: number, max: number): string => {
  return `£${min} - £${max}`;
};

/**
 * Get the default revenue bands for initial setup
 */
export const getDefaultRevenueBands = () => {
  return [
    {
      name: 'Very Low Revenue',
      revenue_min: 0,
      revenue_max: 500,
      foh_min_staff: 1,
      foh_max_staff: 2,
      kitchen_min_staff: 1,
      kitchen_max_staff: 1,
      kp_min_staff: 0,
      kp_max_staff: 1,
      target_cost_percentage: 35
    },
    {
      name: 'Low Revenue',
      revenue_min: 501,
      revenue_max: 1000,
      foh_min_staff: 2,
      foh_max_staff: 3,
      kitchen_min_staff: 1,
      kitchen_max_staff: 2,
      kp_min_staff: 0,
      kp_max_staff: 1,
      target_cost_percentage: 32
    },
    {
      name: 'Medium Revenue',
      revenue_min: 1001,
      revenue_max: 2000,
      foh_min_staff: 3,
      foh_max_staff: 4,
      kitchen_min_staff: 2,
      kitchen_max_staff: 3,
      kp_min_staff: 1,
      kp_max_staff: 1,
      target_cost_percentage: 28
    },
    {
      name: 'High Revenue',
      revenue_min: 2001,
      revenue_max: 3500,
      foh_min_staff: 4,
      foh_max_staff: 6,
      kitchen_min_staff: 3,
      kitchen_max_staff: 4,
      kp_min_staff: 1,
      kp_max_staff: 2,
      target_cost_percentage: 25
    },
    {
      name: 'Very High Revenue',
      revenue_min: 3501,
      revenue_max: 10000,
      foh_min_staff: 6,
      foh_max_staff: 8,
      kitchen_min_staff: 4,
      kitchen_max_staff: 6,
      kp_min_staff: 1,
      kp_max_staff: 2,
      target_cost_percentage: 22
    }
  ];
};

/**
 * Generate a staffing summary string from threshold values
 */
export const getStaffSummary = (
  fohMin: number,
  fohMax: number,
  kitchenMin: number,
  kitchenMax: number,
  kpMin: number,
  kpMax: number
) => {
  return `FOH: ${fohMin}-${fohMax}, Kitchen: ${kitchenMin}-${kitchenMax}, KP: ${kpMin}-${kpMax}`;
};

/**
 * Format Hi Score for display
 */
export const formatHiScore = (score: number | null | undefined): string => {
  if (score === null || score === undefined) return 'N/A';
  return score.toFixed(1);
};

/**
 * Get color class for role badge based on role name
 */
export const getRoleColor = (role: string | null | undefined): string => {
  if (!role) return '';
  
  const roleLower = role.toLowerCase();
  
  if (roleLower.includes('chef') || roleLower.includes('kitchen')) {
    return 'bg-orange-100 text-orange-800 border-orange-300';
  } else if (roleLower.includes('manager') || roleLower.includes('supervisor')) {
    return 'bg-blue-100 text-blue-800 border-blue-300';
  } else if (roleLower.includes('porter') || roleLower.includes('kp')) {
    return 'bg-green-100 text-green-800 border-green-300';
  } else if (roleLower.includes('bar') || roleLower.includes('tender')) {
    return 'bg-purple-100 text-purple-800 border-purple-300';
  } else if (roleLower.includes('wait') || roleLower.includes('server')) {
    return 'bg-pink-100 text-pink-800 border-pink-300';
  } else {
    return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

/**
 * Get initials from a person's name
 */
export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};
