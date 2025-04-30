
// Utility functions for the StaffRankingPanel component

export const getInitials = (firstName: string, lastName: string) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

export const formatHiScore = (score: number) => {
  if (score === 0 || !score) return 'N/A';
  return score.toFixed(1);
};

export const getRoleColor = (role: string) => {
  switch (role?.toLowerCase()) {
    case 'owner':
      return 'bg-purple-100 text-purple-800';
    case 'manager':
      return 'bg-blue-100 text-blue-800';
    case 'team member':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// New utility functions for revenue bands
export const getDefaultRevenueBands = () => {
  return [
    {
      name: 'Very Low Revenue',
      revenue_min: 0,
      revenue_max: 500,
      foh_min_staff: 1,
      foh_max_staff: 2,
      kitchen_min_staff: 1,
      kitchen_max_staff: 2,
      kp_min_staff: 0,
      kp_max_staff: 0,
      target_cost_percentage: 30
    },
    {
      name: 'Low Revenue',
      revenue_min: 501,
      revenue_max: 1000,
      foh_min_staff: 2,
      foh_max_staff: 2,
      kitchen_min_staff: 1,
      kitchen_max_staff: 2,
      kp_min_staff: 0,
      kp_max_staff: 1,
      target_cost_percentage: 28
    },
    {
      name: 'Medium Revenue',
      revenue_min: 1001,
      revenue_max: 1500,
      foh_min_staff: 2,
      foh_max_staff: 3,
      kitchen_min_staff: 1,
      kitchen_max_staff: 2,
      kp_min_staff: 0,
      kp_max_staff: 1,
      target_cost_percentage: 26
    },
    {
      name: 'Medium-High Revenue',
      revenue_min: 1501,
      revenue_max: 2000,
      foh_min_staff: 3,
      foh_max_staff: 4,
      kitchen_min_staff: 2,
      kitchen_max_staff: 3,
      kp_min_staff: 0,
      kp_max_staff: 1,
      target_cost_percentage: 25
    },
    {
      name: 'High Revenue',
      revenue_min: 2001,
      revenue_max: 3000,
      foh_min_staff: 3,
      foh_max_staff: 4,
      kitchen_min_staff: 3,
      kitchen_max_staff: 4,
      kp_min_staff: 0,
      kp_max_staff: 1,
      target_cost_percentage: 24
    },
    {
      name: 'Very High Revenue',
      revenue_min: 3001,
      revenue_max: 4000,
      foh_min_staff: 4,
      foh_max_staff: 5,
      kitchen_min_staff: 3,
      kitchen_max_staff: 4,
      kp_min_staff: 1,
      kp_max_staff: 1,
      target_cost_percentage: 22
    },
    {
      name: 'Peak Revenue',
      revenue_min: 4001,
      revenue_max: 10000,
      foh_min_staff: 5,
      foh_max_staff: 7,
      kitchen_min_staff: 3,
      kitchen_max_staff: 4,
      kp_min_staff: 1,
      kp_max_staff: 1,
      target_cost_percentage: 20
    }
  ];
};

export const formatRevenueBand = (min: number, max: number) => {
  return `£${min} to £${max}`;
};

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
