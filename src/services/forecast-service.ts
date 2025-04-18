
import { supabase } from '@/lib/supabase';
import { MasterDailyRecord, WeatherForecast, RevenueForecast } from '@/types/master-record-types';
import { fetchMasterMonthlyRecords } from './master-record-service';
import { getDayName } from '@/lib/date-utils';

// Mock weather forecast API data (replace with actual API)
export const fetchWeatherForecast = async (startDate: string, endDate: string): Promise<WeatherForecast[]> => {
  console.log(`Fetching weather forecast from ${startDate} to ${endDate}`);
  
  // In a real implementation, you would call a weather API here
  // For now, we'll generate mock data
  const forecasts: WeatherForecast[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
    const date = day.toISOString().split('T')[0];
    forecasts.push({
      date,
      description: getRandomWeatherDescription(),
      temperature: 15 + Math.floor(Math.random() * 15), // 15-30°C
      precipitation: Math.random() * 10, // 0-10mm
      windSpeed: Math.random() * 30, // 0-30km/h
    });
  }
  
  return forecasts;
};

// Get a random weather description for mock data
const getRandomWeatherDescription = (): string => {
  const descriptions = [
    'Clear sky', 'Partly cloudy', 'Cloudy', 'Light rain', 
    'Heavy rain', 'Thunderstorm', 'Foggy', 'Sunny'
  ];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
};

// Analyze historical data to understand weather impact on sales
export const analyzeWeatherImpact = async (
  year: number, 
  month: number, 
  numMonths: number = 3
): Promise<Record<string, Record<string, {
  weatherCondition: string,
  averageFoodRevenue: number,
  averageBevRevenue: number,
  count: number
}>>> => {
  // Initialize data structure to store weather impact by day of week
  const weatherImpact: Record<string, Record<string, {
    weatherCondition: string,
    averageFoodRevenue: number,
    averageBevRevenue: number,
    count: number
  }>> = {};
  
  // Initialize days of week
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  daysOfWeek.forEach(day => {
    weatherImpact[day] = {
      'Clear sky': { weatherCondition: 'Clear sky', averageFoodRevenue: 0, averageBevRevenue: 0, count: 0 },
      'Partly cloudy': { weatherCondition: 'Partly cloudy', averageFoodRevenue: 0, averageBevRevenue: 0, count: 0 },
      'Cloudy': { weatherCondition: 'Cloudy', averageFoodRevenue: 0, averageBevRevenue: 0, count: 0 },
      'Light rain': { weatherCondition: 'Light rain', averageFoodRevenue: 0, averageBevRevenue: 0, count: 0 },
      'Heavy rain': { weatherCondition: 'Heavy rain', averageFoodRevenue: 0, averageBevRevenue: 0, count: 0 },
      'Thunderstorm': { weatherCondition: 'Thunderstorm', averageFoodRevenue: 0, averageBevRevenue: 0, count: 0 },
      'Foggy': { weatherCondition: 'Foggy', averageFoodRevenue: 0, averageBevRevenue: 0, count: 0 },
      'Sunny': { weatherCondition: 'Sunny', averageFoodRevenue: 0, averageBevRevenue: 0, count: 0 }
    };
  });
  
  // Fetch historical data for the past numMonths
  const startMonth = month - numMonths + 1 > 0 ? month - numMonths + 1 : 12 + (month - numMonths + 1);
  const startYear = month - numMonths + 1 > 0 ? year : year - 1;
  
  let currentYear = startYear;
  let currentMonth = startMonth;
  
  // Loop through the past months to collect data
  for (let i = 0; i < numMonths; i++) {
    console.log(`Analyzing data for ${currentMonth}/${currentYear}`);
    const monthData = await fetchMasterMonthlyRecords(currentYear, currentMonth);
    
    monthData.forEach(record => {
      const dayOfWeek = record.dayOfWeek;
      const weatherDesc = record.weatherDescription || 'Sunny'; // Default to sunny if missing
      
      if (record.foodRevenue > 0 || record.beverageRevenue > 0) {
        const weatherKey = mapToGeneralWeatherCondition(weatherDesc);
        
        const dayWeatherData = weatherImpact[dayOfWeek][weatherKey];
        
        // Update running totals
        dayWeatherData.averageFoodRevenue += record.foodRevenue;
        dayWeatherData.averageBevRevenue += record.beverageRevenue;
        dayWeatherData.count++;
      }
    });
    
    // Move to next month
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }
  
  // Calculate averages
  daysOfWeek.forEach(day => {
    Object.keys(weatherImpact[day]).forEach(weather => {
      const data = weatherImpact[day][weather];
      if (data.count > 0) {
        data.averageFoodRevenue = data.averageFoodRevenue / data.count;
        data.averageBevRevenue = data.averageBevRevenue / data.count;
      }
    });
  });
  
  return weatherImpact;
};

// Map detailed weather descriptions to general categories
const mapToGeneralWeatherCondition = (description: string): string => {
  const desc = description.toLowerCase();
  
  if (desc.includes('sun') || desc.includes('clear')) return 'Clear sky';
  if (desc.includes('partly') || desc.includes('scattered')) return 'Partly cloudy';
  if (desc.includes('cloud')) return 'Cloudy';
  if (desc.includes('light rain') || desc.includes('drizzle')) return 'Light rain';
  if (desc.includes('rain') || desc.includes('shower')) return 'Heavy rain';
  if (desc.includes('thunder') || desc.includes('storm')) return 'Thunderstorm';
  if (desc.includes('fog') || desc.includes('mist')) return 'Foggy';
  
  // Default to sunny for unknown descriptions
  return 'Sunny';
};

// Generate revenue forecast based on weather data and historical patterns
export const generateRevenueForecast = async (
  startDate: string, 
  endDate: string
): Promise<RevenueForecast[]> => {
  // Get weather forecast for the specified date range
  const weatherForecast = await fetchWeatherForecast(startDate, endDate);
  
  // Get current month and year for analysis
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  // Analyze historical weather impact
  const weatherImpact = await analyzeWeatherImpact(currentYear, currentMonth, 3);
  
  // Generate revenue forecasts based on weather and historical data
  const revenueForecast: RevenueForecast[] = weatherForecast.map(forecast => {
    const date = forecast.date;
    const dayOfWeek = getDayName(date);
    
    // Map the forecast weather to our general categories
    const weatherCondition = mapToGeneralWeatherCondition(forecast.description);
    
    // Get the historical average revenues for this day and weather
    let foodRevenue = 0;
    let bevRevenue = 0;
    let confidence = 70; // Default confidence
    
    // If we have data for this day and weather, use it
    if (weatherImpact[dayOfWeek] && weatherImpact[dayOfWeek][weatherCondition]) {
      const impact = weatherImpact[dayOfWeek][weatherCondition];
      
      if (impact.count > 0) {
        foodRevenue = impact.averageFoodRevenue;
        bevRevenue = impact.averageBevRevenue;
        
        // Adjust confidence based on sample size
        if (impact.count >= 10) confidence = 90;
        else if (impact.count >= 5) confidence = 80;
        else confidence = 60;
      } else {
        // No exact match, use average for the day regardless of weather
        let total = 0;
        let count = 0;
        let fRevenue = 0;
        let bRevenue = 0;
        
        Object.values(weatherImpact[dayOfWeek]).forEach(w => {
          if (w.count > 0) {
            fRevenue += w.averageFoodRevenue * w.count;
            bRevenue += w.averageBevRevenue * w.count;
            count += w.count;
          }
        });
        
        if (count > 0) {
          foodRevenue = fRevenue / count;
          bevRevenue = bRevenue / count;
          confidence = 50; // Lower confidence due to weather mismatch
        }
      }
    }
    
    // Apply temperature adjustments
    if (forecast.temperature > 25) {
      // Hot weather increases beverage sales, decreases food
      bevRevenue *= 1.1;
      foodRevenue *= 0.95;
    } else if (forecast.temperature < 10) {
      // Cold weather increases food sales, decreases beverage
      foodRevenue *= 1.05;
      bevRevenue *= 0.9;
    }
    
    // Apply precipitation adjustments
    if (forecast.precipitation > 5) {
      // Heavy rain reduces both sales
      foodRevenue *= 0.85;
      bevRevenue *= 0.8;
      confidence = Math.max(confidence - 10, 30); // Reduce confidence
    }
    
    return {
      date,
      dayOfWeek,
      foodRevenue,
      beverageRevenue: bevRevenue,
      totalRevenue: foodRevenue + bevRevenue,
      weatherDescription: forecast.description,
      temperature: forecast.temperature,
      confidence
    };
  });
  
  return revenueForecast;
};

// Save the forecast for future reference
export const saveForecast = async (forecast: RevenueForecast[]): Promise<void> => {
  try {
    for (const day of forecast) {
      const { data, error } = await supabase
        .from('revenue_forecasts')
        .upsert({
          date: day.date,
          day_of_week: day.dayOfWeek,
          food_revenue: day.foodRevenue,
          beverage_revenue: day.beverageRevenue,
          total_revenue: day.totalRevenue,
          weather_description: day.weatherDescription,
          temperature: day.temperature,
          confidence: day.confidence,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'date'
        });
        
      if (error) throw error;
    }
  } catch (error) {
    console.error('Error saving forecast:', error);
    throw error;
  }
};
