
export interface RevenueTag {
  id: string;
  name: string;
  // Historical average impacts based on actual data
  historicalFoodRevenueImpact: number;
  historicalBeverageRevenueImpact: number;
  occurrenceCount: number;
  description?: string;
}

export interface TaggedDate {
  id: string;
  date: string;
  tagId: string;
  // Optional manual overrides
  manualFoodRevenueImpact?: number;
  manualBeverageRevenueImpact?: number;
}

export interface RevenueTagHistory {
  id: string;
  tagId: string;
  date: string;
  actualFoodRevenueImpact: number;
  actualBeverageRevenueImpact: number;
}
