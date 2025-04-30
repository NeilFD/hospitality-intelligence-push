
/**
 * Utility functions for the StaffRankingPanel component
 */

/**
 * Formats a Hi Score value for display
 */
export const formatHiScore = (score: number): string => {
  if (score === 0) return 'N/A';
  return score.toFixed(1);
};

/**
 * Gets CSS classes for role badges based on role name
 */
export const getRoleColor = (role: string): string => {
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

/**
 * Extracts user initials from first and last name
 */
export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

/**
 * Calculates employer costs for an hourly employee
 */
export const calculateEmployerCosts = (wageRate: number) => {
  const niContribution = wageRate > 175/40 ? (wageRate - 175/40) * 0.138 : 0; // Simplified NI calculation
  const pensionContribution = wageRate * 0.03; // 3% employer pension
  const totalCostPerHour = wageRate + niContribution + pensionContribution;
  
  return {
    wageRate,
    niContribution,
    pensionContribution,
    totalCostPerHour
  };
};
