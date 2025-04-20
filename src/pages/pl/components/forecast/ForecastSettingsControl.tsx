
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Pencil } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

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

  React.useEffect(() => {
    const fetchCurrentSetting = async () => {
      const { data } = await supabase
        .from('cost_item_forecast_settings')
        .select('method')
        .eq('item_name', itemName)
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .single();

      if (data) {
        setSelectedMethod(data.method as ForecastMethod);
      }
    };

    fetchCurrentSetting();
  }, [itemName, currentYear, currentMonth]);

  const handleMethodChange = async (value: ForecastMethod) => {
    setSelectedMethod(value);
    
    await supabase
      .from('cost_item_forecast_settings')
      .upsert({
        item_name: itemName,
        method: value,
        year: currentYear,
        month: currentMonth
      });

    onMethodChange(value);
  };

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm"
        className="h-6 w-6 p-0 ml-2"
        onClick={() => setOpen(true)}
      >
        <Pencil className="h-3 w-3" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Forecast Settings - {itemName}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <RadioGroup
              value={selectedMethod}
              onValueChange={(value) => handleMethodChange(value as ForecastMethod)}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed">Fixed (Use budget amount: {budgetAmount})</Label>
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
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
