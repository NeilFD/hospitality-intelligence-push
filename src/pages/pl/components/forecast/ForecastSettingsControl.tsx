
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Edit2, Save } from 'lucide-react';
import { supabase } from "@/lib/supabase";
import { formatCurrency } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

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

  // For tooltip display: resolve setting from cache or server
  const [tooltipMethod, setTooltipMethod] = React.useState<ForecastMethod>('fixed');
  const [tooltipTotal, setTooltipTotal] = React.useState<number>(budgetAmount);
  const [tooltipDaily, setTooltipDaily] = React.useState<number>(0);

  React.useEffect(() => {
    const fetchCurrentSetting = async () => {
      const cacheKey = `forecast_${itemName}_${currentYear}_${currentMonth}`;
      const cachedSettings = localStorage.getItem(cacheKey);
      let method: ForecastMethod = 'fixed';
      let dvals: Record<string, number> = {};

      if (cachedSettings) {
        try {
          const settings = JSON.parse(cachedSettings);
          setSelectedMethod(settings.method as ForecastMethod);
          setTooltipMethod(settings.method as ForecastMethod);
          setDailyValues(settings.discrete_values || {});
          dvals = settings.discrete_values || {};
          method = settings.method as ForecastMethod;
          setIsEditing(false);
        } catch (e) {}
      } else {
        const { data } = await supabase
          .from('cost_item_forecast_settings')
          .select('method, discrete_values')
          .eq('item_name', itemName)
          .eq('year', currentYear)
          .eq('month', currentMonth)
          .single();

        if (data) {
          setSelectedMethod(data.method as ForecastMethod);
          setTooltipMethod(data.method as ForecastMethod);
          method = data.method as ForecastMethod;
          if (data.discrete_values) {
            const parsedValues: Record<string, number> = {};
            const values = data.discrete_values as Record<string, any>;
            Object.keys(values).forEach(key => {
              const numValue = Number(values[key]);
              if (!isNaN(numValue)) {
                parsedValues[key] = numValue;
              }
            });
            setDailyValues(parsedValues);
            dvals = parsedValues;
          } else {
            setDailyValues({});
            dvals = {};
          }
          setIsEditing(false);
        }
      }

      // Always update tooltip preview
      let dailySum = Object.values(dvals).reduce((sum, v) => sum + (v || 0), 0);
      setTooltipDaily(dailySum);
      if (method === 'fixed') setTooltipTotal(budgetAmount);
      else if (method === 'discrete') setTooltipTotal(dailySum);
      else if (method === 'fixed_plus') setTooltipTotal(budgetAmount + dailySum);
    };
    fetchCurrentSetting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemName, currentYear, currentMonth, budgetAmount]);

  const handleMethodChange = async (value: ForecastMethod) => {
    setSelectedMethod(value);
    if (value === 'fixed') {
      setDailyValues({});
    }
  };

  const handleSave = async () => {
    const finalTotal = getFinalTotal();
    await supabase
      .from('cost_item_forecast_settings')
      .upsert({
        item_name: itemName,
        method: selectedMethod,
        year: currentYear,
        month: currentMonth,
        discrete_values: dailyValues
      });
    const cacheKey = `forecast_${itemName}_${currentYear}_${currentMonth}`;
    const settingsToCache = {
      method: selectedMethod,
      discrete_values: dailyValues
    };
    localStorage.setItem(cacheKey, JSON.stringify(settingsToCache));
    setIsEditing(false);
    onMethodChange(selectedMethod);
    const event = new CustomEvent('forecast-updated', {
      detail: { 
        itemName, 
        method: selectedMethod, 
        values: dailyValues,
        year: currentYear,
        month: currentMonth,
        finalTotal,
        forecastAmount: finalTotal,
        budgetAmount
      }
    });
    window.dispatchEvent(event);
    setOpen(false);

    // Also update tooltip state immediately after save
    let dailySum = Object.values(dailyValues).reduce((sum, v) => sum + (v || 0), 0);
    setTooltipMethod(selectedMethod);
    setTooltipDaily(dailySum);
    if (selectedMethod === 'fixed') setTooltipTotal(budgetAmount);
    else if (selectedMethod === 'discrete') setTooltipTotal(dailySum);
    else if (selectedMethod === 'fixed_plus') setTooltipTotal(budgetAmount + dailySum);
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

  // Tooltip content builder
  const getTooltipContent = () => {
    if (tooltipMethod === 'fixed') {
      return (
        <div>
          <div className="font-semibold">Method: Budget</div>
          <div>Budget: {formatCurrency(budgetAmount)}</div>
        </div>
      );
    }
    if (tooltipMethod === 'discrete') {
      return (
        <div>
          <div className="font-semibold">Method: Discrete</div>
          <div>Discrete Total: {formatCurrency(tooltipDaily)}</div>
        </div>
      );
    }
    if (tooltipMethod === 'fixed_plus') {
      return (
        <div>
          <div className="font-semibold">Method: Fixed+</div>
          <div>Fixed+ Total ({formatCurrency(budgetAmount)} + {formatCurrency(tooltipDaily)})</div>
        </div>
      );
    }
    return null;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-6 w-6 p-0 ml-2"
            onClick={() => setOpen(true)}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {getTooltipContent()}
        </TooltipContent>
      </Tooltip>

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
    </TooltipProvider>
  );
}
