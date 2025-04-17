
import { format } from 'date-fns';

/**
 * Formats a date with the day of week included
 * Example: "Wednesday, 16 Apr 2025"
 */
export function formatDateWithDayOfWeek(date: Date): string {
  return format(date, "EEEE, d MMM yyyy");
}

/**
 * Formats a date for display in the dashboard header
 * Example: "Wed, 16 Apr 2025"
 */
export function formatDashboardDate(date: Date): string {
  return format(date, "EEE, d MMM yyyy");
}
