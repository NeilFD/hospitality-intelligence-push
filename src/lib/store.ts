
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

// Updated default modules to match the order in the image
const defaultModules: Module[] = [
  { id: '1', type: 'master', name: 'Daily Info', enabled: true, displayOrder: 1 },
  { id: '0', type: 'home', name: 'Home', enabled: true, displayOrder: 2 },
  { id: '2', type: 'pl', name: 'P&L Tracker', enabled: true, displayOrder: 3 },
  { id: '3', type: 'wages', name: 'Wages Tracker', enabled: true, displayOrder: 4 },
  { id: '4', type: 'food', name: 'Food Hub', enabled: true, displayOrder: 5 },
  { id: '5', type: 'beverage', name: 'Beverage Hub', enabled: true, displayOrder: 6 },
  { id: '6', type: 'performance', name: 'Performance and Analysis', enabled: true, displayOrder: 7 },
  { id: '7', type: 'team', name: 'Team Communication', enabled: true, displayOrder: 8 }
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
    gpTarget: 0.7, // 70%
    costTarget: 0.3, // 30%
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

// Add a rehydration handler to ensure all required modules are present
const handleRehydratedState = (state: AppState): AppState => {
  // Make a copy of the state to avoid mutations
  const newState = { ...state };
  
  // Ensure all default modules exist
  if (!newState.modules || newState.modules.length === 0) {
    console.log("No modules found, initializing with defaults");
    newState.modules = defaultModules;
  } else {
    // Check for each required module and add if missing
    const moduleTypes = newState.modules.map(m => m.type);
    
    defaultModules.forEach(defaultModule => {
      if (!moduleTypes.includes(defaultModule.type)) {
        console.log(`Adding missing module: ${defaultModule.name}`);
        newState.modules.push({ ...defaultModule });
      } else {
        // Update existing module names to match default module names
        const existingModule = newState.modules.find(m => m.type === defaultModule.type);
        if (existingModule) {
          existingModule.name = defaultModule.name;
        }
      }
    });
    
    // Ensure module IDs are unique
    newState.modules = newState.modules.map((module, index) => ({
      ...module,
      id: String(index + 1)
    }));
  }
  
  // Ensure we have an annual record
  if (!newState.annualRecord) {
    console.log("No annual record found, creating initial record");
    newState.annualRecord = {
      year: currentYear,
      months: [createInitialMonth(currentYear, currentMonth)]
    };
  }
  
  console.log("Store rehydrated with state:", newState);
  return newState;
};

export const useStore = create<AppState>()(
  persist(
    () => createInitialState(),
    {
      name: 'tavern-kitchen-ledger',
      onRehydrateStorage: () => (state) => {
        console.log("Rehydrating store...");
        if (state) {
          return handleRehydratedState(state);
        }
      }
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
