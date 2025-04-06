
import { useState, useEffect } from 'react';

export function useDateCalculations(currentMonthName: string, currentYear: number) {
  const [yesterdayDate, setYesterdayDate] = useState(new Date());
  const [daysInMonth, setDaysInMonth] = useState(0);
  const [dayOfMonth, setDayOfMonth] = useState(0);

  useEffect(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    setYesterdayDate(yesterday);
    
    const year = currentYear;
    const month = new Date(`${currentMonthName} 1, ${currentYear}`).getMonth();
    
    const lastDay = new Date(year, month + 1, 0).getDate();
    setDaysInMonth(lastDay);
    
    setDayOfMonth(Math.min(yesterday.getDate(), lastDay));
  }, [currentMonthName, currentYear]);

  return {
    yesterdayDate,
    daysInMonth,
    dayOfMonth
  };
}
