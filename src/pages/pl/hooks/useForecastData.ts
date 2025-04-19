
import { useState, useEffect } from 'react';
import { generateFutureWeeksForecast, analyzeWeatherImpact } from '@/services/forecast-service';
import { RevenueForecast } from '@/types/master-record-types';
import { toast } from 'sonner';

export const useForecastData = () => {
  const [forecastData, setForecastData] = useState<RevenueForecast[]>([]);
  const [futureWeeks, setFutureWeeks] = useState<RevenueForecast[][]>([]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState<number>(0);
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
      const { currentWeek, futureWeeks } = await generateFutureWeeksForecast(4);
      setForecastData(currentWeek);
      setFutureWeeks(futureWeeks);
      
      // Fetch weather impact analysis
      const today = new Date();
      const weatherAnalysis = await analyzeWeatherImpact(
        today.getFullYear(),
        today.getMonth() + 1,
        6
      );
      
      const weatherInsights = processWeatherImpact(weatherAnalysis);
      setWeatherImpactData(weatherInsights);
      
    } catch (err) {
      console.error('Error generating forecast:', err);
      toast.error('Failed to generate forecast');
      setError('Failed to load forecast data. Please try again later.');
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
  
  const findWeatherImpactForCondition = (
    weatherImpact: any, 
    dayOfWeek: string,
    ...conditions: string[]
  ) => {
    let foodTotal = 0;
    let bevTotal = 0;
    let count = 0;
    
    // Calculate baseline for this specific day
    const dayData = weatherImpact[dayOfWeek] || {};
    let baseline = { food: 0, bev: 0, count: 0 };
    
    Object.values(dayData).forEach((data: any) => {
      if (data.count > 0) {
        baseline.food += data.averageFoodRevenue * data.count;
        baseline.bev += data.averageBevRevenue * data.count;
        baseline.count += data.count;
      }
    });
    
    if (baseline.count === 0) return { foodImpact: 0, bevImpact: 0, totalImpact: 0 };
    
    const baselineFood = baseline.food / baseline.count;
    const baselineBev = baseline.bev / baseline.count;
    
    // Calculate impact for specific conditions
    conditions.forEach(condition => {
      const data = dayData[condition];
      if (data?.count > 0) {
        foodTotal += data.averageFoodRevenue * data.count;
        bevTotal += data.averageBevRevenue * data.count;
        count += data.count;
      }
    });
    
    if (count === 0) return { foodImpact: 0, bevImpact: 0, totalImpact: 0 };
    
    const avgFood = foodTotal / count;
    const avgBev = bevTotal / count;
    
    return {
      foodImpact: ((avgFood - baselineFood) / baselineFood) * 100,
      bevImpact: ((avgBev - baselineBev) / baselineBev) * 100,
      totalImpact: ((avgFood + avgBev - baselineFood - baselineBev) / (baselineFood + baselineBev)) * 100
    };
  };
  
  useEffect(() => {
    generateForecast();
  }, []);
  
  const refreshForecast = () => {
    generateForecast();
    toast.success('Forecast refreshed with latest data');
  };

  const selectWeek = (index: number) => {
    if (index === 0) {
      setForecastData(futureWeeks[0] || []); // Select current week
    } else {
      // Adjust index because futureWeeks is 0-indexed but our UI is 1-indexed
      const weekData = futureWeeks[index - 1];
      if (weekData) {
        setForecastData(weekData);
      }
    }
    setSelectedWeekIndex(index);
  };
  
  const totalForecastedRevenue = forecastData.reduce((sum, day) => sum + day.totalRevenue, 0);
  const totalForecastedFoodRevenue = forecastData.reduce((sum, day) => sum + day.foodRevenue, 0);
  const totalForecastedBevRevenue = forecastData.reduce((sum, day) => sum + day.beverageRevenue, 0);
  
  return {
    forecastData,
    futureWeeks,
    selectedWeekIndex,
    selectWeek,
    isLoading,
    refreshForecast,
    totalForecastedRevenue,
    totalForecastedFoodRevenue,
    totalForecastedBevRevenue,
    weatherImpactData,
    error
  };
};
