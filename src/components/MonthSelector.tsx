
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getMonthName } from '@/lib/date-utils';
import { useStore } from '@/lib/store';

interface MonthSelectorProps {
  currentYear: number;
  currentMonth: number;
  onChangeMonth: (year: number, month: number) => void;
}

export default function MonthSelector({ 
  currentYear, 
  currentMonth, 
  onChangeMonth 
}: MonthSelectorProps) {
  const navigate = useNavigate();
  const [localYear, setLocalYear] = useState<number>(currentYear);
  
  const handlePreviousMonth = () => {
    let newMonth = currentMonth - 1;
    let newYear = currentYear;
    
    if (newMonth < 1) {
      newMonth = 12;
      newYear = currentYear - 1;
    }
    
    onChangeMonth(newYear, newMonth);
  };
  
  const handleNextMonth = () => {
    let newMonth = currentMonth + 1;
    let newYear = currentYear;
    
    if (newMonth > 12) {
      newMonth = 1;
      newYear = currentYear + 1;
    }
    
    onChangeMonth(newYear, newMonth);
  };
  
  const handleYearChange = (value: string) => {
    const year = parseInt(value);
    setLocalYear(year);
    onChangeMonth(year, currentMonth);
  };
  
  const handleMonthChange = (value: string) => {
    const month = parseInt(value);
    onChangeMonth(localYear, month);
  };
  
  return (
    <div className="flex items-center space-x-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePreviousMonth}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex space-x-2">
        <Select value={currentMonth.toString()} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-[110px]">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <SelectItem key={month} value={month.toString()}>
                {getMonthName(month)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={currentYear.toString()} onValueChange={handleYearChange}>
          <SelectTrigger className="w-[90px]">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {Array.from({ length: 10 }, (_, i) => currentYear - 2 + i).map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button
        variant="outline"
        size="icon"
        onClick={handleNextMonth}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
