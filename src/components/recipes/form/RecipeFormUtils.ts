
import { Recipe, Ingredient } from "@/types/recipe-types";
import { v4 as uuidv4 } from 'uuid';

export const emptyIngredient = (): Ingredient => ({
  id: uuidv4(),
  name: '',
  amount: 0,
  unit: 'pcs',
  costPerUnit: 0,
  totalCost: 0
});

export const createEmptyRecipe = (moduleType: 'food' | 'beverage'): Recipe => {
  return {
    id: '',
    name: '',
    category: '',
    allergens: [],
    isVegan: false,
    isVegetarian: false,
    isGlutenFree: false,
    timeToTableMinutes: 10,
    ingredients: [emptyIngredient()],
    costing: {
      totalRecipeCost: 0,
      suggestedSellingPrice: 0,
      actualMenuPrice: 0,
      grossProfitPercentage: 0.7
    },
    createdAt: new Date(),
    updatedAt: new Date(),
    moduleType
  };
};

export const calculateTotals = (
  ingredients: Ingredient[], 
  actualMenuPrice: number = 0
): {
  totalRecipeCost: number;
  suggestedSellingPrice: number;
  actualMenuPrice: number;
  grossProfitPercentage: number;
} => {
  // Calculate total recipe cost from ingredients
  const totalRecipeCost = ingredients.reduce((sum, ingredient) => 
    sum + (Number(ingredient.totalCost) || 0), 0);
  
  // Calculate suggested selling price (using 70% gross profit as default)
  const suggestedSellingPrice = totalRecipeCost > 0 
    ? totalRecipeCost / 0.3  // Aim for 70% profit margin
    : 0;
  
  // Use actual menu price from input, or fallback to suggested price
  const finalMenuPrice = actualMenuPrice || suggestedSellingPrice;
  
  // Calculate gross profit percentage
  const grossProfitPercentage = finalMenuPrice > 0
    ? (finalMenuPrice - totalRecipeCost) / finalMenuPrice
    : 0.7; // Default to 70%
    
  return {
    totalRecipeCost,
    suggestedSellingPrice,
    actualMenuPrice: finalMenuPrice,
    grossProfitPercentage
  };
};

// Ensure dietary information is properly handled as booleans
export const normalizeDietaryInfo = (recipe: Recipe): Recipe => {
  return {
    ...recipe,
    isVegan: Boolean(recipe.isVegan),
    isVegetarian: Boolean(recipe.isVegetarian),
    isGlutenFree: Boolean(recipe.isGlutenFree)
  };
};
