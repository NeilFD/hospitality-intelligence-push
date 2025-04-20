
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Edit2, Save } from 'lucide-react';
import { supabase } from "@/lib/supabase";
import { formatCurrency } from '@/lib/utils';

type ForecastMethod = 'fixed' | 'discrete' | 'fixed_plus';

interface ForecastSettingsControlProps {
  itemName: string;
  budgetAmount: number;
  currentYear: number;
  currentMonth: number;
  onMethodChange: (method: ForecastMethod) => void;
}

export function ForecastSettingsControl({
  itemName,
  budgetAmount,
  currentYear,
  currentMonth,
  onMethodChange
}: ForecastSettingsControlProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedMethod, setSelectedMethod] = React.useState<ForecastMethod>('fixed');
  const [isEditing, setIsEditing] = React.useState(true);
  const [dailyValues, setDailyValues] = React.useState<Record<string, number>>({});
  
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const totalDailyValues = React.useMemo(() => {
    return Object.values(dailyValues).reduce((sum, value) => sum + (value || 0), 0);
  }, [dailyValues]);

  const getFinalTotal = () => {
    if (selectedMethod === 'fixed_plus') {
      return budgetAmount + totalDailyValues;
    }
    
    if (selectedMethod === 'discrete') {
      return totalDailyValues;
    }
    
    return budgetAmount;
  };

  React.useEffect(() => {
    const fetchCurrentSetting = async () => {
      // Try to get from localStorage first
      const cacheKey = `forecast_${itemName}_${currentYear}_${currentMonth}`;
      const cachedSettings = localStorage.getItem(cacheKey);
      
      if (cachedSettings) {
        try {
          console.log(`ForecastSettingsControl: Loading cached settings for ${itemName}:`, cachedSettings);
          const settings = JSON.parse(cachedSettings);
          setSelectedMethod(settings.method as ForecastMethod);
          setDailyValues(settings.discrete_values || {});
          setIsEditing(false);
          return;
        } catch (e) {
          console.error('Error parsing cached settings:', e);
        }
      }

      // If no cached settings, try to get from database
      const { data } = await supabase
        .from('cost_item_forecast_settings')
        .select('method, discrete_values')
        .eq('item_name', itemName)
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .single();

      if (data) {
        console.log(`ForecastSettingsControl: Loaded database settings for ${itemName}:`, data);
        setSelectedMethod(data.method as ForecastMethod);
        
        // Properly handle the discrete_values
        if (data.discrete_values) {
          // Ensure we're working with a proper Record<string, number>
          const parsedValues: Record<string, number> = {};
          const values = data.discrete_values as Record<string, any>;
          
          // Convert all values to numbers
          Object.keys(values).forEach(key => {
            const numValue = Number(values[key]);
            if (!isNaN(numValue)) {
              parsedValues[key] = numValue;
            }
          });
          
          setDailyValues(parsedValues);
        } else {
          setDailyValues({});
        }
        
        setIsEditing(false);
      }
    };

    fetchCurrentSetting();
  }, [itemName, currentYear, currentMonth]);

  const handleMethodChange = async (value: ForecastMethod) => {
    setSelectedMethod(value);
    if (value === 'fixed') {
      setDailyValues({});
    }
  };

  const handleSave = async () => {
    const finalTotal = getFinalTotal();
    
    console.log(`ForecastSettingsControl: Saving settings for ${itemName}:`, {
      method: selectedMethod,
      discreteValues: dailyValues,
      finalTotal
    });
    
    // Save to Supabase
    await supabase
      .from('cost_item_forecast_settings')
      .upsert({
        item_name: itemName,
        method: selectedMethod,
        year: currentYear,
        month: currentMonth,
        discrete_values: dailyValues
      });

    // Also save to localStorage for faster access
    const cacheKey = `forecast_${itemName}_${currentYear}_${currentMonth}`;
    const settingsToCache = {
      method: selectedMethod,
      discrete_values: dailyValues
    };
    localStorage.setItem(cacheKey, JSON.stringify(settingsToCache));

    setIsEditing(false);
    onMethodChange(selectedMethod);

    // Dispatch a custom event that PLReportTable can listen for
    const event = new CustomEvent('forecast-updated', {
      detail: { 
        itemName, 
        method: selectedMethod, 
        values: dailyValues,
        year: currentYear,
        month: currentMonth,
        finalTotal,
        // Include important additional information
        forecastAmount: finalTotal,
        budgetAmount
      }
    });
    
    console.log("Dispatching forecast-updated event", event.detail);
    window.dispatchEvent(event);
    
    // Close the dialog when save is complete
    setOpen(false);
  };

  const renderDailyInputs = () => {
    const days = getDaysInMonth(currentYear, currentMonth);
    const rows = [];

    for (let day = 1; day <= days; day++) {
      const date = new Date(currentYear, currentMonth - 1, day);
      const formattedDate = date.toLocaleDateString('en-GB', { 
        weekday: 'short', 
        day: 'numeric',
        month: 'short'
      });

      rows.push(
        <div key={day} className="grid grid-cols-2 gap-4 items-center mb-2">
          <Label className="text-sm">{formattedDate}</Label>
          <Input
            type="number"
            value={dailyValues[day.toString()] || ''}
            onChange={(e) => {
              const newValues = { ...dailyValues };
              newValues[day.toString()] = parseFloat(e.target.value) || 0;
              setDailyValues(newValues);
            }}
            disabled={!isEditing}
            placeholder="0.00"
            className="w-full"
          />
        </div>
      );
    }

    return (
      <div className="mt-4 max-h-[400px] overflow-y-auto">
        {selectedMethod === 'fixed_plus' && (
          <div className="mb-4 p-2 bg-slate-50 rounded-lg">
            <div className="font-semibold">Monthly Budget: {formatCurrency(budgetAmount)}</div>
          </div>
        )}
        {rows}
        <div className="mt-4 p-2 bg-slate-50 rounded-lg">
          <div className="font-semibold">
            {selectedMethod === 'fixed_plus' 
              ? `Total: ${formatCurrency(getFinalTotal())} (${formatCurrency(budgetAmount)} + ${formatCurrency(totalDailyValues)})`
              : `Total: ${formatCurrency(getFinalTotal())}`
            }
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm"
        className="h-6 w-6 p-0 ml-2"
        onClick={() => setOpen(true)}
      >
        <Edit2 className="h-3 w-3" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Forecast Settings - {itemName}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <RadioGroup
              value={selectedMethod}
              onValueChange={(value) => handleMethodChange(value as ForecastMethod)}
              className="space-y-3"
              disabled={!isEditing}
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed">Fixed (Use budget amount: {formatCurrency(budgetAmount)})</Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="discrete" id="discrete" />
                <Label htmlFor="discrete">Discrete (Set daily values)</Label>
              </div>
              
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="fixed_plus" id="fixed_plus" />
                <Label htmlFor="fixed_plus">Fixed+ (Budget + daily values)</Label>
              </div>
            </RadioGroup>

            {(selectedMethod === 'discrete' || selectedMethod === 'fixed_plus') && renderDailyInputs()}

            <div className="flex justify-end space-x-2 mt-4">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <Button onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
