
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Calendar as CalendarIcon, Loader2, Zap, Trash2, CloudLightning } from 'lucide-react';
import { format, addDays, startOfWeek, parseISO, endOfWeek } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuthStore } from '@/services/auth-service';
import { getRevenueForecastsForRange } from '@/services/forecast-service';
import { RevenueForecast } from '@/types/master-record-types';

type RotaRequestFormProps = {
  location: any;
  onRequestComplete: () => void;
};

// N8N webhook URL
const N8N_WEBHOOK_URL = 'https://neilfd.app.n8n.cloud/webhook/91a7e93e-82e3-4ce1-aed0-af96ca220f98';

export default function RotaRequestForm({ location, onRequestComplete }: RotaRequestFormProps) {
  const { profile } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [revenueForecasts, setRevenueForecasts] = useState<{[key: string]: string}>({});
  const [thresholds, setThresholds] = useState<any[]>([]);
  const [previousRequests, setPreviousRequests] = useState<any[]>([]);
  const [loadingPrevious, setLoadingPrevious] = useState(true);
  const [isFetchingForecasts, setIsFetchingForecasts] = useState(false);
  
  const { handleSubmit, reset } = useForm();

  useEffect(() => {
    if (location) {
      fetchPreviousRequests();
      fetchThresholds();
    }
  }, [location]);

  useEffect(() => {
    if (date) {
      // Calculate start of week (Monday)
      const weekStart = startOfWeek(date, { weekStartsOn: 1 });
      
      // Generate an array of dates for the week
      const weekDatesArray = Array.from({ length: 7 }, (_, i) => 
        addDays(weekStart, i)
      );
      
      setWeekDates(weekDatesArray);
      
      // Initialize revenue forecasts with empty values
      const initialForecasts: {[key: string]: string} = {};
      weekDatesArray.forEach(day => {
        initialForecasts[format(day, 'yyyy-MM-dd')] = '';
      });
      
      setRevenueForecasts(initialForecasts);
      
      // Fetch existing forecasts for this week
      fetchExistingForecasts(weekStart, addDays(weekStart, 6));
    }
  }, [date]);

  const fetchExistingForecasts = async (startDate: Date, endDate: Date) => {
    try {
      setIsFetchingForecasts(true);
      
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      
      console.log(`Fetching forecast data for range: ${startDateStr} to ${endDateStr}`);
      
      // Get forecasts from the forecast service
      const forecasts = await getRevenueForecastsForRange(startDateStr, endDateStr);
      
      if (forecasts && forecasts.length > 0) {
        const formattedForecasts: {[key: string]: string} = { ...revenueForecasts };
        
        // Pre-fill with existing forecast data
        forecasts.forEach(forecast => {
          formattedForecasts[forecast.date] = Math.round(forecast.totalRevenue).toString();
        });
        
        setRevenueForecasts(formattedForecasts);
        toast.info('Revenue forecasts loaded', {
          description: 'Forecast data has been pre-filled from existing forecasts'
        });
      } else {
        // If no forecasts found, try weekly forecast data on page
        console.log('No forecasts found from forecast service, trying weekly forecast data');
        fetchWeeklyForecastData(startDateStr, endDateStr);
      }
    } catch (error) {
      console.error('Error fetching revenue forecasts:', error);
      // If fetching fails, try weekly forecast data on page
      const startDateStr = format(startDate, 'yyyy-MM-dd');
      const endDateStr = format(endDate, 'yyyy-MM-dd');
      console.log('Error fetching from forecast service, trying weekly forecast data');
      fetchWeeklyForecastData(startDateStr, endDateStr);
    } finally {
      setIsFetchingForecasts(false);
    }
  };
  
  const fetchWeeklyForecastData = async (startDate: string, endDate: string) => {
    try {
      console.log(`Trying to fetch weekly forecasts from revenue_forecasts table for ${startDate} to ${endDate}`);
      
      // Try to fetch from the revenue_forecasts table (where WeeklyForecast page stores its data)
      const { data, error } = await supabase
        .from('revenue_forecasts')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);
      
      if (error) {
        console.error('Error fetching weekly forecasts:', error);
        console.log('No data from revenue_forecasts, generating AI forecast automatically');
        // No data found, auto-generate a forecast
        generateAIForecast();
        return;
      }
      
      if (data && data.length > 0) {
        const formattedForecasts = { ...revenueForecasts };
        
        data.forEach((forecast: any) => {
          if (forecast.date && forecast.totalRevenue) {
            formattedForecasts[forecast.date] = Math.round(forecast.totalRevenue).toString();
          }
        });
        
        setRevenueForecasts(formattedForecasts);
        toast.info('Forecast data found', {
          description: 'Revenue forecasts have been pre-filled from existing data'
        });
      } else {
        console.log('No data found in revenue_forecasts table, generating AI forecast automatically');
        // No data found, auto-generate a forecast
        generateAIForecast();
      }
    } catch (error) {
      console.error('Error fetching weekly forecast data:', error);
      console.log('Error in weekly forecast fetch, generating AI forecast automatically');
      // Error occurred, auto-generate a forecast
      generateAIForecast();
    }
  };

  const fetchPreviousRequests = async () => {
    setLoadingPrevious(true);
    try {
      const { data, error } = await supabase
        .from('rota_requests')
        .select('*, profiles:requested_by(first_name, last_name)')
        .eq('location_id', location.id)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (error) throw error;
      
      setPreviousRequests(data || []);
    } catch (error) {
      console.error('Error fetching previous requests:', error);
      toast.error('Failed to load previous requests');
    } finally {
      setLoadingPrevious(false);
    }
  };
  
  const fetchThresholds = async () => {
    try {
      const { data, error } = await supabase
        .from('rota_revenue_thresholds')
        .select('*')
        .eq('location_id', location.id);
        
      if (error) throw error;
      
      setThresholds(data || []);
    } catch (error) {
      console.error('Error fetching thresholds:', error);
    }
  };

  const handleRevenueChange = (dateKey: string, value: string) => {
    setRevenueForecasts(prev => ({
      ...prev,
      [dateKey]: value
    }));
  };

  const onSubmit = async () => {
    if (!date) {
      toast.error('Please select a week first');
      return;
    }
    
    // Check if we have at least one revenue forecast
    const hasAnyForecast = Object.values(revenueForecasts).some(value => value !== '');
    
    if (!hasAnyForecast) {
      toast.error('Please provide at least one revenue forecast');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format the data for submission
      const weekStart = weekDates[0];
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      
      // Clean up revenue forecasts (convert to numbers)
      const cleanedForecasts: {[key: string]: number} = {};
      Object.entries(revenueForecasts).forEach(([date, value]) => {
        if (value) {
          cleanedForecasts[date] = parseFloat(value);
        }
      });

      // Create payload for n8n webhook
      const webhookPayload = {
        location_id: location.id,
        week_start_date: weekStartStr,
        requested_by: profile?.id,
        revenue_forecast: cleanedForecasts
      };
      
      console.log("Sending webhook payload to n8n:", webhookPayload);
      
      // Send request to n8n webhook
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      });
      
      if (!response.ok) {
        throw new Error(`N8N webhook responded with status: ${response.status}`);
      }
      
      // Create a record in the rota_requests table to track the request
      const { data, error } = await supabase
        .from('rota_requests')
        .insert({
          location_id: location.id,
          week_start_date: weekStartStr,
          week_end_date: format(addDays(weekStart, 6), 'yyyy-MM-dd'),
          status: 'processing', // New status to indicate it's being processed by n8n
          requested_by: profile?.id,
          revenue_forecast: cleanedForecasts
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error saving rota request:', error);
        toast.warning('N8N webhook triggered but failed to save request record', {
          description: 'The schedule will still be generated but tracking may be affected.'
        });
      }
      
      toast.success('Rota request sent to scheduling system', {
        description: 'The schedule will be generated soon. Check the Review tab shortly.'
      });
      
      // Reset the form
      reset();
      setDate(undefined);
      setWeekDates([]);
      setRevenueForecasts({});
      
      // Refresh the previous requests list
      fetchPreviousRequests();
      
      // Notify parent component
      onRequestComplete();
    } catch (error) {
      console.error('Error submitting rota request to n8n:', error);
      toast.error('Failed to submit rota request', {
        description: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateAIForecast = () => {
    if (!date) {
      toast.error('Please select a week first');
      return;
    }
    
    toast.info('Generating AI forecast...', {
      description: 'Using historical data to predict revenue',
      duration: 2000
    });
    
    // Try to fetch historical data from master_daily_records for more realistic forecasting
    fetchHistoricalData();
  };

  const fetchHistoricalData = async () => {
    try {
      // Get historical data for the same days of week from the last few weeks
      const { data: historicalData, error } = await supabase
        .from('master_daily_records')
        .select('*')
        .order('date', { ascending: false })
        .limit(35);  // Get enough data for meaningful patterns
      
      if (error) throw error;
      
      if (historicalData && historicalData.length > 0) {
        // Use historical data to generate realistic forecasts
        const newForecasts = { ...revenueForecasts };
        
        weekDates.forEach(date => {
          const dateString = format(date, 'yyyy-MM-dd');
          const dayOfWeek = format(date, 'EEEE').toLowerCase();
          
          // Filter historical data for the same day of week
          const sameDay = historicalData.filter((record: any) => 
            record.day_of_week?.toLowerCase() === dayOfWeek
          );
          
          if (sameDay.length > 0) {
            // Calculate average revenue for this day of week from historical data
            const totalRevenue = sameDay.reduce((sum: number, record: any) => {
              return sum + (record.total_revenue || 0);
            }, 0);
            
            const averageRevenue = Math.round(totalRevenue / sameDay.length);
            
            // Add small random variation (±10%)
            const variation = averageRevenue * 0.1;
            const randomOffset = (Math.random() * variation * 2) - variation;
            const forecastValue = Math.max(0, Math.round(averageRevenue + randomOffset));
            
            newForecasts[dateString] = forecastValue.toString();
          } else {
            // Fallback logic based on day of week patterns if no historical data
            const baseAmounts: {[key: string]: number} = {
              'monday': 2000,
              'tuesday': 2200,
              'wednesday': 2500,
              'thursday': 3000,
              'friday': 4500,
              'saturday': 5500,
              'sunday': 4000
            };
            
            const baseAmount = baseAmounts[dayOfWeek] || 3000;
            const variation = baseAmount * 0.15; // 15% variance for more realistic variation
            const randomFactor = Math.random() * variation * 2 - variation;
            const forecast = Math.round(baseAmount + randomFactor);
            
            newForecasts[dateString] = forecast.toString();
          }
        });
        
        setRevenueForecasts(newForecasts);
      } else {
        // Fallback to deterministic generation if no historical data
        generateDeterministicForecast();
      }
      
      toast.success('AI forecast generated', {
        description: 'Revenue predictions have been applied based on historical patterns'
      });
      
    } catch (error) {
      console.error('Error generating AI forecast:', error);
      // Fallback to deterministic generation if error occurs
      generateDeterministicForecast();
    }
  };
  
  const generateDeterministicForecast = () => {
    const newForecasts = { ...revenueForecasts };
    
    weekDates.forEach(date => {
      const dayOfWeek = format(date, 'EEEE').toLowerCase();
      const dateString = format(date, 'yyyy-MM-dd');
      
      // Generate a reasonable revenue forecast based on day of week
      const baseAmounts: {[key: string]: number} = {
        'monday': 2000,
        'tuesday': 2200,
        'wednesday': 2500,
        'thursday': 3000,
        'friday': 4500,
        'saturday': 5500,
        'sunday': 4000
      };
      
      const baseAmount = baseAmounts[dayOfWeek] || 3000;
      
      // Add some randomness - more variance for a more natural distribution
      const variation = baseAmount * 0.15; // 15% variance
      const randomFactor = Math.random() * variation * 2 - variation;
      const forecast = Math.round(baseAmount + randomFactor);
      
      newForecasts[dateString] = forecast.toString();
    });
    
    setRevenueForecasts(newForecasts);
    
    toast.success('AI forecast generated', {
      description: 'Revenue predictions have been applied'
    });
  };

  const hasThresholdWarning = thresholds.length === 0;

  // Add function to delete rota request
  const handleDeleteRequest = async (requestId: string) => {
    try {
      // First check if a schedule exists for this request
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('rota_schedules')
        .select('id')
        .eq('request_id', requestId);
        
      if (scheduleData && scheduleData.length > 0) {
        // If schedules exist, we need to delete them first (and their shifts)
        console.log("Deleting associated schedule shifts...");
        
        // First delete all shifts associated with these schedules
        for (const schedule of scheduleData) {
          const { error: shiftDeleteError } = await supabase
            .from('rota_schedule_shifts')
            .delete()
            .eq('schedule_id', schedule.id);
            
          if (shiftDeleteError) {
            console.error('Error deleting schedule shifts:', shiftDeleteError);
            toast.error('Could not delete schedule shifts');
            return;
          }
        }
        
        // Then delete the schedules
        console.log("Deleting associated schedules...");
        const { error: deleteScheduleError } = await supabase
          .from('rota_schedules')
          .delete()
          .eq('request_id', requestId);
          
        if (deleteScheduleError) {
          console.error('Error deleting schedules:', deleteScheduleError);
          toast.error('Could not delete associated schedules');
          return;
        }
      }
      
      // Now delete the rota request
      console.log("Deleting rota request:", requestId);
      const { error: deleteRequestError } = await supabase
        .from('rota_requests')
        .delete()
        .eq('id', requestId);
        
      if (deleteRequestError) {
        console.error('Error deleting rota request:', deleteRequestError);
        toast.error('Failed to delete rota request');
        return;
      }
      
      // Refresh the previous requests list
      toast.success('Rota request deleted successfully');
      fetchPreviousRequests();
    } catch (error) {
      console.error('Error in delete operation:', error);
      toast.error('An error occurred while deleting');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Request New Rota 
              <span className="text-xs font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Using N8N
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {hasThresholdWarning && (
                <Alert className="mb-4">
                  <AlertTitle>No revenue thresholds configured</AlertTitle>
                  <AlertDescription>
                    You haven't set up any revenue thresholds yet. The AI engine uses these to determine optimal staffing levels.
                    <div className="mt-2">
                      <Button variant="outline" size="sm" onClick={() => document.querySelector('[value="thresholds"]')?.dispatchEvent(new MouseEvent('click'))}>
                        Configure Thresholds
                      </Button>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Week Starting</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP") : "Select a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        disabled={(date) => {
                          // Only allow Mondays
                          return format(date, 'EEEE') !== 'Monday';
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-sm text-muted-foreground">
                    You can only select Mondays to ensure whole week scheduling
                  </p>
                </div>

                {weekDates.length > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium">Revenue Forecasts</h3>
                      <Button 
                        type="button"
                        variant="outline"
                        onClick={generateAIForecast}
                        className="flex items-center gap-1"
                      >
                        <Zap className="h-4 w-4" /> Auto-generate
                      </Button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
                      {weekDates.map((day, index) => (
                        <div key={index} className="space-y-1.5">
                          <Label htmlFor={`revenue-${index}`}>{format(day, 'EEE')}</Label>
                          <p className="text-xs text-muted-foreground">{format(day, 'dd/MM')}</p>
                          <Input
                            id={`revenue-${index}`}
                            placeholder={isFetchingForecasts ? "Loading..." : "£"}
                            type="number"
                            min="0"
                            value={revenueForecasts[format(day, 'yyyy-MM-dd')] || ''}
                            onChange={(e) => handleRevenueChange(format(day, 'yyyy-MM-dd'), e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isSubmitting} className="flex items-center gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CloudLightning className="h-4 w-4" />
                  Send to N8N Scheduler
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {!loadingPrevious && previousRequests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Previous Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {previousRequests.map((request, idx) => {
                  const weekStart = format(parseISO(request.week_start_date), 'dd MMM yyyy');
                  const weekEnd = format(parseISO(request.week_end_date), 'dd MMM yyyy');
                  const requester = request.profiles?.first_name + ' ' + request.profiles?.last_name;
                  
                  return (
                    <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0">
                      <div>
                        <p className="font-medium">{weekStart} - {weekEnd}</p>
                        <p className="text-sm text-muted-foreground">Requested by {requester}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "px-2 py-1 text-xs rounded-full",
                          {
                            "bg-yellow-100 text-yellow-800": request.status === "draft",
                            "bg-blue-100 text-blue-800": request.status === "pending_approval",
                            "bg-green-100 text-green-800": request.status === "approved",
                            "bg-red-100 text-red-800": request.status === "rejected",
                            "bg-purple-100 text-purple-800": request.status === "processing"
                          }
                        )}>
                          {request.status.replace('_', ' ')}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteRequest(request.id)}
                          title="Delete Rota Request"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </form>
  );
}
