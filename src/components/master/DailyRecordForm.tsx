import React, { useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { MasterDailyRecord } from '@/types/master-record-types';
import WeatherFetcher from './WeatherFetcher';
import { toast } from 'sonner';

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
    try {
      await onSave(data);
      toast.success('Daily record saved successfully');
    } catch (error) {
      console.error('Error saving daily record:', error);
      toast.error('Failed to save daily record');
    }
  }, [onSave]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Card className="mb-6 border shadow-sm">
          <CardHeader className="bg-gray-50 border-b pb-3">
            <CardTitle className="text-xl">Daily Record - {date} ({dayOfWeek})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="foodRevenue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Food Revenue (£)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01" 
                        placeholder="0.00"
                        className="bg-gray-50 focus:bg-white"
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
                    <FormLabel className="font-medium">Beverage Revenue (£)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        className="bg-gray-50 focus:bg-white"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="lunchCovers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Lunch Covers</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0"
                        className="bg-gray-50 focus:bg-white"
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
                    <FormLabel className="font-medium">Dinner Covers</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0"
                        className="bg-gray-50 focus:bg-white"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <WeatherFetcher 
              date={date}
              onWeatherFetched={handleWeatherFetched}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <FormField
                control={form.control}
                name="weatherDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-medium">Weather</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Weather description"
                        className="bg-gray-50 focus:bg-white"
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
                    <FormLabel className="font-medium">Temperature (°C)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0"
                        className="bg-gray-50 focus:bg-white"
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
                    <FormLabel className="font-medium">Wind Speed (km/h)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        placeholder="0.0"
                        className="bg-gray-50 focus:bg-white"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="localEvents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-medium">Local Goings On</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter information about local events, festivals, etc."
                      className="min-h-[80px] bg-gray-50 focus:bg-white"
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
                  <FormLabel className="font-medium">Daily Operations Report</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter operational notes, issues, or highlights for the day"
                      className="min-h-[120px] bg-gray-50 focus:bg-white"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="bg-gray-50 border-t pt-4">
            <Button type="submit" className="ml-auto">Save Daily Record</Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
});

DailyRecordForm.displayName = 'DailyRecordForm';

export default DailyRecordForm;
