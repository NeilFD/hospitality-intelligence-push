
/// <reference types="vite/client" />

import { Store } from "zustand";

interface ExtendedDailyRecord {
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  revenue?: number;
  purchases?: Record<string, number>; // supplierId -> amount
  creditNotes?: number[];
  staffFoodAllowance?: number;
}

interface BevStore {
  getState: () => {
    annualRecord: {
      months: Array<{
        year: number;
        month: number;
        weeks: Array<{
          days: Array<ExtendedDailyRecord>;
        }>;
      }>;
    };
  };
}

declare global {
  interface Window {
    bevStore?: BevStore;
  }
}
