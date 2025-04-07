
import { useState, useEffect } from 'react';

export function useDateCalculations(currentMonthName: string, currentYear: number) {
  const [yesterdayDate, setYesterdayDate] = useState(new Date());
  const [daysInMonth, setDaysInMonth] = useState(0);
  const [dayOfMonth, setDayOfMonth] = useState(0);

  useEffect(() => {
    // Create yesterday's date with explicit UTC handling to avoid timezone issues
    const today = new Date();
    const yesterday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate() - 1));
    setYesterdayDate(yesterday);
    
    // Calculate month number from name (0-based)
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames.findIndex(name => name === currentMonthName);
    
    // Get days in month - ensure we use the actual month number (0-based index)
    const lastDay = new Date(Date.UTC(currentYear, month + 1, 0)).getDate();
    setDaysInMonth(lastDay);
    
    // Set day of month (capped at max days in month)
    setDayOfMonth(Math.min(yesterday.getDate(), lastDay));
  }, [currentMonthName, currentYear]);

  return {
    yesterdayDate,
    daysInMonth,
    dayOfMonth
  };
}
