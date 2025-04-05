
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  AppState, 
  MonthlyRecord, 
  WeeklyRecord, 
  Supplier 
} from '@/types/kitchen-ledger';
import { generateWeekDates, createEmptyWeek } from './date-utils';

const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const currentMonth = currentDate.getMonth() + 1;

// Initial suppliers
const initialSuppliers: Supplier[] = [
  { id: '1', name: 'Sysco Foods' },
  { id: '2', name: 'US Foods' },
  { id: '3', name: 'Performance Food Group' },
  { id: '4', name: 'Fresh Point Produce' },
  { id: '5', name: 'Local Farm Co-op' },
];

// Create initial month record with empty weeks
const createInitialMonth = (year: number, month: number): MonthlyRecord => {
  const weekDates = generateWeekDates(year, month);
  
  return {
    year,
    month,
    weeks: weekDates.map((dates, index) => 
      createEmptyWeek(dates.startDate, dates.endDate, index + 1, initialSuppliers)
    ),
    gpTarget: 0.68, // 68%
    costTarget: 0.32, // 32%
    staffFoodAllowance: 0,
    suppliers: [...initialSuppliers]
  };
};

// Create initial app state
const createInitialState = (): AppState => {
  return {
    currentYear,
    currentMonth,
    annualRecord: {
      year: currentYear,
      months: [createInitialMonth(currentYear, currentMonth)]
    }
  };
};

export const useStore = create<AppState>()(
  persist(
    () => createInitialState(),
    {
      name: 'tavern-kitchen-ledger',
    }
  )
);

export const useMonthRecord = (year: number, month: number) => {
  return useStore(state => {
    const existingMonth = state.annualRecord.months.find(
      m => m.year === year && m.month === month
    );
    
    if (existingMonth) {
      return existingMonth;
    }
    
    // Create and return a new month record if it doesn't exist
    const newMonthRecord = createInitialMonth(year, month);
    useStore.setState(state => ({
      ...state,
      annualRecord: {
        ...state.annualRecord,
        months: [...state.annualRecord.months, newMonthRecord]
      }
    }));
    
    return newMonthRecord;
  });
};

export const useWeekRecord = (year: number, month: number, weekNumber: number) => {
  return useStore(state => {
    const monthRecord = state.annualRecord.months.find(
      m => m.year === year && m.month === month
    );
    
    if (!monthRecord) {
      return null;
    }
    
    return monthRecord.weeks.find(w => w.weekNumber === weekNumber) || null;
  });
};
