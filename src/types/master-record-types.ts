
export interface WeatherData {
  description: string;
  temperature: number;
  precipitation: number;
  windSpeed: number;
}

export interface MasterDailyRecord {
  id: string;
  date: string;
  dayOfWeek: string;
  year: number;
  month: number;
  weekNumber: number;
  
  // Revenue data
  foodRevenue: number;
  beverageRevenue: number;
  totalRevenue: number;
  
  // Cover counts
  lunchCovers: number;
  dinnerCovers: number;
  totalCovers: number;
  
  // Weather data
  weatherDescription?: string;
  temperature?: number;
  precipitation?: number;
  windSpeed?: number;
  
  // Contextual information
  localEvents?: string;
  operationsNotes?: string;
}

export interface MasterWeeklyRecord {
  weekNumber: number;
  startDate: string;
  endDate: string;
  days: MasterDailyRecord[];
}

export interface MasterMonthlyRecord {
  year: number;
  month: number;
  weeks: MasterWeeklyRecord[];
}
