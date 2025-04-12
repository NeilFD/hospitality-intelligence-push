
import { Recipe, Ingredient } from "@/types/recipe-types";
import { v4 as uuidv4 } from 'uuid';

export const emptyIngredient = (): Ingredient => ({
  id: uuidv4(),
  name: '',
  amount: 0,
  unit: '',
  costPerUnit: 0,
  totalCost: 0
});

export const createEmptyRecipe = (moduleType: 'food' | 'beverage' | 'hospitality'): Recipe => {
  return {
    id: '',
    name: '',
    category: 'Uncategorized',
    allergens: [],
    isVegan: false,
    isVegetarian: false,
    isGlutenFree: false,
    recommendedUpsell: '',
    timeToTableMinutes: 0,
    miseEnPlace: '',
    method: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    imageUrl: '',
    ingredients: [emptyIngredient()],
    costing: {
      totalRecipeCost: 0,
      suggestedSellingPrice: 0,
      actualMenuPrice: 0,
      grossProfitPercentage: 0
    },
    moduleType: moduleType,
    archived: false,
    postedToNoticeboard: false
  };
};

export const calculateTotals = (ingredients: Ingredient[], actualMenuPrice: number) => {
  const totalRecipeCost = ingredients.reduce((total, ingredient) => {
    return total + (ingredient.totalCost || 0);
  }, 0);
  
  const suggestedSellingPrice = totalRecipeCost * 3; // 3x markup as a suggestion
  
  const grossProfitPercentage = 
    actualMenuPrice > 0 
      ? ((actualMenuPrice - totalRecipeCost) / actualMenuPrice) * 100 
      : 0;
  
  return {
    totalRecipeCost,
    suggestedSellingPrice,
    actualMenuPrice,
    grossProfitPercentage: Math.round(grossProfitPercentage * 100) / 100 // 2 decimal places
  };
};

export const normalizeDietaryInfo = (recipe: Recipe): Recipe => {
  // Convert any non-boolean dietary values to boolean
  return {
    ...recipe,
    isVegan: Boolean(recipe.isVegan),
    isVegetarian: Boolean(recipe.isVegetarian),
    isGlutenFree: Boolean(recipe.isGlutenFree)
  };
};
