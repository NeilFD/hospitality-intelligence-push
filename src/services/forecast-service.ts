import { supabase } from '@/lib/supabase';
import { RevenueForecast } from '@/types/master-record-types';

// Fetch real weather forecast using Open-Meteo API
// This uses the same API as the WeatherFetcher component
const fetchWeatherForecast = async (startDate: string, endDate: string): Promise<WeatherForecast[]> => {
  console.log(`Fetching weather forecast from ${startDate} to ${endDate}`);
  
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const forecast: WeatherForecast[] = [];
    
    // Coordinates for GL50 3DN: 51.9002, -2.0731 (same as in WeatherFetcher component)
    const latitude = 51.9002;
    const longitude = -2.0731;
    
    // For future forecasts, use the forecast API
    const forecastUrl = `https://api.open-meteo.com/v1/forecast?` +
      `latitude=${latitude}&longitude=${longitude}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max` +
      `&timezone=Europe/London` +
      `&start_date=${startDate}&end_date=${endDate}`;
      
    const response = await fetch(forecastUrl);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Generate a forecast for each day in the date range
    for (let i = 0; i < data.daily.time.length; i++) {
      const day = new Date(data.daily.time[i]);
      
      // For dates more than 7 days in the future beyond what the API provides, return N/A
      const isMoreThanWeekAway = i >= data.daily.time.length || new Date(day).getTime() - new Date().getTime() > 7 * 24 * 60 * 60 * 1000;
      
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
      
      // Process real weather data
      const avgTemp = Math.round((data.daily.temperature_2m_max[i] + data.daily.temperature_2m_min[i]) / 2);
      const precipitation = data.daily.precipitation_sum[i] || 0;
      const windSpeed = data.daily.wind_speed_10m_max[i] || 0;
      
      // Determine weather description based on conditions (similar to WeatherFetcher)
      let description = "Clear";
      if (precipitation > 5) {
        description = "Heavy rain";
      } else if (precipitation > 1) {
        description = "Light rain";
      } else if (precipitation > 0) {
        description = "Drizzle";
      } else if (windSpeed > 30) {
        description = "Windy";
      } else if (avgTemp > 25) {
        description = "Hot";
      } else if (avgTemp < 5) {
        description = "Cold";
      } else {
        description = "Sunny";
      }
      
      forecast.push({
        date: format(day, 'yyyy-MM-dd'),
        description: description,
        temperature: avgTemp,
        precipitation: precipitation,
        windSpeed: windSpeed
      });
    }
    
    return forecast;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    
    // Fall back to deterministic generation if the API fails
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
      
      // Use deterministic weather generation as fallback
      const dateStr = format(day, 'yyyyMMdd');
      const dateSeed = Array.from(dateStr).reduce((sum, char) => sum + char.charCodeAt(0), 0);
      
      const conditions = ['Sunny', 'Partly cloudy', 'Cloudy', 'Light rain', 'Heavy rain'];
      const conditionIndex = dateSeed % conditions.length;
      const description = conditions[conditionIndex];
      
      const dayOfYear = day.getDate() + day.getMonth() * 30;
      const seasonalTemp = Math.sin((dayOfYear / 365) * Math.PI * 2) * 10 + 15;
      const randomOffset = (dateSeed % 5) - 2;
      const temperature = Math.floor(seasonalTemp + randomOffset);
      
      const precipitation = description.includes('rain') ? 
        (description.includes('Heavy') ? 5 + (dateSeed % 5) : (dateSeed % 5)) : 0;
      
      const windSpeed = 5 + (dateSeed % 15);
      
      forecast.push({
        date: format(day, 'yyyy-MM-dd'),
        description: description,
        temperature: temperature,
        precipitation: precipitation,
        windSpeed: windSpeed
      });
    }
    
    return forecast;
  }
};

// Fetch real historical daily averages from master_daily_records table
const fetchHistoricalDayOfWeekAverages = async () => {
  try {
    // Get data for the last 3 months to calculate reliable averages
    const today = new Date();
    const historicalData = [];
    
    // Fetch data for the last 3 months
    for (let i = 0; i < 3; i++) {
      const monthToFetch = today.getMonth() - i;
      const yearToFetch = today.getFullYear() - (monthToFetch < 0 ? 1 : 0);
      const adjustedMonth = monthToFetch < 0 ? 12 + monthToFetch : monthToFetch + 1;
      
      try {
        const monthData = await fetchMasterMonthlyRecords(yearToFetch, adjustedMonth);
        historicalData.push(...monthData);
      } catch (error) {
        console.warn(`Failed to fetch historical data for ${yearToFetch}-${adjustedMonth}`);
      }
    }
    
    console.log(`Fetched ${historicalData.length} historical daily records for averages`);
    
    if (historicalData.length === 0) {
      // If no historical data is available, fall back to sample data
      return {
        'Monday': { avgFoodRevenue: 1100, avgBevRevenue: 750, count: 4 },
        'Tuesday': { avgFoodRevenue: 980, avgBevRevenue: 650, count: 4 },
        'Wednesday': { avgFoodRevenue: 1050, avgBevRevenue: 700, count: 4 },
        'Thursday': { avgFoodRevenue: 1200, avgBevRevenue: 850, count: 4 },
        'Friday': { avgFoodRevenue: 1750, avgBevRevenue: 1200, count: 4 },
        'Saturday': { avgFoodRevenue: 2100, avgBevRevenue: 1500, count: 4 },
        'Sunday': { avgFoodRevenue: 1650, avgBevRevenue: 950, count: 4 }
      };
    }
    
    // Calculate averages by day of week
    const dayAverages: Record<string, {avgFoodRevenue: number, avgBevRevenue: number, count: number}> = {
      'Monday': { avgFoodRevenue: 0, avgBevRevenue: 0, count: 0 },
      'Tuesday': { avgFoodRevenue: 0, avgBevRevenue: 0, count: 0 },
      'Wednesday': { avgFoodRevenue: 0, avgBevRevenue: 0, count: 0 },
      'Thursday': { avgFoodRevenue: 0, avgBevRevenue: 0, count: 0 },
      'Friday': { avgFoodRevenue: 0, avgBevRevenue: 0, count: 0 },
      'Saturday': { avgFoodRevenue: 0, avgBevRevenue: 0, count: 0 },
      'Sunday': { avgFoodRevenue: 0, avgBevRevenue: 0, count: 0 }
    };
    
    // Accumulate totals for each day
    historicalData.forEach(record => {
      if (record.foodRevenue > 0 || record.beverageRevenue > 0) {
        const day = record.dayOfWeek;
        dayAverages[day].avgFoodRevenue += record.foodRevenue || 0;
        dayAverages[day].avgBevRevenue += record.beverageRevenue || 0;
        dayAverages[day].count += 1;
      }
    });
    
    // Calculate the averages
    Object.keys(dayAverages).forEach(day => {
      if (dayAverages[day].count > 0) {
        dayAverages[day].avgFoodRevenue = dayAverages[day].avgFoodRevenue / dayAverages[day].count;
        dayAverages[day].avgBevRevenue = dayAverages[day].avgBevRevenue / dayAverages[day].count;
      } else {
        // Use conservative defaults if no data for a particular day
        dayAverages[day].avgFoodRevenue = 1000; // Conservative default
        dayAverages[day].avgBevRevenue = 700;  // Conservative default
        dayAverages[day].count = 1;
      }
    });
    
    console.log('Calculated day-of-week averages:', dayAverages);
    return dayAverages;
  } catch (error) {
    console.error('Error calculating historical averages:', error);
    
    // Fall back to more conservative baseline values
    return {
      'Monday': { avgFoodRevenue: 1100, avgBevRevenue: 750, count: 4 },
      'Tuesday': { avgFoodRevenue: 980, avgBevRevenue: 650, count: 4 },
      'Wednesday': { avgFoodRevenue: 1050, avgBevRevenue: 700, count: 4 },
      'Thursday': { avgFoodRevenue: 1200, avgBevRevenue: 850, count: 4 },
      'Friday': { avgFoodRevenue: 1750, avgBevRevenue: 1200, count: 4 },
      'Saturday': { avgFoodRevenue: 2100, avgBevRevenue: 1500, count: 4 },
      'Sunday': { avgFoodRevenue: 1650, avgBevRevenue: 950, count: 4 }
    };
  }
};

// Analyze how weather impacts revenue
export const analyzeWeatherImpact = async (year: number, month: number, months: number) => {
  try {
    // Fetch historical data
    const today = new Date();
    const historicalData = [];
    
    // Fetch data for the specified period
    for (let i = 0; i < months; i++) {
      const monthToFetch = month - i;
      const yearToFetch = year - (monthToFetch <= 0 ? 1 : 0);
      const adjustedMonth = monthToFetch <= 0 ? 12 + monthToFetch : monthToFetch;
      
      try {
        const monthData = await fetchMasterMonthlyRecords(yearToFetch, adjustedMonth);
        historicalData.push(...monthData);
      } catch (error) {
        console.warn(`Failed to fetch historical weather impact data for ${yearToFetch}-${adjustedMonth}`);
      }
    }
    
    if (historicalData.length === 0) {
      // If no data is available, return a simplified model
      return {
        'Monday': {
          'Sunny': { averageFoodRevenue: 1200, averageBevRevenue: 800, count: 2 },
          'Partly cloudy': { averageFoodRevenue: 1100, averageBevRevenue: 750, count: 1 },
          'Cloudy': { averageFoodRevenue: 1000, averageBevRevenue: 700, count: 1 },
          'Light rain': { averageFoodRevenue: 900, averageBevRevenue: 600, count: 1 }
        },
        'Friday': {
          'Sunny': { averageFoodRevenue: 1900, averageBevRevenue: 1300, count: 2 },
          'Partly cloudy': { averageFoodRevenue: 1750, averageBevRevenue: 1200, count: 1 },
          'Light rain': { averageFoodRevenue: 1600, averageBevRevenue: 1050, count: 1 }
        },
        // Add more days as needed
      };
    }
    
    // Group data by day of week and weather condition
    const weatherImpact: Record<string, Record<string, {
      totalFoodRevenue: number,
      totalBevRevenue: number, 
      count: number,
      averageFoodRevenue?: number,
      averageBevRevenue?: number
    }>> = {};
    
    historicalData.forEach(record => {
      if (!record.weatherDescription || !record.dayOfWeek) return;
      
      const day = record.dayOfWeek;
      const weather = mapToGeneralWeatherCondition(record.weatherDescription);
      
      if (!weatherImpact[day]) weatherImpact[day] = {};
      if (!weatherImpact[day][weather]) {
        weatherImpact[day][weather] = {
          totalFoodRevenue: 0,
          totalBevRevenue: 0,
          count: 0
        };
      }
      
      weatherImpact[day][weather].totalFoodRevenue += record.foodRevenue || 0;
      weatherImpact[day][weather].totalBevRevenue += record.beverageRevenue || 0;
      weatherImpact[day][weather].count += 1;
    });
    
    // Calculate averages for each day/weather combination
    Object.keys(weatherImpact).forEach(day => {
      Object.keys(weatherImpact[day]).forEach(weather => {
        const data = weatherImpact[day][weather];
        if (data.count > 0) {
          data.averageFoodRevenue = data.totalFoodRevenue / data.count;
          data.averageBevRevenue = data.totalBevRevenue / data.count;
        }
      });
    });
    
    // Clean up the data structure to match the expected format
    const formattedResult: any = {};
    
    Object.keys(weatherImpact).forEach(day => {
      formattedResult[day] = {};
      
      Object.keys(weatherImpact[day]).forEach(weather => {
        const data = weatherImpact[day][weather];
        if (data.count > 0) {
          formattedResult[day][weather] = {
            averageFoodRevenue: data.averageFoodRevenue,
            averageBevRevenue: data.averageBevRevenue,
            count: data.count
          };
        }
      });
    });
    
    return formattedResult;
  } catch (error) {
    console.error("Error analyzing weather impact:", error);
    
    // Fall back to a simplified model
    return {
      'Monday': {
        'Sunny': { averageFoodRevenue: 1200, averageBevRevenue: 800, count: 2 },
        'Partly cloudy': { averageFoodRevenue: 1100, averageBevRevenue: 750, count: 1 }
      },
      'Friday': {
        'Sunny': { averageFoodRevenue: 1900, averageBevRevenue: 1300, count: 2 },
        'Partly cloudy': { averageFoodRevenue: 1750, averageBevRevenue: 1200, count: 1 }
      }
    };
  }
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

// Add new fetch functions for tags
const fetchRevenueTags = async (): Promise<RevenueTag[]> => {
  try {
    const { data, error } = await supabase
      .from('revenue_tags')
      .select('*')
      .order('name');
      
    if (error) {
      console.error('Error fetching revenue tags:', error);
      return [];
    }
    
    return data as RevenueTag[];
  } catch (error) {
    console.error('Error in fetchRevenueTags:', error);
    return [];
  }
};

const fetchTaggedDates = async (startDate: string, endDate: string): Promise<TaggedDate[]> => {
  try {
    const { data, error } = await supabase
      .from('tagged_dates')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);
      
    if (error) {
      console.error('Error fetching tagged dates:', error);
      return [];
    }
    
    // Convert from database format to our type format
    return data.map(item => ({
      id: item.id,
      date: item.date,
      tagId: item.tag_id,
      manualFoodRevenueImpact: item.manual_food_revenue_impact,
      manualBeverageRevenueImpact: item.manual_beverage_revenue_impact
    }));
  } catch (error) {
    console.error('Error in fetchTaggedDates:', error);
    return [];
  }
};

// Modify the generateRevenueForecast function
export const generateRevenueForecast = async (
  startDate: string,
  endDate: string,
  useAveragesOnly: boolean = false
): Promise<RevenueForecast[]> => {
  console.log(`Generating revenue forecast from ${startDate} to ${endDate}`);
  
  const [weatherForecast, dayOfWeekBaselines, taggedDates, revenueTags] = await Promise.all([
    fetchWeatherForecast(startDate, endDate),
    fetchHistoricalDayOfWeekAverages(),
    fetchTaggedDates(startDate, endDate),
    fetchRevenueTags()
  ]);
  
  const weatherImpact = useAveragesOnly ? null : await analyzeWeatherImpact(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
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

    // Apply weather impacts if available
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

    // Apply revenue tag impacts
    const taggedDate = taggedDates.find(td => td.date === date);
    if (taggedDate) {
      const tag = revenueTags.find(t => t.id === taggedDate.tagId);
      if (tag) {
        // Use manual override if provided, otherwise use historical impact
        const foodImpact = taggedDate.manualFoodRevenueImpact ?? tag.historicalFoodRevenueImpact;
        const bevImpact = taggedDate.manualBeverageRevenueImpact ?? tag.historicalBeverageRevenueImpact;
        
        foodRevenue *= (1 + foodImpact / 100);
        bevRevenue *= (1 + bevImpact / 100);
        
        // Increase confidence if we have good historical data for this tag
        if (tag.occurrenceCount >= 3) {
          confidence = Math.min(confidence + 5, 95);
        }
      }
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

/**
 * Get revenue forecast for a specific date
 */
export const getRevenueForecastForDate = async (date: string): Promise<RevenueForecast | null> => {
  try {
    const { data, error } = await supabase
      .from('revenue_forecasts')
      .select('*')
      .eq('date', date)
      .single();
    
    if (error) {
      console.error('Error fetching forecast for date:', error);
      return null;
    }
    
    return data as RevenueForecast;
  } catch (error) {
    console.error('Exception when fetching forecast:', error);
    return null;
  }
};

/**
 * Get revenue forecasts for a date range
 */
export const getRevenueForecastsForRange = async (startDate: string, endDate: string): Promise<RevenueForecast[]> => {
  try {
    const { data, error } = await supabase
      .from('revenue_forecasts')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Error fetching forecasts for range:', error);
      return [];
    }
    
    return data as RevenueForecast[];
  } catch (error) {
    console.error('Exception when fetching forecasts for range:', error);
    return [];
  }
};
