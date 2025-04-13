
import { WeekDates, WeeklyRecord, DailyRecord, Supplier } from '@/types/kitchen-ledger';
import { v4 as uuidv4 } from 'uuid';

// Get the first day of the month
export function getFirstDayOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1));
}

// Get the last day of the month
export function getLastDayOfMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 0));
}

// Format date as YYYY-MM-DD
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Format date as DD/MM for display - showing the actual day and month the date belongs to
export function formatDateForDisplay(date: Date): string {
  // Create a new date object with UTC handling to avoid timezone shifts
  const day = date.getDate();
  const month = date.getMonth() + 1; // JavaScript months are 0-based
  
  // Format as DD/MM
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`;
}

// Get day name from date string
export function getDayName(dateStr: string): string {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  // Make sure we have a valid date string format, and handle timezone issues
  const date = new Date(`${dateStr}T12:00:00Z`);
  // JavaScript's getDay() returns 0 for Sunday, 1 for Monday, etc.
  // We need to convert to our format where 0 is Monday, 1 is Tuesday, etc.
  const jsDay = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const adjustedDay = jsDay === 0 ? 6 : jsDay - 1; // Convert to 0 = Monday, ..., 6 = Sunday
  return dayNames[adjustedDay];
}

// Generate week dates for a given month
export function generateWeekDates(year: number, month: number): WeekDates[] {
  // Get the first and last day of the month
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0));
  
  // Calculate the Monday that starts the week containing the first day of the month
  let firstMonday = new Date(firstDay);
  const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // If the month doesn't start on Monday (day 1), go back to the previous Monday
  if (firstDayOfWeek !== 1) {
    // If it's Sunday (0), go back 6 days, otherwise go back (dayOfWeek - 1) days
    const daysToSubtract = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    firstMonday.setUTCDate(firstDay.getUTCDate() - daysToSubtract);
  }
  
  const weeks: WeekDates[] = [];
  let currentWeekStart = new Date(firstMonday);
  
  // Generate weeks until we pass the end of the month
  while (true) {
    // Create a fresh copy of the current week start date to avoid reference issues
    const weekStartCopy = new Date(currentWeekStart);
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setUTCDate(currentWeekEnd.getUTCDate() + 6); // Sunday (6 days after Monday)
    
    // Add this week to our collection
    weeks.push({
      startDate: formatDate(weekStartCopy),
      endDate: formatDate(currentWeekEnd),
    });
    
    // Move to next Monday
    currentWeekStart = new Date(currentWeekEnd);
    currentWeekStart.setUTCDate(currentWeekStart.getUTCDate() + 1);
    
    // If the next week's start date is past the end of the month, stop
    if (currentWeekStart > lastDay) {
      break;
    }
    
    // Safety check: prevent infinite loops by limiting to 6 weeks
    if (weeks.length >= 6) {
      break;
    }
  }
  
  return weeks;
}

// Create an empty week with daily records, starting from Monday
export function createEmptyWeek(
  startDate: string, 
  endDate: string, 
  weekNumber: number,
  suppliers: Supplier[]
): WeeklyRecord {
  const days: DailyRecord[] = [];
  
  // Create a date object from the start date (Monday)
  const startDateObj = new Date(`${startDate}T12:00:00Z`);
  
  // Create an array of day names with Monday first
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Loop through the 7 days of the week (from Monday to Sunday)
  for (let i = 0; i < 7; i++) {
    // Clone the date for each day to avoid modifying the original
    const currentDate = new Date(startDateObj);
    currentDate.setUTCDate(startDateObj.getUTCDate() + i);
    
    // Format the date as YYYY-MM-DD string
    const dateString = formatDate(currentDate);
    
    // Each day is sequential from Monday (i=0) to Sunday (i=6)
    const dayName = dayNames[i];

    const purchases: Record<string, number> = {};
    suppliers.forEach(supplier => {
      purchases[supplier.id] = 0;
    });

    days.push({
      date: dateString,
      dayOfWeek: dayName,
      revenue: 0,
      purchases,
      creditNotes: [0, 0, 0],
      staffFoodAllowance: 0,
    });
  }

  return {
    id: uuidv4(),
    weekNumber,
    startDate,
    endDate,
    days,
  };
}

// Get day of week (0-6, where 0 is Monday and 6 is Sunday)
export function getDayOfWeek(date: Date): number {
  // JavaScript's getDay returns 0 for Sunday, 1 for Monday, etc.
  // We want 0 for Monday, 1 for Tuesday, ..., 6 for Sunday
  const jsDay = date.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

// Get day name from day number (0-6, where 0 is Monday)
export function getDayNameFromNumber(dayNumber: number): string {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return dayNames[dayNumber];
}

// Calculate GP percentage
export function calculateGP(revenue: number, cost: number): number {
  if (revenue === 0) return 0;
  return 1 - (cost / revenue);
}

// Format currency with zero decimal places
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format percentage
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value);
}

// Get month name from month number
export function getMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1];
}
