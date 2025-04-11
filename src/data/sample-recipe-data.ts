import { Recipe, MenuCategory, AllergenType } from '@/types/recipe-types';

export const allergenTypes: AllergenType[] = [
  { id: '1', name: 'Gluten' },
  { id: '2', name: 'Crustaceans' },
  { id: '3', name: 'Eggs' },
  { id: '4', name: 'Fish' },
  { id: '5', name: 'Peanuts' },
  { id: '6', name: 'Soybeans' },
  { id: '7', name: 'Milk' },
  { id: '8', name: 'Nuts' },
  { id: '9', name: 'Celery' },
  { id: '10', name: 'Mustard' },
  { id: '11', name: 'Sesame Seeds' },
  { id: '12', name: 'Sulfites' },
  { id: '13', name: 'Lupin' },
  { id: '14', name: 'Molluscs' }
];

export const menuCategories: MenuCategory[] = [
  { id: "1", name: "Oysters", moduleType: "food" },
  { id: "2", name: "Small Plates", moduleType: "food" },
  { id: "3", name: "Tacos", moduleType: "food" },
  { id: "4", name: "Large Plates", moduleType: "food" },
  { id: "5", name: "Grill", moduleType: "food" },
  { id: "6", name: "Salads", moduleType: "food" },
  { id: "7", name: "Sides", moduleType: "food" },
  { id: "8", name: "Puddings", moduleType: "food" },
  { id: "9", name: "In and Out", moduleType: "food" },
  { id: "10", name: "Cocktails", moduleType: "beverage" },
  { id: "11", name: "Beer", moduleType: "beverage" },
  { id: "12", name: "Wine", moduleType: "beverage" },
  { id: "13", name: "Spirits", moduleType: "beverage" },
  { id: "14", name: "Non-Alcoholic", moduleType: "beverage" },
];

// Empty sample recipe arrays
export const sampleFoodRecipes: Recipe[] = [];
export const sampleBeverageRecipes: Recipe[] = [];
