import { supabase } from '@/lib/supabase';
import { MasterDailyRecord, WeatherForecast, RevenueForecast } from '@/types/master-record-types';
import { fetchMasterMonthlyRecords } from './master-record-service';
import { getDayName } from '@/lib/date-utils';
import { format, addDays, parseISO, subMonths } from 'date-fns';

export const fetchWeatherForecast = async (startDate: string, endDate: string): Promise<WeatherForecast[]> => {
  console.log(`Fetching actual weather forecast from ${startDate} to ${endDate}`);
  
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
  
  let forecast = data.map(record => ({
    date: record.date,
    description: record.weather_description || 'Unknown',
    temperature: record.temperature || 15,
    precipitation: record.precipitation || 0,
    windSpeed: record.wind_speed || 0
  }));
  
  if (forecast.length < 7) {
    const start = parseISO(startDate);
    for (let i = 0; i < 7; i++) {
      const currentDate = format(addDays(start, i), 'yyyy-MM-dd');
      if (!forecast.find(f => f.date === currentDate)) {
        forecast.push({
          date: currentDate,
          description: 'Partly cloudy',
          temperature: 15,
          precipitation: 0,
          windSpeed: 5
        });
      }
    }
    
    forecast = forecast.sort((a, b) => a.date.localeCompare(b.date));
    forecast = forecast.slice(0, 7);
  }
  
  return forecast;
};

const calculateDayOfWeekBaselines = async (currentDate: Date): Promise<Record<string, {
  avgFoodRevenue: number;
  avgBevRevenue: number;
  count: number;
}>> => {
  const threeMonthsAgo = subMonths(currentDate, 3);
  
  const { data, error } = await supabase
    .from('master_daily_records')
    .select('day_of_week, food_revenue, beverage_revenue')
    .gte('date', format(threeMonthsAgo, 'yyyy-MM-dd'))
    .lte('date', format(currentDate, 'yyyy-MM-dd'));
    
  if (error) {
    console.error('Error fetching historical data:', error);
    throw error;
  }
  
  const baselines: Record<string, { total: { food: number; bev: number }; count: number }> = {};
  
  ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach(day => {
    baselines[day] = { total: { food: 0, bev: 0 }, count: 0 };
  });
  
  data.forEach(record => {
    if (record.day_of_week && (record.food_revenue > 0 || record.beverage_revenue > 0)) {
      baselines[record.day_of_week].total.food += record.food_revenue || 0;
      baselines[record.day_of_week].total.bev += record.beverage_revenue || 0;
      baselines[record.day_of_week].count += 1;
    }
  });
  
  return Object.entries(baselines).reduce((acc, [day, data]) => {
    acc[day] = {
      avgFoodRevenue: data.count > 0 ? data.total.food / data.count : 0,
      avgBevRevenue: data.count > 0 ? data.total.bev / data.count : 0,
      count: data.count
    };
    return acc;
  }, {} as Record<string, { avgFoodRevenue: number; avgBevRevenue: number; count: number }>);
};

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

export const generateRevenueForecast = async (
  startDate: string, 
  endDate: string
): Promise<RevenueForecast[]> => {
  console.log(`Generating revenue forecast from ${startDate} to ${endDate}`);
  
  const weatherForecast = await fetchWeatherForecast(startDate, endDate);
  const currentDate = new Date();
  
  const dayOfWeekBaselines = await calculateDayOfWeekBaselines(currentDate);
  
  const weatherImpact = await analyzeWeatherImpact(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    3
  );
  
  const revenueForecast: RevenueForecast[] = [];
  
  for (const forecast of weatherForecast) {
    const date = forecast.date;
    const dayOfWeek = getDayName(date);
    const weatherCondition = mapToGeneralWeatherCondition(forecast.description);
    
    const baseline = dayOfWeekBaselines[dayOfWeek];
    let foodRevenue = baseline.avgFoodRevenue;
    let bevRevenue = baseline.avgBevRevenue;
    
    let confidence = baseline.count >= 10 ? 85 : 
                    baseline.count >= 5 ? 75 : 
                    baseline.count > 0 ? 65 : 50;
    
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
    
    if (forecast.temperature > 25) {
      bevRevenue *= 1.1;
      foodRevenue *= 0.95;
    } else if (forecast.temperature < 10) {
      foodRevenue *= 1.05;
      bevRevenue *= 0.9;
    }
    
    if (forecast.precipitation > 5) {
      foodRevenue *= 0.9;
      bevRevenue *= 0.85;
      confidence = Math.max(confidence - 10, 30);
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
      confidence
    });
  }
  
  return revenueForecast;
};

async function fetchAverageDailyRevenue(): Promise<{ foodRevenue: number, beverageRevenue: number }> {
  const { data, error } = await supabase
    .from('master_daily_records')
    .select('food_revenue, beverage_revenue')
    .order('date', { ascending: false })
    .limit(30);
  
  if (error) {
    console.error('Error fetching average revenue:', error);
    return { foodRevenue: 3000, beverageRevenue: 2000 };
  }
  
  if (data.length === 0) {
    return { foodRevenue: 3000, beverageRevenue: 2000 };
  }
  
  const foodRevenue = data.reduce((sum, record) => sum + (record.food_revenue || 0), 0) / data.length;
  const beverageRevenue = data.reduce((sum, record) => sum + (record.beverage_revenue || 0), 0) / data.length;
  
  return { foodRevenue, beverageRevenue };
}

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
