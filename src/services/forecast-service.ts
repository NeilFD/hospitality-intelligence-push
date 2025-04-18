
import { supabase } from '@/lib/supabase';
import { MasterDailyRecord, WeatherForecast, RevenueForecast } from '@/types/master-record-types';
import { fetchMasterMonthlyRecords } from './master-record-service';
import { getDayName } from '@/lib/date-utils';

// Use actual weather API for forecast instead of mock data
export const fetchWeatherForecast = async (startDate: string, endDate: string): Promise<WeatherForecast[]> => {
  console.log(`Fetching actual weather forecast from ${startDate} to ${endDate}`);
  
  // Fetch actual weather data from Supabase master_daily_records
  const { data, error } = await supabase
    .from('master_daily_records')
    .select('date, weather_description, temperature, precipitation, wind_speed')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date');
  
  if (error) {
    console.error('Weather forecast fetch error:', error);
    throw error;
  }
  
  return data.map(record => ({
    date: record.date,
    description: record.weather_description || 'Unknown',
    temperature: record.temperature || 15,
    precipitation: record.precipitation || 0,
    windSpeed: record.wind_speed || 0
  }));
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
  const weatherImpact: Record<string, Record<string, {
    weatherCondition: string,
    averageFoodRevenue: number,
    averageBevRevenue: number,
    count: number
  }>> = {};
  
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const weatherConditions = [
    'Clear sky', 'Partly cloudy', 'Cloudy', 'Light rain', 
    'Heavy rain', 'Thunderstorm', 'Foggy', 'Sunny'
  ];
  
  // Initialize data structure
  daysOfWeek.forEach(day => {
    weatherImpact[day] = {};
    weatherConditions.forEach(condition => {
      weatherImpact[day][condition] = { 
        weatherCondition: condition, 
        averageFoodRevenue: 0, 
        averageBevRevenue: 0, 
        count: 0 
      };
    });
  });
  
  // Fetch historical data for the past numMonths
  const startMonth = month - numMonths + 1 > 0 ? month - numMonths + 1 : 12 + (month - numMonths + 1);
  const startYear = month - numMonths + 1 > 0 ? year : year - 1;
  
  let currentYear = startYear;
  let currentMonth = startMonth;
  
  for (let i = 0; i < numMonths; i++) {
    const monthData = await fetchMasterMonthlyRecords(currentYear, currentMonth);
    
    monthData.forEach(record => {
      const dayOfWeek = record.dayOfWeek;
      const weatherDesc = record.weatherDescription || 'Sunny';
      
      if (record.foodRevenue > 0 || record.beverageRevenue > 0) {
        const generalWeather = mapToGeneralWeatherCondition(weatherDesc);
        
        const dayWeatherData = weatherImpact[dayOfWeek][generalWeather];
        
        dayWeatherData.averageFoodRevenue += record.foodRevenue;
        dayWeatherData.averageBevRevenue += record.beverageRevenue;
        dayWeatherData.count++;
      }
    });
    
    currentMonth++;
    if (currentMonth > 12) {
      currentMonth = 1;
      currentYear++;
    }
  }
  
  // Calculate averages
  daysOfWeek.forEach(day => {
    weatherConditions.forEach(weather => {
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
  
  return 'Sunny';
};

// Generate revenue forecast based on actual weather data and historical patterns
export const generateRevenueForecast = async (
  startDate: string, 
  endDate: string
): Promise<RevenueForecast[]> => {
  const weatherForecast = await fetchWeatherForecast(startDate, endDate);
  
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  
  const weatherImpact = await analyzeWeatherImpact(currentYear, currentMonth, 3);
  
  const revenueForecast: RevenueForecast[] = weatherForecast.map(forecast => {
    const date = forecast.date;
    const dayOfWeek = getDayName(date);
    const weatherCondition = mapToGeneralWeatherCondition(forecast.description);
    
    let foodRevenue = 0;
    let bevRevenue = 0;
    let confidence = 70;
    
    if (weatherImpact[dayOfWeek] && weatherImpact[dayOfWeek][weatherCondition]) {
      const impact = weatherImpact[dayOfWeek][weatherCondition];
      
      if (impact.count > 0) {
        foodRevenue = impact.averageFoodRevenue;
        bevRevenue = impact.averageBevRevenue;
        
        confidence = impact.count >= 10 ? 90 : impact.count >= 5 ? 80 : 60;
      }
    }
    
    // Apply temperature and precipitation adjustments using actual data
    if (forecast.temperature > 25) {
      bevRevenue *= 1.1;
      foodRevenue *= 0.95;
    } else if (forecast.temperature < 10) {
      foodRevenue *= 1.05;
      bevRevenue *= 0.9;
    }
    
    if (forecast.precipitation > 5) {
      foodRevenue *= 0.85;
      bevRevenue *= 0.8;
      confidence = Math.max(confidence - 10, 30);
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
