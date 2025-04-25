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
    
    // Set day of month based on yesterday's date if we're in current month,
    // otherwise use the last day of the selected month
    const isCurrentMonth = today.getFullYear() === currentYear && 
                         today.getMonth() === month;
                         
    console.log('Date calculations:', {
      currentYear,
      currentMonthName,
      isCurrentMonth,
      yesterdayDate: yesterday.getDate(),
      daysInMonth: lastDay
    });
    
    if (isCurrentMonth) {
      // Use yesterday's date for current month
      setDayOfMonth(yesterday.getDate());
    } else {
      // For past or future months, use the last day of that month
      setDayOfMonth(lastDay);
    }
  }, [currentMonthName, currentYear]);

  return {
    yesterdayDate,
    daysInMonth,
    dayOfMonth
  };
}
