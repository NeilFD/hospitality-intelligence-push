
import { WeekDates, WeeklyRecord, DailyRecord, Supplier } from '@/types/kitchen-ledger';
import { v4 as uuidv4 } from 'uuid';

// Get the first day of the month
export function getFirstDayOfMonth(year: number, month: number): Date {
  return new Date(year, month - 1, 1);
}

// Get the last day of the month
export function getLastDayOfMonth(year: number, month: number): Date {
  return new Date(year, month, 0);
}

// Format date as YYYY-MM-DD
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Format date as DD/MM for display - showing the actual month the date belongs to
export function formatDateForDisplay(date: Date): string {
  // Create a new Date object to avoid timezone issues and ensure we're using local date
  const day = date.getDate();
  const month = date.getMonth() + 1; // JavaScript months are 0-based
  return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`;
}

// Get day name from date string (corrected version that uses the actual date)
export function getDayName(dateStr: string): string {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  // Make sure we have a valid date string format, and handle timezone issues
  const date = new Date(`${dateStr}T00:00:00`);
  return dayNames[date.getDay()];
}

// Generate week dates for a given month
export function generateWeekDates(year: number, month: number): WeekDates[] {
  const firstDay = getFirstDayOfMonth(year, month);
  const lastDay = getLastDayOfMonth(year, month);
  
  // Calculate the Monday that starts the week containing the first day of the month
  let firstMonday = new Date(firstDay);
  const dayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // If not Monday (1), go back to the previous Monday
  if (dayOfWeek !== 1) {
    // If Sunday (0), go back 6 days, otherwise go back (dayOfWeek - 1) days
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    firstMonday.setDate(firstDay.getDate() - daysToSubtract);
  }
  
  const weeks: WeekDates[] = [];
  let currentWeekStart = new Date(firstMonday);
  
  // Generate weeks until we pass the end of the month
  while (currentWeekStart <= lastDay) {
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 6); // Sunday (6 days after Monday)
    
    weeks.push({
      startDate: formatDate(currentWeekStart),
      endDate: formatDate(currentWeekEnd),
    });
    
    // Move to next Monday
    currentWeekStart = new Date(currentWeekEnd);
    currentWeekStart.setDate(currentWeekStart.getDate() + 1);
  }
  
  return weeks;
}

// Create an empty week with daily records
export function createEmptyWeek(
  startDate: string, 
  endDate: string, 
  weekNumber: number,
  suppliers: Supplier[]
): WeeklyRecord {
  const days: DailyRecord[] = [];
  // Parse the start date string to a Date object
  const start = new Date(`${startDate}T00:00:00`);

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(start.getTime()); // avoid mutation
    currentDate.setDate(currentDate.getDate() + i); // correct date addition

    // Format the date string correctly for the day
    const dateString = formatDate(currentDate);
    // Get day name directly from the currentDate object to ensure accuracy
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDate.getDay()];

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

// Get day name from day number
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
