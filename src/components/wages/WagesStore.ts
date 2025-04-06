
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  setDailyWages: (data: DailyWages) => void;
  getDailyWages: (year: number, month: number, day: number) => DailyWages | undefined;
  getMonthlyWages: (year: number, month: number) => DailyWages[];
  getWeekdayTotals: (year: number, month: number) => Record<string, {
    fohWages: number;
    kitchenWages: number;
    foodRevenue: number;
    bevRevenue: number;
    totalWages: number;
    totalRevenue: number;
    wagesPercentage: number;
    count: number;
  }>;
}

const createEmptyDayData = (year: number, month: number, day: number): DailyWages => {
  const date = new Date(year, month - 1, day);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  return {
    year,
    month,
    day,
    date: date.toISOString().split('T')[0],
    dayOfWeek: dayNames[date.getDay()],
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
      
      setDailyWages: (data: DailyWages) => {
        set((state) => {
          const key = `${data.year}-${data.month}-${data.day}`;
          return {
            wagesData: {
              ...state.wagesData,
              [key]: data
            }
          };
        });
      },
      
      getDailyWages: (year: number, month: number, day: number) => {
        const key = `${year}-${month}-${day}`;
        const data = get().wagesData[key];
        if (data) return data;
        
        // Return empty data for this day
        return createEmptyDayData(year, month, day);
      },
      
      getMonthlyWages: (year: number, month: number) => {
        const daysInMonth = new Date(year, month, 0).getDate();
        const result: DailyWages[] = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
          const data = get().getDailyWages(year, month, day);
          result.push(data || createEmptyDayData(year, month, day));
        }
        
        return result;
      },
      
      getWeekdayTotals: (year: number, month: number) => {
        const monthlyData = get().getMonthlyWages(year, month);
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
        
        // Initialize data structure
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
