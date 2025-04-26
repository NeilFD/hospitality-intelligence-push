
import { supabase } from '@/lib/supabase';
import { MasterDailyRecord } from '@/types/master-record-types';
import { generateWeekDates } from '@/lib/date-utils';

// Fetch master daily record by date
export const fetchMasterDailyRecord = async (date: string): Promise<MasterDailyRecord | null> => {
  const { data, error } = await supabase
    .from('master_daily_records')
    .select('*')
    .eq('date', date)
    .maybeSingle();
  
  if (error) {
    throw error;
  }
  
  return data ? mapDbRecordToMasterDailyRecord(data) : null;
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
  
  console.log(`Fetched ${data.length} records for week ${weekNumber} from ${startDate} to ${endDate}`);
  return data.map(mapDbRecordToMasterDailyRecord);
};

// New function to fetch master records with food and beverage revenue for the food/beverage trackers
export const fetchMasterDailyRecordsForWeek = async (
  year: number,
  month: number,
  weekNumber: number
): Promise<Array<{ date: string; foodRevenue: number; beverageRevenue: number }>> => {
  const weekDates = generateWeekDates(year, month);
  
  if (weekNumber > weekDates.length) {
    return [];
  }
  
  const { startDate, endDate } = weekDates[weekNumber - 1];
  
  const { data, error } = await supabase
    .from('master_daily_records')
    .select('date, food_revenue, beverage_revenue')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date');
  
  if (error) throw error;
  
  return data.map(record => ({
    date: record.date,
    foodRevenue: record.food_revenue || 0,
    beverageRevenue: record.beverage_revenue || 0
  }));
};

// New function to fetch master records with just food and beverage revenue for the wages table
export const fetchMasterRecordsByMonth = async (
  year: number,
  month: number
): Promise<Array<{ date: string; foodRevenue: number; beverageRevenue: number }>> => {
  const { data, error } = await supabase
    .from('master_daily_records')
    .select('date, food_revenue, beverage_revenue')
    .eq('year', year)
    .eq('month', month)
    .order('date');
  
  if (error) throw error;
  
  return data.map(record => ({
    date: record.date,
    foodRevenue: record.food_revenue || 0,
    beverageRevenue: record.beverage_revenue || 0
  }));
};

// New function to fetch total monthly revenue data from master records
export const fetchMonthlyRevenueData = async (
  year: number,
  month: number
): Promise<{ foodRevenue: number; beverageRevenue: number; totalRevenue: number }> => {
  const { data, error } = await supabase
    .from('master_daily_records')
    .select('food_revenue, beverage_revenue, total_revenue')
    .eq('year', year)
    .eq('month', month);
  
  if (error) throw error;
  
  // Calculate the totals
  const foodRevenue = data.reduce((sum, record) => sum + (record.food_revenue || 0), 0);
  const beverageRevenue = data.reduce((sum, record) => sum + (record.beverage_revenue || 0), 0);
  const totalRevenue = data.reduce((sum, record) => sum + (record.total_revenue || 0), 0);
  
  return { foodRevenue, beverageRevenue, totalRevenue };
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
  
  console.log(`Fetched ${data.length} records for month ${month}/${year}`);
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
    
    // Add the team fields
    day_foh_team: record.dayFohTeam,
    day_foh_manager: record.dayFohManager,
    day_kitchen_team: record.dayKitchenTeam,
    day_kitchen_manager: record.dayKitchenManager,
    evening_foh_team: record.eveningFohTeam,
    evening_foh_manager: record.eveningFohManager,
    evening_kitchen_team: record.eveningKitchenTeam,
    evening_kitchen_manager: record.eveningKitchenManager,
    
    local_events: record.localEvents,
    operations_notes: record.operationsNotes
  };
  
  console.log(`Upserting record for ${record.date} with week ${weekNumber}`);
  
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
    
    // Map the team fields
    dayFohTeam: data.day_foh_team,
    dayFohManager: data.day_foh_manager,
    dayKitchenTeam: data.day_kitchen_team,
    dayKitchenManager: data.day_kitchen_manager,
    eveningFohTeam: data.evening_foh_team,
    eveningFohManager: data.evening_foh_manager,
    eveningKitchenTeam: data.evening_kitchen_team,
    eveningKitchenManager: data.evening_kitchen_manager,
    
    localEvents: data.local_events,
    operationsNotes: data.operations_notes
  };
};
