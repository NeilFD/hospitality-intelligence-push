
/**
 * Finance calculation utility functions
 */

/**
 * Calculate gross profit percentage from revenue and costs
 * @param revenue - The revenue amount
 * @param costs - The costs amount
 * @returns Gross profit percentage (0-100)
 */
export const calculateGrossProfit = (revenue: number, costs: number): number => {
  if (!revenue || revenue === 0) return 0;
  // Return the percentage directly, not multiplied by 100
  return ((revenue - costs) / revenue);
};

/**
 * Format a number as currency (GBP)
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number | undefined): string => {
  if (amount === undefined || amount === null) return '£0';
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Calculate weekly GP values from costs and revenue data
 * @param weeklyRevenue - Array of weekly revenue data
 * @param weeklyCosts - Array of weekly cost data
 * @returns Array of weekly GP percentages
 */
export const calculateWeeklyGP = (
  weeklyRevenue: number[],
  weeklyCosts: number[]
): number[] => {
  return weeklyRevenue.map((revenue, index) => {
    const costs = weeklyCosts[index] || 0;
    return calculateGrossProfit(revenue, costs);
  });
};
