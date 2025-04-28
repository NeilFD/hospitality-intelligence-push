
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchWagesByMonth, fetchWagesByDay, upsertDailyWages } from '@/services/wages-service';

export interface DailyWages {
  year: number;
  month: number;
  day: number;
  date: string;
  dayOfWeek: string;
  fohWages: number;
  kitchenWages: number;
  foodRevenue: number;
  bevRevenue: number;
}

interface WagesStore {
  wagesData: Record<string, DailyWages>;
  isLoading: boolean;
  setDailyWages: (data: DailyWages) => Promise<void>;
  getDailyWages: (year: number, month: number, day: number) => Promise<DailyWages>;
  getMonthlyWages: (year: number, month: number) => Promise<DailyWages[]>;
  getWeekdayTotals: (year: number, month: number) => Promise<Record<string, {
    fohWages: number;
    kitchenWages: number;
    foodRevenue: number;
    bevRevenue: number;
    totalWages: number;
    totalRevenue: number;
    wagesPercentage: number;
    count: number;
  }>>;
}

const createEmptyDayData = (year: number, month: number, day: number): DailyWages => {
  // Create date with UTC to avoid timezone issues
  const date = new Date(Date.UTC(year, month - 1, day));
  const jsDay = date.getDay(); // 0=Sunday, 1=Monday, etc.
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  // Convert to our format (0=Monday, ..., 6=Sunday)
  const adjustedDayIndex = jsDay === 0 ? 6 : jsDay - 1;
  
  return {
    year,
    month,
    day,
    date: date.toISOString().split('T')[0],
    dayOfWeek: dayNames[adjustedDayIndex],
    fohWages: 0,
    kitchenWages: 0,
    foodRevenue: 0,
    bevRevenue: 0
  };
};

export const useWagesStore = create<WagesStore>()(
  persist(
    (set, get) => ({
      wagesData: {},
      isLoading: false,
      
      setDailyWages: async (data: DailyWages) => {
        try {
          const key = `${data.year}-${data.month}-${data.day}`;
          console.log(`Saving wages data for ${key}`);
          
          // Update local state immediately for UI responsiveness
          set((state) => ({
            wagesData: {
              ...state.wagesData,
              [key]: {...data}
            }
          }));
          
          // Then persist to the database
          await upsertDailyWages(data);
          console.log(`Successfully saved wages data for ${key}`);
          
          // Refresh the data from the database to ensure UI is in sync
          try {
            const refreshedData = await fetchWagesByDay(data.year, data.month, data.day);
            if (refreshedData) {
              set((state) => ({
                wagesData: {
                  ...state.wagesData,
                  [key]: refreshedData
                }
              }));
              console.log(`Refreshed data from database for ${key}`);
            }
          } catch (refreshError) {
            console.warn('Failed to refresh data after save, using local data:', refreshError);
          }
          
        } catch (error) {
          console.error('Failed to save wages data', error);
          throw error;
        }
      },
      
      getDailyWages: async (year: number, month: number, day: number) => {
        const key = `${year}-${month}-${day}`;
        const cachedData = get().wagesData[key];
        
        if (cachedData) return cachedData;
        
        try {
          const data = await fetchWagesByDay(year, month, day);
          if (data) {
            set((state) => ({
              wagesData: {
                ...state.wagesData,
                [key]: data
              }
            }));
            return data;
          }
          
          return createEmptyDayData(year, month, day);
        } catch (error) {
          console.error('Failed to fetch daily wages', error);
          return createEmptyDayData(year, month, day);
        }
      },
      
      getMonthlyWages: async (year: number, month: number) => {
        set({ isLoading: true });
        
        try {
          const daysInMonth = new Date(year, month, 0).getDate();
          const result: DailyWages[] = [];
          
          // Always fetch fresh data from the database to ensure consistency
          console.log(`Fetching fresh wages data for ${year}-${month}`);
          const supabaseData = await fetchWagesByMonth(year, month);
          
          // Convert to a map for easier lookup
          const dataMap: Record<number, DailyWages> = {};
          supabaseData.forEach(day => {
            dataMap[day.day] = day;
            
            // Update the local cache
            const key = `${day.year}-${day.month}-${day.day}`;
            set(state => ({
              wagesData: {
                ...state.wagesData,
                [key]: day
              }
            }));
          });
          
          // Create the full month array, using Supabase data where available
          for (let day = 1; day <= daysInMonth; day++) {
            if (dataMap[day]) {
              result.push(dataMap[day]);
            } else {
              const emptyDay = createEmptyDayData(year, month, day);
              result.push(emptyDay);
            }
          }
          
          set({ isLoading: false });
          return result;
        } catch (error) {
          console.error('Failed to fetch monthly wages', error);
          set({ isLoading: false });
          
          // Fallback: Create empty data for the month
          const daysInMonth = new Date(year, month, 0).getDate();
          const result: DailyWages[] = [];
          
          for (let day = 1; day <= daysInMonth; day++) {
            const emptyDay = createEmptyDayData(year, month, day);
            result.push(emptyDay);
          }
          
          return result;
        }
      },
      
      getWeekdayTotals: async (year: number, month: number) => {
        // Force fetch fresh data from the server
        const monthlyData = await fetchWagesByMonth(year, month);
        
        const weekdayTotals: Record<string, {
          fohWages: number;
          kitchenWages: number;
          foodRevenue: number;
          bevRevenue: number;
          totalWages: number;
          totalRevenue: number;
          wagesPercentage: number;
          count: number;
        }> = {};
        
        // Initialize data structure with Monday first
        ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].forEach(day => {
          weekdayTotals[day] = {
            fohWages: 0,
            kitchenWages: 0,
            foodRevenue: 0,
            bevRevenue: 0,
            totalWages: 0,
            totalRevenue: 0,
            wagesPercentage: 0,
            count: 0
          };
        });
        
        // Accumulate data by day of week
        monthlyData.forEach(day => {
          const dayData = weekdayTotals[day.dayOfWeek];
          if (dayData) {
            dayData.fohWages += day.fohWages;
            dayData.kitchenWages += day.kitchenWages;
            dayData.foodRevenue += day.foodRevenue;
            dayData.bevRevenue += day.bevRevenue;
            dayData.totalWages += (day.fohWages + day.kitchenWages);
            dayData.totalRevenue += (day.foodRevenue + day.bevRevenue);
            dayData.count++;
          }
        });
        
        // Calculate percentages
        Object.keys(weekdayTotals).forEach(day => {
          const data = weekdayTotals[day];
          data.wagesPercentage = data.totalRevenue > 0 
            ? (data.totalWages / data.totalRevenue) * 100
            : 0;
        });
        
        return weekdayTotals;
      }
    }),
    {
      name: 'wages-tracker-storage'
    }
  )
);
