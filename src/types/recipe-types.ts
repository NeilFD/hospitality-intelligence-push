
export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  costPerUnit: number;
  totalCost: number;
}

export interface RecipeMetadata {
  id: string;
  name: string;
  category: string;
  allergens: string[];
  isVegan: boolean;
  isVegetarian: boolean;
  isGlutenFree: boolean;
  recommendedUpsell: string;
  timeToTableMinutes: number;
  miseEnPlace: string;
  createdAt: Date;
  updatedAt: Date;
  imageUrl?: string;
}

export interface RecipeCosting {
  totalRecipeCost: number;
  suggestedSellingPrice: number; // 70% markup including VAT
  actualMenuPrice: number;
  grossProfitPercentage: number;
}

export interface Recipe extends RecipeMetadata {
  ingredients: Ingredient[];
  method: string;
  costing: RecipeCosting;
  moduleType: 'food' | 'beverage';
}

export type RecipeFilterOptions = {
  searchTerm: string;
  category: string;
  allergens: string[];
  isVegan: boolean | null;
  isVegetarian: boolean | null;
  isGlutenFree: boolean | null;
  letter: string | null;
};

export type MenuCategory = {
  id: string;
  name: string;
  moduleType: 'food' | 'beverage';
};

export type AllergenType = {
  id: string;
  name: string;
};
