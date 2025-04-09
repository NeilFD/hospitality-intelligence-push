import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  AppState, 
  MonthlyRecord, 
  WeeklyRecord, 
  Supplier,
  ModuleType,
  Module
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

// Default modules
const defaultModules: Module[] = [
  { id: '1', type: 'pl', name: 'P&L Tracker', enabled: true, displayOrder: 1 },
  { id: '2', type: 'wages', name: 'Wages Tracker', enabled: true, displayOrder: 2 },
  { id: '3', type: 'food', name: 'Food Tracker', enabled: true, displayOrder: 3 },
  { id: '4', type: 'beverage', name: 'Beverage Tracker', enabled: true, displayOrder: 4 },
  { id: '5', type: 'performance', name: 'Performance and Analysis', enabled: true, displayOrder: 5 },
  { id: '6', type: 'master', name: 'Master Records', enabled: true, displayOrder: 0 }
];

// Create initial month record with empty weeks
const createInitialMonth = (year: number, month: number, moduleType: ModuleType = 'food'): MonthlyRecord => {
  const weekDates = generateWeekDates(year, month);
  
  return {
    year,
    month,
    weeks: weekDates.map((dates, index) => 
      createEmptyWeek(dates.startDate, dates.endDate, index + 1, initialSuppliers)
    ),
    gpTarget: 0.7, // Changed from 0.68 to 0.7 (70%)
    costTarget: 0.3, // Changed from 0.32 to 0.3 (30%)
    staffFoodAllowance: 0,
    suppliers: [...initialSuppliers]
  };
};

// Create initial app state
const createInitialState = (): AppState => {
  return {
    currentYear,
    currentMonth,
    currentModule: 'food',
    modules: defaultModules,
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

// Create stable selector functions that won't cause re-renders
export const useCurrentModule = () => useStore(state => state.currentModule);
export const useModules = () => useStore(state => state.modules);

// Create setter function outside of component to prevent re-creation
const setCurrentModuleAction = (moduleType: ModuleType) => {
  useStore.setState({ currentModule: moduleType });
};

export const useSetCurrentModule = () => {
  // Return a stable reference to the action
  return setCurrentModuleAction;
};

export const useMonthRecord = (year: number, month: number, moduleType: ModuleType = 'food') => {
  return useStore(state => {
    const existingMonth = state.annualRecord.months.find(
      m => m.year === year && m.month === month
    );
    
    if (existingMonth) {
      return existingMonth;
    }
    
    // Create and return a new month record if it doesn't exist
    const newMonthRecord = createInitialMonth(year, month, moduleType);
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
