
import React, { useMemo, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { MasterDailyRecord } from '@/types/master-record-types';
import WeatherFetcher from './WeatherFetcher';
import { toast } from 'sonner';
import { CheckCircle2 } from 'lucide-react';

interface DailyRecordFormProps {
  date: string;
  dayOfWeek: string;
  initialData?: Partial<MasterDailyRecord>;
  onSave: (data: Partial<MasterDailyRecord>) => Promise<void>;
}

const DailyRecordForm: React.FC<DailyRecordFormProps> = React.memo(({ 
  date, 
  dayOfWeek, 
  initialData = {}, 
  onSave 
}) => {
  const [isSaving, setIsSaving] = useState(false);
  
  const defaultValues = useMemo(() => ({
    date,
    dayOfWeek,
    foodRevenue: initialData.foodRevenue || 0,
    beverageRevenue: initialData.beverageRevenue || 0,
    lunchCovers: initialData.lunchCovers || 0,
    dinnerCovers: initialData.dinnerCovers || 0,
    weatherDescription: initialData.weatherDescription || '',
    temperature: Math.round(initialData.temperature || 0),
    precipitation: initialData.precipitation || 0,
    windSpeed: initialData.windSpeed || 0,
    localEvents: initialData.localEvents || '',
    operationsNotes: initialData.operationsNotes || '',
  }), [date, dayOfWeek, initialData]);

  const form = useForm<Partial<MasterDailyRecord>>({
    defaultValues
  });

  // Calculate derived values
  const totalRevenue = useMemo(() => {
    const foodRev = form.watch('foodRevenue') || 0;
    const bevRev = form.watch('beverageRevenue') || 0;
    return foodRev + bevRev;
  }, [form.watch('foodRevenue'), form.watch('beverageRevenue')]);

  const totalCovers = useMemo(() => {
    const lunch = form.watch('lunchCovers') || 0;
    const dinner = form.watch('dinnerCovers') || 0;
    return lunch + dinner;
  }, [form.watch('lunchCovers'), form.watch('dinnerCovers')]);

  const averageCoverSpend = useMemo(() => {
    return totalCovers > 0 ? totalRevenue / totalCovers : 0;
  }, [totalRevenue, totalCovers]);

  const handleWeatherFetched = useCallback((weatherData: {
    description: string;
    temperature: number;
    precipitation: number;
    windSpeed: number;
  }) => {
    form.setValue('weatherDescription', weatherData.description);
    form.setValue('temperature', Math.round(weatherData.temperature));
    form.setValue('precipitation', weatherData.precipitation);
    form.setValue('windSpeed', weatherData.windSpeed);
    toast.success('Weather data fetched successfully');
  }, [form]);

  const handleSubmit = useCallback(async (data: Partial<MasterDailyRecord>) => {
    setIsSaving(true);
    try {
      await onSave(data);
      toast.success('Daily record saved successfully', {
        description: `Record for ${date} has been updated`,
        icon: <CheckCircle2 className="text-green-500" />
      });
    } catch (error) {
      console.error('Error saving daily record:', error);
      toast.error('Failed to save daily record');
    } finally {
      setIsSaving(false);
    }
  }, [onSave, date]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Card className="border-0 shadow-none">
          <CardHeader className="pt-3 pb-2 px-4">
            <CardTitle className="text-base font-medium">{date} ({dayOfWeek})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <FormField
                control={form.control}
                name="foodRevenue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Food Revenue (£)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01" 
                        placeholder="0.00"
                        className="h-8 text-sm"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="beverageRevenue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Beverage Revenue (£)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        className="h-8 text-sm"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lunchCovers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Lunch Covers</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0"
                        className="h-8 text-sm"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dinnerCovers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Dinner Covers</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0"
                        className="h-8 text-sm"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Display calculated values */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-md">
              <div>
                <span className="text-xs font-medium block text-gray-600">Total Revenue (£)</span>
                <span className="text-base font-semibold">{totalRevenue.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-xs font-medium block text-gray-600">Total Covers</span>
                <span className="text-base font-semibold">{totalCovers}</span>
              </div>
              <div>
                <span className="text-xs font-medium block text-gray-600">Average Spend/Cover (£)</span>
                <span className="text-base font-semibold">{averageCoverSpend.toFixed(2)}</span>
              </div>
            </div>
            
            <WeatherFetcher 
              date={date}
              onWeatherFetched={handleWeatherFetched}
            />
            
            <div className="grid grid-cols-3 gap-3 mt-2">
              <FormField
                control={form.control}
                name="weatherDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Weather</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Description"
                        className="h-8 text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Temperature (°C)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0"
                        className="h-8 text-sm"
                        {...field}
                        onChange={(e) => field.onChange(Math.round(parseFloat(e.target.value) || 0))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="windSpeed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Wind Speed (km/h)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        placeholder="0.0"
                        className="h-8 text-sm"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="localEvents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Local Events</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Local events info"
                        className="min-h-[60px] text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="operationsNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium">Operations Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Operations notes"
                        className="min-h-[60px] text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="py-2 px-4 flex justify-end">
            <Button 
              type="submit" 
              size="sm" 
              disabled={isSaving}
              className="min-w-[100px]"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
});

DailyRecordForm.displayName = 'DailyRecordForm';

export default DailyRecordForm;
