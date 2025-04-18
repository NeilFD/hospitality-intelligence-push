
import { useState, useEffect } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import { generateRevenueForecast, saveForecast } from '@/services/forecast-service';
import { RevenueForecast } from '@/types/master-record-types';
import { toast } from 'sonner';

export const useForecastData = () => {
  const [forecastData, setForecastData] = useState<RevenueForecast[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const generateForecast = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Generate forecast for the next 7 days
      const today = new Date();
      const startDate = format(today, 'yyyy-MM-dd');
      const endDate = format(addDays(today, 7), 'yyyy-MM-dd');
      
      const forecast = await generateRevenueForecast(startDate, endDate);
      setForecastData(forecast);
      
      // Optionally save the forecast
      await saveForecast(forecast);
      
    } catch (err) {
      console.error('Error generating forecast:', err);
      setError('Failed to generate forecast. Please try again.');
      toast.error('Failed to generate forecast');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    generateForecast();
  }, []);
  
  const refreshForecast = () => {
    generateForecast();
    toast.success('Forecast refreshed with latest data');
  };
  
  const totalForecastedRevenue = forecastData.reduce((sum, day) => sum + day.totalRevenue, 0);
  const totalForecastedFoodRevenue = forecastData.reduce((sum, day) => sum + day.foodRevenue, 0);
  const totalForecastedBevRevenue = forecastData.reduce((sum, day) => sum + day.beverageRevenue, 0);
  
  return {
    forecastData,
    isLoading,
    error,
    refreshForecast,
    totalForecastedRevenue,
    totalForecastedFoodRevenue,
    totalForecastedBevRevenue
  };
};
