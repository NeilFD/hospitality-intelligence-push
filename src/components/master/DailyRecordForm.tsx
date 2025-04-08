
import React from 'react';
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

const DailyRecordForm: React.FC<DailyRecordFormProps> = ({ 
  date, 
  dayOfWeek, 
  initialData = {}, 
  onSave 
}) => {
  const form = useForm<Partial<MasterDailyRecord>>({
    defaultValues: {
      date,
      dayOfWeek,
      foodRevenue: initialData.foodRevenue || 0,
      beverageRevenue: initialData.beverageRevenue || 0,
      lunchCovers: initialData.lunchCovers || 0,
      dinnerCovers: initialData.dinnerCovers || 0,
      weatherDescription: initialData.weatherDescription || '',
      temperature: initialData.temperature || 0,
      precipitation: initialData.precipitation || 0,
      windSpeed: initialData.windSpeed || 0,
      localEvents: initialData.localEvents || '',
      operationsNotes: initialData.operationsNotes || '',
    }
  });

  const handleWeatherFetched = (weatherData: {
    description: string;
    temperature: number;
    precipitation: number;
    windSpeed: number;
  }) => {
    form.setValue('weatherDescription', weatherData.description);
    form.setValue('temperature', weatherData.temperature);
    form.setValue('precipitation', weatherData.precipitation);
    form.setValue('windSpeed', weatherData.windSpeed);
    toast.success('Weather data fetched successfully');
  };

  const handleSubmit = async (data: Partial<MasterDailyRecord>) => {
    try {
      await onSave(data);
      toast.success('Daily record saved successfully');
    } catch (error) {
      console.error('Error saving daily record:', error);
      toast.error('Failed to save daily record');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Daily Record - {date} ({dayOfWeek})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Revenue Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="foodRevenue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Food Revenue (£)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        step="0.01" 
                        placeholder="0.00"
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
                    <FormLabel>Beverage Revenue (£)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Covers Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lunchCovers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lunch Covers</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0"
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
                    <FormLabel>Dinner Covers</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Weather Section */}
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
                    <FormLabel>Weather</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Weather description"
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
                    <FormLabel>Temperature (°C)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        placeholder="0.0"
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
                name="windSpeed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Wind Speed (km/h)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.1"
                        placeholder="0.0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Context Section */}
            <FormField
              control={form.control}
              name="localEvents"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Local Goings On</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter information about local events, festivals, etc."
                      className="min-h-[80px]"
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
                  <FormLabel>Daily Operations Report</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter operational notes, issues, or highlights for the day"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="ml-auto">Save Daily Record</Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
};

export default DailyRecordForm;
