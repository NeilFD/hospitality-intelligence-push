
import { format, addDays, startOfWeek, endOfWeek, getDay } from 'date-fns';
import { RevenueForecast, WeatherForecast } from '@/types/master-record-types';

// Mock function to fetch weather forecast
// In a real application, this would call a weather API
const fetchWeatherForecast = async (startDate: string, endDate: string): Promise<WeatherForecast[]> => {
  console.log(`Fetching weather forecast from ${startDate} to ${endDate}`);
  
  // Simulated API response
  const start = new Date(startDate);
  const end = new Date(endDate);
  const forecast: WeatherForecast[] = [];
  
  // Generate a forecast for each day in the date range
  for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
    // For dates more than 7 days in the future, return N/A
    const isMoreThanWeekAway = new Date(day).getTime() - new Date().getTime() > 7 * 24 * 60 * 60 * 1000;
    
    if (isMoreThanWeekAway) {
      forecast.push({
        date: format(day, 'yyyy-MM-dd'),
        description: 'N/A',
        temperature: 0,
        precipitation: 0,
        windSpeed: 0
      });
      continue;
    }
    
    // Random weather conditions for the next 7 days
    const conditions = ['Sunny', 'Partly cloudy', 'Cloudy', 'Light rain', 'Heavy rain'];
    const randomCondition = conditions[Math.floor(Math.random() * conditions.length)];
    const randomTemp = Math.floor(Math.random() * 20) + 5; // 5-25°C
    const randomPrecipitation = randomCondition.includes('rain') ? Math.floor(Math.random() * 10) : 0;
    const randomWind = Math.floor(Math.random() * 20);
    
    forecast.push({
      date: format(day, 'yyyy-MM-dd'),
      description: randomCondition,
      temperature: randomTemp,
      precipitation: randomPrecipitation, 
      windSpeed: randomWind
    });
  }
  
  return forecast;
};

// Calculate average revenue by day of week for baseline forecasting
const calculateDayOfWeekBaselines = async (date: Date) => {
  // This would typically fetch data from your database to calculate averages
  // Here we're using dummy data for demonstration
  return {
    'Monday': { avgFoodRevenue: 2100, avgBevRevenue: 1200, count: 8 },
    'Tuesday': { avgFoodRevenue: 1800, avgBevRevenue: 900, count: 8 },
    'Wednesday': { avgFoodRevenue: 2000, avgBevRevenue: 1100, count: 8 },
    'Thursday': { avgFoodRevenue: 2400, avgBevRevenue: 1500, count: 8 },
    'Friday': { avgFoodRevenue: 3200, avgBevRevenue: 2200, count: 8 },
    'Saturday': { avgFoodRevenue: 3800, avgBevRevenue: 2800, count: 8 },
    'Sunday': { avgFoodRevenue: 3000, avgBevRevenue: 1800, count: 8 }
  };
};

// Analyze how weather impacts revenue
export const analyzeWeatherImpact = async (year: number, month: number, months: number) => {
  // This would typically analyze historical data to find correlations
  // between weather and revenue
  const weatherImpact: any = {
    'Monday': {
      'Sunny': { averageFoodRevenue: 2300, averageBevRevenue: 1400, count: 4 },
      'Partly cloudy': { averageFoodRevenue: 2100, averageBevRevenue: 1200, count: 2 },
      'Cloudy': { averageFoodRevenue: 1900, averageBevRevenue: 1100, count: 1 },
      'Light rain': { averageFoodRevenue: 1700, averageBevRevenue: 900, count: 1 }
    },
    'Friday': {
      'Sunny': { averageFoodRevenue: 3500, averageBevRevenue: 2500, count: 3 },
      'Partly cloudy': { averageFoodRevenue: 3200, averageBevRevenue: 2200, count: 3 },
      'Light rain': { averageFoodRevenue: 2800, averageBevRevenue: 1800, count: 2 }
    },
    // Add more days as needed
  };
  
  return weatherImpact;
};

// Map specific weather descriptions to general categories
const mapToGeneralWeatherCondition = (description: string): string => {
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes('sunny') || lowerDesc.includes('clear')) {
    return 'Sunny';
  } else if (lowerDesc.includes('partly cloudy')) {
    return 'Partly cloudy';
  } else if (lowerDesc.includes('cloud')) {
    return 'Cloudy';
  } else if (lowerDesc.includes('light rain') || lowerDesc.includes('drizzle')) {
    return 'Light rain';
  } else if (lowerDesc.includes('rain') || lowerDesc.includes('shower')) {
    return 'Heavy rain';
  } else if (lowerDesc.includes('thunder') || lowerDesc.includes('storm')) {
    return 'Thunderstorm';
  } else if (lowerDesc.includes('snow')) {
    return 'Snow';
  } else if (lowerDesc.includes('fog') || lowerDesc.includes('mist')) {
    return 'Foggy';
  }
  
  return 'Unknown';
};

// Helper function to get day name from date string
const getDayName = (dateStr: string): string => {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const date = new Date(`${dateStr}T12:00:00Z`);
  
  // JavaScript's getDay() returns 0 for Sunday, 1 for Monday, etc.
  // We need to adjust to make Monday = 0, Sunday = 6
  const jsDay = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const adjustedDay = jsDay === 0 ? 6 : jsDay - 1; // Convert to 0 = Monday, ..., 6 = Sunday
  
  return dayNames[adjustedDay];
};

// Generate forecast for the next several weeks
export const generateFutureWeeksForecast = async (
  numWeeks: number = 4
): Promise<{ currentWeek: RevenueForecast[], futureWeeks: RevenueForecast[][] }> => {
  // Get the Monday of the current week
  const today = new Date();
  const currentMonday = startOfWeek(today, { weekStartsOn: 1 });
  const currentSunday = endOfWeek(today, { weekStartsOn: 1 });
  
  // Format dates
  const currentMondayStr = format(currentMonday, 'yyyy-MM-dd');
  const currentSundayStr = format(currentSunday, 'yyyy-MM-dd');
  
  // Generate forecast for current week
  const currentWeek = await generateRevenueForecast(currentMondayStr, currentSundayStr, false);
  
  // Generate forecasts for future weeks (using averages only for weeks beyond the first future week)
  const futureWeeks: RevenueForecast[][] = [];
  
  for (let i = 1; i <= numWeeks; i++) {
    const futureMonday = new Date(currentMonday);
    futureMonday.setDate(currentMonday.getDate() + (i * 7));
    
    const futureSunday = new Date(currentSunday);
    futureSunday.setDate(currentSunday.getDate() + (i * 7));
    
    const futureMondayStr = format(futureMonday, 'yyyy-MM-dd');
    const futureSundayStr = format(futureSunday, 'yyyy-MM-dd');
    
    // Use weather for the first future week, but fall back to averages for weeks further out
    const useAveragesOnly = i > 1;
    
    const weekForecast = await generateRevenueForecast(futureMondayStr, futureSundayStr, useAveragesOnly);
    futureWeeks.push(weekForecast);
  }
  
  return { currentWeek, futureWeeks };
};

export const generateRevenueForecast = async (
  startDate: string,
  endDate: string,
  useAveragesOnly: boolean = false
): Promise<RevenueForecast[]> => {
  console.log(`Generating revenue forecast from ${startDate} to ${endDate}`);
  
  let weatherForecast: WeatherForecast[] = [];
  try {
    weatherForecast = await fetchWeatherForecast(startDate, endDate);
  } catch (error) {
    console.warn('Unable to fetch weather forecast, using default values');
    // Generate default placeholders if weather fetch fails
    const start = new Date(startDate);
    const end = new Date(endDate);
    weatherForecast = [];
    for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
      weatherForecast.push({
        date: format(day, 'yyyy-MM-dd'),
        description: 'N/A',
        temperature: 15,
        precipitation: 0,
        windSpeed: 0
      });
    }
  }
  
  const currentDate = new Date();
  const dayOfWeekBaselines = await calculateDayOfWeekBaselines(currentDate);
  
  // Only fetch weather impact if we're not using averages only
  const weatherImpact = useAveragesOnly ? null : await analyzeWeatherImpact(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    3
  );
  
  const revenueForecast: RevenueForecast[] = [];
  
  for (const forecast of weatherForecast) {
    const date = forecast.date;
    const dayOfWeek = getDayName(date);
    const baseline = dayOfWeekBaselines[dayOfWeek];
    
    let foodRevenue = baseline.avgFoodRevenue;
    let bevRevenue = baseline.avgBevRevenue;
    let confidence = baseline.count >= 10 ? 85 : 
                   baseline.count >= 5 ? 75 : 
                   baseline.count > 0 ? 65 : 50;
    
    // Only apply weather impacts if we're not using averages only and weather data is available
    if (!useAveragesOnly && weatherImpact && forecast.description !== 'N/A') {
      const weatherCondition = mapToGeneralWeatherCondition(forecast.description);
      
      if (weatherImpact[dayOfWeek]?.[weatherCondition]?.count > 0) {
        const impact = weatherImpact[dayOfWeek][weatherCondition];
        const foodImpactMultiplier = impact.averageFoodRevenue / baseline.avgFoodRevenue;
        const bevImpactMultiplier = impact.averageBevRevenue / baseline.avgBevRevenue;
        
        if (!isNaN(foodImpactMultiplier) && isFinite(foodImpactMultiplier)) {
          foodRevenue *= foodImpactMultiplier;
        }
        if (!isNaN(bevImpactMultiplier) && isFinite(bevImpactMultiplier)) {
          bevRevenue *= bevImpactMultiplier;
        }
        
        if (impact.count >= 5) {
          confidence = Math.min(confidence + 10, 95);
        }
      }
    }
    
    // For future weeks with N/A weather, still use historical data but with lower confidence
    if (forecast.description === 'N/A') {
      // Apply random variation based on historical patterns (±10%) to simulate real data patterns
      // but maintain the underlying historical trends
      const variation = 0.9 + (Math.random() * 0.2); // 0.9 to 1.1 range
      foodRevenue *= variation;
      bevRevenue *= variation;
      
      // Reduce confidence for N/A weather data
      confidence = Math.max(confidence - 20, 30);
    }
    
    revenueForecast.push({
      date,
      dayOfWeek,
      foodRevenue,
      beverageRevenue: bevRevenue,
      totalRevenue: foodRevenue + bevRevenue,
      weatherDescription: forecast.description,
      temperature: forecast.temperature,
      precipitation: forecast.precipitation,
      windSpeed: forecast.windSpeed,
      confidence: useAveragesOnly && forecast.description === 'N/A' ? 40 : confidence
    });
  }
  
  return revenueForecast;
};
