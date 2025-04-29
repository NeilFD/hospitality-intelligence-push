
/**
 * Formats a time string from "HH:MM:SS" to "HH:MM"
 * @param timeString Time string in the format "HH:MM:SS" or "HH:MM"
 * @returns Formatted time in "HH:MM" format
 */
export const formatTime = (timeString: string): string => {
  if (!timeString) return '';
  
  // If timeString already has the right format, return it
  if (/^\d{1,2}:\d{2}$/.test(timeString)) {
    return timeString;
  }
  
  // Parse the time string from "HH:MM:SS" to "HH:MM"
  try {
    const parts = timeString.split(':');
    if (parts.length >= 2) {
      return `${parts[0]}:${parts[1]}`;
    }
    return timeString;
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString;
  }
};

/**
 * Formats a date object or string to "YYYY-MM-DD" format
 * @param date Date object or date string
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats a number as currency with $ symbol and 2 decimal places
 * @param amount Number to format as currency
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  if (amount === null || amount === undefined) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * Formats a number as percentage with % symbol
 * @param value Number to format as percentage
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number): string => {
  if (value === null || value === undefined) return '0%';
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value);
};

/**
 * Gets the month name from its number (1-12)
 * @param month Month number (1-12)
 * @returns Month name
 */
export const getMonthName = (month: number): string => {
  const monthNames = [
    'January', 'February', 'March', 'April', 
    'May', 'June', 'July', 'August', 
    'September', 'October', 'November', 'December'
  ];
  
  return monthNames[month - 1] || '';
};

/**
 * Gets the day name from its number (0-6, where 0 is Sunday)
 * @param dayNumber Day number (0-6)
 * @returns Day name
 */
export const getDayNameFromNumber = (dayNumber: number): string => {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return dayNames[dayNumber] || '';
};

/**
 * Calculate Gross Profit (GP) percentage
 * @param revenue Total revenue
 * @param cost Total cost
 * @returns GP percentage as a decimal (e.g., 0.7 for 70%)
 */
export const calculateGP = (revenue: number, cost: number): number => {
  if (revenue === 0) return 0;
  const grossProfit = revenue - cost;
  return grossProfit / revenue;
};

/**
 * Generate array of week date ranges for a given month
 * @param year Year
 * @param month Month (1-12)
 * @returns Array of date ranges for each week in the month
 */
export interface WeekDateRange {
  startDate: string;
  endDate: string;
}

export const generateWeekDates = (year: number, month: number): WeekDateRange[] => {
  const weeks: WeekDateRange[] = [];
  
  // Create date object for the first day of the month
  const firstDay = new Date(year, month - 1, 1);
  
  // Create date object for the last day of the month
  const lastDay = new Date(year, month, 0);
  
  // Start from the first day of the month
  let currentDate = new Date(firstDay);
  
  // Adjust to start from Monday if not already
  const dayOfWeek = currentDate.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday (0), go back to previous Monday (-6)
  currentDate.setDate(currentDate.getDate() + diff);
  
  // Loop through all weeks that contain days in the target month
  while (currentDate <= lastDay || (currentDate.getDay() !== 1 && currentDate.getDay() !== 0)) {
    const weekStart = new Date(currentDate);
    
    // Move to the end of the week (Sunday)
    currentDate.setDate(currentDate.getDate() + 6);
    const weekEnd = new Date(currentDate);
    
    // Add the week range
    weeks.push({
      startDate: formatDate(weekStart),
      endDate: formatDate(weekEnd)
    });
    
    // Move to next Monday
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return weeks;
};

/**
 * Creates an empty week record for a module type
 * @param startDate Week start date
 * @param endDate Week end date
 * @param weekNumber Week number in the month
 * @param suppliers List of suppliers
 * @returns Empty weekly record
 */
export const createEmptyWeek = (
  startDate: string, 
  endDate: string, 
  weekNumber: number,
  suppliers: any[]
): any => {
  const days = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Add days between start and end dates inclusive
  const currentDay = new Date(start);
  while (currentDay <= end) {
    const dayOfWeek = currentDay.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Create empty purchase records for each supplier
    const purchases: Record<string, number> = {};
    suppliers.forEach(supplier => {
      purchases[supplier.id] = 0;
    });
    
    days.push({
      date: formatDate(currentDay),
      dayOfWeek,
      revenue: 0,
      purchases,
      creditNotes: [],
      staffFoodAllowance: 0
    });
    
    // Move to next day
    currentDay.setDate(currentDay.getDate() + 1);
  }
  
  return {
    id: `week-${weekNumber}-${startDate}`,
    weekNumber,
    startDate,
    endDate,
    days
  };
};
