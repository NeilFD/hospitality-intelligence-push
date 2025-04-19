
import React, { useState, useEffect, useRef } from 'react';
import { format, addDays, startOfMonth } from 'date-fns';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/date-utils';
import { CalendarDays, Loader2 } from 'lucide-react';
import { DayInput } from '../types/PLTrackerTypes';
import { fetchDailyValues, saveDailyValues } from '@/services/budget-service';
import { useToast } from '@/hooks/use-toast';

interface DailyInputDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dailyValues: DayInput[]) => void;
  initialValues: DayInput[];
  itemName: string;
  monthName: string;
  year: number;
  budgetItemId?: string;
}

export function DailyInputDrawer({
  isOpen,
  onClose,
  onSave,
  initialValues,
  itemName,
  monthName,
  year,
  budgetItemId
}: DailyInputDrawerProps) {
  const [dailyInputs, setDailyInputs] = useState<DayInput[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const initialLoadRef = useRef(false);
  
  // Load data only once when the drawer opens
  useEffect(() => {
    if (isOpen && !initialLoadRef.current) {
      const loadData = async () => {
        setIsLoading(true);
        
        const monthIndex = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(monthName);
        const firstDayOfMonth = startOfMonth(new Date(year, monthIndex));
        const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

        let days: DayInput[] = [];
        
        // If we have a budget item ID and it's a Supabase item, try to fetch stored values
        if (budgetItemId) {
          try {
            console.log("Fetching daily values for item:", budgetItemId, "month:", monthIndex + 1, "year:", year);
            const dbValues = await fetchDailyValues(budgetItemId, monthIndex + 1, year);
            console.log("Fetched daily values:", dbValues);
            
            // Create days array with loaded values
            for (let i = 0; i < daysInMonth; i++) {
              const currentDate = addDays(firstDayOfMonth, i);
              const dayOfMonth = currentDate.getDate();
              
              // Check if we have a stored value for this day
              const storedValue = dbValues.find(item => item.day === dayOfMonth);
              
              // Check if we have an in-memory initial value for this day
              const savedDay = initialValues.find(day => 
                day.date instanceof Date && 
                day.date.getDate() === currentDate.getDate() && 
                day.date.getMonth() === currentDate.getMonth()
              );
              
              // Priority: database value > in-memory value > null
              const value = storedValue !== undefined ? storedValue.value : (savedDay ? savedDay.value : null);
              
              days.push({
                date: currentDate,
                value: value
              });
            }
          } catch (error) {
            console.error("Error fetching daily values:", error);
            // Fallback to initialValues if fetch fails
            days = createDaysFromInitialValues(daysInMonth, firstDayOfMonth, initialValues);
          }
        } else {
          // If no budget item ID, just use in-memory values
          days = createDaysFromInitialValues(daysInMonth, firstDayOfMonth, initialValues);
        }
        
        setDailyInputs(days);

        const calculatedTotal = days.reduce((sum, day) => sum + (day.value || 0), 0);
        setTotal(calculatedTotal);
        
        setIsLoading(false);
        initialLoadRef.current = true;
      };

      loadData();
    }
    
    // Reset the flag when drawer is closed
    if (!isOpen) {
      initialLoadRef.current = false;
    }
  }, [isOpen, monthName, year, initialValues, budgetItemId]);

  const createDaysFromInitialValues = (daysInMonth: number, firstDayOfMonth: Date, initialValues: DayInput[]): DayInput[] => {
    const days: DayInput[] = [];
    for (let i = 0; i < daysInMonth; i++) {
      const currentDate = addDays(firstDayOfMonth, i);
      const savedDay = initialValues.find(day => 
        day.date instanceof Date && 
        day.date.getDate() === currentDate.getDate() && 
        day.date.getMonth() === currentDate.getMonth()
      );
      days.push({
        date: currentDate,
        value: savedDay ? savedDay.value : null
      });
    }
    return days;
  };

  const handleInputChange = (index: number, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    const updatedInputs = [...dailyInputs];
    updatedInputs[index].value = numValue;
    setDailyInputs(updatedInputs);

    const newTotal = updatedInputs.reduce((sum, day) => sum + (day.value || 0), 0);
    setTotal(newTotal);
  };

  const handleSave = async () => {
    if (budgetItemId) {
      setIsSaving(true);
      
      try {
        // Save to Supabase
        const monthIndex = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].indexOf(monthName);
        const success = await saveDailyValues(budgetItemId, dailyInputs, monthIndex + 1, year);
        
        if (success) {
          toast({
            title: "Success",
            description: "Daily values saved successfully",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to save values to database",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error saving daily values:", error);
        toast({
          title: "Error",
          description: "An unexpected error occurred",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    }
    
    // Also update in-memory state via callback
    onSave(dailyInputs);
  };

  // Early return for closed drawer to prevent unnecessary renders
  if (!isOpen) {
    return null;
  }

  return (
    <Drawer 
      open={isOpen} 
      modal={true}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DrawerContent 
        className="max-h-[90vh] pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <DrawerHeader>
          <div className="flex items-center">
            <CalendarDays className="mr-2 h-5 w-5 text-purple-600" />
            <DrawerTitle className="text-slate-900">{itemName} - Daily Inputs</DrawerTitle>
          </div>
        </DrawerHeader>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 text-purple-600 animate-spin" />
          </div>
        ) : (
          <div className="p-4 overflow-y-auto max-h-[calc(90vh-140px)] pointer-events-auto">
            <div className="flex flex-col gap-3">
              {dailyInputs.map((dayInput, index) => (
                <div 
                  key={index} 
                  className="grid grid-cols-[120px_1fr] gap-2 items-center"
                >
                  <div className="font-medium text-tavern-blue">
                    {format(dayInput.date, 'EEE, MMM d')}:
                  </div>
                  <Input 
                    type="number" 
                    value={dayInput.value !== null ? dayInput.value : ''} 
                    onChange={e => handleInputChange(index, e.target.value)} 
                    min="0" 
                    step="0.01" 
                    placeholder="0.00" 
                    className="w-full h-9 text-tavern-blue pointer-events-auto"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        <DrawerFooter className="border-t">
          <div className="flex justify-between items-center w-full mb-4">
            <div className="font-semibold text-lg text-tavern-blue">Total:</div>
            <div className="font-bold text-lg text-purple-700">{formatCurrency(total)}</div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              type="button"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              className="flex-1 bg-purple-600 hover:bg-purple-700"
              disabled={isSaving}
              type="button"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Values
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
