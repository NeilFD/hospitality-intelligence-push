
import { useState, useEffect } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import { generateRevenueForecast, saveForecast, analyzeWeatherImpact } from '@/services/forecast-service';
import { RevenueForecast } from '@/types/master-record-types';
import { toast } from 'sonner';

export const useForecastData = () => {
  const [forecastData, setForecastData] = useState<RevenueForecast[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [weatherImpactData, setWeatherImpactData] = useState<{
    hotWeather: string[];
    coldWeather: string[];
    rainyDays: string[];
    sunnyDays: string[];
  }>({
    hotWeather: [],
    coldWeather: [],
    rainyDays: [],
    sunnyDays: []
  });
  
  const generateForecast = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Generate forecast for the next 7 days
      const today = new Date();
      const startDate = format(today, 'yyyy-MM-dd');
      const endDate = format(addDays(today, 6), 'yyyy-MM-dd'); // 7 days total (today + 6)
      
      const forecast = await generateRevenueForecast(startDate, endDate);
      
      // Ensure we have 7 days of data
      if (forecast.length < 7) {
        console.warn(`Expected 7 days of forecast data but got ${forecast.length}`);
      }
      
      setForecastData(forecast);
      
      // Fetch weather impact analysis
      const currentYear = today.getFullYear();
      const currentMonth = today.getMonth() + 1;
      const weatherAnalysis = await analyzeWeatherImpact(currentYear, currentMonth, 6); // Analyze 6 months of data
      
      // Process the weather impact data to get insights
      const weatherInsights = processWeatherImpact(weatherAnalysis);
      setWeatherImpactData(weatherInsights);
      
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
  
  // Process the raw weather impact data into readable insights
  const processWeatherImpact = (weatherImpact: any) => {
    const insights = {
      hotWeather: [] as string[],
      coldWeather: [] as string[],
      rainyDays: [] as string[],
      sunnyDays: [] as string[]
    };
    
    // Extract significant patterns from the data
    try {
      // Hot weather impacts
      const hotDaysData = findWeatherImpactForCondition(weatherImpact, 'Clear sky', 'Sunny');
      if (hotDaysData.foodImpact !== 0) {
        insights.hotWeather.push(`Food sales ${hotDaysData.foodImpact > 0 ? 'increase' : 'decrease'} by approximately ${Math.abs(Math.round(hotDaysData.foodImpact))}%`);
      }
      if (hotDaysData.bevImpact !== 0) {
        insights.hotWeather.push(`Beverage sales ${hotDaysData.bevImpact > 0 ? 'increase' : 'decrease'} by approximately ${Math.abs(Math.round(hotDaysData.bevImpact))}%`);
      }
      if (insights.hotWeather.length === 0) {
        insights.hotWeather.push('Not enough data to determine impact');
      }
      
      // Cold weather impacts
      const coldDaysData = findWeatherImpactForCondition(weatherImpact, 'Cloudy', 'Partly cloudy');
      if (coldDaysData.foodImpact !== 0) {
        insights.coldWeather.push(`Food sales ${coldDaysData.foodImpact > 0 ? 'increase' : 'decrease'} by approximately ${Math.abs(Math.round(coldDaysData.foodImpact))}%`);
      }
      if (coldDaysData.bevImpact !== 0) {
        insights.coldWeather.push(`Beverage sales ${coldDaysData.bevImpact > 0 ? 'increase' : 'decrease'} by approximately ${Math.abs(Math.round(coldDaysData.bevImpact))}%`);
      }
      if (insights.coldWeather.length === 0) {
        insights.coldWeather.push('Not enough data to determine impact');
      }
      
      // Rainy days impacts
      const rainyDaysData = findWeatherImpactForCondition(weatherImpact, 'Light rain', 'Heavy rain');
      if (rainyDaysData.foodImpact !== 0 || rainyDaysData.bevImpact !== 0) {
        const avgImpact = (rainyDaysData.foodImpact + rainyDaysData.bevImpact) / 2;
        if (avgImpact < 0) {
          insights.rainyDays.push(`Overall revenue decreases by approximately ${Math.abs(Math.round(avgImpact))}%`);
        }
      }
      
      if (rainyDaysData.foodImpact !== 0) {
        insights.rainyDays.push(`Food sales ${rainyDaysData.foodImpact > 0 ? 'increase' : 'decrease'} by approximately ${Math.abs(Math.round(rainyDaysData.foodImpact))}%`);
      }
      
      if (insights.rainyDays.length === 0) {
        insights.rainyDays.push('Not enough data to determine impact');
      }
      
      // Sunny days impacts
      const sunnyDaysData = findWeatherImpactForCondition(weatherImpact, 'Clear sky', 'Sunny');
      if (sunnyDaysData.totalImpact > 0) {
        insights.sunnyDays.push(`Higher overall revenue compared to other weather conditions`);
      }
      
      if (Math.abs(sunnyDaysData.foodImpact - sunnyDaysData.bevImpact) < 5) {
        insights.sunnyDays.push(`More even distribution between food and beverage revenue`);
      }
      
      if (insights.sunnyDays.length === 0) {
        insights.sunnyDays.push('Not enough data to determine impact');
      }
      
    } catch (error) {
      console.error('Error processing weather impact data', error);
      // Fallback to generic insights based on basic weather data
      insights.hotWeather = ['Not enough historical data'];
      insights.coldWeather = ['Not enough historical data'];
      insights.rainyDays = ['Not enough historical data'];
      insights.sunnyDays = ['Not enough historical data'];
    }
    
    return insights;
  };
  
  // Helper function to find weather impact by condition
  const findWeatherImpactForCondition = (weatherImpact: any, ...conditions: string[]) => {
    let foodTotal = 0;
    let bevTotal = 0;
    let count = 0;
    let baseline = { food: 0, bev: 0, count: 0 };
    
    // First establish baseline
    Object.keys(weatherImpact).forEach(day => {
      Object.keys(weatherImpact[day]).forEach(condition => {
        const data = weatherImpact[day][condition];
        if (data.count > 0) {
          baseline.food += data.averageFoodRevenue * data.count;
          baseline.bev += data.averageBevRevenue * data.count;
          baseline.count += data.count;
        }
      });
    });
    
    if (baseline.count === 0) return { foodImpact: 0, bevImpact: 0, totalImpact: 0 };
    
    const baselineFood = baseline.food / baseline.count;
    const baselineBev = baseline.bev / baseline.count;
    
    // Calculate impact for specified conditions
    Object.keys(weatherImpact).forEach(day => {
      conditions.forEach(condition => {
        if (weatherImpact[day][condition] && weatherImpact[day][condition].count > 0) {
          foodTotal += weatherImpact[day][condition].averageFoodRevenue;
          bevTotal += weatherImpact[day][condition].averageBevRevenue;
          count += 1;
        }
      });
    });
    
    if (count === 0) return { foodImpact: 0, bevImpact: 0, totalImpact: 0 };
    
    const avgFood = foodTotal / count;
    const avgBev = bevTotal / count;
    
    // Calculate percentage impact
    const foodImpact = ((avgFood - baselineFood) / baselineFood) * 100;
    const bevImpact = ((avgBev - baselineBev) / baselineBev) * 100;
    const totalImpact = ((avgFood + avgBev - baselineFood - baselineBev) / (baselineFood + baselineBev)) * 100;
    
    return { foodImpact, bevImpact, totalImpact };
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
    totalForecastedBevRevenue,
    weatherImpactData
  };
};
