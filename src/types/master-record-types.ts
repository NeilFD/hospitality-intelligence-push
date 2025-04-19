
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
  averageCoverSpend?: number;
  
  // Weather data
  weatherDescription?: string;
  temperature?: number;
  precipitation?: number;
  windSpeed?: number;
  
  // Team on duty
  dayFohTeam?: string;
  dayFohManager?: string;
  dayKitchenTeam?: string;
  dayKitchenManager?: string;
  eveningFohTeam?: string;
  eveningFohManager?: string;
  eveningKitchenTeam?: string;
  eveningKitchenManager?: string;
  
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

export interface WeatherForecast {
  date: string;
  description: string;
  temperature: number;
  precipitation: number;
  windSpeed: number;
}

export interface RevenueForecast {
  date: string;
  dayOfWeek: string;
  foodRevenue: number;
  beverageRevenue: number;
  totalRevenue: number;
  weatherDescription: string;
  temperature: number;
  precipitation: number;  // Add this property
  windSpeed: number;      // Add this property
  confidence: number;     // Percentage confidence in the forecast
}
