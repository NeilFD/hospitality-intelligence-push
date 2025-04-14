
export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
}

export interface RecipeFilterOptions {
  searchTerm: string;
  category: string;
  allergens: string[];
  isVegan: boolean | null;
  isVegetarian: boolean | null;
  isGlutenFree: boolean | null;
  letter: string | null;
  status?: 'live' | 'archived';
}

export interface MenuCategory {
  id: string;
  name: string;
  moduleType: 'food' | 'beverage' | 'hospitality';
}

export interface AllergenType {
  id: string;
  name: string;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  allergens: string[];
  isVegan: boolean;
  isVegetarian: boolean;
  isGlutenFree: boolean;
  recommendedUpsell?: string;
  timeToTableMinutes: number;
  miseEnPlace?: string;
  method?: string;
  createdAt: Date;
  updatedAt: Date;
  imageUrl?: string;
  image_url?: string; // For hospitality guides from Supabase
  ingredients: Ingredient[];
  costing: {
    totalRecipeCost: number;
    suggestedSellingPrice: number;
    actualMenuPrice: number;
    grossProfitPercentage: number;
  };
  moduleType: 'food' | 'beverage' | 'hospitality';
  archived?: boolean;
  postedToNoticeboard?: boolean;
  // Accommodating DB naming differences
  module_type?: 'food' | 'beverage' | 'hospitality';
}
