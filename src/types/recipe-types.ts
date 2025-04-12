export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
}

export type MenuCategory = {
  id: string;
  name: string;
  moduleType: 'food' | 'beverage' | 'hospitality';
};

export type RecipeFilterOptions = {
  searchTerm?: string;
  category?: string;
  allergen?: string;
  isVegan?: boolean;
  isVegetarian?: boolean;
  isGlutenFree?: boolean;
  letter?: string | null;
  status?: 'live' | 'archived';
};

// Add the hideCosting property to Recipe interface
export interface Recipe {
  id: string;
  name: string;
  category: string;
  allergens: string[];
  isVegan: boolean;
  isVegetarian: boolean;
  isGlutenFree: boolean;
  timeToTableMinutes: number;
  ingredients: Ingredient[];
  method?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  deleted?: boolean;
  costing: {
    totalRecipeCost: number;
    suggestedSellingPrice: number;
    actualMenuPrice: number;
    grossProfitPercentage: number;
  };
  archived?: boolean;
  moduleType: 'food' | 'beverage' | 'hospitality';
  postedToNoticeboard?: boolean;
  hideCosting?: boolean; // Add this property
}
