
import { supabase } from '@/lib/supabase';
import { MasterDailyRecord } from '@/types/master-record-types';
import { generateWeekDates } from '@/lib/date-utils';

// Fetch master daily record by date
export const fetchMasterDailyRecord = async (date: string): Promise<MasterDailyRecord | null> => {
  const { data, error } = await supabase
    .from('master_daily_records')
    .select('*')
    .eq('date', date)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }
  
  return mapDbRecordToMasterDailyRecord(data);
};

// Fetch master daily records for a week
export const fetchMasterWeeklyRecords = async (
  year: number, 
  month: number, 
  weekNumber: number
): Promise<MasterDailyRecord[]> => {
  const weekDates = generateWeekDates(year, month);
  
  if (weekNumber > weekDates.length) {
    return [];
  }
  
  const { startDate, endDate } = weekDates[weekNumber - 1];
  
  const { data, error } = await supabase
    .from('master_daily_records')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date');
  
  if (error) throw error;
  
  return data.map(mapDbRecordToMasterDailyRecord);
};

// Fetch master daily records for a month
export const fetchMasterMonthlyRecords = async (
  year: number,
  month: number
): Promise<MasterDailyRecord[]> => {
  const { data, error } = await supabase
    .from('master_daily_records')
    .select('*')
    .eq('year', year)
    .eq('month', month)
    .order('date');
  
  if (error) throw error;
  
  return data.map(mapDbRecordToMasterDailyRecord);
};

// Create or update a master daily record
export const upsertMasterDailyRecord = async (
  record: Partial<MasterDailyRecord> & { date: string }
): Promise<MasterDailyRecord> => {
  // Calculate the date components if not provided
  const date = new Date(record.date);
  const year = record.year || date.getFullYear();
  const month = record.month || date.getMonth() + 1;
  const dayOfWeek = record.dayOfWeek || date.toLocaleDateString('en-US', { weekday: 'long' });
  
  // Calculate week number if not provided
  let weekNumber = record.weekNumber;
  if (!weekNumber) {
    const weekDates = generateWeekDates(year, month);
    for (let i = 0; i < weekDates.length; i++) {
      const { startDate, endDate } = weekDates[i];
      if (record.date >= startDate && record.date <= endDate) {
        weekNumber = i + 1;
        break;
      }
    }
  }
  
  // Calculate total revenue and covers
  const foodRevenue = record.foodRevenue || 0;
  const beverageRevenue = record.beverageRevenue || 0;
  const totalRevenue = foodRevenue + beverageRevenue;
  
  const lunchCovers = record.lunchCovers || 0;
  const dinnerCovers = record.dinnerCovers || 0;
  const totalCovers = lunchCovers + dinnerCovers;
  
  // Calculate average cover spend
  const averageCoverSpend = totalCovers > 0 ? totalRevenue / totalCovers : 0;
  
  const dbRecord = {
    date: record.date,
    day_of_week: dayOfWeek,
    year,
    month,
    week_number: weekNumber as number,
    
    food_revenue: foodRevenue,
    beverage_revenue: beverageRevenue,
    total_revenue: totalRevenue,
    
    lunch_covers: lunchCovers,
    dinner_covers: dinnerCovers,
    total_covers: totalCovers,
    average_cover_spend: averageCoverSpend,
    
    weather_description: record.weatherDescription,
    temperature: record.temperature,
    precipitation: record.precipitation,
    wind_speed: record.windSpeed,
    
    local_events: record.localEvents,
    operations_notes: record.operationsNotes
  };
  
  const { data, error } = await supabase
    .from('master_daily_records')
    .upsert(dbRecord, {
      onConflict: 'date',
      ignoreDuplicates: false
    })
    .select()
    .single();
  
  if (error) throw error;
  
  return mapDbRecordToMasterDailyRecord(data);
};

// Map database record to TypeScript object
const mapDbRecordToMasterDailyRecord = (data: any): MasterDailyRecord => {
  return {
    id: data.id,
    date: data.date,
    dayOfWeek: data.day_of_week,
    year: data.year,
    month: data.month,
    weekNumber: data.week_number,
    
    foodRevenue: data.food_revenue,
    beverageRevenue: data.beverage_revenue,
    totalRevenue: data.total_revenue,
    
    lunchCovers: data.lunch_covers,
    dinnerCovers: data.dinner_covers,
    totalCovers: data.total_covers,
    averageCoverSpend: data.average_cover_spend,
    
    weatherDescription: data.weather_description,
    temperature: data.temperature,
    precipitation: data.precipitation,
    windSpeed: data.wind_speed,
    
    localEvents: data.local_events,
    operationsNotes: data.operations_notes
  };
};
