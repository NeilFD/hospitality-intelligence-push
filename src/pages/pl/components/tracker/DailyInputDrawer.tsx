
import React, { useState, useEffect } from 'react';
import { format, addDays, startOfMonth } from 'date-fns';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/date-utils';
import { CalendarDays } from 'lucide-react';
import { DayInput } from '../types/PLTrackerTypes';

interface DailyInputDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dailyValues: DayInput[]) => void;
  initialValues: DayInput[];
  itemName: string;
  monthName: string;
  year: number;
}

export function DailyInputDrawer({
  isOpen,
  onClose,
  onSave,
  initialValues,
  itemName,
  monthName,
  year
}: DailyInputDrawerProps) {
  const [dailyInputs, setDailyInputs] = useState<DayInput[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const monthIndex = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(monthName);
      const firstDayOfMonth = startOfMonth(new Date(year, monthIndex));
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

      let days: DayInput[] = [];
      for (let i = 0; i < daysInMonth; i++) {
        const currentDate = addDays(firstDayOfMonth, i);

        const savedDay = initialValues.find(day => day.date.getDate() === currentDate.getDate() && day.date.getMonth() === currentDate.getMonth());
        days.push({
          date: currentDate,
          value: savedDay ? savedDay.value : null
        });
      }
      setDailyInputs(days);

      const calculatedTotal = days.reduce((sum, day) => sum + (day.value || 0), 0);
      setTotal(calculatedTotal);
    }
  }, [isOpen, monthName, year, initialValues]);

  const handleInputChange = (index: number, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    const updatedInputs = [...dailyInputs];
    updatedInputs[index].value = numValue;
    setDailyInputs(updatedInputs);

    const newTotal = updatedInputs.reduce((sum, day) => sum + (day.value || 0), 0);
    setTotal(newTotal);
  };

  const handleSave = () => {
    onSave(dailyInputs);
    onClose();
  };

  return <Drawer open={isOpen} onOpenChange={isOpen => !isOpen && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <div className="flex items-center">
            <CalendarDays className="mr-2 h-5 w-5 text-purple-600" />
            <DrawerTitle className="text-slate-900">{itemName} - Daily Inputs</DrawerTitle>
          </div>
        </DrawerHeader>
        
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="flex flex-col gap-3">
            {dailyInputs.map((dayInput, index) => <div key={index} className="grid grid-cols-[120px_1fr] gap-2 items-center">
                <div className="font-medium">
                  {format(dayInput.date, 'EEE, MMM d')}:
                </div>
                <Input 
                  type="number" 
                  value={dayInput.value !== null ? dayInput.value : ''} 
                  onChange={e => handleInputChange(index, e.target.value)} 
                  min="0" 
                  step="0.01" 
                  placeholder="0.00" 
                  className="w-full h-9 text-tavern-blue" 
                />
              </div>)}
          </div>
        </div>
        
        <DrawerFooter className="border-t">
          <div className="flex justify-between items-center w-full mb-4">
            <div className="font-semibold text-lg">Total:</div>
            <div className="font-bold text-lg text-purple-700">{formatCurrency(total)}</div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} className="flex-1 bg-purple-600 hover:bg-purple-700">Save Values</Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>;
}
