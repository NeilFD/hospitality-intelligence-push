
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

// Generate week dates for a given month
export function generateWeekDates(year: number, month: number): WeekDates[] {
  const firstDay = getFirstDayOfMonth(year, month);
  const lastDay = getLastDayOfMonth(year, month);
  
  // Find the first Monday of the week containing the 1st of the month
  const firstMonday = new Date(firstDay);
  const dayOfWeek = firstDay.getDay();
  // If not Monday (1), go back to previous Monday
  if (dayOfWeek !== 1) {
    firstMonday.setDate(firstMonday.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  }
  
  const weeks: WeekDates[] = [];
  let currentWeekStart = new Date(firstMonday);
  
  // Generate weeks until we pass the end of the month
  while (currentWeekStart <= lastDay) {
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekEnd.getDate() + 6); // Sunday
    
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
  const start = new Date(startDate);
  
  // Create 7 days (Monday to Sunday)
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = dayNames[date.getDay()];
    
    // Initialize empty purchases object with all suppliers set to 0
    const purchases: Record<string, number> = {};
    suppliers.forEach(supplier => {
      purchases[supplier.id] = 0;
    });
    
    days.push({
      date: formatDate(date),
      dayOfWeek,
      revenue: 0,
      purchases,
      creditNotes: [0, 0, 0], // Three empty credit note slots
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

// Calculate GP percentage
export function calculateGP(revenue: number, cost: number): number {
  if (revenue === 0) return 0;
  return 1 - (cost / revenue);
}

// Format currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
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
