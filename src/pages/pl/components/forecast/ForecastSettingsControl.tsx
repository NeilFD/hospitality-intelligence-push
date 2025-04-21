
import React, { useState } from 'react';
import { ChevronsUpDown, Edit, Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/lib/supabase';
import { toast } from "sonner";
import { calculateForecastFromSettings } from '../tracker/TrackerCalculations';

interface ForecastSettingsControlProps {
  itemName: string;
  year: number;
  month: number;
  budgetAmount: number;
  actualAmount?: number;
  forecaseMode?: string;
  discreteValues?: Record<string, number>;
  onForecastUpdated: (settings: any) => void;
}

export function ForecastSettingsControl({
  itemName,
  year,
  month,
  budgetAmount = 0,
  actualAmount = 0,
  forecaseMode = 'fixed',
  discreteValues = {},
  onForecastUpdated
}: ForecastSettingsControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedForecastMethod, setSelectedForecastMethod] = useState<string>(forecaseMode);
  const [selectedDiscreteValues, setSelectedDiscreteValues] = useState<Record<string, number>>(discreteValues || {});
  
  const forecastMethods = [
    { value: 'fixed', label: 'Budget' },
    { value: 'discrete', label: 'Discrete Total' },
    { value: 'fixed_plus', label: 'Fixed+' }
  ];
  
  // Calculate forecast amount based on selected method and values
  const calculateForecast = () => {
    const settings = {
      method: selectedForecastMethod,
      discrete_values: selectedDiscreteValues
    };
    
    return calculateForecastFromSettings(settings, budgetAmount, actualAmount);
  };
  
  // Get tooltip text based on forecast method
  const getTooltipText = () => {
    const forecast = calculateForecast();
    
    switch(selectedForecastMethod) {
      case 'fixed':
        return `Budget: £${budgetAmount.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      case 'discrete': {
        let total = 0;
        Object.values(selectedDiscreteValues).forEach(value => {
          if (typeof value === 'number') total += value;
        });
        return `Discrete Total: £${forecast.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      }
      case 'fixed_plus': {
        let additionalTotal = 0;
        Object.values(selectedDiscreteValues).forEach(value => {
          if (typeof value === 'number') additionalTotal += value;
        });
        return `Fixed+ Total (£${budgetAmount.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} + £${additionalTotal.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })})`;
      }
      default:
        return 'No forecast method selected';
    }
  };
  
  const saveForecastSettings = async () => {
    try {
      // First check if there's an existing setting
      const { data: existingSettings } = await supabase
        .from('cost_item_forecast_settings')
        .select('*')
        .eq('item_name', itemName)
        .eq('year', year)
        .eq('month', month);
      
      const settings = {
        method: selectedForecastMethod,
        discrete_values: selectedDiscreteValues || {}
      };
      
      // Store the forecast settings
      if (existingSettings && existingSettings.length > 0) {
        // Update existing
        await supabase
          .from('cost_item_forecast_settings')
          .update({
            method: selectedForecastMethod,
            discrete_values: selectedDiscreteValues || {}
          })
          .eq('item_name', itemName)
          .eq('year', year)
          .eq('month', month);
      } else {
        // Insert new
        await supabase
          .from('cost_item_forecast_settings')
          .insert({
            item_name: itemName,
            year,
            month,
            method: selectedForecastMethod,
            discrete_values: selectedDiscreteValues || {}
          });
      }
      
      // Also cache in localStorage for faster retrieval
      const cacheKey = `forecast_${itemName}_${year}_${month}`;
      localStorage.setItem(cacheKey, JSON.stringify(settings));
      
      // Trigger event to notify changes
      const event = new CustomEvent('forecast-updated', {
        detail: {
          itemName,
          settings,
          forecastAmount: calculateForecast()
        }
      });
      window.dispatchEvent(event);
      
      if (onForecastUpdated) {
        onForecastUpdated(settings);
      }
      
      toast.success("Forecast settings saved");
      setIsOpen(false);
      
    } catch (error) {
      console.error("Error saving forecast settings:", error);
      toast.error("Failed to save forecast settings");
    }
  };
  
  return (
    <div className="flex items-center justify-end gap-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="h-6 w-6 p-0 rounded-full" 
                  onClick={() => setIsOpen(true)}
                >
                  <Edit className="h-3.5 w-3.5 text-gray-500" />
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent className="bg-white p-2 text-sm shadow-md rounded-md border border-gray-200">
              {getTooltipText()}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <PopoverContent className="w-96 p-0" align="end">
          <Command>
            <CommandInput placeholder="Select forecast method..." />
            <CommandEmpty>No forecast method found.</CommandEmpty>
            <CommandGroup>
              {forecastMethods.map((method) => (
                <CommandItem
                  key={method.value}
                  value={method.value}
                  onSelect={(currentValue) => {
                    setSelectedForecastMethod(currentValue);
                  }}
                  className={`flex items-center justify-between ${selectedForecastMethod === method.value ? 'bg-slate-100' : ''}`}
                >
                  <div className="flex items-center gap-2">
                    <span>{method.label}</span>
                  </div>
                  {selectedForecastMethod === method.value && (
                    <span className="text-xs bg-primary/20 text-primary rounded-sm px-1.5 py-0.5">Selected</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
          
          {/* Additional controls for discrete and fixed+ methods */}
          {(selectedForecastMethod === 'discrete' || selectedForecastMethod === 'fixed_plus') && (
            <div className="p-4 border-t">
              <h3 className="text-sm font-semibold mb-2">
                {selectedForecastMethod === 'discrete' ? 'Enter Discrete Values' : 'Enter Additional Values'}
              </h3>
              <div className="space-y-2">
                {['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'].map((week, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <label className="text-xs w-12">{week}:</label>
                    <input
                      type="number"
                      className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedDiscreteValues[`week${index + 1}`] || ''}
                      onChange={(e) => {
                        const value = e.target.value ? parseFloat(e.target.value) : 0;
                        setSelectedDiscreteValues({
                          ...selectedDiscreteValues,
                          [`week${index + 1}`]: value
                        });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-end p-4 border-t">
            <Button 
              size="sm" 
              onClick={saveForecastSettings}
            >
              Save
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
