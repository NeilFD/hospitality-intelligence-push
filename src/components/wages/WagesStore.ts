
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { fetchWagesByMonth, fetchWagesByDay, upsertDailyWages, refreshFinancialPerformanceAnalysis } from '@/services/wages-service';

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
  isSaving: boolean;
  needsRefresh: boolean;
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
  clearCache: () => void;
  refreshAnalysis: () => Promise<boolean>;
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
      isSaving: false,
      needsRefresh: false,
      
      // SIMPLIFIED: Direct approach to save wages data
      setDailyWages: async (data: DailyWages) => {
        try {
          const key = `${data.year}-${data.month}-${data.day}`;
          console.log(`SAVING WAGES DATA FOR: ${key}`, data);
          
          set({ isSaving: true });
          
          // Save with our ultra-direct RPC call
          await upsertDailyWages(data);
          console.log(`SUCCESSFULLY SAVED WAGES DATA FOR: ${key}`);
          
          // Update local state with the exact data we just saved
          set((state) => ({
            wagesData: {
              ...state.wagesData,
              [key]: {...data}
            },
            isSaving: false
          }));
          
        } catch (error) {
          console.error('FAILED TO SAVE WAGES DATA:', error);
          set({ isSaving: false });
          throw error;
        }
      },
      
      getDailyWages: async (year: number, month: number, day: number) => {
        const key = `${year}-${month}-${day}`;
        
        try {
          console.log(`FETCHING DAILY WAGES FROM SERVER: ${key}`);
          // Always try to fetch fresh data from the server first
          const serverData = await fetchWagesByDay(year, month, day);
          
          if (serverData) {
            // Update the cache with fresh server data
            set((state) => ({
              wagesData: {
                ...state.wagesData,
                [key]: serverData
              }
            }));
            console.log(`GOT FRESH DATA FROM SERVER FOR: ${key}`, serverData);
            return serverData;
          }
          
          // If no server data, check cache
          const cachedData = get().wagesData[key];
          if (cachedData) {
            console.log(`USING CACHED DATA FOR: ${key}`, cachedData);
            return cachedData;
          }
          
          // If neither server nor cache has data, return empty data
          const emptyData = createEmptyDayData(year, month, day);
          console.log(`NO DATA FOUND, RETURNING EMPTY DATA FOR: ${key}`, emptyData);
          return emptyData;
        } catch (error) {
          console.error('FAILED TO FETCH DAILY WAGES:', error);
          
          // If error fetching from server, try to use cache
          const cachedData = get().wagesData[key];
          if (cachedData) {
            console.log(`USING CACHED DATA AFTER ERROR FOR: ${key}`, cachedData);
            return cachedData;
          }
          
          const emptyData = createEmptyDayData(year, month, day);
          console.log(`ERROR FETCHING DATA, RETURNING EMPTY DATA FOR: ${key}`, emptyData);
          return emptyData;
        }
      },
      
      getMonthlyWages: async (year: number, month: number) => {
        set({ isLoading: true });
        
        try {
          // Always fetch fresh data from the database to ensure consistency
          console.log(`FETCHING FRESH MONTHLY WAGES DATA FOR ${year}-${month}`);
          const supabaseData = await fetchWagesByMonth(year, month);
          console.log(`RECEIVED ${supabaseData.length} RECORDS FROM DATABASE`);
          
          // Create a map for easier lookup and update the local cache
          const dataMap: Record<number, DailyWages> = {};
          
          // Update cache with fresh data
          supabaseData.forEach(day => {
            const key = `${day.year}-${day.month}-${day.day}`;
            dataMap[day.day] = day;
            
            // Update the local cache with server data
            set(state => ({
              wagesData: {
                ...state.wagesData,
                [key]: day
              }
            }));
          });
          
          // Create the full month array
          const daysInMonth = new Date(year, month, 0).getDate();
          const result: DailyWages[] = [];
          
          for (let day = 1; day <= daysInMonth; day++) {
            if (dataMap[day]) {
              result.push(dataMap[day]);
            } else {
              const emptyDay = createEmptyDayData(year, month, day);
              result.push(emptyDay);
            }
          }
          
          console.log(`RETURNING COMPLETE MONTHLY DATA WITH ${result.length} DAYS`);
          set({ isLoading: false });
          return result;
        } catch (error) {
          console.error('FAILED TO FETCH MONTHLY WAGES:', error);
          set({ isLoading: false });
          
          // Fallback: Create empty data for the month
          const daysInMonth = new Date(year, month, 0).getDate();
          const result: DailyWages[] = [];
          
          for (let day = 1; day <= daysInMonth; day++) {
            const key = `${year}-${month}-${day}`;
            const cachedData = get().wagesData[key];
            
            if (cachedData) {
              result.push(cachedData);
            } else {
              result.push(createEmptyDayData(year, month, day));
            }
          }
          
          return result;
        }
      },
      
      getWeekdayTotals: async (year: number, month: number) => {
        // Force fetch fresh data from the server
        const monthlyData = await get().getMonthlyWages(year, month);
        
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
      },
      
      clearCache: () => {
        console.log('CLEARING WAGES DATA CACHE');
        set({ wagesData: {} });
      },

      refreshAnalysis: async () => {
        try {
          if (get().needsRefresh) {
            const success = await refreshFinancialPerformanceAnalysis();
            if (success) {
              set({ needsRefresh: false });
              console.log('Successfully refreshed financial performance analysis');
            }
            return success;
          }
          return true; // No refresh needed
        } catch (error) {
          console.error('Failed to refresh financial performance analysis:', error);
          return false;
        }
      }
    }),
    {
      name: 'wages-tracker-storage',
      // Store the entire wages data now to maintain a solid local cache
      partialize: (state) => ({ 
        isLoading: state.isLoading,
        needsRefresh: state.needsRefresh,
        wagesData: state.wagesData
      })
    }
  )
);
