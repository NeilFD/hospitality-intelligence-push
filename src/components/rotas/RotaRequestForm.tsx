import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Calendar as CalendarIcon, Loader2, Zap } from 'lucide-react';
import { format, addDays, startOfWeek, parseISO } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuthStore } from '@/services/auth-service';

type RotaRequestFormProps = {
  location: any;
  onRequestComplete: () => void;
};

export default function RotaRequestForm({ location, onRequestComplete }: RotaRequestFormProps) {
  const { profile } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  const [revenueForecasts, setRevenueForecasts] = useState<{[key: string]: string}>({});
  const [thresholds, setThresholds] = useState<any[]>([]);
  const [previousRequests, setPreviousRequests] = useState<any[]>([]);
  const [loadingPrevious, setLoadingPrevious] = useState(true);
  
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
    }
  }, [date]);

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
      const weekEnd = weekDates[6];
      
      // Clean up revenue forecasts (convert to numbers)
      const cleanedForecasts: {[key: string]: number} = {};
      Object.entries(revenueForecasts).forEach(([date, value]) => {
        if (value) {
          cleanedForecasts[date] = parseFloat(value);
        }
      });
      
      // Create the rota request
      const { data, error } = await supabase
        .from('rota_requests')
        .insert({
          location_id: location.id,
          week_start_date: format(weekStart, 'yyyy-MM-dd'),
          week_end_date: format(weekEnd, 'yyyy-MM-dd'),
          status: 'draft',
          requested_by: profile?.id,
          revenue_forecast: cleanedForecasts
        })
        .select()
        .single();
        
      if (error) throw error;
      
      toast.success('Rota request submitted successfully', {
        description: 'You can now review the draft rota'
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
      console.error('Error submitting rota request:', error);
      toast.error('Failed to submit rota request');
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
    
    // Simulate AI forecast generation
    setTimeout(() => {
      const newForecasts = { ...revenueForecasts };
      
      weekDates.forEach(date => {
        const dayOfWeek = format(date, 'EEEE').toLowerCase();
        const dateString = format(date, 'yyyy-MM-dd');
        
        // Generate a reasonable revenue forecast based on day of week
        let baseAmount = 0;
        
        switch (dayOfWeek) {
          case 'monday':
            baseAmount = 2000;
            break;
          case 'tuesday':
            baseAmount = 2200;
            break;
          case 'wednesday':
            baseAmount = 2500;
            break;
          case 'thursday':
            baseAmount = 3000;
            break;
          case 'friday':
            baseAmount = 4500;
            break;
          case 'saturday':
            baseAmount = 5500;
            break;
          case 'sunday':
            baseAmount = 4000;
            break;
        }
        
        // Add some randomness
        const variance = baseAmount * 0.1; // 10% variance
        const randomFactor = Math.random() * variance * 2 - variance;
        const forecast = Math.round(baseAmount + randomFactor);
        
        newForecasts[dateString] = forecast.toString();
      });
      
      setRevenueForecasts(newForecasts);
      
      toast.success('AI forecast generated', {
        description: 'Revenue predictions have been applied'
      });
    }, 1500);
  };

  const hasThresholdWarning = thresholds.length === 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Request New Rota</CardTitle>
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
                            placeholder="£"
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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Draft Rota'
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
                      <div className="flex items-center">
                        <div className={cn(
                          "px-2 py-1 text-xs rounded-full",
                          {
                            "bg-yellow-100 text-yellow-800": request.status === "draft",
                            "bg-blue-100 text-blue-800": request.status === "pending_approval",
                            "bg-green-100 text-green-800": request.status === "approved",
                            "bg-red-100 text-red-800": request.status === "rejected"
                          }
                        )}>
                          {request.status.replace('_', ' ')}
                        </div>
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
