
import { v4 as uuidv4 } from "uuid";
import { Recipe, Ingredient } from "@/types/recipe-types";

export const emptyIngredient = (): Ingredient => ({
  id: uuidv4(),
  name: "",
  amount: 0,
  unit: "g",
  costPerUnit: 0,
  totalCost: 0
});

export const createEmptyRecipe = (moduleType: 'food' | 'beverage'): Recipe => ({
  id: uuidv4(),
  name: "",
  category: "",
  allergens: [],
  isVegan: false,
  isVegetarian: false,
  isGlutenFree: false,
  recommendedUpsell: "",
  timeToTableMinutes: 0,
  miseEnPlace: "",
  createdAt: new Date(),
  updatedAt: new Date(),
  ingredients: [emptyIngredient()],
  method: "",
  costing: {
    totalRecipeCost: 0,
    suggestedSellingPrice: 0,
    actualMenuPrice: 0,
    grossProfitPercentage: 0
  },
  moduleType
});

export const calculateTotals = (ingredients: Ingredient[], actualMenuPrice: number) => {
  const totalRecipeCost = ingredients.reduce((sum, ingredient) => sum + ingredient.totalCost, 0);
  
  const suggestedSellingPrice = (totalRecipeCost / (1 - 0.7)) * 1.2;
  
  const priceExVat = actualMenuPrice / 1.2;
  
  const grossProfitPercentage = priceExVat > 0 ? ((priceExVat - totalRecipeCost) / priceExVat) : 0;
  
  return {
    totalRecipeCost,
    suggestedSellingPrice,
    actualMenuPrice: actualMenuPrice || suggestedSellingPrice,
    grossProfitPercentage
  };
};
