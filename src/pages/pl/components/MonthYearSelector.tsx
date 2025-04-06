
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MonthYearSelectorProps {
  currentMonth: number;
  currentYear: number;
  currentMonthName: string;
  onMonthChange: (value: string) => void;
  onYearChange: (value: string) => void;
}

export function MonthYearSelector({ 
  currentMonth, 
  currentYear, 
  currentMonthName,
  onMonthChange, 
  onYearChange 
}: MonthYearSelectorProps) {
  return (
    <div className="flex gap-4">
      <Select 
        value={currentMonth.toString()} 
        onValueChange={onMonthChange}
      >
        <SelectTrigger className="w-[180px] border-[#48495e]">
          <SelectValue>{currentMonthName}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="1">January</SelectItem>
          <SelectItem value="2">February</SelectItem>
          <SelectItem value="3">March</SelectItem>
          <SelectItem value="4" className="text-[#48495e]">April</SelectItem>
          <SelectItem value="5">May</SelectItem>
          <SelectItem value="6">June</SelectItem>
          <SelectItem value="7">July</SelectItem>
          <SelectItem value="8">August</SelectItem>
          <SelectItem value="9">September</SelectItem>
          <SelectItem value="10">October</SelectItem>
          <SelectItem value="11">November</SelectItem>
          <SelectItem value="12">December</SelectItem>
        </SelectContent>
      </Select>
      
      <Select 
        value={currentYear.toString()} 
        onValueChange={onYearChange}
      >
        <SelectTrigger className="w-[120px] border-[#48495e]">
          <SelectValue>{currentYear}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="2024">2024</SelectItem>
          <SelectItem value="2025">2025</SelectItem>
          <SelectItem value="2026">2026</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
