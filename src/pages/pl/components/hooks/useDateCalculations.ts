
import { useState, useEffect } from 'react';

export function useDateCalculations(currentMonthName: string, currentYear: number) {
  const [yesterdayDate, setYesterdayDate] = useState(new Date());
  const [daysInMonth, setDaysInMonth] = useState(0);
  const [dayOfMonth, setDayOfMonth] = useState(0);

  useEffect(() => {
    // Create yesterday's date
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    setYesterdayDate(yesterday);
    
    // Calculate month number from name (0-based)
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames.findIndex(name => name === currentMonthName);
    
    // Get days in month
    const lastDay = new Date(currentYear, month + 1, 0).getDate();
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
